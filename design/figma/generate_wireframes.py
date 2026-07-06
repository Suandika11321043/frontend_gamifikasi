"""Generate SVG wireframes importable into Figma."""
from pathlib import Path

ROOT = Path(__file__).parent
OUT = ROOT / "screens"
OUT.mkdir(parents=True, exist_ok=True)

BG = "#FFFFFF"
FRAME_STROKE = "#1A1A1A"
BOX_FILL = "#F4F4F5"
BOX_STROKE = "#A1A1AA"
BOX_ACCENT = "#DBEAFE"
BOX_ACCENT_STROKE = "#3B82F6"
DASHED = "4,3"
TEXT = "#18181B"
TEXT_MUTED = "#71717A"
SIDEBAR_FILL = "#E4E4E7"


def esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def box(x, y, w, h, label, accent=False, dashed=False):
    fill = BOX_ACCENT if accent else BOX_FILL
    stroke = BOX_ACCENT_STROKE if accent else BOX_STROKE
    dash = f' stroke-dasharray="{DASHED}"' if dashed else ""
    rect = (
        f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" '
        f'fill="{fill}" stroke="{stroke}" stroke-width="1"{dash}/>'
    )
    text = (
        f'  <text x="{x + w / 2}" y="{y + h / 2 + 4}" text-anchor="middle" '
        f'font-family="Inter,Arial,sans-serif" font-size="11" fill="{TEXT_MUTED}">{esc(label)}</text>'
    )
    return rect + "\n" + text


def frame_start(w, h, title, route):
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <rect width="{w}" height="{h}" fill="{BG}"/>
  <rect x="0.5" y="0.5" width="{w-1}" height="{h-1}" fill="none" stroke="{FRAME_STROKE}" stroke-width="1"/>
  <text x="24" y="28" font-family="Inter,Arial,sans-serif" font-size="14" font-weight="600" fill="{TEXT}">{esc(title)}</text>
  <text x="24" y="46" font-family="Inter,Arial,sans-serif" font-size="11" fill="{TEXT_MUTED}">{esc(route)}</text>
