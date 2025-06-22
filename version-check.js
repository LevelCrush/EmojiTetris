// Version checking and cache busting
const CURRENT_VERSION = '1.0.0';
const VERSION_CHECK_INTERVAL = 60000; // Check every minute
let versionCheckTimer = null;
let updateNotificationShown = false;

// Check version on load
async function checkVersion(isInitialLoad = false) {
    try {
        // Add cache buster to ensure we get the latest version
        const response = await fetch(`version.json?t=${Date.now()}`);
        if (!response.ok) {
            console.error('Failed to fetch version info');
            return;
        }
        
        const versionData = await response.json();
        const latestVersion = versionData.version;
        
        // Update version display
        const versionElement = document.getElementById('version-number');
        if (versionElement) {
            versionElement.textContent = CURRENT_VERSION;
        }
        
        // Check if version mismatch
        if (latestVersion !== CURRENT_VERSION) {
            console.log(`Version mismatch! Current: ${CURRENT_VERSION}, Latest: ${latestVersion}`);
            
            if (isInitialLoad) {
                // Auto-reload on initial page load
                showUpdateNotification(latestVersion, true);
                setTimeout(() => {
                    forceReload();
                }, 3000);
            } else {
                // Show update button for periodic checks
                showUpdateNotification(latestVersion, false);
            }
        } else {
            console.log(`Version check passed: ${CURRENT_VERSION}`);
        }
    } catch (error) {
        console.error('Version check failed:', error);
    }
}

// Show update notification
function showUpdateNotification(newVersion, autoReload = false) {
    // Don't show duplicate notifications
    if (updateNotificationShown && !autoReload) {
        return;
    }
    
    // Remove any existing notification
    const existingNotification = document.querySelector('.update-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
        <div class="update-content">
            <h3>🚀 Update Available!</h3>
            <p>A new version (v${newVersion}) is available.</p>
            ${autoReload ? 
                '<p>Reloading in 3 seconds...</p>' : 
                '<button id="update-btn" class="update-btn">Update Now</button>'
            }
        </div>
    `;
    document.body.appendChild(notification);
    
    updateNotificationShown = true;
    
    // Add click handler for manual update
    if (!autoReload) {
        const updateBtn = document.getElementById('update-btn');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => {
                forceReload();
            });
        }
    }
}

// Force reload with cache busting
function forceReload() {
    // Clear all caches
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => {
                caches.delete(name);
            });
        });
    }
    
    // Clear local storage version cache
    localStorage.setItem('lastVersionCheck', Date.now());
    
    // Reload with cache buster
    const cacheBuster = Date.now();
    const url = new URL(window.location.href);
    url.searchParams.set('v', cacheBuster);
    
    // Hard reload
    window.location.replace(url.toString());
}

// Start periodic version checking
function startVersionChecking() {
    // Initial check with auto-reload
    checkVersion(true);
    
    // Set up periodic checks (without auto-reload)
    versionCheckTimer = setInterval(() => {
        checkVersion(false);
    }, VERSION_CHECK_INTERVAL);
}

// Stop version checking (when game is active)
function stopVersionChecking() {
    if (versionCheckTimer) {
        clearInterval(versionCheckTimer);
        versionCheckTimer = null;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    startVersionChecking();
    
    // Stop checking when game starts to reduce network requests
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            stopVersionChecking();
        });
    }
});

// Also check on visibility change
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !window.gameInstance?.gameStarted) {
        // Don't auto-reload on visibility change
        checkVersion(false);
    }
});

// Export for use in other scripts
window.versionChecker = {
    checkVersion,
    startVersionChecking,
    stopVersionChecking,
    CURRENT_VERSION
};