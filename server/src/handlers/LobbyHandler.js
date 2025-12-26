/**
 * Lobby Handler - Handles lobby actions
 */

import { LobbyStorage } from '../storage/LobbyStorage.js';
import { GameProcessor } from '../core/GameProcessor.js';
import { validatePlayerName, validateLobbyCode } from '../utils/validation.js';

/**
 * LobbyHandler class - handles lobby management
 */
export class LobbyHandler {
    /**
     * @param {LobbyStorage} lobbyStorage - LobbyStorage instance
     * @param {GameProcessor} gameProcessor - GameProcessor instance
     * @param {Function} getSocket - Function to get socket by socketId
     * @param {Object} io - Socket.io server instance (optional, can be set later)
     */
    constructor(lobbyStorage, gameProcessor, getSocket, io = null) {
        this.lobbyStorage = lobbyStorage;
        this.gameProcessor = gameProcessor;
        this.getSocket = getSocket;
        this.io = io;
    }

    /**
     * Set Socket.io instance
     * @param {Object} io - Socket.io server instance
     */
    setIO(io) {
        this.io = io;
    }

    /**
     * Handle create lobby
     * @param {Object} socket - Socket.io socket
     * @param {string} hostName - Host player name
     * @param {string} [roomCode] - Optional custom room code
     * @param {Object} [settings] - Optional game settings
     */
    handleCreateLobby(socket, hostName, roomCode = null, settings = {}) {
        // Validate host name
        const validation = validatePlayerName(hostName);
        if (!validation.valid) {
            this.sendError(socket, validation.error);
            return;
        }
        
        // Validate room code if provided
        if (roomCode) {
            const codeValidation = validateLobbyCode(roomCode);
            if (!codeValidation.valid) {
                this.sendError(socket, codeValidation.error);
                return;
            }
        }
        
        // Validate settings if provided
        if (settings) {
            if (settings.gridSize && (settings.gridSize < 25 || settings.gridSize > 50)) {
                this.sendError(socket, 'Grid size must be between 25 and 50');
                return;
            }
            if (settings.treasureValues && (!Array.isArray(settings.treasureValues) || settings.treasureValues.length < 1 || settings.treasureValues.length > 8)) {
                this.sendError(socket, 'Treasure values must be an array with 1-8 values');
                return;
            }
            if (settings.numKnives !== undefined && (settings.numKnives < 0 || settings.numKnives > 20)) {
                this.sendError(socket, 'Number of knives must be between 0 and 20');
                return;
            }
            if (settings.numSwords !== undefined && (settings.numSwords < 0 || settings.numSwords > 20)) {
                this.sendError(socket, 'Number of swords must be between 0 and 20');
                return;
            }
        }
        
        try {
            // Create lobby with optional custom code and settings
            const lobby = this.lobbyStorage.createLobby(hostName, socket.id, roomCode, settings);
            
            // Join socket room
            socket.join(lobby.lobbyId);
            
            // Send lobby data to host
            socket.emit('lobby:created', lobby);
        } catch (error) {
            this.sendError(socket, error.message || 'Failed to create room');
        }
    }

