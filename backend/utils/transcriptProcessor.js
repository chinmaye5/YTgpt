// Clean VTT to plain text
exports.cleanVTT = (vttContent) => {
    return vttContent
        .replace(/^WEBVTT.*\n/, '')
        .replace(/NOTE.*\n(?:.*\n)*?\n/g, '')
        .replace(/\n{2,}/g, '\n')
        .replace(/^\d{2}:\d{2}:\d{2}\.\d{3} --> .*$/gm, '')
        .replace(/<\d{2}:\d{2}:\d{2}\.\d{3}>/g, '')
        .replace(/<\/?c[^>]*>/g, '')
        .replace(/^\d+\n/gm, '')
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

// Split text into ~3-sentence chunks
exports.chunkTranscript = (text, sentencesPerChunk = 3) => {
    const sentences = text.match(/[^.!?]+[.!?]/g) || [text];
    const chunks = [];
    for (let i = 0; i < sentences.length; i += sentencesPerChunk) {
        chunks.push(sentences.slice(i, i + sentencesPerChunk).join(' ').trim());
    }
    return chunks;
};

// Score chunks with naive TF-IDF
exports.scoreChunks = (query, chunks, topK = 5) => {
    const terms = query.toLowerCase().split(/\s+/);
    return chunks
        .map(chunk => {
            const words = chunk.toLowerCase().split(/\s+/);
            const score = terms.reduce((sum, t) => sum + words.filter(w => w.includes(t)).length, 0);
            return { text: chunk, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map(c => c.text);
};