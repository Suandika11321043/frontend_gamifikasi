"""Generate Balsamiq BMML wireframes (sketch, hitam putih, desktop) + compile .bmpr."""
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).parent
OUT = ROOT / "screens"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1280, 800


def enc(text: str) -> str:
    return quote(text, safe="")


class BmmlBuilder:
    def __init__(self, title: str, width: int = W, height: int = H):
        self.width = width
        self.height = height
        self.mockup_title = title
        self._id = 0
        self.controls: list[str] = []

    def _next_id(self) -> int:
        cid = self._id
        self._id += 1
        return cid

    def add(self, type_id, x, y, w=-1, h=-1, mw=100, mh=30, z=None, props=None, group_children=None):
        cid = self._next_id()
        z_order = self._id if z is None else z
        parts = [
            f'    <control controlID="{cid}" controlTypeID="{type_id}"',
            f' x="{x}" y="{y}" w="{w}" h="{h}"',
            f' measuredW="{mw}" measuredH="{mh}" zOrder="{z_order}"',
            f' locked="false" isInGroup="-1">',
        ]
        if props:
            parts.append("      <controlProperties>")
            for key, val in props.items():
                parts.append(f"        <{key}>{enc(str(val))}</{key}>")
            parts.append("      </controlProperties>")
        if group_children:
            parts.append("      <groupChildrenDescriptors>")
            parts.extend(group_children)
            parts.append("      </groupChildrenDescriptors>")
        parts.append("    </control>")
        self.controls.append("\n".join(parts))
        return cid

    def label(self, x, y, text, size="", bold=False, mw=120, mh=21):
        props = {"text": text}
        if size:
            props["size"] = size
        if bold:
            props["bold"] = "true"
        return self.add("com.balsamiq.mockups::Label", x, y, props=props, mw=mw, mh=mh)

    def title(self, x, y, text, mw=200, mh=40):
        return self.add("com.balsamiq.mockups::Title", x, y, props={"text": text, "size": "24"}, mw=mw, mh=mh)

    def subtitle(self, x, y, text, mw=180, mh=27):
        return self.add("com.balsamiq.mockups::SubTitle", x, y, props={"text": text}, mw=mw, mh=mh)

    def button(self, x, y, text, mw=80, mh=27, w=-1):
        return self.add("com.balsamiq.mockups::Button", x, y, w=w, props={"text": text}, mw=mw, mh=mh)

    def text_input(self, x, y, text="", w=300, mh=26, dark=False):
        if dark:
            self.canvas(x, y, w, 44, w, 44)
            return self.label(x + 14, y + 28, text, mw=max(len(text) * 8, 40))
        return self.add("com.balsamiq.mockups::TextInput", x, y, w=w, props={"text": text} if text else None, mw=max(w, 79), mh=mh)

    def search_box(self, x, y, text="Cari...", w=400, mh=30):
        return self.add("com.balsamiq.mockups::SearchBox", x, y, w=w, props={"text": text}, mw=max(w, 200), mh=mh)

    def canvas(self, x, y, w, h, mw=None, mh=None):
        return self.add("com.balsamiq.mockups::Canvas", x, y, w=w, h=h, mw=mw or w, mh=mh or h)

    def hrule(self, x, y, w=800):
        return self.add("com.balsamiq.mockups::HRule", x, y, w=w, mw=w, mh=10)

    def radio(self, x, y, text, mw=200, mh=22):
        return self.add("com.balsamiq.mockups::RadioButton", x, y, props={"text": text}, mw=mw, mh=mh)

    def progress(self, x, y, w=600, mh=20):
        return self.add("com.balsamiq.mockups::ProgressBar", x, y, w=w, mw=w, mh=mh)

    def note_bar(self, x, y, text, w=900, h=40):
        """Kotak info — kompatibel Balsamiq 4 (bukan Alert)."""
        self.canvas(x, y, w, h, w, h)
        self.label(x + 12, y + h // 2 + 4, text, mw=w - 24)

    def crumb(self, x, y, text, w=600):
        """Breadcrumb sebagai label — kompatibel Balsamiq 4."""
        self.label(x, y + 4, text, mw=w, size="11")

    def data_grid(self, x, y, text, w=900, h=280):
        return self.add("com.balsamiq.mockups::DataGrid", x, y, w=w, h=h, props={"text": text}, mw=w, mh=h)

    def browser(self, x, y, w, h, title="Gamifikasi"):
        return self.add(
            "com.balsamiq.mockups::BrowserWindow", x, y, w=w, h=h,
            props={"text": f"{title}\nhttp://localhost:5173"}, mw=450, mh=400,
        )

    def build(self) -> str:
        body = "\n".join(self.controls)
        return f"""<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<mockup version="1.0" skin="sketch" mockupW="{self.width}" mockupH="{self.height}" measuredW="{self.width}" measuredH="{self.height}">
  <controls>
{body}
  </controls>
</mockup>
"""


def save(name: str, content: str) -> Path:
    path = OUT / f"{name}.bmml"
    path.write_text(content, encoding="utf-8")
    return path


def quiz_header(b, ox, oy, topic, progress):
    b.button(ox, oy, "← Kembali", mw=100)
    b.canvas(ox + 200, oy + 4, 200, 28, 200, 28)
    b.label(ox + 220, oy + 22, topic, mw=160)
    b.label(W - 120, oy + 14, progress, mw=80, bold=True)


def admin_sidebar(b, active: str, height=H):
    b.canvas(0, 48, 240, height - 48, 240, height - 48)
    b.title(16, 64, "GAMIFIKASI", mw=180)
    items = [
        ("dashboard", "DASHBOARD"),
        ("pembelajaran", "MANAJEMEN PEMBELAJARAN  v"),
        ("soal", "  MANAJEMEN SOAL"),
        ("tema", "  MANAJEMEN TEMA"),
        ("profil", "PROFIL DAN KEMAJUAN  v"),
        ("siswa", "  DAFTAR SISWA"),
    ]
    my = 120
    for key, label in items:
        is_active = key == active
        if is_active:
            b.canvas(12, my - 4, 216, 32, 216, 32)
        b.label(20, my + 14, label, mw=200, bold=is_active)
        my += 36
    b.button(20, height - 68, "Keluar", mw=200)


# ── Screens ──────────────────────────────────────────────────────

def screen_sitemap():
    b = BmmlBuilder("Sitemap", W, H)
    b.browser(0, 0, W, H)
    b.title(40, 80, "Peta Navigasi — Gamifikasi PAUD", mw=500)
    nodes = [
        (200, 160, "/login", "Login"),
        (500, 160, "/dashboard", "Dashboard"),
        (200, 280, "/admin/tema", "Tema"),
        (440, 280, "/admin/soal", "Soal"),
        (680, 280, "/admin/siswa", "Siswa"),
        (440, 400, "/student", "Landing"),
        (200, 520, "/student/daftar-siswa", "Pilih Siswa"),
        (500, 520, "/student/topics", "Topik"),
        (800, 520, "/student/quiz", "Kuis"),
    ]
    for x, y, route, sub in nodes:
        b.canvas(x, y, 160, 48, 160, 48)
        b.label(x + 12, y + 20, route, mw=140, bold=True)
        b.label(x + 12, y + 40, sub, mw=100)
    return b.build()


def screen_login():
    b = BmmlBuilder("Login", W, H)
    b.browser(0, 0, W, H)
    cx, cy, cw, ch = W // 2 - 220, 120, 440, 520
    b.canvas(cx, cy, cw, ch, cw, ch)
    b.canvas(cx + cw // 2 - 40, cy + 32, 80, 80, 80, 80)
    b.label(cx + cw // 2, cy + 80, "LOGO", mw=40, bold=True)
    b.title(cx + cw // 2 - 100, cy + 130, "Halo, Sobat!", mw=200)
    b.label(cx + cw // 2 - 140, cy + 170, "Yuk masuk dan mulai belajar seru!", mw=280)
    b.label(cx + 48, cy + 220, "Username", mw=80, bold=True)
    b.canvas(cx + 48, cy + 240, cw - 96, 44, cw - 96, 44)
    b.label(cx + 64, cy + 268, "admin", mw=60)
    b.label(cx + 48, cy + 300, "Password", mw=80, bold=True)
    b.canvas(cx + 48, cy + 320, cw - 96, 44, cw - 96, 44)
    b.label(cx + 64, cy + 348, "........", mw=60)
    b.button(cx + cw // 2 - 80, cy + 400, "Ayo Masuk!", mw=160)
    return b.build()


def screen_dashboard():
    b = BmmlBuilder("Dashboard Admin", W, H)
    b.browser(0, 0, W, H)
    admin_sidebar(b, "dashboard")
    ox = 260
    b.subtitle(ox, 64, "Dashboard Admin", mw=240)
    b.button(W - 160, 56, "Admin", mw=80)
    gx = ox
    for val, label in [("4", "Total Siswa"), ("13", "Total Soal"), ("2", "Total Tema"), ("618", "Poin Tertinggi")]:
        b.canvas(gx, 110, 220, 88, 220, 88)
        b.title(gx + 20, 140, val, mw=60)
        b.label(gx + 20, 170, label, mw=120)
        gx += 240
    b.subtitle(ox, 220, "Peringkat Siswa — Total Poin", mw=300)
    grid = "No\tNama\tKelompok\tPoin\tBintang\n1\tILHAM\tTK A\t618\t9\n2\tANWAR\tTK B\t320\t5\n3\tRAHMAT\tTK A\t276\t4\n4\tJOKO\tTK B\t11\t0"
    b.data_grid(ox, 252, grid, w=W - 300, h=200)
    b.subtitle(ox, 470, "Peringkat — Poin per Tema", mw=280)
    b.canvas(ox, 502, (W - 320) // 2, 140, (W - 320) // 2, 140)
    b.label(ox + 16, 524, "KEWARGANEGARAAN", mw=140, bold=True)
    b.canvas(ox + (W - 300) // 2 + 20, 502, (W - 320) // 2, 140, (W - 320) // 2, 140)
    b.label(ox + (W - 300) // 2 + 36, 524, "KEAGAMAAN", mw=100, bold=True)
    b.label(ox + (W - 300) // 2 + 80, 580, "Belum ada skor.", mw=120)
    return b.build()


def screen_admin_tema():
    b = BmmlBuilder("Manajemen Tema", W, H)
    b.browser(0, 0, W, H)
    admin_sidebar(b, "tema")
    ox = 260
    b.subtitle(ox, 64, "Manajemen Tema", mw=240)
    b.button(W - 180, 56, "+ Tambah Tema", mw=150)
    b.search_box(ox, 110, "Cari nama atau deskripsi tema...", w=400)
    b.label(ox + 420, 116, "1 tema", mw=60)
    b.canvas(ox, 160, 260, 200, 260, 200)
    b.canvas(ox + 90, 180, 80, 80, 80, 80)
    b.label(ox + 122, 228, "K", mw=16, bold=True)
    b.label(ox + 70, 272, "kewarganegaraan", mw=120, bold=True)
    ax = ox + 20
    for lbl in ["Detail", "Edit", "Hapus"]:
        b.button(ax, 330, lbl, mw=70)
        ax += 78
    return b.build()


def screen_admin_soal():
    b = BmmlBuilder("Manajemen Soal", W, H)
    b.browser(0, 0, W, H)
    admin_sidebar(b, "soal")
    ox = 260
    b.subtitle(ox, 64, "Manajemen Soal", mw=240)
    b.search_box(ox, 110, "Cari tema...", w=360)
    b.canvas(ox, 160, 240, 160, 240, 160)
    b.canvas(ox + 80, 180, 80, 80, 80, 80)
    b.label(ox + 112, 228, "K", mw=16, bold=True)
    b.label(ox + 60, 272, "kewarganegaraan", mw=120)
    b.button(ox + 60, 300, "Kelola Soal", mw=120)
    return b.build()


def screen_admin_soal_tema():
    b = BmmlBuilder("Soal per Tema", W, H)
    b.browser(0, 0, W, H)
    admin_sidebar(b, "soal")
    ox = 260
    b.crumb(ox, 56, "Manajemen Soal / kewarganegaraan", w=400)
    b.subtitle(ox, 88, "Soal — kewarganegaraan", mw=280)
    b.label(ox + 300, 94, "4 soal", mw=50)
    b.button(W - 180, 80, "+ Tambah Soal", mw=150)
    b.search_box(ox, 130, "Cari instruksi soal...", w=320)
    fx = ox + 340
    for i, f in enumerate(["Semua", "Quiz", "Pasangkan", "Urutkan", "Drag & Drop"]):
        if i == 0:
            b.button(fx, 124, f, mw=70)
        else:
            b.canvas(fx, 124, 90, 30, 90, 30)
            b.label(fx + 8, 142, f, mw=74)
        fx += 96
    grid = "No\tTipe\tInstruksi\tMedia\tAksi\n1\tQuiz\tTest\t—\tOpsi Edit Hapus\n2\tPasangkan\tPasangkan\t—\tOpsi Edit Hapus\n3\tUrutkan\tUrutkan gambarnya\t—\tOpsi Edit Hapus\n4\tDrag & Drop\tDrag n Drop\t—\tOpsi Edit Hapus"
    b.data_grid(ox, 180, grid, w=W - 300, h=280)
    return b.build()


def screen_admin_soal_tema_advanced():
    b = BmmlBuilder("Soal per Tema (Aktif)", W, 900)
    b.browser(0, 0, W, 900)
    admin_sidebar(b, "soal", 900)
    ox = 260
    b.crumb(ox, 64, "Manajemen Soal > Kewarganegaraan > Kamis, 25 Juni 2026", w=700)
    b.subtitle(ox, 96, "Soal — Kamis, 25 Juni 2026", mw=320)
    b.label(ox + 340, 102, "5 soal", mw=50)
    b.button(ox + 400, 94, "Aktif untuk Siswa", mw=140)
    b.button(W - 240, 94, "Aktif — Kunci Editing", mw=180)
    b.canvas(ox, 136, 520, 40, 520, 40)
    b.label(ox + 16, 158, "1. Tema", mw=60)
    b.label(ox + 120, 158, "2. Pilih Tanggal", mw=120)
    b.canvas(ox + 280, 144, 140, 28, 140, 28)
    b.label(ox + 296, 162, "3. Kelola Soal", mw=110, bold=True)
    b.note_bar(ox, 192, "Soal sudah diaktifkan. Edit/hapus/tambah dinonaktifkan. Nonaktifkan dulu untuk ubah.", w=W - 300, h=48)
    b.search_box(ox, 264, "Cari instruksi soal...", w=360)
    fx = ox + 380
    for i, f in enumerate(["Semua", "Quiz", "Pasangkan", "Urutkan", "Drag & Drop", "Puzzle"]):
        if i == 0:
            b.button(fx, 258, f, mw=70)
        else:
            b.canvas(fx, 258, 80, 30, 80, 30)
            b.label(fx + 6, 276, f, mw=68)
        fx += 88
    grid = "No\tTipe\tInstruksi\tWaktu\tPoin\tAksi\n1\tQuiz\tKerjakan biblia\t5 mnt\t10\tLihat Edit Hapus\n2\tPuzzle\tKerjakan\t20 mnt\t100\tLihat Edit Hapus\n3\tUrutkan\turutkan\t2 mnt\t10\tLihat Edit Hapus\n4\tDrag & Drop\tDrag Soal nya\t20 mnt\t100\tLihat Edit Hapus\n5\tPasangkan\tPasangkan Ke Makanan\t20 mnt\t100\tLihat Edit Hapus"
    b.data_grid(ox, 310, grid, w=W - 300, h=360)
    return b.build()


def screen_admin_siswa():
    b = BmmlBuilder("Daftar Siswa Admin", W, H)
    b.browser(0, 0, W, H)
    admin_sidebar(b, "siswa")
    ox = 260
    b.subtitle(ox, 64, "Daftar Siswa", mw=200)
    b.button(W - 180, 56, "+ Tambah Siswa", mw=150)
    b.search_box(ox, 110, "Cari nama atau kelompok...", w=400)
    b.label(ox + 420, 116, "1 siswa", mw=60)
    grid = "No\tAvatar\tNama\tKelompok\tPoin\tRank\tAksi\n1\tT\tTesa\tTK A\t0\t—\tDetail Edit Hapus"
    b.data_grid(ox, 160, grid, w=W - 300, h=200)
    return b.build()


def screen_student_landing():
    b = BmmlBuilder("Landing Siswa", W, H)
    b.browser(0, 0, W, H)
    cx = W // 2
    b.title(cx - 160, 120, "Gamifikasi Belajar", mw=320)
    b.subtitle(cx - 140, 170, "Siap Belajar Hari Ini?", mw=280)
    b.button(cx - 60, 240, "MULAI", mw=120, mh=80)
    gx = cx - 240
    for lbl in ["Poin", "Badge", "Rank"]:
        b.canvas(gx, 380, 160, 80, 160, 80)
        b.label(gx + 60, 420, lbl, mw=40)
        gx += 180
    return b.build()


def screen_student_daftar_siswa():
    b = BmmlBuilder("Daftar Siswa", W, H)
    b.browser(0, 0, W, H)
    ox, oy = 40, 60
    b.button(ox, oy, "← Kembali", mw=100)
    b.title(ox + 120, oy - 4, "Daftar Siswa", mw=280)
    b.search_box(ox, oy + 56, "Cari nama atau kelompok...", w=W - 200)
    b.label(W - 130, oy + 62, "2 siswa", mw=80)
    cy = oy + 110
    for rank, letter, name, grp in [("1", "A", "Abdul", "TK A"), ("2", "T", "Tesa", "TK B")]:
        b.canvas(ox, cy, W - 80, 72, W - 80, 72)
        b.label(ox + 16, cy + 28, f"#{rank}", mw=30, bold=True)
        b.canvas(ox + 56, cy + 14, 44, 44, 44, 44)
        b.label(ox + 72, cy + 42, letter, mw=12, bold=True)
        b.label(ox + 72, cy + 58, grp, mw=40)
        b.subtitle(ox + 120, cy + 22, name, mw=120)
        b.canvas(W - 160, cy + 20, 72, 32, 72, 32)
        b.label(W - 144, cy + 38, "0 poin", mw=56)
        cy += 88
    return b.build()


def screen_student_topics():
    b = BmmlBuilder("Pilih Topik", W, H)
    b.browser(0, 0, W, H)
    ox, oy = 40, 60
    b.button(ox, oy, "← Kembali", mw=100)
    b.canvas(ox + 120, oy, 340, 52, 340, 52)
    b.canvas(ox + 132, oy + 10, 32, 32, 32, 32)
    b.label(ox + 144, oy + 30, "T", mw=8, bold=True)
    b.subtitle(ox + 176, oy + 12, "Tesa", mw=80)
    b.label(ox + 176, oy + 34, "TK A | 0 bintang | Skor 0 | Rank BEGINNER", mw=320)
    b.title(ox, oy + 80, "Pilih Topik", mw=240)
    b.label(ox, oy + 118, "Pilih topik yang ingin dikerjakan", mw=320)
    b.search_box(ox, oy + 150, "Cari topik...", w=W - 200)
    b.label(W - 130, oy + 156, "1 topik", mw=80)
    b.canvas(ox, oy + 200, W - 80, 64, W - 80, 64)
    b.canvas(ox + 16, oy + 212, 40, 40, 40, 40)
    b.label(ox + 32, oy + 238, "K", mw=10, bold=True)
    b.subtitle(ox + 72, oy + 224, "kewarganegaraan", mw=200)
    b.label(W - 80, oy + 232, ">", mw=12)
    return b.build()


def screen_student_quiz():
    b = BmmlBuilder("Kuis Quiz", W, H)
    b.browser(0, 0, W, H)
    ox, oy, cx = 40, 60, W // 2
    quiz_header(b, ox, oy, "kewarganegaraan", "Soal 1 / 4")
    b.title(cx - 140, oy + 52, "Kerjakan Soal", mw=280)
    b.hrule(ox, oy + 96, W - 80)
    card_x, card_y, card_w, card_h = ox, oy + 116, W - 80, 420
    b.canvas(card_x, card_y, card_w, card_h, card_w, card_h)
    b.label(card_x + 20, card_y + 24, "SOAL 1", mw=60, bold=True)
    b.canvas(card_x + card_w - 160, card_y + 16, 130, 28, 130, 28)
    b.label(card_x + card_w - 150, card_y + 34, "PILIHAN GANDA", mw=110)
    b.subtitle(cx - 40, card_y + 120, "Test", mw=80)
    for i, opt in enumerate(["Benar", "Salah", "Salah"]):
        oy_opt = card_y + 180 + i * 48
        b.canvas(card_x + 40, oy_opt, card_w - 80, 40, card_w - 80, 40)
        b.radio(card_x + 56, oy_opt + 10, opt, mw=120)
    b.button(card_x + card_w - 140, card_y + card_h - 52, "Lanjut →", mw=120)
    return b.build()


def screen_student_feedback():
    b = BmmlBuilder("Feedback Benar", W, H)
    b.browser(0, 0, W, H)
    ox, oy, cx = 40, 60, W // 2
    quiz_header(b, ox, oy, "kewarganegaraan", "Soal 1 / 4")
    b.progress(ox, oy + 48, W - 80, mh=16)
    card_w, card_h, card_x, card_y = 480, 260, cx - 240, oy + 100
    b.canvas(card_x, card_y, card_w, card_h, card_w, card_h)
    b.canvas(cx - 32, card_y + 40, 64, 64, 64, 64)
    b.label(cx - 8, card_y + 82, "v", mw=16, bold=True)
    b.title(cx - 120, card_y + 120, "Jawaban Benar!", mw=240)
    b.subtitle(cx - 60, card_y + 168, "+ 100 poin", mw=120)
    b.button(card_x + card_w - 180, card_y + card_h + 24, "Soal Berikutnya →", mw=160)
    return b.build()


def screen_student_match():
    b = BmmlBuilder("Kuis Pasangkan", W, H)
    b.browser(0, 0, W, H)
    ox, oy, cx = 40, 60, W // 2
    quiz_header(b, ox, oy, "kewarganegaraan", "Soal 2 / 4")
    b.title(cx - 140, oy + 52, "Kerjakan Soal", mw=280)
    b.progress(ox, oy + 96, W - 80, mh=16)
    card_x, card_y, card_w, card_h = ox, oy + 130, W - 80, 480
    b.canvas(card_x, card_y, card_w, card_h, card_w, card_h)
    b.label(card_x + 20, card_y + 20, "SOAL 2", mw=60, bold=True)
    b.canvas(card_x + card_w - 120, card_y + 12, 100, 28, 100, 28)
    b.label(card_x + card_w - 110, card_y + 30, "COCOKKAN", mw=80)
    b.subtitle(cx - 50, card_y + 70, "pasangkan", mw=100)
    b.note_bar(card_x + 40, card_y + 100, "1 Ketuk pertanyaan -> 2 Ketuk jawaban", w=card_w - 80, h=36)
    b.label(card_x + 60, card_y + 160, "PERTANYAAN", mw=100, bold=True)
    b.label(card_x + card_w // 2 + 40, card_y + 160, "JAWABAN", mw=80, bold=True)
    for i, (p, j) in enumerate([("1 Pisang", "Monyet"), ("2 Jagung", "Ayam")]):
        py = card_y + 190 + i * 80
        b.canvas(card_x + 40, py, 280, 36, 280, 36)
        b.label(card_x + 56, py + 22, p, mw=100)
        b.canvas(card_x + 60, py + 44, 260, 28, 260, 28)
        b.label(card_x + 72, py + 62, j, mw=80)
        b.canvas(card_x + card_w // 2 + 20, py, 280, 36, 280, 36)
        b.label(card_x + card_w // 2 + 36, py + 22, j, mw=80)
    b.button(card_x + card_w - 140, card_y + card_h - 52, "Lanjut →", mw=120)
    return b.build()


def screen_student_feedback_salah():
    b = BmmlBuilder("Feedback Salah", W, H)
    b.browser(0, 0, W, H)
    ox, oy, cx = 40, 60, W // 2
    quiz_header(b, ox, oy, "kewarganegaraan", "Soal 3 / 4")
    b.progress(ox, oy + 48, W - 80, mh=16)
    card_w, card_h, card_x, card_y = 480, 260, cx - 240, oy + 100
    b.canvas(card_x, card_y, card_w, card_h, card_w, card_h)
    b.canvas(cx - 32, card_y + 40, 64, 64, 64, 64)
    b.label(cx - 8, card_y + 82, "X", mw=16, bold=True)
    b.title(cx - 120, card_y + 120, "Jawaban Salah", mw=240)
    b.subtitle(cx - 160, card_y + 168, "Tetap semangat, terus berlatih!", mw=220)
    b.button(card_x + card_w - 180, card_y + card_h + 24, "Soal Berikutnya →", mw=160)
    return b.build()


def screen_student_dragdrop():
    b = BmmlBuilder("Drag & Drop", W, H)
    b.browser(0, 0, W, H)
    ox, oy, cx = 40, 60, W // 2
    quiz_header(b, ox, oy, "kewarganegaraan", "Soal 4 / 4")
    b.progress(ox, oy + 48, W - 80, mh=16)
    card_x, card_y, card_w, card_h = ox, oy + 80, W - 80, 520
    b.canvas(card_x, card_y, card_w, card_h, card_w, card_h)
    b.label(card_x + 20, card_y + 16, "SOAL 4", mw=60, bold=True)
    b.canvas(card_x + card_w - 140, card_y + 8, 120, 28, 120, 28)
    b.label(card_x + card_w - 130, card_y + 26, "SERET & LEPAS", mw=100)
    b.title(cx - 100, card_y + 50, "Drag and Drop", mw=200)
    b.note_bar(card_x + 40, card_y + 90, "Seret atau ketuk kartu, lalu taruh ke kotaknya", w=card_w - 80, h=36)
    b.canvas(card_x + 40, card_y + 140, card_w - 80, 100, card_w - 80, 100)
    b.label(card_x + 60, card_y + 170, "[X] strawberry    [X] pisang", mw=300)
    b.label(card_x + 80, card_y + 260, "[X] Keranjang Kuning", mw=160)
    b.label(card_x + card_w // 2 + 40, card_y + 260, "[X] Keranjang Merah", mw=160)
    b.canvas(card_x + 80, card_y + 290, 200, 80, 200, 80)
    b.label(card_x + 140, card_y + 330, "Taruh di sini", mw=80)
    b.canvas(card_x + card_w // 2 + 40, card_y + 290, 200, 80, 200, 80)
    b.label(card_x + card_w // 2 + 100, card_y + 330, "Taruh di sini", mw=80)
    b.button(card_x + card_w - 140, card_y + card_h - 52, "Lanjut →", mw=120)
    return b.build()


def screen_student_dragdrop_done():
    b = BmmlBuilder("Drag & Drop Selesai", W, H)
    b.browser(0, 0, W, H)
    ox, oy, cx = 40, 60, W // 2
    quiz_header(b, ox, oy, "kewarganegaraan", "Soal 4 / 4")
    b.progress(ox, oy + 48, W - 80, mh=16)
    card_x, card_y, card_w, card_h = ox, oy + 80, W - 80, 520
    b.canvas(card_x, card_y, card_w, card_h, card_w, card_h)
    b.label(card_x + 20, card_y + 16, "SOAL 4", mw=60, bold=True)
    b.title(cx - 100, card_y + 50, "Drag and Drop", mw=200)
    b.note_bar(card_x + 40, card_y + 90, "Semua kartu sudah ditempatkan!", w=card_w - 80, h=36)
    b.label(card_x + 100, card_y + 200, "[X] strawberry → Kuning", mw=200)
    b.label(card_x + card_w // 2 + 40, card_y + 200, "[X] pisang → Merah", mw=180)
    b.button(card_x + card_w - 140, card_y + card_h - 52, "Lanjut →", mw=120)
    return b.build()


def screen_student_result():
    b = BmmlBuilder("Hasil Kuis", W, H)
    b.browser(0, 0, W, H)
    cx = W // 2
    b.canvas(cx - 80, 80, 160, 160, 160, 160)
    b.title(cx - 50, 150, "50%", mw=100)
    b.label(cx - 40, 170, "SKOR", mw=80)
    b.label(cx - 60, 200, "* * o", mw=80)
    b.title(cx - 120, 230, "Terus Semangat!", mw=240)
    gx = cx - 320
    for val, lbl in [("2", "BENAR"), ("2", "SALAH"), ("+200", "TOTAL SKOR"), ("1", "BINTANG")]:
        b.canvas(gx, 290, 150, 72, 150, 72)
        b.title(gx + 50, 318, val, mw=50)
        b.label(gx + 40, 348, lbl, mw=70)
        gx += 170
    b.canvas(cx - 80, 390, 160, 28, 160, 28)
    b.label(cx - 60, 408, "Rank: Pemula", mw=120)
    b.subtitle(cx - 100, 440, "RINCIAN JAWABAN", mw=200)
    for i, (soal, ok, pts) in enumerate([("Soal 1", "v", "+100"), ("Soal 2", "v", "+100"), ("Soal 3", "X", "+0"), ("Soal 4", "X", "+0")]):
        b.canvas(cx - 300, 480 + i * 44, 600, 36, 600, 36)
        b.label(cx - 280, 502 + i * 44, f"{soal}  {ok}  {pts}", mw=200)
    b.button(cx - 200, 680, "Pilih Topik Lain", mw=140)
    b.button(cx + 40, 680, "Ulangi Kuis", mw=120)
    return b.build()


SCREENS = [
    ("01-sitemap", screen_sitemap),
    ("02-login", screen_login),
    ("03-dashboard", screen_dashboard),
    ("04-admin-tema", screen_admin_tema),
    ("05-admin-soal", screen_admin_soal),
    ("06-admin-soal-tema", screen_admin_soal_tema_advanced),
    ("07-admin-siswa", screen_admin_siswa),
    ("08-student-landing", screen_student_landing),
    ("09-student-daftar-siswa", screen_student_daftar_siswa),
    ("10-student-topics", screen_student_topics),
    ("11-student-quiz", screen_student_quiz),
    ("12-student-feedback", screen_student_feedback),
    ("13-student-match", screen_student_match),
    ("14-student-feedback-salah", screen_student_feedback_salah),
    ("15-student-dragdrop", screen_student_dragdrop),
    ("16-student-dragdrop-done", screen_student_dragdrop_done),
    ("17-student-result", screen_student_result),
]


def main():
    for name, fn in SCREENS:
        save(name, fn())
        print(f"  {name}.bmml")
    print(f"Generated {len(SCREENS)} BMML files in {OUT}")

    from build_bmpr import main as build_main
    build_main()


if __name__ == "__main__":
    main()
