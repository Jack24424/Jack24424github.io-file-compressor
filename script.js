// ==================== HELPERS ====================
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const MAX_FILES = 5;

// ==================== DOM ELEMENTS ====================
let fileInput, uploadArea, previewContainer, imageCounter, compressBtn, loading, downloadContainer, clearAllBtn;

let selectedFiles = [];

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  // Get all elements
  fileInput = document.getElementById('fileInput');
  uploadArea = document.getElementById('uploadArea');
  previewContainer = document.getElementById('previewContainer');
  imageCounter = document.getElementById('imageCounter');
  compressBtn = document.getElementById('compressBtn');
  loading = document.getElementById('loading');
  downloadContainer = document.getElementById('downloadContainer');
  clearAllBtn = document.getElementById('clearAllBtn');

  // If any element is missing → log error
  if (!fileInput || !uploadArea || !compressBtn) {
    console.error('Some required DOM elements are missing!');
    return;
  }

  initEventListeners();
  loadFromStorage(); // optional persistence reminder
});

// ==================== EVENT LISTENERS ====================
function initEventListeners() {
  // Drag & Drop
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
      if (['dragenter', 'dragover'].includes(eventName)) {
        uploadArea.classList.add('dragover');
      } else {
        uploadArea.classList.remove('dragover');
      }
    }, false);
  });

  uploadArea.addEventListener('drop', e => {
    handleNewFiles(e.dataTransfer.files);
  });

  // Click to open file dialog
  uploadArea.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    handleNewFiles(fileInput.files);
  });

  // Remove single file
  previewContainer.addEventListener('click', e => {
    if (e.target.classList.contains('remove-btn')) {
      const index = parseInt(e.target.dataset.index);
      if (!isNaN(index)) {
        selectedFiles.splice(index, 1);
        renderPreviews();
        updateUI();
      }
    }
  });

  // Clear all
  clearAllBtn?.addEventListener('click', () => {
    if (confirm('Remove all selected images?')) {
      selectedFiles = [];
      previewContainer.innerHTML = '';
      downloadContainer.innerHTML = '';
      updateUI();
      localStorage.removeItem('imageCompressorFiles');
    }
  });

  // Compress button
  compressBtn.addEventListener('click', handleCompression);
}

// ==================== FILE HANDLING ====================
function handleNewFiles(newFiles) {
  const files = Array.from(newFiles || [])
    .filter(f => f.type.startsWith('image/'))
    .slice(0, MAX_FILES - selectedFiles.length);

  if (files.length === 0) return;

  selectedFiles = [...selectedFiles, ...files];
  renderPreviews();
  updateUI();
}

function renderPreviews() {
  previewContainer.innerHTML = '';

  selectedFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = e => {
      const item = document.createElement('div');
      item.className = 'preview-item';
      item.innerHTML = `
        <button class="remove-btn" data-index="${index}">×</button>
        <img src="${e.target.result}" alt="${file.name}">
        <div class="size-info">
          <div class="original">Original: ${formatFileSize(file.size)}</div>
          <div class="compressed" id="comp-size-${index}">Compressed: —</div>
        </div>
      `;
      previewContainer.appendChild(item);
    };
    reader.readAsDataURL(file);
  });
}

// ==================== COMPRESSION ====================
async function compressImage(file, quality) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);

        const q = quality === 'low' ? 0.3 : quality === 'medium' ? 0.6 : 0.88;

        canvas.toBlob(blob => {
          resolve({ blob, size: blob?.size || 0 });
        }, 'image/jpeg', q);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleCompression() {
  if (selectedFiles.length === 0) return;

  const quality = document.querySelector('input[name="quality"]:checked')?.value;
  if (!quality) {
    alert('Please select compression quality');
    return;
  }

  loading.style.display = 'block';
  compressBtn.disabled = true;
  downloadContainer.innerHTML = '';

  try {
    for (let i = 0; i < selectedFiles.length; i++) {
      imageCounter.textContent = `Compressing ${i + 1}/${selectedFiles.length}...`;

      const { blob, size: compressedSize } = await compressImage(selectedFiles[i], quality);
      const originalSize = selectedFiles[i].size;
      const savings = originalSize > 0 ? Math.round((1 - compressedSize / originalSize) * 100) : 0;

      // Update preview
      const sizeEl = document.getElementById(`comp-size-${i}`);
      if (sizeEl) {
        sizeEl.innerHTML = `Compressed: ${formatFileSize(compressedSize)} <span class="savings">(-${savings}%)</span>`;
      }

      // Download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compressed_${selectedFiles[i].name.replace(/\.[^/.]+$/, ".jpg")}`;
      link.textContent = `↓ ${selectedFiles[i].name} (${formatFileSize(compressedSize)})`;
      link.style.display = 'block';
      link.style.margin = '12px 0';
      downloadContainer.appendChild(link);
    }

    imageCounter.textContent = `${selectedFiles.length} images compressed successfully!`;
  } catch (err) {
    console.error('Compression failed:', err);
    alert('Compression failed. Please try again.');
  } finally {
    loading.style.display = 'none';
    compressBtn.disabled = false;
  }
}

// ==================== UI UPDATE ====================
function updateUI() {
  const count = selectedFiles.length;
  imageCounter.textContent = `${count} / ${MAX_FILES} images selected`;
  compressBtn.disabled = count === 0;
  clearAllBtn.style.display = count > 0 ? 'inline-block' : 'none';
}

// ==================== STORAGE REMINDER ====================
function loadFromStorage() {
  const saved = localStorage.getItem('imageCompressorFiles');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data.length > 0) {
        previewContainer.innerHTML = '<p style="text-align:center; color:#e67e22; padding:20px;">Previous selection remembered (re-select files to compress again)</p>';
        data.forEach(f => {
          const div = document.createElement('div');
          div.style.padding = '10px';
          div.style.border = '1px dashed #ccc';
          div.innerHTML = `<strong>${f.name}</strong><br>${formatFileSize(f.size)}`;
          previewContainer.appendChild(div);
        });
      }
    } catch (e) {
      console.warn('Invalid saved data');
    }
  }
}
