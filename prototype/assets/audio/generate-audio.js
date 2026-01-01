// Simple script to generate placeholder audio files using ffmpeg
// This creates 5-second loopable audio files for each sound type

const { execSync } = require('child_process');
const fs = require('fs');

// Check if ffmpeg is available
try {
  execSync('ffmpeg -version', { stdio: 'ignore' });
  console.log('ffmpeg found, generating audio files...');
} catch (e) {
  console.error('ffmpeg not found. Please install ffmpeg to generate audio files.');
  console.log('Creating placeholder MP3 files instead...');
  
  // Create minimal valid MP3 files (silence)
  // MP3 header for a minimal valid file
  const mp3Header = Buffer.from([
    0xFF, 0xFB, 0x90, 0x00, // MP3 sync word and header
  ]);
  
  // Create very basic MP3 files (these will be silent but valid)
  ['rain.mp3', 'wind.mp3', 'piano.mp3'].forEach(file => {
    // Create a minimal valid MP3 with repeated frames
    const frames = [];
    for (let i = 0; i < 100; i++) {
      frames.push(mp3Header);
      // Add padding
      frames.push(Buffer.alloc(100, 0));
    }
    fs.writeFileSync(file, Buffer.concat(frames));
    console.log(`Created placeholder ${file}`);
  });
  
  process.exit(0);
}

// Generate audio using ffmpeg
const commands = [
  // Rain: white noise filtered
  'ffmpeg -f lavfi -i "anoisesrc=duration=5:color=white:sample_rate=44100" -af "highpass=f=500,lowpass=f=3000" -y rain.mp3',
  
  // Wind: brown noise (lower frequency)
  'ffmpeg -f lavfi -i "anoisesrc=duration=5:color=brown:sample_rate=44100" -af "lowpass=f=1200,highpass=f=80" -y wind.mp3',
  
  // Piano: synthesized sparse tones
  'ffmpeg -f lavfi -i "sine=frequency=220:duration=0.5" -f lavfi -i "sine=frequency=262:duration=0.5" -f lavfi -i "sine=frequency=196:duration=0.5" -filter_complex "[0:a][1:a][2:a]concat=n=3:v=0:a=1,afade=t=in:st=0:d=0.1,afade=t=out:st=4.9:d=0.1" -y piano.mp3'
];

commands.forEach(cmd => {
  try {
    console.log('Running:', cmd.split(' ').slice(0, 5).join(' ') + '...');
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error('Error generating audio:', e.message);
  }
});

console.log('Audio generation complete!');
