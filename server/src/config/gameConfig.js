/**
 * Game Configuration Constants
 * Shared between server and client
 */

// Grid Configuration
export const GRID_SIZE = 40; // 40x40 grid
export const CELL_SIZE = 40; // Pixels per cell

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

// Game Items Configuration
export const TREASURE_VALUES = [100, 200, 500, 1000];
export const NUM_TREASURES = 4;
export const NUM_GIFTS = 20;
export const GIFT_VALUE = 10;

// Weapons Configuration
export const WEAPONS = {
    KNIFE: { emoji: '🔪', bonus: 2, name: 'Knife' },
    SWORD: { emoji: '🗡️', bonus: 3, name: 'Sword' }
};
export const NUM_KNIVES = 2;
export const NUM_SWORDS = 2;

// Game States
export const GAME_STATES = {
    IDLE: 'IDLE',
    MOVE: 'MOVE',
    DUEL: 'DUEL'
};

// Dice Configuration
export const DICE_CONFIG = {
    MIN_VALUE: 1,
    MAX_VALUE: 6,
    NUM_DICE: 2
};

// Player starting positions (corners)
export const START_POSITIONS = [
    { x: 0, y: 0 },
    { x: GRID_SIZE - 1, y: 0 },
    { x: 0, y: GRID_SIZE - 1 },
    { x: GRID_SIZE - 1, y: GRID_SIZE - 1 }
];

// Player colors
export const PLAYER_COLORS = [
    '#ef4444', // Red
    '#3b82f6', // Blue
    '#22c55e', // Green
    '#eab308'  // Yellow
];

