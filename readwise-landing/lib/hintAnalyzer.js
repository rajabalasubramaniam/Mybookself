// Simple keyword extraction from hint text
export function extractKeywords(text) {
    if (!text) return [];
    
    // Common stop words to ignore
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'so', 'for', 'nor', 'yet',
        'of', 'to', 'in', 'on', 'at', 'with', 'without', 'by', 'about', 'like',
        'this', 'that', 'these', 'those', 'it', 'they', 'we', 'you', 'he', 'she',
        'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does',
        'did', 'but', 'so', 'then', 'if', 'because', 'as', 'until', 'while'];
    
    // Convert to lowercase and split
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/);
    
    // Count word frequency
    const wordCount = {};
    words.forEach(word => {
        if (word.length > 3 && !stopWords.includes(word)) {
            wordCount[word] = (wordCount[word] || 0) + 1;
        }
    });
    
    // Return top 5 keywords
    return Object.entries(wordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(w => w[0]);
}

// Generate search query from keywords and genres
export function generateSearchQuery(keywords, genres, authors) {
    let searchTerms = [];
    
    if (keywords.length > 0) {
        searchTerms.push(...keywords.slice(0, 3));
    }
    if (genres.length > 0) {
        searchTerms.push(...genres.slice(0, 2));
    }
    if (authors.length > 0) {
        searchTerms.push(authors[0]);
    }
    
    return searchTerms.join(' ');
}