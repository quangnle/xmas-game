/**
 * Main Game Class
 * Manages game state, rendering, and game logic
 */

import {
    GRID_SIZE,
    CELL_SIZE,
    COLORS,
    TERRAIN_TYPES,
    TERRAIN_DISTRIBUTION,
    PLAYERS_CONFIG,
    TREASURE_VALUES,
    NUM_TREASURES,
    NUM_GIFTS,
    GIFT_VALUE,
    GAME_STATES,
    DICE_CONFIG,
    SNAPSHOT_CONFIG,
    CAMERA_CONFIG,
    WEAPONS,
    NUM_KNIVES,
    NUM_SWORDS
} from './config.js';

import { $, showModal, rollDie } from './utils.js';

/**
 * Game Class
 */
export class Game {
    constructor() {
        // Canvas setup
        this.canvas = $('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.grid = [];
        this.players = [];
        this.currentPlayerIndex = 0;
        this.diceValue = 0;
        this.currentMoves = 0;
        this.state = GAME_STATES.IDLE;
        this.camera = { x: 0, y: 0 };
        this.hasExtraTurn = false; // Flag for extra turn when rolling 6 or 12
        
        // Mouse drag state for panning
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.cameraFollowEnabled = true; // Enable camera auto-follow by default
        
        // Animation time for effects
        this.animationTime = 0;
        
        // Game objects
        this.snowmen = [];      // {x, y, treasureIndex}
        this.treasures = [];    // {x, y, value, found, index}
        this.gifts = [];        // {x, y}
        this.weapons = [];      // {x, y, type: 'KNIFE' | 'SWORD'}
        
        this.initializeCanvas();
        this.init();
        this.setupControls();
        this.setupMousePan();
        this.loop();
    }

    /**
     * Initialize canvas size and resize handler
     */
    initializeCanvas() {
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
    }

    /**
     * Resize canvas to fit container
     */
    resizeCanvas() {
        if (!this.canvas) return;
        const container = $('gameContainer');
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            this.render();
        }
    }

    /**
     * Initialize game data
     */
    init() {
        this.generateGrid();
        this.initPlayers();
        this.placeTreasuresAndSnowmen();
        this.placeGifts();
        this.placeWeapons();
        
        this.updateUI();
        // Start with map fit to screen instead of centering on player at corner
        this.fitMapToScreen();
    }

