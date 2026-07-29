# Changelog

All notable changes to microPDF will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2026.3.0] - 2026-07-29

### Added - Raster Engine
- 🧱 **Third engine for outlined-vector pages**: `compress_pdf_raster()` re-renders
  pages whose text was converted to paths as 150 dpi indexed-colour images, and
  copies every other page through untouched. On a 206-page tax form it turns a
  4.50% result into **61.16%** (46.90 MB → 18.22 MB)
- 🔎 **Page classification**: `detect_outline_pages()` flags pages with a large
  content stream and no text-showing operators. Text ops are counted by inflating
  only the first 256 KB of each stream — decompressing them whole costs more time
  than the rendering does
- 🧮 **PNG IDAT passthrough**: `_png_to_pdf_image()` lifts Pillow's compressed
  scanlines straight into a PDF image XObject as `/FlateDecode` + `/Predictor 15`.
  Saving the same page through Pillow's own PDF writer costs 4.9 MB; this costs 43 KB
- 🛡️ **Conservative by default**: the engine skips the file unless such pages make
  up ≥25% of it, and its output still has to win on size and pass `validate_output()`

### Fixed
- 🐛 **Compression stuck at 0%**: the Electron bridge captured Python's stdout in a
  `StringIO` and only replayed the progress lines after the run finished, so a
  143-second job showed "Starting…" the whole way. Progress now streams live —
  `-u` on the interpreter, and `\r` treated as a line break like `\n`
- 🐛 **`python` resolving to the Microsoft Store stub**: `resolvePython()` in
  `electron/main.js` probes `py -3`, `python`, `python3` and the usual install
  directories, keeps the first interpreter that can import PyPDF2 and Pillow, and
  reports the exact `pip install` command when none can (was: `exit code 9009`)
- 🐛 **Cancel did nothing**: it only stopped the queue while the current file kept
  compressing. The `cancel-compression` IPC now kills the Python process tree,
  Ghostscript child included
- 🐛 **cp1252 crash on Windows**: piped stdout defaulted to the ANSI codepage and
  `UnicodeEncodeError`'d on the `✓`/`✗` the compressor prints, silently failing the
  images engine. The spawn now sets `PYTHONIOENCODING=utf-8`

## [2026.2.0] - 2026-07-29

### Added - Hybrid Compression Engine
- 🔀 **Two engines, best result wins**: every file is now run through both the
  existing images engine (PyPDF2 + Pillow) and a new Ghostscript engine, and the
  smaller *valid* result is kept — `compress_pdf_hybrid()`
- 🖨️ **Ghostscript engine**: `compress_pdf_ghostscript()` rewrites page content
  streams, which the images engine cannot touch. Quality 1–100 maps to image DPI
  via `_DPI_ANCHORS`, calibrated against `/screen` (72), `/ebook` (150) and
  `/printer` (300)
- 🛡️ **Output validation**: `validate_output()` rejects a candidate unless the
  engine exited cleanly, the PDF is readable, the **page count matches the
  source**, and the file is genuinely smaller
- 📦 **Bundled Ghostscript**: shipped via `extraResources`; `scripts/fetch-ghostscript.ps1`
  downloads and prunes it into gitignored `vendor/` (~40 MB)
- 🔍 **Binary discovery**: `find_ghostscript()` checks `MICROPDF_GS`, then `vendor/`,
  then PATH, then the usual Windows install locations

### Fixed
- 🐛 **Vector/text PDFs barely compressed**: the images engine only touches image
  XObjects, so a 46.90 MB vector PDF (74% content streams) shrank by just 0.38%.
  The Ghostscript engine takes it to 4.50%
- 🐛 **Silent data loss**: Ghostscript can exit with an error yet still write a
  file. On a 31 MB / 286-page document it produced a 20 KB, 1-page PDF — which a
  size-only comparison would have reported as "99.9% compression". The page-count
  check now catches this
- 🐛 **Same-size output presented as success**: when no engine can improve a file,
  the original is copied through and reported as already optimised

### Changed
- 🔁 Electron and the CLI (`compress.py`) both call `compress_pdf_hybrid()`;
  `batch_compress_pdfs()` gained a `'hybrid'` method
