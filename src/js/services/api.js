/**
 * API Aggregator for Next-Gen Search Engine
 */

window.App = window.App || {};
window.App.services = window.App.services || {};

window.App.services.SearchAPI = class SearchAPI {
    constructor() {
        this.cache = new Map();
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    }

    async fetchAll(query) {
        // Check local cache first
        const cached = this.getCache(query);
        if (cached) return cached;

        const results = await Promise.allSettled([
            this.fetchWeb(query),
            this.fetchWiki(query),
            this.fetchGitHub(query),
            this.fetchReddit(query),
            this.fetchGiphy(query),
            this.fetchNews(query)
        ]);

        const aggregated = {
            query,
            timestamp: Date.now(),
            web: results[0].status === 'fulfilled' ? results[0].value : [],
            wiki: results[1].status === 'fulfilled' ? results[1].value : null,
            code: results[2].status === 'fulfilled' ? results[2].value : [],
            reddit: results[3].status === 'fulfilled' ? results[3].value : [],
            images: results[4].status === 'fulfilled' ? results[4].value : [],
            news: results[5].status === 'fulfilled' ? results[5].value : [],
        };

        this.setCache(query, aggregated);
        return aggregated;
    }

    async fetchWeb(query) {
        const key = window.App.utils.storage.get('web-key');
        if (!key) return this.fetchFallback(query);

        try {
            const response = await fetch('https://google.serper.dev/search', {
                method: 'POST',
                headers: {
                    'X-API-KEY': key,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ q: query })
            });
            const data = await response.json();
            
            return (data.organic || []).map(res => ({
                title: res.title,
                url: res.link,
                description: res.snippet,
                source: 'Google'
            }));
        } catch (e) {
            console.error('Web Search Error:', e);
            return this.fetchFallback(query);
        }
    }

    async fetchFallback(query) {
        try {
            const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
            const data = await response.json();
            if (data.AbstractText) {
                return [{
                    title: data.Heading,
                    url: data.AbstractURL,
                    description: data.AbstractText,
                    source: 'DuckDuckGo'
                }];
            }
            return [];
        } catch (e) {
            return [];
        }
    }

    async fetchWiki(query) {
        try {
            // Added redirects=1 to handle title variations and exact cases
            const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts|pageimages&exintro&explaintext&redirects=1&titles=${encodeURIComponent(query)}&pithumbsize=400`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (!data.query || !data.query.pages) return null;
            
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            
            if (pageId === '-1') {
                // Try a search fallback if exact title fails
                return this.searchWiki(query);
            }
            
            return {
                title: pages[pageId].title,
                extract: pages[pageId].extract,
                thumbnail: pages[pageId].thumbnail?.source,
                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(pages[pageId].title)}`
            };
        } catch (e) {
            console.warn('Wiki Fetch Error:', e);
            return null;
        }
    }

    async searchWiki(query) {
        try {
            const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
            const res = await fetch(searchUrl);
            const data = await res.json();
            if (data.query.search.length > 0) {
                // Re-fetch the first search result for details
                return this.fetchWiki(data.query.search[0].title);
            }
        } catch (e) {}
        return null;
    }

    async fetchGitHub(query) {
        try {
            const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`);
            const data = await response.json();
            return data.items || [];
        } catch (e) {
            return [];
        }
    }

    async fetchReddit(query) {
        try {
            const response = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=5&sort=relevance`);
            const data = await response.json();
            return data.data.children.map(child => child.data);
        } catch (e) {
            return [];
        }
    }

    async fetchGiphy(query) {
        try {
            const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(query)}&limit=6&rating=g`);
            const data = await response.json();
            return data.data || [];
        } catch (e) {
            return [];
        }
    }

    async fetchNews(query) {
        try {
            const apiKey = window.App.utils.storage.get('news-key');
            if (!apiKey) return [];
            
            const response = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`);
            const data = await response.json();
            
            if (data.status === 'error' && data.code === 'corsNotAllowed') {
                console.warn('NewsAPI: CORS not allowed on this domain (GitHub Pages limitation).');
                return [];
            }
            
            return data.articles || [];
        } catch (e) {
            console.error('News Search Error:', e);
            return [];
        }
    }

    getCache(query) {
        const cache = window.App.utils.storage.get(`cache_${query.toLowerCase()}`);
        if (cache && (Date.now() - cache.timestamp < this.CACHE_TTL)) {
            return cache;
        }
        return null;
    }

    setCache(query, data) {
        window.App.utils.storage.set(`cache_${query.toLowerCase()}`, data);
    }
};

