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

export const SERVER_URL = 'http://localhost:3000';
