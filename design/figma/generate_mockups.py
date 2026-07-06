"""Generate high-fidelity SVG mockups importable into Figma."""
from pathlib import Path

ROOT = Path(__file__).parent
OUT = ROOT / "screens"
OUT_DESKTOP = OUT / "desktop"
OUT.mkdir(parents=True, exist_ok=True)
OUT_DESKTOP.mkdir(parents=True, exist_ok=True)

# ── Ukuran layar ─────────────────────────────────────────────────
DESKTOP_W, DESKTOP_H = 1280, 800
STUDENT_CW = 760
QUIZ_CW = 720

# ── Palette (hitam putih) ────────────────────────────────────────
BLACK = "#000000"
DARK = "#1a1a1a"
DARK_MID = "#333333"
MID = "#6b7280"
LIGHT = "#d4d4d4"
BG_LIGHT = "#f5f5f5"
BG_MAIN = "#ebebeb"
WHITE = "#FFFFFF"
TEXT_DARK = "#1a1a1a"
TEXT_MUTED = "#6b7280"
TEXT_LIGHT = "#9ca3af"
BORDER = "#a3a3a3"
# alias untuk kompatibilitas fungsi lama
NAVY = DARK
NAVY_ACTIVE = BLACK
NAVY_LIGHT = DARK_MID
PINK = TEXT_DARK
PINK_BTN = BLACK
PINK_LIGHT = BORDER
GREEN = TEXT_DARK
GREEN_BG = BG_LIGHT
BLUE = TEXT_DARK
BLUE_BG = BG_LIGHT
RED = TEXT_DARK
RED_BG = BG_LIGHT
ORANGE = TEXT_DARK
ORANGE_BG = BG_LIGHT
PURPLE = TEXT_DARK
PURPLE_BG = BG_LIGHT
MINT = BORDER
MINT_DARK = TEXT_DARK
FONT = "Segoe UI, Inter, Arial, sans-serif"


def esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def svg_open(w: int, h: int, defs: str = "") -> str:
    return (
        f'<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">\n'
        f"{defs}"
    )


def svg_close() -> str:
    return "</svg>\n"


def txt(x, y, content, size=14, weight=400, fill=TEXT_DARK, anchor="start", family=FONT):
    w = f' font-weight="{weight}"' if weight != 400 else ""
    return (
        f'  <text x="{x}" y="{y}" font-family="{family}" font-size="{size}"{w} '
        f'fill="{fill}" text-anchor="{anchor}">{esc(content)}</text>\n'
    )


def rect(x, y, w, h, fill=WHITE, rx=0, stroke=None, sw=1):
    s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    return f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"{s}/>\n'


def circle(cx, cy, r, fill, stroke=None):
    s = f' stroke="{stroke}"' if stroke else ""
    return f'  <circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"{s}/>\n'


def pill(x, y, w, h, label, color, bg, rx=12):
    s = rect(x, y, w, h, bg, rx, BORDER, 1)
    s += txt(x + w / 2, y + h / 2 + 4, label, 11, 600, color, "middle")
    return s


def btn_primary(x, y, w, h, label):
    s = rect(x, y, w, h, BLACK, 8)
    s += txt(x + w / 2, y + h / 2 + 5, label, 13, 600, WHITE, "middle")
    return s


def btn_action(x, y, label, color, bg):
    tw = len(label) * 7 + 24
    return pill(x, y, tw, 28, label, TEXT_DARK, WHITE, 14)


def input_field(x, y, w, h, placeholder, dark=False):
    if dark:
        s = rect(x, y, w, h, DARK_MID, 8, BLACK, 1)
        s += txt(x + 14, y + h / 2 + 5, placeholder, 13, 400, WHITE)
    else:
        s = rect(x, y, w, h, WHITE, 8, BORDER, 1.5)
        s += txt(x + 14, y + h / 2 + 5, placeholder, 13, 400, TEXT_MUTED)
    return s


def sidebar(x, y, w, h, active=""):
    s = rect(x, y, w, h, DARK, 0)
    s += txt(x + 16, y + 36, "Gamifikasi", 18, 700, WHITE)
    s += f'  <line x1="{x + 12}" y1="{y + 52}" x2="{x + w - 12}" y2="{y + 52}" stroke="{MID}" stroke-width="1"/>\n'

    items = [
        ("dashboard", "Dashboard", None),
        ("pembelajaran", "Manajemen Pembelajaran", "group"),
        ("soal", "  Manajemen Soal", "sub"),
        ("tema", "  Manajemen Tema", "sub"),
        ("profil", "Profil dan Kemajuan Siswa", "group"),
        ("siswa", "  Daftar Siswa", "sub"),
    ]
    iy = y + 68
    for key, label, kind in items:
        is_active = key == active or (active in ("soal", "tema") and key == "pembelajaran") or (
            active == "siswa" and key == "profil"
        )
        sub_active = key == active
        if kind == "sub":
            bg = DARK_MID if sub_active else "none"
            color = WHITE if sub_active else TEXT_LIGHT
            if bg != "none":
                s += rect(x + 20, iy - 14, w - 32, 30, bg, 6)
            s += txt(x + 28, iy + 4, label.strip(), 12, 500 if not sub_active else 600, color)
            iy += 32
        else:
            bg = BLACK if is_active and kind == "group" else "none"
            if bg != "none":
                s += rect(x + 8, iy - 16, w - 16, 34, bg, 8)
            s += txt(x + 16, iy + 2, label, 13, 500, TEXT_LIGHT if not is_active else WHITE)
            s += txt(x + w - 24, iy + 2, "▾", 12, 400, TEXT_LIGHT, "middle")
            iy += 38

    # Logout
    ly = y + h - 48
    s += rect(x + 12, ly, w - 24, 36, "transparent", 8, WHITE, 1.5)
    s += txt(x + w / 2, ly + 22, "Keluar", 13, 600, WHITE, "middle")
    return s


def admin_shell(w, h, active, content_fn):
    s = svg_open(w, h)
    s += rect(0, 0, w, h, BG_MAIN)
    s += sidebar(0, 0, 240, h, active)
    s += content_fn(240, 0, w - 240, h)
    s += svg_close()
    return s


def table_header(x, y, w, cols):
    s = rect(x, y, w, 44, BLACK, 10)
    s += rect(x, y + 34, w, 10, BLACK, 0)
    cx = x + 16
    for label, cw in cols:
        s += txt(cx + 4, y + 28, label, 12, 600, WHITE)
        cx += cw
    return s


def avatar(cx, cy, letter, r=18):
    s = circle(cx, cy, r, BLACK)
    s += txt(cx, cy + 5, letter, 14, 700, WHITE, "middle")
    return s


# ── Screens ──────────────────────────────────────────────────────

def screen_login():
    w, h = 390, 720
    s = svg_open(w, h)
    s += rect(0, 0, w, h, BG_LIGHT)
    # decorations (monochrome shapes)
    s += txt(40, 80, "★", 28, 400, MID)
    s += txt(310, 60, "○", 22, 400, MID)
    s += txt(330, 100, "★", 18, 400, MID)
    s += txt(30, 620, "●", 32, 400, MID)
    s += txt(300, 640, "☁", 36, 400, MID)
    # card
    cx, cy, cw, ch = 24, 120, w - 48, 480
    s += rect(cx, cy, cw, ch, WHITE, 32, BLACK, 2)
    s += f'  <rect x="{cx}" y="{cy + ch - 8}" width="{cw}" height="8" rx="4" fill="{MID}"/>\n'
    s += rect(cx + cw / 2 - 32, cy + 24, 64, 64, BG_LIGHT, 32, BORDER, 1)
    s += txt(cx + cw / 2, cy + 68, "LOGO", 10, 600, MID, "middle")
    s += txt(w / 2, cy + 100, "Halo, Sobat!", 26, 900, TEXT_DARK, "middle")
    s += txt(w / 2, cy + 128, "Yuk masuk dan mulai belajar seru!", 12, 500, MID, "middle")
    # form
    fx = cx + 32
    fw = cw - 64
    s += txt(fx, cy + 168, "Username", 13, 700, TEXT_DARK)
    s += input_field(fx, cy + 176, fw, 44, "admin", dark=True)
    s += txt(fx, cy + 240, "Password", 13, 700, TEXT_DARK)
    s += input_field(fx, cy + 248, fw, 44, "••••••••", dark=True)
    # button
    by = cy + 320
    s += rect(fx, by, fw, 50, BLACK, 18)
    s += f'  <rect x="{fx}" y="{by + 46}" width="{fw}" height="6" rx="3" fill="{DARK_MID}"/>\n'
    s += txt(w / 2, by + 30, "Ayo Masuk!", 15, 800, WHITE, "middle")
    s += svg_close()
    return s


