// State
let selectedFiles = [];
let selectedQuality = 80;
let outputFolder = '';

// DOM Elements
const dropZone = document.getElementById('dropZone');
const selectFilesBtn = document.getElementById('selectFilesBtn');
const fileList = document.getElementById('fileList');
const filesContainer = document.getElementById('filesContainer');
const fileCount = document.getElementById('fileCount');
const clearFilesBtn = document.getElementById('clearFilesBtn');
const settings = document.getElementById('settings');
const qualityButtons = document.querySelectorAll('.quality-btn');
const outputPath = document.getElementById('outputPath');
const selectOutputBtn = document.getElementById('selectOutputBtn');
const compressBtn = document.getElementById('compressBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const progressDetail = document.getElementById('progressDetail');
const progressPage = document.getElementById('progressPage');
const currentFileName = document.getElementById('currentFileName');
const results = document.getElementById('results');
const resultsStats = document.getElementById('resultsStats');
const openFolderBtn = document.getElementById('openFolderBtn');
const compressMoreBtn = document.getElementById('compressMoreBtn');

// Prevent default drag behavior on whole document
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

// Listen for compression status updates
let currentFileProgress = 0;
let totalPagesInFile = 0;

window.electronAPI.onCompressionStatus((data) => {
  if (data.status === 'reading') {
    progressDetail.textContent = data.message;
    progressPage.textContent = '';
    // Small progress for reading
    animateProgressTo(currentFileProgress + 2);
  } else if (data.status === 'processing') {
    progressDetail.textContent = data.message;
    
    if (data.totalPages && !totalPagesInFile) {
      totalPagesInFile = data.totalPages;
    }
    
    if (data.currentPage && data.totalPages) {
      const pageProgress = (data.currentPage / data.totalPages * 100).toFixed(1);
      progressPage.textContent = `Page ${data.currentPage} of ${data.totalPages} (${pageProgress}%)`;
      
      // Calculate smooth progress within current file
      const fileIndex = selectedFiles.indexOf(selectedFiles[0]); // Current file index
      const progressPerFile = 100 / selectedFiles.length;
      const baseProgress = fileIndex * progressPerFile;
      const fileProgress = (data.currentPage / data.totalPages) * progressPerFile;
      const targetProgress = baseProgress + fileProgress;
      
      animateProgressTo(targetProgress);
    }
  } else if (data.status === 'saving') {
    progressDetail.textContent = data.message;
    progressPage.textContent = 'Almost done...';
    // Near completion for current file
    const fileIndex = selectedFiles.indexOf(selectedFiles[0]);
    const progressPerFile = 100 / selectedFiles.length;
    const targetProgress = (fileIndex + 0.95) * progressPerFile;
    animateProgressTo(targetProgress);
  }
});

// Smooth progress animation
function animateProgressTo(targetPercent) {
  const currentPercent = parseFloat(progressFill.style.width) || 0;
  const diff = targetPercent - currentPercent;
  const steps = 20;
  const increment = diff / steps;
  let step = 0;
  
  const animate = () => {
    if (step < steps) {
      const newPercent = currentPercent + (increment * step);
      progressFill.style.width = `${Math.min(100, Math.max(0, newPercent))}%`;
      step++;
      requestAnimationFrame(animate);
    } else {
      progressFill.style.width = `${Math.min(100, Math.max(0, targetPercent))}%`;
    }
  };
  
  requestAnimationFrame(animate);
}

// Drag and Drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
  // Only remove class if leaving the dropZone itself, not child elements
  if (e.target === dropZone) {
    dropZone.classList.remove('drag-over');
  }
});

dropZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove('drag-over');
  
  console.log('Drop event triggered');
  console.log('DataTransfer files:', e.dataTransfer.files);
  console.log('DataTransfer items:', e.dataTransfer.items);
  
  const files = Array.from(e.dataTransfer.files);
  console.log('Files array:', files);
  
  const pdfFiles = files.filter(file => {
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    console.log(`File: ${file.name}, Type: ${file.type}, Path: ${file.path}, isPDF: ${isPDF}`);
    return isPDF;
  });
  
  console.log('Filtered PDF files:', pdfFiles);
  
  if (pdfFiles.length > 0) {
    // Try multiple methods to get file paths
    const filePaths = [];
    
    for (const file of pdfFiles) {
      let filePath = null;
      
      // Method 1: Direct path property (Electron specific)
      if (file.path) {
        filePath = file.path;
        console.log(`Method 1 (file.path): ${filePath}`);
      }
      // Method 2: Use webUtils API
      else if (window.electronAPI.getPathForFile) {
        filePath = window.electronAPI.getPathForFile(file);
        console.log(`Method 2 (webUtils): ${filePath}`);
      }
      
      if (filePath) {
        filePaths.push(filePath);
      } else {
        console.error(`Could not get path for file: ${file.name}`);
      }
    }
    
    console.log('Final file paths:', filePaths);
    
    if (filePaths.length > 0) {
      await addFiles(filePaths);
    } else {
      console.error('Could not get any file paths');
      alert('Could not read file paths. Please use "Select Files" button instead.');
    }
  } else {
    console.log('No PDF files found in drop');
    if (files.length > 0) {
      alert('Please drop PDF files only');
    }
  }
});

// Select Files Button
selectFilesBtn.addEventListener('click', async () => {
  const filePaths = await window.electronAPI.selectFiles();
  if (filePaths && filePaths.length > 0) {
    addFiles(filePaths);
  }
});

// Add Files
async function addFiles(filePaths) {
  for (const filePath of filePaths) {
    if (!selectedFiles.includes(filePath)) {
      selectedFiles.push(filePath);
    }
  }
  
  await updateFileList();
  showSettings();
}

