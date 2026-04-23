# Electron App - Complete Guide

## 📱 Tentang Aplikasi

PDF Compressor adalah aplikasi desktop untuk kompresi PDF dengan interface yang simple, elegan, dan minimalis.

### Fitur Utama
- ✅ **Drag & Drop** - Seret file PDF langsung ke aplikasi
- ✅ **Multiple Files** - Kompresi banyak file sekaligus
- ✅ **4 Preset Kualitas** - 90%, 80%, 70%, 50%
- ✅ **Custom Output Path** - Pilih folder output sesuai keinginan
- ✅ **Real-time Progress** - Lihat progress kompresi dengan animasi
- ✅ **Statistics** - Lihat hasil kompresi (ukuran, persentase hemat)
- ✅ **Modern UI** - Desain minimalis dengan animasi smooth

---

## 🚀 Quick Start

### 1. Install Dependencies (Pertama Kali)

```bash
# Di folder compresfile/
npm install
```

Tunggu hingga selesai (2-5 menit tergantung koneksi internet).

### 2. Jalankan Aplikasi

```bash
npm start
```

Aplikasi akan terbuka otomatis!

---

## 💡 Cara Menggunakan

### Step 1: Tambah File
- **Drag & drop** file PDF ke window aplikasi
- Atau klik **"Select Files"**
- Support multiple files sekaligus

### Step 2: Pilih Kualitas
Klik salah satu tombol:
- **High (90%)** - Untuk dokumen penting, kontrak
- **Good (80%)** - Recommended untuk umum ✅
- **Medium (70%)** - Untuk email, sharing
- **Low (50%)** - Untuk arsip, backup

### Step 3: Pilih Output Folder
- Klik **"Browse"**
- Pilih folder untuk menyimpan hasil

### Step 4: Compress!
- Klik **"Start Compression"**
- Tunggu hingga progress selesai
- Lihat statistik hasil kompresi
- Klik **"Open Output Folder"** untuk lihat hasil

---

## 🎯 Preset Kualitas

| Preset | Kualitas | Ukuran | Use Case |
|--------|----------|--------|----------|
| High (90%) | ⭐⭐⭐⭐⭐ | Besar | Dokumen penting, kontrak |
| Good (80%) | ⭐⭐⭐⭐ | Sedang | Dokumen kerja (recommended) |
| Medium (70%) | ⭐⭐⭐ | Kecil | Email, sharing |
| Low (50%) | ⭐⭐ | Sangat kecil | Arsip, backup |

### Contoh Hasil

**Test File**: 31.04 MB, 286 halaman

| Quality | Compressed Size | Reduction | Difference |
|---------|----------------|-----------|------------|
| 90% | 11.84 MB | 61.84% | Baseline |
| 80% | ~10.5 MB | ~66% | -1.3 MB vs 90% |
| 70% | 9.98 MB | 67.85% | -1.86 MB vs 90% |
| 50% | 8.67 MB | 72.06% | -3.17 MB vs 90% |

---

## 🛠️ Build untuk Production

### Build Installer

```bash
# Windows
npm run build:win
# Output: dist/PDF Compressor Setup.exe

# Mac
npm run build:mac
# Output: dist/PDF Compressor.dmg

# Linux
npm run build:linux
# Output: dist/PDF Compressor.AppImage
```

---

## 🎨 Tema Warna

### Color Palette

#### Submarine Blue (Primary)
- **Hex**: `#054da2`
- **Usage**: Main buttons, header, active states

#### Light Blue (Secondary)
- **Hex**: `#00aeef`
- **Usage**: Button hover, progress bar

#### Gold Yellow (Accent)
- **Hex**: `#fdb813`
- **Usage**: Progress bar accent

#### Dark Blue (Deep)
- **Hex**: `#2E3192`
- **Usage**: Background gradient

#### Green Tosca (Success)
- **Hex**: `#00b091`
- **Usage**: Success states, completion

### Gradients

**Background:**
```css
background: linear-gradient(135deg, #054da2 0%, #2E3192 100%);
```

**Progress Bar:**
```css
background: linear-gradient(90deg, #054da2 0%, #00aeef 50%, #fdb813 100%);
```

**Compress Button:**
```css
background: linear-gradient(135deg, #00b091 0%, #054da2 100%);
```

---

## 🔧 Troubleshooting

### File Size Tidak Ditampilkan (0 Bytes)

**Solusi:**
1. Pastikan IPC handler terdaftar di `main.js`
2. Cek preload script expose API dengan benar
3. Test manual di DevTools console:
```javascript
await window.electronAPI.getFileSize('C:\\path\\to\\file.pdf')
```

### Compression Gagal

**Solusi:**
1. Cek Python terinstall: `python --version`
2. Install dependencies: `pip install -r requirements.txt`
3. Test Python script manual:
```bash
python compress.py -s input.pdf output.pdf 75
```

### Statistics Tidak Akurat

**Solusi:**
1. Buka DevTools (F12)
2. Cek console untuk error
3. Pastikan Python output format benar:
```
SUCCESS|<original_size>|<compressed_size>|<reduction>
```

### Aplikasi Tidak Mau Start

**Solusi:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
npm start
```

---

## 📊 Performance

### Compression Speed
- Small file (1 MB): ~1-2 seconds
- Medium file (10 MB): ~5-10 seconds
- Large file (50 MB): ~20-30 seconds

### Memory Usage
- Idle: ~100 MB
- Processing: ~200-300 MB
- Peak: ~500 MB (large files)

---

## 💡 Tips & Best Practices

### Untuk Hasil Terbaik
- Gunakan kualitas **80%** (Good) untuk balance
- Pilih output folder yang mudah diakses (Desktop/Documents)
- Test dengan 1 file dulu sebelum batch banyak file

### Untuk Ukuran Terkecil
- Gunakan kualitas **50%** (Low)
- Cocok untuk file yang jarang dibuka

### Untuk Dokumen Penting
- Gunakan kualitas **90%** (High)
- Kualitas tetap bagus, ukuran tidak terlalu kecil

### Pro Tips
1. **Batch Processing**: Drag 10-20 files sekaligus untuk efisiensi
2. **Bookmark Output**: Simpan folder output favorit
3. **Quality Check**: Selalu buka hasil kompresi untuk cek kualitas
4. **Keep Originals**: Simpan file asli sampai yakin hasil OK

---

## 📁 Struktur Project

```
compresfile/
├── electron/
│   ├── main.js              # Electron main process
│   ├── preload.js           # IPC bridge (security)
│   ├── renderer.js          # Frontend logic
│   ├── index.html           # UI layout
│   ├── styles.css           # Styling
│   └── assets/              # Icons
├── compress_pdf.py          # Python compression library
├── package.json             # Node.js config
└── requirements.txt         # Python dependencies
```

---

## 🔐 Security

### Electron Security
- ✅ Context Isolation enabled
- ✅ Node Integration disabled
- ✅ Preload script for IPC
- ✅ No eval() or dangerous APIs

### File Handling
- ✅ File type validation (PDF only)
- ✅ Path sanitization
- ✅ Temp file cleanup
- ✅ Error handling

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Custom quality slider (1-100)
- [ ] File preview
- [ ] Compression history
- [ ] Batch rename options
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Auto-update

---

**Version**: 2.3.0  
**Last Updated**: April 2026  
**Status**: Production Ready ✅

