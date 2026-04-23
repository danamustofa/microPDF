# Quick Start Guide

## Cara Tercepat Menggunakan PDF Compressor

### Opsi 1: Mode Interaktif (Paling Mudah)

```bash
python compress.py
```

Kemudian pilih opsi 3 untuk kompresi cepat file di folder `input/`.

### Opsi 2: Quick Command

```bash
python compress.py -q
```

Ini akan langsung kompresi semua PDF di folder `input/` dengan kualitas 75%.

### Opsi 3: Single File Cepat

```bash
python compress.py -s "path/to/file.pdf"
```

File hasil akan otomatis tersimpan dengan nama `compressed_file.pdf` di folder yang sama.

## Workflow Recommended

1. **Letakkan file PDF** yang ingin dikompresi di folder `input/`
2. **Jalankan**: `python compress.py -q`
3. **Hasil** akan tersimpan di folder `output/`

Selesai! 🎉

## Adjust Kualitas

Jika hasil terlalu besar atau terlalu blur:

```bash
# Lebih kecil (kualitas lebih rendah)
python compress.py -q 50

# Lebih besar (kualitas lebih tinggi)
python compress.py -q 85
```

## Contoh Real

```bash
# Sebelum
input/Mecoindo_Dokumen Lokal_FY2022 1.pdf (31 MB)

# Jalankan
python compress.py -q 75

# Sesudah
output/compressed_Mecoindo_Dokumen Lokal_FY2022 1.pdf (11 MB)
# Hemat 63%!
```
