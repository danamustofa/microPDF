const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;

// Ghostscript is one of the two compression engines. In development it sits in
// vendor/ next to compress_pdf.py and Python finds it on its own; in a packaged
// build it is copied into resources/, which only the main process knows about.
function ghostscriptEnv() {
  if (!app.isPackaged) return {};

  const binary = process.platform === 'win32' ? 'gswin64c.exe' : 'gs';
  const bundled = path.join(process.resourcesPath, 'ghostscript', 'bin', binary);

  return fs.existsSync(bundled) ? { MICROPDF_GS: bundled } : {};
}

// Windows ships a stub python.exe under WindowsApps that only advertises the
// Microsoft Store and exits with code 9009, so spawning a bare 'python' is not
// safe. Probe candidates instead and keep the first real interpreter, favouring
// one that already has PyPDF2 and Pillow.
let cachedPython;

function subdirectories(parent) {
  try {
    return fs.readdirSync(parent, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(parent, entry.name));
  } catch (e) {
    return [];
  }
}

function pythonCandidates() {
  const candidates = [];
  const add = (command, args = []) => command && candidates.push({ command, args });

  add(process.env.MICROPDF_PYTHON);

  if (process.platform === 'win32') {
    add('py', ['-3']);            // Launcher / Python install manager
    add('python');
    add('python3');

    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      // PyManager layout: Local\Python\bin\python.exe + pythoncore-3.x-64\
      add(path.join(localAppData, 'Python', 'bin', 'python.exe'));
      for (const dir of subdirectories(path.join(localAppData, 'Python'))) {
        add(path.join(dir, 'python.exe'));
      }
      // Classic per-user installer: Local\Programs\Python\Python3xx\
      for (const dir of subdirectories(path.join(localAppData, 'Programs', 'Python'))) {
        add(path.join(dir, 'python.exe'));
      }
    }

    for (const root of [process.env.ProgramFiles, process.env['ProgramFiles(x86)']]) {
      for (const dir of subdirectories(root || '')) {
        if (path.basename(dir).toLowerCase().startsWith('python')) {
          add(path.join(dir, 'python.exe'));
        }
      }
    }
  } else {
    add('python3');
    add('python');
  }

  return candidates;
}

function probePython(candidate, code) {
  try {
    const result = require('child_process').spawnSync(
      candidate.command,
      [...candidate.args, '-c', code],
      { encoding: 'utf-8', windowsHide: true, timeout: 20000 }
    );
    return result.status === 0 && (result.stdout || '').trim().length > 0;
  } catch (e) {
    return false;
  }
}

function resolvePython() {
  if (cachedPython !== undefined) return cachedPython;

  const candidates = pythonCandidates();
  const withDeps = candidates.find((c) => probePython(c, 'import sys, PyPDF2, PIL; print(sys.executable)'));
  const anyPython = withDeps || candidates.find((c) => probePython(c, 'import sys; print(sys.executable)'));

  cachedPython = anyPython ? { ...anyPython, hasDependencies: Boolean(withDeps) } : null;

  if (cachedPython) {
    console.log('Using Python:', cachedPython.command, cachedPython.args.join(' '));
  } else {
    console.error('No usable Python 3 interpreter found');
  }

  return cachedPython;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 720,
    minWidth: 940,
    minHeight: 660,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: false,            // Custom ShrinkPDF-style titlebar
    backgroundColor: '#f6f8fb',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    autoHideMenuBar: true  // Hide menu bar (File, Edit, View, etc.)
  });

  // Remove menu bar completely
  mainWindow.setMenuBarVisibility(false);

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Keep the renderer's maximize button icon in sync
  mainWindow.on('maximize', () => mainWindow.webContents.send('window-maximized', true));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window-maximized', false));

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

