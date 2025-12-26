/**
 * Lobby Management
 * Handles lobby UI and interactions
 */

import { SocketClient } from './socket.js';
import { $, showModal } from './utils.js';

export class LobbyManager {
    constructor(socketClient) {
        this.socket = socketClient;
        this.currentLobby = null;
        this.playerName = null;
        this.isHost = false;
        
        this.setupUI();
        this.setupSocketListeners();
    }

    /**
     * Setup lobby UI elements
     */
    setupUI() {
        // Create lobby UI if not exists
        if (!$('lobbyScreen')) {
            const lobbyHTML = `
                <div id="lobbyScreen" class="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center p-4">
                    <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <!-- Create/Browse Tabs -->
                        <div class="flex gap-2 mb-6 border-b">
                            <button id="createTab" class="flex-1 py-2 px-4 font-bold text-blue-600 border-b-2 border-blue-600">
                                Create Room
                            </button>
                            <button id="browseTab" class="flex-1 py-2 px-4 font-bold text-gray-500 hover:text-gray-700">
                                Browse Rooms
                            </button>
                        </div>

                        <!-- Create Room Form -->
                        <div id="createForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">Your Name</label>
                                <input type="text" id="createNameInput" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                                    placeholder="Enter your name" maxlength="20">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">Room Code (3 digits)</label>
                                <input type="text" id="createRoomCodeInput" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-xl font-bold tracking-widest text-gray-900 bg-white"
                                    placeholder="000" maxlength="3" pattern="[0-9]{3}">
                                <p class="text-xs text-gray-500 mt-1">Leave empty for random code</p>
                            </div>
                            
                            <!-- Advanced Settings -->
                            <div class="border-t pt-4">
                                <button type="button" id="advancedSettingsToggle" 
                                    class="w-full flex items-center justify-between text-sm font-bold text-gray-700 hover:text-gray-900 mb-2">
                                    <span>Advanced Settings</span>
                                    <i class="fas fa-chevron-down" id="advancedSettingsIcon"></i>
                                </button>
                                <div id="advancedSettings" class="hidden space-y-4 mt-4">
                                    <!-- Grid Size -->
                                    <div>
                                        <label class="block text-sm font-bold text-gray-700 mb-2">Grid Size</label>
                                        <input type="number" id="gridSizeInput" 
                                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                                            value="40" min="25" max="50" step="5">
                                        <p class="text-xs text-gray-500 mt-1">Size of the game board (25-50)</p>
                                    </div>
                                    
                                    <!-- Number of Gifts -->
                                    <div>
                                        <label class="block text-sm font-bold text-gray-700 mb-2">Number of Gifts</label>
                                        <input type="number" id="numGiftsInput" 
                                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                                            value="20" min="5" max="50" step="5">
                                        <p class="text-xs text-gray-500 mt-1">Number of gifts on the board (5-50)</p>
                                    </div>
                                    
                                    <!-- Treasure Values -->
                                    <div>
                                        <label class="block text-sm font-bold text-gray-700 mb-2">Treasure Values (comma-separated)</label>
                                        <input type="text" id="treasureValuesInput" 
                                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                                            value="100,200,500,1000" placeholder="100,200,500,1000">
                                        <p class="text-xs text-gray-500 mt-1">Values for each treasure (1-8 treasures, comma-separated)</p>
                                    </div>
                                    
                                    <!-- Weapons (Knives and Swords in one row) -->
                                    <div class="grid grid-cols-2 gap-4">
                                        <!-- Number of Knives -->
                                        <div>
                                            <label class="block text-sm font-bold text-gray-700 mb-2">Number of Knives</label>
                                            <input type="number" id="numKnivesInput" 
                                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                                                value="2" min="0" max="20" step="1">
                                            <p class="text-xs text-gray-500 mt-1">0-20</p>
                                        </div>
                                        
                                        <!-- Number of Swords -->
                                        <div>
                                            <label class="block text-sm font-bold text-gray-700 mb-2">Number of Swords</label>
                                            <input type="number" id="numSwordsInput" 
                                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                                                value="2" min="0" max="20" step="1">
                                            <p class="text-xs text-gray-500 mt-1">0-20</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <button id="createBtn" 
                                class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-500 transition">
                                Create Room
                            </button>
                        </div>

                        <!-- Browse Rooms -->
                        <div id="browseForm" class="space-y-4 hidden">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg font-bold text-gray-800">Available Rooms</h3>
                                <button id="refreshRoomsBtn" 
                                    class="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-bold">
                                    <i class="fas fa-sync-alt"></i> Refresh
                                </button>
                            </div>
                            
                            <!-- Rooms List -->
                            <div id="roomsList" class="space-y-2 max-h-64 overflow-y-auto">
                                <div class="text-center text-gray-500 py-4">
                                    <i class="fas fa-spinner fa-spin"></i> Loading rooms...
                                </div>
                            </div>
                        </div>

                        <!-- Error Message -->
                        <div id="lobbyError" class="mt-4 text-red-600 text-sm hidden"></div>
                    </div>
                </div>

                <!-- Lobby Room -->
                <div id="lobbyRoom" class="fixed inset-0 bg-slate-900 z-50 hidden flex flex-col p-4">
                    <div class="max-w-2xl mx-auto w-full">
                        <div class="bg-white rounded-xl shadow-2xl p-6">
                            <div class="flex justify-between items-center mb-6">
                                <div>
                                    <h2 class="text-2xl font-bold text-gray-800">Lobby</h2>
                                    <p class="text-gray-600">Code: <span id="lobbyCodeDisplay" class="font-mono font-bold text-blue-600"></span></p>
                                </div>
                                <button id="leaveLobbyBtn" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                                    Leave
                                </button>
                            </div>

                            <!-- Players List -->
                            <div id="playersList" class="space-y-2 mb-6">
                                <!-- Players will be rendered here -->
                            </div>

                            <!-- Start Game Button (Host only) -->
                            <div id="hostControls" class="hidden">
                                <button id="startGameBtn" 
                                    class="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled>
                                    Start Game
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', lobbyHTML);
        }

        // Setup event listeners
        $('createTab').addEventListener('click', () => this.showCreateForm());
        $('browseTab').addEventListener('click', () => this.showBrowseForm());
        $('createBtn').addEventListener('click', () => this.handleCreate());
        $('refreshRoomsBtn').addEventListener('click', () => this.refreshRoomsList());
        $('leaveLobbyBtn').addEventListener('click', () => this.handleLeave());
        $('startGameBtn').addEventListener('click', () => this.handleStartGame());
        
        // Advanced Settings Toggle
        $('advancedSettingsToggle').addEventListener('click', () => {
            const settings = $('advancedSettings');
            const icon = $('advancedSettingsIcon');
            if (settings.classList.contains('hidden')) {
                settings.classList.remove('hidden');
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                settings.classList.add('hidden');
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        });
        
        // Initialize rooms list
        this.roomsList = [];
    }

    /**
     * Setup socket event listeners
     */
    setupSocketListeners() {
        // Lobby events
        this.socket.on('lobby:created', (lobby) => {
            this.currentLobby = lobby;
            this.isHost = true;
            this.showLobbyRoom();
        });

        this.socket.on('lobby:joined', (lobby) => {
            this.currentLobby = lobby;
            this.isHost = lobby.hostName === this.playerName;
            this.showLobbyRoom();
        });

        this.socket.on('lobby:updated', (lobby) => {
            this.currentLobby = lobby;
            this.updateLobbyRoom();
        });

        this.socket.on('lobby:playerJoined', (player) => {
            console.log('Player joined:', player);
            this.updateLobbyRoom();
        });

        this.socket.on('lobby:playerLeft', ({ playerName }) => {
            console.log('Player left:', playerName);
            this.updateLobbyRoom();
        });

        this.socket.on('lobby:playerReady', ({ playerName, ready }) => {
            console.log('Player ready:', playerName, ready);
            this.updateLobbyRoom();
        });

        this.socket.on('lobby:gameStarting', ({ gameId, gameState }) => {
            console.log('Game starting:', gameId);
            this.hideLobbyRoom();
            // Hide lobby screen
            const lobbyScreen = $('lobbyScreen');
            if (lobbyScreen) {
                lobbyScreen.classList.add('hidden');
            }
            // Show game container
            const gameContainer = $('gameContainer');
            if (gameContainer) {
                gameContainer.classList.remove('hidden');
            }
            // Emit event for game manager to handle (include lobby code)
            window.dispatchEvent(new CustomEvent('game:started', { 
                detail: { 
                    gameId, 
                    gameState,
                    lobbyCode: this.currentLobby?.code || null
                } 
            }));
        });

        this.socket.on('lobby:error', ({ message }) => {
            this.showError(message);
        });

        // Lobby list
        this.socket.on('lobby:list', (lobbies) => {
            this.roomsList = lobbies;
            this.updateRoomsList();
        });
    }

    /**
     * Show create form
     */
    showCreateForm() {
        $('createForm').classList.remove('hidden');
        $('browseForm').classList.add('hidden');
        $('createTab').classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
        $('createTab').classList.remove('text-gray-500');
        $('browseTab').classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
        $('browseTab').classList.add('text-gray-500');
    }

    /**
     * Show browse form
     */
    showBrowseForm() {
        $('createForm').classList.add('hidden');
        $('browseForm').classList.remove('hidden');
        $('browseTab').classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
        $('browseTab').classList.remove('text-gray-500');
        $('createTab').classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
        $('createTab').classList.add('text-gray-500');
        this.refreshRoomsList();
    }

    /**
     * Handle create room
     */
    handleCreate() {
        const name = $('createNameInput').value.trim();
        const code = $('createRoomCodeInput').value.trim();
        
        if (!name) {
            this.showError('Please enter your name');
            return;
        }
        
        // Validate code if provided
        if (code && (code.length !== 3 || !/^\d{3}$/.test(code))) {
            this.showError('Room code must be 3 digits');
            return;
        }
        
        // Get advanced settings
        const gridSize = parseInt($('gridSizeInput').value) || 40;
        const numGifts = parseInt($('numGiftsInput').value) || 20;
        const treasureValuesStr = $('treasureValuesInput').value.trim() || '100,200,500,1000';
        const numKnives = parseInt($('numKnivesInput').value) || 2;
        const numSwords = parseInt($('numSwordsInput').value) || 2;
        
        // Parse treasure values
        let treasureValues;
        try {
            treasureValues = treasureValuesStr.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v) && v > 0);
            if (treasureValues.length < 1 || treasureValues.length > 8) {
                this.showError('Treasure values must be between 1 and 8 numbers');
                return;
            }
        } catch (e) {
            this.showError('Invalid treasure values format');
            return;
        }
        
        // Validate settings
        if (gridSize < 25 || gridSize > 50) {
            this.showError('Grid size must be between 25 and 50');
            return;
        }
        if (numGifts < 5 || numGifts > 50) {
            this.showError('Number of gifts must be between 5 and 50');
            return;
        }
        if (numKnives < 0 || numKnives > 20) {
            this.showError('Number of knives must be between 0 and 20');
            return;
        }
        if (numSwords < 0 || numSwords > 20) {
            this.showError('Number of swords must be between 0 and 20');
            return;
        }
        
        this.playerName = name;
        this.socket.emit('lobby:create', { 
            hostName: name, 
            roomCode: code || null, // null means generate random
            settings: {
                gridSize,
                numGifts,
                treasureValues,
                numKnives,
                numSwords
            }
        });
    }


    /**
     * Handle leave lobby
     */
    handleLeave() {
        if (this.currentLobby) {
            this.socket.emit('lobby:leave', { 
                lobbyId: this.currentLobby.lobbyId, 
                playerName: this.playerName 
            });
        }
        this.hideLobbyRoom();
        this.showLobbyScreen();
    }

    /**
     * Handle start game
     */
    handleStartGame() {
        if (this.currentLobby && this.isHost) {
            this.socket.emit('lobby:start', { 
                lobbyId: this.currentLobby.lobbyId, 
                playerName: this.playerName 
            });
        }
    }

    /**
     * Show lobby screen
     */
    showLobbyScreen() {
        $('lobbyScreen').classList.remove('hidden');
        $('lobbyRoom').classList.add('hidden');
    }

    /**
     * Show lobby room
     */
    showLobbyRoom() {
        $('lobbyScreen').classList.add('hidden');
        $('lobbyRoom').classList.remove('hidden');
        this.updateLobbyRoom();
    }

    /**
     * Hide lobby room
     */
    hideLobbyRoom() {
        $('lobbyRoom').classList.add('hidden');
    }

    /**
     * Update lobby room UI
     */
    updateLobbyRoom() {
        if (!this.currentLobby) return;

        // Update lobby code
        $('lobbyCodeDisplay').textContent = this.currentLobby.code;

        // Update players list
        const playersList = $('playersList');
        playersList.innerHTML = this.currentLobby.players.map((player, index) => {
            const isHost = player.name === this.currentLobby.hostName;
            const isMe = player.name === this.playerName;
            return `
                <div class="flex items-center justify-between p-3 bg-gray-100 rounded-lg ${isMe ? 'ring-2 ring-blue-500' : ''}">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" 
                             style="background-color: ${player.color}">
                            ${player.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="font-bold text-gray-800">${player.name} ${isHost ? '(Host)' : ''}</div>
                            <div class="text-sm text-gray-500">${player.ready ? '✓ Ready' : 'Not ready'}</div>
                        </div>
                    </div>
                    ${isMe ? `
                        <button class="px-4 py-1 rounded ${player.ready ? 'bg-green-500' : 'bg-orange-500'} text-white text-sm font-bold"
                                onclick="window.lobbyManager.toggleReady()">
                            ${player.ready ? 'Ready' : 'Not Ready'}
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');

        // Update host controls
        const hostControls = $('hostControls');
        if (this.isHost) {
            hostControls.classList.remove('hidden');
            const allReady = this.currentLobby.players.length >= 2 && 
                           this.currentLobby.players.every(p => p.ready);
            $('startGameBtn').disabled = !allReady;
        } else {
            hostControls.classList.add('hidden');
        }
    }

    /**
     * Toggle ready status
     */
    toggleReady() {
        if (this.currentLobby) {
            this.socket.emit('lobby:ready', { 
                lobbyId: this.currentLobby.lobbyId, 
                playerName: this.playerName 
            });
        }
    }

    /**
     * Refresh rooms list
     */
    refreshRoomsList() {
        this.socket.emit('lobby:list');
    }

    /**
     * Update rooms list UI
     */
    updateRoomsList() {
        const roomsListEl = $('roomsList');
        if (!roomsListEl) return;

        if (this.roomsList.length === 0) {
            roomsListEl.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    <i class="fas fa-inbox text-2xl mb-2"></i>
                    <p>No rooms available</p>
                </div>
            `;
            return;
        }

        roomsListEl.innerHTML = this.roomsList.map(room => {
            const isFull = room.playerCount >= room.maxPlayers;
            return `
                <div class="border border-gray-300 rounded-lg p-3 hover:bg-gray-50 transition ${isFull ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}" 
                     ${!isFull ? `onclick="window.lobbyManager.showJoinRoomModal('${room.code}', '${room.hostName}')"` : ''}>
                    <div class="flex justify-between items-center">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="font-bold text-gray-800 text-lg">${room.hostName}'s Room</span>
                                ${isFull ? '<span class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Full</span>' : ''}
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-sm font-bold text-gray-700">
                                ${room.playerCount}/${room.maxPlayers}
                            </div>
                            <div class="text-xs text-gray-500">Players</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Show join room modal
     */
    showJoinRoomModal(code, hostName) {
        // Create or update modal
        let modal = $('joinRoomModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'joinRoomModal';
            modal.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 hidden';
            modal.innerHTML = `
                <div class="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">Join Room</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">Room: <span id="joinRoomName" class="font-semibold"></span></label>
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">Your Name</label>
                            <input type="text" id="joinRoomNameInput" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                                placeholder="Enter your name" maxlength="20">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">Room Code</label>
                            <input type="text" id="joinRoomCodeInput" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-xl font-bold tracking-widest text-gray-900 bg-white"
                                placeholder="000" maxlength="3" pattern="[0-9]{3}">
                        </div>
                        <div id="joinRoomError" class="text-red-600 text-sm hidden"></div>
                        <div class="flex gap-2">
                            <button id="joinRoomCancelBtn" 
                                class="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-bold hover:bg-gray-400 transition">
                                Cancel
                            </button>
                            <button id="joinRoomConfirmBtn" 
                                class="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-500 transition">
                                Join
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Setup event listeners
            $('joinRoomCancelBtn').addEventListener('click', () => {
                modal.classList.add('hidden');
            });
            $('joinRoomConfirmBtn').addEventListener('click', () => {
                this.handleJoinRoom();
            });
        }
        
        // Update modal content
        $('joinRoomName').textContent = hostName + "'s Room";
        $('joinRoomNameInput').value = '';
        $('joinRoomCodeInput').value = '';
        $('joinRoomError').classList.add('hidden');
        
        // Store expected code for validation
        this.expectedRoomCode = code;
        
        // Show modal
        modal.classList.remove('hidden');
        
        // Focus on name input
        setTimeout(() => {
            $('joinRoomNameInput').focus();
        }, 100);
    }

    /**
     * Handle join room (with code validation)
     */
    handleJoinRoom() {
        const name = $('joinRoomNameInput').value.trim();
        const code = $('joinRoomCodeInput').value.trim();
        
        // Validate name
        if (!name) {
            this.showJoinRoomError('Please enter your name');
            return;
        }
        
        // Validate code format
        if (!code) {
            this.showJoinRoomError('Please enter room code');
            return;
        }
        
        if (code.length !== 3 || !/^\d{3}$/.test(code)) {
            this.showJoinRoomError('Room code must be 3 digits');
            return;
        }
        
        // Validate code matches the room
        if (code !== this.expectedRoomCode) {
            this.showJoinRoomError('Room code does not match');
            return;
        }
        
        // Hide modal
        $('joinRoomModal').classList.add('hidden');
        
        // Join room
        this.playerName = name;
        this.socket.emit('lobby:join', { lobbyCode: code, playerName: name });
    }

    /**
     * Show error in join room modal
     */
    showJoinRoomError(message) {
        const errorEl = $('joinRoomError');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = $('lobbyError');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
    }

    /**
     * Get current lobby
     */
    getCurrentLobby() {
        return this.currentLobby;
    }

    /**
     * Get player name
     */
    getPlayerName() {
        return this.playerName;
    }
}

