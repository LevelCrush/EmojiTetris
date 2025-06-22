# 🎮 Emoji Tetris

A unique twist on the classic Tetris game that uses Discord server emojis as game pieces, complete with Discord soundboard integration and YouTube background music.

🎯 **[Play Live Demo](https://levelcrush.github.io/EmojiTetris/)** | 🎮 **[View on GitHub](https://github.com/levelcrush/EmojiTetris)**

![Emoji Tetris](https://img.shields.io/badge/Discord-Emoji-7289DA?style=for-the-badge&logo=discord&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Ready-222222?style=for-the-badge&logo=github&logoColor=white)

## ✨ Features

- **Discord Emoji Integration**: Uses your Discord server's custom emojis as Tetris pieces
- **Soundboard Effects**: Plays random Discord soundboard sounds when clearing lines
- **YouTube Background Music**: Customizable background music with playlist support
- **Multi-Input Support**: 
  - Keyboard controls
  - Mouse/Touch controls
  - Gamepad support
- **Progressive Particle Effects**: Visual effects that scale with the number of lines cleared
- **Rainbow Pieces**: Special animated pieces that cycle through emojis
- **Mobile Responsive**: Optimized controls and timing for mobile devices
- **Base64 Support**: Works on GitHub Pages without Git LFS

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- A Discord Bot with access to your server
- Discord.js installed (`npm install discord.js`)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/emoji-tetris.git
   cd emoji-tetris
   ```

2. **Install dependencies**
   ```bash
   npm install discord.js dotenv
   ```

3. **Configure Discord Bot**
   
   Create a `.env` file in the root directory:
   ```env
   DISCORD_BOT_TOKEN=your_bot_token_here
   DISCORD_GUILD_ID=your_server_id_here
   USE_BASE64=true
   ```

4. **Fetch Discord Emojis**
   ```bash
   node fetch-emojis.js
   ```
   This will download all emojis and sounds from your Discord server.

5. **Deploy to GitHub Pages**
   ```bash
   git add .
   git commit -m "Add Discord emojis"
   git push origin main
   ```
   Enable GitHub Pages in your repository settings.

## 🎮 How to Play

### Controls

**Keyboard:**
- ← → : Move left/right
- ↓ : Soft drop
- ↑ / Space : Rotate piece
- Shift : Hold piece
- P : Pause game

**Mouse/Touch:**
- Tap sides : Move left/right
- Tap center : Rotate
- Swipe down : Soft drop
- Swipe up : Hard drop

**Mobile:**
- Bottom buttons : Movement and drop
- Top buttons : Pause, hold, rotate

### Game Mechanics

- **Lines**: Clear lines by filling complete rows
- **Levels**: Advance every 10 lines cleared
- **Speed**: Increases with each level
- **Hold**: Store a piece for later use
- **Ghost Piece**: Shows where your piece will land
- **Rainbow Pieces**: Special pieces that appear periodically

## 🛠️ Configuration

### Discord Bot Setup

1. Create a Discord application at https://discord.com/developers/applications
2. Create a bot and copy the token
3. Invite the bot to your server with these permissions:
   - Read Messages
   - Use External Emojis
   - Read Message History

### YouTube Music

1. Click the settings button (⚙️) in-game
2. Enter a YouTube URL or playlist
3. Supported formats:
   - Single video: `https://www.youtube.com/watch?v=VIDEO_ID`
   - Playlist: `https://www.youtube.com/playlist?list=PLAYLIST_ID`
   - Comma-separated video IDs: `VIDEO_ID1,VIDEO_ID2,VIDEO_ID3`

### Customization Options

- **Emoji Variety**: The game automatically uses all emojis from your Discord server
- **Sound Effects**: Automatically uses all soundboard sounds from your server
- **Particle Effects**: Progressive effects based on lines cleared (1-4 lines)
- **Drop Speed**: Automatically adjusts based on level

## 📁 Project Structure

```
emoji-tetris/
├── index.html          # Main game page
├── game.js            # Core game logic
├── controls.js        # Input handling system
├── particles.js       # Particle effects system
├── audio.js          # YouTube player management
├── style.css         # Game styling
├── fetch-emojis.js   # Discord emoji fetcher
├── emojis/           # Downloaded emoji assets
│   ├── manifest.json # Emoji metadata
│   └── *.png/gif    # Emoji images
└── README.md        # This file
```

## 🔧 Technical Details

### Base64 Encoding

When `USE_BASE64=true`, emojis are embedded directly in the manifest.json file as base64 data URLs. This allows the game to work on GitHub Pages without Git LFS.

### Emoji Loading

The game loads all emojis from your Discord server and uses a smart randomization system to ensure variety:
- Tracks recently used emojis to prevent repetition
- Maintains a history of ~30% of total emojis
- Resets tracking when running low on options

### Performance Optimizations

- **Mobile Timing**: Special frame rate limiting for consistent gameplay
- **Lazy Loading**: Emojis load asynchronously without blocking gameplay
- **Canvas Rendering**: Hardware-accelerated graphics
- **Efficient Particle System**: Pooled particles for better performance

## 🐛 Troubleshooting

### Emojis Not Loading
- Ensure your bot has access to the Discord server
- Check that the guild ID is correct in `.env`
- Verify the bot has permission to read emojis

### Only Showing 7 Emojis
- Re-run `fetch-emojis.js` to download all emojis
- Check that manifest.json contains all your server's emojis

### GitHub Pages Issues
- Ensure `USE_BASE64=true` in your `.env` before fetching emojis
- Commit and push the `emojis/` directory

### Mobile Performance
- The game automatically adjusts timing for mobile devices
- Use the mobile-specific controls for best experience

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with vanilla JavaScript and HTML5 Canvas
- Discord.js for emoji and soundboard integration
- YouTube IFrame API for background music
- Inspired by the classic Tetris game

## 🎯 Future Enhancements

- [ ] Multiplayer support
- [ ] Leaderboard system
- [ ] Custom emoji packs
- [ ] More particle effect types
- [ ] Achievement system
- [ ] PWA support for offline play

---

Made with ❤️ and Discord emojis 🎮