// ==================== HELPERS ====================
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const MAX_FILES = 5;

// ==================== DOM ====================
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const previewContainer = document.getElementById('previewContainer');
const imageCounter = document.getElementById('imageCounter');
const compressBtn = document.getElementById('compressBtn');
const loading = document.getElementById('loading');
const downloadContainer = document.getElementById('downloadContainer');
const clearAllBtn = document.getElementById('clearAllBtn');

// ==================== PERSISTENCE (localStorage) ====================
const STORAGE_KEY = 'imageCompressorFiles';

function saveFilesToStorage(files) {
  const data = files.map(file => ({
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
    // We can't store File object → we'll recreate preview only
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFilesFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

// ==================== DRAG & DROP ====================
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(name => {
  uploadArea.addEventListener(name, e => {
    e.preventDefault();
    e.stopPropagation();
    if (['dragenter', 'dragover'].includes(name)) {
      uploadArea.classList.add('dragover');
    } else {
      uploadArea.classList.remove('dragover');
    }
  }, false);
});

uploadArea.addEventListener('drop', e => {
  const dt = e.dataTransfer;
  handleNewFiles(dt.files);
});

uploadArea.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  handleNewFiles(fileInput.files);
});

function handleNewFiles(newFiles) {
  const currentCount = selectedFiles.length;
  const availableSlots = MAX_FILES - currentCount;
  
  if (availableSlots <= 0) {
    alert(`You already have ${MAX_FILES} images. Remove some first!`);
    return;
  }

  const filesArray = Array.from(newFiles || [])
    .filter(f => f.type.startsWith('image/'))
    .slice(0, availableSlots);

  if (filesArray.length === 0) return;

  selectedFiles = [...selectedFiles, ...filesArray];
  
  renderPreviews();
  updateCounter();
  compressBtn.disabled = selectedFiles.length === 0;
  clearAllBtn.style.display = selectedFiles.length > 0 ? 'inline-block' : 'none';

  saveFilesToStorage(selectedFiles); // only metadata
}

// ==================== RENDER PREVIEWS ====================
let selectedFiles = [];

function renderPreviews() {
  previewContainer.innerHTML = '';

  selectedFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = e => {
      const item = document.createElement('div');
      item.className = 'preview-item';
      item.dataset.index = index;

      item.innerHTML = `
        <button class="remove-btn" type="button" data-index="${index}">×</button>
        <img src="${e.target.result}" alt="${file.name}">
        <div class="size-info">
          <span class="original">Original: ${formatFileSize(file.size)}</span><br>
          <span class="compressed" id="comp-size-${index}">Compressed: —</span>
        </div>
      `;

      previewContainer.appendChild(item);
    };
    reader.readAsDataURL(file);
  });
}

// Remove single file
previewContainer.addEventListener('click', e => {
  if (e.target.classList.contains('remove-btn')) {
    const index = parseInt(e.target.dataset.index);
    if (!isNaN(index)) {
      selectedFiles.splice(index, 1);
      renderPreviews();
      updateCounter();
      compressBtn.disabled = selectedFiles.length === 0;
      clearAllBtn.style.display = selectedFiles.length > 0 ? 'inline-block' : 'none';
      saveFilesToStorage(selectedFiles);
    }
  }
});

// Clear all
clearAllBtn.addEventListener('click', () => {
  if (confirm('Remove all selected images?')) {
    selectedFiles = [];
    previewContainer.innerHTML = '';
    downloadContainer.innerHTML = '';
    updateCounter();
    compressBtn.disabled = true;
    clearAllBtn.style.display = 'none';
    localStorage.removeItem(STORAGE_KEY);
  }
});

function updateCounter() {
  imageCounter.textContent = `${selectedFiles.length} / ${MAX_FILES} images selected`;
}

// ==================== LOAD ON PAGE START ====================
window.addEventListener('load', () => {
  const saved = loadFilesFromStorage();
  if (saved.length > 0) {
    alert('Previous files loaded from last session!');
    // Note: We can't restore actual File objects → user needs to re-select
    // But we can show names/sizes as reminder
    selectedFiles = []; // reset real files
    previewContainer.innerHTML = '<p style="color:#e67e22; text-align:center; padding:20px;">Previous selection remembered (re-select files to continue)</p>';
    
    saved.forEach((meta, i) => {
      const div = document.createElement('div');
      div.style.padding = '10px';
      div.style.border = '1px dashed #bdc3c7';
      div.style.margin = '8px';
      div.innerHTML = `<strong>${meta.name}</strong><br>${formatFileSize(meta.size)}`;
      previewContainer.appendChild(div);
    });
    
    selectedFiles = []; // force re-upload
    updateCounter();
  }
});

// ==================== COMPRESSION (same as before, just update counter at end) ====================
// ... keep your existing compressImage + compressBtn listener ...

compressBtn.addEventListener('click', async () => {
  // ... your compression code ...

  // At the very end:
  loading.style.display = 'none';
  compressBtn.disabled = false;
  imageCounter.textContent = `${selectedFiles.length} images compressed! Ready for new batch.`;
  // Optional: localStorage.removeItem(STORAGE_KEY); // clear after success
});



(function(){
  function prevent(e){
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  // Add CSS to disable text selection globally
  try{
    var style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode('*{ -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none !important; }'));
    document.head && document.head.appendChild(style);
  }catch(e){/* ignore */}

  // Block copy/cut/paste, context menu, selectstart and dragstart
  ['copy','cut','paste','contextmenu','selectstart','dragstart'].forEach(function(evt){
    document.addEventListener(evt, prevent, true);
  });

  // Block common keyboard shortcuts (Ctrl/Cmd + C/X/A/S, F12, Ctrl+U, Ctrl+Shift+I)
  document.addEventListener('keydown', function(e){
    var key = (e.key || '').toLowerCase();
    if((e.ctrlKey || e.metaKey) && (key === 'c' || key === 'x' || key === 'a' || key === 's')){
      prevent(e);
      return false;
    }
    if(e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'i'))){
      prevent(e);
      return false;
    }
    if((e.ctrlKey || e.metaKey) && key === 'u'){
      prevent(e);
      return false;
    }
  }, true);

  // Allow selection and normal behavior inside inputs, textareas and contenteditable elements
  function allowInputs(root){
    if(!root || !root.querySelectorAll) return;
    var nodes = root.querySelectorAll('input, textarea, [contenteditable]');
    for(var i=0;i<nodes.length;i++){
      nodes[i].style.userSelect = 'text';
      nodes[i].style.webkitUserSelect = 'text';
      nodes[i].style.MozUserSelect = 'text';
      nodes[i].addEventListener('selectstart', function(e){ e.stopPropagation(); }, true);
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ allowInputs(document); });
  }else{
    allowInputs(document);
  }

})();









document.addEventListener('DOMContentLoaded', () => {
  const themeBtn = document.getElementById('themeToggle');
  const html = document.documentElement;

  // Check saved preference
  if (localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.classList.add('dark-mode');
  }

  themeBtn.addEventListener('click', () => {
    html.classList.toggle('dark-mode');
    
    // Save preference
    if (html.classList.contains('dark-mode')) {
      localStorage.setItem('theme', 'dark');
    } else {
      localStorage.setItem('theme', 'light');
    }
  });
});