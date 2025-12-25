/**
 * Game State Structure and Type Definitions
 */

/**
 * @typedef {Object} Player
 * @property {string} id - Player ID
 * @property {string} name - Player name (used for reconnection)
 * @property {string} color - Player color
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} coins - Coins collected
 * @property {number[]} inventory - Treasure clue indices
 * @property {string[]} weapons - Weapon types ['KNIFE', 'SWORD', ...]
 * @property {{x: number, y: number}} startPos - Starting position
 * @property {string|null} socketId - Socket ID (null if disconnected)
 */

/**
 * @typedef {Object} Treasure
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} value - Treasure value
 * @property {boolean} found - Whether treasure is found
 * @property {number} index - Treasure index
 */

/**
 * @typedef {Object} Snowman
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} treasureIndex - Linked treasure index
 */

/**
 * @typedef {Object} Gift
 * @property {number} x - X position
 * @property {number} y - Y position
 */

/**
 * @typedef {Object} Weapon
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {string} type - Weapon type 'KNIFE' | 'SWORD'
 */

/**
 * @typedef {Object} DuelState
 * @property {string} player1 - Player 1 name
 * @property {string} player2 - Player 2 name
 * @property {string|null} player1Weapon - Player 1 weapon type
 * @property {string|null} player2Weapon - Player 2 weapon type
 * @property {number|null} player1Roll - Player 1 dice roll
 * @property {number|null} player2Roll - Player 2 dice roll
 * @property {string} phase - Duel phase 'SELECT_WEAPON' | 'ROLLING' | 'RESOLVING'
 */

/**
 * @typedef {Object} GameState
 * @property {string} gameId - Game ID
 * @property {string} status - Game status 'WAITING' | 'PLAYING' | 'FINISHED'
 * @property {number} seed - Random seed for reproducible generation
 * @property {number} currentPlayerIndex - Current player index
 * @property {string} turnState - Turn state 'IDLE' | 'MOVE' | 'DUEL'
 * @property {number} diceValue - Last dice roll value
 * @property {number} currentMoves - Moves left for current player
 * @property {boolean} hasExtraTurn - Whether current player has extra turn
 * @property {Player[]} players - Array of players
 * @property {number[][]} grid - 40x40 terrain grid
 * @property {Treasure[]} treasures - Array of treasures
 * @property {Snowman[]} snowmen - Array of snowmen
 * @property {Gift[]} gifts - Array of gifts
 * @property {Weapon[]} weapons - Array of weapons
 * @property {DuelState|null} duelState - Duel state (null if not in duel)
 */

/**
 * Create initial game state structure
 * @param {string} gameId - Game ID
 * @param {number} seed - Random seed
 * @returns {GameState}
 */
export function createInitialGameState(gameId, seed) {
    return {
        gameId,
        status: 'WAITING',
        seed,
        currentPlayerIndex: 0,
        turnState: 'IDLE',
        diceValue: 0,
        currentMoves: 0,
        hasExtraTurn: false,
        players: [],
        grid: [],
        treasures: [],
        snowmen: [],
        gifts: [],
        weapons: [],
        duelState: null
    };
}

