# Technical Details - microPDF

## 🔧 Compression Algorithm

### How It Works

`compress_pdf_hybrid()` is the entry point for both the desktop app and the CLI. It
runs three independent engines, validates each result, and keeps the smallest one
that survives:

```
input.pdf
   ├── [1/3] images       PyPDF2 + Pillow, recompresses image XObjects
   ├── [2/3] ghostscript  pdfwrite, rewrites the whole document
   └── [3/3] raster       re-renders outlined-vector pages as indexed images
                ↓
        validate_output() on each candidate
                ↓
        smallest survivor wins → output.pdf
```

No engine wins everywhere, which is the entire reason there are three:

| Document type | Winner | Typical |
|---------------|--------|---------|
| Scans, image-heavy | images | 60-72% |
| Print-to-PDF with outlined text | raster | 55-65% |
| Genuine vector/text | ghostscript | low single digits |

If no candidate is both valid and smaller, the source is copied through unchanged
and reported as already optimised - never a same-size or damaged "success".

### Quality Mapping

```python
def _calc_jpeg_quality(image_quality):
    if image_quality >= 50:
        q = int(40 + (image_quality - 50) * 1.1)   # presets: 50-100 → JPEG 40-95
    else:
        q = int(5 + (image_quality - 1) * (33 / 48))  # custom: 1-49 → JPEG 5-38
    return max(5, min(95, q))
```

**Examples:**
- 90% → JPEG 84 (high quality)
- 80% → JPEG 73 (good quality)
- 70% → JPEG 62 (medium quality)
- 50% → JPEG 40 (low quality)
- 30% → JPEG 24 (aggressive, still readable)

Ghostscript maps the same 1-100 scale to image resolution through `_DPI_ANCHORS`,
anchored on its own conventions: 72 dpi = `/screen`, 150 = `/ebook`, 300 = `/printer`.
Resolution matters more than JPEG quality there - `pdfwrite` rewrites content
streams, and at high dpi the rewrite can come out *larger* than the original.

---

## 🐍 Python Implementation

### Engine 1: images

```python
def compress_pdf_images(input_path, output_path, image_quality=50):
    """
    Compress PDF by recompressing images
    
    Args:
        input_path: Path to input PDF
        output_path: Path to output PDF
        image_quality: Quality (1-100)
    
    Returns:
        bool: True if successful
    """
    reader = PdfReader(input_path)
    writer = PdfWriter()
    
    for page in reader.pages:
        page.compress_content_streams()
        
        # Process images in page
        if '/Resources' in page and '/XObject' in page['/Resources']:
            xobjects = page['/Resources']['/XObject'].get_object()
            
            for obj_name in xobjects:
                obj = xobjects[obj_name]
                
                if obj['/Subtype'] == '/Image':
                    # Extract image
                    data = obj.get_data()
                    img = Image.open(io.BytesIO(data))
                    
                    # Compress with quality parameter
                    jpeg_quality = calculate_jpeg_quality(image_quality)
                    output = io.BytesIO()
                    img.save(output, format='JPEG', quality=jpeg_quality)
                    
                    # Update PDF object
                    obj._data = output.getvalue()
        
        writer.add_page(page)
    
    with open(output_path, 'wb') as f:
        writer.write(f)
    
    return True
```

### Image Format Support

#### Supported Formats
- ✅ **JPEG (DCTDecode)**: Recompressed with quality parameter
- ✅ **PNG (FlateDecode)**: Converted to JPEG and compressed
- ✅ **RGB Images**: Fully supported
- ✅ **Grayscale Images**: Fully supported

#### Unsupported/Skipped
- ⚠️ **CMYK Images**: Skipped (to avoid color issues)
- ⚠️ **Indexed Color**: Skipped
- ⚠️ **Corrupted Images**: Skipped with error handling

### Error Handling

```python
try:
    # Process image
    compress_image(obj, quality)
except Exception as e:
    pass  # Skip problematic images, continue with others
```

**Behavior:**
- If one image fails, others still processed
- PDF still created (with uncompressed problematic images)
- No crash or data loss

---

## 🧱 Engine 3: raster

### The problem it solves

