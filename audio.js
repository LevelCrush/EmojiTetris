// YouTube Player Management
let player;
let isPlayerReady = false;
window.player = null; // Make player globally accessible
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
    window.player = player; // Make player globally accessible
    
    // Apply saved volume settings
    if (window.settingsManager) {
        player.setVolume(window.settingsManager.get('youtubeVolume'));
        if (window.settingsManager.get('youtubeMuted')) {
            player.mute();
        }
    }
    
    // Show initial video info
    updateVideoInfo(`♪ Playing default playlist`);
    
    // Attempt to unmute after user interaction
    document.addEventListener('click', unmuteinitial, { once: true });
    document.addEventListener('keydown', unmuteinitial, { once: true });
}

function unmuteinitial() {
    if (player && window.settingsManager && !window.settingsManager.get('youtubeMuted')) {
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
    } else if (isPlayingPlaylist) {
        // Use YouTube's playlist navigation
        const currentIndex = player.getPlaylistIndex();
        const playlistSize = player.getPlaylist() ? player.getPlaylist().length : 0;
        
        if (currentIndex !== -1 && playlistSize > 0) {
            // Move to next video in playlist
            const nextIndex = (currentIndex + 1) % playlistSize;
            player.playVideoAt(nextIndex);
            updateVideoInfo(`♪ Playlist video ${nextIndex + 1}/${playlistSize}`);
        } else {
            // Fallback to nextVideo
            player.nextVideo();
            updateVideoInfo(`♪ Next video`);
        }
    } else {
        // No playlist or custom videos, try to replay current video
        const currentVideoUrl = player.getVideoUrl();
        if (currentVideoUrl) {
            player.playVideo();
        }
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
    if (!parsed) {
        console.error('Invalid YouTube URL:', url);
        return;
    }
    
    console.log('Loading custom video:', parsed);
    
    if (parsed.type === 'playlist') {
        // For playlists, clear custom video list and use native playlist
        customVideoIds = [];
        isPlayingPlaylist = true;
        player.loadPlaylist({
            list: parsed.id,
            listType: 'playlist',
            index: 0,
            startSeconds: 0
        });
        updateVideoInfo(`♪ Loading playlist: ${parsed.id}`);
    } else if (parsed.type === 'videoList') {
        // Multiple video IDs provided
        customVideoIds = parsed.ids;
        currentVideoIndex = 0;
        isPlayingPlaylist = false;
        player.loadVideoById(customVideoIds[0]);
        updateVideoInfo(`♪ Loading ${customVideoIds.length} videos`);
    } else {
        // Single video ID
        customVideoIds = [parsed.id];
        currentVideoIndex = 0;
        isPlayingPlaylist = false;
        player.loadVideoById(parsed.id);
        updateVideoInfo(`♪ Loading video: ${parsed.id}`);
    }
    
    // Save to settings
    if (window.settingsManager) {
        window.settingsManager.set('youtubeUrl', url);
    }
    
    // Clear the input field after applying
    const input = document.getElementById('youtube-url');
    if (input) {
        input.value = '';
    }
}

// Volume Control
function setVolume(volume) {
    if (player && isPlayerReady) {
        player.setVolume(volume);
    }
}

function setMuted(muted) {
    if (player && isPlayerReady) {
        if (muted) {
            player.mute();
        } else {
            player.unMute();
        }
    }
}

// Initialize controls
document.addEventListener('DOMContentLoaded', () => {
    // YouTube URL input
    const youtubeInput = document.getElementById('youtube-url');
    const applyBtn = document.getElementById('apply-video');
    
    applyBtn.addEventListener('click', () => {
        const url = youtubeInput.value.trim();
        if (url) {
            loadCustomVideo(url);
            // Provide feedback
            applyBtn.textContent = 'Applied!';
            setTimeout(() => {
                applyBtn.textContent = 'Apply';
            }, 2000);
        }
    });
    
    // Allow Enter key to apply URL
    youtubeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const url = youtubeInput.value.trim();
            if (url) {
                loadCustomVideo(url);
                applyBtn.textContent = 'Applied!';
                setTimeout(() => {
                    applyBtn.textContent = 'Apply';
                }, 2000);
            }
        }
    });
    
    // Playlist buttons
    document.querySelectorAll('.playlist-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.action === 'default') {
                // Reset to default playlist
                customVideoIds = [];
                currentVideoIndex = 0;
                if (window.settingsManager) {
                    window.settingsManager.set('youtubeUrl', '');
                }
                if (player && isPlayerReady) {
                    // Load the default playlist
                    loadCustomVideo(DEFAULT_PLAYLIST_URL);
                }
            }
        });
    });
    
    // Load saved custom URL from settings
    if (window.settingsManager) {
        const savedUrl = window.settingsManager.get('youtubeUrl');
        if (savedUrl) {
            youtubeInput.value = savedUrl;
            // Will be loaded when player is ready
            setTimeout(() => {
                if (isPlayerReady) {
                    loadCustomVideo(savedUrl);
                }
            }, 1000);
        }
    }
    
});

// Export for use in game
window.audioManager = {
    setVolume,
    setMuted,
    loadCustomVideo,
    isReady: () => isPlayerReady,
    playNextVideo,
    playRandomVideo
};