# PDF Compressor

Script Python untuk mengkompresi file PDF dengan berbagai metode.

## Instalasi

Instal dependencies yang diperlukan:

```bash
pip install -r requirements.txt
```

## Cara Penggunaan

### 1. Kompresi Dasar (Basic Compression)

Mengkompresi PDF dengan menghapus metadata dan mengoptimalkan struktur:

```python
from compress_pdf import compress_pdf_basic

compress_pdf_basic('input.pdf', 'output_compressed.pdf')
```

### 2. Kompresi dengan Optimasi Gambar

Mengkompresi PDF dengan mengoptimalkan gambar di dalamnya:

```python
from compress_pdf import compress_pdf_images

# image_quality: 1-100 (semakin rendah = ukuran lebih kecil, kualitas lebih rendah)
compress_pdf_images('input.pdf', 'output_compressed.pdf', image_quality=60)
```

### 3. Kompresi Batch (Multiple Files)

Mengkompresi semua file PDF dalam satu folder:

```python
from compress_pdf import batch_compress_pdfs

# Method: 'basic' atau 'images'
batch_compress_pdfs('input_folder', 'output_folder', method='basic')
```

## Contoh Lengkap

```python
from compress_pdf import compress_pdf_basic, compress_pdf_images, batch_compress_pdfs

# Kompresi satu file dengan metode dasar
compress_pdf_basic('dokumen.pdf', 'dokumen_compressed.pdf')

# Kompresi dengan kualitas gambar 50%
compress_pdf_images('foto_banyak.pdf', 'foto_compressed.pdf', image_quality=50)

# Kompresi semua PDF di folder 'pdfs' dan simpan ke 'compressed_pdfs'
batch_compress_pdfs('pdfs', 'compressed_pdfs', method='images')
```

## Parameter

### compress_pdf_basic()
- `input_path`: Path ke file PDF input
- `output_path`: Path untuk menyimpan hasil kompresi
- `compression_level`: Level kompresi ('low', 'medium', 'high') - opsional

### compress_pdf_images()
- `input_path`: Path ke file PDF input
- `output_path`: Path untuk menyimpan hasil kompresi
- `image_quality`: Kualitas gambar 1-100 (default: 50)

### batch_compress_pdfs()
- `input_folder`: Folder yang berisi file PDF
- `output_folder`: Folder untuk menyimpan hasil
- `method`: Metode kompresi ('basic' atau 'images')

## Tips

- Untuk PDF dengan banyak teks: gunakan `compress_pdf_basic()`
- Untuk PDF dengan banyak gambar: gunakan `compress_pdf_images()` dengan `image_quality=40-60`
- Untuk hasil terbaik: coba kedua metode dan bandingkan hasilnya

## Catatan

- Script ini akan menampilkan ukuran file sebelum dan sesudah kompresi
- Persentase pengurangan ukuran akan ditampilkan setelah proses selesai
- Beberapa PDF mungkin tidak bisa dikompresi lebih lanjut jika sudah optimal
