// --- Navigation Logic ---
function switchView(viewName) {
    // Update nav buttons
    document.getElementById('nav-kb').classList.remove('active');
    document.getElementById('nav-chat').classList.remove('active');
    document.getElementById(`nav-${viewName}`).classList.add('active');

    // Update views
    document.getElementById('view-kb').classList.remove('active');
    document.getElementById('view-chat').classList.remove('active');
    document.getElementById(`view-${viewName}`).classList.add('active');
}

// --- Toast / Notification Logic ---
function showToast(message, type = 'error') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'error' ? '❌' : (type === 'success' ? '✅' : 'ℹ️');
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);

    // Remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- KNOWLEDGE BASE LOGIC ---

let filesData = [];
let fileIdCounter = 0;
let fileToDelete = null;

// Drag & Drop Events
const dropZone = document.getElementById('upload-zone');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
});

dropZone.addEventListener('drop', (e) => {
    let dt = e.dataTransfer;
    let files = dt.files;
    handleFiles(files);
});

function handleFileSelect(event) {
    handleFiles(event.target.files);
    event.target.value = ''; // Reset input
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        // Mock validation (Only accept txt, pdf, docx)
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['pdf', 'txt', 'docx'].includes(ext)) {
            showToast(`Gagal mengunggah "${file.name}". Format file tidak didukung.`, 'error');
            return;
        }

        addFileToUI(file);
    });
}

function addFileToUI(file) {
    const fileId = `file-${fileIdCounter++}`;
    const sizeKB = (file.size / 1024).toFixed(1);
    let sizeStr = sizeKB > 1024 ? `${(sizeKB/1024).toFixed(1)} MB` : `${sizeKB} KB`;
    if (file.size === 0) sizeStr = "1.2 MB"; // Mock size if drag & drop breaks actual size
    
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

    const fileObj = {
        id: fileId,
        name: file.name,
        size: sizeStr,
        date: dateStr,
        status: 'uploading', // uploading, processing, ready, error
        progress: 0
    };
    
    filesData.push(fileObj);
    renderFileList();
    simulateProcessingFlow(fileId);
}

function renderFileList() {
    const listContainer = document.getElementById('file-list');
    const emptyState = document.getElementById('empty-state');
    const countText = document.getElementById('file-count-text');

    countText.innerText = filesData.length;

    if (filesData.length === 0) {
        listContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    listContainer.style.display = 'block';
    emptyState.style.display = 'none';

    // Sort so newest is on top (conceptually, or we just render reverse)
    listContainer.innerHTML = filesData.slice().reverse().map(f => `
        <div class="file-item" id="${f.id}">
            <div class="file-icon">📄</div>
            <div class="file-info">
                <div class="file-name" title="${f.name}">${f.name}</div>
                <div class="file-meta">
                    <span>${f.size}</span>
                    <span>•</span>
                    <span>${f.date}</span>
                </div>
                ${(f.status === 'uploading' || f.status === 'processing') ? `
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${f.progress}%"></div>
                        </div>
                        <div class="progress-text">${f.progress}%</div>
                    </div>
                ` : ''}
            </div>
            
            <div class="file-status">
                ${getStatusHTML(f.status)}
            </div>

            <div class="file-actions">
                ${(f.status === 'ready' || f.status === 'error') ? `
                    <button class="btn-danger" onclick="openDeleteModal('${f.id}')">Hapus</button>
                ` : ''}
                ${f.status === 'error' ? `
                    <button class="btn-retry" onclick="retryFile('${f.id}')">Coba Lagi</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function getStatusHTML(status) {
    switch(status) {
        case 'uploading': return '<span class="status-uploading">⬆️ Mengunggah...</span>';
        case 'processing': return '<span class="status-processing">⏳ Memproses...</span>';
        case 'ready': return '<span class="status-ready">✅ Siap</span>';
        case 'error': return '<span class="status-error">❌ Gagal</span>';
    }
}

// Mock the upload -> process -> ready flow
function simulateProcessingFlow(fileId, failSimulation = false) {
    let file = filesData.find(f => f.id === fileId);
    if (!file) return;

    let progress = 0;
    file.status = 'uploading';
    
    // Uploading phase
    const uploadInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 20) + 10;
        if (progress >= 100) {
            clearInterval(uploadInterval);
            file.progress = 100;
            file.status = 'processing';
            renderFileList();
            
            // Processing phase
            setTimeout(() => {
                // Randomly fail sometimes if requested, or based on name simulation if needed
                if (failSimulation || Math.random() < 0.1) {
                    file.status = 'error';
                    showToast(`Gagal memproses file "${file.name}".`, 'error');
                } else {
                    file.status = 'ready';
                    showToast(`File "${file.name}" berhasil ditambahkan ke knowledge base.`, 'success');
                }
                renderFileList();
            }, 2000);
        } else {
            file.progress = progress;
            renderFileList();
        }
    }, 300);
}

