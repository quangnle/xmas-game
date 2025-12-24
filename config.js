/**
 * Game Configuration Constants
 */

// Grid Configuration
export const GRID_SIZE = 40; // 40x40 grid
export const CELL_SIZE = 40; // Pixels per cell

// Visual Colors
export const COLORS = {
    snow: '#f8fafc',      // Value 1 - Snow terrain
    ice: '#bae6fd',       // Value 2 - Ice terrain
    tree: '#14532d',      // Value 3 - Tree terrain (very dark green for background)
    gridLine: '#e2e8f0',
    highlight: 'rgba(250, 204, 21, 0.4)',
    background: '#0f172a'  // bg-slate-900
};

// Terrain Types
export const TERRAIN_TYPES = {
    SNOW: 1,
    ICE: 2,
    TREE: 3
};

// Terrain Distribution (70% snow, 20% ice, 10% tree)
export const TERRAIN_DISTRIBUTION = {
    SNOW_THRESHOLD: 0.7,
    ICE_THRESHOLD: 0.9,
    TREE_THRESHOLD: 1.0
};

// Players Configuration
export const PLAYERS_CONFIG = [
    { id: 0, name: "Đỏ", color: '#ef4444', x: 0, y: 0 },
    { id: 1, name: "Xanh Dương", color: '#3b82f6', x: GRID_SIZE - 1, y: 0 },
    { id: 2, name: "Lục", color: '#22c55e', x: 0, y: GRID_SIZE - 1 },
    { id: 3, name: "Vàng", color: '#eab308', x: GRID_SIZE - 1, y: GRID_SIZE - 1 }
];

// Game Items Configuration
export const TREASURE_VALUES = [100, 200, 500, 1000];
export const NUM_TREASURES = 4;
export const NUM_GIFTS = 20;
export const GIFT_VALUE = 10;

// Game States
export const GAME_STATES = {
    IDLE: 'IDLE',
    MOVE: 'MOVE',
    ANIMATING: 'ANIMATING',
    DUEL: 'DUEL'
};

// Dice Configuration
export const DICE_CONFIG = {
    MIN_VALUE: 1,
    MAX_VALUE: 6,
    NUM_DICE: 2,
    ANIMATION_ITERATIONS: 10,
    ANIMATION_INTERVAL: 50
};

// Snapshot Configuration
export const SNAPSHOT_CONFIG = {
    RANGE: 5,
    CANVAS_SIZE: 200,
    CELL_SIZE: 20
};

// Camera Configuration
export const CAMERA_CONFIG = {
    LERP_SPEED: 0.1
};

