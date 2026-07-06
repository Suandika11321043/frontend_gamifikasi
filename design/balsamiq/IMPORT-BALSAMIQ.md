# Import Mockup ke Balsamiq

Mockup wireframe **hitam putih, gaya sketsa (Balsamiq)**, layout **desktop** (1280×800).

## File utama

| File | Keterangan |
|------|------------|
| **`Gamifikasi-PAUD.bmpr`** | Proyek Balsamiq lengkap (17 layar) — buka file ini |
| `screens/*.bmml` | Sumber per layar (XML, bisa diedit manual) |

## Cara buka

1. Buka **Balsamiq Wireframes** (v4.8+)
2. **File → Open** → pilih salah satu lokasi:
   - `design/balsamiq/Gamifikasi-PAUD.bmpr` (di proyek)
   - `Documents/Gamifikasi-PAUD.bmpr` (salinan otomatis)
3. Semua 17 wireframe muncul di panel kiri

> **Penting:** Jangan gunakan **Import** dari proyek kosong — langsung **Open** file `.bmpr` ini.

### Salin ke folder instalasi Balsamiq (opsional)

Jalankan PowerShell **sebagai Administrator**, lalu:

```powershell
Copy-Item "D:\TA2\gamifikasiFE\design\balsamiq\Gamifikasi-PAUD.bmpr" `
  "C:\Program Files\Balsamiq\Balsamiq Wireframes\Gamifikasi-PAUD.bmpr"
```

Setelah itu buka dari **File → Open** di Balsamiq.

## Daftar layar

| No | Wireframe | Route |
|----|-----------|-------|
| 01 | Sitemap | Peta navigasi |
| 02 | Login | `/login` |
| 03 | Dashboard Admin | `/dashboard` |
| 04 | Manajemen Tema | `/admin/tema` |
| 05 | Manajemen Soal | `/admin/soal` |
| 06 | Soal per Tema | `/admin/soal/:topicId` |
| 07 | Daftar Siswa (Admin) | `/admin/siswa` |
| 08 | Landing Siswa | `/student` |
| 09 | Daftar Siswa | `/student/daftar-siswa` |
| 10 | Pilih Topik | `/student/.../topics` |
| 11 | Kuis Quiz | Kuis — pilihan ganda |
| 12 | Feedback Benar | Kuis — jawaban benar |
| 13 | Kuis Pasangkan | Kuis — cocokkan |
| 14 | Feedback Salah | Kuis — jawaban salah |
| 15 | Drag & Drop | Kuis — seret lepas |
| 16 | Drag & Drop Selesai | Kuis — semua kartu terisi |
| 17 | Hasil Kuis | Kuis — skor akhir |

## Regenerate

```bash
cd gamifikasiFE
python design/balsamiq/generate_balsamiq.py
```

Perintah di atas akan:
1. Membuat ulang semua file `.bmml` di `screens/`
2. Mengompilasi `Gamifikasi-PAUD.bmpr`

Hanya compile `.bmpr` dari BMML yang ada:

```bash
python design/balsamiq/build_bmpr.py
```