- 📝 README compression figures replaced with measured results for both a scanned
  and a vector document, plus the Ghostscript AGPL notice

### Notes
- ⚖️ **Licensing**: Ghostscript is AGPLv3, not MIT. Redistributing a build that
  bundles it must comply with the AGPL or use a commercial Artifex licence.
  Deleting `vendor/` degrades microPDF gracefully to the images engine
- ⏱️ Running two engines roughly doubles worst-case time (46.90 MB file: ~97 s)

## [2026.1.3-final] - 2026-04-30

### Changed - Documentation Reorganization
- 📁 **Moved to docs/**: `BUG_FIXES_SUMMARY.md` → `docs/BUG_FIXES.md`
- 📁 **Moved to docs/**: `CUSTOM_QUALITY_FEATURE.md` → `docs/CUSTOM_QUALITY.md`
- 📁 **Consolidated**: `CLEANUP_SUMMARY.md` + `PROJECT_STRUCTURE.md` → `docs/PROJECT_INFO.md`
- 📝 **Updated**: `docs/INDEX.md` with new structure and custom quality feature
- 🧹 **Cleaned Root**: Only 11 essential files remain in root directory

### Improved
- ✅ **Cleaner Structure**: All documentation now in `docs/` folder
- ✅ **Better Organization**: 9 docs files, logically grouped
- ✅ **Easier Navigation**: Updated INDEX.md with comprehensive links
- ✅ **No Duplication**: Each information in one place
- ✅ **Maintainable**: Clear structure for future updates

### Documentation Structure
```
Root (11 files):
├── README.md, CHANGELOG.md, INSTALLATION.md, CONTRIBUTING.md, LICENSE
├── compress_pdf.py, compress.py, requirements.txt
└── package.json, .gitignore

docs/ (9 files):
├── INDEX.md (navigation hub)
├── User Guides: ELECTRON_GUIDE.md, QUICK_START.md, USAGE_EXAMPLES.md
├── Developer Docs: TECHNICAL_DETAILS.md, README.md, BUG_FIXES.md, CUSTOM_QUALITY.md
└── Project Info: PROJECT_INFO.md
```

## [2026.1.3-custom] - 2026-04-30

### Added - Custom Quality Feature
- ✨ **Custom Quality Button**: Added 6th quality button for custom compression (1-49%)
- 🎚️ **Quality Slider**: Interactive slider for precise quality control below 50%
- ⚠️ **Smart Warning**: Automatic warning display when quality drops below 30%
- 📊 **Real-time Display**: Live quality percentage update as slider moves
- 🎨 **Visual Feedback**: Gradient slider (red to yellow) indicating compression level
- 📱 **Responsive Grid**: Updated quality buttons to 6-column grid (3 on mobile)

### Changed
- ♻️ Updated quality button grid from 5 to 6 columns
- ♻️ Refactored JPEG quality calculation into `_calc_jpeg_quality()` helper function
- ♻️ Extended quality mapping to support 1-49% range (JPEG 5-38)

### Technical
- 📝 Added `CUSTOM_QUALITY_FEATURE.md` with comprehensive documentation
- 🎨 New CSS styles for custom quality panel and slider
- 🔧 Enhanced renderer.js with slider event handling
- 🐍 Improved compress_pdf.py with better quality mapping algorithm

## [2026.1.3-patched] - 2026-04-30

### Fixed - Critical Bug Fixes
- 🐛 **Bug #1**: Images with unsupported color spaces (Indexed, ICCBased, Separation, Pattern) are now preserved instead of being deleted
- 🐛 **Bug #2**: Array-based color spaces like `[/Indexed /DeviceRGB 255 <hex>]` are now properly detected and processed
- 🐛 **Bug #3**: Added data size validation before `Image.frombytes()` to prevent errors with truncated/corrupt data
- 🐛 **Bug #4**: Object modifications are now more atomic to prevent partial corruption
- 🐛 **Bug #5**: DecodeParms is now properly removed after FlateDecode → DCTDecode conversion
- 🐛 **Bug #6**: Batch compression now calls compression function directly instead of using incorrect IPC invoke
- 🐛 **Bug #7**: Path construction is now cross-platform compatible (Windows/macOS/Linux)

### Changed
- ♻️ Refactored compression logic in `compress_pdf.py` to follow "preserve original if cannot compress" principle
- ♻️ Extracted compression logic in `main.js` into reusable `runCompressPDF()` function
- ♻️ Updated renderer to send `outputFolder` and `fileName` separately for cross-platform path handling

### Documentation
- 📝 Added `BUG_FIXES_SUMMARY.md` with detailed explanation of all bug fixes
- 📝 Consolidated and cleaned up documentation structure
- 📝 Removed duplicate and outdated documentation files

## [2026.1.3] - 2026-04-23

### Added
- 🎨 5 quality presets (90%, 80%, 70%, 60%, 50%) with consistent 10% gaps
- 🖼️ Professional icon.png logo in header
- 🎯 Enhanced drag & drop with dual method file path detection
- 📊 Real-time progress animation with smooth transitions
- 📄 Page counter display during compression
- 🎨 Blue color theme (Submarine Blue, Light Blue, Gold Yellow, Dark Blue, Green Tosca)
- ✨ Smooth progress bar with shimmer and glow effects
- 🔒 Menu bar removal for cleaner interface
- 📝 Comprehensive GitHub documentation

### Changed
- 🎨 Updated color scheme from purple to professional blue theme
- 📦 Package name from "pdf-compressor" to "micropdf"
- 🏷️ Application name from "PDF Compressor" to "microPDF"
- 📐 Grid layout from 4 to 5 columns for quality buttons
- 🎯 Progress calculation to be page-based instead of file-based

### Fixed
- 🐛 DevTools auto-opening on startup
- 🐛 Drag & drop file path detection in Electron
- 🐛 File size display showing "0 Bytes"
- 🐛 Statistics showing incorrect values
- 🐛 Progress bar stuck at 100%
- 🐛 Package name validation error with uppercase letters

### Removed
- 🗑️ Unnecessary test files (test-temp-script.py, test-compression-data.js)
- 🗑️ Debug documentation files
- 🗑️ Input and output folders (not needed for desktop app)
- 🗑️ __pycache__ folder
- 🗑️ Development-only markdown files

### Documentation
- 📚 Created comprehensive README.md for GitHub
- 📝 Added LICENSE (MIT)
- 🤝 Added CONTRIBUTING.md
- 🐛 Added GitHub issue templates
- 📋 Added pull request template
- 📖 Reorganized documentation structure

## [2.0.0] - 2026-04-20

### Added
- 🎉 Initial Electron desktop application
- 🖱️ Drag & drop interface
- 📁 Multiple file support
- 🎚️ 4 quality presets (90%, 80%, 70%, 50%)
- 📂 Custom output folder selection
- 📊 Compression statistics
- 🐍 Python CLI script with 4 modes
- 📝 Comprehensive documentation

### Features
- Interactive mode for CLI
- Single file compression
- Batch folder compression
- Quick mode with defaults
- Real-time progress tracking
- Modern gradient UI

## [1.0.0] - 2026-04-15

### Added
- 🎯 Initial Python compression script
- 📄 Basic PDF compression functionality
- 🖼️ Image recompression with quality control
- 📊 Compression statistics
- 📝 Basic documentation

---

## Legend

- 🎉 Major feature
- ✨ New feature
- 🐛 Bug fix
- 🎨 UI/UX improvement
- 📝 Documentation
- 🔒 Security
- ⚡ Performance
- ♻️ Refactoring
- 🗑️ Removal
- 📦 Dependencies

---

## Upcoming Features

### Planned for Next Release
- [ ] Custom quality slider (1-100)
- [ ] File preview
- [ ] Compression history
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Auto-update mechanism
- [ ] Batch rename options

### Under Consideration
- [ ] Cloud integration
- [ ] PDF merge/split
- [ ] Watermark addition
- [ ] Password protection
- [ ] OCR support

---

For more details, see the [full documentation](docs/INDEX.md).
