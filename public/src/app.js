const API = {
    async getCategories() {
        const res = await fetch('/api/categories');
        return await res.json();
    },
    async getPhrases(categoryId) {
        const url = categoryId ? `/api/phrases?category_id=${categoryId}` : '/api/phrases';
        const res = await fetch(url);
        return await res.json();
    },
    async getStats() {
        const res = await fetch('/api/stats');
        return await res.json();
    },
    async updateProgress(phraseId, isCorrect) {
        const res = await fetch(`/api/progress/${phraseId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_correct: isCorrect })
        });
        return await res.json();
    },
    async getReviewPhrases() {
        const res = await fetch('/api/review');
        return await res.json();
    },
    async reset() {
        const res = await fetch('/api/reset', { method: 'DELETE' });
        return await res.json();
    },
};

let phrases = [];
let categories = [];
let progress = {};
let currentIndex = 0;
let currentMode = 'learn';
let visiblePhrases = [];
let filteredStatus = ['new', 'learning', 'mastered'];
let selectedCategory = null;
let testCorrect = 0;
let testWrong = 0;
const card = document.getElementById('flashcard');
const cardChinese = document.getElementById('cardChinese');
const cardEnglish = document.getElementById('cardEnglish');
const cardStatus = document.getElementById('cardStatus');
const cardStatusBack = document.getElementById('cardStatusBack');
const cardTypeBadge = document.getElementById('cardTypeBadge');
const currentIndexEl = document.getElementById('currentIndex');
const visibleCountEl = document.getElementById('visibleCount');
const learnSection = document.getElementById('learnSection');
const testSection = document.getElementById('testSection');
const testInput = document.getElementById('testInput');
const testWord = document.getElementById('testWord');
const testResult = document.getElementById('testResult');

async function init() {
    await loadCategories();
    await loadData();
    updateVisiblePhrases();
    updateStats();
    updateCard();
    setupEventListeners();
}

async function loadCategories() {
    categories = await API.getCategories();
    const categorySelect = document.getElementById('categorySelect');
    categorySelect.innerHTML = '<button class="cat-btn active" data-id="">全部</button>';
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'cat-btn';
        btn.dataset.id = cat.id;
        btn.textContent = cat.name;
        categorySelect.appendChild(btn);
    });
}

async function loadData() {
    phrases = await API.getPhrases(selectedCategory);
    progress = {};
    phrases.forEach(p => {
        progress[p.id] = {
            status: p.status || 'new',
            correct_count: p.correct_count || 0,
            wrong_count: p.wrong_count || 0
        };
    });
}

function updateVisiblePhrases() {
    visiblePhrases = phrases.filter(phrase => {
        const p = progress[phrase.id] || { status: 'new' };
        return filteredStatus.includes(p.status);
    });
    if (visiblePhrases.length === 0) {
        visiblePhrases = phrases;
    }
    if (currentIndex >= visiblePhrases.length) {
        currentIndex = 0;
    }
}

async function updateStats() {
    const stats = await API.getStats();
    document.getElementById('totalCount').textContent = stats.total_phrases || 0;
    document.getElementById('masteredCount').textContent = stats.mastered || 0;
    document.getElementById('learningCount').textContent = stats.learning || 0;
    document.getElementById('accuracy').textContent = (stats.accuracy || 0) + '%';

    testCorrect = stats.correct_answers;
    testWrong = stats.wrong_answers;
    document.getElementById('correctFeedback').textContent = '\u2713 正确: ' + testCorrect;
    document.getElementById('wrongFeedback').textContent = '\u2717 错误: ' + testWrong;
}

function updateCard() {
    if (visiblePhrases.length === 0) {
        cardEnglish.textContent = '暂无短句';
        cardChinese.textContent = '';
        return;
    }

    const phrase = visiblePhrases[currentIndex];
    const p = progress[phrase.id] || { status: 'new' };

    const isPassage = phrase.type === 'passage';
    cardEnglish.textContent = isPassage ? (phrase.en || '短文') : phrase.en;
    cardChinese.textContent = phrase.zh || '';

    const statusText = { new: '未学习', learning: '学习中', mastered: '已掌握' };
    cardStatus.className = 'card-status ' + (p.status || 'new');
    cardStatus.textContent = statusText[p.status || 'new'];
    cardStatusBack.className = 'card-status ' + (p.status || 'new');
    cardStatusBack.textContent = statusText[p.status || 'new'];

    cardTypeBadge.textContent = isPassage ? '短文' : '';
    cardTypeBadge.style.display = isPassage ? 'inline' : 'none';

    const catBtn = document.querySelector('.cat-btn.active');
    const catName = catBtn ? (catBtn.dataset.id ? catBtn.textContent : '') : '';
    document.getElementById('categoryTag').textContent = catName;
    document.getElementById('testCategoryTag').textContent = catName;

    currentIndexEl.textContent = currentIndex + 1;
    visibleCountEl.textContent = visiblePhrases.length;
}

card.addEventListener('click', () => {
    card.classList.toggle('flipped');
});

function prevCard() {
    if (currentIndex > 0) {
        currentIndex--;
        card.classList.remove('flipped');
        updateCard();
    }
}

function nextCard() {
    if (currentIndex < visiblePhrases.length - 1) {
        currentIndex++;
        card.classList.remove('flipped');
        updateCard();
    }
}

function randomCard() {
    if (visiblePhrases.length > 1) {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * visiblePhrases.length);
        } while (newIndex === currentIndex);
        currentIndex = newIndex;
        card.classList.remove('flipped');
        updateCard();
    }
}

function playAudio(phraseId, text, audioFile) {
    const audioPath = audioFile ? '/audio/' + audioFile : '/audio/' + phraseId + '.mp3';
    const audio = new Audio(audioPath);
    audio.onerror = function () {
        if (!('speechSynthesis' in window)) return;
        if (speechSynthesis.getVoices().length === 0) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
    };
    audio.play();
}

function playSound(event) {
    event.stopPropagation();
    if (visiblePhrases.length === 0) return;
    const phrase = visiblePhrases[currentIndex];
    playAudio(phrase.id, phrase.en, phrase.audio_file);
}

function setupEventListeners() {

    document.getElementById('toggleSettings').addEventListener('click', () => {
        document.getElementById('settingsPanel').classList.toggle('open');
    });

    document.getElementById('closeSettings').addEventListener('click', () => {
        document.getElementById('settingsPanel').classList.remove('open');
    });

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;

            learnSection.classList.remove('hidden');
            testSection.classList.remove('active');

            if (currentMode === 'test') {
                learnSection.classList.add('hidden');
                testSection.classList.add('active');
                loadTestPhrase();
            } else if (currentMode === 'review') {
                learnSection.classList.add('hidden');
                testSection.classList.add('active');
                loadReviewPhrases();
            }

            document.getElementById('settingsPanel').classList.remove('open');
        });
    });

    document.getElementById('categorySelect').addEventListener('click', async (e) => {
        if (e.target.classList.contains('cat-btn')) {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const catId = e.target.dataset.id;
            selectedCategory = catId ? parseInt(catId) : null;

            currentIndex = 0;
            await loadData();
            updateVisiblePhrases();
            updateCard();
            updateStats();
        }
    });

    document.querySelectorAll('.level-filter input').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checkboxes = document.querySelectorAll('.level-filter input');
            filteredStatus = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);

            if (filteredStatus.length === 0) {
                filteredStatus = ['new', 'learning', 'mastered'];
            }

            currentIndex = 0;
            updateVisiblePhrases();
            updateCard();
            updateStats();
        });
    });

    document.getElementById('resetBtn').addEventListener('click', async () => {
        if (confirm('确定要重置所有学习进度吗？')) {
            await API.reset();
            await loadData();
            updateVisiblePhrases();
            updateStats();
            updateCard();
            alert('进度已重置');
        }
    });

}

async function loadReviewPhrases() {
    visiblePhrases = await API.getReviewPhrases();
    if (visiblePhrases.length === 0) {
        testWord.textContent = '没有需要复习的短句';
        testInput.style.display = 'none';
        return;
    }
    testInput.style.display = 'block';
    currentIndex = 0;
    displayTestPhrase();
}

function loadTestPhrase() {
    updateVisiblePhrases();
    if (visiblePhrases.length === 0) {
        testWord.textContent = '没有可测试的短句';
        testInput.style.display = 'none';
        return;
    }
    testInput.style.display = 'block';
    displayTestPhrase();
}

const wordDisplay = document.getElementById('wordDisplay');

function displayTestPhrase() {
    clearAutoNext();
    emptySpaceCount = 0;
    if (visiblePhrases.length === 0) return;
    const phrase = visiblePhrases[currentIndex];
    testWord.textContent = phrase.zh || '';
    testInput.value = '';
    testResult.className = 'test-result';
    document.getElementById('correctAnswer').className = 'correct-answer';
    completedWords = [];
    wordDisplay.innerHTML = '';
    testInput.focus();
}

let completedWords = [];
let autoNextTimer = null;

function clearAutoNext() {
    if (autoNextTimer) { clearTimeout(autoNextTimer); autoNextTimer = null; }
}

function stripPunct(w) {
    return w.replace(/[.,!?;:'"()\[\]{}<>–—·…«»„“”‘’]/g, '');
}

function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderWordDisplay() {
    let html = '';
    for (let i = 0; i < completedWords.length; i++) {
        const w = completedWords[i];
        html += `<span class="word-token ${w.match ? 'correct' : 'wrong'}">${escHtml(w.word)}</span> `;
    }
    wordDisplay.innerHTML = html;
}

async function checkAnswer() {
    clearAutoNext();
    if (visiblePhrases.length === 0) return;
    const phrase = visiblePhrases[currentIndex];
    const correctWords = phrase.en.toLowerCase().split(/\s+/).map(stripPunct);

    if (completedWords.length === 0) {
        testResult.className = 'test-result';
        document.getElementById('correctAnswer').className = 'correct-answer';
        return;
    }

    let allCorrect = completedWords.length === correctWords.length;
    for (let i = 0; i < completedWords.length; i++) {
        if (!completedWords[i].match) allCorrect = false;
    }

    testResult.className = 'test-result';

    await API.updateProgress(phrase.id, allCorrect);
    await loadData();
    updateStats();

    if (allCorrect) {
        testResult.className = 'test-result correct';
        testResult.textContent = '\u2713';
        document.getElementById('correctAnswer').className = 'correct-answer';
        autoNextTimer = setTimeout(() => {
            autoNextTimer = null;
            nextTest();
        }, 3000);
    } else {
        testResult.className = 'test-result wrong';
        testResult.textContent = '\u2717';
        document.getElementById('correctAnswer').className = 'correct-answer show';
        document.getElementById('correctAnswer').textContent = '正确答案: ' + phrase.en;
    }
}

function playHint() {
    if (visiblePhrases.length === 0) return;
    const phrase = visiblePhrases[currentIndex];
    playAudio(phrase.id, phrase.en, phrase.audio_file);
}

function nextTest() {
    if (visiblePhrases.length === 0) return;
    if (currentIndex < visiblePhrases.length - 1) {
        currentIndex++;
    } else {
        currentIndex = 0;
    }
    displayTestPhrase();
}

function prevTest() {
    if (visiblePhrases.length === 0) return;
    if (currentIndex > 0) {
        currentIndex--;
    } else {
        currentIndex = visiblePhrases.length - 1;
    }
    displayTestPhrase();
}

let emptySpaceCount = 0;

testInput.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
        e.preventDefault();
        const raw = testInput.value.trim();
        if (!raw) {
            emptySpaceCount++;
            if (emptySpaceCount >= 3) {
                emptySpaceCount = 0;
                checkAnswer();
            }
            return;
        }
        emptySpaceCount = 0;
        const phrase = visiblePhrases[currentIndex];
        if (!phrase) return;
        const correctWords = phrase.en.toLowerCase().split(/\s+/).map(stripPunct);
        const idx = completedWords.length;
        const cleaned = stripPunct(raw.toLowerCase());
        const match = idx < correctWords.length && cleaned === correctWords[idx];
        completedWords.push({ word: raw, match });
        renderWordDisplay();
        testInput.value = '';
    }

    if (e.key === 'Backspace' && testInput.value === '' && completedWords.length > 0) {
        e.preventDefault();
        emptySpaceCount = 0;
        const last = completedWords.pop();
        renderWordDisplay();
        testInput.value = last.word;
        testInput.setSelectionRange(last.word.length, last.word.length);
    }

    if (e.key === 'Enter') {
        e.preventDefault();
        emptySpaceCount = 0;
        checkAnswer();
    }
});

document.addEventListener('DOMContentLoaded', init);