Applications that "print to PDF" often convert their text into outlines. The page
*looks* vector, but every glyph is a set of paths - there is no text to select and
no image XObject to recompress. On a 206-page tax form, 131 such pages carried
~41,000 path operators each and **zero** text operators, holding 32.87 MB of a
46.90 MB file. The images engine got 6.3% out of it; Ghostscript, 15.9%.

### Detection

```python
def detect_outline_pages(reader):
    for index, page in enumerate(reader.pages, 1):
        if _raw_content_bytes(page) < 150 * 1024:   # too small to be worth it
            continue
        if _count_text_ops(page) > 20:              # real text lives here
            continue
        yield index
```

`_count_text_ops()` inflates only the **first 256 KB** of each content stream via
`zlib.decompressobj().decompress(raw, limit)`. Decompressing them in full is not a
detail: those 131 streams expand from 33 MB to 115 MB, which costs more time than
rendering the pages does.

The engine bails out entirely unless the pages it found account for at least 25% of
the file.

### Why indexed colour, not JPEG

Measured on the same 17 pages at 150 dpi:

| Encoding | Per page | 131 pages |
|----------|----------|-----------|
| Original vector | 335 KB | 32.87 MB |
| Grayscale JPEG q60 | 284 KB | 36.39 MB |
| Colour JPEG q60 | 352 KB | 46.11 MB |
| **Indexed 16-colour + Flate** | **40 KB** | **5.17 MB** |

JPEG is a lossy codec tuned for photographs; sharp black-on-white edges are its
worst case, and it produced files *larger* than the vector source. Form pages use a
handful of flat colours, so a small palette plus Flate is the right tool.

### Why the PNG bytes are moved, not re-encoded

A PNG's IDAT chunk is exactly what PDF means by `/FlateDecode` with
`/Predictor 15`: deflate-compressed scanlines, each prefixed by a filter byte. So
`_png_to_pdf_image()` parses IHDR/PLTE/IDAT out of Pillow's PNG and hands the
compressed bytes straight to the image XObject, keeping Pillow's row filtering
(done in C) for free.

The alternative is expensive. Saving the same page through Pillow's own PDF writer
costs **4.9 MB**; flate alone without a predictor costs 4.9 MB too; with the
predictor it is **43 KB**.

```python
xobject[NameObject('/Filter')] = NameObject('/FlateDecode')
xobject[NameObject('/DecodeParms')] = DictionaryObject({
    NameObject('/Predictor'): NumberObject(15),
    NameObject('/Colors'): NumberObject(1),
    NameObject('/BitsPerComponent'): NumberObject(bits),   # 4 when ≤16 colours
    NameObject('/Columns'): NumberObject(width),
})
```

Page geometry is derived from the render: `width_pt = pixels * 72 / dpi`, which
reproduces the source MediaBox exactly because Ghostscript rendered at that dpi.

### What it does not touch

Pages with real text are added to the writer as-is. On the tax form, text extraction
from those pages is byte-identical before and after, and the page count is unchanged
at 206.

---

## ⚡ Electron Architecture

### Data Flow

```
User Action (Drag & Drop / Select Files)
    ↓
Renderer Process (renderer.js)
    ↓ IPC Call
Preload Script (preload.js)
    ↓ IPC Invoke
Main Process (main.js)
    ↓ Spawn Process
Python Script (compress_pdf.py)
    ↓ Compression
Output File
    ↓ Result
Main Process
    ↓ IPC Response
Renderer Process
    ↓ Update UI
Show Results
```

### IPC Communication

#### Main Process (main.js)

```javascript
const pythonExec = resolvePython();   // never a bare 'python' - see below

// -u keeps stdout unbuffered; without it Python holds the progress lines in a
// pipe buffer and the UI sits at 0% until the whole run is over.
const python = spawn(pythonExec.command, [...pythonExec.args, '-u', tempScriptPath], {
  env: { ...process.env, PYTHONIOENCODING: 'utf-8', ...ghostscriptEnv() },
  windowsHide: true
});

let pending = '';

python.stdout.on('data', (data) => {
  output += data.toString();
  pending += data.toString();

  // Per-page progress ends in \r, not \n, so split on both and hold back the
  // trailing fragment until the rest of it arrives.
  const segments = pending.split(/[\r\n]+/);
  pending = segments.pop();

  for (const line of segments) {
    const match = line.match(/Mem(?:proses|render) halaman (\d+)\/(\d+)/);
    if (match) {
      event.sender.send('compression-status', {
        status: line.includes('Merender') ? 'rasterizing' : 'processing',
        currentPage: parseInt(match[1]),
        totalPages: parseInt(match[2])
      });
    }
  }
});

python.on('close', (code) => {
  activeCompressions.delete(python);
  if (python.cancelled) return reject(new Error('Compression cancelled'));
  // ... parse the SUCCESS|orig|compressed|reduction line
});
```

