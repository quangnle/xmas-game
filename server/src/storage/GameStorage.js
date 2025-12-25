/**
 * In-Memory Game Storage
 * Manages game state storage using Map
 */

/**
 * GameStorage class for managing game states in memory
 */
export class GameStorage {
    constructor() {
        /** @type {Map<string, import('../core/GameState.js').GameState>} */
        this.games = new Map();
    }

    /**
     * Create a new game
     * @param {string} gameId - Game ID
     * @param {import('../core/GameState.js').GameState} gameState - Initial game state
     * @returns {boolean} Success
     */
    createGame(gameId, gameState) {
        if (this.games.has(gameId)) {
            return false; // Game already exists
        }
        this.games.set(gameId, gameState);
        return true;
    }

    /**
     * Get game by ID
     * @param {string} gameId - Game ID
     * @returns {import('../core/GameState.js').GameState|undefined} Game state
     */
    getGame(gameId) {
        return this.games.get(gameId);
    }

    /**
     * Update game state
     * @param {string} gameId - Game ID
     * @param {Partial<import('../core/GameState.js').GameState>} updates - Partial updates
     * @returns {boolean} Success
     */
    updateGame(gameId, updates) {
        const game = this.games.get(gameId);
        if (!game) {
            return false;
        }
        Object.assign(game, updates);
        return true;
    }

    /**
     * Delete game
     * @param {string} gameId - Game ID
     * @returns {boolean} Success
     */
    deleteGame(gameId) {
        return this.games.delete(gameId);
    }

    /**
     * Get all games
     * @returns {import('../core/GameState.js').GameState[]} Array of game states
     */
    getAllGames() {
        return Array.from(this.games.values());
    }

    /**
     * Check if game exists
     * @param {string} gameId - Game ID
     * @returns {boolean} Whether game exists
     */
    hasGame(gameId) {
        return this.games.has(gameId);
    }

    /**
     * Get number of active games
     * @returns {number} Number of games
     */
    getGameCount() {
        return this.games.size;
    }
}

