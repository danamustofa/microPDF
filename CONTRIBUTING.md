# Contributing to microPDF

Thank you for your interest in contributing to microPDF! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- Git
- A code editor (VS Code recommended)

### Setup Development Environment

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/micropdf.git
   cd micropdf
   ```

3. **Install dependencies**
   ```bash
   # Node dependencies
   npm install
   
   # Python dependencies
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   npm start
   ```

## 📝 Development Guidelines

### Code Style

#### JavaScript/Electron
- Use ES6+ features
- Use `const` and `let`, avoid `var`
- Use meaningful variable names
- Add comments for complex logic
- Follow existing code structure

#### Python
- Follow PEP 8 style guide
- Use type hints where appropriate
- Add docstrings to functions
- Keep functions focused and small

#### CSS
- Use BEM naming convention where applicable
- Keep selectors specific but not overly nested
- Use CSS variables for colors and common values
- Comment complex styling

### Commit Messages

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(ui): add dark mode toggle
fix(compression): resolve memory leak in batch processing
docs(readme): update installation instructions
```

## 🐛 Reporting Bugs

### Before Submitting

1. Check if the bug has already been reported in [Issues](https://github.com/danamustofa/microPDF/issues)
2. Try to reproduce the bug with the latest version
3. Collect relevant information (OS, version, error messages)

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., Windows 11]
- microPDF Version: [e.g., 2026.1.3]
- Node.js Version: [e.g., 18.0.0]
- Python Version: [e.g., 3.11.0]

**Additional context**
Any other relevant information.
```

## ✨ Suggesting Features

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Mockups, examples, or other relevant information.
```

## 🔧 Pull Request Process

### Before Submitting

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Follow the code style guidelines
   - Test your changes thoroughly

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template

### Pull Request Template

```markdown
**Description**
Brief description of changes.

**Type of change**
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

**How Has This Been Tested?**
Describe the tests you ran.

**Checklist:**
- [ ] My code follows the style guidelines
- [ ] I have commented my code where needed
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have tested my changes
```

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Your contribution will be credited

## 📚 Documentation

### Updating Documentation

- Update relevant `.md` files in `docs/`
- Keep documentation clear and concise
- Add examples where helpful
- Update screenshots if UI changes

### Documentation Structure

```
docs/
├── INDEX.md              # Documentation index
├── ELECTRON_GUIDE.md     # Desktop app guide + troubleshooting
├── TECHNICAL_DETAILS.md  # Engines, IPC, measured timings
├── README.md             # Python API reference
├── QUICK_START.md        # Quick start guide
├── USAGE_EXAMPLES.md     # CLI examples
├── PROJECT_INFO.md       # Project structure
└── CHANGELOG.md          # Archived CLI-era changelog
```

Release notes go in the **root** `CHANGELOG.md`, not `docs/CHANGELOG.md`.

## 🧪 Testing

### Manual Testing

Before submitting a PR, test:

1. **Desktop App**
   - Drag & drop functionality
   - File selection dialog
   - All quality presets
   - Batch compression
   - Progress updates
   - Results display

2. **CLI Script**
   - Interactive mode
   - Single file mode
   - Batch mode
   - Quick mode

### Test Checklist

- [ ] App starts without errors
- [ ] All features work as expected
- [ ] No console errors
- [ ] UI is responsive
- [ ] Compression produces valid PDFs
- [ ] Statistics are accurate

### Touching the compression engines

`compress_pdf_hybrid()` runs three engines and keeps the smallest *validated*
result, so a change to one engine can quietly stop it from ever winning. Test with
at least one of each document type:

- [ ] A scan / image-heavy PDF → the **images** engine should win
- [ ] A print-to-PDF file with outlined text → the **raster** engine should win,
      and pages that do have real text must come out byte-identical
- [ ] A normal text PDF → the **raster** engine must report that it skipped
- [ ] Page count in the output matches the source in every case

`validate_output()` is the safety net that makes this workable - never let a
candidate through without it. Ghostscript can exit successfully and still write a
truncated PDF.

## 🎨 UI/UX Guidelines

### Design Principles

- **Simple**: Keep interface clean and uncluttered
- **Elegant**: Use smooth animations and transitions
- **Minimalist**: Only essential features visible
- **Consistent**: Follow existing design patterns

### Color Palette

- Primary: `#054da2` (Submarine Blue)
- Secondary: `#00aeef` (Light Blue)
- Accent: `#fdb813` (Gold Yellow)
- Success: `#00b091` (Green Tosca)
- Background: `#2E3192` (Dark Blue)

## 📦 Building and Releasing

### Building Installers

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux

# All platforms
npm run build
```

### Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag
4. Build installers
5. Create GitHub release
6. Upload installers

## 🤝 Community

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on what's best for the project

### Getting Help

- Check [Documentation](docs/INDEX.md)
- Search [Issues](https://github.com/danamustofa/microPDF/issues)
- Ask questions in discussions

## 📞 Contact

- **GitHub Issues**: For bugs and features
- **Email**: your.email@example.com
- **Discussions**: For questions and ideas

---

Thank you for contributing to microPDF! 🎉

