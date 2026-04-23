# Changelog

## [2.0.0] - 2026-04-22

### ✨ Added
- **Script baru `compress.py`** - Script dinamis dengan multiple mode:
  - Mode Interaktif dengan menu user-friendly
  - Single file compression dengan CLI
  - Batch processing dengan CLI
  - Quick mode untuk kompresi cepat folder input/
- **Auto output path generation** - Tidak perlu manual input path output
- **Kualitas adjustable** - Parameter kualitas 1-100 untuk kontrol kompresi
- **Progress display** - Menampilkan progress saat batch processing
- **Compression statistics** - Menampilkan ukuran sebelum/sesudah dan persentase

### 📚 Documentation
- **README.md** - Dokumentasi utama yang lebih jelas
- **docs/INDEX.md** - Index dokumentasi lengkap
- **docs/QUICK_START.md** - Panduan quick start untuk pemula
- **docs/USAGE_EXAMPLES.md** - Contoh penggunaan lengkap dengan berbagai skenario
- **CHANGELOG.md** - File ini

### 🗂️ Reorganization
- Membuat folder `docs/` untuk semua file dokumentasi
- Memindahkan semua file `.md` ke folder `docs/`
- Struktur folder lebih rapi dan terorganisir

### 🗑️ Removed
- **compress_mecoindo.py** - Digantikan dengan `compress.py` yang lebih fleksibel
- **example_usage.py** - Digantikan dengan mode interaktif di `compress.py`

### 🔧 Improved
- Kode lebih modular dan maintainable
- User experience lebih baik dengan multiple mode
- Dokumentasi lebih lengkap dan terstruktur

---

## [1.0.0] - Sebelumnya

### Initial Release
- Script `compress_pdf.py` dengan fungsi dasar kompresi
- Script `compress_mecoindo.py` untuk kompresi file spesifik
- Script `example_usage.py` untuk contoh penggunaan
- Dokumentasi dasar
