// YouTube Player Management
let player;
let isPlayerReady = false;
let currentVolume = 50;
let isMuted = false;
let currentVideoIndex = 0;
let isPlayingPlaylist = false;
let customVideoIds = [];

// Default playlist - will be fetched from YouTube
const DEFAULT_PLAYLIST_URL = 'https://www.youtube.com/watch?v=EgBCCG0kn8I&list=PLMXIaalhNrNXX6Tk6Avf3NrnEAtHs2QVd';
const DEFAULT_VIDEO_IDS = []; // Will be populated from playlist or use fallback

// Default playlists (fallback)
const DEFAULT_PLAYLISTS = {
    tetris: 'PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG',
    gaming: 'PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI'
};

// Initialize YouTube Player
function onYouTubeIframeAPIReady() {
    // Parse the playlist from default URL
    const parsed = parseYouTubeUrl(DEFAULT_PLAYLIST_URL);
    
    if (parsed && parsed.type === 'playlist') {
        // Load playlist
        player = new YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            playerVars: {
                autoplay: 1,
                mute: 1, // Start muted for autoplay
                controls: 0,
                showinfo: 0,
                rel: 0,
                enablejsapi: 1,
                modestbranding: 1,
                iv_load_policy: 3,
                disablekb: 1,
                fs: 0,
                list: parsed.id,
                listType: 'playlist'
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });
    } else {
        // Fallback to single video
        player = new YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            videoId: 'EgBCCG0kn8I', // First video from the playlist
            playerVars: {
                autoplay: 1,
                mute: 1,
                controls: 0,
                showinfo: 0,
                rel: 0,
                enablejsapi: 1,
                modestbranding: 1,
                iv_load_policy: 3,
                disablekb: 1,
                fs: 0
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });
    }
}

function onPlayerReady(event) {
    isPlayerReady = true;
    player.setVolume(currentVolume);
    
    // Show initial video info
    updateVideoInfo(`♪ Playing default playlist`);
    
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
        playNextVideo();
    }
}

function onPlayerError(event) {
    console.log('YouTube player error:', event.data);
    // Skip to next video on error
    playNextVideo();
}

// Play next video in sequence
function playNextVideo() {
    if (!isPlayerReady || !player) return;
    
    // If we have a custom video list, use that
    if (customVideoIds.length > 0) {
        currentVideoIndex = (currentVideoIndex + 1) % customVideoIds.length;
        const nextVideoId = customVideoIds[currentVideoIndex];
        console.log(`Playing next video: ${nextVideoId} (${currentVideoIndex + 1}/${customVideoIds.length})`);
        player.loadVideoById(nextVideoId);
        updateVideoInfo(`♪ Video ${currentVideoIndex + 1}/${customVideoIds.length}`);
    } else {
        // Otherwise, use YouTube's playlist navigation
        player.nextVideo();
        updateVideoInfo(`♪ Next video`);
    }
}

// Play random video (for game events)
function playRandomVideo() {
    if (!isPlayerReady || !player) return;
    
    const videoList = customVideoIds.length > 0 ? customVideoIds : DEFAULT_VIDEO_IDS;
    const randomIndex = Math.floor(Math.random() * videoList.length);
    currentVideoIndex = randomIndex;
    
    const videoId = videoList[randomIndex];
    console.log(`Playing random video: ${videoId}`);
    
    player.loadVideoById(videoId);
    updateVideoInfo(`♪ Random video`);
}

// Update video info display
function updateVideoInfo(text) {
    const videoInfoEl = document.getElementById('video-info');
    const videoTextEl = document.getElementById('video-info-text');
    
    if (videoInfoEl && videoTextEl) {
        videoTextEl.textContent = text;
        videoInfoEl.classList.remove('hidden');
        
        // Hide after 5 seconds
        clearTimeout(window.videoInfoTimeout);
        window.videoInfoTimeout = setTimeout(() => {
            videoInfoEl.classList.add('hidden');
        }, 5000);
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
    
    // Check if it's a comma-separated list of video IDs
    if (url.includes(',')) {
        return { type: 'videoList', ids: url.split(',').map(id => id.trim()) };
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
        // For playlists, we'll fetch the videos and add to our custom list
        isPlayingPlaylist = true;
        player.loadPlaylist({
            list: parsed.id,
            listType: 'playlist'
        });
    } else if (parsed.type === 'videoList') {
        // Multiple video IDs provided
        customVideoIds = parsed.ids;
        currentVideoIndex = 0;
        player.loadVideoById(customVideoIds[0]);
    } else {
        // Single video ID
        customVideoIds = [parsed.id];
        currentVideoIndex = 0;
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
            if (btn.dataset.action === 'default') {
                // Reset to default playlist
                customVideoIds = [];
                currentVideoIndex = 0;
                localStorage.removeItem('customYouTubeUrl');
                if (player && isPlayerReady) {
                    // Load the default playlist
                    loadCustomVideo(DEFAULT_PLAYLIST_URL);
                }
            }
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
    getVolume: () => currentVolume,
    playNextVideo,
    playRandomVideo
};