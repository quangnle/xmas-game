/**
 * Unit tests for GameHandler
 */

import { GameHandler } from '../../src/handlers/GameHandler.js';
import { GameProcessor } from '../../src/core/GameProcessor.js';
import { GameStorage } from '../../src/storage/GameStorage.js';

describe('GameHandler', () => {
    let handler;
    let processor;
    let storage;
    let mockSocket;
    let getSocket;
    let gameId;
    let playerName;

    beforeEach(() => {
        storage = new GameStorage();
        processor = new GameProcessor(storage);
        
        // Mock socket
        mockSocket = {
            id: 'socket-123',
            emit: function() {}
        };
        
        // Track emit calls
        const emitCalls = [];
        mockSocket.emit = function(...args) {
            emitCalls.push(args);
        };
        mockSocket._getEmitCalls = () => emitCalls;
        
        // Mock getSocket function
        getSocket = function(socketId) {
            if (socketId === 'socket-123') return mockSocket;
            return null;
        };
        
        handler = new GameHandler(processor, storage, getSocket);
        
        // Create a test game
        playerName = 'TestPlayer';
        gameId = processor.initializeGame([
            { name: playerName },
            { name: 'OtherPlayer' }
        ]);
        
        // Set socketId for player
        const game = processor.getGameState(gameId);
        const player = game.players.find(p => p.name === playerName);
        if (player) {
            player.socketId = 'socket-123';
        }
    });

    describe('handleRollDice', () => {
        test('should call GameProcessor.rollDice and broadcast state', () => {
            let rollDiceCalled = false;
            let broadcastCalled = false;
            
            const originalRollDice = processor.rollDice.bind(processor);
            processor.rollDice = function(...args) {
                rollDiceCalled = true;
                expect(args[0]).toBe(gameId);
                expect(args[1]).toBe(playerName);
                return originalRollDice(...args);
            };
            
            const originalBroadcast = handler.broadcastGameState.bind(handler);
            handler.broadcastGameState = function(...args) {
                broadcastCalled = true;
                expect(args[0]).toBe(gameId);
            };
            
            handler.handleRollDice(mockSocket, gameId, playerName);
            
            expect(rollDiceCalled).toBe(true);
            expect(broadcastCalled).toBe(true);
            
            // Restore
            processor.rollDice = originalRollDice;
            handler.broadcastGameState = originalBroadcast;
        });

        test('should send error if action fails', () => {
            mockSocket._getEmitCalls().length = 0; // Clear calls
            
            // Try with wrong player name
            handler.handleRollDice(mockSocket, gameId, 'WrongPlayer');
            
            const calls = mockSocket._getEmitCalls();
            expect(calls.length).toBeGreaterThan(0);
            expect(calls[0][0]).toBe('game:error');
            expect(calls[0][1].code).toBe('ACTION_ERROR');
        });
    });

    describe('handleMove', () => {
        test('should call GameProcessor.movePlayer and broadcast state', () => {
            // First roll dice to enable move
            processor.rollDice(gameId, playerName);
            
            let moveCalled = false;
            let broadcastCalled = false;
            
            const originalMove = processor.movePlayer.bind(processor);
            processor.movePlayer = function(...args) {
                moveCalled = true;
                expect(args[0]).toBe(gameId);
                expect(args[1]).toBe(playerName);
                expect(args[2]).toBe('UP');
                // Return success to trigger broadcast
                return { success: true, newPos: { x: 0, y: 0 }, movesLeft: 5 };
            };
            
            const originalBroadcast = handler.broadcastGameState.bind(handler);
            handler.broadcastGameState = function(...args) {
                broadcastCalled = true;
                expect(args[0]).toBe(gameId);
            };
            
            handler.handleMove(mockSocket, gameId, playerName, 'UP');
            
            expect(moveCalled).toBe(true);
            expect(broadcastCalled).toBe(true);
            
            // Restore
            processor.movePlayer = originalMove;
            handler.broadcastGameState = originalBroadcast;
        });

        test('should send error if move fails', () => {
            mockSocket._getEmitCalls().length = 0;
            
            handler.handleMove(mockSocket, gameId, playerName, 'UP');
            
            const calls = mockSocket._getEmitCalls();
            expect(calls.length).toBeGreaterThan(0);
            expect(calls[0][0]).toBe('game:error');
        });
    });

    describe('handleDig', () => {
        test('should call GameProcessor.dig and broadcast state', () => {
            let digCalled = false;
            let broadcastCalled = false;
            
            const originalDig = processor.dig.bind(processor);
            processor.dig = function(...args) {
                digCalled = true;
                expect(args[0]).toBe(gameId);
                expect(args[1]).toBe(playerName);
                // Return success to trigger broadcast
                return { success: true, found: false };
            };
            
            const originalBroadcast = handler.broadcastGameState.bind(handler);
            handler.broadcastGameState = function(...args) {
                broadcastCalled = true;
                expect(args[0]).toBe(gameId);
            };
            
            handler.handleDig(mockSocket, gameId, playerName);
            
            expect(digCalled).toBe(true);
            expect(broadcastCalled).toBe(true);
            
            // Restore
            processor.dig = originalDig;
            handler.broadcastGameState = originalBroadcast;
        });
    });

    describe('handleNextTurn', () => {
        test('should call GameProcessor.nextTurn and broadcast state', () => {
            let nextTurnCalled = false;
            let broadcastCalled = false;
            
            const originalNextTurn = processor.nextTurn.bind(processor);
            processor.nextTurn = function(...args) {
                nextTurnCalled = true;
                expect(args[0]).toBe(gameId);
                expect(args[1]).toBe(playerName);
                // Return success to trigger broadcast
                return { success: true, nextPlayerIndex: 0 };
            };
            
            const originalBroadcast = handler.broadcastGameState.bind(handler);
            handler.broadcastGameState = function(...args) {
                broadcastCalled = true;
                expect(args[0]).toBe(gameId);
            };
            
            handler.handleNextTurn(mockSocket, gameId, playerName);
            
            expect(nextTurnCalled).toBe(true);
            expect(broadcastCalled).toBe(true);
            
            // Restore
            processor.nextTurn = originalNextTurn;
            handler.broadcastGameState = originalBroadcast;
        });
    });

    describe('handleReconnect', () => {
        test('should update player socketId and send state', () => {
            const game = processor.getGameState(gameId);
            const player = game.players.find(p => p.name === playerName);
            player.socketId = null; // Simulate disconnect
            
            mockSocket._getEmitCalls().length = 0;
            
            handler.handleReconnect(mockSocket, gameId, playerName);
            
            expect(player.socketId).toBe('socket-123');
            const calls = mockSocket._getEmitCalls();
            expect(calls.length).toBeGreaterThan(0);
            expect(calls[0][0]).toBe('game:stateUpdate');
        });

        test('should send error if game not found', () => {
            mockSocket._getEmitCalls().length = 0;
            
            handler.handleReconnect(mockSocket, 'non-existent', playerName);
            
            const calls = mockSocket._getEmitCalls();
            expect(calls[0][0]).toBe('game:error');
            expect(calls[0][1].message).toBe('Game not found');
        });

        test('should send error if player not found', () => {
            mockSocket._getEmitCalls().length = 0;
            
            handler.handleReconnect(mockSocket, gameId, 'NonExistentPlayer');
            
            const calls = mockSocket._getEmitCalls();
            expect(calls[0][0]).toBe('game:error');
            expect(calls[0][1].message).toBe('Player not found in game');
        });
    });

    describe('broadcastGameState', () => {
        test('should broadcast state to all players with socketId', () => {
            const game = processor.getGameState(gameId);
            const player1 = game.players[0];
            const player2 = game.players[1];
            
            player1.socketId = 'socket-123';
            player2.socketId = 'socket-456';
            
            const mockSocket2 = {
                id: 'socket-456',
                emit: function() {},
                _getEmitCalls: function() { return this._calls || []; }
            };
            mockSocket2._calls = [];
            mockSocket2.emit = function(...args) {
                this._calls.push(args);
            };
            
            const originalGetSocket = handler.getSocket;
            handler.getSocket = function(socketId) {
                if (socketId === 'socket-123') return mockSocket;
                if (socketId === 'socket-456') return mockSocket2;
                return null;
            };
            
            mockSocket._getEmitCalls().length = 0;
            
            handler.broadcastGameState(gameId);
            
            const calls1 = mockSocket._getEmitCalls();
            const calls2 = mockSocket2._getEmitCalls();
            expect(calls1.length).toBeGreaterThan(0);
            expect(calls1[0][0]).toBe('game:stateUpdate');
            expect(calls2.length).toBeGreaterThan(0);
            expect(calls2[0][0]).toBe('game:stateUpdate');
            
            handler.getSocket = originalGetSocket;
        });

        test('should not broadcast to players without socketId', () => {
            const game = processor.getGameState(gameId);
            game.players.forEach(p => p.socketId = null);
            
            mockSocket._getEmitCalls().length = 0;
            
            handler.broadcastGameState(gameId);
            
            const calls = mockSocket._getEmitCalls();
            expect(calls.length).toBe(0);
        });
    });

    describe('sendError', () => {
        test('should emit error event', () => {
            mockSocket._getEmitCalls().length = 0;
            
            handler.sendError(mockSocket, 'Test error');
            
            const calls = mockSocket._getEmitCalls();
            expect(calls.length).toBe(1);
            expect(calls[0][0]).toBe('game:error');
            expect(calls[0][1]).toEqual({
                message: 'Test error',
                code: 'ACTION_ERROR'
            });
        });
    });
});

