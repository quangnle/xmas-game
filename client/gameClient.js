/**
 * Game Client
 * Manages game state from server and sends actions
 */

import { SocketClient } from './socket.js';
import { GameRenderer } from './gameRenderer.js';
import { $, showModal, showToast } from './utils.js';
import { SNAPSHOT_CONFIG, GRID_SIZE, CELL_SIZE, TERRAIN_TYPES, COLORS, GIFT_VALUE, WEAPONS } from './config.js';

// Game states
const GAME_STATES = {
    IDLE: 'IDLE',
    MOVE: 'MOVE',
    DUEL: 'DUEL'
};

export class GameClient {
    constructor(socketClient, playerName) {
        this.socket = socketClient;
        this.playerName = playerName;
        this.gameId = null;
        this.gameState = null;
        this.renderer = new GameRenderer('gameCanvas');
        
        this.setupSocketListeners();
        this.setupControls();
        this.startRenderLoop();
    }

    /**
     * Setup socket event listeners
     */
    setupSocketListeners() {
        // Game state updates
        this.socket.on('game:stateUpdate', (gameState) => {
            this.gameState = gameState;
            this.updateUI();
        });

        // Game errors
        this.socket.on('game:error', ({ message }) => {
            showModal('Error', `<p class="text-red-600">${message}</p>`);
        });

        // Duel events
        this.socket.on('game:duel:started', (duelState) => {
            this.showDuelModal(duelState);
        });

        this.socket.on('game:duel:weaponSelected', (data) => {
            this.updateDuelUI(data);
        });

        this.socket.on('game:duel:rolled', (data) => {
            this.updateDuelRolls(data);
        });

        this.socket.on('game:duel:resolved', (result) => {
            this.showDuelResult(result);
        });

        // Game events
        this.socket.on('game:extraTurn', ({ playerName, diceValue }) => {
            if (playerName === this.playerName) {
                showToast(`🎉 Rolled ${diceValue}! You get an extra turn!`);
            }
        });

        this.socket.on('game:event:gift', ({ playerName, value, position }) => {
            if (playerName === this.playerName) {
                // Show toast at player position
                const player = this.gameState?.players?.find(p => p.name === playerName);
                if (player && this.renderer) {
                    const canvasPos = this.renderer.getCanvasPosition(player.x, player.y);
                    showToast(`+${value || GIFT_VALUE} Coins! 💰`, { position: canvasPos });
                } else {
                    showToast(`+${value || GIFT_VALUE} Coins! 💰`);
                }
            }
        });

        this.socket.on('game:event:weapon', ({ playerName, weaponType, position }) => {
            if (playerName === this.playerName) {
                const weapon = WEAPONS[weaponType];
                if (weapon) {
                    const player = this.gameState?.players?.find(p => p.name === playerName);
                    if (player && this.renderer) {
                        const canvasPos = this.renderer.getCanvasPosition(player.x, player.y);
                        showToast(`Picked up ${weapon.emoji} ${weapon.name}! +${weapon.bonus} in duels!`, { position: canvasPos });
                    } else {
                        showToast(`Picked up ${weapon.emoji} ${weapon.name}! +${weapon.bonus} in duels!`);
                    }
                }
            }
        });

        this.socket.on('game:event:clue', ({ playerName, treasureIndex }) => {
            if (playerName === this.playerName) {
                this.showClueModal(treasureIndex);
            }
        });

        this.socket.on('game:event:treasure', ({ playerName, value, coins }) => {
            if (playerName === this.playerName) {
                showModal(
                    'TREASURE! 💎',
                    `Congratulations! You found a treasure worth <span class="text-yellow-500 font-bold">${value}</span> coins!`
                );
            }
        });

        this.socket.on('game:event:digEmpty', ({ playerName, message }) => {
            if (playerName === this.playerName) {
                showModal('Nothing Here', message);
            }
        });

        this.socket.on('game:event:digNoClue', ({ playerName, message }) => {
            if (playerName === this.playerName) {
                showModal('Hmm...', message);
            }
        });
    }

