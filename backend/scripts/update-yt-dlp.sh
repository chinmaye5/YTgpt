#!/bin/bash

echo "🔄 Downloading latest yt-dlp..."

curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  -o ./node_modules/youtube-dl-exec/bin/yt-dlp

chmod a+rx ./node_modules/youtube-dl-exec/bin/yt-dlp

echo "✅ yt-dlp updated successfully!"
