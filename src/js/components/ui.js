/**
 * UI Components and Rendering for Next-Gen Search Engine
 */

window.App = window.App || {};
window.App.components = window.App.components || {};

window.App.components.UIRenderer = class UIRenderer {
    constructor() {
        this.resultsGrid = document.getElementById('results-grid');
        this.aiContainer = document.getElementById('ai-summary-container');
        this.statsContainer = document.getElementById('result-stats');
        
        if (!this.resultsGrid) console.warn('UIRenderer: results-grid element not found.');
    }

    clear() {
        if (this.resultsGrid) this.resultsGrid.innerHTML = '';
        if (this.aiContainer) {
            this.aiContainer.classList.add('hidden');
            this.aiContainer.innerHTML = '';
        }
        if (this.statsContainer) this.statsContainer.textContent = '';
    }

    renderSkeleton() {
        this.clear();
        for (let i = 0; i < 5; i++) {
            const skeleton = `
                <div class="p-6 bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 space-y-4">
                    <div class="flex items-center gap-3">
                        <div class="w-6 h-6 skeleton rounded-full"></div>
                        <div class="w-40 h-4 skeleton"></div>
                    </div>
                    <div class="w-3/4 h-6 skeleton"></div>
                    <div class="space-y-2">
                        <div class="w-full h-4 skeleton"></div>
                        <div class="w-5/6 h-4 skeleton"></div>
                    </div>
                </div>
            `;
            this.resultsGrid.innerHTML += skeleton;
        }
    }

    renderAISummary(summary) {
        if (!summary) return;

        this.aiContainer.classList.remove('hidden');
        this.aiContainer.innerHTML = `
            <div class="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 shadow-xl animate-fade-in-up">
                <div class="flex items-center gap-3 mb-4">
                    <div class="p-2 bg-primary rounded-xl text-white">
                        <i data-lucide="sparkles" class="w-5 h-5"></i>
                    </div>
                    <h3 class="text-xl font-bold font-['Outfit']">AI Answer</h3>
                </div>
                <div class="prose-ai mb-6">
                    ${summary.error ? `<p class="text-red-500">${summary.error}</p>` : (typeof marked !== 'undefined' ? marked.parse(summary.text) : summary.text)}
                </div>
                ${summary.sources ? `
                <div class="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-widest w-full mb-2">Sources</span>
                    ${summary.sources.map((s, i) => `
                        <a href="${s.url}" target="_blank" class="flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 rounded-full text-xs transition-colors border border-gray-100 dark:border-slate-700">
                            <img src="${window.App.utils.getFavicon(s.url)}" class="w-3 h-3 rounded-sm" />
                            <span class="truncate max-w-[120px]">${s.title}</span>
                        </a>
                    `).join('')}
                </div>
                ` : ''}
                
                <div class="flex justify-between items-center mt-6">
                    <div class="flex gap-4">
                        <button class="text-gray-400 hover:text-green-500 transition-colors"><i data-lucide="thumbs-up" class="w-4 h-4"></i></button>
                        <button class="text-gray-400 hover:text-red-500 transition-colors"><i data-lucide="thumbs-down" class="w-4 h-4"></i></button>
                    </div>
                    <button class="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                        <i data-lucide="copy" class="w-3 h-3"></i> Copy Answer
                    </button>
                </div>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        setTimeout(() => {
            this.aiContainer.classList.remove('opacity-0', 'translate-y-4');
        }, 50);
    }

    renderWebResults(results) {
        if (!results || results.length === 0) {
            this.resultsGrid.innerHTML += this.renderEmpty('web');
            return;
        }

        results.forEach(res => {
            const card = `
                <div class="result-card p-6 bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-gray-100 dark:border-slate-700 animate-fade-in-up">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-3 overflow-hidden">
                            <img src="${window.App.utils.getFavicon(res.url)}" class="w-5 h-5 rounded-sm" onerror="this.src='https://lucide.dev/icons/globe'"/>
                            <span class="text-sm text-gray-500 truncate">${window.App.utils.truncateUrl(res.url)}</span>
                        </div>
                        <div class="flex gap-2">
                            <button class="bookmark-btn p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-400" data-id="${res.url}" data-title="${res.title}" data-url="${res.url}">
                                <i data-lucide="star" class="w-4 h-4"></i>
                            </button>
                            <button class="share-btn p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-400" data-url="${res.url}">
                                <i data-lucide="share-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                    <a href="${res.url}" target="_blank" class="group">
                        <h3 class="text-xl font-semibold text-primary group-hover:underline mb-2">${res.title}</h3>
                    </a>
                    <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">${res.description || res.snippet || ''}</p>
                </div>
            `;
            this.resultsGrid.innerHTML += card;
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    renderWikiResult(wiki) {
        if (!wiki) return;
        const card = `
            <div class="wiki-card p-8 bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl relative overflow-hidden group mb-6 transition-all duration-300">
                <div class="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full"></div>
                <div class="relative z-10">
                    <div class="flex items-center gap-3 mb-4">
                        <i data-lucide="book-open" class="text-primary w-6 h-6"></i>
                        <span class="text-xs font-bold uppercase tracking-widest text-primary">From Wikipedia</span>
                    </div>
                    <div class="flex flex-col md:flex-row gap-6">
                        ${wiki.thumbnail ? `<img src="${wiki.thumbnail}" class="w-full md:w-32 h-32 object-cover rounded-2xl shadow-lg" />` : ''}
                        <div>
                            <h3 class="text-2xl font-bold mb-3 font-['Outfit']">${wiki.title}</h3>
                            <p class="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-4">${wiki.extract}</p>
                            <a href="${wiki.url}" target="_blank" class="inline-flex items-center gap-2 text-primary text-sm font-semibold hover:gap-3 transition-all">
                                Read More <i data-lucide="external-link" class="w-4 h-4"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.resultsGrid.insertAdjacentHTML('afterbegin', card);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    renderCodeResults(repos) {
        if (!repos || repos.length === 0) return;
        
        const section = `
            <div class="mt-8">
                <h3 class="flex items-center gap-2 text-lg font-bold mb-4 px-2">
                    <i data-lucide="github" class="w-5 h-5"></i> GitHub Repositories
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${repos.map(repo => `
                        <a href="${repo.html_url}" target="_blank" class="github-repo-card p-4 bg-white dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700 rounded-2xl hover:border-primary/50 transition-all group">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">${repo.name}</span>
                                <div class="flex items-center gap-2 text-xs text-gray-500">
                                    <i data-lucide="star" class="w-3 h-3 text-yellow-500"></i> ${repo.stargazers_count}
                                </div>
                            </div>
                            <p class="text-xs text-gray-500 line-clamp-2">${repo.description || 'No description available.'}</p>
                            <div class="mt-3 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                <span>${repo.language || 'Code'}</span>
                                <span>Updated: ${window.App.utils.formatDate(repo.updated_at)}</span>
                            </div>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
        this.resultsGrid.innerHTML += section;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    renderImageResults(images) {
        if (!images || images.length === 0) return;

        const section = `
            <div class="mt-8">
                <h3 class="flex items-center gap-2 text-lg font-bold mb-4 px-2">
                    <i data-lucide="image" class="w-5 h-5"></i> Related Visuals
                </h3>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    ${images.map(img => `
                        <div class="group relative aspect-video overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800">
                            <img src="${img.images.fixed_height.url}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <a href="${img.url}" target="_blank" class="p-2 bg-white rounded-full text-black"><i data-lucide="external-link" class="w-4 h-4"></i></a>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        this.resultsGrid.innerHTML += section;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    renderNewsResults(articles) {
        if (!articles || articles.length === 0) return;

        const section = `
            <div class="mt-8">
                <h3 class="flex items-center gap-2 text-lg font-bold mb-4 px-2">
                    <i data-lucide="newspaper" class="w-5 h-5"></i> Latest News
                </h3>
                <div class="space-y-4">
                    ${articles.map(art => `
                        <a href="${art.url}" target="_blank" class="news-card flex flex-col md:flex-row gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 hover:shadow-lg transition-all">
                            ${art.urlToImage ? `<img src="${art.urlToImage}" class="w-full md:w-32 h-24 object-cover rounded-xl" />` : ''}
                            <div class="flex-grow">
                                <div class="text-xs text-primary font-bold uppercase tracking-wider mb-1">${art.source.name}</div>
                                <h4 class="font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1">${art.title}</h4>
                                <p class="text-xs text-gray-500 line-clamp-2">${art.description || ''}</p>
                            </div>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
        this.resultsGrid.innerHTML += section;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    renderEmpty(type) {
        return `
            <div class="text-center py-20 px-6 bg-gray-50 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                <i data-lucide="alert-circle" class="w-10 h-10 text-gray-400 mx-auto mb-4"></i>
                <p class="text-gray-500 font-medium text-lg">No ${type} results found for this query.</p>
                <p class="text-gray-400 text-sm mt-2">Try adjusting your terms or checking your API keys in settings.</p>
            </div>
        `;
    }

    updateStats(count, time) {
        if (this.statsContainer) {
            this.statsContainer.textContent = `About ${count} results found in ${(time / 1000).toFixed(2)}s`;
        }
    }
};