def dashboard_content(x, y, cw, ch):
    s = txt(x + 32, y + 48, "Dashboard Admin", 24, 700)
    s += rect(x + cw - 120, y + 24, 80, 32, BLACK, 16)
    s += txt(x + cw - 80, y + 44, "Admin", 11, 600, WHITE, "middle")

    stats = [("[]", "4", "Total Siswa"), ("?", "13", "Total Soal"), ("[]", "2", "Total Tema"), ("*", "618", "Total Poin Tertinggi")]
    gx = x + 32
    for icon, val, label in stats:
        s += rect(gx, y + 72, (cw - 80) / 4, 88, WHITE, 12, BORDER, 1)
        s += txt(gx + 20, y + 108, icon, 24)
        s += txt(gx + 56, y + 100, val, 22, 700)
        s += txt(gx + 56, y + 122, label, 11, 400, TEXT_MUTED)
        gx += (cw - 80) / 4 + 12

    # Main leaderboard
    ty = y + 180
    s += txt(x + 32, ty, "Peringkat Siswa — Total Poin", 16, 600)
    tw = cw - 64
    s += table_header(x + 32, ty + 16, tw, [("No", 40), ("Avatar", 60), ("Nama Siswa", 140), ("Kelompok", 80), ("Total Poin", 90), ("Bintang", 80)])
    rows = [("1", "I", "ILHAM", "TK A", "618", "9"), ("2", "A", "ANWAR", "TK B", "320", "5"), ("3", "R", "RAHMAT", "TK A", "276", "4"), ("4", "J", "JOKO", "TK B", "11", "0")]
    ry = ty + 68
    for i, (no, av, name, grp, pts, stars) in enumerate(rows):
        bg = WHITE if i % 2 == 0 else BG_LIGHT
        s += rect(x + 32, ry, tw, 44, bg, 0)
        s += txt(x + 48, ry + 28, no, 13, 600)
        s += avatar(x + 108, ry + 22, av)
        s += txt(x + 140, ry + 28, name, 13, 600)
        s += txt(x + 280, ry + 28, grp, 13)
        s += pill(x + 360, ry + 10, 56, 24, pts, TEXT_DARK, BG_LIGHT, 12)
        s += txt(x + 450, ry + 28, stars, 12)
        ry += 44

    # Per tema section
    ty2 = ry + 24
    s += txt(x + 32, ty2, "Peringkat Siswa — Poin per Tema", 16, 600)
    s += rect(x + cw - 200, ty2 - 8, 160, 32, WHITE, 8, BORDER, 1)
    s += txt(x + cw - 120, ty2 + 12, "Pilih Tema ▾", 11, 500, TEXT_MUTED, "middle")

    cw2 = (tw - 16) / 2
    # Kewarganegaraan card
    s += rect(x + 32, ty2 + 24, cw2, 140, WHITE, 12, BORDER, 1)
    s += txt(x + 48, ty2 + 48, "KEWARGANEGARAAN", 12, 700)
    for j, (name, pts) in enumerate([("ILHAM", 618), ("ANWAR", 120), ("RAHMAT", 80), ("JOKO", 0)]):
        s += txt(x + 48, ty2 + 68 + j * 18, f"{j + 1}. {name}", 11)
        s += txt(x + 32 + cw2 - 48, ty2 + 68 + j * 18, str(pts), 11, 600, TEXT_DARK, "end")

    # Keagamaan empty
    s += rect(x + 32 + cw2 + 16, ty2 + 24, cw2, 140, WHITE, 12, BORDER, 1)
    s += txt(x + 48 + cw2 + 16, ty2 + 48, "KEAGAMAAN", 12, 700)
    s += rect(x + 32 + cw2 + 16 + cw2 / 2 - 20, ty2 + 88, 40, 40, BG_LIGHT, 4, BORDER, 1)
    s += txt(x + 32 + cw2 + 16 + cw2 / 2, ty2 + 130, "Belum ada skor.", 11, 400, TEXT_MUTED, "middle")
    return s


def screen_dashboard():
    return admin_shell(1100, 720, "dashboard", dashboard_content)


def tema_content(x, y, cw, ch):
    s = txt(x + 32, y + 48, "Manajemen Tema", 24, 700)
    s += btn_primary(x + cw - 160, y + 28, 140, 40, "+ Tambah Tema")
    s += input_field(x + 32, y + 80, 320, 38, "Cari nama atau deskripsi tema...")
    s += txt(x + 370, y + 106, "1 tema", 13, 500, TEXT_MUTED)
    # card
    s += rect(x + 32, y + 140, 260, 200, WHITE, 14, BORDER, 1)
    s += rect(x + 122, y + 160, 80, 80, BLACK, 12)
    s += txt(x + 162, y + 212, "K", 32, 700, WHITE, "middle")
    s += txt(x + 162, y + 260, "kewarganegaraan", 14, 700, TEXT_DARK, "middle")
    ax = x + 52
    for label, color, bg in [("Detail", TEXT_DARK, BG_LIGHT), ("Edit", TEXT_DARK, BG_LIGHT), ("Hapus", TEXT_DARK, BG_LIGHT)]:
        s += btn_action(ax, y + 300, label, color, bg)
        ax += 72
    return s


def screen_tema():
    return admin_shell(1100, 640, "tema", tema_content)


def siswa_admin_content(x, y, cw, ch):
    s = txt(x + 32, y + 48, "Daftar Siswa", 24, 700)
    s += btn_primary(x + cw - 160, y + 28, 140, 40, "+ Tambah Siswa")
    s += input_field(x + 32, y + 80, 320, 38, "Cari nama atau kelompok...")
    s += txt(x + 370, y + 106, "1 siswa", 13, 500, TEXT_MUTED)
    tw = cw - 64
    s += table_header(x + 32, y + 140, tw, [("No", 40), ("Avatar", 60), ("Nama", 120), ("Kelompok", 100), ("Total Poin", 90), ("Rank", 80), ("Aksi", 120)])
    s += rect(x + 32, y + 184, tw, 48, WHITE, 0)
    s += txt(x + 48, y + 214, "1", 13)
    s += avatar(x + 108, y + 208, "T")
    s += txt(x + 140, y + 214, "Tesa", 13, 600)
    s += txt(x + 260, y + 214, "TK A", 13)
    s += pill(x + 360, y + 196, 36, 24, "0", TEXT_DARK, BG_LIGHT, 12)
    s += pill(x + 440, y + 196, 36, 24, "—", TEXT_DARK, BG_LIGHT, 12)
    ax = x + 520
    for label, color, bg in [("Detail", TEXT_DARK, BG_LIGHT), ("Edit", TEXT_DARK, BG_LIGHT), ("Hapus", TEXT_DARK, BG_LIGHT)]:
        s += btn_action(ax, y + 194, label, color, bg)
        ax += 68
    return s


def screen_siswa_admin():
    return admin_shell(1100, 640, "siswa", siswa_admin_content)


def soal_tema_content(x, y, cw, ch):
    s = ""
    s += txt(x + 32, y + 36, "← Manajemen Soal / kewarganegaraan", 12, 400, TEXT_MUTED)
    s += txt(x + 32, y + 68, "Soal — kewarganegaraan", 22, 700)
    s += txt(x + 310, y + 68, "4 soal", 13, 400, TEXT_MUTED)
    s += btn_primary(x + cw - 150, y + 52, 130, 36, "+ Tambah Soal")
    s += input_field(x + 32, y + 100, 260, 36, "Cari instruksi soal...")
    filters = [("Semua", True), ("Quiz", False), ("Pasangkan", False), ("Urutkan", False), ("Drag & Drop", False)]
    fx = x + 310
    for label, active in filters:
        fw = len(label) * 8 + 24
        if active:
            s += rect(fx, y + 100, fw, 36, BLACK, 18)
            s += txt(fx + fw / 2, y + 124, label, 11, 600, WHITE, "middle")
        else:
            s += rect(fx, y + 100, fw, 36, WHITE, 18, BORDER, 1)
            s += txt(fx + fw / 2, y + 124, label, 11, 500, TEXT_DARK, "middle")
        fx += fw + 8
    tw = cw - 64
    s += table_header(x + 32, y + 156, tw, [("No", 40), ("Tipe", 100), ("Instruksi", 280), ("Media", 100), ("Aksi", 140)])
    rows = [
        ("1", "Quiz", TEXT_DARK, BG_LIGHT, "Test"),
        ("2", "Pasangkan", TEXT_DARK, BG_LIGHT, "Pasangkan"),
        ("3", "Urutkan", TEXT_DARK, BG_LIGHT, "Urutkan gambarnya"),
        ("4", "Drag & Drop", TEXT_DARK, BG_LIGHT, "Drag n Drop"),
    ]
    ry = y + 200
    for no, tipe, color, bg, instr in rows:
        s += rect(x + 32, ry, tw, 44, WHITE, 0)
        s += txt(x + 48, ry + 28, no, 13)
        s += pill(x + 88, ry + 10, len(tipe) * 8 + 16, 24, tipe, color, bg, 12)
        s += txt(x + 180, ry + 28, instr, 13)
        s += txt(x + 460, ry + 28, "—", 13, 400, TEXT_MUTED)
        ax = x + 540
        for label, c, b in [("Opsi", TEXT_DARK, BG_LIGHT), ("Edit", TEXT_DARK, BG_LIGHT), ("Hapus", TEXT_DARK, BG_LIGHT)]:
            s += btn_action(ax, ry + 8, label, c, b)
            ax += 62
        ry += 44
    return s


