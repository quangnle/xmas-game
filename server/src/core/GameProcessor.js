/**
 * Game Processor - Pure Game Logic
 * NO UI, NO Network, NO Database
 */

import { GameStorage } from '../storage/GameStorage.js';
import { createInitialGameState } from './GameState.js';
import { createSeededRandom, generateSeed } from '../utils/random.js';
import {
    GRID_SIZE,
    TERRAIN_TYPES,
    TERRAIN_DISTRIBUTION,
    NUM_TREASURES,
    TREASURE_VALUES,
    NUM_GIFTS,
    GIFT_VALUE,
    NUM_KNIVES,
    NUM_SWORDS,
    START_POSITIONS,
    PLAYER_COLORS,
    GAME_STATES,
    WEAPONS
} from '../config/gameConfig.js';

/**
 * GameProcessor class - handles all game logic
 */
export class GameProcessor {
    /**
     * @param {GameStorage} storage - Game storage instance
     */
    constructor(storage) {
        this.storage = storage;
    }

    /**
     * Initialize a new game
     * @param {Array<{name: string}>} players - Array of player objects with name
     * @param {number} [seed] - Optional random seed
     * @returns {string} Game ID
     */
    initializeGame(players, seed = null) {
        if (!players || players.length < 2 || players.length > 4) {
            throw new Error('Game must have 2-4 players');
        }

        const gameId = `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const gameSeed = seed !== null ? seed : generateSeed();
        const random = createSeededRandom(gameSeed);

        const gameState = createInitialGameState(gameId, gameSeed);
        
        // Generate grid
        gameState.grid = this.generateGrid(random);
        
        // Initialize players
        gameState.players = this.initPlayers(players);
        
        // Place items
        this.placeTreasuresAndSnowmen(gameState, random);
        this.placeGifts(gameState, random);
        this.placeWeapons(gameState, random);
        
        // Set initial status
        gameState.status = 'PLAYING';
        gameState.turnState = 'IDLE';
        
        // Store game
        this.storage.createGame(gameId, gameState);
        
        return gameId;
    }

    /**
     * Generate terrain grid
     * @param {import('../utils/random.js').SeededRandom} random - Seeded random generator
     * @returns {number[][]} 40x40 grid
     */
    generateGrid(random) {
        const grid = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            const row = [];
            for (let x = 0; x < GRID_SIZE; x++) {
                const rand = random.next();
                let type = TERRAIN_TYPES.SNOW;
                
                if (rand > TERRAIN_DISTRIBUTION.ICE_THRESHOLD) {
                    type = TERRAIN_TYPES.TREE; // 10%
                } else if (rand > TERRAIN_DISTRIBUTION.SNOW_THRESHOLD) {
                    type = TERRAIN_TYPES.ICE; // 20%
                }
                // else SNOW (70%)
                
                row.push(type);
            }
            grid.push(row);
        }
        return grid;
    }

    /**
     * Initialize players
     * @param {Array<{name: string}>} players - Player data
     * @returns {Array} Array of player objects
     */
    initPlayers(players) {
        return players.map((p, index) => {
            const startPos = START_POSITIONS[index];
            return {
                id: `player-${index}`,
                name: p.name,
                color: PLAYER_COLORS[index],
                x: startPos.x,
                y: startPos.y,
                coins: 0,
                inventory: [],
                weapons: [],
                startPos: { ...startPos },
                socketId: null
            };
        });
    }

    /**
     * Check if position is occupied
     * @param {import('../core/GameState.js').GameState} gameState - Game state
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean}
     */
    isOccupied(gameState, x, y) {
        // Check players
        if (gameState.players.some(p => p.x === x && p.y === y)) return true;
        // Check treasures
        if (gameState.treasures.some(t => t.x === x && t.y === y)) return true;
        // Check snowmen
        if (gameState.snowmen.some(s => s.x === x && s.y === y)) return true;
        // Check gifts
        if (gameState.gifts.some(g => g.x === x && g.y === y)) return true;
        // Check weapons
        if (gameState.weapons.some(w => w.x === x && w.y === y)) return true;
        return false;
    }

    /**
     * Place treasures and snowmen
     * @param {import('../core/GameState.js').GameState} gameState - Game state
     * @param {import('../utils/random.js').SeededRandom} random - Seeded random generator
     */
    placeTreasuresAndSnowmen(gameState, random) {
        const MIN_DISTANCE = 5; // Minimum distance between items
        
        for (let i = 0; i < NUM_TREASURES; i++) {
            // Place treasure (not at corners, at least 2 cells from edge)
            let tx, ty;
            let attempts = 0;
            const maxAttempts = 1000;
            
            do {
                tx = Math.floor(random.next() * (GRID_SIZE - 4)) + 2;
                ty = Math.floor(random.next() * (GRID_SIZE - 4)) + 2;
                attempts++;
            } while (
                attempts < maxAttempts && 
                (this.isOccupied(gameState, tx, ty) ||
                 this.isTooCloseToStartPos(gameState, tx, ty, MIN_DISTANCE))
            );
            
            if (attempts >= maxAttempts) {
                // Fallback: place at first available position
                tx = 10 + i * 5;
                ty = 10 + i * 5;
            }
            
            gameState.treasures.push({
                x: tx,
                y: ty,
                value: TREASURE_VALUES[i],
                found: false,
                index: i
            });

            // Place snowman linked to this treasure (at least 5 cells away)
            let sx, sy;
            attempts = 0;
            
            do {
                sx = Math.floor(random.next() * GRID_SIZE);
                sy = Math.floor(random.next() * GRID_SIZE);
                attempts++;
            } while (
                attempts < maxAttempts && (
                    this.isOccupied(gameState, sx, sy) ||
                    (Math.abs(sx - tx) < MIN_DISTANCE && Math.abs(sy - ty) < MIN_DISTANCE)
                )
            );
            
            if (attempts >= maxAttempts) {
                sx = 5 + i * 8;
                sy = 5 + i * 8;
            }
            
            gameState.snowmen.push({ x: sx, y: sy, treasureIndex: i });
        }
    }

    /**
     * Place gifts on the map
     * @param {import('../core/GameState.js').GameState} gameState - Game state
     * @param {import('../utils/random.js').SeededRandom} random - Seeded random generator
     */
    placeGifts(gameState, random) {
        for (let i = 0; i < NUM_GIFTS; i++) {
            let gx, gy;
            let attempts = 0;
            const maxAttempts = 500;
            
            do {
                gx = Math.floor(random.next() * GRID_SIZE);
                gy = Math.floor(random.next() * GRID_SIZE);
                attempts++;
            } while (attempts < maxAttempts && this.isOccupied(gameState, gx, gy));
            
            if (attempts < maxAttempts) {
                gameState.gifts.push({ x: gx, y: gy });
            }
        }
    }

    /**
     * Place weapons on the map
     * @param {import('../core/GameState.js').GameState} gameState - Game state
     * @param {import('../utils/random.js').SeededRandom} random - Seeded random generator
     */
    placeWeapons(gameState, random) {
        // Place knives
        for (let i = 0; i < NUM_KNIVES; i++) {
            let wx, wy;
            let attempts = 0;
            const maxAttempts = 500;
            
            do {
                wx = Math.floor(random.next() * GRID_SIZE);
                wy = Math.floor(random.next() * GRID_SIZE);
                attempts++;
            } while (attempts < maxAttempts && this.isOccupied(gameState, wx, wy));
            
            if (attempts < maxAttempts) {
                gameState.weapons.push({ x: wx, y: wy, type: 'KNIFE' });
            }
        }
        
        // Place swords
        for (let i = 0; i < NUM_SWORDS; i++) {
            let wx, wy;
            let attempts = 0;
            const maxAttempts = 500;
            
            do {
                wx = Math.floor(random.next() * GRID_SIZE);
                wy = Math.floor(random.next() * GRID_SIZE);
                attempts++;
            } while (attempts < maxAttempts && this.isOccupied(gameState, wx, wy));
            
            if (attempts < maxAttempts) {
                gameState.weapons.push({ x: wx, y: wy, type: 'SWORD' });
            }
        }
    }

    /**
     * Check if position is too close to starting positions
     * @param {import('../core/GameState.js').GameState} gameState - Game state
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} minDist - Minimum distance
     * @returns {boolean}
     */
    isTooCloseToStartPos(gameState, x, y, minDist) {
        return gameState.players.some(p => {
            const dist = Math.abs(x - p.startPos.x) + Math.abs(y - p.startPos.y);
            return dist < minDist;
        });
    }

    /**
     * Get game state
     * @param {string} gameId - Game ID
     * @returns {import('../core/GameState.js').GameState|undefined} Game state
     */
    getGameState(gameId) {
        return this.storage.getGame(gameId);
    }

    /**
     * Check if it's player's turn
     * @param {string} gameId - Game ID
     * @param {string} playerName - Player name
     * @returns {boolean}
     */
    isPlayerTurn(gameId, playerName) {
        const game = this.storage.getGame(gameId);
        if (!game) return false;
        
        const player = game.players.find(p => p.name === playerName);
        if (!player) return false;
        
        const currentPlayer = game.players[game.currentPlayerIndex];
        return currentPlayer.name === playerName;
    }

    /**
     * Check if action can be performed
     * @param {string} gameId - Game ID
     * @param {string} playerName - Player name
     * @param {string} action - Action type
     * @returns {{canPerform: boolean, error?: string}}
     */
    canPerformAction(gameId, playerName, action) {
        const game = this.storage.getGame(gameId);
        if (!game) {
            return { canPerform: false, error: 'Game not found' };
        }
        
        const player = game.players.find(p => p.name === playerName);
        if (!player) {
            return { canPerform: false, error: 'Player not found' };
        }
        
        if (!this.isPlayerTurn(gameId, playerName)) {
            return { canPerform: false, error: 'Not your turn' };
        }
        
        // Additional validation based on action type
        if (action === 'MOVE' && game.turnState !== 'MOVE') {
            return { canPerform: false, error: 'Cannot move in current state' };
        }
        
        if (action === 'ROLL_DICE' && game.turnState !== 'IDLE') {
            return { canPerform: false, error: 'Cannot roll dice in current state' };
        }
        
        return { canPerform: true };
    }

    /**
     * Roll dice for current player
     * @param {string} gameId - Game ID
     * @param {string} playerName - Player name
     * @returns {{success: boolean, diceValue?: number, moves?: number, hasExtraTurn?: boolean, error?: string}}
     */
    rollDice(gameId, playerName) {
        const validation = this.canPerformAction(gameId, playerName, 'ROLL_DICE');
        if (!validation.canPerform) {
            return { success: false, error: validation.error };
        }

        const game = this.storage.getGame(gameId);
        const random = createSeededRandom(game.seed + Date.now()); // Add time for randomness
        
        // Roll 2 dice
        const d1 = random.randomInt(1, 6);
        const d2 = random.randomInt(1, 6);
        const diceValue = d1 + d2;
        
        // Update game state
        game.diceValue = diceValue;
        game.currentMoves = diceValue;
        game.turnState = 'MOVE';
        
        // Check for extra turn (6 or 12) - keep same logic for now
        game.hasExtraTurn = (diceValue === 6 || diceValue === 12);
        
        return {
            success: true,
            diceValue,
            moves: diceValue,
            hasExtraTurn: game.hasExtraTurn
        };
    }

    /**
     * Move player in a direction
     * @param {string} gameId - Game ID
     * @param {string} playerName - Player name
     * @param {string} direction - Direction 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
     * @returns {{success: boolean, newPos?: {x: number, y: number}, movesLeft?: number, events?: Array, error?: string}}
     */
    movePlayer(gameId, playerName, direction) {
        const validation = this.canPerformAction(gameId, playerName, 'MOVE');
        if (!validation.canPerform) {
            return { success: false, error: validation.error };
        }

        const game = this.storage.getGame(gameId);
        
        // Check if player has moves left
        if (game.currentMoves <= 0) {
            return { success: false, error: 'No moves left' };
        }

        const player = game.players.find(p => p.name === playerName);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }

        // Calculate new position based on direction
        const directionMap = {
            'UP': { dx: 0, dy: -1 },
            'DOWN': { dx: 0, dy: 1 },
            'LEFT': { dx: -1, dy: 0 },
            'RIGHT': { dx: 1, dy: 0 }
        };

        const dir = directionMap[direction];
        if (!dir) {
            return { success: false, error: 'Invalid direction' };
        }

        const nx = player.x + dir.dx;
        const ny = player.y + dir.dy;

        // Boundary check
        if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) {
            return { success: false, error: 'Out of bounds' };
        }

        // Cost check
        const cellCost = game.grid[ny][nx];
        if (game.currentMoves < cellCost) {
            return { success: false, error: 'Not enough moves' };
        }

        // Execute move
        game.currentMoves -= cellCost;
        player.x = nx;
        player.y = ny;

        // Check tile events
        const events = this.checkTileEvents(game, player);

        return {
            success: true,
            newPos: { x: nx, y: ny },
            movesLeft: game.currentMoves,
            events
        };
    }

    /**
     * Check events on current tile
     * @param {import('../core/GameState.js').GameState} game - Game state
     * @param {import('../core/GameState.js').Player} player - Player
     * @returns {Array} Array of events
     */
    checkTileEvents(game, player) {
        const events = [];

        // Check for gift
        const giftIdx = game.gifts.findIndex(g => g.x === player.x && g.y === player.y);
        if (giftIdx !== -1) {
            game.gifts.splice(giftIdx, 1);
            player.coins += GIFT_VALUE;
            events.push({ type: 'GIFT', value: GIFT_VALUE });
        }

        // Check for weapon
        const weaponIdx = game.weapons.findIndex(w => w.x === player.x && w.y === player.y);
        if (weaponIdx !== -1) {
            const weapon = game.weapons[weaponIdx];
            game.weapons.splice(weaponIdx, 1);
            if (!player.weapons) player.weapons = [];
            player.weapons.push(weapon.type);
            events.push({ type: 'WEAPON', weaponType: weapon.type });
        }

        // Check for snowman (get clue)
        const snowman = game.snowmen.find(s => s.x === player.x && s.y === player.y);
        if (snowman) {
            if (!player.inventory.includes(snowman.treasureIndex)) {
                player.inventory.push(snowman.treasureIndex);
                events.push({ type: 'CLUE', treasureIndex: snowman.treasureIndex });
            }
        }

        // Check for duel (another player)
        const enemy = game.players.find(ep => ep.id !== player.id && ep.x === player.x && ep.y === player.y);
        if (enemy) {
            // Start duel
            game.duelState = {
                player1: player.name,
                player2: enemy.name,
                player1Weapon: null,
                player2Weapon: null,
                player1Roll: null,
                player2Roll: null,
                phase: 'SELECT_WEAPON'
            };
            game.turnState = 'DUEL';
            events.push({ type: 'DUEL_START', enemy: enemy.name });
        }

        return events;
    }

    /**
     * Dig for treasure
     * @param {string} gameId - Game ID
     * @param {string} playerName - Player name
     * @returns {{success: boolean, found?: boolean, treasureValue?: number, coins?: number, error?: string}}
     */
    dig(gameId, playerName) {
        const game = this.storage.getGame(gameId);
        if (!game) {
            return { success: false, error: 'Game not found' };
        }

        if (!this.isPlayerTurn(gameId, playerName)) {
            return { success: false, error: 'Not your turn' };
        }

        if (game.turnState !== 'MOVE') {
            return { success: false, error: 'Cannot dig in current state' };
        }

        const player = game.players.find(p => p.name === playerName);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }

        const treasure = game.treasures.find(t => t.x === player.x && t.y === player.y);
        
        if (!treasure) {
            // Empty hole - consume all moves
            game.currentMoves = 0;
            return { success: true, found: false };
        }

        if (treasure.found) {
            // Already found - consume all moves
            game.currentMoves = 0;
            return { success: true, found: false, error: 'Treasure already found' };
        }

        if (!player.inventory.includes(treasure.index)) {
            // No clue - consume all moves
            game.currentMoves = 0;
            return { success: true, found: false, error: 'No clue for this treasure' };
        }

        // Success! Found treasure
        treasure.found = true;
        player.coins += treasure.value;
        
        // Remove treasure from map
        const treasureIdx = game.treasures.indexOf(treasure);
        game.treasures.splice(treasureIdx, 1);

        return {
            success: true,
            found: true,
            treasureValue: treasure.value,
            coins: player.coins
        };
    }

    /**
     * Skip to next turn
     * @param {string} gameId - Game ID
     * @param {string} playerName - Player name
     * @returns {{success: boolean, nextPlayerIndex?: number, error?: string}}
     */
    nextTurn(gameId, playerName) {
        const game = this.storage.getGame(gameId);
        if (!game) {
            return { success: false, error: 'Game not found' };
        }

        if (!this.isPlayerTurn(gameId, playerName)) {
            return { success: false, error: 'Not your turn' };
        }

        // Check for extra turn
        if (game.hasExtraTurn) {
            // Use extra turn - allow player to roll dice again
            game.hasExtraTurn = false;
            game.turnState = 'IDLE';
            game.diceValue = 0;
            game.currentMoves = 0;
            return { success: true, nextPlayerIndex: game.currentPlayerIndex };
        }

        // Normal turn end - move to next player
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        game.turnState = 'IDLE';
        game.diceValue = 0;
        game.currentMoves = 0;
        game.hasExtraTurn = false;

        return { success: true, nextPlayerIndex: game.currentPlayerIndex };
    }

    /**
     * Execute duel fight - server handles everything automatically
     * @param {string} gameId - Game ID
     * @param {string} playerName - Player name (must be the one in turn)
     * @returns {{success: boolean, winner?: string, loser?: string, coinTransfer?: number, p1Roll?: number, p2Roll?: number, p1Total?: number, p2Total?: number, p1Weapon?: string, p2Weapon?: string, error?: string}}
     */
    duelFight(gameId, playerName) {
        const game = this.storage.getGame(gameId);
        if (!game) {
            return { success: false, error: 'Game not found' };
        }

        if (!game.duelState) {
            return { success: false, error: 'No active duel' };
        }

        // Verify player is in turn and is player1 (attacker)
        const currentPlayer = game.players[game.currentPlayerIndex];
        if (!currentPlayer || currentPlayer.name !== playerName) {
            return { success: false, error: 'Not your turn' };
        }

        if (game.duelState.player1 !== playerName) {
            return { success: false, error: 'Only the attacker can initiate fight' };
        }

        const p1 = game.players.find(p => p.name === game.duelState.player1);
        const p2 = game.players.find(p => p.name === game.duelState.player2);

        if (!p1 || !p2) {
            return { success: false, error: 'Players not found' };
        }

        // Auto-select weapons (use first weapon if available, otherwise null)
        let p1Weapon = null;
        if (p1.weapons && p1.weapons.length > 0) {
            p1Weapon = p1.weapons[0];
        }

        let p2Weapon = null;
        if (p2.weapons && p2.weapons.length > 0) {
            p2Weapon = p2.weapons[0];
        }

        // Roll dice and resolve until there's a winner (no tie)
        const random = createSeededRandom(game.seed + Date.now() + Math.random());
        let p1Roll, p2Roll, p1Total, p2Total;
        let attempts = 0;
        const maxAttempts = 100; // Safety limit

        do {
            attempts++;
            if (attempts > maxAttempts) {
                return { success: false, error: 'Too many tie attempts' };
            }

            // Roll 2 dice for each player
            const p1d1 = random.randomInt(1, 6);
            const p1d2 = random.randomInt(1, 6);
            p1Roll = p1d1 + p1d2;

            const p2d1 = random.randomInt(1, 6);
            const p2d2 = random.randomInt(1, 6);
            p2Roll = p2d1 + p2d2;

            // Apply weapon bonuses
            const p1Bonus = p1Weapon ? WEAPONS[p1Weapon].bonus : 0;
            const p2Bonus = p2Weapon ? WEAPONS[p2Weapon].bonus : 0;
            p1Total = p1Roll + p1Bonus;
            p2Total = p2Roll + p2Bonus;

            // If tie, loop again (weapons are not consumed yet)
        } while (p1Total === p2Total);

        // Now we have a winner - resolve the duel
        if (p1Total > p2Total) {
            // Player 1 (attacker) wins
            // Consume weapons
            if (p1Weapon) {
                const weaponIndex = p1.weapons.indexOf(p1Weapon);
                if (weaponIndex !== -1) {
                    p1.weapons.splice(weaponIndex, 1);
                }
            }
            if (p2Weapon) {
                const weaponIndex = p2.weapons.indexOf(p2Weapon);
                if (weaponIndex !== -1) {
                    p2.weapons.splice(weaponIndex, 1);
                }
            }

            // Reset loser position
            p2.x = p2.startPos.x;
            p2.y = p2.startPos.y;

            // Transfer coins
            const coinsToTransfer = Math.min(100, p2.coins);
            p2.coins -= coinsToTransfer;
            p1.coins += coinsToTransfer;

            // End duel
            game.duelState = null;

            // If attacker has no moves left, set to IDLE
            if (game.currentMoves <= 0) {
                game.turnState = 'IDLE';
            } else {
                game.turnState = 'MOVE';
            }

            return {
                success: true,
                winner: p1.name,
                loser: p2.name,
                coinTransfer: coinsToTransfer,
                p1Roll: p1Roll,
                p2Roll: p2Roll,
                p1Total: p1Total,
                p2Total: p2Total,
                p1Weapon: p1Weapon,
                p2Weapon: p2Weapon
            };
        } else {
            // Player 2 (defender) wins
            // Consume weapons
            if (p1Weapon) {
                const weaponIndex = p1.weapons.indexOf(p1Weapon);
                if (weaponIndex !== -1) {
                    p1.weapons.splice(weaponIndex, 1);
                }
            }
            if (p2Weapon) {
                const weaponIndex = p2.weapons.indexOf(p2Weapon);
                if (weaponIndex !== -1) {
                    p2.weapons.splice(weaponIndex, 1);
                }
            }

            // Reset loser position (attacker loses)
            p1.x = p1.startPos.x;
            p1.y = p1.startPos.y;

            // Transfer coins
            const coinsToTransfer = Math.min(100, p1.coins);
            p1.coins -= coinsToTransfer;
            p2.coins += coinsToTransfer;

            // End duel
            game.duelState = null;
            game.currentMoves = 0;

            // Defender wins - attacker (p1) loses turn
            this.nextTurn(gameId, p1.name);

            return {
                success: true,
                winner: p2.name,
                loser: p1.name,
                coinTransfer: coinsToTransfer,
                p1Roll: p1Roll,
                p2Roll: p2Roll,
                p1Total: p1Total,
                p2Total: p2Total,
                p1Weapon: p1Weapon,
                p2Weapon: p2Weapon
            };
        }
    }

    /**
     * Select weapon for duel
     * @param {string} gameId - Game ID
     * @param {string} playerName - Player name
     * @param {string|null} weaponType - Weapon type 'KNIFE' | 'SWORD' | null
     * @returns {{success: boolean, error?: string}}
     */
    duelSelectWeapon(gameId, playerName, weaponType) {
        const game = this.storage.getGame(gameId);
        if (!game) {
            return { success: false, error: 'Game not found' };
        }

        if (!game.duelState) {
            return { success: false, error: 'No active duel' };
        }

        if (game.duelState.phase !== 'SELECT_WEAPON') {
            return { success: false, error: 'Cannot select weapon in current duel phase' };
        }

        // Check if player is in duel
        const isPlayer1 = game.duelState.player1 === playerName;
        const isPlayer2 = game.duelState.player2 === playerName;
        
        if (!isPlayer1 && !isPlayer2) {
            return { success: false, error: 'You are not in this duel' };
        }

        // If weaponType is null, that's fine (no weapon)
        if (weaponType === null) {
            if (isPlayer1) {
                game.duelState.player1Weapon = null;
            } else {
                game.duelState.player2Weapon = null;
            }
            return { success: true };
        }

        // Validate weapon type
        if (weaponType !== 'KNIFE' && weaponType !== 'SWORD') {
            return { success: false, error: 'Invalid weapon type' };
        }

        // Find player and check if they have the weapon
        const player = game.players.find(p => p.name === playerName);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }

        if (!player.weapons || !player.weapons.includes(weaponType)) {
            return { success: false, error: 'Player does not have this weapon' };
        }

        // Set weapon
        if (isPlayer1) {
            game.duelState.player1Weapon = weaponType;
        } else {
            game.duelState.player2Weapon = weaponType;
        }

        return { success: true };
    }

    /**
     * Roll dice in duel
     * @param {string} gameId - Game ID
     * @param {string} playerName - Player name
     * @returns {{success: boolean, roll?: number, total?: number, error?: string}}
     */
    duelRoll(gameId, playerName) {
        const game = this.storage.getGame(gameId);
        if (!game) {
            return { success: false, error: 'Game not found' };
        }

        if (!game.duelState) {
            return { success: false, error: 'No active duel' };
        }

        // Check if player is in duel
        const isPlayer1 = game.duelState.player1 === playerName;
        const isPlayer2 = game.duelState.player2 === playerName;
        
        if (!isPlayer1 && !isPlayer2) {
            return { success: false, error: 'You are not in this duel' };
        }

        // Check if it's time to roll (both weapons selected or phase is ROLLING)
        if (game.duelState.phase === 'SELECT_WEAPON') {
            // Auto-select null weapon if not selected yet
            if (game.duelState.player1Weapon === undefined) {
                game.duelState.player1Weapon = null;
            }
            if (game.duelState.player2Weapon === undefined) {
                game.duelState.player2Weapon = null;
            }
            
            // Move to ROLLING phase
            game.duelState.phase = 'ROLLING';
        }

        if (game.duelState.phase !== 'ROLLING') {
            return { success: false, error: 'Cannot roll in current duel phase' };
        }

        // Check if this player has already rolled
        if (isPlayer1 && game.duelState.player1Roll !== null) {
            return { success: false, error: 'You have already rolled' };
        }
        if (isPlayer2 && game.duelState.player2Roll !== null) {
            return { success: false, error: 'You have already rolled' };
        }

        // Roll 2 dice
        const random = createSeededRandom(game.seed + Date.now() + Math.random());
        const d1 = random.randomInt(1, 6);
        const d2 = random.randomInt(1, 6);
        const roll = d1 + d2;

        // Get weapon bonus
        const weaponType = isPlayer1 ? game.duelState.player1Weapon : game.duelState.player2Weapon;
        const bonus = weaponType ? WEAPONS[weaponType].bonus : 0;
        const total = roll + bonus;

        // Store roll
        if (isPlayer1) {
            game.duelState.player1Roll = roll;
        } else {
            game.duelState.player2Roll = roll;
        }

        // Check if both players have rolled
        if (game.duelState.player1Roll !== null && game.duelState.player2Roll !== null) {
            game.duelState.phase = 'RESOLVING';
        }

        return {
            success: true,
            roll,
            total,
            bonus,
            dice1: d1,
            dice2: d2
        };
    }

    /**
     * Resolve duel result
     * @param {string} gameId - Game ID
     * @param {string} playerName - Player name
     * @returns {{success: boolean, winner?: string, loser?: string, coinTransfer?: number, isTie?: boolean, error?: string}}
     */
    duelResolve(gameId, playerName) {
        const game = this.storage.getGame(gameId);
        if (!game) {
            return { success: false, error: 'Game not found' };
        }

        if (!game.duelState) {
            return { success: false, error: 'No active duel' };
        }

        if (game.duelState.phase !== 'RESOLVING') {
            return { success: false, error: 'Duel is not ready to resolve' };
        }

        // Check if player is in duel
        const isPlayer1 = game.duelState.player1 === playerName;
        const isPlayer2 = game.duelState.player2 === playerName;
        
        if (!isPlayer1 && !isPlayer2) {
            return { success: false, error: 'You are not in this duel' };
        }

        const p1 = game.players.find(p => p.name === game.duelState.player1);
        const p2 = game.players.find(p => p.name === game.duelState.player2);

        if (!p1 || !p2) {
            return { success: false, error: 'Players not found' };
        }

        // Calculate final totals
        const p1Bonus = game.duelState.player1Weapon ? WEAPONS[game.duelState.player1Weapon].bonus : 0;
        const p2Bonus = game.duelState.player2Weapon ? WEAPONS[game.duelState.player2Weapon].bonus : 0;
        const finalR1 = game.duelState.player1Roll + p1Bonus;
        const finalR2 = game.duelState.player2Roll + p2Bonus;

        // Store weapon types before resolving (for tie case)
        const p1Weapon = game.duelState.player1Weapon;
        const p2Weapon = game.duelState.player2Weapon;

        // Resolve result
        if (finalR1 > finalR2) {
            // Player 1 (attacker) wins
            // Consume weapons
            if (p1Weapon) {
                const weaponIndex = p1.weapons.indexOf(p1Weapon);
                if (weaponIndex !== -1) {
                    p1.weapons.splice(weaponIndex, 1);
                }
            }
            if (p2Weapon) {
                const weaponIndex = p2.weapons.indexOf(p2Weapon);
                if (weaponIndex !== -1) {
                    p2.weapons.splice(weaponIndex, 1);
                }
            }
            
            p2.x = p2.startPos.x;
            p2.y = p2.startPos.y;
            
            const coinsToTransfer = Math.min(100, p2.coins);
            p2.coins -= coinsToTransfer;
            p1.coins += coinsToTransfer;
            
            // End duel
            game.duelState = null;
            
            // If attacker has no moves left, set to IDLE
            if (game.currentMoves <= 0) {
                game.turnState = 'IDLE';
            } else {
                game.turnState = 'MOVE';
            }
            
            return {
                success: true,
                winner: p1.name,
                loser: p2.name,
                coinTransfer: coinsToTransfer,
                isTie: false
            };
        } else if (finalR2 > finalR1) {
            // Player 2 (defender) wins
            // Consume weapons
            if (p1Weapon) {
                const weaponIndex = p1.weapons.indexOf(p1Weapon);
                if (weaponIndex !== -1) {
                    p1.weapons.splice(weaponIndex, 1);
                }
            }
            if (p2Weapon) {
                const weaponIndex = p2.weapons.indexOf(p2Weapon);
                if (weaponIndex !== -1) {
                    p2.weapons.splice(weaponIndex, 1);
                }
            }
            
            p1.x = p1.startPos.x;
            p1.y = p1.startPos.y;
            
            const coinsToTransfer = Math.min(100, p1.coins);
            p1.coins -= coinsToTransfer;
            p2.coins += coinsToTransfer;
            
            // End duel
            game.duelState = null;
            game.currentMoves = 0;
            
            // Defender wins - attacker (p1) loses turn
            this.nextTurn(gameId, p1.name);
            
            return {
                success: true,
                winner: p2.name,
                loser: p1.name,
                coinTransfer: coinsToTransfer,
                isTie: false
            };
        } else {
            // Tie - consume weapons first, then reset for another roll
            if (p1Weapon) {
                const weaponIndex = p1.weapons.indexOf(p1Weapon);
                if (weaponIndex !== -1) {
                    p1.weapons.splice(weaponIndex, 1);
                }
            }
            if (p2Weapon) {
                const weaponIndex = p2.weapons.indexOf(p2Weapon);
                if (weaponIndex !== -1) {
                    p2.weapons.splice(weaponIndex, 1);
                }
            }
            
            // Reset for another roll
            game.duelState.player1Roll = null;
            game.duelState.player2Roll = null;
            game.duelState.player1Weapon = null;
            game.duelState.player2Weapon = null;
            game.duelState.phase = 'SELECT_WEAPON';
            
            return {
                success: true,
                isTie: true
            };
        }
    }
}

