exports.processVideo = async (req, res) => {
    const { videoUrl } = req.body;
    const userId = req.user.userId;

    try {
        const videoId = new URL(videoUrl).searchParams.get('v');
        if (!videoId) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        // Define possible filenames
        const vttFile = path.join(__dirname, '..', `${videoId}.en.vtt`);
        const vttFileDoubleExt = path.join(__dirname, '..', `${videoId}.en.vtt.en.vtt`);

        // Clean up any existing files
        await fs.unlink(vttFile).catch(() => { });
        await fs.unlink(vttFileDoubleExt).catch(() => { });

        // Download captions with cookies authentication
        console.log('Downloading subtitles for:', videoUrl);
        try {
            await youtubedl(videoUrl, {
                skipDownload: true,
                writeAutoSub: true,
                subLang: 'en',
                output: path.join(__dirname, '..', videoId),
                cookiesFromBrowser: 'chrome' // Add this line to use Chrome cookies
            });
        } catch (downloadError) {
            console.error('Download error, trying without cookies:', downloadError);
            // Fallback attempt without cookies
            await youtubedl(videoUrl, {
                skipDownload: true,
                writeAutoSub: true,
                subLang: 'en',
                output: path.join(__dirname, '..', videoId)
            });
        }

        // Wait to ensure file is written
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check for either file
        let targetFile;
        try {
            await fs.access(vttFile);
            targetFile = vttFile;
            console.log('Found file:', vttFile);
        } catch {
            try {
                await fs.access(vttFileDoubleExt);
                targetFile = vttFileDoubleExt;
                console.log('Found file:', vttFileDoubleExt);
            } catch {
                console.error('No subtitles file found at:', vttFile, 'or', vttFileDoubleExt);
                return res.status(400).json({ error: 'No English subtitles available for this video' });
            }
        }

        // Read and process the file
        const vttContent = await readFile(targetFile, 'utf8');
        const cleaned = cleanVTT(vttContent);
        const chunks = chunkTranscript(cleaned);

        // Clean up both possible files
        await fs.unlink(vttFile).catch(() => { });
        await fs.unlink(vttFileDoubleExt).catch(() => { });

        res.json({ chunks, message: 'Video processed successfully' });
    } catch (err) {
        console.error('Error processing video:', err);
        res.status(500).json({ error: `Failed to process video: ${err.message}` });
    }
};