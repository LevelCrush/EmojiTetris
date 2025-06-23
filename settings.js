// Settings Manager for persistent configuration
class SettingsManager {
    constructor() {
        this.settings = {
            youtubeVolume: 50,
            youtubeMuted: false,
            effectsVolume: 50,
            effectsMuted: false,
            youtubeUrl: '',
            highScore: 0,
            overlayBrightness: 75
        };
        
        this.listeners = {};
        this.loadSettings();
    }
    
    // Load settings from localStorage
    loadSettings() {
        const saved = localStorage.getItem('emojiTetrisSettings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
            } catch (e) {
                console.error('Failed to load settings:', e);
            }
        }
        
        // Load high score separately for backwards compatibility
        const highScore = localStorage.getItem('highScore');
        if (highScore) {
            this.settings.highScore = parseInt(highScore) || 0;
        }
    }
    
    // Save settings to localStorage
    saveSettings() {
        try {
            localStorage.setItem('emojiTetrisSettings', JSON.stringify(this.settings));
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    }
    
    // Get a setting value
    get(key) {
        return this.settings[key];
    }
    
    // Set a setting value
    set(key, value) {
        const oldValue = this.settings[key];
        this.settings[key] = value;
        this.saveSettings();
        
        // Notify listeners
        if (this.listeners[key]) {
            this.listeners[key].forEach(callback => {
                callback(value, oldValue);
            });
        }
    }
    
    // Subscribe to setting changes
    on(key, callback) {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key].push(callback);
    }
    
    // Unsubscribe from setting changes
    off(key, callback) {
        if (this.listeners[key]) {
            this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
        }
    }
    
    // Apply settings to UI
    applyToUI() {
        // YouTube volume
        const youtubeSlider = document.getElementById('youtube-volume-slider');
        const youtubeDisplay = document.getElementById('youtube-volume-display');
        const youtubeMuteBtn = document.getElementById('youtube-mute-toggle');
        
        if (youtubeSlider) {
            youtubeSlider.value = this.settings.youtubeVolume;
            youtubeDisplay.textContent = `${this.settings.youtubeVolume}%`;
            youtubeMuteBtn.textContent = this.settings.youtubeMuted ? '🔇' : '🔊';
        }
        
        // Effects volume
        const effectsSlider = document.getElementById('effects-volume-slider');
        const effectsDisplay = document.getElementById('effects-volume-display');
        const effectsMuteBtn = document.getElementById('effects-mute-toggle');
        
        if (effectsSlider) {
            effectsSlider.value = this.settings.effectsVolume;
            effectsDisplay.textContent = `${this.settings.effectsVolume}%`;
            effectsMuteBtn.textContent = this.settings.effectsMuted ? '🔇' : '🔊';
        }
        
        // YouTube URL
        const youtubeInput = document.getElementById('youtube-url');
        if (youtubeInput && this.settings.youtubeUrl) {
            youtubeInput.value = this.settings.youtubeUrl;
        }
        
        // Overlay brightness
        const overlaySlider = document.getElementById('overlay-brightness-slider');
        const overlayDisplay = document.getElementById('overlay-brightness-display');
        
        if (overlaySlider) {
            overlaySlider.value = this.settings.overlayBrightness;
            overlayDisplay.textContent = `${this.settings.overlayBrightness}%`;
            this.updateOverlayBrightness(this.settings.overlayBrightness);
        }
    }
    
    // Update the video overlay brightness
    updateOverlayBrightness(brightness) {
        const overlay = document.querySelector('.video-overlay');
        if (overlay) {
            // Convert brightness percentage to opacity (inverse relationship)
            // 0% brightness = 1 opacity (darkest), 100% brightness = 0 opacity (brightest)
            const opacity = brightness / 100;
            overlay.style.background = `rgba(0, 0, 0, ${opacity})`;
        }
    }
    
    // Initialize UI event listeners
    initializeUI() {
        // YouTube volume controls
        const youtubeSlider = document.getElementById('youtube-volume-slider');
        const youtubeDisplay = document.getElementById('youtube-volume-display');
        const youtubeMuteBtn = document.getElementById('youtube-mute-toggle');
        
        if (youtubeSlider) {
            youtubeSlider.addEventListener('input', (e) => {
                const volume = parseInt(e.target.value);
                this.set('youtubeVolume', volume);
                youtubeDisplay.textContent = `${volume}%`;
                
                // Update YouTube player
                if (window.audioManager) {
                    window.audioManager.setVolume(volume);
                }
            });
        }
        
        if (youtubeMuteBtn) {
            youtubeMuteBtn.addEventListener('click', () => {
                const muted = !this.settings.youtubeMuted;
                this.set('youtubeMuted', muted);
                youtubeMuteBtn.textContent = muted ? '🔇' : '🔊';
                
                // Update YouTube player
                if (window.audioManager) {
                    window.audioManager.setMuted(muted);
                }
            });
        }
        
        // Effects volume controls
        const effectsSlider = document.getElementById('effects-volume-slider');
        const effectsDisplay = document.getElementById('effects-volume-display');
        const effectsMuteBtn = document.getElementById('effects-mute-toggle');
        
        if (effectsSlider) {
            effectsSlider.addEventListener('input', (e) => {
                const volume = parseInt(e.target.value);
                this.set('effectsVolume', volume);
                effectsDisplay.textContent = `${volume}%`;
            });
        }
        
        if (effectsMuteBtn) {
            effectsMuteBtn.addEventListener('click', () => {
                const muted = !this.settings.effectsMuted;
                this.set('effectsMuted', muted);
                effectsMuteBtn.textContent = muted ? '🔇' : '🔊';
            });
        }
        
        // Overlay brightness controls
        const overlaySlider = document.getElementById('overlay-brightness-slider');
        const overlayDisplay = document.getElementById('overlay-brightness-display');
        const overlayDecreaseBtn = document.getElementById('overlay-brightness-decrease');
        
        if (overlaySlider) {
            overlaySlider.addEventListener('input', (e) => {
                const brightness = parseInt(e.target.value);
                this.set('overlayBrightness', brightness);
                overlayDisplay.textContent = `${brightness}%`;
                this.updateOverlayBrightness(brightness);
            });
        }
        
        if (overlayDecreaseBtn) {
            overlayDecreaseBtn.addEventListener('click', () => {
                // Toggle between preset brightness levels
                const currentBrightness = this.settings.overlayBrightness;
                let newBrightness;
                
                if (currentBrightness >= 75) {
                    newBrightness = 50;
                } else if (currentBrightness >= 50) {
                    newBrightness = 25;
                } else if (currentBrightness >= 25) {
                    newBrightness = 0;
                } else {
                    newBrightness = 100;
                }
                
                this.set('overlayBrightness', newBrightness);
                overlaySlider.value = newBrightness;
                overlayDisplay.textContent = `${newBrightness}%`;
                this.updateOverlayBrightness(newBrightness);
            });
        }
        
        // Apply saved settings to UI
        this.applyToUI();
    }
}

// Create global settings instance
window.settingsManager = new SettingsManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager.initializeUI();
});