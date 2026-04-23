const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: true,
    backgroundColor: '#ffffff',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    autoHideMenuBar: true  // Hide menu bar (File, Edit, View, etc.)
  });

  // Remove menu bar completely
  mainWindow.setMenuBarVisibility(false);

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // DevTools disabled for production
  // Uncomment line below only for debugging:
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle file selection
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] }
    ]
  });
  
  return result.filePaths;
});

// Handle output folder selection
ipcMain.handle('select-output-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  return result.filePaths[0];
});

// Handle open folder
ipcMain.handle('open-folder', async (event, folderPath) => {
  const { shell } = require('electron');
  await shell.openPath(folderPath);
  return true;
});

// Handle get file size
ipcMain.handle('get-file-size', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
});

// Handle PDF compression
ipcMain.handle('compress-pdf', async (event, { inputPath, outputPath, quality }) => {
  return new Promise((resolve, reject) => {
    try {
      // Validate inputs
      if (!inputPath || !outputPath || !quality) {
        reject(new Error('Missing required parameters'));
        return;
      }
      
      if (!fs.existsSync(inputPath)) {
        reject(new Error(`Input file not found: ${inputPath}`));
        return;
      }
      
      // Path ke Python script
      const scriptPath = path.join(__dirname, '..', 'compress_pdf.py');
      
      // Buat temporary Python script untuk kompresi
      const tempScript = `
import sys
import os
sys.path.insert(0, '${path.join(__dirname, '..').replace(/\\/g, '\\\\')}')

# Suppress print statements from compress_pdf module
import io
from contextlib import redirect_stdout, redirect_stderr

from compress_pdf import compress_pdf_images

input_path = r'${inputPath.replace(/\\/g, '\\\\')}'
output_path = r'${outputPath.replace(/\\/g, '\\\\')}'
quality = ${quality}

try:
    # Get original size
    if not os.path.exists(input_path):
        print("ERROR|Input file not found")
        sys.exit(1)
    
    original_size = os.path.getsize(input_path)
    
    # Redirect stdout to capture compress_pdf_images output
    f = io.StringIO()
    with redirect_stdout(f):
        # Compress
        success = compress_pdf_images(input_path, output_path, image_quality=quality)
    
    # Get the output for progress updates
    output_text = f.getvalue()
    
    # Print progress lines for UI updates
    for line in output_text.split('\\n'):
        if any(keyword in line for keyword in ['Membaca PDF', 'Total halaman', 'Memproses halaman', 'Menyimpan PDF']):
            print(line)
    
    # Check result
    if success and os.path.exists(output_path):
        compressed_size = os.path.getsize(output_path)
        reduction = ((original_size - compressed_size) / original_size) * 100
        
        # Print SUCCESS line (this is what we parse)
        print(f"SUCCESS|{original_size}|{compressed_size}|{reduction:.2f}")
        sys.exit(0)
    else:
        print("ERROR|Compression function returned False")
        sys.exit(1)
        
except Exception as e:
    import traceback
    print(f"ERROR|{str(e)}")
    traceback.print_exc()
    sys.exit(1)
`;

      const tempScriptPath = path.join(app.getPath('temp'), `compress_temp_${Date.now()}.py`);
      fs.writeFileSync(tempScriptPath, tempScript);

      // Run Python script
      const python = spawn('python', [tempScriptPath]);
      
      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        const dataStr = data.toString();
        output += dataStr;
        
        // Parse progress updates
        const lines = dataStr.split('\n');
        for (const line of lines) {
          // Send progress updates to renderer
          if (line.includes('Membaca PDF')) {
            event.sender.send('compression-status', { status: 'reading', message: 'Reading PDF...' });
          } else if (line.includes('Total halaman:')) {
            const match = line.match(/Total halaman: (\d+)/);
            if (match) {
              event.sender.send('compression-status', { 
                status: 'processing', 
                message: 'Processing pages...', 
                totalPages: parseInt(match[1]) 
              });
            }
          } else if (line.includes('Memproses halaman')) {
            const match = line.match(/Memproses halaman (\d+)\/(\d+)/);
            if (match) {
              event.sender.send('compression-status', { 
                status: 'processing', 
                message: 'Compressing images...',
                currentPage: parseInt(match[1]),
                totalPages: parseInt(match[2])
              });
            }
          } else if (line.includes('Menyimpan PDF')) {
            event.sender.send('compression-status', { status: 'saving', message: 'Saving compressed PDF...' });
          }
        }
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('error', (error) => {
        // Clean up temp file
        try {
          fs.unlinkSync(tempScriptPath);
        } catch (e) {
          // Ignore cleanup errors
        }
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });

      python.on('close', (code) => {
        // Clean up temp file
        try {
          fs.unlinkSync(tempScriptPath);
        } catch (e) {
          // Ignore cleanup errors
        }

        console.log('Python exit code:', code);
        console.log('Python full output:', output);
        
        if (errorOutput) {
          console.log('Python stderr:', errorOutput);
        }

        if (code === 0) {
          // Find the SUCCESS line (should be at the end)
          const lines = output.split('\n').map(line => line.trim()).filter(line => line.length > 0);
          const successLine = lines.find(line => line.startsWith('SUCCESS|'));
          
          console.log('Looking for SUCCESS line in', lines.length, 'lines');
          console.log('Found SUCCESS line:', successLine);
          
          if (successLine) {
            const parts = successLine.split('|');
            console.log('Success line parts:', parts);
            
            if (parts.length >= 4) {
              const result = {
                success: true,
                originalSize: parseInt(parts[1]),
                compressedSize: parseInt(parts[2]),
                reduction: parseFloat(parts[3])
              };
              
              console.log('Resolved result:', result);
              
              // Validate result
              if (isNaN(result.originalSize) || isNaN(result.compressedSize) || isNaN(result.reduction)) {
                reject(new Error('Invalid data in SUCCESS line: ' + successLine));
              } else {
                resolve(result);
              }
            } else {
              reject(new Error('SUCCESS line has insufficient parts: ' + successLine));
            }
          } else {
            // No SUCCESS line found, but exit code is 0
            // This might mean the output format is wrong
            reject(new Error('SUCCESS line not found in output. Last 5 lines: ' + lines.slice(-5).join(' | ')));
          }
        } else {
          const errorMsg = errorOutput || 'Process exited with code ' + code;
          reject(new Error(`Compression failed (exit code ${code}): ${errorMsg}`));
        }
      });
    } catch (error) {
      // Catch any synchronous errors
      reject(error);
    }
  });
});

// Handle batch compression
ipcMain.handle('compress-batch', async (event, { files, outputFolder, quality }) => {
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const inputPath = files[i];
    const fileName = path.basename(inputPath);
    const outputPath = path.join(outputFolder, `compressed_${fileName}`);
    
    try {
      // Send progress update
      event.sender.send('compression-progress', {
        current: i + 1,
        total: files.length,
        fileName: fileName
      });
      
      const result = await ipcMain.invoke('compress-pdf', event, {
        inputPath,
        outputPath,
        quality
      });
      
      results.push({
        fileName,
        success: true,
        ...result
      });
    } catch (error) {
      results.push({
        fileName,
        success: false,
        error: error.error || error.message
      });
    }
  }
  
  return results;
});