// ----- Window controls (frameless titlebar) -----
ipcMain.on('window-minimize', () => mainWindow && mainWindow.minimize());
ipcMain.on('window-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow && mainWindow.close());
ipcMain.handle('window-is-maximized', () => mainWindow ? mainWindow.isMaximized() : false);

// ----- Compression history persistence (userData/history.json) -----
function historyFilePath() {
  return path.join(app.getPath('userData'), 'history.json');
}

function readHistory() {
  try {
    const raw = fs.readFileSync(historyFilePath(), 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

ipcMain.handle('get-history', () => readHistory());

ipcMain.handle('add-history', (event, entries) => {
  const list = Array.isArray(entries) ? entries : [entries];
  const history = readHistory();
  // newest first; cap at 200 records
  const next = [...list, ...history].slice(0, 200);
  try {
    fs.writeFileSync(historyFilePath(), JSON.stringify(next, null, 2));
  } catch (e) {
    console.error('Failed to write history:', e.message);
  }
  return next;
});

ipcMain.handle('clear-history', () => {
  try {
    fs.writeFileSync(historyFilePath(), '[]');
  } catch (e) {
    console.error('Failed to clear history:', e.message);
  }
  return [];
});

// Default output folder (Documents\Compressed, created if missing)
ipcMain.handle('get-default-output', () => {
  const folder = path.join(app.getPath('documents'), 'Compressed');
  try {
    fs.mkdirSync(folder, { recursive: true });
    return folder;
  } catch (e) {
    console.error('Failed to create default output folder:', e.message);
    return app.getPath('documents'); // Fall back to Documents itself
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

// Python children currently compressing, so Cancel can actually stop them.
// Without this the UI leaves the progress screen while the run keeps going.
const activeCompressions = new Set();

function killCompression(child) {
  try {
    if (process.platform === 'win32') {
      // Python shells out to Ghostscript; /T takes the whole tree down.
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true });
    } else {
      child.kill('SIGTERM');
    }
  } catch (e) {
    console.error('Failed to cancel compression:', e.message);
  }
}

ipcMain.handle('cancel-compression', () => {
  for (const child of activeCompressions) {
    child.cancelled = true;
    killCompression(child);
  }
  activeCompressions.clear();
  return true;
});

// Extracted compression logic for reuse (Bug #6 fix)
async function runCompressPDF({ inputPath, outputPath, quality, event }) {
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

      const pythonExec = resolvePython();
      if (!pythonExec) {
        reject(new Error(
          'Python 3 was not found. Install it from python.org (tick "Add python.exe to PATH"), ' +
          'or set MICROPDF_PYTHON to the full path of python.exe.'
        ));
        return;
      }

      if (!pythonExec.hasDependencies) {
        const label = [pythonExec.command, ...pythonExec.args].join(' ');
        reject(new Error(
          `Python was found (${label}) but PyPDF2/Pillow are missing. ` +
          `Install them with: ${label} -m pip install -r requirements.txt`
        ));
        return;
      }

      // Path ke Python script
      const scriptPath = path.join(__dirname, '..', 'compress_pdf.py');
      
      // Buat temporary Python script untuk kompresi
      const tempScript = `
import sys
import os
sys.path.insert(0, '${path.join(__dirname, '..').replace(/\\/g, '\\\\')}')

from compress_pdf import compress_pdf_hybrid

input_path = r'${inputPath.replace(/\\/g, '\\\\')}'
output_path = r'${outputPath.replace(/\\/g, '\\\\')}'
quality = ${quality}

try:
    # Get original size
    if not os.path.exists(input_path):
        print("ERROR|Input file not found")
        sys.exit(1)
    
    original_size = os.path.getsize(input_path)

    # Let the compressor print straight through: main.js parses these lines live
    # to drive the progress ring. Capturing them would freeze the UI at 0% until
    # the whole compression is over.
    success = compress_pdf_hybrid(input_path, output_path, image_quality=quality)

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

      // Run Python script. When packaged, Ghostscript lives in extraResources,
      // so point the compressor at it explicitly.
      // -u keeps stdout unbuffered; without it Python holds the progress lines in
      // a 8 KB pipe buffer and the UI sits at 0% until the run is over.
      const python = spawn(pythonExec.command, [...pythonExec.args, '-u', tempScriptPath], {
        // Stdout is a pipe here, so Windows would otherwise default to cp1252 and
        // choke on the non-ASCII characters the compressor prints.
        env: { ...process.env, PYTHONIOENCODING: 'utf-8', ...ghostscriptEnv() },
        windowsHide: true
      });

      activeCompressions.add(python);

      let output = '';
      let errorOutput = '';

      // Per-page progress is printed with a trailing \r, so split on both line
      // terminators and hold back the trailing fragment until the rest arrives.
      let pending = '';

      python.stdout.on('data', (data) => {
        const dataStr = data.toString();
        output += dataStr;

        pending += dataStr;
        const segments = pending.split(/[\r\n]+/);
        pending = segments.pop();

        for (const line of segments) {
          if (line.includes('Merender halaman')) {
            const match = line.match(/Merender halaman (\d+)\/(\d+)/);
            if (match) {
              event.sender.send('compression-status', {
                status: 'rasterizing',
                message: 'Rebuilding vector pages...',
                currentPage: parseInt(match[1]),
                totalPages: parseInt(match[2])
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
          } else if (line.includes('Total halaman:')) {
            const match = line.match(/Total halaman: (\d+)/);
            if (match) {
              event.sender.send('compression-status', {
                status: 'processing',
                message: 'Processing pages...',
                totalPages: parseInt(match[1])
              });
            }
          } else if (line.includes('Membaca PDF')) {
            event.sender.send('compression-status', { status: 'reading', message: 'Reading PDF...' });
          } else if (line.includes('Memeriksa halaman')) {
            event.sender.send('compression-status', {
              status: 'rasterizing',
              message: 'Analyzing page content...'
            });
          } else if (line.includes('Engine Ghostscript')) {
            // Second engine gives no per-page output, so announce the phase --
            // otherwise the UI looks frozen for the whole Ghostscript pass.
            event.sender.send('compression-status', {
              status: 'optimizing',
              message: 'Optimizing PDF structure...'
            });
          } else if (line.includes('Menyimpan PDF')) {
            event.sender.send('compression-status', { status: 'saving', message: 'Saving compressed PDF...' });
          }
        }
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('error', (error) => {
        activeCompressions.delete(python);
        // Clean up temp file
        try {
          fs.unlinkSync(tempScriptPath);
        } catch (e) {
          // Ignore cleanup errors
        }
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });

      python.on('close', (code) => {
        activeCompressions.delete(python);
        // Clean up temp file
        try {
          fs.unlinkSync(tempScriptPath);
        } catch (e) {
          // Ignore cleanup errors
        }

        if (python.cancelled) {
          reject(new Error('Compression cancelled'));
          return;
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
}

// Handle PDF compression
ipcMain.handle('compress-pdf', async (event, data) => {
  // Bug #7 fix: Handle both old format (outputPath) and new format (outputFolder + fileName)
  let outputPath;
  if (data.outputPath) {
    // Old format - direct outputPath
    outputPath = data.outputPath;
  } else if (data.outputFolder && data.fileName) {
    // New format - construct path safely with path.join()
    outputPath = path.join(data.outputFolder, `compressed_${data.fileName}`);
  } else {
    return Promise.reject(new Error('Missing output path parameters'));
  }
  
  return runCompressPDF({ 
    inputPath: data.inputPath, 
    outputPath: outputPath, 
    quality: data.quality, 
    event 
  });
});

// Handle batch compression (Bug #6 fix: use extracted function instead of ipcMain.invoke)
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
      
      // Use extracted function directly instead of ipcMain.invoke
      const result = await runCompressPDF({
        inputPath,
        outputPath,
        quality,
        event
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
