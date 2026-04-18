/**
 * Helper utilities for Next-Gen Search Engine
 */

window.App = window.App || {};
window.App.utils = {
    debounce: (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },

    sanitize: (html) => {
        if (typeof DOMPurify !== 'undefined') {
            return DOMPurify.sanitize(html);
        }
        return html; // Fallback if library fails
    },

    formatDate: (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    },

    getFavicon: (url) => {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        } catch (e) {
            return 'https://lucide.dev/icons/globe'; // Fallback
        }
    },

    truncateUrl: (url, length = 60) => {
        try {
            const urlObj = new URL(url);
            let display = urlObj.hostname + urlObj.pathname;
            if (display.length > length) {
                return display.substring(0, length) + '...';
            }
            return display;
        } catch (e) {
            return url;
        }
    },

    storage: (() => {
        const DEFAULTS = {
            'news-key': '86612eba76f949f5917cfded92e6e8fa',
            'web-key': '5caafaa661da2ea8e4a38819b1582b4874e25ba0',
            'enable-ai': true,
            'safe-search': 'moderate',
            'theme': 'dark'
        };

        return {
            set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
            get: (key) => {
                const val = localStorage.getItem(key);
                if (val) {
                    try {
                        return JSON.parse(val);
                    } catch (e) {
                        return val;
                    }
                }
                return DEFAULTS[key] || null;
            },
            remove: (key) => localStorage.removeItem(key)
        };
    })(),

    queryParams: {
        get: (param) => new URLSearchParams(window.location.search).get(param),
        set: (param, value) => {
            const url = new URL(window.location);
            url.searchParams.set(param, value);
            window.history.pushState({}, '', url);
        }
    }
};

