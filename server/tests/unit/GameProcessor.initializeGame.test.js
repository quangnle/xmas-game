/**
 * Unit tests for GameProcessor.initializeGame()
 */

import { GameProcessor } from '../../src/core/GameProcessor.js';
import { GameStorage } from '../../src/storage/GameStorage.js';
import { GRID_SIZE, NUM_TREASURES, NUM_GIFTS, NUM_KNIVES, NUM_SWORDS } from '../../src/config/gameConfig.js';

describe('GameProcessor - initializeGame', () => {
    let processor;
    let storage;

    beforeEach(() => {
        storage = new GameStorage();
        processor = new GameProcessor(storage);
    });

    test('should create game with correct structure', () => {
        const players = [
            { name: 'Player1' },
            { name: 'Player2' }
        ];
        
        const gameId = processor.initializeGame(players);
        const state = processor.getGameState(gameId);
        
        expect(state).toBeDefined();
        expect(state.gameId).toBe(gameId);
        expect(state.status).toBe('PLAYING');
        expect(state.turnState).toBe('IDLE');
        expect(state.players).toHaveLength(2);
        expect(state.grid).toHaveLength(GRID_SIZE);
        expect(state.grid[0]).toHaveLength(GRID_SIZE);
    });

    test('should initialize players correctly', () => {
        const players = [
            { name: 'Red' },
            { name: 'Blue' },
            { name: 'Green' }
        ];
        
        const gameId = processor.initializeGame(players);
        const state = processor.getGameState(gameId);
        
        expect(state.players).toHaveLength(3);
        expect(state.players[0].name).toBe('Red');
        expect(state.players[1].name).toBe('Blue');
        expect(state.players[2].name).toBe('Green');
        
        // Check player properties
        state.players.forEach((player, index) => {
            expect(player.id).toBe(`player-${index}`);
            expect(player.coins).toBe(0);
            expect(player.inventory).toEqual([]);
            expect(player.weapons).toEqual([]);
            expect(player.startPos).toBeDefined();
            expect(player.x).toBe(player.startPos.x);
            expect(player.y).toBe(player.startPos.y);
        });
    });

    test('should generate same map with same seed', () => {
        const players = [{ name: 'P1' }, { name: 'P2' }];
        const seed = 12345;
        
        const game1 = processor.initializeGame(players, seed);
        const game2 = processor.initializeGame(players, seed);
        
        const state1 = processor.getGameState(game1);
        const state2 = processor.getGameState(game2);
        
        // Grid should be identical
        expect(state1.grid).toEqual(state2.grid);
        
        // Items should be at same positions
        expect(state1.treasures.map(t => ({ x: t.x, y: t.y })))
            .toEqual(state2.treasures.map(t => ({ x: t.x, y: t.y })));
    });

    test('should generate different maps with different seeds', () => {
        const players = [{ name: 'P1' }, { name: 'P2' }];
        
        const game1 = processor.initializeGame(players, 11111);
        const game2 = processor.initializeGame(players, 22222);
        
        const state1 = processor.getGameState(game1);
        const state2 = processor.getGameState(game2);
        
        // Grids should be different
        expect(state1.grid).not.toEqual(state2.grid);
    });

    test('should place correct number of items', () => {
        const players = [{ name: 'P1' }, { name: 'P2' }];
        
        const gameId = processor.initializeGame(players);
        const state = processor.getGameState(gameId);
        
        expect(state.treasures).toHaveLength(NUM_TREASURES);
        expect(state.snowmen).toHaveLength(NUM_TREASURES);
        expect(state.gifts.length).toBeGreaterThanOrEqual(NUM_GIFTS - 5); // Allow some failures
        expect(state.weapons.filter(w => w.type === 'KNIFE').length).toBeGreaterThanOrEqual(NUM_KNIVES - 1);
        expect(state.weapons.filter(w => w.type === 'SWORD').length).toBeGreaterThanOrEqual(NUM_SWORDS - 1);
    });

    test('should not place items at same position', () => {
        const players = [{ name: 'P1' }, { name: 'P2' }];
        
        const gameId = processor.initializeGame(players);
        const state = processor.getGameState(gameId);
        
        // Check treasures don't overlap
        const treasurePositions = state.treasures.map(t => `${t.x},${t.y}`);
        expect(new Set(treasurePositions).size).toBe(treasurePositions.length);
        
        // Check snowmen don't overlap
        const snowmanPositions = state.snowmen.map(s => `${s.x},${s.y}`);
        expect(new Set(snowmanPositions).size).toBe(snowmanPositions.length);
    });

    test('should link snowmen to treasures correctly', () => {
        const players = [{ name: 'P1' }, { name: 'P2' }];
        
        const gameId = processor.initializeGame(players);
        const state = processor.getGameState(gameId);
        
        // Each snowman should have a valid treasure index
        state.snowmen.forEach(snowman => {
            expect(snowman.treasureIndex).toBeGreaterThanOrEqual(0);
            expect(snowman.treasureIndex).toBeLessThan(NUM_TREASURES);
            
            // Find corresponding treasure
            const treasure = state.treasures.find(t => t.index === snowman.treasureIndex);
            expect(treasure).toBeDefined();
        });
    });

    test('should throw error for invalid player count', () => {
        expect(() => {
            processor.initializeGame([{ name: 'P1' }]); // Only 1 player
        }).toThrow('Game must have 2-4 players');
        
        expect(() => {
            processor.initializeGame([
                { name: 'P1' }, { name: 'P2' }, { name: 'P3' },
                { name: 'P4' }, { name: 'P5' } // 5 players
            ]);
        }).toThrow('Game must have 2-4 players');
    });

    test('should support 2-4 players', () => {
        // Test 2 players
        const game2 = processor.initializeGame([{ name: 'P1' }, { name: 'P2' }]);
        expect(processor.getGameState(game2).players).toHaveLength(2);
        
        // Test 3 players
        const game3 = processor.initializeGame([{ name: 'P1' }, { name: 'P2' }, { name: 'P3' }]);
        expect(processor.getGameState(game3).players).toHaveLength(3);
        
        // Test 4 players
        const game4 = processor.initializeGame([
            { name: 'P1' }, { name: 'P2' }, { name: 'P3' }, { name: 'P4' }
        ]);
        expect(processor.getGameState(game4).players).toHaveLength(4);
    });

    test('should initialize treasures with correct values', () => {
        const players = [{ name: 'P1' }, { name: 'P2' }];
        
        const gameId = processor.initializeGame(players);
        const state = processor.getGameState(gameId);
        
        const treasureValues = state.treasures.map(t => t.value).sort((a, b) => a - b);
        expect(treasureValues).toEqual([100, 200, 500, 1000]);
        
        // All treasures should start as not found
        state.treasures.forEach(treasure => {
            expect(treasure.found).toBe(false);
        });
    });
});

