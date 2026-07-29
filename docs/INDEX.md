# 📚 Dokumentasi microPDF

Selamat datang di dokumentasi microPDF - aplikasi kompresi PDF yang simple, cepat, dan elegan.

**Version**: 2026.3.0 (three-engine hybrid)  
**Last Updated**: July 29, 2026

---

## 🚀 Quick Start

### Untuk Pengguna Aplikasi Desktop
Baca **[ELECTRON_GUIDE.md](ELECTRON_GUIDE.md)** untuk panduan lengkap menggunakan aplikasi desktop.

### Untuk Pengguna CLI Script
Baca **[QUICK_START.md](QUICK_START.md)** untuk memulai dengan command-line interface.

---

## 📖 Daftar Dokumentasi

### 🎯 User Guides

| Dokumen | Deskripsi |
|---------|-----------|
| **[ELECTRON_GUIDE.md](ELECTRON_GUIDE.md)** | Panduan lengkap aplikasi desktop Electron |
| **[QUICK_START.md](QUICK_START.md)** | Panduan cepat untuk CLI script |
| **[USAGE_EXAMPLES.md](USAGE_EXAMPLES.md)** | Contoh penggunaan CLI dengan berbagai skenario |

### 🛠️ Developer Documentation

| Dokumen | Deskripsi |
|---------|-----------|
| **[TECHNICAL_DETAILS.md](TECHNICAL_DETAILS.md)** | Detail teknis arsitektur dan implementasi |
| **[README.md](README.md)** | API reference untuk library Python |
| **[BUG_FIXES.md](BUG_FIXES.md)** | Dokumentasi bug fixes yang telah dilakukan |
| **[CUSTOM_QUALITY.md](CUSTOM_QUALITY.md)** | Dokumentasi fitur custom quality (1-49%) |

### 📋 Project Information

| Dokumen | Deskripsi | Lokasi |
|---------|-----------|--------|
| **CHANGELOG.md** | Riwayat perubahan versi | `../CHANGELOG.md` |
| **PROJECT_INFO.md** | Struktur project & cleanup history | `PROJECT_INFO.md` |
| **README.md** | Dokumentasi utama project | `../README.md` |
| **INSTALLATION.md** | Panduan instalasi lengkap | `../INSTALLATION.md` |
| **CONTRIBUTING.md** | Panduan kontribusi | `../CONTRIBUTING.md` |

---

## 🎯 Navigasi Cepat

### Saya ingin...

#### 📱 Menggunakan aplikasi desktop
→ **[ELECTRON_GUIDE.md](ELECTRON_GUIDE.md)** - Panduan lengkap dari instalasi hingga troubleshooting

#### 💻 Menggunakan CLI script
→ **[QUICK_START.md](QUICK_START.md)** - Mulai dengan mode interaktif  
→ **[USAGE_EXAMPLES.md](USAGE_EXAMPLES.md)** - Lihat contoh penggunaan

#### 🔧 Memahami cara kerja aplikasi
→ **[TECHNICAL_DETAILS.md](TECHNICAL_DETAILS.md)** - Arsitektur, algoritma, dan implementasi

#### 🐛 Mengatasi masalah
→ **[ELECTRON_GUIDE.md](ELECTRON_GUIDE.md)** - Bagian Troubleshooting  
→ **[BUG_FIXES.md](BUG_FIXES.md)** - Perbaikan bug yang telah dilakukan

#### 📦 Menginstall aplikasi
→ **[INSTALLATION.md](../INSTALLATION.md)** - Panduan instalasi untuk semua platform

#### 🤝 Berkontribusi ke project
→ **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Panduan kontribusi

#### 📜 Melihat riwayat perubahan
→ **[CHANGELOG.md](../CHANGELOG.md)** - Semua perubahan dari versi ke versi

#### 🎚️ Menggunakan custom quality
→ **[CUSTOM_QUALITY.md](CUSTOM_QUALITY.md)** - Panduan fitur custom quality (1-49%)

#### 📁 Memahami struktur project
→ **[PROJECT_INFO.md](PROJECT_INFO.md)** - Struktur lengkap dan maintenance guide

---

## 📊 Struktur Dokumentasi

```
compresfile/
├── README.md                    # Dokumentasi utama project
├── CHANGELOG.md                 # Riwayat perubahan
├── INSTALLATION.md              # Panduan instalasi
├── CONTRIBUTING.md              # Panduan kontribusi
│
└── docs/
    ├── INDEX.md                 # File ini (navigasi) 📍
    │
    ├── 🎯 USER GUIDES
    │   ├── ELECTRON_GUIDE.md    # Panduan aplikasi desktop
    │   ├── QUICK_START.md       # Panduan cepat CLI
    │   └── USAGE_EXAMPLES.md    # Contoh penggunaan CLI
    │
    ├── 🛠️ DEVELOPER DOCS
    │   ├── TECHNICAL_DETAILS.md # Detail teknis
    │   ├── README.md            # API reference
    │   ├── BUG_FIXES.md         # Bug fixes history
    │   └── CUSTOM_QUALITY.md    # Custom quality feature
    │
    └── 📋 PROJECT INFO
        └── PROJECT_INFO.md      # Struktur & maintenance
```

---

## 🚀 Quick Reference

### Desktop App (Electron)
```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Run app
npm start

# Build for production
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

### CLI Script (Python)
```bash
# Install dependencies
pip install -r requirements.txt

# Interactive mode (recommended)
python compress.py

# Quick mode
python compress.py -q 75

# Single file
python compress.py -s input.pdf output.pdf 80

# Batch folder
python compress.py -b input_folder output_folder 70
```

---

## ✨ Fitur Utama

### Desktop Application
- 🔀 3 engine kompresi, hasil valid terkecil yang dipakai
- 🖱️ Drag & drop interface
- 📦 Batch processing (multiple files)
- 🎚️ 6 quality options (90%, 80%, 70%, 60%, 50%, Custom 1-49%)
- 📊 Progres per halaman + tombol Cancel yang benar-benar berhenti
- 📁 Custom output folder
- 📈 Compression statistics & riwayat
- 🎨 Modern blue theme

### CLI Script
- 🎯 4 mode operasi (interactive, single, batch, quick)
- ⚙️ Adjustable quality (1-100)
- 📊 Progress display
- 📈 Compression statistics
- 🔄 Auto output path generation

---

## 📞 Bantuan & Support

Jika Anda mengalami masalah:

1. **Cek dokumentasi** - Baca panduan yang relevan
2. **Troubleshooting** - Lihat bagian troubleshooting di [ELECTRON_GUIDE.md](ELECTRON_GUIDE.md)
3. **Bug fixes** - Cek [BUG_FIXES.md](BUG_FIXES.md) untuk bug yang sudah diperbaiki
4. **GitHub Issues** - Buat issue baru di repository

---

## 📝 Catatan Versi

**Version**: 2026.3.0 (three-engine hybrid)  
**Last Updated**: July 29, 2026  
**Total Docs**: 9 files (organized in docs/)

### Perubahan Terbaru
- ✅ Engine ketiga (**raster**) untuk PDF yang teksnya di-outline — 46,90 MB → 18,22 MB
- ✅ Progres kini mengalir per halaman, tidak lagi diam di 0%
- ✅ Tombol Cancel benar-benar menghentikan proses (termasuk Ghostscript)
- ✅ Pencarian interpreter Python otomatis (tidak lagi kena stub Microsoft Store)
- ✅ Perbaikan 7 critical bugs & fitur custom quality (1-49%)

---

**Selamat menggunakan microPDF! 🎉**
