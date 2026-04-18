/**
 * Keyboard Shortcuts Handler
 */

window.App = window.App || {};
window.App.utils = window.App.utils || {};

window.App.utils.initShortcuts = (actions) => {
    window.addEventListener('keydown', (e) => {
        // Search focus: /
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            actions.focusSearch();
        }

        // Settings: Cmd/Ctrl + K
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            actions.openSettings();
        }

        // Clear search: Escape (only if no modal is active)
        if (e.key === 'Escape' && document.getElementById('settings-modal').classList.contains('hidden')) {
            actions.clearSearch();
        }

        // Navigation through results: ArrowDown, ArrowUp
        // TBD: Logic for selecting result cards
    });
};

