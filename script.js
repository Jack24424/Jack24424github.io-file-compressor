// Your helper functions stay the same
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const MAX_FILES = 5;
let selectedFiles = [];

// ── ALL MAIN LOGIC INSIDE DOMContentLoaded ──
document.addEventListener('DOMContentLoaded', () => {
  // Get elements safely
  const fileInput = document.getElementById('fileInput');
  const uploadArea = document.getElementById('uploadArea');
  const previewContainer = document.getElementById('previewContainer');
  const imageCounter = document.getElementById('imageCounter');
  const compressBtn = document.getElementById('compressBtn');
  const loading = document.getElementById('loading');
  const downloadContainer = document.getElementById('downloadContainer');
  const clearAllBtn = document.getElementById('clearAllBtn');

  // Safety check
  if (!fileInput || !uploadArea || !compressBtn) {
    console.error('Critical elements missing! Check your HTML IDs.');
    return;
  }

  // ── Your event listeners and functions here ──
  // Drag & drop
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(name => {
    uploadArea.addEventListener(name, e => {
      e.preventDefault();
      e.stopPropagation();
      if (['dragenter', 'dragover'].includes(name)) {
        uploadArea.classList.add('dragover');
      } else {
        uploadArea.classList.remove('dragover');
      }
    });
  });

  uploadArea.addEventListener('drop', e => {
    handleNewFiles(e.dataTransfer.files);
  });

  uploadArea.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    handleNewFiles(fileInput.files);
  });

  // ... rest of your code: handleNewFiles, renderPreviews, remove, clearAll, updateUI ...

  // Compression function
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

  // Compress button
  compressBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;

    const quality = document.querySelector('input[name="quality"]:checked')?.value;
    if (!quality) {
      alert('Please select quality');
      return;
    }

    loading.style.display = 'block';
    compressBtn.disabled = true;

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        imageCounter.textContent = `Compressing ${i + 1}/${selectedFiles.length}...`;

        const { blob, size } = await compressImage(selectedFiles[i], quality);

        // Create download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `compressed_${selectedFiles[i].name}`;
        link.textContent = `Download ${selectedFiles[i].name}`;
        downloadContainer.appendChild(link);
      }
      imageCounter.textContent = 'Done!';
    } catch (err) {
      console.error(err);
      alert('Error during compression');
    } finally {
      loading.style.display = 'none';
      compressBtn.disabled = false;
    }
  });

  // ... add your other functions: handleNewFiles, renderPreviews, updateUI, etc.
});
