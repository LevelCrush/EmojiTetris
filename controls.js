// Multi-input control system
class Controls {
    constructor(game) {
        this.game = game;
        this.keys = {};
        this.touches = [];
        this.gamepadIndex = null;
        this.lastGamepadState = {};
        
        // Double tap tracking for mobile
        this.lastDownTap = 0;
        this.doubleTapDelay = 300; // milliseconds
        
        // Control mappings
        this.keyMap = {
            ArrowLeft: 'left',
            ArrowRight: 'right',
            ArrowDown: 'down',
            ArrowUp: 'rotate',
            ' ': 'rotate',
            Shift: 'hold',
            p: 'pause',
            P: 'pause',
            g: 'debugGif',
            G: 'debugGif'
        };
        
        // Touch zones
        this.touchZones = {
            left: { x: 0, y: 0, width: 0.33, height: 1 },
            right: { x: 0.67, y: 0, width: 0.33, height: 1 },
            rotate: { x: 0.33, y: 0, width: 0.34, height: 0.5 },
            down: { x: 0.33, y: 0.5, width: 0.34, height: 0.5 }
        };
        
        // Auto-repeat settings
        this.autoRepeat = {
            left: { timer: null, delay: 100, initial: 200 },
            right: { timer: null, delay: 100, initial: 200 },
            down: { timer: null, delay: 50, initial: 100 }
        };
        
        this.init();
    }
    
    init() {
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Touch events - removed for mobile to use button controls only
        
        // Mouse events
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
            canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
            canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        }
        
        // Mobile control buttons (both regular and small)
        document.querySelectorAll('.control-btn, .control-btn-small, .rotate-btn').forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Check for double tap on down button
                if (btn.dataset.action === 'down') {
                    const now = Date.now();
                    if (now - this.lastDownTap < this.doubleTapDelay) {
                        // Double tap detected - hard drop
                        this.performAction('hardDrop', true);
                        this.vibrate(25);
                        this.lastDownTap = 0; // Reset
                        return;
                    }
                    this.lastDownTap = now;
                }
                
