const API = {
    async getCategories() { return await (await fetch('/api/categories')).json(); },
    async createCategory(name) {
        return await (await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })).json();
    },
    async updateCategory(id, name) {
        return await (await fetch(`/api/categories/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })).json();
    },
    async deleteCategory(id) {
        return await (await fetch(`/api/categories/${id}`, { method: 'DELETE' })).json();
    },
    async getPhrases(catId) {
        const url = catId ? `/api/phrases?category_id=${catId}` : '/api/phrases';
        return await (await fetch(url)).json();
    },
    async createPhrase(data) {
        return await (await fetch('/api/phrases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json();
    },
    async updatePhrase(id, data) {
        return await (await fetch(`/api/phrases/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json();
    },
    async deletePhrase(id) {
        return await (await fetch(`/api/phrases/${id}`, { method: 'DELETE' })).json();
    },
    async uploadAudio(file) {
        const fd = new FormData(); fd.append('file', file);
        return await (await fetch('/api/upload-audio', { method: 'POST', body: fd })).json();
    },
    async getAudioFiles() { return await (await fetch('/api/audio-files')).json(); },
    async deleteAudio(name) { return await (await fetch(`/api/audio/${name}`, { method: 'DELETE' })).json(); },
};

let categories = [];
let phrases = [];
let selectedCatId = null;
let editingId = null;

/* === Navigation === */
document.querySelectorAll('.sidebar-cat').forEach(el => el.addEventListener('click', () => {
    document.querySelectorAll('.sidebar-cat').forEach(e => e.classList.remove('active'));
    el.classList.add('active');
}));

/* === Init === */
async function init() {
    await loadCategories();
    loadPhrases();
}

/* === Categories === */
async function loadCategories() {
    categories = await API.getCategories();
    const list = document.getElementById('categoryList');
    list.innerHTML = `
        <div class="sidebar-cat ${!selectedCatId ? 'active' : ''}" data-id="">
            <span>全部内容</span>
            <span class="cat-count">${categories.reduce((s, c) => s + c.phrase_count, 0)}</span>
        </div>
    `;
    categories.forEach(cat => {
        const div = document.createElement('div');
        div.className = `sidebar-cat ${selectedCatId === cat.id ? 'active' : ''}`;
        div.dataset.id = cat.id;
        div.innerHTML = `
            <span>${esc(cat.name)}</span>
            <div style="display:flex;align-items:center;gap:6px">
                <span class="cat-count">${cat.phrase_count}</span>
                <span class="cat-actions">
                    <button title="重命名" onclick="event.stopPropagation();renameCat(${cat.id})">&#x270E;</button>
                    <button title="删除" onclick="event.stopPropagation();delCat(${cat.id})">&#x2716;</button>
                </span>
            </div>`;
        div.addEventListener('click', () => selectCat(cat.id));
        list.appendChild(div);
    });
    document.querySelector('.sidebar-cat[data-id=""]')?.addEventListener('click', () => selectCat(null));
    updateAudioCount();
}

function selectCat(id) {
    selectedCatId = id;
    loadCategories();
    loadPhrases();
    document.getElementById('pageTitle').textContent = id ? categories.find(c => c.id === id)?.name || '内容管理' : '所有内容';
}

function showAddCategory() {
    const list = document.getElementById('categoryList');
    const div = document.createElement('div');
    div.className = 'add-cat-form';
    div.innerHTML = '<input type="text" id="newCatName" placeholder="分类名称"><button onclick="addCat()">确定</button>';
    list.appendChild(div);
    document.getElementById('newCatName').focus();
}

async function addCat() {
    const name = document.getElementById('newCatName').value.trim();
    if (!name) return;
    await API.createCategory(name);
    await loadCategories();
}

async function renameCat(id, oldName) {
    const name = prompt('重命名分类：', oldName);
    if (!name || name === oldName) return;
    await API.updateCategory(id, name);
    await loadCategories();
}

async function delCat(id) {
    const cat = categories.find(c => c.id === id);
    if (!confirm(`确定删除分类"${cat.name}"？其下所有内容也将被删除。`)) return;
    await API.deleteCategory(id);
    if (selectedCatId === id) selectCat(null);
    else loadCategories();
}

/* === Content List === */
async function loadPhrases() {
    phrases = await API.getPhrases(selectedCatId);
    renderList();
}

function renderList() {
    const list = document.getElementById('contentList');
    const typeFilter = document.getElementById('filterType').value;
    const search = document.getElementById('searchInput').value.toLowerCase();

    let filtered = phrases;
    if (typeFilter) filtered = filtered.filter(p => p.type === typeFilter);
    if (search) filtered = filtered.filter(p =>
        (p.en || '').toLowerCase().includes(search) ||
        (p.zh || '').toLowerCase().includes(search)
    );

    document.getElementById('itemCount').textContent = filtered.length + ' 项';

    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state">暂无内容</div>';
        return;
    }

    list.innerHTML = filtered.map(p => {
        const typeMap = { word: '单词', phrase: '短句', passage: '短文' };
        const typeLabel = typeMap[p.type] || p.type;
        const hasAudio = p.audio_file;
        const safeEn = esc(p.en || '').replace(/'/g, "\\'");
        const safeAudio = (p.audio_file || '').replace(/'/g, "\\'");
        return `
            <div class="content-item" data-id="${p.id}">
                <span class="content-type ${p.type}">${typeLabel}</span>
                <div class="content-body">
                    <div class="content-en">${esc(p.en || '')}</div>
                    <div class="content-zh">${esc((p.zh || '').slice(0, 100))}</div>
                </div>
                <span class="content-audio ${hasAudio ? 'has-audio' : ''}" onclick="playAudioFile(${p.id},'${safeEn}','${safeAudio}')" title="${hasAudio ? '有音频' : '无音频'}">&#x266B;</span>
                <div class="content-actions">
                    <button class="edit-btn" onclick="showEditForm(${p.id})">编辑</button>
                    <button class="del-btn" onclick="delItem(${p.id})">删除</button>
                </div>
            </div>`;
    }).join('');
}

document.getElementById('searchInput').addEventListener('input', renderList);
document.getElementById('filterType').addEventListener('change', renderList);

/* === CRUD === */
function showAddForm() {
    editingId = null;
    document.getElementById('modalTitle').textContent = '添加内容';
    document.getElementById('modalBody').innerHTML = formHtml(null);
    document.getElementById('modal').classList.add('active');
    setupFormListeners();
}

function showEditForm(id) {
    const p = phrases.find(x => x.id === id);
    if (!p) return;
    editingId = id;
    document.getElementById('modalTitle').textContent = '编辑内容';
    document.getElementById('modalBody').innerHTML = formHtml(p);
    document.getElementById('modal').classList.add('active');
    setupFormListeners();
}

function formHtml(p) {
    const t = p ? p.type : 'phrase';
    const en = p ? p.en : '';
    const zh = p ? p.zh : '';
    const catId = p ? p.category_id : (selectedCatId || '');
    const audioStatus = p?.audio_file ? `当前音频: ${p.audio_file}` : '';
    const catOpts = categories.map(c =>
        `<option value="${c.id}" ${c.id === catId ? 'selected' : ''}>${esc(c.name)}</option>`
    ).join('');
    return `
        <div class="form-row">
            <label>类型</label>
            <select id="f_type">
                <option value="word" ${t === 'word' ? 'selected' : ''}>单词</option>
                <option value="phrase" ${t === 'phrase' ? 'selected' : ''}>短句</option>
                <option value="passage" ${t === 'passage' ? 'selected' : ''}>短文</option>
            </select>
        </div>
        <div class="form-row">
            <label>分类</label>
            <select id="f_category">${catOpts}</select>
        </div>
        <div class="form-row" id="f_en_row">
            <label id="f_en_label">${t === 'passage' ? '标题' : '英文'}</label>
            <input type="text" id="f_en" value="${esc(en)}" placeholder="${t === 'passage' ? '短文标题' : '英文内容'}">
        </div>
        <div class="form-row" id="f_zh_row">
            <label id="f_zh_label">${t === 'passage' ? '正文' : '中文'}</label>
            <textarea id="f_zh" rows="${t === 'passage' ? 6 : 2}" placeholder="${t === 'passage' ? '短文正文...' : '中文翻译'}">${esc(zh)}</textarea>
        </div>
        <div class="form-row">
            <label>音频文件</label>
            <div class="audio-file-row">
                <input type="file" id="f_audio" accept=".mp3,.wav,.ogg,.m4a">
                <button type="button" class="btn-record" id="adminRecordBtn" onclick="toggleAdminRecording()" ${!p ? 'disabled' : ''}>🎤 录制</button>
            </div>
            <span class="form-hint" id="adminAudioStatus">${audioStatus || '选择 MP3 文件上传或点击录制（可选）'}</span>
            <div class="admin-rec-status" id="adminRecStatus"></div>
        </div>
    `;
}

function setupFormListeners() {
    document.getElementById('f_type').addEventListener('change', () => {
        const t = document.getElementById('f_type').value;
        document.getElementById('f_en_label').textContent = t === 'passage' ? '标题' : '英文';
        document.getElementById('f_zh_label').textContent = t === 'passage' ? '正文' : '中文';
        document.getElementById('f_en').placeholder = t === 'passage' ? '短文标题' : '英文内容';
        document.getElementById('f_zh').placeholder = t === 'passage' ? '短文正文...' : '中文翻译';
        document.getElementById('f_zh').rows = t === 'passage' ? 6 : 2;
    });
}

async function submitForm() {
    const type = document.getElementById('f_type').value;
    const categoryId = parseInt(document.getElementById('f_category').value);
    const en = document.getElementById('f_en').value.trim();
    const zh = document.getElementById('f_zh').value.trim();
    const fileInput = document.getElementById('f_audio');

    if (!en) { alert('请输入英文'); return; }
    if (!categoryId) { alert('请选择分类'); return; }

    let audioFile = null;
    if (fileInput?.files?.length > 0) {
        const r = await API.uploadAudio(fileInput.files[0]);
        audioFile = r.filename;
    }

    const data = { category_id: categoryId, en, zh: zh || null, type, audio_file: audioFile };

    try {
        if (editingId) {
            const upd = { en, zh: zh || null, type };
            if (audioFile) upd.audio_file = audioFile;
            await API.updatePhrase(editingId, upd);
        } else {
            await API.createPhrase(data);
        }
        closeModal();
        await loadPhrases();
        await loadCategories();
    } catch (e) {
        alert('保存失败: ' + e.message);
    }
}

async function delItem(id) {
    if (!confirm('确定删除？')) return;
    await API.deletePhrase(id);
    await loadPhrases();
    await loadCategories();
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
    editingId = null;
}
document.getElementById('modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

/* === Audio Manager === */
async function updateAudioCount() {
    const files = await API.getAudioFiles();
    const btn = document.querySelector('.sidebar-section button[onclick*="showAudioManager"]');
    if (btn) btn.textContent = `管理音频 (${files.length})`;
}

async function showAudioManager() {
    document.getElementById('contentView').style.display = 'none';
    document.getElementById('audioManager').style.display = 'block';
    const grid = document.getElementById('audioGrid');
    const files = await API.getAudioFiles();
    if (files.length === 0) {
        grid.innerHTML = '<div class="empty-state">暂无音频文件</div>';
        return;
    }
    grid.innerHTML = files.map(f => `
        <div class="audio-card">
            <audio controls src="${f.path}"></audio>
            <div class="audio-name">${esc(f.name)}</div>
            <div class="audio-size">${(f.size / 1024).toFixed(1)} KB</div>
            <button class="btn-danger" onclick="delAudio('${f.name}')">删除</button>
        </div>
    `).join('');
}

function hideAudioManager() {
    document.getElementById('audioManager').style.display = 'none';
    document.getElementById('contentView').style.display = 'block';
}

async function uploadBulkAudio() {
    const input = document.getElementById('bulkAudioInput');
    if (!input.files.length) { alert('请选择文件'); return; }
    for (const file of input.files) {
        try { await API.uploadAudio(file); } catch (e) { console.warn('上传失败:', file.name, e); }
    }
    input.value = '';
    await showAudioManager();
    await updateAudioCount();
}

async function delAudio(name) {
    if (!confirm(`确定删除 ${name}？`)) return;
    await API.deleteAudio(name);
    await showAudioManager();
    await updateAudioCount();
}

/* === Utils === */
function esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function playAudioFile(id, text, audioFile) {
    const audioPath = audioFile ? '/audio/' + audioFile : '/audio/' + id + '.mp3';
    const audio = new Audio(audioPath);
    audio.onerror = () => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.rate = 0.8;
        speechSynthesis.speak(u);
    };
    audio.play();
}

/* === Admin Recording === */
let adminMediaRecorder = null;
let adminRecordingChunks = [];
let adminIsRecording = false;

async function toggleAdminRecording() {
    if (!editingId) {
        alert('请先保存内容，然后编辑时再录制');
        return;
    }
    if (adminIsRecording) {
        stopAdminRecording();
        return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
        adminMediaRecorder = new MediaRecorder(stream, { mimeType: mime });
        adminRecordingChunks = [];

        adminMediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) adminRecordingChunks.push(e.data);
        };

        adminMediaRecorder.onstop = async () => {
            stream.getTracks().forEach(t => t.stop());
            adminIsRecording = false;
            document.getElementById('adminRecordBtn').textContent = '🎤 录制';
            document.getElementById('adminRecordBtn').className = 'btn-record';

            const blob = new Blob(adminRecordingChunks, { type: adminMediaRecorder.mimeType });
            const fd = new FormData();
            fd.append('file', blob, `rec_${editingId}.webm`);

            const status = document.getElementById('adminRecStatus');
            status.textContent = '转换中...';
            status.className = 'admin-rec-status converting';

            try {
                const res = await fetch(`/api/record-audio/${editingId}`, { method: 'POST', body: fd });
                const data = await res.json();
                if (res.ok) {
                    document.getElementById('adminAudioStatus').textContent = '已录制: ' + data.filename;
                    status.textContent = '录制成功 ✓';
                    status.className = 'admin-rec-status success';
                    document.getElementById('f_audio').value = '';
                } else {
                    status.textContent = '录制失败: ' + (data.detail || '');
                    status.className = 'admin-rec-status error';
                }
            } catch (e) {
                status.textContent = '网络错误';
                status.className = 'admin-rec-status error';
            }
        };

        adminMediaRecorder.start();
        adminIsRecording = true;
        document.getElementById('adminRecordBtn').textContent = '⏹ 停止';
        document.getElementById('adminRecordBtn').className = 'btn-record recording';
        document.getElementById('adminRecStatus').textContent = '录制中...';
        document.getElementById('adminRecStatus').className = 'admin-rec-status recording';
    } catch (e) {
        document.getElementById('adminRecStatus').textContent = '无法访问麦克风: ' + e.message;
        document.getElementById('adminRecStatus').className = 'admin-rec-status error';
    }
}

function stopAdminRecording() {
    if (adminMediaRecorder && adminMediaRecorder.state === 'recording') {
        adminMediaRecorder.stop();
    }
}

document.addEventListener('DOMContentLoaded', init);