def screen_soal_tema():
    return admin_shell(1100, 640, "soal", soal_tema_content)


def student_bg(w, h):
    return svg_open(w, h) + rect(0, 0, w, h, BG_LIGHT)


def quiz_back_btn(y=20):
  return rect(16, y, 80, 32, WHITE, 10, BORDER, 1.5) + txt(56, y + 20, "← Kembali", 11, 600, TEXT_DARK, "middle")


def quiz_topic_badge(y=20):
    return rect(110, y, 150, 28, BG_LIGHT, 14, BORDER, 1) + txt(185, y + 18, "kewarganegaraan", 10, 600, TEXT_DARK, "middle")


def quiz_header(w, question_num, total, y_title=72, show_progress=False, progress_pct=0):
    s = quiz_back_btn()
    s += quiz_topic_badge()
    s += txt(w - 24, 38, f"Soal {question_num} / {total}", 11, 600, TEXT_DARK, "end")
    s += txt(w / 2, y_title, "Kerjakan Soal", 22, 800, TEXT_DARK, "middle")
    if show_progress:
        s += progress_bar(16, y_title + 16, w - 32, progress_pct)
    else:
        s += f'  <line x1="16" y1="{y_title + 16}" x2="{w - 16}" y2="{y_title + 16}" stroke="{BORDER}" stroke-width="2"/>\n'
    return s


def progress_bar(x, y, w, pct):
    s = rect(x, y, w, 8, BG_LIGHT, 4)
    fill_w = max(4, int(w * pct))
    s += rect(x, y, fill_w, 8, BLACK, 4)
    return s


def medal_icon(cx, cy, rank):
    fill = BLACK if rank == 1 else WHITE
    stroke = BLACK
    s = f'  <circle cx="{cx}" cy="{cy}" r="14" fill="{fill}" stroke="{stroke}" stroke-width="2"/>\n'
    s += txt(cx, cy + 5, str(rank), 12, 700, WHITE if rank == 1 else TEXT_DARK, "middle")
    return s


def school_icon(x, y):
    s = rect(x, y, 20, 14, WHITE, 2, BLACK, 1.5)
    s += f'  <polygon points="{x + 10},{y - 6} {x + 22},{y + 2} {x - 2},{y + 2}" fill="{BLACK}"/>\n'
    s += rect(x + 6, y + 4, 8, 10, WHITE, 0, BLACK, 1)
    return s


def books_icon(x, y):
    s = rect(x, y + 6, 12, 14, WHITE, 2, BLACK, 1.5)
    s += rect(x + 6, y + 2, 12, 14, BG_LIGHT, 2, BLACK, 1.5)
    s += rect(x + 12, y, 12, 14, WHITE, 2, BLACK, 1.5)
    return s


def trophy_badge(x, y, points="0"):
    s = rect(x, y, 52, 26, BG_LIGHT, 13, BORDER, 1)
    s += txt(x + 14, y + 17, "★", 10, 400, TEXT_DARK)
    s += txt(x + 34, y + 17, points, 10, 600, TEXT_DARK, "middle")
    return s


def check_circle(cx, cy, r=28):
    s = f'  <circle cx="{cx}" cy="{cy}" r="{r}" fill="{BG_LIGHT}" stroke="{BLACK}" stroke-width="2"/>\n'
    s += f'  <polyline points="{cx - 10},{cy + 2} {cx - 2},{cy + 10} {cx + 12},{cy - 8}" fill="none" stroke="{BLACK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>\n'
    return s


def x_circle(cx, cy, r=28):
    s = f'  <circle cx="{cx}" cy="{cy}" r="{r}" fill="{BG_LIGHT}" stroke="{BLACK}" stroke-width="2"/>\n'
    s += f'  <line x1="{cx - 10}" y1="{cy - 10}" x2="{cx + 10}" y2="{cy + 10}" stroke="{BLACK}" stroke-width="3" stroke-linecap="round"/>\n'
    s += f'  <line x1="{cx + 10}" y1="{cy - 10}" x2="{cx - 10}" y2="{cy + 10}" stroke="{BLACK}" stroke-width="3" stroke-linecap="round"/>\n'
    return s


def screen_student_siswa():
    w, h = 390, 720
    s = student_bg(w, h)
    s += rect(16, 20, 90, 34, WHITE, 10, BORDER, 1.5)
    s += txt(61, 42, "← Kembali", 12, 600, TEXT_DARK, "middle")
    s += school_icon(118, 24)
    s += txt(146, 42, "Daftar Siswa", 18, 700, TEXT_DARK)
    s += input_field(16, 68, w - 100, 40, "Cari nama atau kelompok...")
    s += txt(w - 70, 94, "2 siswa", 12, 500, TEXT_MUTED)
    students = [(1, "A", "Abdul", "TK A"), (2, "T", "Tesa", "TK B")]
    cy = 130
    for rank, letter, name, grp in students:
        s += rect(16, cy, w - 32, 80, WHITE, 16, BORDER, 1.5)
        s += medal_icon(44, cy + 40, rank)
        s += avatar(88, cy + 36, letter, 20)
        s += txt(120, cy + 32, name, 16, 700, TEXT_DARK)
        s += txt(120, cy + 52, grp, 11, 400, TEXT_MUTED)
        s += trophy_badge(w - 80, cy + 18)
        s += txt(w - 36, cy + 68, "⋯", 16, 400, TEXT_MUTED, "middle")
        cy += 96
    s += svg_close()
    return s


def screen_student_topics():
    w, h = 390, 720
    s = student_bg(w, h)
    s += rect(16, 20, 80, 34, WHITE, 10, BORDER, 1.5)
    s += txt(56, 42, "← Kembali", 11, 600, TEXT_DARK, "middle")
    s += rect(104, 20, w - 120, 48, WHITE, 12, BORDER, 1.5)
    s += circle(128, 44, 16, BLACK)
    s += txt(128, 49, "T", 12, 700, WHITE, "middle")
    s += txt(152, 38, "Tesa", 13, 700, TEXT_DARK)
    s += txt(152, 54, "TK A • ★ 0 • Skor 0 • Rank BEGINNER", 9, 400, TEXT_MUTED)
    s += books_icon(16, 78)
    s += txt(44, 92, "Pilih Topik", 20, 700, TEXT_DARK)
    s += txt(16, 112, "Pilih topik yang ingin dikerjakan", 11, 400, TEXT_MUTED)
    s += rect(16, 128, w - 90, 40, WHITE, 10, BORDER, 1.5)
    s += txt(28, 154, "Cari topik...", 12, 400, TEXT_MUTED)
    s += txt(w - 60, 154, "1 topik", 11, 500, TEXT_DARK)
    s += rect(16, 184, w - 32, 64, WHITE, 14, BORDER, 1.5)
    s += rect(28, 196, 48, 48, BLACK, 10)
    s += txt(52, 228, "K", 22, 700, WHITE, "middle")
    s += txt(88, 224, "kewarganegaraan", 14, 700, TEXT_DARK)
    s += txt(w - 36, 224, "›", 20, 400, TEXT_DARK, "middle")
    s += svg_close()
    return s


