/**
 * Main Application Assembly
 */

window.App = window.App || {};

window.App.Core = class App {
    constructor() {
        // Initialize Services
        this.api = new window.App.services.SearchAPI();
        this.ai = new window.App.services.AIService();
        
        // Initialize Components
        this.ui = new window.App.components.UIRenderer();
        this.settings = new window.App.components.SettingsManager();
        this.searchBar = new window.App.components.SearchBar((q) => this.performSearch(q));
        
        this.currentResults = null;
        this.activeTab = 'all';

        this.init();
    }

    init() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Bookmark fabric/sidebar logic
        const bookmarkBtn = document.getElementById('bookmarks-btn-fab');
        const bookmarkSidebar = document.getElementById('bookmarks-sidebar');
        const closeBookmark = document.getElementById('close-bookmarks');

        if (bookmarkBtn) bookmarkBtn.addEventListener('click', () => bookmarkSidebar.classList.remove('translate-x-full'));
        if (closeBookmark) closeBookmark.addEventListener('click', () => bookmarkSidebar.classList.add('translate-x-full'));

        // Keyboard shortcuts
        window.App.utils.initShortcuts({
            focusSearch: () => this.searchBar.input.focus(),
            openSettings: () => this.settings.open(),
            clearSearch: () => {
                this.searchBar.input.value = '';
                this.ui.clear();
                const tabs = document.getElementById('tabs-container');
                if (tabs) tabs.classList.add('hidden');
            }
        });

        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        // Initial Theme
        const savedTheme = window.App.utils.storage.get('theme');
        if (savedTheme === 'light') document.documentElement.classList.remove('dark');

        // Check for deep links in URL
        const urlParams = new URL(window.location.search);
        const query = urlParams.get('q');
        if (query) {
            this.searchBar.input.value = query;
            this.performSearch(query);
        }
    }

    async performSearch(query) {
        if (!query) return;

        // Reset UI
        this.ui.renderSkeleton();
        
        const tabs = document.getElementById('tabs-container');
        const meta = document.getElementById('results-meta');
        const brand = document.getElementById('brand');
        const header = document.getElementById('header');

        if (tabs) tabs.classList.remove('hidden');
        if (meta) meta.classList.remove('hidden');
        if (brand) brand.classList.add('scale-75', '-translate-y-10');
        if (header) {
            header.classList.replace('py-6', 'py-2');
            header.classList.add('bg-white/80', 'dark:bg-slate-900/80', 'backdrop-blur-xl', 'border-b', 'border-gray-200', 'dark:border-slate-800');
        }

        const startTime = Date.now();

        // 1. Instant Answer (local)
        const instant = this.checkInstantAnswers(query);
        
        // 2. Fetch Aggregated Results
        const results = await this.api.fetchAll(query);
        this.currentResults = results;
        const endTime = Date.now();

        // 3. Render
        this.ui.clear();
        if (instant) {
            this.ui.resultsGrid.insertAdjacentHTML('afterbegin', instant);
        }
        
        this.renderActiveTab();
        this.ui.updateStats(results.web.length + results.code.length + results.news.length, endTime - startTime);

        // 4. AI Summarization (Parallel)
        if (results.web.length > 0) {
            this.ai.summarize(query, results.web).then(summary => {
                this.ui.renderAISummary(summary);
            });
        }

        // Attach Bookmark listeners to new cards
        this.attachCardListeners();
    }

    checkInstantAnswers(query) {
        // 1. Basic Calculator
        if (/^[\d+\-*/\s().]+$/.test(query) && /[\d]/.test(query)) {
            try {
                // Use a safe eval alternative if possible, but for local simplicity:
                const res = eval(query);
                return this.createInstantCard('Calculator', `${query} = ${res}`, 'calculator');
            } catch(e) {}
        }
        // 2. Weather mock
        if (query.toLowerCase().startsWith('weather in ')) {
            const city = query.split('weather in ')[1];
            return this.createInstantCard('Weather', `Current weather in ${city}: 22°C, Mostly Sunny.`, 'cloud-sun');
        }
        return null;
    }

    createInstantCard(title, body, icon) {
        return `
            <div class="p-6 bg-gradient-to-r from-primary to-accent rounded-2xl text-white shadow-lg mb-6 flex gap-4 items-center animate-fade-in-up">
                <div class="p-4 bg-white/20 rounded-xl">
                    <i data-lucide="${icon}" class="w-8 h-8"></i>
                </div>
                <div>
                    <span class="text-xs font-bold uppercase tracking-widest opacity-80">${title}</span>
                    <h3 class="text-2xl font-bold font-['Outfit']">${body}</h3>
                </div>
            </div>
        `;
    }

    switchTab(tab) {
        this.activeTab = tab;
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active-tab', btn.dataset.tab === tab);
        });
        this.renderActiveTab();
    }

    renderActiveTab() {
        if (!this.currentResults) return;
        if (this.ui.resultsGrid) this.ui.resultsGrid.innerHTML = '';
        
        const r = this.currentResults;
        switch (this.activeTab) {
            case 'all':
                this.ui.renderWikiResult(r.wiki);
                this.ui.renderWebResults(r.web.slice(0, 5));
                this.ui.renderCodeResults(r.code);
                this.ui.renderNewsResults(r.news);
                this.ui.renderImageResults(r.images);
                break;
            case 'web':
                this.ui.renderWebResults(r.web);
                break;
            case 'code':
                this.ui.renderCodeResults(r.code);
                break;
            case 'news':
                this.ui.renderNewsResults(r.news);
                break;
            case 'images':
                this.ui.renderImageResults(r.images);
                break;
            case 'bookmarks':
                this.renderBookmarks();
                break;
        }
        this.attachCardListeners();
    }

    attachCardListeners() {
        document.querySelectorAll('.bookmark-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleBookmark(btn.dataset);
                btn.classList.toggle('text-yellow-400');
            });
        });

        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                navigator.clipboard.writeText(btn.dataset.url);
                btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i>';
                setTimeout(() => {
                    btn.innerHTML = '<i data-lucide="share-2" class="w-4 h-4"></i>';
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }, 2000);
                if (typeof lucide !== 'undefined') lucide.createIcons();
            });
        });
    }

    toggleBookmark(data) {
        let bookmarks = window.App.utils.storage.get('bookmarks') || [];
        const exists = bookmarks.find(b => b.url === data.url);
        if (exists) {
            bookmarks = bookmarks.filter(b => b.url !== data.url);
        } else {
            bookmarks.push({ title: data.title, url: data.url, date: Date.now() });
        }
        window.App.utils.storage.set('bookmarks', bookmarks);
        this.updateBookmarkList();
    }

    updateBookmarkList() {
        const list = document.getElementById('bookmarks-list');
        if (!list) return;
        const bookmarks = window.App.utils.storage.get('bookmarks') || [];
        if (bookmarks.length === 0) {
            list.innerHTML = '<p class="text-center text-gray-500 py-10">No bookmarks yet.</p>';
            return;
        }
        list.innerHTML = bookmarks.map(b => `
            <div class="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                <a href="${b.url}" target="_blank" class="font-semibold text-sm hover:text-primary transition-colors block mb-1 truncate">${b.title}</a>
                <span class="text-[10px] text-gray-400 uppercase">${new URL(b.url).hostname}</span>
            </div>
        `).join('');
    }

    renderBookmarks() {
        const bookmarks = window.App.utils.storage.get('bookmarks') || [];
        if (bookmarks.length === 0) {
            this.ui.resultsGrid.innerHTML = this.ui.renderEmpty('bookmarks');
            return;
        }
        const mockResults = bookmarks.map(b => ({ title: b.title, url: b.url, description: 'Saved from your search history.' }));
        this.ui.renderWebResults(mockResults);
    }
};

// Start the App
window.addEventListener('DOMContentLoaded', () => {
    window.appInstance = new window.App.Core();
    if (typeof lucide !== 'undefined') lucide.createIcons();
});