'''


def frame_end():
    return "</svg>\n"


def sidebar(x, y, w, h):
    items = [
        ("Gamifikasi", True),
        ("Manajemen Pembelajaran", False),
        ("  Manajemen Soal", False),
        ("  Manajemen Tema", False),
        ("Profil dan Kemajuan", False),
        ("  Daftar Siswa", False),
        ("Keluar", False),
    ]
    parts = [
        f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{SIDEBAR_FILL}" stroke="{BOX_STROKE}" stroke-width="1"/>'
    ]
    iy = y + 16
    for label, accent in items:
        parts.append(box(x + 12, iy, w - 24, 28 if accent else 24, label, accent=accent, dashed=not accent))
        iy += 34 if accent else 30
    return "\n".join(parts)


def save(name: str, content: str) -> Path:
    path = OUT / f"{name}.svg"
    path.write_text(content, encoding="utf-8")
    return path


def admin_frame(fname, title, route, content_fn):
    w, h = 1100, 640
    s = frame_start(w, h, title, route)
    s += sidebar(24, 64, 200, h - 88) + "\n"
    s += content_fn(248, 64, w - 272, h - 88)
    s += frame_end()
    return save(fname, s)


def student_frame(fname, title, route, content_fn):
    w, h = 390, 720
    s = frame_start(w, h, title, route)
    s += content_fn(24, 64, w - 48, h - 88)
    s += frame_end()
    return save(fname, s)


def dashboard_content(x, y, cw, ch):
    s = box(x, y, 220, 32, "Dashboard Admin")
    s += "\n" + box(x + 240, y, 80, 28, "Admin", dashed=True)
    gx = x
    for label in ["Pengguna", "Poin", "Badge", "Tugas"]:
        s += "\n" + box(gx, y + 48, (cw - 24) / 4, 72, f"Stat: {label}")
        gx += (cw - 24) / 4 + 8
    s += "\n" + box(x, y + 140, cw, 200, "Aktivitas Terbaru — Tabel")
    return s


def tema_content(x, y, cw, ch):
    s = box(x, y, 200, 32, "Manajemen Tema")
    s += "\n" + box(x + cw - 130, y, 130, 36, "+ Tambah Tema", accent=True)
    s += "\n" + box(x, y + 48, 260, 36, "[ Cari tema... ]")
    gy = y + 100
    gw = (cw - 16) / 3
    for i, name in enumerate(["Tema 1", "Tema 2", "Tema 3"]):
        gx = x + i * (gw + 8)
        s += "\n" + box(gx, gy, gw, 88, f"Ikon {name}")
        s += "\n" + box(gx, gy + 96, gw, 22, name)
    return s


def soal_list_content(x, y, cw, ch):
    s = box(x, y, 200, 32, "Manajemen Soal")
    s += "\n" + box(x + cw - 100, y, 100, 48, "Total Tema", accent=True)
    s += "\n" + box(x, y + 56, 300, 36, "[ Cari tema... ]")
    gy = y + 108
    gw = (cw - 16) / 3
    for i, name in enumerate(["Kewarganegaraan", "Matematika", "Seni"]):
        gx = x + i * (gw + 8)
        s += "\n" + box(gx, gy, gw, 80, f"Ikon {name}")
        s += "\n" + box(gx, gy + 88, gw, 36, "Kelola Soal", accent=True)
    return s


def soal_tema_content(x, y, cw, ch):
    s = box(x, y, 90, 32, "Kembali", dashed=True)
    s += "\n" + box(x + 100, y, 180, 32, "Nama Tema", accent=True)
    s += "\n" + box(x + cw - 120, y, 120, 36, "+ Tambah Soal", accent=True)
    s += "\n" + box(x, y + 48, 220, 36, "[ Cari soal... ]")
    s += "\n" + box(x, y + 100, cw, 220, "Tabel Soal")
    return s


def siswa_admin_content(x, y, cw, ch):
    s = box(x, y, 160, 32, "Daftar Siswa")
    s += "\n" + box(x + cw - 130, y, 130, 36, "+ Tambah Siswa", accent=True)
    s += "\n" + box(x, y + 48, 260, 36, "[ Cari siswa... ]")
    s += "\n" + box(x, y + 100, cw, 240, "Tabel Siswa")
    return s


def landing_content(x, y, cw, ch):
    s = box(x + cw / 2 - 80, y, 160, 24, "Gamifikasi Belajar", dashed=True)
    s += "\n" + box(x, y + 40, cw, 36, "Siap Belajar Hari Ini?", accent=True)
    s += "\n" + box(x + cw / 2 - 40, y + 120, 80, 80, "MULAI", accent=True)
    gy = y + 240
    gw = (cw - 16) / 3
    for i, label in enumerate(["Poin", "Badge", "Rank"]):
        s += "\n" + box(x + i * (gw + 8), gy, gw, 64, label)
    return s


def siswa_student_content(x, y, cw, ch):
    s = box(x, y, 80, 28, "Kembali", dashed=True)
    s += "\n" + box(x + 90, y, 140, 28, "Daftar Siswa", accent=True)
    s += "\n" + box(x, y + 44, cw, 36, "[ Cari siswa... ]")
    gy = y + 96
    gw = (cw - 16) / 2
    for i, name in enumerate(["Budi", "Siti", "Andi", "Rina"]):
        col, row = i % 2, i // 2
        gx = x + col * (gw + 16)
        gyy = gy + row * 120
        s += "\n" + box(gx, gyy, gw, 56, f"Avatar {name}")
        s += "\n" + box(gx, gyy + 64, gw, 20, name)
    return s


def topics_content(x, y, cw, ch):
    s = box(x, y, 70, 28, "Kembali", dashed=True)
    s += "\n" + box(x + 78, y, 48, 48, "Avatar")
    s += "\n" + box(x + 136, y + 8, 120, 20, "Nama Siswa", accent=True)
    s += "\n" + box(x, y + 64, 120, 24, "Pilih Topik")
    s += "\n" + box(x, y + 96, cw, 36, "[ Cari topik... ]")
    for i, name in enumerate(["Kewarganegaraan", "Matematika"]):
        gy = y + 148 + i * 88
        s += "\n" + box(x, gy, 56, 56, "Ikon")
        s += "\n" + box(x + 64, gy, cw - 64, 24, name)
    return s


def quiz_content(x, y, cw, ch):
    s = box(x, y, 70, 28, "Kembali", dashed=True)
    s += "\n" + box(x + 78, y, 120, 28, "Topik", accent=True)
    s += "\n" + box(x, y + 40, cw, 6, "Progress bar")
    s += "\n" + box(x, y + 56, cw, 36, "Instruksi soal")
    s += "\n" + box(x, y + 100, cw, 80, "Gambar / Audio", dashed=True)
    gw = (cw - 8) / 2
    for i, opt in enumerate(["A", "B", "C", "D"]):
        col, row = i % 2, i // 2
        s += "\n" + box(x + col * (gw + 8), y + 192 + row * 56, gw, 48, f"Opsi {opt}")
    s += "\n" + box(x + cw - 140, y + 320, 140, 40, "Kirim Jawaban", accent=True)
    return s


def feedback_content(x, y, cw, ch):
    s = box(x, y, 70, 28, "Kembali", dashed=True)
    s += "\n" + box(x + cw / 2 - 32, y + 80, 64, 64, "Benar/Salah", accent=True)
    s += "\n" + box(x + 40, y + 160, cw - 80, 28, "Jawaban Benar!")
    s += "\n" + box(x + 60, y + 260, cw - 120, 44, "Soal Berikutnya", accent=True)
    return s


def result_content(x, y, cw, ch):
    s = box(x + cw / 2 - 50, y, 100, 100, "Skor %", accent=True)
    s += "\n" + box(x + 60, y + 120, cw - 120, 28, "Luar Biasa!")
    gy = y + 164
    gw = (cw - 24) / 4
    for i, label in enumerate(["Benar", "Salah", "Skor", "Bintang"]):
        s += "\n" + box(x + i * (gw + 8), gy, gw, 48, label)
    s += "\n" + box(x, y + 232, cw, 80, "Rincian jawaban")
    s += "\n" + box(x, y + 328, (cw - 8) / 2, 40, "Topik Lain", dashed=True)
    s += "\n" + box(x + (cw - 8) / 2 + 8, y + 328, (cw - 8) / 2, 40, "Ulangi Kuis", accent=True)
    return s


def gen_sitemap():
    w, h = 900, 520
    s = frame_start(w, h, "Peta Navigasi", "gamifikasiFE")
    nodes = [
        (380, 70, "/login", "Login"),
        (380, 130, "/dashboard", "Dashboard"),
        (100, 220, "/admin/tema", "Tema"),
        (280, 220, "/admin/soal", "Soal"),
        (460, 220, "/admin/soal/:id", "Soal/Tema"),
        (660, 220, "/admin/siswa", "Siswa"),
        (380, 310, "/student", "Landing"),
        (160, 400, "/student/daftar-siswa", "Pilih Siswa"),
        (400, 400, "/student/.../topics", "Topik"),
        (400, 470, "/student/.../quiz", "Kuis"),
    ]
    for x, y, route, sub in nodes:
        s += box(x, y, 140, 44, route, accent=True)
        s += f'  <text x="{x + 70}" y="{y + 58}" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="10" fill="{TEXT_MUTED}">{esc(sub)}</text>\n'
    s += frame_end()
    return save("01-sitemap", s)


def gen_combined(paths: list[Path]):
    cols = 4
    pad = 48
    col_w = 1100
    col_heights = [pad + 32] * cols
    positions = []

    for i, p in enumerate(paths):
        inner = p.read_text(encoding="utf-8")
        sw = int(inner.split('width="')[1].split('"')[0])
        sh = int(inner.split('height="')[1].split('"')[0])
        col = i % cols
        x = pad + col * (col_w + pad)
        y = col_heights[col]
        positions.append((p.stem, x, y, sw, sh, inner))
        col_heights[col] += sh + pad + 24

    total_w = pad + cols * (col_w + pad)
    total_h = max(col_heights) + pad
    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{total_w}" height="{total_h}" viewBox="0 0 {total_w} {total_h}">',
        f'  <rect width="{total_w}" height="{total_h}" fill="#FAFAFA"/>',
        f'  <text x="{pad}" y="28" font-family="Inter,Arial,sans-serif" font-size="18" font-weight="600" fill="{TEXT}">Gamifikasi PAUD — Wireframes</text>',
    ]
    for label, x, y, sw, sh, inner in positions:
        start = inner.find(">", inner.find("<svg")) + 1
        end = inner.rfind("</svg>")
        body = inner[start:end]
        parts.append(f'  <g id="{label}">')
        parts.append(f'    <text x="{x}" y="{y - 8}" font-family="Inter,Arial,sans-serif" font-size="12" fill="{TEXT_MUTED}">{esc(label)}</text>')
        parts.append(f'    <svg x="{x}" y="{y}" width="{sw}" height="{sh}" viewBox="0 0 {sw} {sh}">')
        parts.append(body)
        parts.append("    </svg>")
        parts.append("  </g>")
    parts.append("</svg>")
    combined = ROOT / "00-all-screens.svg"
    combined.write_text("\n".join(parts), encoding="utf-8")
    return combined


def main():
    paths = []
    paths.append(gen_sitemap())
    paths.append(student_frame("02-login", "Login Admin", "/login", lambda x, y, cw, ch: (
        box(x + 20, y, cw - 40, 56, "Mascot", accent=True) + "\n" +
        box(x + 20, y + 70, cw - 40, 40, "Username") + "\n" +
        box(x + 20, y + 120, cw - 40, 40, "Password") + "\n" +
        box(x + 20, y + 180, cw - 40, 44, "Masuk", accent=True)
    )))
    paths.append(admin_frame("03-dashboard", "Dashboard Admin", "/dashboard", dashboard_content))
    paths.append(admin_frame("04-admin-tema", "Manajemen Tema", "/admin/tema", tema_content))
    paths.append(admin_frame("05-admin-soal", "Manajemen Soal", "/admin/soal", soal_list_content))
    paths.append(admin_frame("06-admin-soal-tema", "Soal per Tema", "/admin/soal/:topicId", soal_tema_content))
    paths.append(admin_frame("07-admin-siswa", "Daftar Siswa", "/admin/siswa", siswa_admin_content))
    paths.append(student_frame("08-student-landing", "Landing Siswa", "/student", landing_content))
    paths.append(student_frame("09-student-daftar-siswa", "Pilih Siswa", "/student/daftar-siswa", siswa_student_content))
    paths.append(student_frame("10-student-topics", "Pilih Topik", "/student/siswa/:id/topics", topics_content))
    paths.append(student_frame("11-student-quiz", "Kuis — Soal", "/student/.../quiz", quiz_content))
    paths.append(student_frame("12-student-feedback", "Kuis — Feedback", "/student/.../quiz", feedback_content))
    paths.append(student_frame("13-student-result", "Kuis — Hasil", "/student/.../quiz", result_content))
    combined = gen_combined(paths)
    print(f"Generated {len(paths)} screens + {combined.name}")


if __name__ == "__main__":
    main()
