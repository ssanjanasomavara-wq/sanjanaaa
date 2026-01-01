#!/usr/bin/env bash
set -euo pipefail

# Script to generate loopable MP3 assets for the prototype using ffmpeg.
# Place this file in prototype/assets/audio and run it from that directory.

# Move to script directory
cd "$(dirname "$0")"

# Ensure ffmpeg is installed
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found. Install ffmpeg (homebrew, apt, choco, etc.) and re-run."
  exit 1
fi

# Generate rain (white noise filtered)
echo "Generating rain.mp3 (white noise filtered)..."
ffmpeg -f lavfi -i "anoisesrc=duration=12:color=white:sample_rate=44100" \
  -af "highpass=f=500,lowpass=f=3000,acompressor" \
  -c:a libmp3lame -b:a 128k -y rain.mp3

# Generate wind (brown noise filtered)
echo "Generating wind.mp3 (brown noise filtered)..."
ffmpeg -f lavfi -i "anoisesrc=duration=12:color=brown:sample_rate=44100" \
  -af "lowpass=f=1200,highpass=f=80,acompressor" \
  -c:a libmp3lame -b:a 128k -y wind.mp3

# Generate piano (simple synth pad loop)
echo "Generating piano.mp3 (synth pad loop)..."
ffmpeg -f lavfi -i "sine=frequency=330:duration=6" -f lavfi -i "sine=frequency=262:duration=6" \
  -filter_complex "[0:a][1:a]amix=inputs=2:duration=shortest,aloop=loop=1:size=1,lowpass=f=1500" \
  -c:a libmp3lame -b:a 192k -y piano.mp3

echo "Files generated:"
ls -lh rain.mp3 wind.mp3 piano.mp3

# Helpful notes to user
cat <<'EOF'

Next steps:
1. Verify the files were created and sound correct (play locally).
2. Commit the generated files:
   git add rain.mp3 wind.mp3 piano.mp3
   git commit -m "chore(audio): add generated valid mp3 assets for prototype"
   git push origin <your-branch>

Run the script from prototype/assets/audio:
  chmod +x generate-mp3s.sh
  ./generate-mp3s.sh

EOF
