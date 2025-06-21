# Emoji Tetris

A fun Tetris game that uses Discord emojis as game pieces, with YouTube background music and spectacular particle effects!

## Features

- 🎮 **Multiple Control Methods**
  - Keyboard (Arrow keys, Space/Up to rotate, Shift to hold, P to pause)
  - Mouse/Touch (Click/tap zones, swipe gestures)
  - Gamepad support with haptic feedback
  
- 🎵 **YouTube Background Music**
  - Custom YouTube video/playlist support
  - Automatic progression: Next video plays when clearing 2+ lines
  - Multiple input formats:
    - Single video URL: `https://youtube.com/watch?v=VIDEO_ID`
    - Playlist URL: `https://youtube.com/playlist?list=PLAYLIST_ID`
    - Comma-separated IDs: `VIDEO_ID1,VIDEO_ID2,VIDEO_ID3`
  - Default mix of Tetris remixes and gaming music
  - Volume controls with mute toggle
  - Shows current video position in playlist

- 🔊 **Discord Soundboard Integration**
  - Plays random sounds from your server's soundboard when clearing lines
  - Shows sound name when played
  - Respects game volume settings

- ✨ **Particle Effects**
  - Single line: Sparkle burst + sound effect
  - Double line: Fireworks with trails + sound effect
  - Triple line: Rainbow explosion + sound effect
  - Tetris (4 lines): Epic multi-layered fireworks with screen shake + sound effect

- 😀 **Discord Emoji Integration**
  - Uses your Discord server's custom emojis as game pieces
  - Supports animated emojis (GIF)
  - Fallback to colored emoji blocks

## Setup

### 1. Fetch Discord Emojis and Sounds

First, install dependencies:
```bash
npm install
```

Create a `.env` file by copying the example:
```bash
cp .env.example .env
```

Edit `.env` and add your Discord bot token and guild ID:
```
DISCORD_BOT_TOKEN=your_actual_bot_token
DISCORD_GUILD_ID=your_actual_guild_id
USE_BASE64=true  # Required for GitHub Pages!
```

Then run the emoji fetcher (this will fetch both emojis AND soundboard sounds):
```bash
npm run fetch-emojis
```

**Important for GitHub Pages:** The `USE_BASE64=true` option embeds the emoji images and sounds directly into the `manifest.json` file as base64 data URLs. This allows everything to work on GitHub Pages without Git LFS.

### 2. Deploy to GitHub Pages

1. Push the repository to GitHub
2. Enable GitHub Pages in repository settings
3. Access your game at: `https://[username].github.io/emoji-tetris/`

## Game Controls

### Keyboard
- **←/→** - Move left/right
- **↓** - Soft drop
- **↑/Space** - Rotate
- **Shift** - Hold piece
- **P** - Pause

### Touch/Mouse
- **Left side** - Move left
- **Right side** - Move right
- **Center** - Rotate
- **Swipe down** - Soft drop
- **Swipe up** - Hard drop

### Gamepad
- **D-pad/Left stick** - Movement
- **A button** - Rotate
- **B button** - Hold
- **Start** - Pause

## Customization

### YouTube Music
1. Click the gear icon (⚙️) in the top-left
2. Enter a YouTube URL or playlist ID
3. Click "Apply" to load your music

### Scoring
- Single line: 40 × level
- Double line: 100 × level
- Triple line: 300 × level
- Tetris: 1200 × level
- Soft drop: 1 point per cell
- Hard drop: 2 points per cell dropped

## Browser Requirements

- Modern browser with ES6 support
- WebGL for particle effects
- YouTube iframe API support
- Optional: Gamepad API for controller support

## License

MIT License - Feel free to modify and share!

---

Made with ❤️ using Discord emojis and web technologies