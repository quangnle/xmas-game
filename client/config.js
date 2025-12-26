/**
 * Client-side configuration
 * Mirrors server config for consistency
 */

export const GRID_SIZE = 40;
export const CELL_SIZE = 40; // Match server config
export const COLORS = {
    snow: '#f8fafc',
    ice: '#bae6fd',
    tree: '#ccecd7',
    gridLine: '#e2e8f0',
    highlight: 'rgba(250, 204, 21, 0.4)',
    background: '#0f172a'
};

export const TERRAIN_TYPES = {
    SNOW: 1,
    ICE: 2,
    TREE: 3
};

export const PLAYERS_CONFIG = [
    { name: 'Player 1', color: '#ef4444' },
    { name: 'Player 2', color: '#3b82f6' },
    { name: 'Player 3', color: '#22c55e' },
    { name: 'Player 4', color: '#eab308' }
];

export const CAMERA_CONFIG = {
    FOLLOW_SPEED: 0.1,
    ZOOM: 1.0
};

// Auto-detect server URL based on current hostname
// Allows other machines to connect by using the host machine's IP
// Can be overridden via query parameter: ?server=http://192.168.1.100:3000
function getServerURL() {
    // Check for override in URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const serverOverride = urlParams.get('server');
    if (serverOverride) {
        return serverOverride;
    }
    
    // Auto-detect from current location
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname;
    const port = '3000'; // Server port
    
    // If localhost, use localhost; otherwise use the actual hostname/IP
    return `${protocol}//${hostname}:${port}`;
}

export const SERVER_URL = getServerURL();

// Snapshot Configuration (for clue images)
export const SNAPSHOT_CONFIG = {
    RANGE: 5,
    CANVAS_SIZE: 200,
    CELL_SIZE: 20
};

// Gift value
export const GIFT_VALUE = 10;

// Weapons config
export const WEAPONS = {
    KNIFE: { emoji: '🔪', bonus: 2, name: 'Knife' },
    SWORD: { emoji: '🗡️', bonus: 3, name: 'Sword' }
};
