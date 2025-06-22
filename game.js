// Emoji Tetris Game
class EmojiTetris {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.holdCanvas = document.getElementById('hold-canvas');
        this.holdCtx = this.holdCanvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        // Game dimensions
        this.cols = 10;
        this.rows = 20;
        this.blockSize = 30;
        
        // Game state
        this.board = this.createBoard();
        this.currentPiece = null;
        this.nextPieces = [];
        this.heldPiece = null;
        this.canHold = true;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.highScore = parseInt(localStorage.getItem('highScore') || 0);
        this.gameOver = false;
        this.paused = false;
        this.dropTime = 1000;
        this.lastDrop = 0;
        this.softDropping = false;
        this.slowMotionEndTime = 0;
        this.piecesSpawned = 0;
        
        // Emoji pieces
        this.emojis = [];
        this.emojiImages = {};
        this.loadEmojis();
        
        // Soundboard sounds
        this.sounds = [];
        this.soundAudios = {};
        this.loadSounds();
        
        // Particle system
        this.particleSystem = new ParticleSystem(document.getElementById('particle-canvas'));
        
        // Controls
        this.controls = new Controls(this);
        
        // Tetromino shapes
        this.shapes = {
            I: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
            O: [[1,1], [1,1]],
            T: [[0,1,0], [1,1,1], [0,0,0]],
            S: [[0,1,1], [1,1,0], [0,0,0]],
            Z: [[1,1,0], [0,1,1], [0,0,0]],
            J: [[1,0,0], [1,1,1], [0,0,0]],
            L: [[0,0,1], [1,1,1], [0,0,0]]
        };
        
        // Mobile detection
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Game started flag
        this.gameStarted = false;
        
