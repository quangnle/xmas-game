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
     * @param {Object} io - Socket.io server instance
     */
    constructor(gameProcessor, gameStorage, getSocket, io) {
        this.gameProcessor = gameProcessor;
        this.storage = gameStorage;
        this.getSocket = getSocket;
        this.io = io;
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

        // Broadcast extra turn notification if applicable
        if (result.hasExtraTurn) {
            this.broadcastToAll(gameId, 'game:extraTurn', {
                playerName,
                diceValue: result.diceValue
            });
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

        // Broadcast tile events if any
        if (result.events && result.events.length > 0) {
            result.events.forEach(event => {
                if (event.type === 'GIFT') {
                    this.broadcastToAll(gameId, 'game:event:gift', {
                        playerName,
                        value: event.value,
                        position: { x: result.newPos.x, y: result.newPos.y }
                    });
                } else if (event.type === 'WEAPON') {
                    this.broadcastToAll(gameId, 'game:event:weapon', {
                        playerName,
                        weaponType: event.weaponType,
                        position: { x: result.newPos.x, y: result.newPos.y }
                    });
                } else if (event.type === 'CLUE') {
                    this.broadcastToAll(gameId, 'game:event:clue', {
                        playerName,
                        treasureIndex: event.treasureIndex
                    });
                } else if (event.type === 'DUEL_START') {
                    // Get current game state to broadcast duel state
                    const game = this.storage.getGame(gameId);
                    if (game && game.duelState) {
                        this.broadcastToAll(gameId, 'game:duel:started', {
                            player1Name: game.duelState.player1,
                            player2Name: game.duelState.player2,
                            player1Weapon: game.duelState.player1Weapon,
                            player2Weapon: game.duelState.player2Weapon,
                            player1Roll: game.duelState.player1Roll,
                            player2Roll: game.duelState.player2Roll,
                            phase: game.duelState.phase
                        });
                    }
                }
            });
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

        // Broadcast dig result
        if (result.found) {
            // Found treasure
            this.broadcastToAll(gameId, 'game:event:treasure', {
                playerName,
                value: result.treasureValue,
                coins: result.coins
            });
        } else if (result.error) {
            // Error cases
            if (result.error === 'Treasure already found') {
                this.broadcastToAll(gameId, 'game:event:digEmpty', {
                    playerName,
                    message: 'This treasure has already been dug up!'
                });
            } else if (result.error === 'No clue for this treasure') {
                this.broadcastToAll(gameId, 'game:event:digNoClue', {
                    playerName,
                    message: 'The ground here seems soft, but you\'re not sure what\'s underneath. Find a Snowman to get a clue!'
                });
            }
        } else {
            // Empty hole
            this.broadcastToAll(gameId, 'game:event:digEmpty', {
                playerName,
                message: 'You dig a hole but only find snow.'
            });
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
     * Handle duel fight action (new simplified logic)
     * @param {Object} socket - Socket.io socket
     * @param {string} gameId - Game ID
     * @param {string} playerName - Player name (must be in turn)
     */
    handleDuelFight(socket, gameId, playerName) {
        console.log('[SERVER] handleDuelFight called:', { gameId, playerName });
        
        const result = this.gameProcessor.duelFight(gameId, playerName);
        
        if (!result.success) {
            console.log('[SERVER] Duel fight failed:', result.error);
            this.sendError(socket, result.error);
            return;
        }

        console.log('[SERVER] Duel fight successful:', {
            winner: result.winner,
            loser: result.loser,
            coinTransfer: result.coinTransfer,
            p1Roll: result.p1Roll,
            p2Roll: result.p2Roll,
            p1Total: result.p1Total,
            p2Total: result.p2Total
        });

        // Broadcast duel result to all players using broadcastGameState method
        // This ensures all players with active socket connections receive the result
        const game = this.storage.getGame(gameId);
        if (game) {
            console.log('[SERVER] Broadcasting duel result to', game.players.length, 'players');
            game.players.forEach(player => {
                if (player.socketId) {
                    const playerSocket = this.getSocket(player.socketId);
                    if (playerSocket) {
                        playerSocket.emit('game:duel:resolved', result);
                        console.log('[SERVER] Sent duel result to player:', player.name, 'socket:', player.socketId);
                    } else {
                        console.log('[SERVER] Socket not found for player:', player.name, 'socketId:', player.socketId);
                    }
                } else {
                    console.log('[SERVER] No socketId for player:', player.name);
                }
            });
        } else {
            console.log('[SERVER] Game not found:', gameId);
        }

        // Broadcast updated state
        this.broadcastGameState(gameId);
        console.log('[SERVER] Broadcasted updated game state');
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
        
        // Check if both players have rolled - auto-resolve
        const game = this.storage.getGame(gameId);
        if (game && game.duelState && game.duelState.phase === 'RESOLVING') {
            // Auto-resolve after a short delay
            setTimeout(() => {
                const resolveResult = this.gameProcessor.duelResolve(gameId, playerName);
                if (resolveResult.success) {
                    // Broadcast duel result to all players
                    const updatedGame = this.storage.getGame(gameId);
                    if (updatedGame) {
                        const room = `game:${gameId}`;
                        const sockets = this.io.sockets.adapter.rooms.get(room);
                        if (sockets) {
                            sockets.forEach(socketId => {
                                const playerSocket = this.io.sockets.sockets.get(socketId);
                                if (playerSocket) {
                                    playerSocket.emit('game:duel:resolved', resolveResult);
                                }
                            });
                        }
                    }
                    // Broadcast updated state
                    this.broadcastGameState(gameId);
                }
            }, 1500);
        }
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

        // Broadcast duel result to all players (including the one who resolved)
        const game = this.gameStorage.getGame(gameId);
        if (game) {
            // Get all sockets in the game room
            const room = `game:${gameId}`;
            const sockets = this.io.sockets.adapter.rooms.get(room);
            if (sockets) {
                sockets.forEach(socketId => {
                    const playerSocket = this.io.sockets.sockets.get(socketId);
                    if (playerSocket) {
                        playerSocket.emit('game:duel:resolved', result);
                    }
                });
            }
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
     * Broadcast to all players in game
     * @param {string} gameId - Game ID
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    broadcastToAll(gameId, event, data) {
        const game = this.storage.getGame(gameId);
        if (!game) return;

        game.players.forEach(player => {
            if (player.socketId) {
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

