/**
 * AI Service for Search Result Summarization
 */

import { storage } from '../utils/helpers.js';

export class AIService {
    async summarize(query, webResults) {
        const apiKey = storage.get('openai-key');
        const enabled = storage.get('enable-ai') !== false;

        if (!apiKey || !enabled || !webResults || webResults.length === 0) {
            return null;
        }

        const snippets = webResults.slice(0, 4).map((res, i) => `[${i+1}] ${res.title}: ${res.description}`).join('\n');
        
        const prompt = `
            Identify the core answer to the query based on the provided search results.
            Be concise, professional, and highlight key facts.
            If the results don't contain enough information, say so.
            Use Markdown formatting for readability.
            
            Query: ${query}
            
            Results:
            ${snippets}
            
            Summary:
        `;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.5,
                    max_tokens: 300
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            
            return {
                text: data.choices[0].message.content.trim(),
                sources: webResults.slice(0, 4)
            };
        } catch (e) {
            console.error('AI Summary Error:', e);
            return { error: 'Failed to generate AI summary.' };
        }
    }
}
