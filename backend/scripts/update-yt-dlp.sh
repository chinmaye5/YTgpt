#!/bin/bash

echo "🔄 Downloading latest yt-dlp binary..."

mkdir -p ./node_modules/youtube-dl-exec/bin

curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  -o ./node_modules/youtube-dl-exec/bin/yt-dlp

chmod +x ./node_modules/youtube-dl-exec/bin/yt-dlp

echo "✅ yt-dlp binary updated!"