    /**
     * Handle join lobby
     * @param {Object} socket - Socket.io socket
     * @param {string} lobbyCode - Lobby code
     * @param {string} playerName - Player name (BẮT BUỘC)
     */
    handleJoinLobby(socket, lobbyCode, playerName) {
        // Validate lobby code
        const codeValidation = validateLobbyCode(lobbyCode);
        if (!codeValidation.valid) {
            this.sendError(socket, codeValidation.error);
            return;
        }
        
        // Validate player name
        const nameValidation = validatePlayerName(playerName);
        if (!nameValidation.valid) {
            this.sendError(socket, nameValidation.error);
            return;
        }
        
        // Find lobby by code
        const lobby = this.lobbyStorage.getLobbyByCode(lobbyCode);
        if (!lobby) {
            this.sendError(socket, 'Lobby not found');
            return;
        }
        
        // Check if game is already started
        if (lobby.status === 'IN_GAME' && lobby.gameId) {
            // Check if player was in this game (reconnection)
            // First check in game state (authoritative source)
            const game = this.gameProcessor.getGameState(lobby.gameId);
            if (!game) {
                this.sendError(socket, 'Game not found');
                return;
            }
            
            const gamePlayer = game.players.find(p => p.name === playerName);
            if (!gamePlayer) {
                // Player not in game - not allowed to join
                this.sendError(socket, 'Game has already started. You can only reconnect if you were in this game.');
                return;
            }
            
            // Player found in game - allow reconnection
            // Restore player in lobby if not present
            let existingPlayer = lobby.players.find(p => p.name === playerName);
            if (!existingPlayer) {
                // Player was removed from lobby but still in game - restore them
                existingPlayer = {
                    userId: socket.id,
                    name: playerName,
                    color: gamePlayer.color || this.lobbyStorage.getPlayerColor(lobby.players.length),
                    ready: true, // Assume ready since game started
                    socketId: socket.id
                };
                lobby.players.push(existingPlayer);
            } else {
                // Update socketId
                existingPlayer.socketId = socket.id;
            }
            
            // Join socket room
            socket.join(lobby.lobbyId);
            
            // Update player socketId in game state
            gamePlayer.socketId = socket.id;
            
            // Send lobby data and trigger game reconnect
            socket.emit('lobby:joined', lobby);
            socket.emit('lobby:reconnectToGame', { 
                gameId: lobby.gameId, 
                gameState: game 
            });
            
            // Broadcast updated lobby to all players
            if (this.io) {
                this.broadcastLobbyUpdate(lobby.lobbyId, this.io);
            }
            return;
        }
        
        // Normal join flow for WAITING lobbies
        // Check if lobby is full
        if (lobby.players.length >= lobby.settings.maxPlayers) {
            this.sendError(socket, 'Lobby is full');
            return;
        }
        
        // Check if name is already taken
        if (lobby.players.some(p => p.name === playerName)) {
            this.sendError(socket, 'Player name already taken in this lobby');
            return;
        }
        
        // Add player to lobby
        const player = this.lobbyStorage.addPlayer(lobby.lobbyId, playerName, socket.id);
        if (!player) {
            this.sendError(socket, 'Failed to join lobby');
            return;
        }
        
        // Join socket room
        socket.join(lobby.lobbyId);
        
        // Send lobby data to joining player
        socket.emit('lobby:joined', lobby);
        
        // Broadcast to other players in lobby
        socket.to(lobby.lobbyId).emit('lobby:playerJoined', player);
        
        // Broadcast updated lobby to all players
        if (this.io) {
            this.broadcastLobbyUpdate(lobby.lobbyId, this.io);
        }
    }

    /**
     * Handle toggle ready
     * @param {Object} socket - Socket.io socket
     * @param {string} lobbyId - Lobby ID
     * @param {string} playerName - Player name
     */
    handleToggleReady(socket, lobbyId, playerName) {
        const lobby = this.lobbyStorage.getLobby(lobbyId);
        if (!lobby) {
            this.sendError(socket, 'Lobby not found');
            return;
        }
        
        const player = lobby.players.find(p => p.name === playerName);
        if (!player) {
            this.sendError(socket, 'Player not found in lobby');
            return;
        }
        
        // Toggle ready status
        const newReady = !player.ready;
        this.lobbyStorage.setPlayerReady(lobbyId, playerName, newReady);
        
        // Broadcast to all players in lobby
        if (this.io) {
            this.broadcastLobbyUpdate(lobbyId, this.io);
        }
        
        // Also emit specific ready event
        socket.to(lobbyId).emit('lobby:playerReady', { playerName, ready: newReady });
    }

