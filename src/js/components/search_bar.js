/**
 * Search Bar Logic (Autocomplete, History, Voice)
 */

window.App = window.App || {};
window.App.components = window.App.components || {};

window.App.components.SearchBar = class SearchBar {
    constructor(onSearch) {
        this.input = document.getElementById('search-input');
        this.btn = document.getElementById('search-btn');
        this.voiceBtn = document.getElementById('voice-btn');
        this.autocompleteDiv = document.getElementById('autocomplete-results');
        this.recentDiv = document.getElementById('recent-searches');
        this.onSearch = onSearch;

        this.init();
    }

    init() {
        if (this.btn) this.btn.addEventListener('click', () => this.triggerSearch());
        if (this.input) {
            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.triggerSearch();
            });

            // Autocomplete with debounce
            this.input.addEventListener('input', window.App.utils.debounce(() => this.fetchSuggestions(), 300));

            // Focus UI effects
            this.input.addEventListener('focus', () => {
                document.body.classList.add('search-focused');
                this.showHistory();
            });

            this.input.addEventListener('blur', () => {
                setTimeout(() => {
                    document.body.classList.remove('search-focused');
                    if (this.autocompleteDiv) this.autocompleteDiv.classList.add('hidden');
                }, 200);
            });
        }

        // Voice
        if (this.voiceBtn) {
            this.voiceBtn.addEventListener('click', () => this.startVoice());
        }

        // Render history on start
        this.showHistory();
    }

    async fetchSuggestions() {
        const query = this.input.value.trim();
        if (query.length < 2) {
            this.autocompleteDiv.classList.add('hidden');
            return;
        }

        try {
            const response = await fetch(`https://search.brave.com/api/suggest?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            const suggestions = data[1] || [];

            if (suggestions.length > 0) {
                this.renderSuggestions(suggestions);
            } else {
                this.autocompleteDiv.classList.add('hidden');
            }
        } catch (e) {
            this.autocompleteDiv.classList.add('hidden');
        }
    }

    renderSuggestions(suggestions) {
        this.autocompleteDiv.innerHTML = suggestions.slice(0, 6).map(s => `
            <div class="suggestion-item px-6 py-3 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-gray-100 dark:border-slate-800 last:border-none flex items-center gap-3" data-val="${s}">
                <i data-lucide="search" class="w-4 h-4 text-gray-400"></i>
                <span class="text-gray-700 dark:text-gray-200">${s}</span>
            </div>
        `).join('');
        
        this.autocompleteDiv.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();

        this.autocompleteDiv.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                this.input.value = item.dataset.val;
                this.triggerSearch();
            });
        });
    }

    triggerSearch() {
        if (!this.input) return;
        const query = this.input.value.trim();
        if (!query) return;

        if (this.autocompleteDiv) this.autocompleteDiv.classList.add('hidden');
        this.saveToHistory(query);
        this.onSearch(query);
    }

    saveToHistory(query) {
        let history = window.App.utils.storage.get('search_history') || [];
        history = [query, ...history.filter(h => h !== query)].slice(0, 10);
        window.App.utils.storage.set('search_history', history);
        this.showHistory();
    }

    showHistory() {
        if (!this.recentDiv) return;
        const history = window.App.utils.storage.get('search_history') || [];
        if (history.length === 0) {
            this.recentDiv.classList.add('opacity-0');
            return;
        }

        this.recentDiv.innerHTML = history.map(h => `
            <button class="history-chip px-3 py-1 bg-white/10 hover:bg-white/20 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-slate-700 rounded-full text-xs text-gray-500 hover:text-primary transition-all">
                ${h}
            </button>
        `).join('');
        this.recentDiv.classList.remove('opacity-0');

        this.recentDiv.querySelectorAll('.history-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.input.value = chip.textContent.trim();
                this.triggerSearch();
            });
        });
    }

    startVoice() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Voice recognition not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.start();

        if (this.voiceBtn) this.voiceBtn.classList.add('text-primary', 'animate-pulse');

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.input.value = transcript;
            this.triggerSearch();
        };

        recognition.onend = () => {
            if (this.voiceBtn) this.voiceBtn.classList.remove('text-primary', 'animate-pulse');
        };
    }
};