def screen_student_quiz():
    w, h = 390, 720
    s = student_bg(w, h)
    s += quiz_header(w, 1, 4, y_title=72, show_progress=False)
    s += rect(16, 100, w - 32, 340, WHITE, 20, BORDER, 1)
    s += txt(32, 128, "SOAL 1", 11, 800, TEXT_DARK)
    s += pill(w - 130, 112, 110, 24, "PILIHAN GANDA", TEXT_DARK, BG_LIGHT, 12)
    s += txt(w / 2, 200, "Test", 22, 700, TEXT_DARK, "middle")
    for i, opt in enumerate(["Benar", "Salah", "Salah"]):
        oy = 240 + i * 52
        s += rect(32, oy, w - 64, 44, BG_LIGHT, 12, BORDER, 1)
        s += f'  <circle cx="52" cy="{oy + 22}" r="10" fill="none" stroke="{BLACK}" stroke-width="2"/>\n'
        s += txt(72, oy + 28, opt, 14, 500, TEXT_DARK)
    s += rect(w - 130, 460, 114, 44, BLACK, 14)
    s += txt(w - 73, 488, "Lanjut →", 14, 700, WHITE, "middle")
    s += svg_close()
    return s


def screen_student_feedback_benar():
    w, h = 390, 720
    s = student_bg(w, h)
    s += quiz_back_btn()
    s += quiz_topic_badge()
    s += txt(w - 24, 38, "Soal 1 / 4", 11, 600, TEXT_DARK, "end")
    s += progress_bar(16, 56, w - 32, 0.25)
    s += rect(24, 120, w - 48, 280, WHITE, 20, BORDER, 1.5)
    s += check_circle(w / 2, 200)
    s += txt(w / 2, 260, "Jawaban Benar!", 22, 800, TEXT_DARK, "middle")
    s += txt(w / 2, 290, "+ 100 poin", 16, 600, TEXT_DARK, "middle")
    s += rect(w - 170, 430, 154, 44, BLACK, 14)
    s += txt(w - 93, 458, "Soal Berikutnya →", 13, 700, WHITE, "middle")
    s += svg_close()
    return s


def screen_student_quiz_matching():
    w, h = 390, 720
    s = student_bg(w, h)
    s += quiz_header(w, 2, 4, y_title=72, show_progress=True, progress_pct=0.25)
    card_y = 108
    s += rect(16, card_y, w - 32, 480, WHITE, 20, BORDER, 1)
    s += txt(32, card_y + 28, "SOAL 2", 11, 800, TEXT_DARK)
    s += pill(w - 120, card_y + 12, 96, 24, "COCOKKAN", TEXT_DARK, BG_LIGHT, 12)
    s += txt(w / 2, card_y + 72, "pasangkan", 18, 700, TEXT_DARK, "middle")
    s += rect(32, card_y + 88, w - 64, 32, BG_LIGHT, 8, BORDER, 1)
    s += txt(w / 2, card_y + 108, "1 Ketuk pertanyaan  →  2 Ketuk jawaban", 9, 500, TEXT_MUTED, "middle")
    s += txt(48, card_y + 140, "PERTANYAAN", 9, 700, TEXT_MUTED)
    s += txt(w / 2 + 24, card_y + 140, "JAWABAN", 9, 700, TEXT_MUTED, "middle")
    left_x, right_x = 32, w / 2 + 8
    bw = w / 2 - 44
    items_left = [("1 Pisang", True), ("↳ Monyet", False), ("2 Jagung", True), ("↳ Ayam", False)]
    items_right = [("Monyet", True), ("Ayam", True)]
    iy = card_y + 156
    for label, ok in items_left:
        indent = 8 if label.startswith("↳") else 0
        bg = BG_LIGHT if ok else WHITE
        s += rect(left_x + indent, iy, bw - indent, 36, bg, 8, BORDER, 1)
        s += txt(left_x + indent + 10, iy + 23, label.replace("↳ ", "↳ "), 11, 500, TEXT_DARK)
        if ok:
            s += txt(left_x + bw - 20, iy + 23, "✓", 12, 700, TEXT_DARK, "middle")
        else:
            s += txt(left_x + bw - 20, iy + 23, "✕", 12, 700, TEXT_DARK, "middle")
        iy += 42
    iy = card_y + 156
    for label, ok in items_right:
        s += rect(right_x, iy, bw, 36, BG_LIGHT, 8, BORDER, 1)
        s += txt(right_x + 10, iy + 23, label, 11, 500, TEXT_DARK)
        s += txt(right_x + bw - 20, iy + 23, "✓", 12, 700, TEXT_DARK, "middle")
        iy += 42
    s += txt(w / 2, card_y + 280, "⛓", 14, 400, TEXT_MUTED, "middle")
    s += rect(w - 130, card_y + 420, 114, 44, BLACK, 14)
    s += txt(w - 73, card_y + 448, "Lanjut →", 14, 700, WHITE, "middle")
    s += svg_close()
    return s


def screen_student_feedback_salah():
    w, h = 390, 720
    s = student_bg(w, h)
    s += quiz_back_btn()
    s += quiz_topic_badge()
    s += txt(w - 24, 38, "Soal 3 / 4", 11, 600, TEXT_DARK, "end")
    s += progress_bar(16, 56, w - 32, 0.75)
    s += rect(24, 120, w - 48, 280, WHITE, 20, BORDER, 1.5)
    s += x_circle(w / 2, 200)
    s += txt(w / 2, 260, "Jawaban Salah", 22, 800, TEXT_DARK, "middle")
    s += txt(w / 2, 290, "Tetap semangat, terus berlatih!", 13, 400, TEXT_MUTED, "middle")
    s += rect(w - 170, 430, 154, 44, BLACK, 14)
    s += txt(w - 93, 458, "Soal Berikutnya →", 13, 700, WHITE, "middle")
    s += svg_close()
    return s


def _drag_card(x, y, label, icon_char="◉"):
    s = rect(x, y, 72, 100, WHITE, 12, BORDER, 1.5)
    s += txt(x + 36, y + 18, "⋮⋮", 10, 400, TEXT_MUTED, "middle")
    s += txt(x + 36, y + 58, icon_char, 28, 400, TEXT_DARK, "middle")
    s += txt(x + 36, y + 88, label, 9, 500, TEXT_DARK, "middle")
    return s


def screen_student_quiz_dragdrop():
    w, h = 390, 720
    s = student_bg(w, h)
    s += progress_bar(16, 20, w - 32, 0.75)
    card_y = 44
    s += rect(16, card_y, w - 32, 620, WHITE, 20, BORDER, 1)
    s += txt(32, card_y + 28, "SOAL 4", 11, 800, TEXT_DARK)
    s += pill(w - 140, card_y + 12, 116, 24, "SERET & LEPAS", TEXT_DARK, BG_LIGHT, 12)
    s += txt(w / 2, card_y + 60, "Drag and Drop", 18, 700, TEXT_DARK, "middle")
    s += rect(32, card_y + 76, w - 64, 36, BG_LIGHT, 10, BORDER, 1)
    s += txt(w / 2, card_y + 98, "✋ Seret atau ketuk kartu, lalu taruh ke kotaknya", 9, 500, TEXT_MUTED, "middle")
    s += f'  <rect x="32" y="{card_y + 124}" width="{w - 64}" height="120" rx="12" fill="none" stroke="{BLACK}" stroke-width="1.5" stroke-dasharray="6,4"/>\n'
    s += _drag_card(80, card_y + 140, "strawberry", "◉")
    s += _drag_card(200, card_y + 140, "pisang", "◉")
    col_w = (w - 80) / 2
    for i, (basket, label) in enumerate([("🧺", "Keranjang Kuning"), ("🧺", "Keranjang Merah")]):
        cx = 32 + i * (col_w + 8)
        s += txt(cx + col_w / 2, card_y + 270, basket, 24, 400, TEXT_DARK, "middle")
        s += txt(cx + col_w / 2, card_y + 296, label, 10, 700, TEXT_DARK, "middle")
        s += f'  <rect x="{cx}" y="{card_y + 308}" width="{col_w - 8}" height="80" rx="10" fill="none" stroke="{BLACK}" stroke-width="1.5" stroke-dasharray="6,4"/>\n'
        s += txt(cx + (col_w - 8) / 2, card_y + 354, "↓ Taruh di sini", 9, 400, TEXT_MUTED, "middle")
    s += rect(w - 130, card_y + 560, 114, 44, BLACK, 14)
    s += txt(w - 73, card_y + 588, "Lanjut →", 14, 700, WHITE, "middle")
    s += svg_close()
    return s


