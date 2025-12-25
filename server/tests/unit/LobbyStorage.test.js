/**
 * Unit tests for LobbyStorage
 */

import { LobbyStorage } from '../../src/storage/LobbyStorage.js';

describe('LobbyStorage', () => {
    let storage;

    beforeEach(() => {
        storage = new LobbyStorage();
    });

    test('createLobby - should create a new lobby', () => {
        const lobby = storage.createLobby('HostPlayer', 'socket-123');
        
        expect(lobby).toBeDefined();
        expect(lobby.lobbyId).toBeDefined();
        expect(lobby.code).toMatch(/^\d{6}$/);
        expect(lobby.hostName).toBe('HostPlayer');
        expect(lobby.hostId).toBe('socket-123');
        expect(lobby.players).toHaveLength(1);
        expect(lobby.players[0].name).toBe('HostPlayer');
        expect(lobby.status).toBe('WAITING');
    });

    test('getLobby - should return lobby by ID', () => {
        const lobby = storage.createLobby('Host', 'socket-123');
        const retrieved = storage.getLobby(lobby.lobbyId);
        
        expect(retrieved).toBeDefined();
        expect(retrieved.lobbyId).toBe(lobby.lobbyId);
    });

    test('getLobbyByCode - should return lobby by code', () => {
        const lobby = storage.createLobby('Host', 'socket-123');
        const retrieved = storage.getLobbyByCode(lobby.code);
        
        expect(retrieved).toBeDefined();
        expect(retrieved.code).toBe(lobby.code);
    });

    test('addPlayer - should add player to lobby', () => {
        const lobby = storage.createLobby('Host', 'socket-123');
        const player = storage.addPlayer(lobby.lobbyId, 'NewPlayer', 'socket-456');
        
        expect(player).toBeDefined();
        expect(player.name).toBe('NewPlayer');
        expect(player.socketId).toBe('socket-456');
        
        const updatedLobby = storage.getLobby(lobby.lobbyId);
        expect(updatedLobby.players).toHaveLength(2);
    });

    test('addPlayer - should reject duplicate name', () => {
        const lobby = storage.createLobby('Host', 'socket-123');
        storage.addPlayer(lobby.lobbyId, 'NewPlayer', 'socket-456');
        const result = storage.addPlayer(lobby.lobbyId, 'NewPlayer', 'socket-789');
        
        expect(result).toBe(false);
    });

    test('addPlayer - should reject if lobby full', () => {
        const lobby = storage.createLobby('Host', 'socket-123');
        storage.addPlayer(lobby.lobbyId, 'P2', 'socket-2');
        storage.addPlayer(lobby.lobbyId, 'P3', 'socket-3');
        storage.addPlayer(lobby.lobbyId, 'P4', 'socket-4');
        const result = storage.addPlayer(lobby.lobbyId, 'P5', 'socket-5');
        
        expect(result).toBe(false);
    });

    test('removePlayer - should remove player from lobby', () => {
        const lobby = storage.createLobby('Host', 'socket-123');
        storage.addPlayer(lobby.lobbyId, 'Player2', 'socket-456');
        
        const result = storage.removePlayer(lobby.lobbyId, 'Player2');
        
        expect(result).toBe(true);
        const updatedLobby = storage.getLobby(lobby.lobbyId);
        expect(updatedLobby.players).toHaveLength(1);
    });

    test('removePlayer - should delete lobby if empty', () => {
        const lobby = storage.createLobby('Host', 'socket-123');
        storage.removePlayer(lobby.lobbyId, 'Host');
        
        expect(storage.getLobby(lobby.lobbyId)).toBeUndefined();
    });

    test('removePlayer - should assign new host if host leaves', () => {
        const lobby = storage.createLobby('Host', 'socket-123');
        storage.addPlayer(lobby.lobbyId, 'Player2', 'socket-456');
        
        storage.removePlayer(lobby.lobbyId, 'Host');
        
        const updatedLobby = storage.getLobby(lobby.lobbyId);
        expect(updatedLobby.hostName).toBe('Player2');
        expect(updatedLobby.hostId).toBe('socket-456');
    });

    test('setPlayerReady - should update ready status', () => {
        const lobby = storage.createLobby('Host', 'socket-123');
        
        const result = storage.setPlayerReady(lobby.lobbyId, 'Host', true);
        
        expect(result).toBe(true);
        expect(lobby.players[0].ready).toBe(true);
    });

    test('areAllPlayersReady - should return true when all ready', () => {
        const lobby = storage.createLobby('Host', 'socket-123');
        storage.addPlayer(lobby.lobbyId, 'Player2', 'socket-456');
        
        storage.setPlayerReady(lobby.lobbyId, 'Host', true);
        storage.setPlayerReady(lobby.lobbyId, 'Player2', true);
        
        expect(storage.areAllPlayersReady(lobby.lobbyId)).toBe(true);
    });

    test('areAllPlayersReady - should return false if not all ready', () => {
        const lobby = storage.createLobby('Host', 'socket-123');
        storage.addPlayer(lobby.lobbyId, 'Player2', 'socket-456');
        
        storage.setPlayerReady(lobby.lobbyId, 'Host', true);
        
        expect(storage.areAllPlayersReady(lobby.lobbyId)).toBe(false);
    });

    test('generateLobbyCode - should generate unique 6-digit codes', () => {
        const code1 = storage.generateLobbyCode();
        const code2 = storage.generateLobbyCode();
        
        expect(code1).toMatch(/^\d{6}$/);
        expect(code2).toMatch(/^\d{6}$/);
        // Codes should be different (very high probability)
        expect(code1).not.toBe(code2);
    });
});

