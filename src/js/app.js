/**
 * Main Application Assembly
 */

import { SearchAPI } from './services/api.js';
import { AIService } from './services/ai_service.js';
import { UIRenderer } from './components/ui.js';
import { SearchBar } from './components/search_bar.js';
import { SettingsManager } from './components/settings.js';
import { initShortcuts } from './utils/shortcuts.js';
import { storage } from './utils/helpers.js';

class App {
    constructor() {
        this.api = new SearchAPI();
        this.ai = new AIService();
        this.ui = new UIRenderer();
        this.settings = new SettingsManager();
        this.searchBar = new SearchBar((q) => this.performSearch(q));
        
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

        bookmarkBtn.addEventListener('click', () => bookmarkSidebar.classList.remove('translate-x-full'));
        closeBookmark.addEventListener('click', () => bookmarkSidebar.classList.add('translate-x-full'));

        // Keyboard shortcuts
        initShortcuts({
            focusSearch: () => this.searchBar.input.focus(),
            openSettings: () => this.settings.open(),
            clearSearch: () => {
                this.searchBar.input.value = '';
                this.ui.clear();
                document.getElementById('tabs-container').classList.add('hidden');
            }
        });

        // Initialize Lucide icons
        lucide.createIcons();
        
        // Initial Theme
        const savedTheme = storage.get('theme');
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
        document.getElementById('tabs-container').classList.remove('hidden');
        document.getElementById('results-meta').classList.remove('hidden');
        document.getElementById('brand').classList.add('scale-75', '-translate-y-10');
        document.getElementById('header').classList.replace('py-6', 'py-2');
        document.getElementById('header').classList.add('bg-white/80', 'dark:bg-slate-900/80', 'backdrop-blur-xl', 'border-b', 'border-gray-200', 'dark:border-slate-800');

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
                const res = eval(query);
                return this.createInstantCard('Calculator', `${query} = ${res}`, 'calculator');
            } catch(e) {}
        }
        // 2. Unit conversion (Simple mock)
        if (query.includes(' to ')) {
            // Logic for unit conversion could go here
        }
        // 3. Weather mock
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
        this.ui.resultsGrid.innerHTML = '';
        
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
                    lucide.createIcons();
                }, 2000);
                lucide.createIcons();
            });
        });
    }

    toggleBookmark(data) {
        let bookmarks = storage.get('bookmarks') || [];
        const exists = bookmarks.find(b => b.url === data.url);
        if (exists) {
            bookmarks = bookmarks.filter(b => b.url !== data.url);
        } else {
            bookmarks.push({ title: data.title, url: data.url, date: Date.now() });
        }
        storage.set('bookmarks', bookmarks);
        this.updateBookmarkList();
    }

    updateBookmarkList() {
        const list = document.getElementById('bookmarks-list');
        const bookmarks = storage.get('bookmarks') || [];
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
        const bookmarks = storage.get('bookmarks') || [];
        if (bookmarks.length === 0) {
            this.ui.resultsGrid.innerHTML = this.ui.renderEmpty('bookmarks');
            return;
        }
        // Transform bookmarks to look like web results for rendering
        const mockResults = bookmarks.map(b => ({ title: b.title, url: b.url, description: 'Saved from your search history.' }));
        this.ui.renderWebResults(mockResults);
    }
}

// Start the App
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
