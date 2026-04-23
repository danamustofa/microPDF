# Installation Guide

This guide will help you install microPDF on your system.

## 📥 Download Pre-built Application

### Step 1: Go to Releases Page

Visit the [Releases page](https://github.com/yourusername/micropdf/releases) on GitHub.

### Step 2: Download for Your Platform

Choose the appropriate installer for your operating system:

#### 🪟 Windows

**File**: `microPDF-Setup-{version}.exe`

1. Click on the `.exe` file to download
2. Run the installer
3. Follow the installation wizard
4. Launch microPDF from Start Menu or Desktop

**System Requirements:**
- Windows 10 or later
- 4 GB RAM minimum
- 200 MB free disk space

#### 🍎 macOS

**File**: `microPDF-{version}.dmg`

1. Click on the `.dmg` file to download
2. Open the downloaded file
3. Drag microPDF to Applications folder
4. Launch from Applications or Launchpad

**System Requirements:**
- macOS 10.13 (High Sierra) or later
- 4 GB RAM minimum
- 200 MB free disk space

**Note**: On first launch, you may need to:
1. Right-click the app
2. Select "Open"
3. Click "Open" in the security dialog

#### 🐧 Linux

**File**: `microPDF-{version}.AppImage`

1. Click on the `.AppImage` file to download
2. Make it executable:
   ```bash
   chmod +x microPDF-*.AppImage
   ```
3. Run the application:
   ```bash
   ./microPDF-*.AppImage
   ```

**System Requirements:**
- Ubuntu 18.04 or later (or equivalent)
- 4 GB RAM minimum
- 200 MB free disk space

**Optional**: Install AppImageLauncher for better integration:
```bash
sudo add-apt-repository ppa:appimagelauncher-team/stable
sudo apt update
sudo apt install appimagelauncher
```

---

## 🛠️ Build from Source

If you prefer to build the application yourself or want to contribute:

### Prerequisites

Install the following software:

1. **Node.js** (v16 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify: `node --version`

2. **Python** (v3.8 or higher)
   - Download from [python.org](https://www.python.org/)
   - Verify: `python --version`

3. **Git**
   - Download from [git-scm.com](https://git-scm.com/)
   - Verify: `git --version`

### Installation Steps

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/micropdf.git
cd micropdf
```

#### 2. Install Dependencies

**Node.js dependencies:**
```bash
npm install
```

**Python dependencies:**
```bash
pip install -r requirements.txt
```

#### 3. Run the Application

```bash
npm start
```

The application should launch automatically.

### Building Installers

To create distributable installers:

#### Windows
```bash
npm run build:win
```
Output: `dist/microPDF-Setup-{version}.exe`

#### macOS
```bash
npm run build:mac
```
Output: `dist/microPDF-{version}.dmg`

#### Linux
```bash
npm run build:linux
```
Output: `dist/microPDF-{version}.AppImage`

#### All Platforms
```bash
npm run build
```

---

## 🐍 CLI Script Only

If you only want to use the command-line interface:

### 1. Install Python

Download and install Python 3.8 or higher from [python.org](https://www.python.org/).

### 2. Download the Script

Download these files from the repository:
- `compress.py`
- `compress_pdf.py`
- `requirements.txt`

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the Script

```bash
python compress.py
```

---

## ✅ Verify Installation

### Desktop Application

1. Launch microPDF
2. You should see the main window with drag & drop area
3. Try compressing a sample PDF file

### CLI Script

```bash
python compress.py --help
```

You should see the usage information.

---

## 🔧 Troubleshooting

### Windows

**Issue**: "Windows protected your PC" warning

**Solution**:
1. Click "More info"
2. Click "Run anyway"

**Issue**: Application won't start

**Solution**:
1. Install [Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe)
2. Restart your computer
3. Try launching again

### macOS

**Issue**: "microPDF can't be opened because it is from an unidentified developer"

**Solution**:
1. Go to System Preferences > Security & Privacy
2. Click "Open Anyway"
3. Or right-click the app and select "Open"

**Issue**: Python not found

**Solution**:
```bash
# Install Python via Homebrew
brew install python@3.11
```

### Linux

**Issue**: AppImage won't run

**Solution**:
```bash
# Make it executable
chmod +x microPDF-*.AppImage

# Install FUSE if needed
sudo apt install fuse libfuse2
```

**Issue**: Python dependencies fail to install

**Solution**:
```bash
# Install build tools
sudo apt install python3-dev python3-pip build-essential
```

---

## 🆘 Getting Help

If you encounter issues:

1. Check the [Troubleshooting Guide](docs/ELECTRON_GUIDE.md#-troubleshooting)
2. Search [existing issues](https://github.com/yourusername/micropdf/issues)
3. Create a [new issue](https://github.com/yourusername/micropdf/issues/new)

---

## 📚 Next Steps

After installation:

1. Read the [Quick Start Guide](docs/QUICK_START.md)
2. Check out [Usage Examples](docs/USAGE_EXAMPLES.md)
3. Explore [Documentation](docs/INDEX.md)

---

**Happy compressing! 🎉**
