/**
 * Game Handler - Handles client actions and broadcasts state
 * Acts as bridge between Socket.io and GameProcessor
 */

import { GameProcessor } from '../core/GameProcessor.js';
import { GameStorage } from '../storage/GameStorage.js';

/**
 * GameHandler class - handles game actions from clients
 */
export class GameHandler {
    /**
     * @param {GameProcessor} gameProcessor - GameProcessor instance
     * @param {GameStorage} gameStorage - GameStorage instance
     * @param {Function} getSocket - Function to get socket by socketId
     */
    constructor(gameProcessor, gameStorage, getSocket) {
        this.gameProcessor = gameProcessor;
        this.storage = gameStorage;
        this.getSocket = getSocket;
    }

    /**
     * Handle roll dice action
     * @param {Object} socket - Socket.io socket
     * @param {string} gameId - Game ID
     * @param {string} playerName - Player name
     */
    handleRollDice(socket, gameId, playerName) {
        const result = this.gameProcessor.rollDice(gameId, playerName);
        
        if (!result.success) {
            this.sendError(socket, result.error);
            return;
        }

        // Broadcast updated state
        this.broadcastGameState(gameId);
    }

    /**
     * Handle move action
     * @param {Object} socket - Socket.io socket
     * @param {string} gameId - Game ID
     * @param {string} playerName - Player name
     * @param {string} direction - Direction 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
     */
    handleMove(socket, gameId, playerName, direction) {
        const result = this.gameProcessor.movePlayer(gameId, playerName, direction);
        
        if (!result.success) {
            this.sendError(socket, result.error);
            return;
        }

        // Broadcast updated state
        this.broadcastGameState(gameId);
    }

    /**
     * Handle dig action
     * @param {Object} socket - Socket.io socket
     * @param {string} gameId - Game ID
     * @param {string} playerName - Player name
     */
    handleDig(socket, gameId, playerName) {
        const result = this.gameProcessor.dig(gameId, playerName);
        
        if (!result.success) {
            this.sendError(socket, result.error);
            return;
        }

        // Broadcast updated state
        this.broadcastGameState(gameId);
    }

    /**
     * Handle next turn action
     * @param {Object} socket - Socket.io socket
     * @param {string} gameId - Game ID
     * @param {string} playerName - Player name
     */
    handleNextTurn(socket, gameId, playerName) {
        const result = this.gameProcessor.nextTurn(gameId, playerName);
        
        if (!result.success) {
            this.sendError(socket, result.error);
            return;
        }

        // Broadcast updated state
        this.broadcastGameState(gameId);
    }

    /**
     * Handle duel select weapon action
     * @param {Object} socket - Socket.io socket
     * @param {string} gameId - Game ID
     * @param {string} playerName - Player name
     * @param {string|null} weaponType - Weapon type
     */
    handleDuelSelectWeapon(socket, gameId, playerName, weaponType) {
        const result = this.gameProcessor.duelSelectWeapon(gameId, playerName, weaponType);
        
        if (!result.success) {
            this.sendError(socket, result.error);
            return;
        }

        // Broadcast updated state
        this.broadcastGameState(gameId);
    }

    /**
     * Handle duel roll action
     * @param {Object} socket - Socket.io socket
     * @param {string} gameId - Game ID
     * @param {string} playerName - Player name
     */
    handleDuelRoll(socket, gameId, playerName) {
        const result = this.gameProcessor.duelRoll(gameId, playerName);
        
        if (!result.success) {
            this.sendError(socket, result.error);
            return;
        }

        // Broadcast updated state
        this.broadcastGameState(gameId);
    }

    /**
     * Handle duel resolve action
     * @param {Object} socket - Socket.io socket
     * @param {string} gameId - Game ID
     * @param {string} playerName - Player name
     */
    handleDuelResolve(socket, gameId, playerName) {
        const result = this.gameProcessor.duelResolve(gameId, playerName);
        
        if (!result.success) {
            this.sendError(socket, result.error);
            return;
        }

        // Broadcast updated state
        this.broadcastGameState(gameId);
    }

    /**
     * Handle player reconnection
     * @param {Object} socket - Socket.io socket
     * @param {string} gameId - Game ID
     * @param {string} playerName - Player name
     */
    handleReconnect(socket, gameId, playerName) {
        const game = this.storage.getGame(gameId);
        if (!game) {
            this.sendError(socket, 'Game not found');
            return;
        }

        // Find player by name
        const player = game.players.find(p => p.name === playerName);
        if (!player) {
            this.sendError(socket, 'Player not found in game');
            return;
        }

        // Update socketId
        player.socketId = socket.id;

        // Send full state to reconnected player
        const fullState = this.gameProcessor.getGameState(gameId);
        socket.emit('game:stateUpdate', fullState);

        // Notify other players
        this.broadcastToOthers(gameId, playerName, 'game:playerReconnected', { playerName });
    }

    /**
     * Handle player disconnect
     * @param {Object} socket - Socket.io socket
     * @param {string} gameId - Game ID
     */
    handleDisconnect(socket, gameId) {
        const game = this.storage.getGame(gameId);
        if (!game) return;

        // Find player by socketId
        const player = game.players.find(p => p.socketId === socket.id);
        if (!player) return;

        // Clear socketId but keep player in game
        player.socketId = null;

        // Notify other players
        this.broadcastToOthers(gameId, player.name, 'game:playerDisconnected', { playerName: player.name });
    }

    /**
     * Broadcast full game state to all players
     * @param {string} gameId - Game ID
     */
    broadcastGameState(gameId) {
        const game = this.storage.getGame(gameId);
        if (!game) return;

        const fullState = this.gameProcessor.getGameState(gameId);
        if (!fullState) return;

        // Broadcast to all players with active socket connections
        game.players.forEach(player => {
            if (player.socketId) {
                const socket = this.getSocket(player.socketId);
                if (socket) {
                    socket.emit('game:stateUpdate', fullState);
                }
            }
        });
    }

    /**
     * Broadcast to all players except one
     * @param {string} gameId - Game ID
     * @param {string} excludePlayerName - Player name to exclude
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    broadcastToOthers(gameId, excludePlayerName, event, data) {
        const game = this.storage.getGame(gameId);
        if (!game) return;

        game.players.forEach(player => {
            if (player.name !== excludePlayerName && player.socketId) {
                const socket = this.getSocket(player.socketId);
                if (socket) {
                    socket.emit(event, data);
                }
            }
        });
    }

    /**
     * Send error to socket
     * @param {Object} socket - Socket.io socket
     * @param {string} message - Error message
     */
    sendError(socket, message) {
        socket.emit('game:error', { message, code: 'ACTION_ERROR' });
    }
}

