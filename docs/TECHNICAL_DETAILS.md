# Technical Details - PDF Compressor

## 🔧 Compression Algorithm

### How It Works

The compression function processes images in PDF through these steps:

1. **Extract Images**: Identify all images in PDF pages
2. **Analyze Format**: Check image format (JPEG, PNG, etc.)
3. **Recompress**: Apply JPEG compression with quality setting
4. **Replace**: Update PDF with compressed images
5. **Optimize**: Compress content streams

### Quality Mapping

```python
# Our quality scale (50-100) → JPEG quality (40-95)
if image_quality >= 50:
    jpeg_quality = int(40 + (image_quality - 50) * 1.1)
else:
    jpeg_quality = int(image_quality * 0.8)

# Clamp to valid range
jpeg_quality = max(20, min(95, jpeg_quality))
```

**Examples:**
- 90% → JPEG 84 (high quality)
- 80% → JPEG 73 (good quality)
- 70% → JPEG 62 (medium quality)
- 50% → JPEG 40 (low quality)

---

## 🐍 Python Implementation

### Core Function

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
// Compress PDF handler
ipcMain.handle('compress-pdf', async (event, { inputPath, outputPath, quality }) => {
  return new Promise((resolve, reject) => {
    // Create temp Python script
    const tempScript = createTempScript(inputPath, outputPath, quality);
    
    // Spawn Python process
    const python = spawn('python', [tempScript]);
    
    let output = '';
    let errorOutput = '';
    
    python.stdout.on('data', (data) => {
      const line = data.toString();
      output += line;
      
      // Send progress updates
      if (line.includes('Memproses halaman')) {
        const match = line.match(/Memproses halaman (\d+)\/(\d+)/);
        if (match) {
          event.sender.send('compression-status', {
            status: 'processing',
            currentPage: parseInt(match[1]),
            totalPages: parseInt(match[2])
          });
        }
      }
    });
    
    python.on('close', (code) => {
      if (code === 0 && output.includes('SUCCESS')) {
        // Parse SUCCESS line
        const lines = output.split('\n');
        const successLine = lines.find(line => line.startsWith('SUCCESS|'));
        
        if (successLine) {
          const parts = successLine.trim().split('|');
          resolve({
            success: true,
            originalSize: parseInt(parts[1]),
            compressedSize: parseInt(parts[2]),
            reduction: parseFloat(parts[3])
          });
        }
      } else {
        reject(new Error(errorOutput || 'Compression failed'));
      }
    });
  });
});
```

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

