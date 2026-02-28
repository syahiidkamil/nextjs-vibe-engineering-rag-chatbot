/**
 * Janasku Prototype - JavaScript Logic
 * Simulates Dropzone Uploads and Chatbot Interaction.
 */

// Initialize Lucide Icons
lucide.createIcons();

// Elements
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileUpload');
const browseBtn = document.getElementById('browseBtn');
const docList = document.getElementById('docList');
const docCount = document.getElementById('docCount');

const chatInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');
const chatArea = document.getElementById('chatArea');
const typingIndicator = document.getElementById('typingIndicator');
const clearBtn = document.getElementById('clearBtn');

// ==========================================
// 1. DRAG AND DROP & UPLOAD SIMULATION
// ==========================================

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop zone
['dragenter', 'dragover'].forEach(eventName => {
    uploadZone.addEventListener(eventName, () => uploadZone.classList.add('drag-over'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    uploadZone.addEventListener(eventName, () => uploadZone.classList.remove('drag-over'), false);
});

// Handle drop
uploadZone.addEventListener('drop', handleDrop, false);

// Handle Browse Click
browseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', function() {
    handleFiles(this.files);
});

function handleDrop(e) {
    let dt = e.dataTransfer;
    let files = dt.files;
    handleFiles(files);
}

function handleFiles(files) {
    ([...files]).forEach(addFileToList);
}

function addFileToList(file) {
    const isPDF = file.name.toLowerCase().endsWith('.pdf');
    const typeClass = isPDF ? 'type-pdf' : 'type-txt';
    const iconName = isPDF ? 'file-text' : 'file-type-2';
    const sizeStr = (file.size / 1024 / 1024).toFixed(2) + ' MB';

    const li = document.createElement('li');
    li.className = 'doc-card appear';
    li.innerHTML = `
        <div class="doc-icon ${typeClass}">
            <i data-lucide="${iconName}"></i>
        </div>
        <div class="doc-details">
            <h4 class="doc-name">${file.name}</h4>
            <p class="doc-meta">${sizeStr} • Just updated</p>
        </div>
        <button class="action-btn delete-btn" title="Remove context">
            <i data-lucide="trash-2"></i>
        </button>
    `;
    
    docList.prepend(li);
    lucide.createIcons(); // Re-initialize icons inside new DOM
    
    // Bind delete event
    const delBtn = li.querySelector('.delete-btn');
    delBtn.addEventListener('click', () => {
        li.style.transform = 'translateY(10px)';
        li.style.opacity = '0';
        setTimeout(() => {
            li.remove();
            updateCount();
        }, 200);
    });

    updateCount();
}

function updateCount() {
    const listItems = docList.querySelectorAll('li').length;
    docCount.innerText = listItems;
}

// Initialize existings delete buttons
document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const li = this.closest('li');
        li.style.transform = 'translateY(10px)';
        li.style.opacity = '0';
        setTimeout(() => {
            li.remove();
            updateCount();
        }, 200);
    })
});

// ==========================================
// 2. CHAT SIMULATION LOGIC
// ==========================================

function getCurrentTime() {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function createUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'message-row user-row appear';
    msg.innerHTML = `
        <div class="message-content">
            <div class="message-bubble user-bubble">${text}</div>
            <span class="message-time">${getCurrentTime()}</span>
        </div>
    `;
    return msg;
}

function createBotMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'message-row bot-row appear';
    msg.innerHTML = `
        <div class="message-avatar">J</div>
        <div class="message-content">
            <div class="message-bubble bot-bubble">${text}</div>
            <span class="message-time">${getCurrentTime()}</span>
        </div>
    `;
    return msg;
}

// Scroll to bottom
function scrollToBottom() {
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Handle Send
function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // 1. Add User Message
    chatArea.insertBefore(createUserMessage(text), typingIndicator);
    chatInput.value = '';
    scrollToBottom();

    // 2. Show Typing Indicator
    typingIndicator.style.display = 'flex';
    // Move indicator to bottom
    chatArea.appendChild(typingIndicator);
    scrollToBottom();

    // 3. Simulate Bot Reply after delay (1.5s)
    setTimeout(() => {
        typingIndicator.style.display = 'none';
        
        let reply = "Terima kasih telah bertanya! (Ini adalah simulasi MVP). Sesuai dokumen Knowledge Base, kami selalu memastikan kualitas Jahe, Nanas, dan Kunyit yang premium.";
        
        if(text.toLowerCase().includes("sop")) {
            reply = "Berdasarkan pedoman SOP saat ini, admin wajib membalas pesan pelanggan dalam waktu kurang dari 5 menit.";
        }

        chatArea.insertBefore(createBotMessage(reply), typingIndicator);
        scrollToBottom();
    }, 1500);
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

clearBtn.addEventListener('click', () => {
    const msgs = chatArea.querySelectorAll('.message-row:not(#typingIndicator)');
    msgs.forEach(m => m.remove());
    
    // Auto initiate bot greeting
    setTimeout(() => {
        chatArea.insertBefore(createBotMessage("Sesi chat telah direset. Ada yang bisa Janasku bantu?"), typingIndicator);
    }, 300);
});
