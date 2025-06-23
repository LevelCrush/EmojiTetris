// Sound Volume Management UI
class SoundVolumeManager {
    constructor() {
        this.sounds = [];
        this.selectedSounds = new Set();
        this.searchInput = null;
        this.autocompleteEl = null;
        this.volumesListEl = null;
        this.selectedIndex = -1;
        
        // Audio context for volume amplification
        this.audioContext = null;
        this.gainNodes = new Map();
    }
    
    init() {
        this.searchInput = document.getElementById('sound-search');
        this.autocompleteEl = document.getElementById('sound-autocomplete');
        this.volumesListEl = document.getElementById('sound-volumes-list');
        
        if (!this.searchInput || !this.autocompleteEl || !this.volumesListEl) {
            return;
        }
        
        // Load sounds from game
        this.loadSounds();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize audio context
        this.initAudioContext();
        
        // Load and display existing volume settings
        this.loadExistingVolumes();
    }
    
    initAudioContext() {
        // Create audio context on first user interaction
        const createContext = () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        };
        
        document.addEventListener('click', createContext, { once: true });
        document.addEventListener('touchstart', createContext, { once: true });
    }
    
    loadSounds() {
        // Get sounds from the game instance
        if (window.game && window.game.sounds && window.game.sounds.length > 0) {
            this.sounds = window.game.sounds.map((sound, index) => ({
                name: sound.name || `Sound ${index + 1}`,
                index: sound.index !== undefined ? sound.index : index
            }));
            console.log(`Loaded ${this.sounds.length} sounds for volume control`);
        } else {
            console.log('No sounds loaded yet, will retry...');
            // Retry after a short delay if sounds aren't loaded yet
            setTimeout(() => {
                if (window.game && window.game.sounds && window.game.sounds.length > 0) {
                    this.sounds = window.game.sounds.map((sound, index) => ({
                        name: sound.name || `Sound ${index + 1}`,
                        index: sound.index !== undefined ? sound.index : index
                    }));
                    console.log(`Loaded ${this.sounds.length} sounds for volume control (on retry)`);
                    this.loadExistingVolumes();
                }
            }, 500);
        }
    }
    
    setupEventListeners() {
        // Search input
        this.searchInput.addEventListener('input', this.debounce(() => {
            this.updateAutocomplete();
        }, 300));
        
        this.searchInput.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value) {
                this.updateAutocomplete();
            }
        });
        
        this.searchInput.addEventListener('blur', () => {
            // Delay hiding to allow clicking on items
            setTimeout(() => {
                this.hideAutocomplete();
            }, 200);
        });
        
        // Reset all button
        const resetBtn = document.getElementById('reset-all-volumes');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Reset all sound volumes to 100%?')) {
                    window.settingsManager.resetAllSoundVolumes();
                    this.selectedSounds.clear();
                    this.volumesListEl.innerHTML = '';
                    this.loadExistingVolumes();
                }
            });
        }
    }
    
    loadExistingVolumes() {
        const soundVolumes = window.settingsManager.get('soundVolumes') || {};
        
        Object.entries(soundVolumes).forEach(([soundName, volume]) => {
            if (volume !== 100) { // Only show non-default volumes
                const sound = this.sounds.find(s => s.name === soundName);
                if (sound) {
                    this.selectedSounds.add(soundName);
                    this.addSoundVolumeControl(sound);
                }
            }
        });
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    updateAutocomplete() {
        const query = this.searchInput.value.toLowerCase().trim();
        
        if (!query) {
            this.hideAutocomplete();
            return;
        }
        
        // Fuzzy search
        const matches = this.sounds
            .filter(sound => !this.selectedSounds.has(sound.name))
            .map(sound => ({
                ...sound,
                score: this.fuzzyScore(sound.name.toLowerCase(), query)
            }))
            .filter(sound => sound.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);
        
        if (matches.length === 0) {
            this.hideAutocomplete();
            return;
        }
        
        this.showAutocomplete(matches);
    }
    
    fuzzyScore(str, query) {
        let score = 0;
        let lastIndex = -1;
        
        for (const char of query) {
            const index = str.indexOf(char, lastIndex + 1);
            if (index === -1) return 0;
            
            // Award points based on position
            score += (index === lastIndex + 1) ? 10 : 1;
            
            // Bonus for matching at start
            if (lastIndex === -1 && index === 0) score += 20;
            
            lastIndex = index;
        }
        
        return score;
    }
    
    showAutocomplete(matches) {
        this.autocompleteEl.innerHTML = '';
        this.selectedIndex = -1;
        
        matches.forEach((match, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.innerHTML = `
                <span>${this.highlightMatch(match.name, this.searchInput.value)}</span>
                <span style="color: #888; font-size: 12px;">🔊</span>
            `;
            
            item.addEventListener('click', () => {
                this.selectSound(match);
            });
            
            item.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                this.updateSelectedItem();
            });
            
            this.autocompleteEl.appendChild(item);
        });
        
        this.autocompleteEl.classList.remove('hidden');
    }
    
    highlightMatch(text, query) {
        const regex = new RegExp(`(${query.split('').join('.*?')})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }
    
    hideAutocomplete() {
        this.autocompleteEl.classList.add('hidden');
        this.selectedIndex = -1;
    }
    
    handleKeyDown(e) {
        const items = this.autocompleteEl.querySelectorAll('.autocomplete-item');
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
                this.updateSelectedItem();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelectedItem();
                break;
                
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                    items[this.selectedIndex].click();
                }
                break;
                
            case 'Escape':
                this.hideAutocomplete();
                this.searchInput.blur();
                break;
        }
    }
    
    updateSelectedItem() {
        const items = this.autocompleteEl.querySelectorAll('.autocomplete-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedIndex);
        });
    }
    
    selectSound(sound) {
        this.selectedSounds.add(sound.name);
        this.addSoundVolumeControl(sound);
        this.searchInput.value = '';
        this.hideAutocomplete();
    }
    
    addSoundVolumeControl(sound) {
        const volume = window.settingsManager.getSoundVolume(sound.name);
        
        const item = document.createElement('div');
        item.className = 'sound-volume-item';
        item.dataset.soundName = sound.name;
        
        item.innerHTML = `
            <div class="sound-volume-header">
                <span class="sound-name">${sound.name}</span>
                <div class="sound-controls">
                    <button class="preview-btn">▶️ Preview</button>
                    <button class="remove-btn">✖</button>
                </div>
            </div>
            <div class="sound-volume-slider-container">
                <input type="range" class="sound-volume-slider" min="0" max="200" value="${volume}">
                <span class="sound-volume-display">${volume}%</span>
            </div>
        `;
        
        // Add event listeners
        const slider = item.querySelector('.sound-volume-slider');
        const display = item.querySelector('.sound-volume-display');
        const previewBtn = item.querySelector('.preview-btn');
        const removeBtn = item.querySelector('.remove-btn');
        
        slider.addEventListener('input', (e) => {
            const newVolume = parseInt(e.target.value);
            display.textContent = `${newVolume}%`;
            display.style.color = this.getVolumeColor(newVolume);
            window.settingsManager.setSoundVolume(sound.name, newVolume);
        });
        
        previewBtn.addEventListener('click', () => {
            this.previewSound(sound);
        });
        
        removeBtn.addEventListener('click', () => {
            this.removeSound(sound.name);
        });
        
        // Set initial color
        display.style.color = this.getVolumeColor(volume);
        
        this.volumesListEl.appendChild(item);
    }
    
    getVolumeColor(volume) {
        if (volume === 0) return '#f44336';
        if (volume <= 50) return '#ff9800';
        if (volume <= 100) return '#4caf50';
        if (volume <= 150) return '#2196f3';
        return '#9c27b0';
    }
    
    removeSound(soundName) {
        this.selectedSounds.delete(soundName);
        window.settingsManager.setSoundVolume(soundName, 100); // Reset to default
        
        const item = this.volumesListEl.querySelector(`[data-sound-name="${soundName}"]`);
        if (item) {
            item.remove();
        }
    }
    
    previewSound(sound) {
        if (!window.game || !window.game.soundAudios[sound.index]) {
            return;
        }
        
        const soundData = window.game.soundAudios[sound.index];
        if (soundData && soundData.audio) {
            const audio = soundData.audio.cloneNode();
            
            // Apply volumes
            const globalVolume = window.settingsManager.get('effectsVolume') / 100;
            const soundVolume = window.settingsManager.getSoundVolume(sound.name) / 100;
            
            // For volumes > 1 (over 100%), use Web Audio API
            if (soundVolume > 1 && this.audioContext) {
                try {
                    const source = this.audioContext.createMediaElementSource(audio);
                    const gainNode = this.audioContext.createGain();
                    
                    gainNode.gain.value = globalVolume * soundVolume;
                    source.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    audio.play().catch(e => console.log('Preview failed:', e));
                } catch (e) {
                    // Fallback to normal playback
                    audio.volume = Math.min(1, globalVolume * soundVolume);
                    audio.play().catch(e => console.log('Preview failed:', e));
                }
            } else {
                audio.volume = Math.min(1, globalVolume * soundVolume);
                audio.play().catch(e => console.log('Preview failed:', e));
            }
        }
    }
}

// Initialize when settings modal is opened
let soundVolumeManager = null;

document.addEventListener('DOMContentLoaded', () => {
    const settingsBtn = document.getElementById('settings-btn');
    const showSettingsBtn = document.querySelector('.menu-btn[data-action="settings"]');
    
    const initSoundVolumes = () => {
        // Initialize sound volume manager on first settings open
        if (!soundVolumeManager) {
            soundVolumeManager = new SoundVolumeManager();
            setTimeout(() => {
                soundVolumeManager.init();
            }, 100); // Small delay to ensure game is loaded
        } else {
            // Reload sounds in case they changed
            soundVolumeManager.loadSounds();
        }
    };
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', initSoundVolumes);
    }
    
    if (showSettingsBtn) {
        showSettingsBtn.addEventListener('click', initSoundVolumes);
    }
});

// Export for global access
window.SoundVolumeManager = SoundVolumeManager;