class NovelEditor {
    constructor() {
        this.chapters = this.loadChapters() || [];
        this.currentChapterId = null;
        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.renderChapterList();
        this.updateStats();
        this.updateApiEndpoint();
    }

    bindElements() {
        this.elements = {
            chapterList: document.getElementById('chapterList'),
            editor: document.getElementById('editor'),
            chapterTitle: document.getElementById('chapterTitle'),
            wordCount: document.getElementById('wordCount'),
            chapterCount: document.getElementById('chapterCount'),
            currentWordCount: document.getElementById('currentWordCount'),
            addChapterBtn: document.getElementById('addChapter'),
            saveChapterBtn: document.getElementById('saveChapter'),
            exportAllBtn: document.getElementById('exportAll'),
            copyApiUrlBtn: document.getElementById('copyApiUrl'),
            apiEndpoint: document.getElementById('apiEndpoint')
        };
    }

    bindEvents() {
        this.elements.addChapterBtn.addEventListener('click', () => this.addChapter());
        this.elements.saveChapterBtn.addEventListener('click', () => this.saveCurrentChapter());
        this.elements.exportAllBtn.addEventListener('click', () => this.exportAll());
        this.elements.copyApiUrlBtn.addEventListener('click', () => this.copyApiUrl());
        this.elements.editor.addEventListener('input', () => this.updateCurrentWordCount());
        
        // 自动保存
        let saveTimer;
        this.elements.editor.addEventListener('input', () => {
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => this.saveCurrentChapter(true), 2000);
        });
    }

    loadChapters() {
        const saved = localStorage.getItem('novel_chapters');
        return saved ? JSON.parse(saved) : null;
    }

    saveChapters() {
        localStorage.setItem('novel_chapters', JSON.stringify(this.chapters));
    }

    addChapter() {
        const newChapter = {
            id: Date.now(),
            title: `第${this.chapters.length + 1}章`,
            content: '',
            wordCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.chapters.push(newChapter);
        this.saveChapters();
        this.renderChapterList();
        this.selectChapter(newChapter.id);
        this.updateStats();
    }

    selectChapter(chapterId) {
        this.currentChapterId = chapterId;
        const chapter = this.chapters.find(ch => ch.id === chapterId);
        
        if (chapter) {
            this.elements.chapterTitle.value = chapter.title;
            this.elements.editor.value = chapter.content;
            this.updateCurrentWordCount();
            
            // 更新激活状态
            document.querySelectorAll('#chapterList li').forEach(li => {
                li.classList.toggle('active', li.dataset.id == chapterId);
            });
        }
    }

    saveCurrentChapter(silent = false) {
        if (!this.currentChapterId) return;
        
        const chapter = this.chapters.find(ch => ch.id === this.currentChapterId);
        if (chapter) {
            chapter.title = this.elements.chapterTitle.value;
            chapter.content = this.elements.editor.value;
            chapter.wordCount = this.countWords(chapter.content);
            chapter.updatedAt = new Date().toISOString();
            
            this.saveChapters();
            this.renderChapterList();
            this.updateStats();
            
            if (!silent) {
                this.showMessage('章节已保存');
            }
        }
    }

    renderChapterList() {
        this.elements.chapterList.innerHTML = '';
        
        this.chapters.forEach(chapter => {
            const li = document.createElement('li');
            li.dataset.id = chapter.id;
            li.innerHTML = `
                <div>${chapter.title}</div>
                <small>${chapter.wordCount}字</small>
            `;
            li.addEventListener('click', () => this.selectChapter(chapter.id));
            
            if (chapter.id === this.currentChapterId) {
                li.classList.add('active');
            }
            
            this.elements.chapterList.appendChild(li);
        });
    }

    countWords(text) {
        return text.replace(/\s/g, '').length;
    }

    updateCurrentWordCount() {
        const count = this.countWords(this.elements.editor.value);
        this.elements.currentWordCount.textContent = `当前章节字数：${count}`;
    }

    updateStats() {
        const totalWords = this.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
        this.elements.wordCount.textContent = `总字数：${totalWords}`;
        this.elements.chapterCount.textContent = `章节数：${this.chapters.length}`;
    }

    exportAll() {
        let fullText = '';
        this.chapters.forEach(chapter => {
            fullText += `${chapter.title}\n\n${chapter.content}\n\n\n`;
        });
        
        const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `小说_${new Date().toLocaleDateString()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    updateApiEndpoint() {
        const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
        this.elements.apiEndpoint.textContent = baseUrl + 'api.html';
    }

    copyApiUrl() {
        const apiUrl = this.elements.apiEndpoint.textContent;
        navigator.clipboard.writeText(apiUrl).then(() => {
            this.showMessage('API地址已复制');
        });
    }

    showMessage(text) {
        const msg = document.createElement('div');
        msg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 1rem 2rem;
            border-radius: 4px;
            z-index: 1000;
        `;
        msg.textContent = text;
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
    }

    // API方法
    getAllContent() {
        return this.chapters.map(ch => ({
            id: ch.id,
            title: ch.title,
            content: ch.content,
            wordCount: ch.wordCount
        }));
    }

    getChapter(id) {
        return this.chapters.find(ch => ch.id == id);
    }
}

// 初始化编辑器
const editor = new NovelEditor();

// 为API访问暴露全局对象
window.novelData = {
    getAllContent: () => editor.getAllContent(),
    getChapter: (id) => editor.getChapter(id)
};