#### Finding the interpreter

`spawn('python')` is unsafe on Windows. The `WindowsApps\python.exe` stub shadows
real installs on many machines, prints "Python was not found", and exits **9009**.

`resolvePython()` probes candidates in order - `MICROPDF_PYTHON`, `py -3`,
`python`, `python3`, then the usual install directories - running
`-c "import sys, PyPDF2, PIL"` on each and keeping the first that succeeds. The
stub eliminates itself by failing that probe. If an interpreter is found but the
libraries are missing, the UI gets the exact `pip install` command rather than an
exit code.

#### Cancelling

`state.cancelled` in the renderer only ends the queue; the file being worked on
would keep compressing to the end. The `cancel-compression` handler kills the
process tree instead - `taskkill /pid <pid> /T /F` on Windows, because Python has
Ghostscript running as a child.

#### Stdout encoding

Piped stdout on Windows defaults to the ANSI codepage, and the compressor prints
`✓`/`✗`. Without `PYTHONIOENCODING=utf-8` the images engine dies with
`UnicodeEncodeError: 'charmap' codec can't encode character '✗'` - and,
because that happens mid-engine, the run silently produces no compression at all.

#### Preload Script (preload.js)

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  compressPDF: (data) => ipcRenderer.invoke('compress-pdf', data),
  getFileSize: (path) => ipcRenderer.invoke('get-file-size', path),
  openFolder: (path) => ipcRenderer.invoke('open-folder', path),
  onCompressionStatus: (callback) => ipcRenderer.on('compression-status', (event, data) => callback(data))
});
```

#### Renderer Process (renderer.js)

```javascript
// Compress files
async function compressBatch() {
  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    
    try {
      const result = await window.electronAPI.compressPDF({
        inputPath: file.path,
        outputPath: getOutputPath(file.name),
        quality: selectedQuality
      });
      
      resultsData.push({
        fileName: file.name,
        success: true,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        reduction: result.reduction
      });
    } catch (error) {
      resultsData.push({
        fileName: file.name,
        success: false,
        error: error.message
      });
    }
  }
  
  showResults();
}
```

---

## 🎨 UI Components

### Progress Animation

#### Smooth Progress Bar

```javascript
// Animate progress smoothly
function animateProgressTo(targetPercent) {
  const currentPercent = parseFloat(progressFill.style.width) || 0;
  const step = (targetPercent - currentPercent) / 30; // 30 frames
  
  let current = currentPercent;
  
  function animate() {
    current += step;
    if ((step > 0 && current < targetPercent) || (step < 0 && current > targetPercent)) {
      progressFill.style.width = current + '%';
      requestAnimationFrame(animate);
    } else {
      progressFill.style.width = targetPercent + '%';
    }
  }
  
  animate();
}
```

#### Status Updates

```javascript
// Listen for compression status
window.electronAPI.onCompressionStatus((data) => {
  if (data.status === 'reading') {
    progressDetail.textContent = 'Reading PDF...';
  } else if (data.status === 'processing') {
    progressDetail.textContent = 'Compressing images...';
    
    if (data.currentPage && data.totalPages) {
      const percent = (data.currentPage / data.totalPages * 100).toFixed(1);
      progressPage.textContent = `Page ${data.currentPage} of ${data.totalPages} (${percent}%)`;
      
      // Animate progress bar
      animateProgressTo(parseFloat(percent));
    }
  } else if (data.status === 'saving') {
    progressDetail.textContent = 'Saving compressed PDF...';
    progressPage.textContent = 'Almost done...';
  }
});
```

### Animations

#### Spinner

```css
.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #054da2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

