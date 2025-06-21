// Particle System for line clear effects
class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || (Math.random() - 0.5) * 10;
        this.vy = options.vy || (Math.random() - 0.5) * 10;
        this.gravity = options.gravity || 0.3;
        this.friction = options.friction || 0.99;
        this.size = options.size || Math.random() * 5 + 2;
        this.color = options.color || this.randomColor();
        this.alpha = 1;
        this.decay = options.decay || 0.01;
        this.trail = options.trail || false;
        this.trailPositions = [];
        this.emoji = options.emoji || null;
        this.rotation = options.rotation || 0;
        this.rotationSpeed = options.rotationSpeed || (Math.random() - 0.5) * 0.2;
    }
    
    randomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
            '#48DBFB', '#0ABDE3', '#FD79A8', '#FDCB6E', '#6C5CE7',
            '#A29BFE', '#74B9FF', '#A0E7E5', '#FFBE76', '#FF7979'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    update() {
        // Store trail positions
        if (this.trail) {
            this.trailPositions.push({ x: this.x, y: this.y, alpha: this.alpha });
            if (this.trailPositions.length > 10) {
                this.trailPositions.shift();
            }
        }
        
        // Update position
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        
        // Update rotation
        this.rotation += this.rotationSpeed;
        
        // Fade out
        this.alpha -= this.decay;
        
        return this.alpha > 0;
    }
    
    draw(ctx) {
        ctx.save();
        
        // Draw trail
        if (this.trail && this.trailPositions.length > 0) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.size / 2;
            ctx.beginPath();
            this.trailPositions.forEach((pos, i) => {
                ctx.globalAlpha = pos.alpha * (i / this.trailPositions.length) * 0.5;
                if (i === 0) {
                    ctx.moveTo(pos.x, pos.y);
                } else {
                    ctx.lineTo(pos.x, pos.y);
                }
            });
            ctx.stroke();
        }
        
        // Draw particle
        ctx.globalAlpha = this.alpha;
        
        if (this.emoji) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.font = `${this.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.emoji, 0, 0);
            ctx.restore();
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class FireworkParticle extends Particle {
    constructor(x, y, options = {}) {
        super(x, y, {
            ...options,
            vx: Math.cos(options.angle) * options.speed,
            vy: Math.sin(options.angle) * options.speed,
            gravity: 0.1,
            decay: 0.015,
            trail: true
        });
    }
}

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.shakeIntensity = 0;
        this.shakeDecay = 0.9;
    }
    
    update() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply screen shake
        if (this.shakeIntensity > 0.1) {
            this.ctx.save();
            const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.translate(shakeX, shakeY);
        }
        
        // Update and draw particles
        this.particles = this.particles.filter(particle => {
            const alive = particle.update();
            if (alive) {
                particle.draw(this.ctx);
            }
            return alive;
        });
        
        // Restore canvas state
        if (this.shakeIntensity > 0.1) {
            this.ctx.restore();
            this.shakeIntensity *= this.shakeDecay;
        }
    }
    
    // Single line clear - Simple sparkles
    singleLineClear(y, width) {
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const x = Math.random() * width;
            this.particles.push(new Particle(x, y, {
                vx: (Math.random() - 0.5) * 5,
                vy: -Math.random() * 5 - 2,
                size: Math.random() * 3 + 1,
                decay: 0.02,
                gravity: 0.2
            }));
        }
    }
    
    // Double line clear - Fireworks with trails
    doubleLineClear(y1, y2, width) {
        const centerY = (y1 + y2) / 2;
        
        // Create two firework bursts
        for (let burst = 0; burst < 2; burst++) {
            const burstX = (burst + 1) * width / 3;
            const particleCount = 30;
            
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount;
                const speed = Math.random() * 5 + 3;
                
                this.particles.push(new FireworkParticle(burstX, centerY, {
                    angle: angle,
                    speed: speed,
                    color: this.getFireworkColor(burst)
                }));
            }
        }
        
        this.shakeIntensity = 5;
    }
    
    // Triple line clear - Rainbow explosion
    tripleLineClear(lines, width) {
        const centerY = lines.reduce((sum, y) => sum + y, 0) / lines.length;
        const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
        
        // Create rainbow burst
        for (let ring = 0; ring < 3; ring++) {
            const particleCount = 40;
            const radius = ring * 20;
            
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount;
                const speed = 8 - ring * 2;
                const colorIndex = Math.floor((i / particleCount) * colors.length);
                
                this.particles.push(new FireworkParticle(width / 2, centerY, {
                    angle: angle,
                    speed: speed,
                    color: colors[colorIndex],
                    size: 5 - ring,
                    decay: 0.01 + ring * 0.005
                }));
            }
        }
        
        // Add emoji particles
        const emojis = ['✨', '🌟', '💫', '⭐', '🌈'];
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(width / 2, centerY, {
                vx: (Math.random() - 0.5) * 10,
                vy: -Math.random() * 10,
                emoji: emojis[Math.floor(Math.random() * emojis.length)],
                size: 20,
                decay: 0.015,
                gravity: 0.3
            }));
        }
        
        this.shakeIntensity = 10;
    }
    
    // Tetris (4 lines) - Epic multi-layered effect
    tetrisClear(lines, width, height) {
        const centerY = height / 2;
        
        // Screen-wide explosion
        for (let wave = 0; wave < 4; wave++) {
            setTimeout(() => {
                // Create multiple burst points
                for (let burst = 0; burst < 5; burst++) {
                    const burstX = (burst + 0.5) * width / 5;
                    const burstY = centerY + (Math.random() - 0.5) * 100;
                    const particleCount = 50;
                    
                    for (let i = 0; i < particleCount; i++) {
                        const angle = (Math.PI * 2 * i) / particleCount + wave * 0.5;
                        const speed = Math.random() * 10 + 5;
                        
                        this.particles.push(new FireworkParticle(burstX, burstY, {
                            angle: angle,
                            speed: speed,
                            size: Math.random() * 5 + 3,
                            decay: 0.008,
                            color: this.getEpicColor(wave, i)
                        }));
                    }
                }
                
                // Add emoji rain
                const epicEmojis = ['🎆', '🎇', '✨', '🌟', '💥', '🎉', '🎊'];
                for (let i = 0; i < 20; i++) {
                    this.particles.push(new Particle(Math.random() * width, -20, {
                        vx: (Math.random() - 0.5) * 2,
                        vy: Math.random() * 5 + 2,
                        emoji: epicEmojis[Math.floor(Math.random() * epicEmojis.length)],
                        size: 30,
                        decay: 0.005,
                        gravity: 0.1,
                        rotationSpeed: (Math.random() - 0.5) * 0.3
                    }));
                }
            }, wave * 100);
        }
        
        // Maximum screen shake
        this.shakeIntensity = 20;
        
        // Slow motion effect
        this.createSlowMotionEffect();
    }
    
    getFireworkColor(index) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FECA57', '#48DBFB'];
        return colors[index % colors.length];
    }
    
    getEpicColor(wave, index) {
        const hue = (wave * 90 + index * 10) % 360;
        return `hsl(${hue}, 100%, 60%)`;
    }
    
    createSlowMotionEffect() {
        // This would be implemented in the game logic
        // to temporarily slow down the game speed
        if (window.gameInstance) {
            window.gameInstance.setSlowMotion(1000); // 1 second of slow motion
        }
    }
    
    // Create particles for any line clear
    createLineClearEffect(clearedLines, boardWidth, boardHeight) {
        const count = clearedLines.length;
        
        switch (count) {
            case 1:
                this.singleLineClear(clearedLines[0] * 30, boardWidth);
                break;
            case 2:
                this.doubleLineClear(clearedLines[0] * 30, clearedLines[1] * 30, boardWidth);
                break;
            case 3:
                this.tripleLineClear(clearedLines.map(y => y * 30), boardWidth);
                break;
            case 4:
                this.tetrisClear(clearedLines.map(y => y * 30), boardWidth, boardHeight);
                break;
        }
    }
}

// Export for use in game
window.ParticleSystem = ParticleSystem;