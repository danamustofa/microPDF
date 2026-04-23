# Release Guide for Maintainers

This guide explains how to create a new release of microPDF.

## 📋 Pre-Release Checklist

- [ ] All tests pass
- [ ] Documentation is up to date
- [ ] CHANGELOG.md is updated
- [ ] Version number is bumped
- [ ] No critical bugs in main branch

## 🔢 Version Numbering

We use calendar versioning: `YYYY.MINOR.PATCH`

Example: `2026.1.3`
- `2026` = Year
- `1` = Minor version (feature releases)
- `3` = Patch version (bug fixes)

## 🚀 Release Process

### Step 1: Update Version

Update version in `package.json`:

```json
{
  "version": "2026.1.3"
}
```

### Step 2: Update CHANGELOG.md

Add new version section at the top:

```markdown
## [2026.1.3] - 2026-04-23

### Added
- New feature 1
- New feature 2

### Fixed
- Bug fix 1
- Bug fix 2
```

### Step 3: Commit Changes

```bash
git add package.json CHANGELOG.md
git commit -m "chore: bump version to 2026.1.3"
git push origin main
```

### Step 4: Create Git Tag

```bash
# Create annotated tag
git tag -a v2026.1.3 -m "Release v2026.1.3"

# Push tag to GitHub
git push origin v2026.1.3
```

### Step 5: Build Installers

#### Option A: Automated (GitHub Actions)

The GitHub Actions workflow will automatically build installers when you push a tag.

1. Go to [Actions](https://github.com/yourusername/micropdf/actions)
2. Wait for the build to complete
3. Download artifacts from the workflow run

#### Option B: Manual Build

**Windows:**
```bash
npm run build:win
```

**macOS:**
```bash
npm run build:mac
```

**Linux:**
```bash
npm run build:linux
```

Installers will be in the `dist/` folder.

### Step 6: Create GitHub Release

1. Go to [Releases](https://github.com/yourusername/micropdf/releases)
2. Click "Draft a new release"
3. Choose the tag you created (v2026.1.3)
4. Set release title: `microPDF v2026.1.3`
5. Copy content from `.github/RELEASE_TEMPLATE.md`
6. Fill in the template with actual changes
7. Upload installer files:
   - `microPDF-Setup-2026.1.3.exe` (Windows)
   - `microPDF-2026.1.3.dmg` (macOS)
   - `microPDF-2026.1.3.AppImage` (Linux)
8. Check "Set as the latest release"
9. Click "Publish release"

### Step 7: Verify Release

1. Check that all download links work
2. Test installers on each platform
3. Verify auto-update works (if implemented)

### Step 8: Announce Release

1. Update README.md with new version number
2. Post announcement (if applicable):
   - Twitter
   - Discord
   - Reddit
   - Product Hunt

## 🔧 Troubleshooting

### Build Fails on GitHub Actions

**Check:**
- Node.js version compatibility
- Python version compatibility
- Dependencies are correctly specified

**Solution:**
- Review workflow logs
- Test build locally first
- Update workflow configuration if needed

### Installer Doesn't Work

**Check:**
- Code signing (macOS/Windows)
- File permissions (Linux)
- Dependencies included

**Solution:**
- Test on clean VM
- Check electron-builder configuration
- Verify all resources are included

### Version Mismatch

**Check:**
- package.json version
- Git tag version
- Release title

**Solution:**
- Ensure all versions match
- Delete and recreate tag if needed

## 📝 Release Notes Template

Use this template for release notes:

```markdown
# microPDF v{VERSION}

## 🎉 Highlights

Brief summary of major changes.

## ✨ New Features

- Feature 1: Description
- Feature 2: Description

## 🐛 Bug Fixes

- Fix 1: Description
- Fix 2: Description

## 🎨 Improvements

- Improvement 1: Description
- Improvement 2: Description

## 📥 Downloads

[Download links]

## 📚 Documentation

[Documentation links]
```

## 🔄 Hotfix Release

For urgent bug fixes:

1. Create hotfix branch from main
2. Fix the bug
3. Bump patch version (e.g., 2026.1.3 → 2026.1.4)
4. Follow normal release process
5. Merge hotfix back to main

## 📊 Post-Release

After releasing:

1. Monitor for issues
2. Respond to user feedback
3. Plan next release
4. Update roadmap

## 🎯 Release Frequency

- **Major releases**: Every 3-6 months
- **Minor releases**: Every 1-2 months
- **Patch releases**: As needed for bugs

## 📞 Questions?

If you have questions about the release process:

1. Check this guide
2. Review previous releases
3. Ask in maintainer chat
4. Create an issue

---

**Remember**: Always test thoroughly before releasing!
