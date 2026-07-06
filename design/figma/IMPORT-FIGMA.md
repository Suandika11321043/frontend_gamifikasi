# Import Mockup ke Figma

File mockup UI **hitam putih** ada di folder ini, siap diimpor ke Figma.

## File yang tersedia

| File | Keterangan |
|------|------------|
| `00-all-screens.svg` | Semua layar mockup dalam satu lembar (disarankan) |
| `00-all-screens-desktop.svg` | Semua layar **desktop** (1280×800) |
| `screens/desktop/*.svg` | Satu file per layar desktop |

## Cara import ke Figma

### Opsi A — Semua layar sekaligus (paling cepat)

1. Buka [Figma](https://www.figma.com) → buat file baru
2. **File → Place image…** (atau drag & drop)
3. Pilih `00-all-screens.svg`
4. Setelah masuk, klik kanan layer → **Ungroup** (2–3 kali) sampai tiap layar terpisah
5. Pilih tiap layar → klik kanan → **Frame selection** untuk jadikan Frame Figma

### Opsi B — Per layar

1. Drag file dari folder `screens/` ke canvas Figma
2. Ulangi untuk setiap layar yang diperlukan
3. Atur ukuran frame sesuai kebutuhan

### Opsi C — Plugin html.to.design (opsional)

Jika ingin hasil lebih mirip UI asli, buka aplikasi React (`npm run dev`) lalu gunakan plugin Figma **html.to.design** untuk capture halaman live.

## Daftar layar mockup

| No | File | Route | Keterangan |
|----|------|-------|------------|
| 02 | login | `/login` | Halaman login admin |
| 03 | dashboard | `/dashboard` | Dashboard admin + peringkat |
| 04 | admin-tema | `/admin/tema` | Manajemen tema |
| 06 | admin-soal-tema | `/admin/soal/:topicId` | Soal per tema |
| 07 | admin-siswa | `/admin/siswa` | Daftar siswa (admin) |
| 09 | student-daftar-siswa | `/student/daftar-siswa` | Pilih siswa |
| 10 | student-topics | `/student/siswa/:id/topics` | Pilih topik |
| 11 | student-quiz | Kuis | Kerjakan soal (pilihan ganda) |
| 12 | student-feedback-benar | Kuis | Feedback jawaban benar |
| 13 | student-quiz-matching | Kuis | Soal cocokkan |
| 14 | student-feedback-salah | Kuis | Feedback jawaban salah |
| 15 | student-quiz-dragdrop | Kuis | Drag & drop (awal) |
| 16 | student-quiz-dragdrop-done | Kuis | Drag & drop (selesai) |
| 17 | student-result | Kuis | Hasil kuis |

### Desktop (1280×800)

| No | File | Keterangan |
|----|------|------------|
| 02 | login | Login admin — kartu tengah |
| 03–07 | admin-* | Sama seperti mobile (sudah desktop) |
| 08 | student-landing | Landing siswa |
| 09–17 | student-* | Alur siswa & kuis — konten tengah max 760px |

## Regenerate mockup

Jika ada perubahan UI, jalankan:

```bash
python design/figma/generate_mockups.py
```

dari folder `gamifikasiFE`.
