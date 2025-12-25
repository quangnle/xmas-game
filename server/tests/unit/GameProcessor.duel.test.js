/**
 * Unit tests for GameProcessor duel methods
 */

import { GameProcessor } from '../../src/core/GameProcessor.js';
import { GameStorage } from '../../src/storage/GameStorage.js';
import { WEAPONS } from '../../src/config/gameConfig.js';

describe('GameProcessor - Duel Methods', () => {
    let processor;
    let storage;
    let gameId;
    let player1Name, player2Name;

    beforeEach(() => {
        storage = new GameStorage();
        processor = new GameProcessor(storage);
        
        // Create a game with 2 players
        player1Name = 'Player1';
        player2Name = 'Player2';
        gameId = processor.initializeGame([
            { name: player1Name },
            { name: player2Name }
        ]);
        
        // Start a duel by moving players to same position
        const game = processor.getGameState(gameId);
        const p1 = game.players.find(p => p.name === player1Name);
        const p2 = game.players.find(p => p.name === player2Name);
        
        // Roll dice for player1
        processor.rollDice(gameId, player1Name);
        
        // Move player1 to player2's position to trigger duel
        p1.x = p2.x;
        p1.y = p2.y;
        
        // Manually set duel state (normally done in checkTileEvents)
        game.duelState = {
            player1: player1Name,
            player2: player2Name,
            player1Weapon: null,
            player2Weapon: null,
            player1Roll: null,
            player2Roll: null,
            phase: 'SELECT_WEAPON'
        };
        game.turnState = 'DUEL';
    });

    describe('duelSelectWeapon', () => {
        test('should allow player to select weapon they have', () => {
            const game = processor.getGameState(gameId);
            const p1 = game.players.find(p => p.name === player1Name);
            p1.weapons = ['KNIFE', 'SWORD'];
            
            const result = processor.duelSelectWeapon(gameId, player1Name, 'KNIFE');
            
            expect(result.success).toBe(true);
            expect(game.duelState.player1Weapon).toBe('KNIFE');
        });

        test('should allow player to select null (no weapon)', () => {
            const result = processor.duelSelectWeapon(gameId, player1Name, null);
            
            expect(result.success).toBe(true);
            const game = processor.getGameState(gameId);
            expect(game.duelState.player1Weapon).toBe(null);
        });

        test('should reject weapon player does not have', () => {
            const game = processor.getGameState(gameId);
            const p1 = game.players.find(p => p.name === player1Name);
            p1.weapons = ['KNIFE']; // Only has KNIFE
            
            const result = processor.duelSelectWeapon(gameId, player1Name, 'SWORD');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('does not have');
        });

        test('should reject invalid weapon type', () => {
            const result = processor.duelSelectWeapon(gameId, player1Name, 'INVALID');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid weapon type');
        });

        test('should reject if not in duel', () => {
            const game = processor.getGameState(gameId);
            game.duelState = null;
            
            const result = processor.duelSelectWeapon(gameId, player1Name, 'KNIFE');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('No active duel');
        });

        test('should reject if wrong phase', () => {
            const game = processor.getGameState(gameId);
            game.duelState.phase = 'ROLLING';
            
            const result = processor.duelSelectWeapon(gameId, player1Name, 'KNIFE');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Cannot select weapon');
        });

        test('should allow both players to select weapons', () => {
            const game = processor.getGameState(gameId);
            const p1 = game.players.find(p => p.name === player1Name);
            const p2 = game.players.find(p => p.name === player2Name);
            p1.weapons = ['KNIFE'];
            p2.weapons = ['SWORD'];
            
            const result1 = processor.duelSelectWeapon(gameId, player1Name, 'KNIFE');
            const result2 = processor.duelSelectWeapon(gameId, player2Name, 'SWORD');
            
            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
            expect(game.duelState.player1Weapon).toBe('KNIFE');
            expect(game.duelState.player2Weapon).toBe('SWORD');
        });
    });

    describe('duelRoll', () => {
        beforeEach(() => {
            // Both players select weapons (or null)
            processor.duelSelectWeapon(gameId, player1Name, null);
            processor.duelSelectWeapon(gameId, player2Name, null);
        });

        test('should roll dice for player', () => {
            const result = processor.duelRoll(gameId, player1Name);
            
            expect(result.success).toBe(true);
            expect(result.roll).toBeGreaterThanOrEqual(2);
            expect(result.roll).toBeLessThanOrEqual(12);
            expect(result.total).toBe(result.roll); // No weapon bonus
            expect(result.dice1).toBeGreaterThanOrEqual(1);
            expect(result.dice1).toBeLessThanOrEqual(6);
            expect(result.dice2).toBeGreaterThanOrEqual(1);
            expect(result.dice2).toBeLessThanOrEqual(6);
        });

        test('should apply weapon bonus', () => {
            const game = processor.getGameState(gameId);
            const p1 = game.players.find(p => p.name === player1Name);
            p1.weapons = ['KNIFE'];
            
            processor.duelSelectWeapon(gameId, player1Name, 'KNIFE');
            processor.duelSelectWeapon(gameId, player2Name, null);
            
            const result = processor.duelRoll(gameId, player1Name);
            
            expect(result.success).toBe(true);
            expect(result.bonus).toBe(WEAPONS.KNIFE.bonus);
            expect(result.total).toBe(result.roll + WEAPONS.KNIFE.bonus);
        });

        test('should move to ROLLING phase when both weapons selected', () => {
            const game = processor.getGameState(gameId);
            
            expect(game.duelState.phase).toBe('SELECT_WEAPON');
            
            processor.duelRoll(gameId, player1Name);
            
            expect(game.duelState.phase).toBe('ROLLING');
        });

        test('should move to RESOLVING phase when both players rolled', () => {
            processor.duelRoll(gameId, player1Name);
            processor.duelRoll(gameId, player2Name);
            
            const game = processor.getGameState(gameId);
            expect(game.duelState.phase).toBe('RESOLVING');
        });

        test('should reject if player already rolled', () => {
            processor.duelRoll(gameId, player1Name);
            
            const result = processor.duelRoll(gameId, player1Name);
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('already rolled');
        });

        test('should reject if weapons not selected', () => {
            const game = processor.getGameState(gameId);
            game.duelState.phase = 'SELECT_WEAPON';
            game.duelState.player1Weapon = undefined;
            
            const result = processor.duelRoll(gameId, player1Name);
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('must select weapons first');
        });
    });

    describe('duelResolve', () => {
        beforeEach(() => {
            // Setup: both players select and roll
            processor.duelSelectWeapon(gameId, player1Name, null);
            processor.duelSelectWeapon(gameId, player2Name, null);
            processor.duelRoll(gameId, player1Name);
            processor.duelRoll(gameId, player2Name);
        });

        test('should resolve when player1 wins', () => {
            const game = processor.getGameState(gameId);
            // Force player1 to win by setting higher roll
            game.duelState.player1Roll = 10;
            game.duelState.player2Roll = 5;
            
            const result = processor.duelResolve(gameId, player1Name);
            
            expect(result.success).toBe(true);
            expect(result.winner).toBe(player1Name);
            expect(result.loser).toBe(player2Name);
            expect(result.isTie).toBe(false);
            
            // Check loser returned to start
            const p2 = game.players.find(p => p.name === player2Name);
            expect(p2.x).toBe(p2.startPos.x);
            expect(p2.y).toBe(p2.startPos.y);
            
            // Duel should be ended
            expect(game.duelState).toBe(null);
        });

        test('should resolve when player2 wins', () => {
            const game = processor.getGameState(gameId);
            // Force player2 to win
            game.duelState.player1Roll = 5;
            game.duelState.player2Roll = 10;
            
            const result = processor.duelResolve(gameId, player2Name);
            
            expect(result.success).toBe(true);
            expect(result.winner).toBe(player2Name);
            expect(result.loser).toBe(player1Name);
            expect(result.isTie).toBe(false);
            
            // Check loser returned to start
            const p1 = game.players.find(p => p.name === player1Name);
            expect(p1.x).toBe(p1.startPos.x);
            expect(p1.y).toBe(p1.startPos.y);
            
            // Attacker should lose turn
            expect(game.currentMoves).toBe(0);
        });

        test('should transfer coins when winner wins', () => {
            const game = processor.getGameState(gameId);
            const p1 = game.players.find(p => p.name === player1Name);
            const p2 = game.players.find(p => p.name === player2Name);
            
            p1.coins = 50;
            p2.coins = 150;
            
            // Force player1 to win
            game.duelState.player1Roll = 10;
            game.duelState.player2Roll = 5;
            
            const result = processor.duelResolve(gameId, player1Name);
            
            expect(result.coinTransfer).toBe(100); // min(100, 150)
            expect(p1.coins).toBe(150); // 50 + 100
            expect(p2.coins).toBe(50); // 150 - 100
        });

        test('should transfer all coins if loser has less than 100', () => {
            const game = processor.getGameState(gameId);
            const p1 = game.players.find(p => p.name === player1Name);
            const p2 = game.players.find(p => p.name === player2Name);
            
            p1.coins = 50;
            p2.coins = 75; // Less than 100
            
            game.duelState.player1Roll = 10;
            game.duelState.player2Roll = 5;
            
            const result = processor.duelResolve(gameId, player1Name);
            
            expect(result.coinTransfer).toBe(75);
            expect(p1.coins).toBe(125); // 50 + 75
            expect(p2.coins).toBe(0); // 75 - 75
        });

        test('should handle tie - reset for another roll', () => {
            const game = processor.getGameState(gameId);
            // Force tie
            game.duelState.player1Roll = 7;
            game.duelState.player2Roll = 7;
            
            const result = processor.duelResolve(gameId, player1Name);
            
            expect(result.success).toBe(true);
            expect(result.isTie).toBe(true);
            
            // Duel should reset but not end
            expect(game.duelState).not.toBe(null);
            expect(game.duelState.phase).toBe('SELECT_WEAPON');
            expect(game.duelState.player1Roll).toBe(null);
            expect(game.duelState.player2Roll).toBe(null);
        });

        test('should consume weapons even on tie', () => {
            // Reset duel state
            const game = processor.getGameState(gameId);
            game.duelState = {
                player1: player1Name,
                player2: player2Name,
                player1Weapon: null,
                player2Weapon: null,
                player1Roll: null,
                player2Roll: null,
                phase: 'SELECT_WEAPON'
            };
            
            // Set weapons
            const p1 = game.players.find(p => p.name === player1Name);
            const p2 = game.players.find(p => p.name === player2Name);
            p1.weapons = ['KNIFE'];
            p2.weapons = ['SWORD'];
            
            // Select weapons
            processor.duelSelectWeapon(gameId, player1Name, 'KNIFE');
            processor.duelSelectWeapon(gameId, player2Name, 'SWORD');
            
            // Roll and tie
            processor.duelRoll(gameId, player1Name);
            processor.duelRoll(gameId, player2Name);
            
            // Force tie
            game.duelState.player1Roll = 7;
            game.duelState.player2Roll = 7;
            
            // Resolve
            processor.duelResolve(gameId, player1Name);
            
            // Get fresh references after resolve
            const gameAfter = processor.getGameState(gameId);
            const p1After = gameAfter.players.find(p => p.name === player1Name);
            const p2After = gameAfter.players.find(p => p.name === player2Name);
            
            // Weapons should be consumed
            expect(p1After.weapons).not.toContain('KNIFE');
            expect(p2After.weapons).not.toContain('SWORD');
        });

        test('should reject if not in RESOLVING phase', () => {
            const game = processor.getGameState(gameId);
            game.duelState.phase = 'SELECT_WEAPON';
            
            const result = processor.duelResolve(gameId, player1Name);
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('not ready to resolve');
        });

        test('should set turn state correctly when attacker wins with moves left', () => {
            const game = processor.getGameState(gameId);
            game.currentMoves = 5;
            game.duelState.player1Roll = 10;
            game.duelState.player2Roll = 5;
            
            processor.duelResolve(gameId, player1Name);
            
            expect(game.turnState).toBe('MOVE');
            expect(game.currentMoves).toBe(5);
        });

        test('should set turn state to IDLE when attacker wins with no moves', () => {
            const game = processor.getGameState(gameId);
            game.currentMoves = 0;
            game.duelState.player1Roll = 10;
            game.duelState.player2Roll = 5;
            
            processor.duelResolve(gameId, player1Name);
            
            expect(game.turnState).toBe('IDLE');
        });
    });
});

