// script-files.js
// For general file compression page - packs selected files into ZIP

const MAX_FILES = 5;

const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const fileList = document.getElementById('fileList');
const fileCounter = document.getElementById('fileCounter');
const compressBtn = document.getElementById('compressBtn');
const loading = document.getElementById('loading');
const downloadContainer = document.getElementById('downloadContainer');
const clearAllBtn = document.getElementById('clearAllBtn');

let selectedFiles = [];

// ── Helpers ────────────────────────────────────────────────
function formatSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return bytes.toFixed(1) + ' ' + units[i];
}

// ── Drag & Drop + Click ────────────────────────────────────
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
  uploadArea.addEventListener(event, e => {
    e.preventDefault();
    e.stopPropagation();
    if (event === 'dragenter' || event === 'dragover') {
      uploadArea.classList.add('dragover');
    } else {
      uploadArea.classList.remove('dragover');
    }
  });
});

uploadArea.addEventListener('drop', e => {
  handleFiles(e.dataTransfer.files);
});

uploadArea.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  handleFiles(fileInput.files);
});

function handleFiles(filesList) {
  const newFiles = Array.from(filesList || []);
  const available = MAX_FILES - selectedFiles.length;

  if (available <= 0) {
    alert(`You already have ${MAX_FILES} files. Remove some first.`);
    return;
  }

  const toAdd = newFiles.slice(0, available);
  selectedFiles = [...selectedFiles, ...toAdd];

  renderFileList();
  updateUI();
}

function renderFileList() {
  fileList.innerHTML = '';

  selectedFiles.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
      <div class="info">
        <div class="name">${file.name}</div>
        <div class="size">${formatSize(file.size)}</div>
      </div>
      <button class="remove-btn" data-index="${index}">×</button>
    `;

    fileList.appendChild(item);
  });
}




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


// Remove file
fileList.addEventListener('click', e => {
  if (e.target.classList.contains('remove-btn')) {
    const index = parseInt(e.target.dataset.index);
    if (!isNaN(index)) {
      selectedFiles.splice(index, 1);
      renderFileList();
      updateUI();
    }
  }
});

clearAllBtn.addEventListener('click', () => {
  if (confirm('Clear all selected files?')) {
    selectedFiles = [];
    fileList.innerHTML = '';
    downloadContainer.innerHTML = '';
    updateUI();
  }
});

function updateUI() {
  const count = selectedFiles.length;
  fileCounter.textContent = `${count} / ${MAX_FILES} files selected`;
  compressBtn.disabled = count === 0;
  clearAllBtn.style.display = count > 0 ? 'inline-block' : 'none';
}

// ── ZIP Compression ────────────────────────────────────────
// You need to include JSZip library!
// Add this to <head> of compressor-files.html:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>

compressBtn.addEventListener('click', async () => {
  if (selectedFiles.length === 0) return;

  loading.style.display = 'block';
  compressBtn.disabled = true;
  downloadContainer.innerHTML = '';

  try {
    const zip = new JSZip();

    // Add all files to zip
    for (const file of selectedFiles) {
      zip.file(file.name, file);
    }

    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Create download link
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compressed_files_${new Date().toISOString().slice(0,10)}.zip`;
    link.textContent = `Download ZIP (${formatSize(zipBlob.size)})`;
    downloadContainer.appendChild(link);

    // Optional: auto-click (uncomment if you want auto download)
    // link.click();

  } catch (err) {
    console.error(err);
    alert('Failed to create ZIP file. Please try again.');
  }

  loading.style.display = 'none';
  compressBtn.disabled = false;
});

// Initial UI update
updateUI();







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