def screen_student_quiz_dragdrop_done():
    w, h = 390, 720
    s = student_bg(w, h)
    s += progress_bar(16, 20, w - 32, 1.0)
    card_y = 44
    s += rect(16, card_y, w - 32, 620, WHITE, 20, BORDER, 1)
    s += txt(32, card_y + 28, "SOAL 4", 11, 800, TEXT_DARK)
    s += pill(w - 140, card_y + 12, 116, 24, "SERET & LEPAS", TEXT_DARK, BG_LIGHT, 12)
    s += txt(w / 2, card_y + 60, "Drag and Drop", 18, 700, TEXT_DARK, "middle")
    s += rect(32, card_y + 76, w - 64, 36, BG_LIGHT, 10, BORDER, 1)
    s += txt(w / 2, card_y + 98, "✋ Seret atau ketuk kartu, lalu taruh ke kotaknya", 9, 500, TEXT_MUTED, "middle")
    s += f'  <rect x="32" y="{card_y + 124}" width="{w - 64}" height="36" rx="8" fill="{BG_LIGHT}" stroke="{BORDER}" stroke-width="1" stroke-dasharray="4,3"/>\n'
    s += txt(w / 2, card_y + 146, "Semua kartu sudah ditempatkan!", 10, 600, TEXT_DARK, "middle")
    col_w = (w - 80) / 2
    for i, (label, item) in enumerate([("Keranjang Kuning", "strawberry"), ("Keranjang Merah", "pisang")]):
        cx = 32 + i * (col_w + 8)
        s += txt(cx + col_w / 2, card_y + 200, "🧺", 24, 400, TEXT_DARK, "middle")
        s += txt(cx + col_w / 2, card_y + 226, label, 10, 700, TEXT_DARK, "middle")
        s += rect(cx, card_y + 238, col_w - 8, 100, BG_LIGHT, 10, BORDER, 1)
        s += rect(cx + 12, card_y + 250, 56, 76, WHITE, 8, BORDER, 1)
        s += txt(cx + 40, card_y + 286, "◉", 20, 400, TEXT_DARK, "middle")
        s += txt(cx + 40, card_y + 310, item, 8, 500, TEXT_DARK, "middle")
        s += txt(cx + col_w - 24, card_y + 262, "✕", 10, 600, TEXT_DARK, "middle")
    s += rect(w - 130, card_y + 560, 114, 44, BLACK, 14)
    s += txt(w - 73, card_y + 588, "Lanjut →", 14, 700, WHITE, "middle")
    s += svg_close()
    return s


def screen_student_result():
    w, h = 390, 720
    s = student_bg(w, h)
    cx, cy = w / 2, 100
    s += f'  <circle cx="{cx}" cy="{cy}" r="52" fill="none" stroke="{LIGHT}" stroke-width="10"/>\n'
    s += f'  <path d="M {cx} {cy - 52} A 52 52 0 0 1 {cx + 52} {cy}" fill="none" stroke="{BLACK}" stroke-width="10" stroke-linecap="round"/>\n'
    s += txt(cx, cy - 4, "50%", 24, 800, TEXT_DARK, "middle")
    s += txt(cx, cy + 18, "SKOR", 10, 500, TEXT_MUTED, "middle")
    for i in range(3):
        sx = cx - 36 + i * 36
        if i == 0:
            s += txt(sx, cy + 52, "★", 22, 400, BLACK, "middle")
        else:
            s += txt(sx, cy + 52, "☆", 22, 400, TEXT_MUTED, "middle")
    s += txt(cx, cy + 88, "Terus Semangat!", 20, 800, TEXT_DARK, "middle")
    stats = [("2", "BENAR"), ("2", "SALAH"), ("+200", "TOTAL SKOR"), ("1", "TOTAL BINTANG")]
    sw = (w - 48) / 4
    for i, (val, label) in enumerate(stats):
        sx = 16 + i * (sw + 4)
        s += rect(sx, cy + 108, sw, 56, WHITE, 10, BORDER, 1)
        s += txt(sx + sw / 2, cy + 134, val, 18, 700, TEXT_DARK, "middle")
        s += txt(sx + sw / 2, cy + 154, label, 7, 600, TEXT_MUTED, "middle")
    s += rect(w / 2 - 70, cy + 180, 140, 28, BG_LIGHT, 14, BORDER, 1)
    s += txt(w / 2, cy + 198, "🏅 Rank: Pemula", 11, 600, TEXT_DARK, "middle")
    s += txt(24, cy + 228, "RINCIAN JAWABAN", 9, 700, TEXT_MUTED)
    rows = [("Soal 1", "+100", True), ("Soal 2", "+100", True), ("Soal 3", "+0", False), ("Soal 4", "+0", False)]
    ry = cy + 244
    for label, pts, correct in rows:
        bg = BG_LIGHT if correct else WHITE
        s += rect(16, ry, w - 32, 36, bg, 8, BORDER if not correct else None, 1 if not correct else 0)
        s += txt(32, ry + 23, label, 12, 500, TEXT_DARK)
        icon = "✓" if correct else "✕"
        s += txt(w - 80, ry + 23, icon, 12, 700, TEXT_DARK)
        s += txt(w - 32, ry + 23, pts, 12, 600, TEXT_DARK, "end")
        ry += 42
    s += rect(16, ry + 16, (w - 40) / 2, 44, WHITE, 12, BORDER, 1.5)
    s += txt(16 + (w - 40) / 4, ry + 44, "Pilih Topik Lain", 12, 600, TEXT_DARK, "middle")
    s += rect(24 + (w - 40) / 2, ry + 16, (w - 40) / 2, 44, BLACK, 12)
    s += txt(24 + (w - 40) / 2 + (w - 40) / 4, ry + 44, "Ulangi Kuis", 12, 600, WHITE, "middle")
    s += svg_close()
    return s


    s += svg_close()
    return s


# ── Desktop helpers ──────────────────────────────────────────────

def desktop_bg():
    s = svg_open(DESKTOP_W, DESKTOP_H)
    s += rect(0, 0, DESKTOP_W, DESKTOP_H, BG_LIGHT)
    s += f'  <circle cx="{DESKTOP_W - 80}" cy="90" r="200" fill="{WHITE}" stroke="{LIGHT}" stroke-width="1"/>\n'
    s += f'  <circle cx="60" cy="{DESKTOP_H - 60}" r="160" fill="{WHITE}" stroke="{LIGHT}" stroke-width="1"/>\n'
    s += txt(60, DESKTOP_H - 30, "○", 28, 400, MID)
    s += txt(DESKTOP_W - 100, 60, "★", 24, 400, MID)
    return s


def content_x(cw):
    return (DESKTOP_W - cw) // 2


def d_quiz_header(ox, cw, question_num, total, y_title=88, show_progress=False, progress_pct=0):
    s = rect(ox, 32, 90, 34, WHITE, 10, BORDER, 1.5)
    s += txt(ox + 45, 54, "← Kembali", 12, 600, TEXT_DARK, "middle")
    s += rect(ox + 110, 32, 180, 30, BG_LIGHT, 14, BORDER, 1)
    s += txt(ox + 200, 50, "kewarganegaraan", 11, 600, TEXT_DARK, "middle")
    s += txt(ox + cw - 8, 50, f"Soal {question_num} / {total}", 12, 600, TEXT_DARK, "end")
    s += txt(ox + cw / 2, y_title, "Kerjakan Soal", 28, 800, TEXT_DARK, "middle")
    if show_progress:
        s += progress_bar(ox, y_title + 20, cw, progress_pct)
    else:
        s += f'  <line x1="{ox}" y1="{y_title + 20}" x2="{ox + cw}" y2="{y_title + 20}" stroke="{BORDER}" stroke-width="2"/>\n'
    return s


def _student_card(ox, cy, cw, rank, letter, name, grp):
    s = rect(ox, cy, cw, 88, WHITE, 16, BORDER, 1.5)
    s += medal_icon(ox + 28, cy + 44, rank)
    s += avatar(ox + 72, cy + 40, letter, 22)
    s += txt(ox + 108, cy + 36, name, 18, 700, TEXT_DARK)
    s += txt(ox + 108, cy + 58, grp, 12, 400, TEXT_MUTED)
    s += trophy_badge(ox + cw - 68, cy + 22)
    s += txt(ox + cw - 24, cy + 72, "⋯", 18, 400, TEXT_MUTED, "middle")
    return s


# ── Desktop screens ──────────────────────────────────────────────