                this.handleMobileButton(btn.dataset.action, true);
                // Add haptic feedback
                this.vibrate(10);
            });
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleMobileButton(btn.dataset.action, false);
            });
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                
                // Check for double click on down button
                if (btn.dataset.action === 'down') {
                    const now = Date.now();
                    if (now - this.lastDownTap < this.doubleTapDelay) {
                        // Double click detected - hard drop
                        this.performAction('hardDrop', true);
                        this.lastDownTap = 0; // Reset
                        return;
                    }
                    this.lastDownTap = now;
                }
                
                this.handleMobileButton(btn.dataset.action, true);
            });
            btn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.handleMobileButton(btn.dataset.action, false);
            });
        });
        
        // Gamepad support
        window.addEventListener('gamepadconnected', this.handleGamepadConnected.bind(this));
        window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected.bind(this));
        
        // Check for gamepads periodically
        setInterval(this.pollGamepad.bind(this), 16); // 60fps
        
        // Detect mobile
        this.detectMobile();
    }
    
    detectMobile() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            // Controls are always visible on mobile now
            const controls = document.getElementById('mobile-controls');
            
            // Prevent touches on mobile controls from affecting game
            controls.addEventListener('touchstart', (e) => {
                if (e.target !== document.getElementById('game-canvas')) {
                    e.stopPropagation();
                }
            });
            controls.addEventListener('touchmove', (e) => {
                if (e.target !== document.getElementById('game-canvas')) {
                    e.stopPropagation();
                }
            });
            controls.addEventListener('touchend', (e) => {
                if (e.target !== document.getElementById('game-canvas')) {
                    e.stopPropagation();
                }
            });
        }
    }
    
    // Keyboard handling
    handleKeyDown(e) {
        if (this.keys[e.key]) return; // Prevent repeat
        
        this.keys[e.key] = true;
        const action = this.keyMap[e.key];
        
        if (action) {
            e.preventDefault();
            this.performAction(action, true);
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.key] = false;
        const action = this.keyMap[e.key];
        
        if (action) {
            e.preventDefault();
            this.performAction(action, false);
        }
    }
    
    // Touch handling - removed, using button controls only on mobile
    handleTouchStart(e) {
        // Disabled - using button controls
    }
    
    handleTouchMove(e) {
        // Disabled - using button controls
    }
    
    handleTouchEnd(e) {
        // Disabled - using button controls
    }
    
    getTouchAction(x, y) {
        for (let [action, zone] of Object.entries(this.touchZones)) {
            if (x >= zone.x && x < zone.x + zone.width &&
                y >= zone.y && y < zone.y + zone.height) {
                return action;
            }
        }
        return null;
    }
    
    checkSwipeGesture(touchData) {
        const dx = touchData.currentX - touchData.startX;
        const dy = touchData.currentY - touchData.startY;
        const threshold = 0.15; // 15% of screen width/height
        const moveThreshold = 0.05; // 5% threshold for movement
        
        // Only process swipes that exceed the threshold
        if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal swipe
                if (dx > 0 && !touchData.swipedRight) {
                    this.performAction('right', true);
                    setTimeout(() => this.performAction('right', false), 100);
                    touchData.swipedRight = true;
                    touchData.swipedLeft = false;
                } else if (dx < 0 && !touchData.swipedLeft) {
                    this.performAction('left', true);
                    setTimeout(() => this.performAction('left', false), 100);
                    touchData.swipedLeft = true;
                    touchData.swipedRight = false;
                }
            } else {
                // Vertical swipe
                if (dy > 0 && !touchData.swipedDown) {
                    this.performAction('softDrop', true);
                    touchData.swipedDown = true;
                } else if (dy < 0 && !touchData.swipedUp) {
                    this.performAction('hardDrop', true);
                    touchData.swipedUp = true;
                    // Stop soft drop if it was active
                    this.performAction('softDrop', false);
                }
            }
        } else if (Math.abs(dy) < moveThreshold && touchData.swipedDown) {
            // Stop soft drop when returning to neutral position
            this.performAction('softDrop', false);
            touchData.swipedDown = false;
        }
    }
    
    // Mouse handling
    handleMouseDown(e) {
        const rect = e.target.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        
        const action = this.getTouchAction(x, y);
        if (action) {
            this.performAction(action, true);
        }
    }
    
    handleMouseUp(e) {
        // Stop all mouse-initiated actions
        ['left', 'right', 'down', 'rotate'].forEach(action => {
            this.performAction(action, false);
        });
    }
    
    handleMouseMove(e) {
        // Could implement mouse hover effects here
    }
    
    // Mobile button handling
    handleMobileButton(action, pressed) {
        this.performAction(action, pressed);
    }
    
    // Gamepad handling
    handleGamepadConnected(e) {
        console.log('Gamepad connected:', e.gamepad.id);
        this.gamepadIndex = e.gamepad.index;
        
        // Vibrate to confirm connection
        if (e.gamepad.vibrationActuator) {
            e.gamepad.vibrationActuator.playEffect('dual-rumble', {
                duration: 200,
                weakMagnitude: 0.5,
                strongMagnitude: 0.5
            });
        }
    }
    
    handleGamepadDisconnected(e) {
        if (this.gamepadIndex === e.gamepad.index) {
            this.gamepadIndex = null;
        }
    }
    
    pollGamepad() {
        if (this.gamepadIndex === null) return;
        
        const gamepad = navigator.getGamepads()[this.gamepadIndex];
        if (!gamepad) return;
        
        // D-pad or left stick for movement
        const left = gamepad.buttons[14]?.pressed || gamepad.axes[0] < -0.5;
        const right = gamepad.buttons[15]?.pressed || gamepad.axes[0] > 0.5;
        const down = gamepad.buttons[13]?.pressed || gamepad.axes[1] > 0.5;
        
        // A button for rotate
        const rotate = gamepad.buttons[0]?.pressed;
        
        // B button for hold
        const hold = gamepad.buttons[1]?.pressed;
        
        // Start for pause
        const pause = gamepad.buttons[9]?.pressed;
        
        // Check for state changes
        this.checkGamepadButton('left', left);
        this.checkGamepadButton('right', right);
        this.checkGamepadButton('down', down);
        this.checkGamepadButton('rotate', rotate);
        this.checkGamepadButton('hold', hold);
        this.checkGamepadButton('pause', pause);
    }
    
    checkGamepadButton(action, pressed) {
        if (pressed !== this.lastGamepadState[action]) {
            this.lastGamepadState[action] = pressed;
            this.performAction(action, pressed);
        }
    }
    
    // Action handling
    performAction(action, pressed) {
        if (!this.game) return;
        
        if (pressed) {
            switch (action) {
                case 'left':
                    this.game.movePiece(-1, 0);
                    this.startAutoRepeat('left', () => this.game.movePiece(-1, 0));
                    this.vibrate(5);
                    break;
                case 'right':
                    this.game.movePiece(1, 0);
                    this.startAutoRepeat('right', () => this.game.movePiece(1, 0));
                    this.vibrate(5);
                    break;
                case 'down':
                    this.game.movePiece(0, 1);
                    this.startAutoRepeat('down', () => this.game.movePiece(0, 1));
                    this.vibrate(5);
                    break;
                case 'rotate':
                    this.game.rotatePiece();
                    this.vibrate(10);
                    break;
                case 'hold':
                    this.game.holdPiece();
                    this.vibrate(15);
                    break;
                case 'pause':
                    this.game.togglePause();
                    this.vibrate(20);
                    break;
                case 'hardDrop':
                    this.game.hardDrop();
                    this.vibrate(25);
                    break;
                case 'softDrop':
                    this.game.startSoftDrop();
                    this.vibrate(5);
                    break;
                case 'drop':
                    this.game.hardDrop();
                    this.vibrate(25);
                    break;
                case 'debugGif':
                    this.game.debugAnimatedEmojis();
                    break;
            }
        } else {
            // Stop auto-repeat
            switch (action) {
                case 'left':
                case 'right':
                case 'down':
                    this.stopAutoRepeat(action);
                    break;
                case 'softDrop':
                    this.game.stopSoftDrop();
                    break;
            }
        }
    }
    
    startAutoRepeat(action, callback) {
        this.stopAutoRepeat(action);
        
        const config = this.autoRepeat[action];
        if (!config) return;
        
        // Initial delay
        config.timer = setTimeout(() => {
            callback();
            // Repeat delay
            config.timer = setInterval(callback, config.delay);
        }, config.initial);
    }
    
    stopAutoRepeat(action) {
        const config = this.autoRepeat[action];
        if (config && config.timer) {
            clearTimeout(config.timer);
            clearInterval(config.timer);
            config.timer = null;
        }
    }
    
    // Vibration feedback for mobile
    vibrate(pattern) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
}

// Export for use in game
window.Controls = Controls;