/**
 * Game Renderer
 * Pure rendering logic - no game state management
 */

import { GRID_SIZE, CELL_SIZE, COLORS, TERRAIN_TYPES, CAMERA_CONFIG } from './config.js';

// Weapons config (should match server)
const WEAPONS = {
    KNIFE: { emoji: '🔪', bonus: 2, name: 'Knife' },
    SWORD: { emoji: '🗡️', bonus: 3, name: 'Sword' }
};

export class GameRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.camera = { x: 0, y: 0 };
        this.animationTime = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.cameraFollowEnabled = true;
        
        this.initializeCanvas();
        this.setupMousePan();
    }

    /**
     * Initialize canvas size
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
        const container = document.getElementById('gameContainer');
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        }
    }

    /**
     * Setup mouse drag to pan camera
     */
    setupMousePan() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.cameraFollowEnabled = false;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
            e.preventDefault();
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                
                this.camera.x -= deltaX;
                this.camera.y -= deltaY;
                
                this.clampCamera();
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                e.preventDefault();
            } else {
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
        document.addEventListener('mouseup', handleMouseUp);

        this.canvas.addEventListener('mouseleave', () => {
            if (this.isDragging) {
                this.isDragging = false;
            }
            this.canvas.style.cursor = 'default';
        });

        // Touch support
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.isDragging = true;
                this.cameraFollowEnabled = false;
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

        this.canvas.addEventListener('touchcancel', () => {
            this.isDragging = false;
        });
    }

    /**
     * Clamp camera to bounds
     */
    clampCamera() {
        const maxX = GRID_SIZE * CELL_SIZE - this.canvas.width;
        const maxY = GRID_SIZE * CELL_SIZE - this.canvas.height;
        
        this.camera.x = Math.max(0, Math.min(this.camera.x, maxX));
        this.camera.y = Math.max(0, Math.min(this.camera.y, maxY));
    }

    /**
     * Center camera on player
     * @param {Object} player - Player object with x, y
     */
    centerCameraOnPlayer(player) {
        if (!player) return;
        const targetX = player.x * CELL_SIZE - this.canvas.width / 2 + CELL_SIZE / 2;
        const targetY = player.y * CELL_SIZE - this.canvas.height / 2 + CELL_SIZE / 2;
        
        this.camera.x += (targetX - this.camera.x) * CAMERA_CONFIG.FOLLOW_SPEED;
        this.camera.y += (targetY - this.camera.y) * CAMERA_CONFIG.FOLLOW_SPEED;
        
        this.clampCamera();
    }

    /**
     * Render game state
     * @param {Object} gameState - Game state from server
     * @param {string} currentPlayerName - Current player name (my player)
     */
    render(gameState, currentPlayerName) {
        if (!gameState || !gameState.grid) return;

        // Clear canvas
        this.ctx.fillStyle = COLORS.background || '#0f172a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Calculate visible range
        const startCol = Math.floor(this.camera.x / CELL_SIZE);
        const endCol = startCol + (this.canvas.width / CELL_SIZE) + 1;
        const startRow = Math.floor(this.camera.y / CELL_SIZE);
        const endRow = startRow + (this.canvas.height / CELL_SIZE) + 1;

        // Draw grid
        this.renderGrid(gameState.grid, startRow, endRow, startCol, endCol);
        
        // Draw objects
        this.renderObjects(gameState);
        
        // Draw players (pass currentPlayerIndex from gameState and myPlayerName)
        this.renderPlayers(gameState.players, gameState.currentPlayerIndex, currentPlayerName);

        this.ctx.restore();
    }

    /**
     * Render grid terrain
     */
    renderGrid(grid, startRow, endRow, startCol, endCol) {
        for (let y = Math.max(0, startRow); y <= Math.min(GRID_SIZE - 1, endRow); y++) {
            for (let x = Math.max(0, startCol); x <= Math.min(GRID_SIZE - 1, endCol); x++) {
                if (!grid[y]) continue;
                
                const cellVal = grid[y][x];
                const px = x * CELL_SIZE;
                const py = y * CELL_SIZE;

                // Base terrain color
                if (cellVal === TERRAIN_TYPES.SNOW || cellVal === 1) {
                    this.ctx.fillStyle = COLORS.snow || '#f8fafc';
                } else if (cellVal === TERRAIN_TYPES.ICE || cellVal === 2) {
                    this.ctx.fillStyle = COLORS.ice || '#bae6fd';
                } else {
                    this.ctx.fillStyle = COLORS.tree || '#ccecd7';
                }

                this.ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                
                // Border
                this.ctx.strokeStyle = COLORS.gridLine || '#e2e8f0';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);

                // Terrain icons
                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                
                if (cellVal === TERRAIN_TYPES.ICE || cellVal === 2) {
                    this.ctx.fillStyle = '#38bdf8';
                    this.ctx.fillText('❄', px + CELL_SIZE / 2, py + CELL_SIZE / 2);
                } else if (cellVal === TERRAIN_TYPES.TREE || cellVal === 3) {
                    this.ctx.fillStyle = '#166534';
                    this.ctx.fillText('🎄', px + CELL_SIZE / 2, py + CELL_SIZE / 2);
                }
            }
        }
    }

    /**
     * Render game objects
     */
    renderObjects(gameState) {
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Gifts
        if (gameState.gifts) {
            gameState.gifts.forEach(g => {
                this.ctx.fillText('🎁', g.x * CELL_SIZE + CELL_SIZE / 2, g.y * CELL_SIZE + CELL_SIZE / 2);
            });
        }

        // Weapons
        if (gameState.weapons) {
            gameState.weapons.forEach(w => {
                const weaponEmoji = WEAPONS[w.type]?.emoji || '⚔️';
                this.ctx.fillText(weaponEmoji, w.x * CELL_SIZE + CELL_SIZE / 2, w.y * CELL_SIZE + CELL_SIZE / 2);
            });
        }

        // Snowmen
        if (gameState.snowmen) {
            gameState.snowmen.forEach(s => {
                this.ctx.fillText('⛄', s.x * CELL_SIZE + CELL_SIZE / 2, s.y * CELL_SIZE + CELL_SIZE / 2);
            });
        }

        // Found treasures (holes)
        if (gameState.treasures) {
            gameState.treasures.forEach(t => {
                if (t.found) {
                    this.ctx.fillText('🕳️', t.x * CELL_SIZE + CELL_SIZE / 2, t.y * CELL_SIZE + CELL_SIZE / 2);
                }
            });
        }
    }

    /**
     * Render players
     * @param {Array} players - Array of players
     * @param {number} currentPlayerIndex - Index of player whose turn it is
     * @param {string} myPlayerName - Name of the current user's player
     */
    renderPlayers(players, currentPlayerIndex, myPlayerName) {
        if (!players) return;

        players.forEach((p, idx) => {
            const px = p.x * CELL_SIZE + CELL_SIZE / 2;
            const py = p.y * CELL_SIZE + CELL_SIZE / 2;
            const isCurrentTurn = idx === currentPlayerIndex;
            const isMyPlayer = p.name === myPlayerName;
            
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
            
            // Base border (white)
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 14, 0, Math.PI * 2);
            this.ctx.stroke();

            // My player border (thicker, always visible)
            if (isMyPlayer) {
                this.ctx.strokeStyle = '#3b82f6'; // Blue border for my player
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.arc(px, py, 16, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            // Current turn indicator (pulsing yellow glow)
            if (isCurrentTurn) {
                const pulse = (Math.sin(this.animationTime * 0.06) + 1) / 2;
                
                const glowRadius = 18 + pulse * 8;
                const glowAlpha = 0.8 + pulse * 0.2;
                
                // Outer glow
                this.ctx.strokeStyle = `rgba(250, 204, 21, ${glowAlpha})`;
                this.ctx.lineWidth = 6 + pulse * 4;
                this.ctx.beginPath();
                this.ctx.arc(px, py, glowRadius, 0, Math.PI * 2);
                this.ctx.stroke();
                
                // Middle glow
                this.ctx.strokeStyle = `rgba(250, 230, 100, ${0.9 + pulse * 0.1})`;
                this.ctx.lineWidth = 5;
                this.ctx.beginPath();
                this.ctx.arc(px, py, 19 + pulse * 2, 0, Math.PI * 2);
                this.ctx.stroke();
                
                // Inner bright ring
                this.ctx.strokeStyle = '#facc15';
                this.ctx.lineWidth = 5;
                this.ctx.beginPath();
                this.ctx.arc(px, py, 18, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            // Label
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(p.name.charAt(0).toUpperCase(), px, py);
        });
    }

    /**
     * Main render loop
     * @param {Object} gameState - Game state from server
     * @param {string} myPlayerName - Current user's player name (for camera follow and my player border)
     */
    loop(gameState, myPlayerName) {
        this.animationTime += 1;
        
        // Smooth camera follow (follow my player)
        if (this.cameraFollowEnabled && !this.isDragging && gameState && gameState.players) {
            const myPlayer = gameState.players.find(p => p.name === myPlayerName);
            if (myPlayer) {
                this.centerCameraOnPlayer(myPlayer);
            }
        }

        this.render(gameState, myPlayerName);
    }
}