def screen_login_desktop():
    s = desktop_bg()
    cw, ch = 440, 520
    cx = content_x(cw)
    cy = (DESKTOP_H - ch) // 2
    s += rect(cx, cy, cw, ch, WHITE, 32, BLACK, 2)
    s += f'  <rect x="{cx}" y="{cy + ch - 8}" width="{cw}" height="8" rx="4" fill="{MID}"/>\n'
    s += rect(cx + cw / 2 - 36, cy + 32, 72, 72, BG_LIGHT, 36, BORDER, 1)
    s += txt(cx + cw / 2, cy + 78, "LOGO", 11, 600, MID, "middle")
    s += txt(cx + cw / 2, cy + 118, "Halo, Sobat!", 32, 900, TEXT_DARK, "middle")
    s += txt(cx + cw / 2, cy + 150, "Yuk masuk dan mulai belajar seru!", 14, 500, TEXT_MUTED, "middle")
    fx, fw = cx + 48, cw - 96
    s += txt(fx, cy + 196, "Username", 14, 700, TEXT_DARK)
    s += input_field(fx, cy + 206, fw, 48, "admin", dark=True)
    s += txt(fx, cy + 278, "Password", 14, 700, TEXT_DARK)
    s += input_field(fx, cy + 288, fw, 48, "••••••••", dark=True)
    by = cy + 368
    s += rect(fx, by, fw, 54, BLACK, 18)
    s += txt(cx + cw / 2, by + 34, "Ayo Masuk!", 16, 800, WHITE, "middle")
    s += svg_close()
    return s


def screen_student_siswa_desktop():
    cw = STUDENT_CW
    ox = content_x(cw)
    s = desktop_bg()
    s += rect(ox, 32, 100, 38, WHITE, 10, BORDER, 1.5)
    s += txt(ox + 50, 56, "← Kembali", 13, 600, TEXT_DARK, "middle")
    s += school_icon(ox + 120, 38)
    s += txt(ox + 150, 58, "Daftar Siswa", 26, 700, TEXT_DARK)
    s += input_field(ox, 88, cw - 120, 44, "Cari nama atau kelompok...")
    s += txt(ox + cw - 80, 116, "2 siswa", 13, 500, TEXT_MUTED)
    col_w = (cw - 16) // 2
    students = [(1, "A", "Abdul", "TK A"), (2, "T", "Tesa", "TK B")]
    for i, (rank, letter, name, grp) in enumerate(students):
        col = i % 2
        row = i // 2
        sx = ox + col * (col_w + 16)
        sy = 148 + row * 104
        s += _student_card(sx, sy, col_w, rank, letter, name, grp)
    s += svg_close()
    return s


def screen_student_topics_desktop():
    cw = STUDENT_CW
    ox = content_x(cw)
    s = desktop_bg()
    s += rect(ox, 32, 90, 38, WHITE, 10, BORDER, 1.5)
    s += txt(ox + 45, 56, "← Kembali", 13, 600, TEXT_DARK, "middle")
    s += rect(ox + 110, 32, cw - 110, 56, WHITE, 14, BORDER, 1.5)
    s += circle(ox + 142, 60, 20, BLACK)
    s += txt(ox + 142, 66, "T", 14, 700, WHITE, "middle")
    s += txt(ox + 172, 50, "Tesa", 16, 700, TEXT_DARK)
    s += txt(ox + 172, 72, "TK A • ★ 0 • Skor 0 • Rank BEGINNER", 11, 400, TEXT_MUTED)
    s += books_icon(ox, 108)
    s += txt(ox + 32, 124, "Pilih Topik", 28, 700, TEXT_DARK)
    s += txt(ox, 152, "Pilih topik yang ingin dikerjakan", 13, 400, TEXT_MUTED)
    s += rect(ox, 172, cw - 100, 44, WHITE, 10, BORDER, 1.5)
    s += txt(ox + 16, 200, "Cari topik...", 13, 400, TEXT_MUTED)
    s += txt(ox + cw - 70, 200, "1 topik", 12, 500, TEXT_DARK)
    s += rect(ox, 236, cw, 72, WHITE, 14, BORDER, 1.5)
    s += rect(ox + 16, 248, 56, 56, BLACK, 12)
    s += txt(ox + 44, 284, "K", 26, 700, WHITE, "middle")
    s += txt(ox + 88, 280, "kewarganegaraan", 16, 700, TEXT_DARK)
    s += txt(ox + cw - 24, 280, "›", 24, 400, TEXT_DARK, "middle")
    s += svg_close()
    return s


def screen_student_quiz_desktop():
    cw = QUIZ_CW
    ox = content_x(cw)
    s = desktop_bg()
    s += d_quiz_header(ox, cw, 1, 4, y_title=96, show_progress=False)
    card_y = 132
    s += rect(ox, card_y, cw, 380, WHITE, 20, BORDER, 1)
    s += txt(ox + 20, card_y + 32, "SOAL 1", 12, 800, TEXT_DARK)
    s += pill(ox + cw - 130, card_y + 16, 110, 26, "PILIHAN GANDA", TEXT_DARK, BG_LIGHT, 12)
    s += txt(ox + cw / 2, card_y + 120, "Test", 28, 700, TEXT_DARK, "middle")
    for i, opt in enumerate(["Benar", "Salah", "Salah"]):
        oy = card_y + 180 + i * 56
        s += rect(ox + 24, oy, cw - 48, 48, BG_LIGHT, 12, BORDER, 1)
        s += f'  <circle cx="{ox + 44}" cy="{oy + 24}" r="11" fill="none" stroke="{BLACK}" stroke-width="2"/>\n'
        s += txt(ox + 68, oy + 30, opt, 15, 500, TEXT_DARK)
    s += rect(ox + cw - 140, card_y + 320, 124, 48, BLACK, 14)
    s += txt(ox + cw - 78, card_y + 350, "Lanjut →", 15, 700, WHITE, "middle")
    s += svg_close()
    return s


def screen_student_feedback_benar_desktop():
    cw = QUIZ_CW
    ox = content_x(cw)
    s = desktop_bg()
    s += rect(ox, 32, 90, 34, WHITE, 10, BORDER, 1.5)
    s += txt(ox + 45, 54, "← Kembali", 12, 600, TEXT_DARK, "middle")
    s += rect(ox + 120, 32, 180, 30, BG_LIGHT, 14, BORDER, 1)
    s += txt(ox + 210, 50, "kewarganegaraan", 11, 600, TEXT_DARK, "middle")
    s += txt(ox + cw - 8, 50, "Soal 1 / 4", 12, 600, TEXT_DARK, "end")
    s += progress_bar(ox, 80, cw, 0.25)
    s += rect(ox + 40, 140, cw - 80, 320, WHITE, 20, BORDER, 1.5)
    cx = ox + cw / 2
    s += check_circle(cx, 240, 36)
    s += txt(cx, 310, "Jawaban Benar!", 28, 800, TEXT_DARK, "middle")
    s += txt(cx, 346, "+ 100 poin", 18, 600, TEXT_DARK, "middle")
    s += rect(ox + cw - 180, 490, 164, 48, BLACK, 14)
    s += txt(ox + cw - 98, 520, "Soal Berikutnya →", 14, 700, WHITE, "middle")
    s += svg_close()
    return s


def screen_student_quiz_matching_desktop():
    cw = QUIZ_CW
    ox = content_x(cw)
    s = desktop_bg()
    s += d_quiz_header(ox, cw, 2, 4, y_title=96, show_progress=True, progress_pct=0.25)
    card_y = 132
    s += rect(ox, card_y, cw, 500, WHITE, 20, BORDER, 1)
    s += txt(ox + 20, card_y + 32, "SOAL 2", 12, 800, TEXT_DARK)
    s += pill(ox + cw - 120, card_y + 16, 96, 26, "COCOKKAN", TEXT_DARK, BG_LIGHT, 12)
    s += txt(ox + cw / 2, card_y + 80, "pasangkan", 22, 700, TEXT_DARK, "middle")
    s += rect(ox + 24, card_y + 100, cw - 48, 36, BG_LIGHT, 8, BORDER, 1)
    s += txt(ox + cw / 2, card_y + 122, "1 Ketuk pertanyaan  →  2 Ketuk jawaban", 11, 500, TEXT_MUTED, "middle")
    half = (cw - 56) / 2
    lx, rx = ox + 24, ox + 32 + half
    s += txt(lx, card_y + 152, "PERTANYAAN", 10, 700, TEXT_MUTED)
    s += txt(rx, card_y + 152, "JAWABAN", 10, 700, TEXT_MUTED)
    items_left = [("1 Pisang", True), ("↳ Monyet", False), ("2 Jagung", True), ("↳ Ayam", False)]
    items_right = [("Monyet", True), ("Ayam", True)]
    iy = card_y + 168
    for label, ok in items_left:
        indent = 12 if label.startswith("↳") else 0
        bg = BG_LIGHT if ok else WHITE
        s += rect(lx + indent, iy, half - indent, 40, bg, 8, BORDER, 1)
        s += txt(lx + indent + 12, iy + 26, label, 12, 500, TEXT_DARK)
        s += txt(lx + half - 24, iy + 26, "✓" if ok else "✕", 13, 700, TEXT_DARK, "middle")
        iy += 48
    iy = card_y + 168
    for label, _ in items_right:
        s += rect(rx, iy, half, 40, BG_LIGHT, 8, BORDER, 1)
        s += txt(rx + 12, iy + 26, label, 12, 500, TEXT_DARK)
        s += txt(rx + half - 24, iy + 26, "✓", 13, 700, TEXT_DARK, "middle")
        iy += 48
    s += txt(ox + cw / 2, card_y + 320, "⛓", 16, 400, TEXT_MUTED, "middle")
    s += rect(ox + cw - 140, card_y + 440, 124, 48, BLACK, 14)
    s += txt(ox + cw - 78, card_y + 470, "Lanjut →", 15, 700, WHITE, "middle")
    s += svg_close()
    return s


