/**
 * Settings and LocalStorage Management
 */

import { storage } from '../utils/helpers.js';

export class SettingsManager {
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
            if (input) input.value = storage.get(k) || '';
        });

        const aiCheck = document.getElementById('enable-ai');
        aiCheck.checked = storage.get('enable-ai') !== false;

        const safeSearch = document.getElementById('safe-search');
        safeSearch.value = storage.get('safe-search') || 'moderate';

        // Event Listeners
        this.openBtn.addEventListener('click', () => this.open());
        this.closeBtn.addEventListener('click', () => this.close());
        this.saveBtn.addEventListener('click', () => this.save());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Close on escape
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.close();
            }
        });
    }

    open() {
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
        setTimeout(() => {
            this.content.classList.remove('scale-95', 'opacity-0');
        }, 10);
    }

    close() {
        this.content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.modal.classList.remove('flex');
        }, 300);
    }

    save() {
        const keys = ['web-key', 'openai-key', 'news-key'];
        keys.forEach(k => {
            const val = document.getElementById(k).value.trim();
            storage.set(k, val);
        });

        storage.set('enable-ai', document.getElementById('enable-ai').checked);
        storage.set('safe-search', document.getElementById('safe-search').value);

        // Flash save button success
        const originalText = this.saveBtn.textContent;
        this.saveBtn.textContent = 'Saved Successfully!';
        this.saveBtn.classList.replace('bg-primary', 'bg-green-500');
        
        setTimeout(() => {
            this.saveBtn.textContent = originalText;
            this.saveBtn.classList.replace('bg-green-500', 'bg-primary');
            this.close();
        }, 1500);
    }

    toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        storage.set('theme', isDark ? 'dark' : 'light');
    }
}
