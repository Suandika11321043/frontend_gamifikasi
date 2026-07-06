"""Compile BMML wireframes into a single Balsamiq .bmpr project (SQLite)."""
import json
import sqlite3
import time
import uuid
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).parent
SCREENS = ROOT / "screens"
OUTPUT = ROOT / "Gamifikasi-PAUD.bmpr"

# 1x1 PNG placeholder for thumbnails
THUMB_PNG = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)

# Kontrol yang membutuhkan children di Balsamiq 4 — diubah ke Label
UNSUPPORTED_TYPES = {"Breadcrumbs", "Alert"}

BALSAMIQ_INSTALL = Path(r"C:\Program Files\Balsamiq\Balsamiq Wireframes")
BALSAMIQ_OUTPUT_NAME = "Gamifikasi-PAUD.bmpr"


def _fix_dim(ctrl: dict, key: str, measured_key: str, default: str = "100") -> None:
    val = str(ctrl.get(key, "-1"))
    if val in ("-1", ""):
        ctrl[key] = str(ctrl.get(measured_key, default))


def _sanitize_control(ctrl: dict) -> dict:
    tid = ctrl.get("typeID", "")
    if tid in UNSUPPORTED_TYPES:
        text = (ctrl.get("properties") or {}).get("text", tid)
        ctrl["typeID"] = "Label"
        ctrl["properties"] = {"text": text}
        _fix_dim(ctrl, "w", "measuredW", "200")
        _fix_dim(ctrl, "h", "measuredH", "21")

    _fix_dim(ctrl, "w", "measuredW")
    _fix_dim(ctrl, "h", "measuredH")

    if "children" in ctrl and ctrl["children"]:
        children = ctrl["children"].get("controls", {}).get("control", [])
        ctrl["children"]["controls"]["control"] = [_sanitize_control(c) for c in children]
    elif "children" in ctrl:
        del ctrl["children"]

    return ctrl


def _sanitize_mockup(data: dict) -> dict:
    controls = data.get("mockup", {}).get("controls", {}).get("control", [])
    data["mockup"]["controls"]["control"] = [_sanitize_control(c) for c in controls]
    return data


def _props(el: ET.Element) -> dict | None:
    props_el = el.find("controlProperties")
    if props_el is None:
        return None
    props = {}
    for child in props_el:
        props[child.tag] = unquote(child.text or "")
    return props or None


def _parse_control(el: ET.Element) -> dict:
    type_full = el.get("controlTypeID", "")
    type_id = type_full.rsplit("::", 1)[-1]

    ctrl: dict = {
        "ID": el.get("controlID", "0"),
        "typeID": type_id,
        "x": el.get("x", "0"),
        "y": el.get("y", "0"),
        "w": el.get("w", "-1"),
        "h": el.get("h", "-1"),
        "measuredW": el.get("measuredW", "100"),
        "measuredH": el.get("measuredH", "30"),
        "zOrder": el.get("zOrder", "0"),
    }

    props = _props(el)
    if props:
        ctrl["properties"] = props

    children_el = el.find("groupChildrenDescriptors")
    if children_el is not None:
        nested = [_parse_control(ch) for ch in children_el.findall("control")]
        if nested:
            ctrl["children"] = {"controls": {"control": nested}}

    return ctrl


def bmml_to_data(bmml_text: str) -> dict:
    root = ET.fromstring(bmml_text)
    w = root.get("mockupW") or root.get("width", "1280")
    h = root.get("mockupH") or root.get("height", "800")

    controls_el = root.find("controls")
    controls = []
    if controls_el is not None:
        controls = [_parse_control(c) for c in controls_el.findall("control")]

    return {
        "mockup": {
            "controls": {"control": controls},
            "measuredW": str(w),
            "measuredH": str(h),
            "mockupW": str(w),
            "mockupH": str(h),
            "version": "1.0",
        }
    }