// Update File List
async function updateFileList() {
  filesContainer.innerHTML = '';
  fileCount.textContent = selectedFiles.length;
  
  for (let index = 0; index < selectedFiles.length; index++) {
    const filePath = selectedFiles[index];
    const fileName = filePath.split(/[\\/]/).pop();
    const fileSizeBytes = await window.electronAPI.getFileSize(filePath);
    const fileSize = formatBytes(fileSizeBytes);
    
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
      <div class="file-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 18H17V16H7V18ZM7 14H17V12H7V14ZM14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#EF4444"/>
        </svg>
      </div>
      <div class="file-info">
        <div class="file-name" title="${fileName}">${fileName}</div>
        <div class="file-size">${fileSize}</div>
      </div>
      <button class="file-remove" data-index="${index}">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 6L14 14M6 14L14 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    `;
    
    filesContainer.appendChild(fileItem);
  }
  
  // Add remove listeners
  document.querySelectorAll('.file-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      removeFile(index);
    });
  });
  
  if (selectedFiles.length === 0) {
    hideSettings();
  }
}

// Get File Size from file system (removed - now using IPC)
// Remove File
function removeFile(index) {
  selectedFiles.splice(index, 1);
  updateFileList();
}

// Clear All Files
clearFilesBtn.addEventListener('click', () => {
  selectedFiles = [];
  updateFileList();
});

// Show/Hide Settings
function showSettings() {
  dropZone.style.display = 'none';
  fileList.style.display = 'block';
  settings.style.display = 'block';
}

function hideSettings() {
  dropZone.style.display = 'block';
  fileList.style.display = 'none';
  settings.style.display = 'none';
}

// Quality Selection
qualityButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    qualityButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedQuality = parseInt(btn.dataset.quality);
  });
});

// Select Output Folder
selectOutputBtn.addEventListener('click', async () => {
  const folder = await window.electronAPI.selectOutputFolder();
  if (folder) {
    outputFolder = folder;
    outputPath.value = folder;
  }
});

// Compress Button
compressBtn.addEventListener('click', async () => {
  if (selectedFiles.length === 0) {
    alert('Please select at least one PDF file');
    return;
  }
  
  if (!outputFolder) {
    alert('Please select an output folder');
    return;
  }
  
  // Show progress
  fileList.style.display = 'none';
  settings.style.display = 'none';
  progressContainer.style.display = 'block';
  
  // Start compression
  try {
    const results = await compressBatch();
    showResults(results);
  } catch (error) {
    alert('Compression failed: ' + error.message);
    hideProgress();
  }
});

// Compress Batch
async function compressBatch() {
  const results = [];
  
  for (let i = 0; i < selectedFiles.length; i++) {
    const filePath = selectedFiles[i];
    const fileName = filePath.split(/[\\/]/).pop();
    const outputPath = `${outputFolder}\\compressed_${fileName}`;
    
    // Reset for new file
    totalPagesInFile = 0;
    currentFileProgress = (i / selectedFiles.length) * 100;
    
    // Update UI
    progressText.textContent = `Processing file ${i + 1} of ${selectedFiles.length}`;
    currentFileName.textContent = fileName;
    progressDetail.textContent = 'Starting compression...';
    progressPage.textContent = '';
    
    // Set initial progress for this file
    animateProgressTo(currentFileProgress);
    
    try {
      console.log(`Compressing file ${i + 1}:`, fileName);
      console.log('Input path:', filePath);
      console.log('Output path:', outputPath);
      console.log('Quality:', selectedQuality);
      
      const result = await window.electronAPI.compressPDF({
        inputPath: filePath,
        outputPath: outputPath,
        quality: selectedQuality
      });
      
      console.log('Compression result:', result);
      
      if (result && result.success) {
        results.push({
          fileName,
          success: true,
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
          reduction: result.reduction
        });
        
        // Complete progress for this file
        const completeProgress = ((i + 1) / selectedFiles.length) * 100;
        animateProgressTo(completeProgress);
      } else {
        results.push({
          fileName,
          success: false,
          error: 'Compression returned unsuccessful result'
        });
      }
    } catch (error) {
      console.error('Compression error:', error);
      results.push({
        fileName,
        success: false,
        error: error.message || error.error || String(error)
      });
    }
    
    // Small delay between files for smooth transition
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  return results;
}

// Show Results
function showResults(resultsData) {
  progressContainer.style.display = 'none';
  results.style.display = 'block';
  
  // Debug: Log results data
  console.log('Results data:', resultsData);
  
  // Calculate totals
  const successCount = resultsData.filter(r => r.success).length;
  const failedCount = resultsData.length - successCount;
  
  // Calculate sizes - ensure we have valid numbers
  let totalOriginalSize = 0;
  let totalCompressedSize = 0;
  
  resultsData.forEach(r => {
    if (r.success && r.originalSize && r.compressedSize) {
      totalOriginalSize += parseInt(r.originalSize) || 0;
      totalCompressedSize += parseInt(r.compressedSize) || 0;
      console.log(`File: ${r.fileName}, Original: ${r.originalSize}, Compressed: ${r.compressedSize}`);
    }
  });
  
  const totalReduction = totalOriginalSize > 0 
    ? ((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100).toFixed(2)
    : 0;
  
  console.log('Totals:', {
    successCount,
    failedCount,
    totalOriginalSize,
    totalCompressedSize,
    totalReduction
  });
  
  // Display stats
  resultsStats.innerHTML = `
    <div class="stat-item">
      <span class="stat-label">Files Processed</span>
      <span class="stat-value success">${successCount} / ${resultsData.length}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Original Size</span>
      <span class="stat-value">${formatBytes(totalOriginalSize)}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Compressed Size</span>
      <span class="stat-value">${formatBytes(totalCompressedSize)}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Space Saved</span>
      <span class="stat-value success">${totalReduction}%</span>
    </div>
  `;
  
  // Show failed files if any
  if (failedCount > 0) {
    const failedFiles = resultsData.filter(r => !r.success);
    const failedList = failedFiles.map(f => `<li>${f.fileName}: ${f.error}</li>`).join('');
    resultsStats.innerHTML += `
      <div class="stat-item error-item">
        <span class="stat-label">Failed Files</span>
        <span class="stat-value error">${failedCount}</span>
      </div>
      <div class="failed-files-list">
        <ul>${failedList}</ul>
      </div>
    `;
  }
}

// Hide Progress
function hideProgress() {
  progressContainer.style.display = 'none';
  fileList.style.display = 'block';
  settings.style.display = 'block';
  progressFill.style.width = '0%';
  progressDetail.textContent = '';
  progressPage.textContent = '';
}

// Open Folder Button
openFolderBtn.addEventListener('click', async () => {
  if (outputFolder) {
    try {
      await window.electronAPI.openFolder(outputFolder);
    } catch (error) {
      console.error('Failed to open folder:', error);
      alert('Could not open output folder');
    }
  }
});

// Compress More Button
compressMoreBtn.addEventListener('click', () => {
  // Reset state
  selectedFiles = [];
  outputFolder = '';
  outputPath.value = '';
  
  // Reset UI
  results.style.display = 'none';
  dropZone.style.display = 'block';
  progressFill.style.width = '0%';
});

// Format Bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