    /**
     * Handle start game
     * @param {Object} socket - Socket.io socket
     * @param {string} lobbyId - Lobby ID
     * @param {string} playerName - Player name (must be host)
     */
    handleStartGame(socket, lobbyId, playerName) {
        const lobby = this.lobbyStorage.getLobby(lobbyId);
        if (!lobby) {
            this.sendError(socket, 'Lobby not found');
            return;
        }
        
        // Check if player is host
        if (lobby.hostName !== playerName) {
            this.sendError(socket, 'Only host can start the game');
            return;
        }
        
        // Check minimum players first
        if (lobby.players.length < 2) {
            this.sendError(socket, 'Need at least 2 players to start');
            return;
        }
        
        // Check if all players are ready
        if (!this.lobbyStorage.areAllPlayersReady(lobbyId)) {
            this.sendError(socket, 'All players must be ready to start');
            return;
        }
        
        // Update lobby status
        this.lobbyStorage.updateLobbyStatus(lobbyId, 'STARTING');
        
        // Initialize game with lobby settings
        const players = lobby.players.map(p => ({ name: p.name }));
        const gameId = this.gameProcessor.initializeGame(players, null, lobby.settings);
        
        // Link game to lobby
        this.lobbyStorage.setGameId(lobbyId, gameId);
        
        // Update player socketIds in game
        const game = this.gameProcessor.getGameState(gameId);
        lobby.players.forEach((lobbyPlayer, index) => {
            if (game.players[index]) {
                game.players[index].socketId = lobbyPlayer.socketId;
            }
        });
        
        // Update lobby status
        this.lobbyStorage.updateLobbyStatus(lobbyId, 'IN_GAME');
        
        // Broadcast game starting to all players in lobby
        const gameState = this.gameProcessor.getGameState(gameId);
        if (this.io) {
            this.io.to(lobbyId).emit('lobby:gameStarting', { gameId, gameState });
        }
    }

    /**
     * Handle leave lobby
     * @param {Object} socket - Socket.io socket
     * @param {string} lobbyId - Lobby ID
     * @param {string} playerName - Player name
     */
    handleLeaveLobby(socket, lobbyId, playerName) {
        const lobby = this.lobbyStorage.getLobby(lobbyId);
        if (!lobby) {
            this.sendError(socket, 'Lobby not found');
            return;
        }
        
        // Remove player
        this.lobbyStorage.removePlayer(lobbyId, playerName);
        
        // Leave socket room
        socket.leave(lobbyId);
        
        // Broadcast to other players
        socket.to(lobbyId).emit('lobby:playerLeft', { playerName });
        
        // Broadcast updated lobby
        const updatedLobby = this.lobbyStorage.getLobby(lobbyId);
        if (updatedLobby && this.io) {
            this.broadcastLobbyUpdate(lobbyId, this.io);
        }
    }

    /**
     * Broadcast lobby update to all players
     * @param {string} lobbyId - Lobby ID
     * @param {Object} io - Socket.io server instance
     */
    broadcastLobbyUpdate(lobbyId, io) {
        const lobby = this.lobbyStorage.getLobby(lobbyId);
        if (!lobby) return;
        
        // Broadcast to all players in lobby room
        io.to(lobbyId).emit('lobby:updated', lobby);
    }

    /**
     * Handle get lobby list
     * @param {Object} socket - Socket.io socket
     */
    handleGetLobbyList(socket) {
        const allLobbies = this.lobbyStorage.getAllLobbies();
        
        // Return only public info (no sensitive data)
        // Show both WAITING and IN_GAME lobbies
        const publicLobbies = allLobbies
            .filter(lobby => lobby.status === 'WAITING' || lobby.status === 'IN_GAME')
            .map(lobby => ({
                code: lobby.code,
                playerCount: lobby.players.length,
                maxPlayers: lobby.settings.maxPlayers,
                hostName: lobby.hostName,
                status: lobby.status,
                gameId: lobby.gameId || null // Include gameId for reconnection
            }));
        
        socket.emit('lobby:list', publicLobbies);
    }

    /**
     * Send error to socket
     * @param {Object} socket - Socket.io socket
     * @param {string} message - Error message
     */
    sendError(socket, message) {
        socket.emit('lobby:error', { message, code: 'LOBBY_ERROR' });
    }
}

