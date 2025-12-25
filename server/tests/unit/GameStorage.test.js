/**
 * Unit tests for GameStorage
 */

import { GameStorage } from '../../src/storage/GameStorage.js';
import { createInitialGameState } from '../../src/core/GameState.js';

describe('GameStorage', () => {
    let storage;

    beforeEach(() => {
        storage = new GameStorage();
    });

    test('createGame - should create a new game', () => {
        const gameId = 'test-game-1';
        const gameState = createInitialGameState(gameId, 12345);
        
        const result = storage.createGame(gameId, gameState);
        
        expect(result).toBe(true);
        expect(storage.hasGame(gameId)).toBe(true);
    });

    test('createGame - should not create duplicate game', () => {
        const gameId = 'test-game-1';
        const gameState1 = createInitialGameState(gameId, 12345);
        const gameState2 = createInitialGameState(gameId, 67890);
        
        storage.createGame(gameId, gameState1);
        const result = storage.createGame(gameId, gameState2);
        
        expect(result).toBe(false);
        expect(storage.getGame(gameId).seed).toBe(12345);
    });

    test('getGame - should return game state', () => {
        const gameId = 'test-game-1';
        const gameState = createInitialGameState(gameId, 12345);
        
        storage.createGame(gameId, gameState);
        const retrieved = storage.getGame(gameId);
        
        expect(retrieved).toBeDefined();
        expect(retrieved.gameId).toBe(gameId);
        expect(retrieved.seed).toBe(12345);
    });

    test('getGame - should return undefined for non-existent game', () => {
        const retrieved = storage.getGame('non-existent');
        
        expect(retrieved).toBeUndefined();
    });

    test('updateGame - should update game state', () => {
        const gameId = 'test-game-1';
        const gameState = createInitialGameState(gameId, 12345);
        
        storage.createGame(gameId, gameState);
        const result = storage.updateGame(gameId, { status: 'PLAYING', currentPlayerIndex: 1 });
        
        expect(result).toBe(true);
        const updated = storage.getGame(gameId);
        expect(updated.status).toBe('PLAYING');
        expect(updated.currentPlayerIndex).toBe(1);
    });

    test('updateGame - should return false for non-existent game', () => {
        const result = storage.updateGame('non-existent', { status: 'PLAYING' });
        
        expect(result).toBe(false);
    });

    test('deleteGame - should delete game', () => {
        const gameId = 'test-game-1';
        const gameState = createInitialGameState(gameId, 12345);
        
        storage.createGame(gameId, gameState);
        const result = storage.deleteGame(gameId);
        
        expect(result).toBe(true);
        expect(storage.hasGame(gameId)).toBe(false);
    });

    test('deleteGame - should return false for non-existent game', () => {
        const result = storage.deleteGame('non-existent');
        
        expect(result).toBe(false);
    });

    test('getAllGames - should return all games', () => {
        const game1 = createInitialGameState('game-1', 111);
        const game2 = createInitialGameState('game-2', 222);
        
        storage.createGame('game-1', game1);
        storage.createGame('game-2', game2);
        
        const allGames = storage.getAllGames();
        
        expect(allGames).toHaveLength(2);
        expect(allGames.some(g => g.gameId === 'game-1')).toBe(true);
        expect(allGames.some(g => g.gameId === 'game-2')).toBe(true);
    });

    test('getGameCount - should return correct count', () => {
        expect(storage.getGameCount()).toBe(0);
        
        storage.createGame('game-1', createInitialGameState('game-1', 111));
        expect(storage.getGameCount()).toBe(1);
        
        storage.createGame('game-2', createInitialGameState('game-2', 222));
        expect(storage.getGameCount()).toBe(2);
        
        storage.deleteGame('game-1');
        expect(storage.getGameCount()).toBe(1);
    });
});

