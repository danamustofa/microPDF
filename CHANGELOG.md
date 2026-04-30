# Changelog

All notable changes to microPDF will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