function retryFile(id) {
    let file = filesData.find(f => f.id === id);
    if(file) {
        file.progress = 0;
        file.status = 'uploading';
        renderFileList();
        simulateProcessingFlow(id, false); // force success this time
    }
}

function openDeleteModal(id) {
    fileToDelete = id;
    const file = filesData.find(f => f.id === id);
    document.getElementById('delete-filename').innerText = file.name;
    document.getElementById('delete-modal').classList.add('active');
}

function closeDeleteModal() {
    fileToDelete = null;
    document.getElementById('delete-modal').classList.remove('active');
}

function confirmDelete() {
    if (fileToDelete) {
        filesData = filesData.filter(f => f.id !== fileToDelete);
        renderFileList();
        showToast("File berhasil dihapus.", "success");
    }
    closeDeleteModal();
}

// --- PRE-LOAD MOCK DATA ---
filesData = [
    { id: 'mock-1', name: 'panduan-produk-lengkap.pdf', size: '1.2 MB', date: '27 Feb', status: 'ready', progress: 100 },
    { id: 'mock-2', name: 'faq-janasku.txt', size: '340 KB', date: '26 Feb', status: 'ready', progress: 100 }
];
document.addEventListener('DOMContentLoaded', () => {
    renderFileList();
});


// --- CHAT LOGIC ---
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatMessages = document.getElementById('chat-messages');

if (chatInput) {
    // Enable/disable send button based on input
    chatInput.addEventListener('input', (e) => {
        sendBtn.disabled = e.target.value.trim() === '';
    });
}

function handleChatSubmit(e) {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (text) {
        simulateChat(text);
        chatInput.value = '';
        sendBtn.disabled = true;
    }
}