#### Shimmer Effect

```css
.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}
```

#### Pulsing Glow

```css
.progress-bar::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(90deg, #054da2, #00aeef, #fdb813);
  border-radius: 8px;
  opacity: 0;
  animation: progressGlow 2s ease-in-out infinite;
  z-index: -1;
}

@keyframes progressGlow {
  0%, 100% { opacity: 0; }
  50% { opacity: 0.3; }
}
```

---

## 📊 Performance Optimization

### Where the time goes

Measured on the 46.90 MB / 206-page tax form, quality 50:

| Phase | Time | Result |
|-------|------|--------|
| images engine | ~97 s | 43.95 MB |
| ghostscript engine | ~27 s | 39.44 MB |
| raster engine (detect + render + rebuild) | ~60 s | **18.22 MB** |

The images engine spends nearly all of its time in `page.compress_content_streams()`
on pages it cannot improve - roughly 0.5 s per page on this document, for a 6%
result. That is the cost of running every engine on every file; the upside is that
the same code gets 72% on a scan, where the raster engine finds nothing to do and
skips out in under a second.

### Memory Management

```javascript
// Cleanup temp files
function cleanupTempFiles() {
  const tempDir = os.tmpdir();
  const files = fs.readdirSync(tempDir);
  
  files.forEach(file => {
    if (file.startsWith('compress_temp_')) {
      try {
        fs.unlinkSync(path.join(tempDir, file));
      } catch (error) {
        // Ignore errors
      }
    }
  });
}
```

### Batch Processing

```javascript
// Process files sequentially to avoid memory issues
async function compressBatch() {
  for (let i = 0; i < selectedFiles.length; i++) {
    // Process one file at a time
    await compressFile(selectedFiles[i]);
    
    // Update progress
    const progress = ((i + 1) / selectedFiles.length) * 100;
    updateProgress(progress);
  }
}
```

---

## 🔒 Security Considerations

### Context Isolation

```javascript
// main.js
const mainWindow = new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,  // ✅ Enabled
    nodeIntegration: false,  // ✅ Disabled
    sandbox: true            // ✅ Enabled
  }
});
```

### Path Sanitization

```javascript
// Sanitize file paths
function sanitizePath(filePath) {
  // Remove dangerous characters
  return filePath.replace(/[<>:"|?*]/g, '');
}
```

### File Validation

```javascript
// Validate PDF files
function isValidPDF(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.pdf';
}
```

---

## 🧪 Testing

### Manual Test Checklist

- [ ] Drag & drop single file
- [ ] Drag & drop multiple files
- [ ] Select files via dialog
- [ ] Change quality preset
- [ ] Select output folder
- [ ] Compress single file
- [ ] Compress multiple files
- [ ] View results
- [ ] Open output folder
- [ ] Compress more files

### Automated Test (Example)

```javascript
// test-compression.js
const { compress_pdf_images } = require('./compress_pdf');
const fs = require('fs');

async function testCompression() {
  const input = 'test.pdf';
  const qualities = [90, 80, 70, 50];
  const results = [];
  
  for (const quality of qualities) {
    const output = `output_${quality}.pdf`;
    await compress_pdf_images(input, output, quality);
    
    const size = fs.statSync(output).size;
    results.push({ quality, size });
  }
  
  // Verify sizes are different
  const uniqueSizes = new Set(results.map(r => r.size));
  console.assert(uniqueSizes.size === qualities.length, 'All sizes should be different');
  
  console.log('✓ Test passed');
}

testCompression();
```

---

## 📈 Monitoring & Debugging

### Enable DevTools

```javascript
// main.js
mainWindow.webContents.openDevTools();
```

### Logging

```javascript
// Enable detailed logging
const DEBUG = true;

if (DEBUG) {
  console.log('Compress PDF called with:', data);
  console.log('Python output:', output);
  console.log('Result:', result);
}
```

### Error Tracking

```javascript
// Track errors
python.stderr.on('data', (data) => {
  console.error('Python error:', data.toString());
  errorOutput += data.toString();
});

python.on('error', (error) => {
  console.error('Failed to start Python:', error);
  reject(error);
});
```

---

**Version**: 2.3.0  
**Last Updated**: April 2026