    /**
     * Setup control handlers
     */
    setupControls() {
        // D-Pad controls
        $('btnUp').onclick = () => this.handleMove(0, -1);
        $('btnDown').onclick = () => this.handleMove(0, 1);
        $('btnLeft').onclick = () => this.handleMove(-1, 0);
        $('btnRight').onclick = () => this.handleMove(1, 0);

        // Action buttons
        $('rollBtn').onclick = () => this.handleRollDice();
        $('digBtn').onclick = () => this.handleDig();
        $('skipBtn').onclick = () => this.handleNextTurn();
        
        // Inventory
        $('inventoryBtn').onclick = () => this.toggleInventory();
        $('closeInventoryBtn').onclick = () => this.toggleInventory();

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (!this.isMyTurn()) return;
            
            const keyMap = {
                'ArrowUp': () => this.handleMove(0, -1),
                'ArrowDown': () => this.handleMove(0, 1),
                'ArrowLeft': () => this.handleMove(-1, 0),
                'ArrowRight': () => this.handleMove(1, 0)
            };
            
            if (keyMap[e.key]) {
                keyMap[e.key]();
            }
        });
    }

    /**
     * Start render loop
     */
    startRenderLoop() {
        const render = () => {
            // Always use latest gameState
            this.renderer.loop(this.gameState, this.playerName);
            requestAnimationFrame(render);
        };
        render();
    }

    /**
     * Initialize game
     * @param {string} gameId - Game ID
     * @param {Object} gameState - Initial game state
     * @param {string} [lobbyCode] - Lobby code
     */
    initGame(gameId, gameState, lobbyCode = null) {
        this.gameId = gameId;
        this.gameState = gameState;
        this.lobbyCode = lobbyCode;
        this.updateUI();
    }

    /**
     * Check if it's my turn
     */
    isMyTurn() {
        if (!this.gameState || !this.gameState.players) return false;
        const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
        if (!currentPlayer) return false;
        return currentPlayer.name === this.playerName;
    }

    /**
     * Handle roll dice
     */
    handleRollDice() {
        if (!this.gameId) return;
        if (!this.isMyTurn()) {
            console.log('Not your turn');
            return;
        }
        if (this.gameState?.turnState !== 'IDLE') {
            console.log('Cannot roll dice in current state:', this.gameState?.turnState);
            return;
        }
        console.log('Rolling dice...');
        this.socket.emit('game:rollDice', { gameId: this.gameId, playerName: this.playerName });
    }

    /**
     * Handle move
     */
    handleMove(dx, dy) {
        if (!this.gameId) return;
        if (!this.isMyTurn()) return;
        if (this.gameState?.turnState !== 'MOVE') return;
        
        let direction;
        if (dx === 0 && dy === -1) direction = 'UP';
        else if (dx === 0 && dy === 1) direction = 'DOWN';
        else if (dx === -1 && dy === 0) direction = 'LEFT';
        else if (dx === 1 && dy === 0) direction = 'RIGHT';
        else return;
        
        this.socket.emit('game:move', { gameId: this.gameId, playerName: this.playerName, direction });
    }

    /**
     * Handle dig
     */
    handleDig() {
        if (!this.gameId) return;
        if (!this.isMyTurn()) return;
        if (this.gameState?.turnState !== 'MOVE') return;
        this.socket.emit('game:dig', { gameId: this.gameId, playerName: this.playerName });
    }

    /**
     * Handle next turn
     */
    handleNextTurn() {
        if (!this.gameId) return;
        if (!this.isMyTurn()) return;
        if (this.gameState?.turnState !== 'MOVE') return;
        this.socket.emit('game:nextTurn', { gameId: this.gameId, playerName: this.playerName });
    }

    /**
     * Handle duel weapon selection
     */
    handleDuelSelectWeapon(weaponType) {
        if (!this.gameId) return;
        this.socket.emit('game:duel:selectWeapon', { 
            gameId: this.gameId, 
            playerName: this.playerName, 
            weaponType 
        });
    }

    /**
     * Handle duel roll
     */
    handleDuelRoll() {
        if (!this.gameId) return;
        this.socket.emit('game:duel:roll', { gameId: this.gameId, playerName: this.playerName });
    }

    /**
     * Handle duel resolve
     */
    handleDuelResolve() {
        if (!this.gameId) return;
        this.socket.emit('game:duel:resolve', { gameId: this.gameId, playerName: this.playerName });
    }

    /**
     * Update UI based on game state
     */
    updateUI() {
        if (!this.gameState) return;

        // Update dice and moves
        const diceEl = $('diceValue');
        const movesEl = $('movesLeft');
        if (diceEl) diceEl.textContent = this.gameState.diceValue || '-';
        if (movesEl) movesEl.textContent = this.gameState.currentMoves || 0;

        // Update current player - show "Your Turn" if it's my turn
        const turnEl = $('turnIndicator');
        if (turnEl) {
            const currentPlayer = this.gameState.players?.[this.gameState.currentPlayerIndex];
            if (currentPlayer) {
                if (currentPlayer.name === this.playerName) {
                    turnEl.textContent = 'Your Turn';
                    turnEl.classList.add('text-yellow-400');
                    turnEl.classList.remove('text-white');
                } else {
                    turnEl.textContent = currentPlayer.name || '';
                    turnEl.classList.add('text-white');
                    turnEl.classList.remove('text-yellow-400');
                }
            } else {
                turnEl.textContent = '';
            }
        }

        // Update coins
        const player = this.gameState.players?.find(p => p.name === this.playerName);
        if (player) {
            const coinEl = $('coinDisplay');
            if (coinEl) coinEl.innerHTML = `<i class="fas fa-coins"></i> ${player.coins || 0}`;
            
            // Update inventory count
            const invCount = player.inventory?.length || 0;
            const invCountEl = $('inventoryCount');
            if (invCountEl) {
                invCountEl.textContent = invCount;
                invCountEl.classList.toggle('hidden', invCount === 0);
            }
        }

        // Update lobby code
        const lobbyCodeEl = $('lobbyCodeHeader');
        if (lobbyCodeEl && this.lobbyCode) {
            lobbyCodeEl.textContent = this.lobbyCode;
        }

        // Update buttons
        this.updateButtons();
    }

    /**
     * Update button states
     */
    updateButtons() {
        if (!this.gameState) return;
        
        const isMyTurn = this.isMyTurn();
        const turnState = this.gameState.turnState || 'IDLE';
        const canRoll = turnState === 'IDLE' && isMyTurn;
        const canMove = turnState === 'MOVE' && isMyTurn && (this.gameState.currentMoves > 0);
        const canDig = isMyTurn && turnState === 'MOVE';
        const canSkip = isMyTurn && turnState === 'MOVE';

        if ($('rollBtn')) {
            $('rollBtn').disabled = !canRoll;
        }
        if ($('digBtn')) {
            $('digBtn').disabled = !canDig;
        }
        if ($('skipBtn')) {
            $('skipBtn').disabled = !canSkip;
        }
    }

    /**
     * Show duel modal
     */
    showDuelModal(duelState) {
        const modal = $('duelModal');
        if (!modal) return;

        modal.classList.remove('hidden');
        
        // Update duel UI
        const p1 = this.gameState.players.find(p => p.name === duelState.player1Name);
        const p2 = this.gameState.players.find(p => p.name === duelState.player2Name);
        
        if (p1 && $('duelP1Avatar')) {
            $('duelP1Avatar').style.backgroundColor = p1.color;
            $('duelP1Avatar').textContent = p1.name.charAt(0).toUpperCase();
        }
        if (p2 && $('duelP2Avatar')) {
            $('duelP2Avatar').style.backgroundColor = p2.color;
            $('duelP2Avatar').textContent = p2.name.charAt(0).toUpperCase();
        }

        // Setup weapon selection if needed
        if (duelState.player1Name === this.playerName && !duelState.player1Weapon) {
            this.setupWeaponSelection(duelState, 1);
        } else if (duelState.player2Name === this.playerName && !duelState.player2Weapon) {
            this.setupWeaponSelection(duelState, 2);
        }
    }

    /**
     * Setup weapon selection UI
     */
    setupWeaponSelection(duelState, playerNum) {
        // This will be implemented based on UI requirements
        // For now, just show the roll button when both weapons are selected
    }

    /**
     * Update duel UI
     */
    updateDuelUI(data) {
        // Update weapon selections
    }

    /**
     * Update duel rolls
     */
    updateDuelRolls(data) {
        if ($('duelResult1')) {
            $('duelResult1').textContent = data.player1Roll || '-';
        }
        if ($('duelResult2')) {
            $('duelResult2').textContent = data.player2Roll || '-';
        }
    }

    /**
     * Show duel result
     */
    showDuelResult(result) {
        setTimeout(() => {
            const modal = $('duelModal');
            if (modal) modal.classList.add('hidden');
        }, 3000);
    }

    /**
     * Toggle inventory
     */
    toggleInventory() {
        const modal = $('inventoryModal');
        if (!modal) return;
        
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
            this.updateInventory();
        } else {
            modal.classList.add('hidden');
        }
    }

    /**
     * Update inventory display
     */
    updateInventory() {
        const list = $('inventoryList');
        if (!list || !this.gameState) return;

        const player = this.gameState.players.find(p => p.name === this.playerName);
        if (!player) return;

        let html = '';
        
        // Clues
        if (player.inventory && player.inventory.length > 0) {
            html += '<div class="text-white mb-4"><h3 class="font-bold text-xl mb-2">Clues</h3>';
            player.inventory.forEach(clueIdx => {
                const imgData = this.createSnapshot(clueIdx);
                const treasure = this.gameState.treasures?.find(t => t.index === clueIdx);
                const status = (!treasure || treasure.found)
                    ? '<span class="text-green-400">(Found)</span>'
                    : '<span class="text-red-400">(Not dug)</span>';
                
                html += `
                    <div class="bg-slate-800 p-6 rounded-lg border border-slate-600 mb-4">
                        <div class="flex flex-col items-center gap-4">
                            <div class="border-4 border-yellow-500 p-2 bg-white rounded-lg shadow-lg">
                                <img src="${imgData}" class="w-64 h-64 border border-gray-500 bg-white object-contain">
                            </div>
                            <div class="text-center">
                                <h4 class="font-bold text-yellow-400 text-lg mb-2">Clue #${clueIdx + 1}</h4>
                                <p class="text-sm text-gray-300 mb-1">${status}</p>
                                <p class="text-xs text-gray-500">Find terrain that matches this image.</p>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        // Weapons
        if (player.weapons && player.weapons.length > 0) {
            html += '<div class="text-white"><h3 class="font-bold text-xl mb-2">Weapons</h3>';
            player.weapons.forEach(weapon => {
                const weaponInfo = WEAPONS[weapon];
                html += `<div class="bg-gray-800 p-3 rounded mb-2">${weaponInfo?.emoji || ''} ${weaponInfo?.name || weapon}</div>`;
            });
            html += '</div>';
        }

        if (!html) {
            html = '<p class="text-gray-400 text-center">Your inventory is empty</p>';
        }

        list.innerHTML = html;
    }

    /**
     * Create snapshot of treasure area for clue
     * @param {number} treasureIdx - Treasure index
     * @returns {string} - Data URL of snapshot image
     */
    createSnapshot(treasureIdx) {
        if (!this.gameState || !this.gameState.grid) return '';
        
        const treasure = this.gameState.treasures?.find(t => t.index === treasureIdx);
        if (!treasure) return '';
        
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
                const gx = treasure.x + x;
                const gy = treasure.y + y;
                
                if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
                    const val = this.gameState.grid[gy][gx];
                    
                    // Set color based on terrain
                    if (val === TERRAIN_TYPES.SNOW || val === 1) ctx.fillStyle = COLORS.snow;
                    else if (val === TERRAIN_TYPES.ICE || val === 2) ctx.fillStyle = COLORS.ice;
                    else ctx.fillStyle = COLORS.tree;
                    
                    ctx.fillRect((x + range) * size, (y + range) * size, size, size);
                    
                    // Draw grid line
                    ctx.strokeStyle = '#ccc';
                    ctx.strokeRect((x + range) * size, (y + range) * size, size, size);

                    // Draw terrain icons
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    if (val === TERRAIN_TYPES.TREE || val === 3) {
                        ctx.fillText('🎄', (x + range) * size + size / 2, (y + range) * size + size / 2);
                    } else if (val === TERRAIN_TYPES.ICE || val === 2) {
                        ctx.fillText('❄', (x + range) * size + size / 2, (y + range) * size + size / 2);
                    }
                }
            }
        }
        
        // Draw X mark at treasure position
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
     * @param {number} treasureIndex - Treasure index
     */
    showClueModal(treasureIndex) {
        const imgData = this.createSnapshot(treasureIndex);
        if (!imgData) return;
        
        const html = `
            <p class="mb-4">The snowman whispers a secret location...</p>
            <div class="border-4 border-yellow-500 inline-block p-1 bg-white">
                <img src="${imgData}" class="w-48 h-48 pixel-font">
            </div>
            <p class="mt-2 text-sm text-gray-500">Saved to inventory!</p>
        `;
        showModal('Treasure Clue #' + (treasureIndex + 1), html);
    }
}