    /**
     * Generate terrain grid
     */
    generateGrid() {
        this.grid = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            const row = [];
            for (let x = 0; x < GRID_SIZE; x++) {
                const rand = Math.random();
                let type = TERRAIN_TYPES.SNOW;
                
                if (rand > TERRAIN_DISTRIBUTION.ICE_THRESHOLD) {
                    type = TERRAIN_TYPES.TREE; // 10%
                } else if (rand > TERRAIN_DISTRIBUTION.SNOW_THRESHOLD) {
                    type = TERRAIN_TYPES.ICE; // 20%
                }
                // else SNOW (70%)
                
                row.push(type);
            }
            this.grid.push(row);
        }
    }

    /**
     * Initialize players
     */
    initPlayers() {
        this.players = PLAYERS_CONFIG.map(p => ({
            ...p,
            coins: 0,
            inventory: [], // IDs of treasures clue found
            weapons: [], // Array of weapon types: ['KNIFE', 'SWORD', etc.]
            startPos: { x: p.x, y: p.y }
        }));
    }

    /**
     * Place treasures and their associated snowmen
     */
    placeTreasuresAndSnowmen() {
        for (let i = 0; i < NUM_TREASURES; i++) {
            // Place treasure (not at corners)
            let tx, ty;
            do {
                tx = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
                ty = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
            } while (this.isOccupied(tx, ty));
            
            this.treasures.push({
                x: tx,
                y: ty,
                value: TREASURE_VALUES[i],
                found: false,
                index: i
            });

            // Place snowman linked to this treasure (at least 5 cells away)
            let sx, sy;
            do {
                sx = Math.floor(Math.random() * GRID_SIZE);
                sy = Math.floor(Math.random() * GRID_SIZE);
            } while (
                this.isOccupied(sx, sy) ||
                (Math.abs(sx - tx) < 5 && Math.abs(sy - ty) < 5)
            );
            
            this.snowmen.push({ x: sx, y: sy, treasureIndex: i });
        }
    }

    /**
     * Place gifts on the map
     */
    placeGifts() {
        for (let i = 0; i < NUM_GIFTS; i++) {
            let gx, gy;
            do {
                gx = Math.floor(Math.random() * GRID_SIZE);
                gy = Math.floor(Math.random() * GRID_SIZE);
            } while (this.isOccupied(gx, gy));
            
            this.gifts.push({ x: gx, y: gy });
        }
    }

    /**
     * Place weapons on the map
     */
    placeWeapons() {
        // Place knives
        for (let i = 0; i < NUM_KNIVES; i++) {
            let wx, wy;
            do {
                wx = Math.floor(Math.random() * GRID_SIZE);
                wy = Math.floor(Math.random() * GRID_SIZE);
            } while (this.isOccupied(wx, wy));
            
            this.weapons.push({ x: wx, y: wy, type: 'KNIFE' });
        }
        
        // Place swords
        for (let i = 0; i < NUM_SWORDS; i++) {
            let wx, wy;
            do {
                wx = Math.floor(Math.random() * GRID_SIZE);
                wy = Math.floor(Math.random() * GRID_SIZE);
            } while (this.isOccupied(wx, wy));
            
            this.weapons.push({ x: wx, y: wy, type: 'SWORD' });
        }
    }

    /**
     * Place weapons on the map
     */
    placeWeapons() {
        // Place knives
        for (let i = 0; i < NUM_KNIVES; i++) {
            let wx, wy;
            do {
                wx = Math.floor(Math.random() * GRID_SIZE);
                wy = Math.floor(Math.random() * GRID_SIZE);
            } while (this.isOccupied(wx, wy));
            
            this.weapons.push({ x: wx, y: wy, type: 'KNIFE' });
        }
        
        // Place swords
        for (let i = 0; i < NUM_SWORDS; i++) {
            let wx, wy;
            do {
                wx = Math.floor(Math.random() * GRID_SIZE);
                wy = Math.floor(Math.random() * GRID_SIZE);
            } while (this.isOccupied(wx, wy));
            
            this.weapons.push({ x: wx, y: wy, type: 'SWORD' });
        }
    }

    /**
     * Check if a position is occupied
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean}
     */
    isOccupied(x, y) {
        if (this.players.some(p => p.x === x && p.y === y)) return true;
        if (this.treasures.some(t => t.x === x && t.y === y)) return true;
        if (this.snowmen.some(s => s.x === x && s.y === y)) return true;
        if (this.gifts.some(g => g.x === x && g.y === y)) return true;
        if (this.weapons.some(w => w.x === x && w.y === y)) return true;
        return false;
    }

    /**
     * Setup control handlers
     */
    setupControls() {
        // D-Pad controls
        $('btnUp').onclick = () => this.movePlayer(0, -1);
        $('btnDown').onclick = () => this.movePlayer(0, 1);
        $('btnLeft').onclick = () => this.movePlayer(-1, 0);
        $('btnRight').onclick = () => this.movePlayer(1, 0);

        // Action buttons
        $('rollBtn').onclick = () => this.rollDice();
        $('digBtn').onclick = () => this.dig();
        $('skipBtn').onclick = () => this.skipTurn();
        
        // Inventory buttons
        $('inventoryBtn').onclick = () => this.toggleInventory();
        $('closeInventoryBtn').onclick = () => this.toggleInventory();

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (this.state !== GAME_STATES.MOVE) return;
            
            const keyMap = {
                'ArrowUp': () => this.movePlayer(0, -1),
                'ArrowDown': () => this.movePlayer(0, 1),
                'ArrowLeft': () => this.movePlayer(-1, 0),
                'ArrowRight': () => this.movePlayer(1, 0)
            };
            
            if (keyMap[e.key]) {
                keyMap[e.key]();
            }
        });
    }

    /**
     * Setup mouse drag to pan camera
     */
    setupMousePan() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.cameraFollowEnabled = false; // Disable auto-follow when manually panning
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
            e.preventDefault();
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                
                // Move camera in opposite direction of mouse movement
                this.camera.x -= deltaX;
                this.camera.y -= deltaY;
                
                // Clamp camera to bounds
                this.clampCamera();
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                e.preventDefault();
            } else {
                // Change cursor on hover when not dragging
                this.canvas.style.cursor = 'grab';
            }
        });

        const handleMouseUp = () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.canvas.style.cursor = 'grab';
            }
        };

        this.canvas.addEventListener('mouseup', handleMouseUp);
        
        // Also handle mouseup outside canvas
        document.addEventListener('mouseup', handleMouseUp);

        this.canvas.addEventListener('mouseleave', () => {
            if (this.isDragging) {
                this.isDragging = false;
            }
            this.canvas.style.cursor = 'default';
        });

        // Touch support for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.isDragging = true;
                this.cameraFollowEnabled = false; // Disable auto-follow when manually panning
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                e.preventDefault();
            }
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (this.isDragging && e.touches.length === 1) {
                const deltaX = e.touches[0].clientX - touchStartX;
                const deltaY = e.touches[0].clientY - touchStartY;
                
                this.camera.x -= deltaX;
                this.camera.y -= deltaY;
                
                this.clampCamera();
                
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                e.preventDefault();
            }
        });

        this.canvas.addEventListener('touchend', () => {
            this.isDragging = false;
        });

        // Also handle touch cancel
        this.canvas.addEventListener('touchcancel', () => {
            this.isDragging = false;
        });
    }

    /**
     * Roll dice
     */
    rollDice() {
        if (this.state !== GAME_STATES.IDLE) return;
        
        $('rollBtn').disabled = true;
        $('rollBtn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rolling...';
        
        // Animation effect
        let count = 0;
        const interval = setInterval(() => {
            const tempVal = Math.floor(Math.random() * 11) + 2; // 2-12
            $('diceValue').innerText = tempVal;
            count++;
            
            if (count > DICE_CONFIG.ANIMATION_ITERATIONS) {
                clearInterval(interval);
                this.finishRoll();
            }
        }, DICE_CONFIG.ANIMATION_INTERVAL);
    }

    /**
     * Finish dice roll and set moves
     */
    finishRoll() {
        const d1 = rollDie();
        const d2 = rollDie();
        this.diceValue = d1 + d2;
        this.currentMoves = this.diceValue;
        
        $('diceValue').innerText = this.diceValue;
        $('movesLeft').innerText = this.currentMoves;
        
        // Check for extra turn (6 or 12)
        if (this.diceValue === 6 || this.diceValue === 12) {
            this.hasExtraTurn = true;
            this.showToast(`🎉 Rolled ${this.diceValue}! You get an extra turn!`);
        } else {
            this.hasExtraTurn = false;
        }
        
        this.state = GAME_STATES.MOVE;
        this.updateButtons();
        $('rollBtn').innerHTML = 'ROLLED';
        $('rollBtn').classList.add('opacity-50', 'cursor-not-allowed');
    }

    /**
     * Move player
     * @param {number} dx - X direction (-1, 0, 1)
     * @param {number} dy - Y direction (-1, 0, 1)
     */
    movePlayer(dx, dy) {
        if (this.state !== GAME_STATES.MOVE) return;
        
        // Check if player has moves left (prevent moving after digging empty hole)
        if (this.currentMoves <= 0) {
            return; // No moves left
        }

        const p = this.players[this.currentPlayerIndex];
        const nx = p.x + dx;
        const ny = p.y + dy;

        // Boundary check
        if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) return;

        // Cost check
        const cellCost = this.grid[ny][nx];
        if (this.currentMoves < cellCost) {
            return; // Not enough moves
        }

        // Execute move
        this.currentMoves -= cellCost;
        p.x = nx;
        p.y = ny;
        
        $('movesLeft').innerText = this.currentMoves;
        this.centerCameraOnPlayer();
        this.checkTileEvents();
        this.updateButtons();
    }

    /**
     * Check events on current tile
     */
    checkTileEvents() {
        const p = this.players[this.currentPlayerIndex];

        // Check for gift
        const giftIdx = this.gifts.findIndex(g => g.x === p.x && g.y === p.y);
        if (giftIdx !== -1) {
            this.gifts.splice(giftIdx, 1);
            p.coins += GIFT_VALUE;
            this.showToast(`+${GIFT_VALUE} Coins! 💰`);
            this.updateUI();
        }

        // Check for weapon
        const weaponIdx = this.weapons.findIndex(w => w.x === p.x && w.y === p.y);
        if (weaponIdx !== -1) {
            const weapon = this.weapons[weaponIdx];
            this.weapons.splice(weaponIdx, 1);
            if (!p.weapons) p.weapons = [];
            p.weapons.push(weapon.type);
            this.showToast(`Picked up ${WEAPONS[weapon.type].emoji} ${WEAPONS[weapon.type].name}! +${WEAPONS[weapon.type].bonus} in duels!`);
            this.updateUI();
        }

        // Check for snowman (get clue)
        const snowman = this.snowmen.find(s => s.x === p.x && s.y === p.y);
        if (snowman) {
            if (!p.inventory.includes(snowman.treasureIndex)) {
                p.inventory.push(snowman.treasureIndex);
                this.showClueModal(snowman.treasureIndex);
            } else {
                this.showToast("You already have this clue!");
            }
        }

        // Check for duel (another player)
        const enemy = this.players.find(ep => ep.id !== p.id && ep.x === p.x && ep.y === p.y);
        if (enemy) {
            this.startDuel(p, enemy);
        }
    }

    /**
     * Show toast message
     * @param {string} msg - Message to display
     */
    showToast(msg) {
        const div = document.createElement('div');
        div.className = 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-black font-bold px-6 py-3 rounded-full shadow-xl z-40 animate-bounce';
        div.innerHTML = msg;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 2000);
    }

    /**
     * Start duel between two players
     * @param {Object} p1 - Player 1
     * @param {Object} p2 - Player 2
     */
    startDuel(p1, p2) {
        this.state = GAME_STATES.DUEL;
        this.duelP1 = p1;
        this.duelP2 = p2;
        this.duelP1Weapon = null;
        this.duelP2Weapon = null;
        
        $('duelModal').classList.remove('hidden');
        $('duelP1Avatar').style.borderColor = p1.color;
        $('duelP2Avatar').style.borderColor = p2.color;
        $('duelP1Avatar').innerText = `P${p1.id + 1}`;
        $('duelP2Avatar').innerText = `P${p2.id + 1}`;
        
        // Setup weapon selection UI
        this.setupDuelWeapons(p1, p2);
        
        $('duelRollBtn').onclick = () => {
            const r1 = rollDie();
            const r2 = rollDie();
            
            // Apply weapon bonuses
            const p1Bonus = this.duelP1Weapon ? WEAPONS[this.duelP1Weapon].bonus : 0;
            const p2Bonus = this.duelP2Weapon ? WEAPONS[this.duelP2Weapon].bonus : 0;
            
            const finalR1 = r1 + p1Bonus;
            const finalR2 = r2 + p2Bonus;
            
            $('duelResult1').innerText = `${r1}${p1Bonus > 0 ? `+${p1Bonus}` : ''} = ${finalR1}`;
            $('duelResult2').innerText = `${r2}${p2Bonus > 0 ? `+${p2Bonus}` : ''} = ${finalR2}`;
            
            setTimeout(() => {
                this.resolveDuel(p1, p2, finalR1, finalR2);
            }, 1000);
        };
    }

    /**
     * Setup weapon selection for duel
     */
    setupDuelWeapons(p1, p2) {
        // Create weapon selection containers if they don't exist
        let p1WeaponDiv = document.getElementById('duelP1Weapon');
        let p2WeaponDiv = document.getElementById('duelP2Weapon');
        
        if (!p1WeaponDiv) {
            p1WeaponDiv = document.createElement('div');
            p1WeaponDiv.id = 'duelP1Weapon';
            p1WeaponDiv.className = 'mb-2';
            $('duelP1Avatar').parentElement.appendChild(p1WeaponDiv);
        }
        
        if (!p2WeaponDiv) {
            p2WeaponDiv = document.createElement('div');
            p2WeaponDiv.id = 'duelP2Weapon';
            p2WeaponDiv.className = 'mb-2';
            $('duelP2Avatar').parentElement.appendChild(p2WeaponDiv);
        }
        
        // Setup P1 weapons
        p1WeaponDiv.innerHTML = '';
        if (!p1.weapons) p1.weapons = [];
        if (p1.weapons.length > 0) {
            const select = document.createElement('select');
            select.id = 'p1WeaponSelect';
            select.className = 'text-xs bg-slate-800 text-white px-2 py-1 rounded';
            select.innerHTML = '<option value="">No weapon</option>';
            p1.weapons.forEach(w => {
                const option = document.createElement('option');
                option.value = w;
                option.textContent = `${WEAPONS[w].emoji} ${WEAPONS[w].name} (+${WEAPONS[w].bonus})`;
                select.appendChild(option);
            });
            select.onchange = (e) => {
                this.duelP1Weapon = e.target.value || null;
            };
            p1WeaponDiv.appendChild(select);
        } else {
            p1WeaponDiv.innerHTML = '<span class="text-xs text-gray-400">No weapons</span>';
        }
        
        // Setup P2 weapons
        p2WeaponDiv.innerHTML = '';
        if (!p2.weapons) p2.weapons = [];
        if (p2.weapons.length > 0) {
            const select = document.createElement('select');
            select.id = 'p2WeaponSelect';
            select.className = 'text-xs bg-slate-800 text-white px-2 py-1 rounded';
            select.innerHTML = '<option value="">No weapon</option>';
            p2.weapons.forEach(w => {
                const option = document.createElement('option');
                option.value = w;
                option.textContent = `${WEAPONS[w].emoji} ${WEAPONS[w].name} (+${WEAPONS[w].bonus})`;
                select.appendChild(option);
            });
            select.onchange = (e) => {
                this.duelP2Weapon = e.target.value || null;
            };
            p2WeaponDiv.appendChild(select);
        } else {
            p2WeaponDiv.innerHTML = '<span class="text-xs text-gray-400">No weapons</span>';
        }
    }

    /**
     * Resolve duel result
     * @param {Object} p1 - Player 1
     * @param {Object} p2 - Player 2
     * @param {number} r1 - Player 1 roll (with bonus)
     * @param {number} r2 - Player 2 roll (with bonus)
     */
    resolveDuel(p1, p2, r1, r2) {
        // Remove used weapons
        if (this.duelP1Weapon && p1.weapons.includes(this.duelP1Weapon)) {
            const index = p1.weapons.indexOf(this.duelP1Weapon);
            p1.weapons.splice(index, 1);
        }
        if (this.duelP2Weapon && p2.weapons.includes(this.duelP2Weapon)) {
            const index = p2.weapons.indexOf(this.duelP2Weapon);
            p2.weapons.splice(index, 1);
        }
        
        if (r1 > r2) {
            // Attacker wins
            p2.x = p2.startPos.x;
            p2.y = p2.startPos.y;
            showModal('Duel Result', `Player ${p1.name} wins! ${p2.name} returns to starting position.`);
            
            // Close modal and end duel
            $('duelModal').classList.add('hidden');
            this.centerCameraOnPlayer();
            this.updateButtons();
            this.state = GAME_STATES.MOVE;
        } else if (r2 > r1) {
            // Defender wins
            p1.x = p1.startPos.x;
            p1.y = p1.startPos.y;
            showModal('Duel Result', `Player ${p2.name} wins! ${p1.name} returns to starting position.`);
            this.currentMoves = 0;
            this.skipTurn();
            
            // Close modal and end duel
            $('duelModal').classList.add('hidden');
            this.centerCameraOnPlayer();
            this.state = GAME_STATES.MOVE;
        } else {
            // Tie - continue dueling by resetting and allowing another roll
            $('duelResult1').innerText = '-';
            $('duelResult2').innerText = '-';
            this.showToast('Tie! Roll again!');
            // Reset weapon selection for next roll
            this.duelP1Weapon = null;
            this.duelP2Weapon = null;
            // Modal stays open, player can roll again
        }
    }

    /**
     * Dig for treasure
     */
    dig() {
        const p = this.players[this.currentPlayerIndex];
        const treasure = this.treasures.find(t => t.x === p.x && t.y === p.y);
        
        if (treasure) {
            if (treasure.found) {
                showModal('Too Bad', 'This treasure has already been dug up!');
                // Đào hố trống - hết lượt di chuyển
                this.currentMoves = 0;
                $('movesLeft').innerText = '0';
                this.updateButtons();
            } else if (p.inventory.includes(treasure.index)) {
                // Success!
                treasure.found = true;
                p.coins += treasure.value;
                showModal(
                    'TREASURE! 💎',
                    `Congratulations! You found a treasure worth <span class="text-yellow-500 font-bold">${treasure.value}</span> coins!`
                );
                this.treasures = this.treasures.filter(t => t !== treasure);
                this.updateUI();
                this.skipTurn();
            } else {
                showModal(
                    'Hmm...',
                    'The ground here seems soft, but you\'re not sure what\'s underneath. Find a Snowman to get a clue!'
                );
                // Đào hố trống - hết lượt di chuyển
                this.currentMoves = 0;
                $('movesLeft').innerText = '0';
                this.updateButtons();
            }
        } else {
            showModal('Nothing Here', 'You dig a hole but only find snow.');
            // Đào hố trống - hết lượt di chuyển
            this.currentMoves = 0;
            $('movesLeft').innerText = '0';
            this.updateButtons();
        }
    }

    /**
     * Skip to next player's turn
     */
    skipTurn() {
        // Check for extra turn
        if (this.hasExtraTurn) {
            // Use extra turn - allow player to roll dice again
            this.hasExtraTurn = false;
            this.state = GAME_STATES.IDLE;
            this.diceValue = 0;
            this.currentMoves = 0;
            
            // Reset UI for new roll
            $('diceValue').innerText = '-';
            $('movesLeft').innerText = '0';
            $('rollBtn').disabled = false;
            $('rollBtn').innerHTML = '<i class="fas fa-dice"></i> ROLL DICE (Extra Turn)';
            $('rollBtn').classList.remove('opacity-50', 'cursor-not-allowed');
            
            this.showToast('🎁 Your extra turn!');
            this.updateButtons();
            return; // Don't change player
        }
        
        // Normal turn end - move to next player
        this.hasExtraTurn = false; // Reset flag
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.state = GAME_STATES.IDLE;
        this.diceValue = 0;
        this.currentMoves = 0;
        
        // Reset UI
        $('diceValue').innerText = '-';
        $('movesLeft').innerText = '0';
        $('rollBtn').disabled = false;
        $('rollBtn').innerHTML = '<i class="fas fa-dice"></i> ROLL DICE';
        $('rollBtn').classList.remove('opacity-50', 'cursor-not-allowed');
        
        this.updateUI();
        this.centerCameraOnPlayer();
        
        // Show turn indicator
        const p = this.players[this.currentPlayerIndex];
        $('actionMessage').innerText = `${p.name}'s turn`;
        $('actionMessage').style.color = p.color;
        $('actionOverlay').classList.remove('hidden');
        setTimeout(() => $('actionOverlay').classList.add('hidden'), 1500);
        
        this.updateButtons();
    }

    /**
     * Update UI elements
     */
    updateUI() {
        const p = this.players[this.currentPlayerIndex];
        $('currentPlayerAvatar').style.backgroundColor = p.color;
        $('currentPlayerAvatar').innerText = `P${p.id + 1}`;
        $('turnIndicator').innerText = p.name;
        $('turnIndicator').style.color = p.color;
        $('coinDisplay').innerHTML = `<i class="fas fa-coins"></i> ${p.coins}`;
        
        const invCount = p.inventory.length;
        $('inventoryCount').innerText = invCount;
        $('inventoryCount').classList.toggle('hidden', invCount === 0);
    }

    /**
     * Update button states
     */
    updateButtons() {
        const isMyTurn = this.state === GAME_STATES.MOVE;
        const canMove = isMyTurn && this.currentMoves > 0; // Can only move if has moves left
        
        $('btnUp').disabled = !canMove;
        $('btnDown').disabled = !canMove;
        $('btnLeft').disabled = !canMove;
        $('btnRight').disabled = !canMove;
        
        $('skipBtn').disabled = !isMyTurn && this.state !== GAME_STATES.IDLE;
        $('digBtn').disabled = !isMyTurn;
    }

    /**
     * Create snapshot of treasure area
     * @param {number} treasureIdx - Treasure index
     * @returns {string} - Data URL of snapshot image
     */
    createSnapshot(treasureIdx) {
        const t = this.treasures.find(tr => tr.index === treasureIdx) || { x: 25, y: 25 };
        
        const canvas = document.createElement('canvas');
        canvas.width = SNAPSHOT_CONFIG.CANVAS_SIZE;
        canvas.height = SNAPSHOT_CONFIG.CANVAS_SIZE;
        const ctx = canvas.getContext('2d');
        
        // Draw background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, SNAPSHOT_CONFIG.CANVAS_SIZE, SNAPSHOT_CONFIG.CANVAS_SIZE);
        
        const size = SNAPSHOT_CONFIG.CELL_SIZE;
        const range = SNAPSHOT_CONFIG.RANGE;
        
        for (let y = -range; y < range; y++) {
            for (let x = -range; x < range; x++) {
                const gx = t.x + x;
                const gy = t.y + y;
                
                if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
                    const val = this.grid[gy][gx];
                    
                    // Set color based on terrain
                    if (val === TERRAIN_TYPES.SNOW) ctx.fillStyle = COLORS.snow;
                    else if (val === TERRAIN_TYPES.ICE) ctx.fillStyle = COLORS.ice;
                    else ctx.fillStyle = COLORS.tree;
                    
                    ctx.fillRect((x + range) * size, (y + range) * size, size, size);
                    
                    // Draw grid line
                    ctx.strokeStyle = '#ccc';
                    ctx.strokeRect((x + range) * size, (y + range) * size, size, size);

                    // Draw terrain icons
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    if (val === TERRAIN_TYPES.TREE) {
                        ctx.fillText('🎄', (x + range) * size + size / 2, (y + range) * size + size / 2);
                    } else if (val === TERRAIN_TYPES.ICE) {
                        ctx.fillText('❄', (x + range) * size + size / 2, (y + range) * size + size / 2);
                    }
                }
            }
        }
        
        // Draw X mark at treasure position (center of snapshot)
        // The treasure is at (t.x, t.y), which corresponds to (range, range) in snapshot coordinates
        // because we loop from -range to range, so center is at range * size + size/2
        const centerX = SNAPSHOT_CONFIG.RANGE * size + size / 2;
        const centerY = SNAPSHOT_CONFIG.RANGE * size + size / 2;
        
        ctx.font = '20px Arial';
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('❌', centerX, centerY);
        
        return canvas.toDataURL();
    }

    /**
     * Show clue modal
     * @param {number} tIdx - Treasure index
     */
    showClueModal(tIdx) {
        const imgData = this.createSnapshot(tIdx);
        const html = `
            <p class="mb-4">The snowman whispers a secret location...</p>
            <div class="border-4 border-yellow-500 inline-block p-1 bg-white">
                <img src="${imgData}" class="w-48 h-48 pixel-font">
            </div>
            <p class="mt-2 text-sm text-gray-500">Saved to inventory!</p>
        `;
        showModal('Treasure Clue #' + (tIdx + 1), html);
    }

    /**
     * Toggle inventory modal
     */
    toggleInventory() {
        const modal = $('inventoryModal');
        if (!modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
            return;
        }
        
        const p = this.players[this.currentPlayerIndex];
        const list = $('inventoryList');
        list.innerHTML = '';
        
        if (p.inventory.length === 0) {
            list.innerHTML = '<p class="text-gray-400 col-span-2 text-center">No clues yet.</p>';
        } else {
            p.inventory.forEach(idx => {
                const imgData = this.createSnapshot(idx);
                const tInfo = this.treasures.find(t => t.index === idx);
                const status = (!tInfo || tInfo.found)
                    ? '<span class="text-green-400">(Found)</span>'
                    : '<span class="text-red-400">(Not dug)</span>';
                
                const item = document.createElement('div');
                item.className = 'bg-slate-800 p-6 rounded-lg border border-slate-600';
                item.innerHTML = `
                    <div class="flex flex-col items-center gap-4">
                        <div class="border-4 border-yellow-500 p-2 bg-white rounded-lg shadow-lg">
                            <img src="${imgData}" class="w-64 h-64 border border-gray-500 bg-white object-contain">
                        </div>
                        <div class="text-center">
                            <h4 class="font-bold text-yellow-400 text-lg mb-2">Clue #${idx + 1}</h4>
                            <p class="text-sm text-gray-300 mb-1">${status}</p>
                            <p class="text-xs text-gray-500">Find terrain that matches this image.</p>
                        </div>
                    </div>
                `;
                list.appendChild(item);
            });
        }
        modal.classList.remove('hidden');
    }

    /**
     * Clamp camera to stay within map bounds
     */
    clampCamera() {
        const maxX = GRID_SIZE * CELL_SIZE - this.canvas.width;
        const maxY = GRID_SIZE * CELL_SIZE - this.canvas.height;
        
        this.camera.x = Math.max(0, Math.min(this.camera.x, maxX));
        this.camera.y = Math.max(0, Math.min(this.camera.y, maxY));
    }

    /**
     * Center camera on current player (with bounds clamping)
     */
    centerCameraOnPlayer() {
        const p = this.players[this.currentPlayerIndex];
        const targetX = p.x * CELL_SIZE;
        const targetY = p.y * CELL_SIZE;
        
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        
        this.camera.x = targetX - cx + CELL_SIZE / 2;
        this.camera.y = targetY - cy + CELL_SIZE / 2;
        
        // Clamp to bounds to prevent showing empty space
        this.clampCamera();
        
        // Re-enable camera follow when centering on player (e.g., when player moves)
        this.cameraFollowEnabled = true;
    }

    /**
     * Fit entire map to screen (for initial view)
     * Center the map on screen
     */
    fitMapToScreen() {
        // Center the map on screen to show full map view
        const mapWidth = GRID_SIZE * CELL_SIZE;
        const mapHeight = GRID_SIZE * CELL_SIZE;
        
        // Center camera to show map in the middle
        this.camera.x = (mapWidth - this.canvas.width) / 2;
        this.camera.y = (mapHeight - this.canvas.height) / 2;
        
        // Ensure camera stays within bounds
        this.clampCamera();
    }

    /**
     * Render game
     */
    render() {
        // Clear canvas
        this.ctx.fillStyle = COLORS.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.grid || this.grid.length === 0) return;

        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Calculate visible range for optimization
        const startCol = Math.floor(this.camera.x / CELL_SIZE);
        const endCol = startCol + (this.canvas.width / CELL_SIZE) + 1;
        const startRow = Math.floor(this.camera.y / CELL_SIZE);
        const endRow = startRow + (this.canvas.height / CELL_SIZE) + 1;

        // Draw grid
        this.renderGrid(startRow, endRow, startCol, endCol);
        
        // Draw objects
        this.renderObjects();
        
        // Draw players
        this.renderPlayers();

        this.ctx.restore();
    }

    /**
     * Render grid terrain
     * @param {number} startRow - Start row
     * @param {number} endRow - End row
     * @param {number} startCol - Start column
     * @param {number} endCol - End column
     */
    renderGrid(startRow, endRow, startCol, endCol) {
        for (let y = Math.max(0, startRow); y <= Math.min(GRID_SIZE - 1, endRow); y++) {
            for (let x = Math.max(0, startCol); x <= Math.min(GRID_SIZE - 1, endCol); x++) {
                if (!this.grid[y]) continue;
                
                const cellVal = this.grid[y][x];
                const px = x * CELL_SIZE;
                const py = y * CELL_SIZE;

                // Base terrain color
                if (cellVal === TERRAIN_TYPES.SNOW) this.ctx.fillStyle = COLORS.snow;
                else if (cellVal === TERRAIN_TYPES.ICE) this.ctx.fillStyle = COLORS.ice;
                else this.ctx.fillStyle = COLORS.tree;

                this.ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                
                // Border
                this.ctx.strokeStyle = COLORS.gridLine;
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);

                // Terrain icons
                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                
                if (cellVal === TERRAIN_TYPES.ICE) {
                    this.ctx.fillStyle = '#38bdf8';
                    this.ctx.fillText('❄', px + CELL_SIZE / 2, py + CELL_SIZE / 2);
                } else if (cellVal === TERRAIN_TYPES.TREE) {
                    this.ctx.fillStyle = '#166534';
                    this.ctx.fillText('🎄', px + CELL_SIZE / 2, py + CELL_SIZE / 2);
                }
            }
        }
    }

    /**
     * Render game objects (gifts, snowmen, treasures, weapons)
     */
    renderObjects() {
        this.ctx.font = '24px Arial';
        
        // Gifts
        this.gifts.forEach(g => {
            this.ctx.fillText('🎁', g.x * CELL_SIZE + CELL_SIZE / 2, g.y * CELL_SIZE + CELL_SIZE / 2);
        });

        // Weapons
        this.weapons.forEach(w => {
            this.ctx.fillText(WEAPONS[w.type].emoji, w.x * CELL_SIZE + CELL_SIZE / 2, w.y * CELL_SIZE + CELL_SIZE / 2);
        });

        // Snowmen
        this.snowmen.forEach(s => {
            this.ctx.fillText('⛄', s.x * CELL_SIZE + CELL_SIZE / 2, s.y * CELL_SIZE + CELL_SIZE / 2);
        });

        // Found treasures (holes)
        this.treasures.forEach(t => {
            if (t.found) {
                this.ctx.fillText('🕳️', t.x * CELL_SIZE + CELL_SIZE / 2, t.y * CELL_SIZE + CELL_SIZE / 2);
            }
        });
    }

    /**
     * Render players
     */
    renderPlayers() {
        this.players.forEach((p, idx) => {
            const px = p.x * CELL_SIZE + CELL_SIZE / 2;
            const py = p.y * CELL_SIZE + CELL_SIZE / 2;
            
            // Shadow
            this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
            this.ctx.beginPath();
            this.ctx.arc(px, py + 10, 8, 0, Math.PI * 2);
            this.ctx.fill();

            // Body
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 14, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Border
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Active indicator with pulsing effect
            if (idx === this.currentPlayerIndex) {
                // Calculate pulsing effect using sin wave (0 to 1 range) - much faster animation
                const pulse = (Math.sin(this.animationTime * 0.06) + 1) / 2; // 0 to 1, much faster with 0.06
                
                // Outer glow effect with pulsing opacity and size - very bright and prominent
                const glowRadius = 18 + pulse * 8; // Pulse between 18 and 26 (even larger range)
                const glowAlpha = 0.8 + pulse * 0.2; // Pulse opacity between 0.8 and 1.0 (very bright)
                
                // Draw outer glow - very bright and very thick
                this.ctx.strokeStyle = `rgba(250, 204, 21, ${glowAlpha})`; // yellow with alpha
                this.ctx.lineWidth = 6 + pulse * 4; // Pulse line width between 6 and 10 (very thick)
                this.ctx.beginPath();
                this.ctx.arc(px, py, glowRadius, 0, Math.PI * 2);
                this.ctx.stroke();
                
                // Draw middle glow layer for extra visibility
                this.ctx.strokeStyle = `rgba(250, 230, 100, ${0.9 + pulse * 0.1})`; // lighter yellow
                this.ctx.lineWidth = 5;
                this.ctx.beginPath();
                this.ctx.arc(px, py, 19 + pulse * 2, 0, Math.PI * 2);
                this.ctx.stroke();
                
                // Draw inner bright ring - very thick for maximum visibility
                this.ctx.strokeStyle = '#facc15'; // yellow
                this.ctx.lineWidth = 5; // Increased to 5
                this.ctx.beginPath();
                this.ctx.arc(px, py, 18, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            // Label
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.fillText(`P${p.id + 1}`, px, py);
        });
    }

    /**
     * Main game loop
     */
    loop() {
        // Update animation time for effects
        this.animationTime += 1;
        
        // Smooth camera follow with bounds clamping (only when follow is enabled and not dragging)
        if (this.cameraFollowEnabled && !this.isDragging) {
            const p = this.players[this.currentPlayerIndex];
            const targetX = p.x * CELL_SIZE - this.canvas.width / 2 + CELL_SIZE / 2;
            const targetY = p.y * CELL_SIZE - this.canvas.height / 2 + CELL_SIZE / 2;
            
            this.camera.x += (targetX - this.camera.x) * CAMERA_CONFIG.LERP_SPEED;
            this.camera.y += (targetY - this.camera.y) * CAMERA_CONFIG.LERP_SPEED;
            
            // Clamp camera to prevent showing empty space
            this.clampCamera();
        }

        this.render();
        requestAnimationFrame(() => this.loop());
    }
}

