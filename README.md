# microPDF

<div align="center">
  <img src="electron/assets/icon.png" alt="microPDF Logo" width="120" height="120">
  
  <h3>Simple, Fast, and Elegant PDF Compression</h3>
  
  <p>
    <a href="#features">Features</a> •
    <a href="#download">Download</a> •
    <a href="#installation">Installation</a> •
    <a href="#usage">Usage</a> •
    <a href="#documentation">Documentation</a>
  </p>
  
  <p>
    <img src="https://img.shields.io/badge/version-2026.3.0-blue.svg" alt="Version">
    <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg" alt="Platform">
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  </p>
</div>

---

## 📖 About

**microPDF** is a modern desktop application for compressing PDF files with an intuitive interface. Built with Electron and Python, it offers powerful compression while maintaining document quality.

### Why microPDF?

- 🔀 **Three engines, best result wins** - no single technique wins on every PDF, so
  microPDF runs all three and keeps the smallest *validated* result
- 🛡️ **Never returns a broken file** - every candidate must stay readable and keep
  its page count, or it is thrown away
- 🎨 **Beautiful UI** - Clean, modern interface with smooth animations
- 🎯 **5 Quality Presets** - From high quality (90%) to maximum compression (50%)
- 📦 **Batch Processing** - Compress multiple files at once
- 🖱️ **Drag & Drop** - Simply drag files into the app
- 📊 **Live Progress** - Page-by-page updates, and Cancel really does stop the work
- 💾 **Space Saving** - 60-72% on scans, 55-65% on outlined-vector PDFs
  (see [Compression Results](#-compression-results) for what drives the difference)

---

## ✨ Features

### Desktop Application (Electron)

- ✅ **Drag & Drop Interface** - Intuitive file selection
- ✅ **Multiple Files Support** - Process many PDFs at once
- ✅ **5 Quality Presets**:
  - High (90%) - For important documents
  - Good (80%) - Recommended balance
  - Medium (70%) - For sharing
  - Fair (60%) - For email
  - Low (50%) - Maximum compression
- ✅ **Custom Output Folder** - Choose where to save
- ✅ **Live Progress** - Page counter that updates while the engine works, per phase
- ✅ **Working Cancel** - Stops the running compression, Ghostscript child included
- ✅ **Compression Statistics** - See size reduction and savings
- ✅ **History & Audit Log** - Past runs kept in `userData/history.json`
- ✅ **Modern Blue Theme** - Professional and elegant design

### CLI Script (Python)

- ✅ **Interactive Mode** - User-friendly menu
- ✅ **Single File Mode** - Compress one file
- ✅ **Batch Mode** - Compress entire folders
- ✅ **Quick Mode** - Fast compression with defaults
- ✅ **Adjustable Quality** - Fine-tune compression (1-100)

---

## 📥 Download

### Latest Release

**Version 2026.3.0**

| Platform | Download | Size |
|----------|----------|------|
| 🪟 **Windows** | [microPDF-Setup.exe](#) | ~80 MB |
| 🍎 **macOS** | [microPDF.dmg](#) | ~100 MB |
| 🐧 **Linux** | [microPDF.AppImage](#) | ~80 MB |

> **Note**: Download links will be available after the first release. See [Installation](#installation) for building from source.

---

## 🚀 Installation

### Option 1: Download Pre-built App (Recommended)

1. Download the installer for your platform from [Releases](#download)
2. Run the installer
3. Launch microPDF

### Option 2: Build from Source

#### Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**

#### Steps

```bash
# 1. Clone the repository
git clone https://github.com/danamustofa/microPDF.git
cd microPDF

# 2. Install Node dependencies
npm install

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Fetch Ghostscript, used by two of the three engines (~40 MB)
powershell -ExecutionPolicy Bypass -File scripts\fetch-ghostscript.ps1

# 5. Run the application
npm start
```

> **Note**: `vendor/` is gitignored because the Ghostscript binaries are large.
> Step 4 downloads and prunes them for you; re-run it after cloning or cleaning.
> microPDF still works without it - it just falls back to the images engine alone.

> **Windows and the `python` command**: microPDF does not call a bare `python`.
> Windows ships a stub at `WindowsApps\python.exe` that only advertises the
> Microsoft Store and exits with code 9009, and on many machines it shadows the
> real interpreter. `resolvePython()` probes `py -3`, `python`, `python3` and the
> usual install directories, then keeps the first one that can import PyPDF2 and
> Pillow. Set `MICROPDF_PYTHON` to a full path to override it.

#### Build Installers

```bash
# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac

# Build for Linux
npm run build:linux

# Build for all platforms
npm run build
```

Installers will be created in the `dist/` folder.

---

## 💡 Usage

### Desktop Application

1. **Launch microPDF**
2. **Add Files**:
   - Drag & drop PDF files into the window, OR
   - Click "Select Files" button
3. **Choose Quality**:
   - High (90%) - Best quality, larger size
   - Good (80%) - Recommended
   - Medium (70%) - Balanced
   - Fair (60%) - Smaller size
   - Low (50%) - Maximum compression
4. **Select Output Folder**:
   - Click "Browse" to choose destination
5. **Start Compression**:
   - Click "Start Compression"
   - Watch real-time progress
6. **View Results**:
   - See compression statistics
   - Click "Open Folder" to view files

### CLI Script

#### Interactive Mode (Easiest)

```bash
python compress.py
```

Follow the menu prompts.

#### Command Line Mode

```bash
# Single file
python compress.py -s input.pdf output.pdf 80

# Batch folder
python compress.py -b input_folder output_folder 70

# Quick mode (uses defaults)
python compress.py -q 75
```

---

## 📊 Compression Results

How much you save depends far more on **what kind of PDF you have** than on which
preset you pick. The numbers below are measured, not estimated.

### Scanned document - 31.04 MB, 286 pages

Images make up 54% of this file, so there is a lot to squeeze. Won by the **images** engine.

| Quality | Compressed Size | Reduction | Use Case |
|---------|----------------|-----------|----------|
| 90% | 11.83 MB | 61.90% | Important documents |
| 80% | 10.70 MB | 65.53% | **Recommended** |
| 70% | 9.96 MB | 67.91% | Sharing/Email |
| 60% | 9.30 MB | 70.05% | Web upload |
| 50% | 8.65 MB | 72.12% | Archive/Backup |

### Outlined-vector document - 46.90 MB, 206 pages

A tax form printed to PDF from a desktop application. Only 26% of this file is
images; 71% is page content streams. Won by the **raster** engine.

| Engine | Compressed Size | Reduction |
|--------|----------------|-----------|
| images | 43.95 MB | 6.3% |
| ghostscript | 39.44 MB | 15.9% |
| **raster** | **18.22 MB** | **61.2%** |

The trap in this file: 131 of its 206 pages carry ~41,000 path operators each and
**zero** text operators. The application outlined its text, so those pages are line
art wearing a vector costume - the images engine finds no image XObjects to squeeze,
and Ghostscript rewrites the paths at roughly their original size. Re-rendering just
those pages as indexed-colour images collapses 32.87 MB into 5.55 MB. The other 75
pages keep their real, selectable text untouched.

### What to expect

- **Scans and image-heavy PDFs**: 60-72% reduction
- **Outlined-vector PDFs** (print-to-PDF from desktop apps): 55-65% reduction
- **Genuine vector/text PDFs**: low single digits, sometimes nothing - there is
  real text on the page, so nothing gets rasterised
- **Already-optimised PDFs**: microPDF copies the file through and tells you so,
  rather than handing back something the same size or damaged

---

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[Quick Start Guide](docs/QUICK_START.md)** - Get started quickly
- **[Electron App Guide](docs/ELECTRON_GUIDE.md)** - Desktop app documentation
- **[Technical Details](docs/TECHNICAL_DETAILS.md)** - Architecture and implementation
- **[Usage Examples](docs/USAGE_EXAMPLES.md)** - CLI examples
- **[Changelog](docs/CHANGELOG.md)** - Version history

### Quick Links

- [Installation Guide](docs/ELECTRON_GUIDE.md#-quick-start)
- [Troubleshooting](docs/ELECTRON_GUIDE.md#-troubleshooting)
- [CLI Usage](docs/USAGE_EXAMPLES.md)
- [API Reference](docs/README.md)

---

## 🛠️ Technology Stack

- **Frontend**: Electron, HTML5, CSS3, JavaScript
- **Backend**: Python 3
- **Libraries**:
  - PyPDF2 - PDF manipulation
  - Pillow - Image processing
  - Electron - Desktop framework
- **Bundled**: Ghostscript, driving two of the three engines (see [Compression engines](#-compression-engines))

### 🔀 Compression engines

microPDF runs **three** engines on every file and keeps whichever result is smaller,
because none of them wins on all documents:

| Engine | Strong on | Weak on |
|--------|-----------|---------|
| **images** (PyPDF2 + Pillow) | Scanned documents - it recompresses the embedded images | Vector/text PDFs, where it only touches image XObjects |
| **ghostscript** (pdfwrite) | Vector/text PDFs - it rewrites page content streams | Some documents fail outright; at high DPI it can produce a *larger* file |
| **raster** (Ghostscript + Pillow) | Pages whose text was outlined into paths - it re-renders them at 150 dpi as indexed-colour images | Pages with real text, which it refuses to touch; skipped entirely unless such pages are ≥25% of the file |

Every candidate must pass validation before it can win:

1. the engine exited successfully,
2. the output is readable as a PDF,
3. the **page count matches the source**, and
4. the output is actually smaller than the input.

Step 3 is not optional. On a 31 MB / 286-page test file, Ghostscript exits with an
error yet still writes a 20 KB, 1-page PDF. Comparing file sizes alone would report
that as "99.9% compression" while silently discarding 285 pages.

#### When the raster engine steps in

Plenty of PDFs printed from desktop applications convert their text into outlines.
The result *looks* like a vector document, but every glyph is a set of paths: no
text to select, no image XObject to recompress. The images engine has nothing to
grab, and Ghostscript rewrites the paths at roughly their original size.

`detect_outline_pages()` finds those pages - a large content stream, no
text-showing operators - and only those get re-rendered. Two details decide the
outcome:

- **Indexed colour, not JPEG.** On sharp black-on-white line art, JPEG at q60 came
  out *larger* than the original vector (284 KB vs 335 KB per page). A 16-colour
  palette with Flate: 40 KB per page.
- **PNG scanlines are passed straight through.** A PNG's IDAT is already
  `/FlateDecode` + `/Predictor 15` as far as PDF is concerned, so
  `_png_to_pdf_image()` moves the bytes across without re-encoding. Writing the
  same page through Pillow's own PDF writer costs 4.9 MB; this costs 43 KB.

Pages carrying real text are copied through untouched, so selectable text stays
selectable and byte-identical.

If no candidate passes, the original file is copied through unchanged and microPDF
reports that the PDF is already optimised - it never returns a damaged document.

---

## 🎨 Screenshots

### Main Interface
![Main Interface](docs/screenshots/main-interface.png)

### Compression Progress
![Progress](docs/screenshots/progress.png)

### Results
![Results](docs/screenshots/results.png)

> **Note**: Screenshots will be added in the next update.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

```bash
# Clone the repo
git clone https://github.com/danamustofa/microPDF.git
cd microPDF

# Install dependencies
npm install
pip install -r requirements.txt

# Run in development mode
npm start
```

### Guidelines

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Ghostscript

microPDF bundles Ghostscript as its second compression engine. Ghostscript is
licensed under the **AGPLv3**, not MIT. If you redistribute a build that includes
it, that distribution must comply with the AGPL - or you need a commercial licence
from [Artifex](https://artifex.com/licensing/). The licence text ships alongside
the binaries as `vendor/ghostscript/COPYING-Ghostscript.txt`.

If you would rather not deal with this, delete `vendor/` and drop the
`extraResources` entry from [package.json](package.json). microPDF degrades
gracefully to the images engine on its own.

---

## 👤 Author

**Dana Mustofa**

- GitHub: [@danamustofa](https://github.com/danamustofa)

---

## 🙏 Acknowledgments

- Electron team for the amazing framework
- PyPDF2 and Pillow contributors
- All users and contributors

---

## 📮 Support

If you encounter any issues or have questions:

1. Check the [Documentation](docs/INDEX.md)
2. Search [Issues](https://github.com/danamustofa/microPDF/issues)
3. Create a [New Issue](https://github.com/danamustofa/microPDF/issues/new)

---

<div align="center">
  <p>Made with ❤️ by Dana Mustofa</p>
  <p>
    <a href="#micropdf">Back to Top ↑</a>
  </p>
</div>
