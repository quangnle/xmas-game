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
                        <!-- Create/Join Tabs -->
                        <div class="flex gap-2 mb-6 border-b">
                            <button id="createTab" class="flex-1 py-2 px-4 font-bold text-blue-600 border-b-2 border-blue-600">
                                Create Lobby
                            </button>
                            <button id="joinTab" class="flex-1 py-2 px-4 font-bold text-gray-500 hover:text-gray-700">
                                Join Lobby
                            </button>
                        </div>

                        <!-- Create Lobby Form -->
                        <div id="createForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">Your Name</label>
                                <input type="text" id="createNameInput" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                                    placeholder="Enter your name" maxlength="20">
                            </div>
                            <button id="createBtn" 
                                class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-500 transition">
                                Create Lobby
                            </button>
                        </div>

                        <!-- Join Lobby Form -->
                        <div id="joinForm" class="space-y-4 hidden">
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">Your Name</label>
                                <input type="text" id="joinNameInput" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                                    placeholder="Enter your name" maxlength="20">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">Lobby Code</label>
                                <input type="text" id="lobbyCodeInput" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-bold tracking-widest text-gray-900 bg-white"
                                    placeholder="000000" maxlength="6" pattern="[0-9]{6}">
                            </div>
                            <button id="joinBtn" 
                                class="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-500 transition">
                                Join Lobby
                            </button>
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
        $('joinTab').addEventListener('click', () => this.showJoinForm());
        $('createBtn').addEventListener('click', () => this.handleCreate());
        $('joinBtn').addEventListener('click', () => this.handleJoin());
        $('leaveLobbyBtn').addEventListener('click', () => this.handleLeave());
        $('startGameBtn').addEventListener('click', () => this.handleStartGame());
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
            // Emit event for game manager to handle
            window.dispatchEvent(new CustomEvent('game:started', { 
                detail: { gameId, gameState } 
            }));
        });

        this.socket.on('lobby:error', ({ message }) => {
            this.showError(message);
        });
    }

    /**
     * Show create form
     */
    showCreateForm() {
        $('createForm').classList.remove('hidden');
        $('joinForm').classList.add('hidden');
        $('createTab').classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
        $('createTab').classList.remove('text-gray-500');
        $('joinTab').classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
        $('joinTab').classList.add('text-gray-500');
    }

    /**
     * Show join form
     */
    showJoinForm() {
        $('createForm').classList.add('hidden');
        $('joinForm').classList.remove('hidden');
        $('joinTab').classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
        $('joinTab').classList.remove('text-gray-500');
        $('createTab').classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
        $('createTab').classList.add('text-gray-500');
    }

    /**
     * Handle create lobby
     */
    handleCreate() {
        const name = $('createNameInput').value.trim();
        if (!name) {
            this.showError('Please enter your name');
            return;
        }
        this.playerName = name;
        this.socket.emit('lobby:create', { hostName: name });
    }

    /**
     * Handle join lobby
     */
    handleJoin() {
        const name = $('joinNameInput').value.trim();
        const code = $('lobbyCodeInput').value.trim();
        
        if (!name) {
            this.showError('Please enter your name');
            return;
        }
        if (!code || code.length !== 6) {
            this.showError('Please enter a valid 6-digit lobby code');
            return;
        }
        
        this.playerName = name;
        this.socket.emit('lobby:join', { lobbyCode: code, playerName: name });
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
                        <button class="px-4 py-1 rounded ${player.ready ? 'bg-green-500' : 'bg-gray-300'} text-white text-sm font-bold"
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