def screen_student_feedback_salah_desktop():
    cw = QUIZ_CW
    ox = content_x(cw)
    s = desktop_bg()
    s += rect(ox, 32, 90, 34, WHITE, 10, BORDER, 1.5)
    s += txt(ox + 45, 54, "← Kembali", 12, 600, TEXT_DARK, "middle")
    s += rect(ox + 120, 32, 180, 30, BG_LIGHT, 14, BORDER, 1)
    s += txt(ox + 210, 50, "kewarganegaraan", 11, 600, TEXT_DARK, "middle")
    s += txt(ox + cw - 8, 50, "Soal 3 / 4", 12, 600, TEXT_DARK, "end")
    s += progress_bar(ox, 80, cw, 0.75)
    s += rect(ox + 40, 140, cw - 80, 320, WHITE, 20, BORDER, 1.5)
    cx = ox + cw / 2
    s += x_circle(cx, 240, 36)
    s += txt(cx, 310, "Jawaban Salah", 28, 800, TEXT_DARK, "middle")
    s += txt(cx, 346, "Tetap semangat, terus berlatih!", 15, 400, TEXT_MUTED, "middle")
    s += rect(ox + cw - 180, 490, 164, 48, BLACK, 14)
    s += txt(ox + cw - 98, 520, "Soal Berikutnya →", 14, 700, WHITE, "middle")
    s += svg_close()
    return s


def screen_student_quiz_dragdrop_desktop():
    cw = QUIZ_CW
    ox = content_x(cw)
    s = desktop_bg()
    s += progress_bar(ox, 32, cw, 0.75)
    card_y = 56
    s += rect(ox, card_y, cw, 660, WHITE, 20, BORDER, 1)
    s += txt(ox + 20, card_y + 32, "SOAL 4", 12, 800, TEXT_DARK)
    s += pill(ox + cw - 140, card_y + 16, 116, 26, "SERET & LEPAS", TEXT_DARK, BG_LIGHT, 12)
    s += txt(ox + cw / 2, card_y + 72, "Drag and Drop", 22, 700, TEXT_DARK, "middle")
    s += rect(ox + 24, card_y + 92, cw - 48, 40, BG_LIGHT, 10, BORDER, 1)
    s += txt(ox + cw / 2, card_y + 116, "✋ Seret atau ketuk kartu, lalu taruh ke kotaknya", 11, 500, TEXT_MUTED, "middle")
    s += f'  <rect x="{ox + 24}" y="{card_y + 148}" width="{cw - 48}" height="140" rx="12" fill="none" stroke="{BLACK}" stroke-width="1.5" stroke-dasharray="6,4"/>\n'
    s += _drag_card(ox + 120, card_y + 168, "strawberry", "◉")
    s += _drag_card(ox + 280, card_y + 168, "pisang", "◉")
    s += _drag_card(ox + 440, card_y + 168, "apel", "◉")
    col_w = (cw - 64) / 2
    for i, label in enumerate(["Keranjang Kuning", "Keranjang Merah"]):
        cx = ox + 32 + i * (col_w + 16)
        s += txt(cx + col_w / 2, card_y + 320, "🧺", 28, 400, TEXT_DARK, "middle")
        s += txt(cx + col_w / 2, card_y + 352, label, 12, 700, TEXT_DARK, "middle")
        s += f'  <rect x="{cx}" y="{card_y + 368}" width="{col_w}" height="100" rx="10" fill="none" stroke="{BLACK}" stroke-width="1.5" stroke-dasharray="6,4"/>\n'
        s += txt(cx + col_w / 2, card_y + 422, "↓ Taruh di sini", 11, 400, TEXT_MUTED, "middle")
    s += rect(ox + cw - 140, card_y + 596, 124, 48, BLACK, 14)
    s += txt(ox + cw - 78, card_y + 626, "Lanjut →", 15, 700, WHITE, "middle")
    s += svg_close()
    return s


def screen_student_quiz_dragdrop_done_desktop():
    cw = QUIZ_CW
    ox = content_x(cw)
    s = desktop_bg()
    s += progress_bar(ox, 32, cw, 1.0)
    card_y = 56
    s += rect(ox, card_y, cw, 660, WHITE, 20, BORDER, 1)
    s += txt(ox + 20, card_y + 32, "SOAL 4", 12, 800, TEXT_DARK)
    s += pill(ox + cw - 140, card_y + 16, 116, 26, "SERET & LEPAS", TEXT_DARK, BG_LIGHT, 12)
    s += txt(ox + cw / 2, card_y + 72, "Drag and Drop", 22, 700, TEXT_DARK, "middle")
    s += rect(ox + 24, card_y + 92, cw - 48, 40, BG_LIGHT, 10, BORDER, 1)
    s += txt(ox + cw / 2, card_y + 116, "✋ Seret atau ketuk kartu, lalu taruh ke kotaknya", 11, 500, TEXT_MUTED, "middle")
    s += f'  <rect x="{ox + 24}" y="{card_y + 148}" width="{cw - 48}" height="40" rx="8" fill="{BG_LIGHT}" stroke="{BORDER}" stroke-width="1" stroke-dasharray="4,3"/>\n'
    s += txt(ox + cw / 2, card_y + 172, "Semua kartu sudah ditempatkan!", 12, 600, TEXT_DARK, "middle")
    col_w = (cw - 64) / 2
    for i, (label, item) in enumerate([("Keranjang Kuning", "strawberry"), ("Keranjang Merah", "pisang")]):
        cx = ox + 32 + i * (col_w + 16)
        s += txt(cx + col_w / 2, card_y + 220, "🧺", 28, 400, TEXT_DARK, "middle")
        s += txt(cx + col_w / 2, card_y + 252, label, 12, 700, TEXT_DARK, "middle")
        s += rect(cx, card_y + 268, col_w, 120, BG_LIGHT, 10, BORDER, 1)
        s += rect(cx + 20, card_y + 282, 64, 88, WHITE, 8, BORDER, 1)
        s += txt(cx + 52, card_y + 322, "◉", 22, 400, TEXT_DARK, "middle")
        s += txt(cx + 52, card_y + 352, item, 9, 500, TEXT_DARK, "middle")
        s += txt(cx + col_w - 20, card_y + 296, "✕", 11, 600, TEXT_DARK, "middle")
    s += rect(ox + cw - 140, card_y + 596, 124, 48, BLACK, 14)
    s += txt(ox + cw - 78, card_y + 626, "Lanjut →", 15, 700, WHITE, "middle")
    s += svg_close()
    return s


