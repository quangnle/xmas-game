/**
 * Unit tests for LobbyHandler
 */

import { LobbyHandler } from '../../src/handlers/LobbyHandler.js';
import { LobbyStorage } from '../../src/storage/LobbyStorage.js';
import { GameProcessor } from '../../src/core/GameProcessor.js';
import { GameStorage } from '../../src/storage/GameStorage.js';

describe('LobbyHandler', () => {
    let handler;
    let lobbyStorage;
    let gameProcessor;
    let gameStorage;
    let mockSocket;
    let mockIO;

    beforeEach(() => {
        gameStorage = new GameStorage();
        gameProcessor = new GameProcessor(gameStorage);
        lobbyStorage = new LobbyStorage();
        
        // Mock socket
        mockSocket = {
            id: 'socket-123',
            emit: function() {},
            join: function() {},
            to: function() { return this; },
            leave: function() {}
        };
        
        const emitCalls = [];
        mockSocket.emit = function(...args) {
            emitCalls.push(args);
        };
        mockSocket._getEmitCalls = () => emitCalls;
        
        // Mock IO - to() returns an object with emit()
        const ioEmitCalls = [];
        const mockToObject = {
            emit: function(...args) {
                ioEmitCalls.push(args);
            }
        };
        
        mockIO = {
            to: function(room) {
                this._lastRoom = room;
                return mockToObject; // Return object with emit method
            },
            emit: function(...args) {
                ioEmitCalls.push(args);
            },
            _getEmitCalls: () => ioEmitCalls,
            _clearCalls: () => { ioEmitCalls.length = 0; }
        };
        
        handler = new LobbyHandler(lobbyStorage, gameProcessor, () => null, mockIO);
    });

    describe('handleCreateLobby', () => {
        test('should create lobby with valid host name', () => {
            mockSocket._getEmitCalls().length = 0;
            
            handler.handleCreateLobby(mockSocket, 'HostPlayer');
            
            const calls = mockSocket._getEmitCalls();
            expect(calls.length).toBeGreaterThan(0);
            expect(calls[0][0]).toBe('lobby:created');
            expect(calls[0][1].hostName).toBe('HostPlayer');
        });

        test('should reject invalid host name', () => {
            mockSocket._getEmitCalls().length = 0;
            
            handler.handleCreateLobby(mockSocket, '');
            
            const calls = mockSocket._getEmitCalls();
            expect(calls[0][0]).toBe('lobby:error');
        });
    });

    describe('handleJoinLobby', () => {
        let lobby;

        beforeEach(() => {
            lobby = lobbyStorage.createLobby('Host', 'socket-host');
        });

        test('should join lobby with valid code and name', () => {
            mockSocket._getEmitCalls().length = 0;
            if (mockIO._clearCalls) mockIO._clearCalls();
            
            handler.handleJoinLobby(mockSocket, lobby.code, 'NewPlayer');
            
            const calls = mockSocket._getEmitCalls();
            expect(calls.length).toBeGreaterThan(0);
            expect(calls[0][0]).toBe('lobby:joined');
            expect(calls[0][1].players).toHaveLength(2);
            
            // Verify player was added
            const updatedLobby = lobbyStorage.getLobby(lobby.lobbyId);
            expect(updatedLobby.players.some(p => p.name === 'NewPlayer')).toBe(true);
        });

        test('should reject invalid lobby code', () => {
            mockSocket._getEmitCalls().length = 0;
            
            handler.handleJoinLobby(mockSocket, 'invalid', 'NewPlayer');
            
            const calls = mockSocket._getEmitCalls();
            expect(calls[0][0]).toBe('lobby:error');
        });

        test('should reject invalid player name', () => {
            mockSocket._getEmitCalls().length = 0;
            
            handler.handleJoinLobby(mockSocket, lobby.code, '');
            
            const calls = mockSocket._getEmitCalls();
            expect(calls[0][0]).toBe('lobby:error');
        });

        test('should reject duplicate player name', () => {
            mockSocket._getEmitCalls().length = 0;
            
            handler.handleJoinLobby(mockSocket, lobby.code, 'Host');
            
            const calls = mockSocket._getEmitCalls();
            expect(calls[0][0]).toBe('lobby:error');
            expect(calls[0][1].message).toContain('already taken');
        });

        test('should reject non-existent lobby', () => {
            mockSocket._getEmitCalls().length = 0;
            
            handler.handleJoinLobby(mockSocket, '999999', 'NewPlayer');
            
            const calls = mockSocket._getEmitCalls();
            expect(calls[0][0]).toBe('lobby:error');
        });
    });

    describe('handleToggleReady', () => {
        let lobby;

        beforeEach(() => {
            lobby = lobbyStorage.createLobby('Host', 'socket-host');
        });

        test('should toggle ready status', () => {
            const initialReady = lobby.players[0].ready;
            
            handler.handleToggleReady(mockSocket, lobby.lobbyId, 'Host');
            
            const updatedLobby = lobbyStorage.getLobby(lobby.lobbyId);
            expect(updatedLobby.players[0].ready).toBe(!initialReady);
        });

        test('should reject if lobby not found', () => {
            mockSocket._getEmitCalls().length = 0;
            
            handler.handleToggleReady(mockSocket, 'non-existent', 'Host');
            
            const calls = mockSocket._getEmitCalls();
            expect(calls[0][0]).toBe('lobby:error');
        });
    });

    describe('handleStartGame', () => {
        let lobby;

        beforeEach(() => {
            lobby = lobbyStorage.createLobby('Host', 'socket-host');
            lobbyStorage.addPlayer(lobby.lobbyId, 'Player2', 'socket-2');
            lobbyStorage.setPlayerReady(lobby.lobbyId, 'Host', true);
            lobbyStorage.setPlayerReady(lobby.lobbyId, 'Player2', true);
        });

        test('should start game when host starts and all ready', () => {
            mockSocket._getEmitCalls().length = 0;
            if (mockIO._clearCalls) mockIO._clearCalls();
            
            handler.handleStartGame(mockSocket, lobby.lobbyId, 'Host');
            
            // Should not emit error
            const calls = mockSocket._getEmitCalls();
            const hasError = calls.some(c => c[0] === 'lobby:error');
            expect(hasError).toBe(false);
            
            // Check lobby was updated
            const updatedLobby = lobbyStorage.getLobby(lobby.lobbyId);
            expect(updatedLobby.status).toBe('IN_GAME');
            expect(updatedLobby.gameId).toBeDefined();
            
            // Check game was created
            const game = gameProcessor.getGameState(updatedLobby.gameId);
            expect(game).toBeDefined();
            expect(game.players).toHaveLength(2);
        });

        test('should reject if not host', () => {
            mockSocket._getEmitCalls().length = 0;
            
            handler.handleStartGame(mockSocket, lobby.lobbyId, 'Player2');
            
            const calls = mockSocket._getEmitCalls();
            expect(calls[0][0]).toBe('lobby:error');
            expect(calls[0][1].message).toContain('Only host');
        });

        test('should reject if not all players ready', () => {
            lobbyStorage.setPlayerReady(lobby.lobbyId, 'Player2', false);
            mockSocket._getEmitCalls().length = 0;
            
            handler.handleStartGame(mockSocket, lobby.lobbyId, 'Host');
            
            const calls = mockSocket._getEmitCalls();
            expect(calls[0][0]).toBe('lobby:error');
            expect(calls[0][1].message).toContain('All players must be ready');
        });

        test('should reject if less than 2 players', () => {
            const smallLobby = lobbyStorage.createLobby('SoloHost', 'socket-solo');
            // Set ready for solo player
            lobbyStorage.setPlayerReady(smallLobby.lobbyId, 'SoloHost', true);
            mockSocket._getEmitCalls().length = 0;
            
            handler.handleStartGame(mockSocket, smallLobby.lobbyId, 'SoloHost');
            
            const calls = mockSocket._getEmitCalls();
            expect(calls[0][0]).toBe('lobby:error');
            expect(calls[0][1].message).toContain('at least 2 players');
        });
    });

    describe('handleLeaveLobby', () => {
        let lobby;

        beforeEach(() => {
            lobby = lobbyStorage.createLobby('Host', 'socket-host');
            lobbyStorage.addPlayer(lobby.lobbyId, 'Player2', 'socket-2');
        });

        test('should remove player from lobby', () => {
            handler.handleLeaveLobby(mockSocket, lobby.lobbyId, 'Player2');
            
            const updatedLobby = lobbyStorage.getLobby(lobby.lobbyId);
            expect(updatedLobby.players).toHaveLength(1);
            expect(updatedLobby.players[0].name).toBe('Host');
        });

        test('should assign new host if host leaves', () => {
            handler.handleLeaveLobby(mockSocket, lobby.lobbyId, 'Host');
            
            const updatedLobby = lobbyStorage.getLobby(lobby.lobbyId);
            expect(updatedLobby.hostName).toBe('Player2');
        });
    });
});

