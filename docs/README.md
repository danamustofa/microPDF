# API Reference - compress_pdf.py

Library Python di balik microPDF. Semua fungsi mengembalikan `bool` dan mencetak
progresnya ke stdout - Electron membaca cetakan itu untuk menggerakkan progress bar.

## Instalasi

```bash
pip install -r requirements.txt
```

Ghostscript opsional tapi sangat dianjurkan: dua dari tiga engine memakainya.
Ambil dengan `scripts/fetch-ghostscript.ps1`, atau tunjuk lewat env `MICROPDF_GS`.

---

## Fungsi utama

### `compress_pdf_hybrid(input_path, output_path, image_quality=80)`

**Ini yang dipakai aplikasi dan CLI.** Menjalankan ketiga engine, membuang
kandidat yang gagal validasi, lalu menyalin kandidat valid **terkecil** ke
`output_path`. Kalau tidak ada yang lebih kecil, file asli disalin apa adanya dan
laporannya jujur: PDF itu memang sudah teroptimasi.

```python
from compress_pdf import compress_pdf_hybrid

compress_pdf_hybrid('input.pdf', 'output.pdf', image_quality=80)
```

| Parameter | Keterangan |
|-----------|------------|
| `input_path` | Path PDF sumber |
| `output_path` | Path hasil |
| `image_quality` | 1-100. Makin rendah makin kecil ukurannya (default 80) |

---

## Engine

Ketiganya bisa dipanggil sendiri-sendiri, misalnya untuk membandingkan hasil.

### `compress_pdf_images(input_path, output_path, image_quality=50)`

Mengompres ulang XObject gambar di dalam PDF (PyPDF2 + Pillow). Kuat untuk hasil
scan. Gambar yang tidak bisa diproses dibiarkan utuh, bukan dirusak.

### `compress_pdf_ghostscript(input_path, output_path, image_quality=80, gs_binary=None)`

Menulis ulang seluruh dokumen lewat `pdfwrite`, termasuk content stream yang tidak
bisa disentuh engine images. Kualitas 1-100 dipetakan ke dpi lewat `_DPI_ANCHORS`
(72 = `/screen`, 150 = `/ebook`, 300 = `/printer`).

> Mengembalikan `True` hanya berarti Ghostscript keluar dengan sukses. Hasilnya
> **tetap wajib** dicek dengan `validate_output()` - gs bisa error tapi tetap
> menulis PDF yang tidak lengkap.

### `compress_pdf_raster(input_path, output_path, dpi=150, colors=16, gs_binary=None)`

Untuk PDF hasil print-to-PDF yang teksnya di-outline jadi path. Halaman semacam itu
dirender ulang jadi gambar indexed-color; halaman lain disalin apa adanya sehingga
teks yang bisa diseleksi tetap utuh dan identik.

Engine ini melewati file kalau halaman semacam itu kurang dari 25% isi file.

```python
from compress_pdf import compress_pdf_raster

compress_pdf_raster('spt.pdf', 'spt_kecil.pdf', dpi=150, colors=16)
# 46.90 MB -> 18.22 MB (61.16%), 206 halaman tetap 206
```

### `compress_pdf_basic(input_path, output_path, compression_level='medium')`

Hanya membersihkan metadata dan mengompres content stream. Peninggalan versi awal,
tidak dipakai jalur hybrid.

---

## Utilitas

### `validate_output(input_path, output_path) -> (bool, str)`

Gerbang yang harus dilewati setiap kandidat:

1. file output ada dan tidak kosong,
2. ukurannya benar-benar lebih kecil dari sumber,
3. PDF-nya terbaca,
4. **jumlah halamannya sama persis** dengan sumber.

Poin 4 bukan formalitas: pada file uji 31 MB / 286 halaman, Ghostscript pernah
menulis stub 20 KB berisi 1 halaman. Tanpa cek ini, itu akan terbaca sebagai
"kompresi 99.9% berhasil" sambil membuang 285 halaman.

### `detect_outline_pages(reader) -> (list[int], int)`

Mencari halaman bervektor berat yang tidak punya operator teks. Mengembalikan nomor
halaman (1-based) dan total byte content yang dicakup. Operator teks dihitung dengan
meng-inflate 256 KB pertama tiap stream saja - mendekompresi semuanya justru lebih
lama daripada me-render halamannya.

### `find_ghostscript() -> str | None`

Urutan pencarian: env `MICROPDF_GS` → `vendor/ghostscript/bin/` → PATH → lokasi
instalasi umum Windows.

### `batch_compress_pdfs(input_folder, output_folder, method='basic')`

Memproses semua PDF dalam satu folder. `method` bisa `'hybrid'`, `'images'`, atau
`'basic'`.

---

## Catatan

- Semua fungsi mencetak ukuran sebelum/sesudah dan persentase penguranganya.
- Berapa besar hasilnya jauh lebih ditentukan oleh **jenis PDF**-nya daripada oleh
  angka kualitas. Lihat [Compression Results](../README.md#-compression-results).
- Di Windows, jalankan Python dengan `PYTHONIOENCODING=utf-8`. Stdout yang dipipe
  memakai cp1252 dan akan `UnicodeEncodeError` pada karakter `✓`/`✗` yang dicetak
  fungsi-fungsi ini.