def screen_student_result_desktop():
    cw = STUDENT_CW
    ox = content_x(cw)
    s = desktop_bg()
    cx = ox + cw / 2
    cy = 120
    s += f'  <circle cx="{cx}" cy="{cy}" r="60" fill="none" stroke="{LIGHT}" stroke-width="12"/>\n'
    s += f'  <path d="M {cx} {cy - 60} A 60 60 0 0 1 {cx + 60} {cy}" fill="none" stroke="{BLACK}" stroke-width="12" stroke-linecap="round"/>\n'
    s += txt(cx, cy - 6, "50%", 30, 800, TEXT_DARK, "middle")
    s += txt(cx, cy + 20, "SKOR", 11, 500, TEXT_MUTED, "middle")
    for i in range(3):
        sx = cx - 42 + i * 42
        s += txt(sx, cy + 58, "★" if i == 0 else "☆", 26, 400, BLACK if i == 0 else TEXT_MUTED, "middle")
    s += txt(cx, cy + 100, "Terus Semangat!", 26, 800, TEXT_DARK, "middle")
    stats = [("2", "BENAR"), ("2", "SALAH"), ("+200", "TOTAL SKOR"), ("1", "TOTAL BINTANG")]
    sw = (cw - 48) / 4
    for i, (val, label) in enumerate(stats):
        sx = ox + 16 + i * (sw + 8)
        s += rect(sx, cy + 124, sw, 64, WHITE, 12, BORDER, 1)
        s += txt(sx + sw / 2, cy + 154, val, 22, 700, TEXT_DARK, "middle")
        s += txt(sx + sw / 2, cy + 178, label, 8, 600, TEXT_MUTED, "middle")
    s += rect(cx - 80, cy + 208, 160, 32, BG_LIGHT, 16, BORDER, 1)
    s += txt(cx, cy + 228, "🏅 Rank: Pemula", 12, 600, TEXT_DARK, "middle")
    s += txt(ox, cy + 260, "RINCIAN JAWABAN", 10, 700, TEXT_MUTED)
    rows = [("Soal 1", "+100", True), ("Soal 2", "+100", True), ("Soal 3", "+0", False), ("Soal 4", "+0", False)]
    ry = cy + 280
    for label, pts, correct in rows:
        bg = BG_LIGHT if correct else WHITE
        s += rect(ox, ry, cw, 40, bg, 8, BORDER if not correct else None, 1 if not correct else 0)
        s += txt(ox + 16, ry + 26, label, 13, 500, TEXT_DARK)
        s += txt(ox + cw - 100, ry + 26, "✓" if correct else "✕", 13, 700, TEXT_DARK)
        s += txt(ox + cw - 16, ry + 26, pts, 13, 600, TEXT_DARK, "end")
        ry += 48
    s += rect(ox, ry + 20, (cw - 16) / 2, 48, WHITE, 12, BORDER, 1.5)
    s += txt(ox + (cw - 16) / 4, ry + 50, "Pilih Topik Lain", 13, 600, TEXT_DARK, "middle")
    s += rect(ox + (cw - 16) / 2 + 16, ry + 20, (cw - 16) / 2, 48, BLACK, 12)
    s += txt(ox + (cw - 16) / 2 + 16 + (cw - 16) / 4, ry + 50, "Ulangi Kuis", 13, 600, WHITE, "middle")
    s += svg_close()
    return s


def screen_student_landing_desktop():
    cw = 600
    ox = content_x(cw)
    s = desktop_bg()
    s += txt(ox + cw / 2, 100, "Gamifikasi Belajar", 14, 600, TEXT_MUTED, "middle")
    s += txt(ox + cw / 2, 160, "Siap Belajar Hari Ini?", 32, 800, TEXT_DARK, "middle")
    s += rect(ox + cw / 2 - 60, 200, 120, 120, WHITE, 60, BORDER, 1.5)
    s += txt(ox + cw / 2, 268, "MULAI", 18, 800, TEXT_DARK, "middle")
    sw = (cw - 32) / 3
    for i, label in enumerate(["Poin", "Badge", "Rank"]):
        sx = ox + i * (sw + 16)
        s += rect(sx, 360, sw, 80, WHITE, 12, BORDER, 1)
        s += txt(sx + sw / 2, 406, label, 14, 600, TEXT_MUTED, "middle")
    s += svg_close()
    return s


def save(name: str, content: str, folder: Path = OUT) -> Path:
    path = folder / f"{name}.svg"
    path.write_text(content, encoding="utf-8")
    return path


def gen_combined(paths: list[Path], output: Path, title: str):
    cols = 3
    pad = 40
    col_w = 1100
    col_heights = [pad + 40] * cols
    positions = []

    for i, p in enumerate(paths):
        inner = p.read_text(encoding="utf-8")
        sw = int(inner.split('width="')[1].split('"')[0])
        sh = int(inner.split('height="')[1].split('"')[0])
        col = i % cols
        x = pad + col * (col_w + pad)
        y = col_heights[col]
        positions.append((p.stem, x, y, sw, sh, inner))
        col_heights[col] += sh + pad + 28

    total_w = pad + cols * (col_w + pad)
    total_h = max(col_heights) + pad
    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{total_w}" height="{total_h}" viewBox="0 0 {total_w} {total_h}">',
        f'  <rect width="{total_w}" height="{total_h}" fill="{WHITE}"/>',
        f'  <text x="{pad}" y="28" font-family="{FONT}" font-size="20" font-weight="700" fill="{TEXT_DARK}">{esc(title)}</text>',
    ]
    for label, x, y, sw, sh, inner in positions:
        start = inner.find(">", inner.find("<svg")) + 1
        end = inner.rfind("</svg>")
        body = inner[start:end]
        parts.append(f'  <g id="{label}">')
        parts.append(f'    <text x="{x}" y="{y - 6}" font-family="{FONT}" font-size="11" fill="{TEXT_MUTED}">{esc(label)}</text>')
        parts.append(f'    <svg x="{x}" y="{y}" width="{sw}" height="{sh}" viewBox="0 0 {sw} {sh}">')
        parts.append(body)
        parts.append("    </svg>")
        parts.append("  </g>")
    parts.append("</svg>")
    output.write_text("\n".join(parts), encoding="utf-8")
    return output


def main():
    mobile_screens = [
        ("02-login", screen_login()),
        ("03-dashboard", screen_dashboard()),
        ("04-admin-tema", screen_tema()),
        ("06-admin-soal-tema", screen_soal_tema()),
        ("07-admin-siswa", screen_siswa_admin()),
        ("09-student-daftar-siswa", screen_student_siswa()),
        ("10-student-topics", screen_student_topics()),
        ("11-student-quiz", screen_student_quiz()),
        ("12-student-feedback-benar", screen_student_feedback_benar()),
        ("13-student-quiz-matching", screen_student_quiz_matching()),
        ("14-student-feedback-salah", screen_student_feedback_salah()),
        ("15-student-quiz-dragdrop", screen_student_quiz_dragdrop()),
        ("16-student-quiz-dragdrop-done", screen_student_quiz_dragdrop_done()),
        ("17-student-result", screen_student_result()),
    ]
    desktop_screens = [
        ("02-login", screen_login_desktop()),
        ("03-dashboard", screen_dashboard()),
        ("04-admin-tema", screen_tema()),
        ("06-admin-soal-tema", screen_soal_tema()),
        ("07-admin-siswa", screen_siswa_admin()),
        ("08-student-landing", screen_student_landing_desktop()),
        ("09-student-daftar-siswa", screen_student_siswa_desktop()),
        ("10-student-topics", screen_student_topics_desktop()),
        ("11-student-quiz", screen_student_quiz_desktop()),
        ("12-student-feedback-benar", screen_student_feedback_benar_desktop()),
        ("13-student-quiz-matching", screen_student_quiz_matching_desktop()),
        ("14-student-feedback-salah", screen_student_feedback_salah_desktop()),
        ("15-student-quiz-dragdrop", screen_student_quiz_dragdrop_desktop()),
        ("16-student-quiz-dragdrop-done", screen_student_quiz_dragdrop_done_desktop()),
        ("17-student-result", screen_student_result_desktop()),
    ]
    paths = [save(name, content) for name, content in mobile_screens]
    d_paths = [save(name, content, OUT_DESKTOP) for name, content in desktop_screens]
    for old in ("12-student-feedback.svg", "13-student-result.svg"):
        p = OUT / old
        if p.exists():
            p.unlink()
    all_mobile = sorted(OUT.glob("*.svg"), key=lambda p: p.name)
    all_desktop = sorted(OUT_DESKTOP.glob("*.svg"), key=lambda p: p.name)
    combined = gen_combined(
        all_mobile, ROOT / "00-all-screens.svg", "Gamifikasi PAUD — Mockup Mobile (Hitam Putih)"
    )
    combined_d = gen_combined(
        all_desktop, ROOT / "00-all-screens-desktop.svg", "Gamifikasi PAUD — Mockup Desktop (Hitam Putih)"
    )
    print(f"Mobile: {len(paths)} screens + {combined.name} ({len(all_mobile)} total)")
    print(f"Desktop: {len(d_paths)} screens + {combined_d.name} ({len(all_desktop)} total)")


if __name__ == "__main__":
    main()
