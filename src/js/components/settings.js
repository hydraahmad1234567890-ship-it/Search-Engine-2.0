/**
 * Settings and LocalStorage Management
 */

window.App = window.App || {};
window.App.components = window.App.components || {};

window.App.components.SettingsManager = class SettingsManager {
    constructor() {
        this.modal = document.getElementById('settings-modal');
        this.content = document.getElementById('settings-content');
        this.openBtn = document.getElementById('open-settings-fab');
        this.closeBtn = document.getElementById('close-settings');
        this.saveBtn = document.getElementById('save-settings');
        this.themeToggle = document.getElementById('theme-toggle');

        this.init();
    }

    init() {
        // Load existing settings into inputs
        const keys = ['web-key', 'openai-key', 'news-key'];
        keys.forEach(k => {
            const input = document.getElementById(k);
            if (input) input.value = window.App.utils.storage.get(k) || '';
        });

        const aiCheck = document.getElementById('enable-ai');
        if (aiCheck) aiCheck.checked = window.App.utils.storage.get('enable-ai') !== false;

        const safeSearch = document.getElementById('safe-search');
        if (safeSearch) safeSearch.value = window.App.utils.storage.get('safe-search') || 'moderate';

        // Event Listeners
        if (this.openBtn) this.openBtn.addEventListener('click', () => this.open());
        if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close());
        if (this.saveBtn) this.saveBtn.addEventListener('click', () => this.save());
        if (this.themeToggle) this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Close on escape
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
                this.close();
            }
        });
    }

    open() {
        if (!this.modal || !this.content) return;
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
        setTimeout(() => {
            if (this.content) this.content.classList.remove('scale-95', 'opacity-0');
        }, 10);
    }

    close() {
        if (!this.modal || !this.content) return;
        this.content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            if (this.modal) {
                this.modal.classList.add('hidden');
                this.modal.classList.remove('flex');
            }
        }, 300);
    }

    save() {
        const keys = ['web-key', 'openai-key', 'news-key'];
        keys.forEach(k => {
            const input = document.getElementById(k);
            if (input) {
                const val = input.value.trim();
                window.App.utils.storage.set(k, val);
            }
        });

        const aiCheck = document.getElementById('enable-ai');
        if (aiCheck) window.App.utils.storage.set('enable-ai', aiCheck.checked);
        
        const safeSearch = document.getElementById('safe-search');
        if (safeSearch) window.App.utils.storage.set('safe-search', safeSearch.value);

        // Flash save button success
        if (this.saveBtn) {
            const originalText = this.saveBtn.textContent;
            this.saveBtn.textContent = 'Saved Successfully!';
            this.saveBtn.classList.replace('bg-primary', 'bg-green-500');
            
            setTimeout(() => {
                if (this.saveBtn) {
                    this.saveBtn.textContent = originalText;
                    this.saveBtn.classList.replace('bg-green-500', 'bg-primary');
                }
                this.close();
            }, 1500);
        } else {
            this.close();
        }
    }

    toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        window.App.utils.storage.set('theme', isDark ? 'dark' : 'light');
    }
};