        // Initialize
        this.init();
    }
    
    createBoard() {
        return Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    }
    
    loadEmojis() {
        // Default emojis for testing (will be replaced by Discord emojis)
        this.emojis = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤'];
        this.useDefaultEmojis = true;
        
        // Try to load Discord emojis
        fetch('emojis/manifest.json')
            .then(res => {
                if (!res.ok) throw new Error('Manifest not found');
                return res.json();
            })
            .then(manifest => {
                if (manifest.emojis && manifest.emojis.length > 0) {
                    // Remove duplicates based on emoji ID
                    const uniqueEmojis = [];
                    const seenIds = new Set();
                    
                    manifest.emojis.forEach(emoji => {
                        if (!seenIds.has(emoji.id)) {
                            seenIds.add(emoji.id);
                            uniqueEmojis.push(emoji);
                        }
                    });
                    
                    console.log(`Found ${uniqueEmojis.length} unique emojis in manifest`);
                    manifest.emojis = uniqueEmojis;
                    
                    this.loadDiscordEmojis(manifest);
                    this.useDefaultEmojis = false;
                } else {
                    console.log('No Discord emojis found in manifest, using default emojis');
                }
            })
            .catch((error) => {
                console.log('Discord emojis not available, using default emojis:', error.message);
                this.updateEmojiStatus('Using default emoji blocks', 'default');
                setTimeout(() => {
                    document.getElementById('emoji-status').classList.add('hidden');
                }, 3000);
            });
    }
    
    loadDiscordEmojis(manifest) {
        let loadedCount = 0;
        const emojiCount = manifest.emojis.length;
        
        // Keep default emojis as fallback until Discord emojis are loaded
        // this.emojis will be replaced as we load
        this.emojiImages = {};
        
        // Update status
        this.updateEmojiStatus(`Loading ${emojiCount} Discord emojis...`);
        
        // Clear the emoji array only once we start loading
        this.emojis = new Array(emojiCount);
        
        manifest.emojis.forEach((emoji, index) => {
            // Add placeholder to maintain order
            this.emojis[index] = `[${emoji.name}]`;
            
            const img = new Image();
            
            // Use base64 data URL if available, otherwise load from file
            if (emoji.dataUrl) {
                img.src = emoji.dataUrl;
            } else {
                img.src = `emojis/${emoji.filename}`;
            }
            
            img.onload = () => {
                this.emojiImages[index] = img;
                loadedCount++;
                
                // Update status periodically
                if (loadedCount % 10 === 0 || loadedCount === emojiCount) {
                    this.updateEmojiStatus(`Loading Discord emojis... ${loadedCount}/${emojiCount}`);
                }
                
                if (loadedCount === emojiCount) {
                    const mode = manifest.useBase64 ? ' (base64 mode)' : '';
                    this.updateEmojiStatus(`Loaded ${emojiCount} Discord emojis!${mode}`, 'success');
                    console.log(`Successfully loaded ${Object.keys(this.emojiImages).length} Discord emojis`);
                    console.log(`Emoji array length: ${this.emojis.length}`);
                    console.log(`Sample emojis: ${this.emojis.slice(0, 10).join(', ')}`);
                    this.useDefaultEmojis = false;
                    setTimeout(() => {
                        document.getElementById('emoji-status').classList.add('hidden');
                    }, 3000);
                }
            };
            img.onerror = () => {
                console.error(`Failed to load emoji: ${emoji.name}`);
                loadedCount++;
                
                if (loadedCount === emojiCount) {
                    this.updateEmojiStatus(`Loaded ${Object.keys(this.emojiImages).length}/${emojiCount} emojis`, 'default');
                    setTimeout(() => {
                        document.getElementById('emoji-status').classList.add('hidden');
                    }, 3000);
                }
            };
        });
    }
    
    updateEmojiStatus(message, type = '') {
        const statusEl = document.getElementById('emoji-status');
        const textEl = document.getElementById('emoji-status-text');
        
        textEl.textContent = message;
        statusEl.className = 'emoji-status';
        if (type) {
            statusEl.classList.add(type);
        }
    }
    
    loadSounds() {
        // Try to load Discord sounds from manifest
        fetch('emojis/manifest.json')
            .then(res => {
                if (!res.ok) throw new Error('Manifest not found');
                return res.json();
            })
            .then(manifest => {
                if (manifest.sounds && manifest.sounds.length > 0) {
                    this.loadDiscordSounds(manifest);
                } else {
                    console.log('No Discord sounds found in manifest');
                }
            })
            .catch((error) => {
                console.log('Discord sounds not available:', error.message);
            });
    }
    
    loadDiscordSounds(manifest) {
        console.log(`Loading ${manifest.sounds.length} Discord sounds...`);
        
        const soundStatusEl = document.getElementById('sound-status');
        const soundTextEl = document.getElementById('sound-status-text');
        
        soundStatusEl.classList.remove('hidden');
        soundTextEl.textContent = `Loading ${manifest.sounds.length} sounds...`;
        
        manifest.sounds.forEach((sound) => {
            const audio = new Audio();
            
            // Use base64 data URL if available, otherwise load from file
            if (sound.dataUrl) {
                audio.src = sound.dataUrl;
            } else {
                audio.src = `emojis/${sound.filename}`;
            }
            
            audio.volume = 0.5; // Default volume
            audio.preload = 'auto';
            
            this.soundAudios[sound.index] = {
                audio: audio,
                name: sound.name
            };
            
            this.sounds.push(sound);
        });
        
        console.log('Discord sounds loaded!');
        
        // Update status
        soundStatusEl.className = 'sound-status has-sounds';
        soundTextEl.textContent = `${this.sounds.length} sounds ready!`;
        
        // Hide after delay
        setTimeout(() => {
            soundStatusEl.classList.add('hidden');
        }, 5000);
    }
    
    playRandomSound() {
        if (this.sounds.length === 0) return;
        
        // Pick a random sound
        const randomIndex = Math.floor(Math.random() * this.sounds.length);
        const soundData = this.soundAudios[randomIndex];
        
        if (soundData && soundData.audio) {
            // Clone the audio to allow overlapping sounds
            const audio = soundData.audio.cloneNode();
            audio.volume = (window.audioManager?.getVolume() || 50) / 100; // Use the game volume
            audio.play().catch(e => console.log('Sound play failed:', e));
            
            console.log(`Playing sound: ${soundData.name}`);
            
            // Show sound name briefly
            const soundStatusEl = document.getElementById('sound-status');
            const soundTextEl = document.getElementById('sound-status-text');
            
            soundStatusEl.className = 'sound-status has-sounds';
            soundTextEl.textContent = `🎵 ${soundData.name}`;
            
            // Hide after a moment
            clearTimeout(this.soundHideTimeout);
            this.soundHideTimeout = setTimeout(() => {
                soundStatusEl.classList.add('hidden');
            }, 2000);
        }
    }
    
    init() {
        // Update high score display
        document.getElementById('high-score').textContent = this.highScore;
        
        // UI event listeners
        document.getElementById('play-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('controls-btn').addEventListener('click', () => this.showControls());
        document.getElementById('close-controls').addEventListener('click', () => this.hideControls());
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
        document.getElementById('back-to-menu').addEventListener('click', () => this.backToMenu());
        
        // Make game instance globally available
        window.gameInstance = this;
        
        // Draw empty board
        this.draw();
    }
    
    startGame() {
        if (this.gameStarted) return;
        
        this.gameStarted = true;
        
        // Hide start screen
        document.getElementById('start-screen').classList.add('hidden');
        document.querySelector('.game-container').classList.remove('hidden');
        
        // Start YouTube video
        if (window.audioManager && window.audioManager.isReady()) {
            // Unmute and play
            if (window.player) {
                window.player.unMute();
                window.player.playVideo();
            }
        }
        
        // Fill next pieces queue
        for (let i = 0; i < 4; i++) {
            this.nextPieces.push(this.createPiece());
        }
        
        // Spawn first piece
        this.spawnPiece();
        
        // Start game loop with performance timing
        this.lastTime = 0;
        this.dropAccumulator = 0;
        
        // Use a consistent game loop timing
        this.gameLoopBound = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoopBound);
    }
    
    showControls() {
        document.getElementById('controls-modal').classList.remove('hidden');
    }
    
    hideControls() {
        document.getElementById('controls-modal').classList.add('hidden');
    }
    
    showSettings() {
        // Hide start screen when showing settings
        document.getElementById('start-screen').classList.add('hidden');
        document.querySelector('.game-container').classList.remove('hidden');
        
        // Show settings panel
        document.getElementById('settings-content').classList.remove('hidden');
    }
    
    backToMenu() {
        // Hide settings
        document.getElementById('settings-content').classList.add('hidden');
        
        // Show start screen if game hasn't started
        if (!this.gameStarted) {
            document.getElementById('start-screen').classList.remove('hidden');
            document.querySelector('.game-container').classList.add('hidden');
        }
    }
    
    createPiece() {
        const shapes = Object.keys(this.shapes);
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        
        this.piecesSpawned++;
        
        // Special rainbow piece every 7 pieces (30% chance)
        const isRainbow = this.piecesSpawned % 7 === 0 && Math.random() < 0.3;
        
        // Always randomize emoji selection for variety
        let emoji;
        if (isRainbow) {
            // Rainbow piece - will cycle through emojis
            emoji = 'rainbow';
        } else {
            // Always use random emoji selection
            // Don't repeat the last 2 emojis used
            if (!this.recentEmojis) {
                this.recentEmojis = [];
            }
            
            let availableEmojis = [];
            for (let i = 0; i < this.emojis.length; i++) {
                if (!this.recentEmojis.includes(i)) {
                    availableEmojis.push(i);
                }
            }
            
            // If we've used most emojis, reset the recent list
            // Keep more history for larger emoji sets
            const minAvailable = Math.min(10, Math.floor(this.emojis.length * 0.2));
            if (availableEmojis.length < minAvailable) {
                this.recentEmojis = [];
                availableEmojis = Array.from({length: this.emojis.length}, (_, i) => i);
            }
            
            // Pick a random emoji from available ones
            emoji = availableEmojis[Math.floor(Math.random() * availableEmojis.length)];
            
            // Debug logging
            if (this.piecesSpawned <= 5) {
                console.log(`Piece ${this.piecesSpawned}: Selected emoji index ${emoji} from ${this.emojis.length} total emojis`);
                console.log(`Available emojis: ${availableEmojis.length}, Recent: ${this.recentEmojis.length}`);
            }
            
            // Add to recent emojis and keep more history for larger sets
            this.recentEmojis.push(emoji);
            const maxRecent = Math.min(20, Math.floor(this.emojis.length * 0.3));
            if (this.recentEmojis.length > maxRecent) {
                this.recentEmojis.shift();
            }
        }
        
        return {
            shape: shape,
            matrix: this.shapes[shape],
            emoji: emoji,
            isRainbow: isRainbow,
            x: Math.floor(this.cols / 2) - Math.floor(this.shapes[shape][0].length / 2),
            y: 0
        };
    }
    
    
    spawnPiece() {
        this.currentPiece = this.nextPieces.shift();
        this.nextPieces.push(this.createPiece());
        this.canHold = true;
        
        // Check if piece can spawn
        if (this.collision(this.currentPiece)) {
            this.endGame();
        }
        
        this.drawNext();
    }
    
    collision(piece) {
        for (let y = 0; y < piece.matrix.length; y++) {
            for (let x = 0; x < piece.matrix[y].length; x++) {
                if (piece.matrix[y][x]) {
                    const boardX = piece.x + x;
                    const boardY = piece.y + y;
                    
                    if (boardX < 0 || boardX >= this.cols || 
                        boardY >= this.rows ||
                        (boardY >= 0 && this.board[boardY][boardX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    movePiece(dx, dy) {
        if (this.gameOver || this.paused) return false;
        
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
        
        if (this.collision(this.currentPiece)) {
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;
            
            if (dy > 0) {
                // Piece hit bottom
                this.lockPiece();
                return false;
            }
            return false;
        }
        
        return true;
    }
    
    rotatePiece() {
        if (this.gameOver || this.paused) return;
        
        const rotated = this.rotateMatrix(this.currentPiece.matrix);
        const previousMatrix = this.currentPiece.matrix;
        
        this.currentPiece.matrix = rotated;
        
        // Wall kick
        let kicked = false;
        if (this.collision(this.currentPiece)) {
            // Try moving left
            this.currentPiece.x--;
            if (this.collision(this.currentPiece)) {
                // Try moving right
                this.currentPiece.x += 2;
                if (this.collision(this.currentPiece)) {
                    // Revert
                    this.currentPiece.x--;
                    this.currentPiece.matrix = previousMatrix;
                } else {
                    kicked = true;
                }
            } else {
                kicked = true;
            }
        }
        
        // Vibrate on successful rotation
        if (kicked || !this.collision(this.currentPiece)) {
            this.controls.vibrate(50);
        }
    }
    
    rotateMatrix(matrix) {
        const size = matrix.length;
        const rotated = Array.from({ length: size }, () => Array(size).fill(0));
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                rotated[x][size - 1 - y] = matrix[y][x];
            }
        }
        
        return rotated;
    }
    
    holdPiece() {
        if (this.gameOver || this.paused || !this.canHold) return;
        
        const temp = this.currentPiece;
        
        if (this.heldPiece) {
            this.currentPiece = this.heldPiece;
            this.currentPiece.x = Math.floor(this.cols / 2) - Math.floor(this.currentPiece.matrix[0].length / 2);
            this.currentPiece.y = 0;
        } else {
            this.spawnPiece();
        }
        
        this.heldPiece = {
            shape: temp.shape,
            matrix: temp.matrix,
            emoji: temp.emoji,
            isRainbow: temp.isRainbow
        };
        
        this.canHold = false;
        this.drawHold();
    }
    
    hardDrop() {
        if (this.gameOver || this.paused) return;
        
        let dropDistance = 0;
        while (this.movePiece(0, 1)) {
            dropDistance++;
        }
        
        // Award points for hard drop
        this.score += dropDistance * 2;
        this.updateScore();
        
        // Vibrate on drop
        this.controls.vibrate(100);
    }
    
    startSoftDrop() {
        this.softDropping = true;
    }
    
    stopSoftDrop() {
        this.softDropping = false;
    }
    
    lockPiece() {
        // Add piece to board
        for (let y = 0; y < this.currentPiece.matrix.length; y++) {
            for (let x = 0; x < this.currentPiece.matrix[y].length; x++) {
                if (this.currentPiece.matrix[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    
                    if (boardY >= 0) {
                        // Store rainbow pieces with a special value
                        if (this.currentPiece.isRainbow) {
                            this.board[boardY][boardX] = -1; // Special rainbow indicator
                        } else {
                            this.board[boardY][boardX] = this.currentPiece.emoji + 1;
                        }
                    }
                }
            }
        }
        
        // Check for cleared lines
        const clearedLines = this.clearLines();
        
        // Spawn next piece
        this.spawnPiece();
    }
    
    clearLines() {
        const linesToClear = [];
        
        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                linesToClear.push(y);
            }
        }
        
        if (linesToClear.length > 0) {
            // Create particle effects
            this.particleSystem.createLineClearEffect(linesToClear, this.canvas.width, this.canvas.height);
            
            // Play sound effect
            this.playRandomSound();
            
            // Remove cleared lines
            linesToClear.forEach(y => {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.cols).fill(0));
            });
            
            // Update score
            this.lines += linesToClear.length;
            this.score += this.calculateLineScore(linesToClear.length);
            this.updateScore();
            
            // Level up every 10 lines
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.dropTime = Math.max(100, 1000 - (this.level - 1) * 100);
                document.getElementById('level').textContent = this.level;
            }
            
            // Vibrate based on lines cleared
            const vibrationPattern = [0, 50, 50, 100, 50, 150, 50, 200];
            this.controls.vibrate(vibrationPattern.slice(0, linesToClear.length * 2));
            
            // Play next video if cleared 2+ lines (considered a "round complete")
            if (linesToClear.length >= 2 && window.audioManager && window.audioManager.isReady()) {
                console.log(`Round complete! Cleared ${linesToClear.length} lines, playing next video`);
                window.audioManager.playNextVideo();
            }
        }
        
        return linesToClear;
    }
    
    calculateLineScore(lines) {
        const baseScores = [0, 40, 100, 300, 1200];
        return baseScores[lines] * this.level;
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lines').textContent = this.lines;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
            document.getElementById('high-score').textContent = this.highScore;
        }
    }
    
    togglePause() {
        if (this.gameOver) return;
        
        this.paused = !this.paused;
        
        if (this.paused) {
            document.getElementById('pause-modal').classList.remove('hidden');
        } else {
            document.getElementById('pause-modal').classList.add('hidden');
        }
    }
    
    setSlowMotion(duration) {
        this.slowMotionEndTime = Date.now() + duration;
    }
    
    endGame() {
        this.gameOver = true;
        
        // Show game over modal
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-level').textContent = this.level;
        document.getElementById('final-lines').textContent = this.lines;
        document.getElementById('game-over-modal').classList.remove('hidden');
        
        // Long vibration for game over
        this.controls.vibrate([0, 200, 100, 200, 100, 200]);
    }
    
    restart() {
        // Reset game state
        this.board = this.createBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.paused = false;
        this.dropTime = 1000;
        this.heldPiece = null;
        this.canHold = true;
        this.nextPieces = [];
        this.dropAccumulator = 0;
        this.lastTime = 0;
        this.piecesSpawned = 0;
        
        // Update UI
        this.updateScore();
        document.getElementById('level').textContent = this.level;
        document.getElementById('game-over-modal').classList.add('hidden');
        
        // Reset emoji tracking
        this.recentEmojis = [];
        
        // Clear canvases
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        // Reset game
        for (let i = 0; i < 4; i++) {
            this.nextPieces.push(this.createPiece());
        }
        this.spawnPiece();
        
        // Redraw
        this.draw();
        this.drawNext();
    }
    
    gameLoop(currentTime) {
        requestAnimationFrame(this.gameLoopBound);
        
        if (this.gameOver || this.paused) return;
        
        // Initialize lastTime if not set
        if (!this.lastTime) {
            this.lastTime = currentTime;
            return;
        }
        
        // Calculate delta time
        let deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Mobile fix: cap frame time to 16.67ms (60fps) to prevent timing issues
        if (this.isMobile) {
            deltaTime = Math.min(deltaTime, 16.67);
        }
        
        // Additional safety: skip frames that are too large
        if (deltaTime > 100) {
            return; // Skip this frame
        }
        
        // Apply slow motion effect
        const timeMultiplier = Date.now() < this.slowMotionEndTime ? 0.3 : 1;
        
        // Use accumulator pattern for consistent timing
        this.dropAccumulator += deltaTime * timeMultiplier;
        
        // Auto drop with fixed time step
        const dropSpeed = this.softDropping ? 50 : this.dropTime;
        
        while (this.dropAccumulator >= dropSpeed) {
            this.movePiece(0, 1);
            this.dropAccumulator -= dropSpeed;
            
            if (this.softDropping) {
                this.score += 1;
                this.updateScore();
            }
        }
        
        // Update particle system
        this.particleSystem.update();
        
        // Draw everything
        this.draw();
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= this.cols; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.blockSize, 0);
            this.ctx.lineTo(x * this.blockSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.rows; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.blockSize);
            this.ctx.lineTo(this.canvas.width, y * this.blockSize);
            this.ctx.stroke();
        }
        
        // Draw board
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.board[y][x]) {
                    if (this.board[y][x] === -1) {
                        // Rainbow block
                        this.drawBlock(x, y, 0, 1, true);
                    } else {
                        // Normal block
                        this.drawBlock(x, y, this.board[y][x] - 1);
                    }
                }
            }
        }
        
        // Draw ghost piece
        if (this.currentPiece) {
            this.drawGhost();
        }
        
        // Draw current piece
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.matrix.length; y++) {
                for (let x = 0; x < this.currentPiece.matrix[y].length; x++) {
                    if (this.currentPiece.matrix[y][x]) {
                        this.drawBlock(
                            this.currentPiece.x + x,
                            this.currentPiece.y + y,
                            this.currentPiece.emoji === 'rainbow' ? 0 : this.currentPiece.emoji,
                            1,
                            this.currentPiece.isRainbow
                        );
                    }
                }
            }
        }
    }
    
    drawGhost() {
        if (!this.currentPiece) return;
        
        const ghost = {
            ...this.currentPiece,
            y: this.currentPiece.y
        };
        
        while (!this.collision({...ghost, y: ghost.y + 1})) {
            ghost.y++;
        }
        
        // Draw ghost piece
        for (let y = 0; y < ghost.matrix.length; y++) {
            for (let x = 0; x < ghost.matrix[y].length; x++) {
                if (ghost.matrix[y][x]) {
                    this.drawBlock(
                        ghost.x + x, 
                        ghost.y + y, 
                        ghost.emoji === 'rainbow' ? 0 : ghost.emoji, 
                        0.3,
                        ghost.isRainbow
                    );
                }
            }
        }
    }
    
    drawBlock(x, y, emojiIndex, alpha = 1, isRainbow = false) {
        const blockX = x * this.blockSize;
        const blockY = y * this.blockSize;
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // Draw block background
        if (isRainbow) {
            // Rainbow gradient background
            const gradient = this.ctx.createLinearGradient(blockX, blockY, blockX + this.blockSize, blockY + this.blockSize);
            const time = Date.now() / 1000;
            const hue = ((time * 60 + x * 30 + y * 30) % 360);
            gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0.3)`);
            gradient.addColorStop(0.5, `hsla(${(hue + 60) % 360}, 100%, 50%, 0.3)`);
            gradient.addColorStop(1, `hsla(${(hue + 120) % 360}, 100%, 50%, 0.3)`);
            this.ctx.fillStyle = gradient;
        } else {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        }
        this.ctx.fillRect(blockX, blockY, this.blockSize, this.blockSize);
        
        // For rainbow pieces, cycle through emojis
        if (isRainbow) {
            const time = Date.now() / 500; // Change every 500ms
            emojiIndex = Math.floor(time + x + y) % this.emojis.length;
        }
        
        // Draw emoji or image
        if (this.emojiImages[emojiIndex]) {
            // Draw Discord emoji image
            this.ctx.drawImage(
                this.emojiImages[emojiIndex],
                blockX + 2,
                blockY + 2,
                this.blockSize - 4,
                this.blockSize - 4
            );
        } else {
            // Draw text emoji
            this.ctx.font = `${this.blockSize * 0.8}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                this.emojis[emojiIndex],
                blockX + this.blockSize / 2,
                blockY + this.blockSize / 2
            );
        }
        
        // Draw block border
        if (isRainbow) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.lineWidth = 2;
        } else {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 1;
        }
        this.ctx.strokeRect(blockX, blockY, this.blockSize, this.blockSize);
        
        this.ctx.restore();
    }
    
    drawHold() {
        // Clear the canvas completely first
        this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        // Then fill with background
        this.holdCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        if (this.heldPiece) {
            const scale = 25;
            const offsetX = (this.holdCanvas.width - this.heldPiece.matrix[0].length * scale) / 2;
            const offsetY = (this.holdCanvas.height - this.heldPiece.matrix.length * scale) / 2;
            
            for (let y = 0; y < this.heldPiece.matrix.length; y++) {
                for (let x = 0; x < this.heldPiece.matrix[y].length; x++) {
                    if (this.heldPiece.matrix[y][x]) {
                        this.holdCtx.save();
                        
                        const blockX = offsetX + x * scale;
                        const blockY = offsetY + y * scale;
                        
                        // Handle rainbow pieces
                        let emojiIndex = this.heldPiece.emoji;
                        if (this.heldPiece.isRainbow || this.heldPiece.emoji === 'rainbow') {
                            const time = Date.now() / 500; // Change every 500ms
                            emojiIndex = Math.floor(time + x + y) % this.emojis.length;
                        }
                        
                        // Draw emoji
                        if (this.emojiImages[emojiIndex]) {
                            this.holdCtx.drawImage(
                                this.emojiImages[emojiIndex],
                                blockX,
                                blockY,
                                scale,
                                scale
                            );
                        } else {
                            this.holdCtx.font = `${scale * 0.8}px Arial`;
                            this.holdCtx.textAlign = 'center';
                            this.holdCtx.textBaseline = 'middle';
                            this.holdCtx.fillText(
                                this.emojis[emojiIndex],
                                blockX + scale / 2,
                                blockY + scale / 2
                            );
                        }
                        
                        this.holdCtx.restore();
                    }
                }
            }
        }
    }
    
    drawNext() {
        // Clear the canvas completely first
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        // Then fill with background
        this.nextCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        const scale = 25;
        let yOffset = 10;
        
        for (let i = 0; i < 3; i++) {
            const piece = this.nextPieces[i];
            if (!piece) continue;
            
            const offsetX = (this.nextCanvas.width - piece.matrix[0].length * scale) / 2;
            
            for (let y = 0; y < piece.matrix.length; y++) {
                for (let x = 0; x < piece.matrix[y].length; x++) {
                    if (piece.matrix[y][x]) {
                        this.nextCtx.save();
                        
                        const blockX = offsetX + x * scale;
                        const blockY = yOffset + y * scale;
                        
                        // Handle rainbow pieces
                        let emojiIndex = piece.emoji;
                        if (piece.isRainbow || piece.emoji === 'rainbow') {
                            const time = Date.now() / 500; // Change every 500ms
                            emojiIndex = Math.floor(time + x + y) % this.emojis.length;
                        }
                        
                        // Draw emoji
                        if (this.emojiImages[emojiIndex]) {
                            this.nextCtx.drawImage(
                                this.emojiImages[emojiIndex],
                                blockX,
                                blockY,
                                scale,
                                scale
                            );
                        } else {
                            this.nextCtx.font = `${scale * 0.8}px Arial`;
                            this.nextCtx.textAlign = 'center';
                            this.nextCtx.textBaseline = 'middle';
                            this.nextCtx.fillText(
                                this.emojis[emojiIndex],
                                blockX + scale / 2,
                                blockY + scale / 2
                            );
                        }
                        
                        this.nextCtx.restore();
                    }
                }
            }
            
            yOffset += piece.matrix.length * scale + 20;
        }
    }
}

// Start game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EmojiTetris();
});