# Contoh Penggunaan PDF Compressor

Dokumen ini berisi berbagai contoh penggunaan script `compress.py` untuk berbagai skenario.

## Daftar Isi

1. [Mode Interaktif](#mode-interaktif)
2. [Single File Compression](#single-file-compression)
3. [Batch Compression](#batch-compression)
4. [Quick Mode](#quick-mode)
5. [Skenario Real World](#skenario-real-world)

---

## Mode Interaktif

### Cara Paling Mudah - Tanpa Perlu Ingat Command

```bash
python compress.py
```

Anda akan melihat menu seperti ini:

```
======================================================================
PDF COMPRESSOR - Mode Interaktif
======================================================================

Pilih mode kompresi:
  1. Kompresi satu file
  2. Kompresi batch (semua PDF dalam folder)
  3. Kompresi file di folder input/
  4. Keluar

Pilihan Anda (1-4):
```

### Contoh Flow Opsi 1 (Single File)

```
Pilihan Anda (1-4): 1

----------------------------------------------------------------------
MODE: Kompresi Satu File
----------------------------------------------------------------------

Masukkan path file PDF input: D:\Documents\report.pdf
Masukkan path output (kosongkan untuk auto): 
Masukkan kualitas (1-100, default 75): 70

[Proses kompresi berjalan...]
```

### Contoh Flow Opsi 3 (Quick)

```
Pilihan Anda (1-4): 3

----------------------------------------------------------------------
MODE: Kompresi File di Folder input/
----------------------------------------------------------------------

Ditemukan 3 file PDF:
  1. document1.pdf (15.50 MB)
  2. document2.pdf (8.20 MB)
  3. document3.pdf (22.10 MB)

Masukkan kualitas (1-100, default 75): 75

Kompresi 3 file dengan kualitas 75%? (y/n): y

[Proses kompresi berjalan...]
```

---

## Single File Compression

### Contoh 1: Kompresi dengan Output Otomatis

```bash
python compress.py -s "D:\Documents\report.pdf"
```

**Hasil**: File akan tersimpan sebagai `D:\Documents\compressed_report.pdf`

### Contoh 2: Kompresi dengan Output Custom

```bash
python compress.py -s "D:\Documents\report.pdf" "D:\Compressed\report_small.pdf"
```

**Hasil**: File tersimpan di `D:\Compressed\report_small.pdf`

### Contoh 3: Kompresi dengan Kualitas Custom

```bash
# Kualitas rendah (ukuran lebih kecil)
python compress.py -s "report.pdf" "report_small.pdf" 50

# Kualitas tinggi (ukuran lebih besar)
python compress.py -s "report.pdf" "report_high.pdf" 90
```

### Contoh 4: File dengan Spasi di Nama

```bash
# Windows
python compress.py -s "D:\My Documents\Annual Report 2024.pdf"

# Atau dengan quotes
python compress.py -s "D:\My Documents\Annual Report 2024.pdf" "D:\Output\Report 2024 Compressed.pdf"
```

---

## Batch Compression

### Contoh 1: Kompresi Semua PDF di Folder

```bash
python compress.py -b "D:\Documents\PDFs"
```

**Hasil**: Semua PDF di folder tersebut akan dikompresi dan disimpan di `D:\Documents\PDFs\compressed\`

### Contoh 2: Batch dengan Output Folder Custom

```bash
python compress.py -b "D:\Documents\PDFs" "D:\Compressed\Output"
```

**Hasil**: Semua file hasil kompresi tersimpan di `D:\Compressed\Output\`

### Contoh 3: Batch dengan Kualitas Custom

```bash
# Kompresi maksimal (kualitas 50%)
python compress.py -b "D:\Documents\PDFs" "D:\Output" 50

# Kompresi minimal (kualitas 90%)
python compress.py -b "D:\Documents\PDFs" "D:\Output" 90
```

### Contoh 4: Batch Processing Banyak File

```bash
# Misalnya ada 50 file PDF di folder
python compress.py -b "D:\Archive\2024" "D:\Archive\2024_Compressed" 70
```

**Output**:
```
======================================================================
Batch Kompresi PDF - 50 file
======================================================================
Input folder : D:\Archive\2024
Output folder: D:\Archive\2024_Compressed
Kualitas     : 70%

[1/50] Memproses: document1.pdf
...
[50/50] Memproses: document50.pdf

======================================================================
Batch Kompresi Selesai!
======================================================================
✓ Berhasil: 50 file
```

---

## Quick Mode

Mode tercepat untuk kompresi file di folder `input/`.

### Contoh 1: Quick Mode Default

```bash
python compress.py -q
```

**Apa yang terjadi**:
- Semua PDF di folder `input/` akan dikompresi
- Kualitas default: 75%
- Hasil tersimpan di folder `output/`

### Contoh 2: Quick Mode dengan Kualitas Custom

```bash
# Kualitas rendah (ukuran sangat kecil)
python compress.py -q 40

# Kualitas sedang (recommended)
python compress.py -q 75

# Kualitas tinggi (ukuran lebih besar)
python compress.py -q 85
```

### Contoh 3: Workflow Harian

```bash
# 1. Copy file PDF ke folder input/
# 2. Jalankan quick mode
python compress.py -q 75

# 3. Ambil hasil dari folder output/
```

---

## Skenario Real World

### Skenario 1: Kompresi untuk Email

**Problem**: File PDF 25 MB terlalu besar untuk email (limit 10 MB)

**Solusi**:
```bash
python compress.py -s "proposal.pdf" "proposal_email.pdf" 60
```

**Hasil**: File menjadi ~8 MB, bisa dikirim via email

### Skenario 2: Arsip Dokumen Lama

**Problem**: Punya 100 dokumen lama yang jarang dibuka, makan space 2 GB

**Solusi**:
```bash
python compress.py -b "D:\Archive\Old_Documents" "D:\Archive\Compressed" 50
```

**Hasil**: Total ukuran menjadi ~700 MB, hemat 65% space

### Skenario 3: Batch Processing Laporan Bulanan

**Problem**: Setiap bulan ada 20-30 laporan PDF yang perlu dikompresi

**Solusi**:
```bash
# Letakkan semua laporan di folder input/
# Jalankan quick mode
python compress.py -q 70

# Hasil langsung tersedia di output/
```

### Skenario 4: Kompresi untuk Website

**Problem**: Upload PDF ke website, perlu ukuran kecil tapi tetap readable

**Solusi**:
```bash
python compress.py -s "user_manual.pdf" "user_manual_web.pdf" 65
```

**Hasil**: File cukup kecil untuk web, kualitas masih bagus

### Skenario 5: Backup Space-Efficient

**Problem**: Backup dokumen penting tapi space terbatas

**Solusi**:
```bash
# Kompresi dengan kualitas tinggi (tetap bagus)
python compress.py -b "D:\Important_Docs" "E:\Backup\Docs_Compressed" 85
```

**Hasil**: Hemat space ~40-50%, kualitas masih sangat baik

---

## Tips & Tricks

### 1. Memilih Kualitas yang Tepat

| Kualitas | Ukuran | Kasus Penggunaan |
|----------|--------|------------------|
| 30-50 | Sangat kecil | Arsip, backup, dokumen jarang dibuka |
| 50-70 | Kecil | Email, sharing, web upload |
| 70-85 | Sedang | Dokumen kerja, presentasi |
| 85-95 | Besar | Dokumen penting, kontrak, legal |

### 2. Test Dulu dengan Satu File

Sebelum batch processing, test dulu dengan satu file:

```bash
python compress.py -s "sample.pdf" "test_output.pdf" 70
```

Cek hasilnya, kalau puas baru batch processing.

### 3. Gunakan Quick Mode untuk Rutinitas

Buat workflow harian:
1. Pagi: Copy file ke `input/`
2. Jalankan: `python compress.py -q`
3. Ambil hasil dari `output/`

### 4. Backup Sebelum Kompresi Batch

Untuk file penting, backup dulu sebelum kompresi:

```bash
# Backup
xcopy "D:\Important" "E:\Backup\Important" /E /I

# Baru kompresi
python compress.py -b "D:\Important" "D:\Important_Compressed" 75
```

### 5. Kombinasi dengan Script Lain

```bash
# Contoh: Kompresi lalu upload ke cloud
python compress.py -q 70
# Lalu jalankan script upload
python upload_to_cloud.py output/
```

---

## Troubleshooting

### Error: File tidak ditemukan

**Solusi**: Pastikan path benar, gunakan quotes untuk path dengan spasi

```bash
# Salah
python compress.py -s D:\My Documents\file.pdf

# Benar
python compress.py -s "D:\My Documents\file.pdf"
```

### Hasil kompresi terlalu blur

**Solusi**: Naikkan kualitas

```bash
# Dari 50 ke 80
python compress.py -s input.pdf output.pdf 80
```

### Ukuran tidak berkurang banyak

**Solusi**: Turunkan kualitas atau file memang sudah optimal

```bash
# Coba kualitas lebih rendah
python compress.py -s input.pdf output.pdf 50
```

---

## Command Reference Cepat

```bash
# Interactive mode
python compress.py

# Single file
python compress.py -s <input> [output] [quality]

# Batch
python compress.py -b <folder> [output_folder] [quality]

# Quick
python compress.py -q [quality]

# Help
python compress.py -h
```
