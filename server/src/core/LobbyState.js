/**
 * Lobby State Structure and Type Definitions
 */

/**
 * @typedef {Object} LobbyPlayer
 * @property {string} userId - User/Socket ID
 * @property {string} name - Player name
 * @property {string} color - Player color
 * @property {boolean} ready - Ready status
 * @property {string} socketId - Socket ID
 */

/**
 * @typedef {Object} LobbySettings
 * @property {number} maxPlayers - Maximum players
 * @property {number} gridSize - Grid size
 */

/**
 * @typedef {Object} LobbyState
 * @property {string} lobbyId - Lobby ID
 * @property {string} code - 3-digit lobby code
 * @property {string} hostId - Host socket ID
 * @property {string} hostName - Host player name
 * @property {LobbyPlayer[]} players - Array of players
 * @property {LobbySettings} settings - Lobby settings
 * @property {string} status - Lobby status 'WAITING' | 'STARTING' | 'IN_GAME'
 * @property {string|null} gameId - Game ID (if game started)
 */

/**
 * Create initial lobby state structure
 * @param {string} lobbyId - Lobby ID
 * @param {string} code - Lobby code
 * @param {string} hostName - Host name
 * @param {string} hostSocketId - Host socket ID
 * @returns {LobbyState}
 */
export function createInitialLobbyState(lobbyId, code, hostName, hostSocketId) {
    return {
        lobbyId,
        code,
        hostId: hostSocketId,
        hostName,
        players: [],
        settings: {
            maxPlayers: 4,
            gridSize: 40
        },
        status: 'WAITING',
        gameId: null
    };
}

