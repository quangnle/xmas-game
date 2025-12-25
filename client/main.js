/**
 * Main Client Entry Point
 * Initialize lobby and game
 */

import { SocketClient } from './socket.js';
import { LobbyManager } from './lobby.js';
import { GameClient } from './gameClient.js';
import { closeModal } from './utils.js';

// Make closeModal available globally
window.closeModal = closeModal;

let socketClient;
let lobbyManager;
let gameClient;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize socket
    socketClient = new SocketClient();
    socketClient.connect();

    // Initialize lobby manager
    lobbyManager = new LobbyManager(socketClient);
    window.lobbyManager = lobbyManager; // For onclick handlers

    // Listen for game start
    window.addEventListener('game:started', (event) => {
        const { gameId, gameState, lobbyCode } = event.detail;
        const playerName = lobbyManager.getPlayerName();
        
        // Initialize game client
        gameClient = new GameClient(socketClient, playerName);
        gameClient.initGame(gameId, gameState, lobbyCode);
    });

    // Handle socket connection
    socketClient.on('connect', () => {
        console.log('Connected to server');
    });

    socketClient.on('disconnect', () => {
        console.log('Disconnected from server');
    });
});

