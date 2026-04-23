# Changelog

All notable changes to microPDF will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
