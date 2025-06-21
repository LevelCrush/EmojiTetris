// YouTube Player Management
let player;
let isPlayerReady = false;
let currentVolume = 50;
let isMuted = false;

// Default playlists
const DEFAULT_PLAYLISTS = {
    tetris: 'PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG',
    gaming: 'PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI'
};

// Initialize YouTube Player
function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1,
            mute: 1, // Start muted for autoplay
            loop: 1,
            playlist: DEFAULT_PLAYLISTS.tetris,
            controls: 0,
            showinfo: 0,
            rel: 0,
            enablejsapi: 1,
            modestbranding: 1,
            iv_load_policy: 3
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    isPlayerReady = true;
    player.setVolume(currentVolume);
    
    // Attempt to unmute after user interaction
    document.addEventListener('click', unmuteinitial, { once: true });
    document.addEventListener('keydown', unmuteinitial, { once: true });
}

function unmuteinitial() {
    if (player && !isMuted) {
        player.unMute();
    }
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        player.playVideo();
    }
}

// Parse YouTube URLs
function parseYouTubeUrl(url) {
    if (!url) return null;
    
    // Handle playlist URLs
    const playlistMatch = url.match(/[?&]list=([^&]+)/);
    if (playlistMatch) {
        return { type: 'playlist', id: playlistMatch[1] };
    }
    
    // Handle video URLs
    const videoPatterns = [
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtu\.be\/([^?]+)/,
        /youtube\.com\/embed\/([^?]+)/
    ];
    
    for (const pattern of videoPatterns) {
        const match = url.match(pattern);
        if (match) {
            return { type: 'video', id: match[1] };
        }
    }
    
    // If no pattern matches, assume it's a direct ID
    return { type: 'video', id: url };
}

// Load custom video/playlist
function loadCustomVideo(url) {
    if (!isPlayerReady || !player) return;
    
    const parsed = parseYouTubeUrl(url);
    if (!parsed) return;
    
    if (parsed.type === 'playlist') {
        player.loadPlaylist({
            list: parsed.id,
            listType: 'playlist'
        });
    } else {
        player.loadVideoById(parsed.id);
    }
    
    // Save to localStorage
    localStorage.setItem('customYouTubeUrl', url);
}

// Volume Control
function setVolume(volume) {
    currentVolume = volume;
    if (player && isPlayerReady) {
        player.setVolume(volume);
    }
    localStorage.setItem('gameVolume', volume);
}

function toggleMute() {
    isMuted = !isMuted;
    if (player && isPlayerReady) {
        if (isMuted) {
            player.mute();
        } else {
            player.unMute();
        }
    }
    updateMuteButton();
}

function updateMuteButton() {
    const muteBtn = document.getElementById('mute-toggle');
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
}

// Initialize controls
document.addEventListener('DOMContentLoaded', () => {
    // Settings panel
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsContent = document.getElementById('settings-content');
    
    settingsToggle.addEventListener('click', () => {
        settingsContent.classList.toggle('hidden');
    });
    
    // YouTube URL input
    const youtubeInput = document.getElementById('youtube-url');
    const applyBtn = document.getElementById('apply-video');
    
    applyBtn.addEventListener('click', () => {
        const url = youtubeInput.value.trim();
        if (url) {
            loadCustomVideo(url);
            settingsContent.classList.add('hidden');
        }
    });
    
    // Playlist buttons
    document.querySelectorAll('.playlist-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const playlistId = btn.dataset.playlist;
            loadCustomVideo(`https://www.youtube.com/playlist?list=${playlistId}`);
            settingsContent.classList.add('hidden');
        });
    });
    
    // Volume control
    const volumeSlider = document.getElementById('volume-slider');
    const volumeDisplay = document.getElementById('volume-display');
    const muteToggle = document.getElementById('mute-toggle');
    
    // Load saved volume
    const savedVolume = localStorage.getItem('gameVolume');
    if (savedVolume) {
        currentVolume = parseInt(savedVolume);
        volumeSlider.value = currentVolume;
        volumeDisplay.textContent = `${currentVolume}%`;
    }
    
    volumeSlider.addEventListener('input', (e) => {
        const volume = e.target.value;
        setVolume(volume);
        volumeDisplay.textContent = `${volume}%`;
    });
    
    muteToggle.addEventListener('click', toggleMute);
    
    // Load saved custom URL
    const savedUrl = localStorage.getItem('customYouTubeUrl');
    if (savedUrl) {
        youtubeInput.value = savedUrl;
        // Will be loaded when player is ready
        setTimeout(() => {
            if (isPlayerReady) {
                loadCustomVideo(savedUrl);
            }
        }, 1000);
    }
    
    // Close settings when clicking outside
    document.addEventListener('click', (e) => {
        if (!settingsToggle.contains(e.target) && !settingsContent.contains(e.target)) {
            settingsContent.classList.add('hidden');
        }
    });
});

// Export for use in game
window.audioManager = {
    setVolume,
    toggleMute,
    loadCustomVideo,
    isReady: () => isPlayerReady,
    getVolume: () => currentVolume
};