function simulateChat(userQuestion) {
    // Remove welcome state if exists
    const welcomeNode = document.getElementById('welcome-chat');
    if (welcomeNode) {
        welcomeNode.style.display = 'none';
    }

    // 1. Add User Message
    appendUserMessage(userQuestion);
    
    // Disable input while typing
    chatInput.disabled = true;
    sendBtn.innerHTML = `
        <div class="typing-indicator" style="padding:0; margin:auto">
            <div class="dot" style="background:white; width:4px; height:4px"></div>
            <div class="dot" style="background:white; width:4px; height:4px"></div>
            <div class="dot" style="background:white; width:4px; height:4px"></div>
        </div>
    `;

    // 2. Add Bot Typing Indicator
    const typingId = 'typing-' + Date.now();
    const typingHtml = `
        <div class="message bot" id="${typingId}">
            <div class="avatar">🤖</div>
            <div class="message-body">
                <div class="msg-content">
                    <div class="typing-indicator">
                        <div class="dot"></div><div class="dot"></div><div class="dot"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    chatMessages.insertAdjacentHTML('beforeend', typingHtml);
    scrollToBottom();

    // 3. Simulate processing delay
    setTimeout(() => {
        // Remove typing
        document.getElementById(typingId).remove();
        
        // Restore input
        chatInput.disabled = false;
        sendBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
            </svg>
        `;
        chatInput.focus();

        // Generate Response based on keyword
        const q = userQuestion.toLowerCase();
        if (q === 'error_test') {
            appendBotError();
        } else if (q.includes('harga') || q.includes('cost')) {
            appendBotOutOfKnowledge();
        } else if (q.includes('apa') && q.includes('terbuat')) {
            appendBotMessage(
                `Janasku terbuat dari 3 bahan utama alami:<br><br>1. <b>Jahe (Ginger)</b> — untuk menghangatkan badan dan imun.<br>2. <b>Nanas (Pineapple)</b> — memberi rasa manis alami dan vitamin C.<br>3. <b>Kunyit (Turmeric)</b> — sebagai anti-inflamasi kuat.<br><br>Ketiga bahan ini diproses secara higienis dan modern sehingga praktis dikonsumsi tanpa mengurangi khasiat aslinya.`,
                [{ file: 'panduan-produk-lengkap.pdf', info: 'Halaman 2-3' }]
            );
        } else if (q.includes('minum') || q.includes('pakai')) {
            appendBotMessage(
                `Sangat mudah! Cara minum Janasku:<br><br>• <b>Dewasa:</b> 1 sendok makan, 2x sehari.<br>• Bisa diminum langsung dari sendok, atau dicampurkan dengan setengah gelas air hangat.<br>• Disarankan diminum setelah makan jika Anda memiliki sensitivitas lambung terhadap jahe.`,
                [{ file: 'panduan-produk-lengkap.pdf', info: 'Halaman 5' }, { file: 'faq-janasku.txt', info: 'Bagian Aturan Pakai' }]
            );
        } else if (q.includes('hamil')) {
            appendBotMessage(
                `Walaupun menggunakan bahan alami, penggunaan pada ibu hamil sebaiknya <b>konsultasikan terlebih dahulu dengan dokter kandungan</b>. Beberapa herbal spesifik seperti kunyit dalam dosis pekat direkomendasikan berhati-hati bagi wanita hamil pada trimester pertama.`,
                [{ file: 'faq-janasku.txt', info: 'Q: Amankah untuk kehamilan?' }]
            );
        } else {
            // Generic fallback that acts like knowledge based
            appendBotMessage(
                `Terkait hal tersebut, Janasku difokuskan sebagai minuman kesehatan keluarga yang berbahan dasar Jahe, Nanas, dan Kunyit. Produk ini tidak menggunakan pemanis buatan dan pengawet kimiawi.`,
                [{ file: 'panduan-produk-lengkap.pdf', info: 'Ringkasan Produk' }]
            );
        }
    }, 1500);
}

function appendUserMessage(text) {
    const html = `
        <div class="message user">
            <div class="avatar">👤</div>
            <div class="message-body">
                <div class="msg-content">${text}</div>
            </div>
        </div>
    `;
    chatMessages.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
}

function appendBotMessage(text, sources) {
    let sourcesHtml = '';
    if (sources && sources.length > 0) {
        const liElements = sources.map(s => `<li>${s.file} ${s.info ? `<span style="color:var(--text-muted); font-size: 0.8em">(${s.info})</span>`  : ''}</li>`).join('');
        sourcesHtml = `
            <div class="source-block">
                <strong>📎 Sumber Referensi:</strong>
                <ul>${liElements}</ul>
            </div>
        `;
    }

    const html = `
        <div class="message bot">
            <div class="avatar">🤖</div>
            <div class="message-body">
                <div class="msg-content">${text}</div>
                ${sourcesHtml}
            </div>
        </div>
    `;
    chatMessages.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
}

function appendBotOutOfKnowledge() {
    const html = `
        <div class="message bot">
            <div class="avatar">🤖</div>
            <div class="message-body">
                <div class="msg-content">
                    Maaf, saya tidak dapat menemukan informasi terkait hal tersebut di dalam Knowledge Base yang tersedia saat ini.<br><br>Informasi ini mungkin belum diunggah. Silakan hubungi admin atau Owner secara langsung untuk pertanyaan ini.
                </div>
            </div>
        </div>
    `;
    chatMessages.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
}

function appendBotError() {
    const html = `
        <div class="message bot error">
            <div class="message-body" style="width: 100%">
                <div class="msg-content" style="display:flex; justify-content:space-between; align-items:center;">
                    <span>❌ Gagal terhubung ke server. Tidak dapat menghasilkan jawaban.</span>
                    <button class="btn btn-cancel" style="padding: 0.25rem 0.75rem; font-size:0.8rem" onclick="this.closest('.message').remove(); chatInput.focus();">Tutup</button>
                </div>
            </div>
        </div>
    `;
    chatMessages.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
}

function scrollToBottom() {
    chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
    });
}