def build_bmpr(bmml_files: list[tuple[str, str]], output: Path) -> Path:
    """bmml_files: list of (display_name, file_path)."""
    now = int(time.time() * 1000)
    archive_uuid = str(uuid.uuid4()).upper()

    if output.exists():
        output.unlink()

    conn = sqlite3.connect(str(output))
    cur = conn.cursor()

    cur.execute("CREATE TABLE INFO (NAME TEXT PRIMARY KEY, VALUE TEXT)")
    cur.execute("CREATE TABLE RESOURCES (ID TEXT PRIMARY KEY, BRANCHID TEXT, ATTRIBUTES TEXT, DATA TEXT)")
    cur.execute("CREATE TABLE BRANCHES (ID TEXT PRIMARY KEY, ATTRIBUTES TEXT)")
    cur.execute("CREATE TABLE THUMBNAILS (ID TEXT PRIMARY KEY, ATTRIBUTES TEXT)")
    cur.execute("CREATE TABLE USERS (ID TEXT PRIMARY KEY, ATTRIBUTES TEXT)")
    cur.execute("CREATE TABLE COMMENTS (ID TEXT PRIMARY KEY, RESOURCEID TEXT, BRANCHID TEXT, USERID TEXT, ATTRIBUTES TEXT, DATA TEXT)")

    info_rows = [
        ("SchemaVersion", "2.0"),
        ("ArchiveRevision", "1"),
        ("ArchiveRevisionUUID", archive_uuid),
        ("ArchiveFormat", "bmpr"),
        ("ArchiveAttributes", json.dumps({"creationDate": now, "name": "Gamifikasi PAUD"})),
    ]
    cur.executemany("INSERT INTO INFO (NAME, VALUE) VALUES (?, ?)", info_rows)

    branch_attrs = json.dumps({
        "creationDate": now,
        "fontFace": "Balsamiq Sans",
        "fontSize": 16,
        "linkColor": 545684,
        "modifiedBy": [],
        "projectDescription": "Mockup wireframe Gamifikasi PAUD",
        "selectionColor": 9813234,
        "skinName": "sketch",
        "symbolLibraryID": "",
    })
    cur.execute("INSERT INTO BRANCHES (ID, ATTRIBUTES) VALUES (?, ?)", ("Master", branch_attrs))

    for idx, (name, path) in enumerate(bmml_files):
        resource_id = str(uuid.uuid4()).upper()
        thumb_id = str(uuid.uuid4()).upper()
        data = _sanitize_mockup(bmml_to_data(path.read_text(encoding="utf-8")))

        attributes = json.dumps({
            "creationDate": now,
            "importedFrom": path.name,
            "parentID": "",
            "kind": "mockup",
            "mimeType": "text/vnd.balsamiq.bmml",
            "modifiedBy": None,
            "modifiedDate": now,
            "name": name,
            "notes": "",
            "order": (idx + 1) * 1_000_000,
            "thumbnailID": thumb_id,
            "trashed": False,
        })

        cur.execute(
            "INSERT INTO RESOURCES (ID, BRANCHID, ATTRIBUTES, DATA) VALUES (?, ?, ?, ?)",
            (resource_id, "Master", attributes, json.dumps(data, ensure_ascii=False)),
        )

        thumb_attrs = json.dumps({
            "branchID": "Master",
            "image": THUMB_PNG,
            "resourceID": resource_id,
        })
        cur.execute("INSERT INTO THUMBNAILS (ID, ATTRIBUTES) VALUES (?, ?)", (thumb_id, thumb_attrs))

    conn.commit()
    conn.close()
    return output


# Display order for wireframes in Balsamiq project
SCREEN_ORDER = [
    ("01 - Sitemap", "01-sitemap.bmml"),
    ("02 - Login", "02-login.bmml"),
    ("03 - Dashboard Admin", "03-dashboard.bmml"),
    ("04 - Manajemen Tema", "04-admin-tema.bmml"),
    ("05 - Manajemen Soal", "05-admin-soal.bmml"),
    ("06 - Soal per Tema", "06-admin-soal-tema.bmml"),
    ("07 - Daftar Siswa Admin", "07-admin-siswa.bmml"),
    ("08 - Landing Siswa", "08-student-landing.bmml"),
    ("09 - Daftar Siswa", "09-student-daftar-siswa.bmml"),
    ("10 - Pilih Topik", "10-student-topics.bmml"),
    ("11 - Kuis Quiz", "11-student-quiz.bmml"),
    ("12 - Feedback Benar", "12-student-feedback.bmml"),
    ("13 - Kuis Pasangkan", "13-student-match.bmml"),
    ("14 - Feedback Salah", "14-student-feedback-salah.bmml"),
    ("15 - Drag and Drop", "15-student-dragdrop.bmml"),
    ("16 - Drag Drop Selesai", "16-student-dragdrop-done.bmml"),
    ("17 - Hasil Kuis", "17-student-result.bmml"),
]


def _copy_to_balsamiq_folder(source: Path) -> Path | None:
    dest_dir = BALSAMIQ_INSTALL
    if not dest_dir.exists():
        return None
    dest = dest_dir / BALSAMIQ_OUTPUT_NAME
    try:
        import shutil
        shutil.copy2(source, dest)
        return dest
    except OSError:
        return None


def main():
    files = []
    missing = []
    for name, fname in SCREEN_ORDER:
        path = SCREENS / fname
        if path.exists():
            files.append((name, path))
        else:
            missing.append(fname)

    if not files:
        raise SystemExit(f"No BMML files found in {SCREENS}")

    out = build_bmpr(files, OUTPUT)
    print(f"Created {out} with {len(files)} wireframes")
    copied = _copy_to_balsamiq_folder(out)
    if copied:
        print(f"Copied to {copied}")
    else:
        print(f"Note: could not copy to {BALSAMIQ_INSTALL} (run as Admin or open file manually)")
    if missing:
        print(f"Skipped (not found): {', '.join(missing)}")


if __name__ == "__main__":
    main()
