/**
 * In-Memory Lobby Storage
 * Manages lobby state storage using Map
 */

/**
 * LobbyStorage class for managing lobby states in memory
 */
export class LobbyStorage {
    constructor() {
        /** @type {Map<string, import('../core/LobbyState.js').LobbyState>} */
        this.lobbies = new Map();
    }

    /**
     * Create a new lobby
     * @param {string} hostName - Host player name
     * @param {string} hostSocketId - Host socket ID
     * @param {string} [customCode] - Optional custom room code (must be unique)
     * @param {Object} [settings] - Optional game settings
     * @returns {import('../core/LobbyState.js').LobbyState} Created lobby
     */
    createLobby(hostName, hostSocketId, customCode = null, settings = null) {
        const lobbyId = `lobby-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        let code;
        
        if (customCode) {
            // Check if code already exists
            if (this.getLobbyByCode(customCode)) {
                throw new Error('Room code already exists');
            }
            code = customCode;
        } else {
            code = this.generateLobbyCode();
        }
        
        const lobby = {
            lobbyId,
            code,
            hostId: hostSocketId,
            hostName,
            players: [{
                userId: hostSocketId,
                name: hostName,
                color: this.getPlayerColor(0),
                ready: false,
                socketId: hostSocketId
            }],
            settings: {
                maxPlayers: 4,
                gridSize: settings?.gridSize || 40,
                numGifts: settings?.numGifts || 20,
                treasureValues: settings?.treasureValues || [100, 200, 500, 1000],
                numKnives: settings?.numKnives || 2,
                numSwords: settings?.numSwords || 2
            },
            status: 'WAITING',
            gameId: null
        };
        
        this.lobbies.set(lobbyId, lobby);
        return lobby;
    }

    /**
     * Get lobby by ID
     * @param {string} lobbyId - Lobby ID
     * @returns {import('../core/LobbyState.js').LobbyState|undefined} Lobby state
     */
    getLobby(lobbyId) {
        return this.lobbies.get(lobbyId);
    }

    /**
     * Get lobby by code
     * @param {string} code - Lobby code
     * @returns {import('../core/LobbyState.js').LobbyState|undefined} Lobby state
     */
    getLobbyByCode(code) {
        for (const lobby of this.lobbies.values()) {
            if (lobby.code === code) {
                return lobby;
            }
        }
        return undefined;
    }

    /**
     * Add player to lobby
     * @param {string} lobbyId - Lobby ID
     * @param {string} playerName - Player name
     * @param {string} socketId - Socket ID
     * @returns {Object|false} Player object or false if failed
     */
    addPlayer(lobbyId, playerName, socketId) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) return false;
        
        if (lobby.players.length >= lobby.settings.maxPlayers) {
            return false; // Lobby full
        }
        
        // Check if name already exists
        if (lobby.players.some(p => p.name === playerName)) {
            return false; // Name taken
        }
        
        const player = {
            userId: socketId,
            name: playerName,
            color: this.getPlayerColor(lobby.players.length),
            ready: false,
            socketId
        };
        
        lobby.players.push(player);
        return player;
    }

    /**
     * Remove player from lobby
     * @param {string} lobbyId - Lobby ID
     * @param {string} playerName - Player name
     * @returns {boolean} Success
     */
    removePlayer(lobbyId, playerName) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) return false;
        
        const index = lobby.players.findIndex(p => p.name === playerName);
        if (index === -1) return false;
        
        lobby.players.splice(index, 1);
        
        // If lobby is empty, delete it
        if (lobby.players.length === 0) {
            this.lobbies.delete(lobbyId);
        } else if (lobby.hostName === playerName) {
            // If host left, assign new host
            lobby.hostName = lobby.players[0].name;
            lobby.hostId = lobby.players[0].socketId;
        }
        
        return true;
    }

    /**
     * Update player ready status
     * @param {string} lobbyId - Lobby ID
     * @param {string} playerName - Player name
     * @param {boolean} ready - Ready status
     * @returns {boolean} Success
     */
    setPlayerReady(lobbyId, playerName, ready) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) return false;
        
        const player = lobby.players.find(p => p.name === playerName);
        if (!player) return false;
        
        player.ready = ready;
        return true;
    }

    /**
     * Check if all players are ready
     * @param {string} lobbyId - Lobby ID
     * @returns {boolean}
     */
    areAllPlayersReady(lobbyId) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) return false;
        
        if (lobby.players.length < 2) return false; // Need at least 2 players
        
        return lobby.players.every(p => p.ready);
    }

    /**
     * Update lobby status
     * @param {string} lobbyId - Lobby ID
     * @param {string} status - New status
     * @returns {boolean} Success
     */
    updateLobbyStatus(lobbyId, status) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) return false;
        
        lobby.status = status;
        return true;
    }

    /**
     * Set game ID for lobby
     * @param {string} lobbyId - Lobby ID
     * @param {string} gameId - Game ID
     * @returns {boolean} Success
     */
    setGameId(lobbyId, gameId) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) return false;
        
        lobby.gameId = gameId;
        return true;
    }

    /**
     * Delete lobby
     * @param {string} lobbyId - Lobby ID
     * @returns {boolean} Success
     */
    deleteLobby(lobbyId) {
        return this.lobbies.delete(lobbyId);
    }

    /**
     * Get all lobbies
     * @returns {import('../core/LobbyState.js').LobbyState[]} Array of lobby states
     */
    getAllLobbies() {
        return Array.from(this.lobbies.values());
    }

    /**
     * Generate unique 3-digit lobby code
     * @returns {string} Lobby code
     */
    generateLobbyCode() {
        let code;
        let attempts = 0;
        do {
            code = Math.floor(100 + Math.random() * 900).toString();
            attempts++;
        } while (this.getLobbyByCode(code) && attempts < 100);
        
        return code;
    }

    /**
     * Get player color by index
     * @param {number} index - Player index
     * @returns {string} Color hex code
     */
    getPlayerColor(index) {
        const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308']; // Red, Blue, Green, Yellow
        return colors[index % colors.length];
    }
}

