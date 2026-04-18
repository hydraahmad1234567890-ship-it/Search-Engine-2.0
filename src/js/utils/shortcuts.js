/**
 * Keyboard Shortcuts Handler
 */

window.App = window.App || {};
window.App.utils = window.App.utils || {};

window.App.utils.initShortcuts = (actions) => {
    let focusedIndex = -1;

    const getSelectableElements = () => {
        return Array.from(document.querySelectorAll('.result-card, .github-repo-card, .news-card, .wiki-card'));
    };

    const updateFocus = (elements, newIndex) => {
        elements.forEach(el => el.classList.remove('ring-4', 'ring-primary/40', 'scale-[1.02]', 'bg-primary/5'));
        if (newIndex >= 0 && newIndex < elements.length) {
            const el = elements[newIndex];
            el.classList.add('ring-4', 'ring-primary/40', 'scale-[1.02]', 'bg-primary/5');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            focusedIndex = newIndex;
        }
    };

    window.addEventListener('keydown', (e) => {
        // Search focus: /
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            actions.focusSearch();
            focusedIndex = -1;
            updateFocus(getSelectableElements(), -1);
        }

        // Settings: Cmd/Ctrl + K
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            actions.openSettings();
        }

        // Clear search: Escape
        if (e.key === 'Escape') {
            const settingsActive = !document.getElementById('settings-modal').classList.contains('hidden');
            if (settingsActive) {
                actions.closeSettings();
            } else {
                actions.clearSearch();
                focusedIndex = -1;
            }
        }

        // Result Navigation
        const elements = getSelectableElements();
        if (elements.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                updateFocus(elements, Math.min(focusedIndex + 1, elements.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                updateFocus(elements, Math.max(focusedIndex - 1, 0));
            } else if (e.key === 'Enter' && focusedIndex !== -1) {
                const link = elements[focusedIndex].querySelector('a');
                if (link) link.click();
            }
        }
    });
};

