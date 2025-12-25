/**
 * Main Server Entry Point
 * Express + Socket.io setup
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GameProcessor } from './core/GameProcessor.js';
import { GameStorage } from './storage/GameStorage.js';
import { GameHandler } from './handlers/GameHandler.js';
import { LobbyStorage } from './storage/LobbyStorage.js';
import { LobbyHandler } from './handlers/LobbyHandler.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Initialize storage and processor
const gameStorage = new GameStorage();
const gameProcessor = new GameProcessor(gameStorage);
const lobbyStorage = new LobbyStorage();

// Socket map for getting socket by socketId
const socketMap = new Map();

// Helper to get socket by socketId
function getSocket(socketId) {
    return socketMap.get(socketId);
}

// Initialize handlers
const gameHandler = new GameHandler(gameProcessor, gameStorage, getSocket);
const lobbyHandler = new LobbyHandler(lobbyStorage, gameProcessor, getSocket, io);

// Express middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socketMap.set(socket.id, socket);

    // Lobby Actions
    socket.on('lobby:create', ({ hostName, roomCode }) => {
        lobbyHandler.handleCreateLobby(socket, hostName, roomCode);
    });

    socket.on('lobby:join', ({ lobbyCode, playerName }) => {
        lobbyHandler.handleJoinLobby(socket, lobbyCode, playerName);
    });

    socket.on('lobby:ready', ({ lobbyId, playerName }) => {
        lobbyHandler.handleToggleReady(socket, lobbyId, playerName);
    });

    socket.on('lobby:start', ({ lobbyId, playerName }) => {
        lobbyHandler.handleStartGame(socket, lobbyId, playerName);
    });

    socket.on('lobby:leave', ({ lobbyId, playerName }) => {
        lobbyHandler.handleLeaveLobby(socket, lobbyId, playerName);
    });

    // Helper function for lobby broadcast
    socket.on('lobby:getUpdate', ({ lobbyId }) => {
        const lobby = lobbyStorage.getLobby(lobbyId);
        if (lobby) {
            socket.emit('lobby:updated', lobby);
        }
    });

    // Get lobby list
    socket.on('lobby:list', () => {
        lobbyHandler.handleGetLobbyList(socket);
    });

    // Game Actions
    socket.on('game:rollDice', ({ gameId, playerName }) => {
        gameHandler.handleRollDice(socket, gameId, playerName);
    });

    socket.on('game:move', ({ gameId, playerName, direction }) => {
        gameHandler.handleMove(socket, gameId, playerName, direction);
    });

    socket.on('game:dig', ({ gameId, playerName }) => {
        gameHandler.handleDig(socket, gameId, playerName);
    });

    socket.on('game:nextTurn', ({ gameId, playerName }) => {
        gameHandler.handleNextTurn(socket, gameId, playerName);
    });

    // Duel Actions
    socket.on('game:duel:selectWeapon', ({ gameId, playerName, weaponType }) => {
        gameHandler.handleDuelSelectWeapon(socket, gameId, playerName, weaponType);
    });

    socket.on('game:duel:roll', ({ gameId, playerName }) => {
        gameHandler.handleDuelRoll(socket, gameId, playerName);
    });

    socket.on('game:duel:resolve', ({ gameId, playerName }) => {
        gameHandler.handleDuelResolve(socket, gameId, playerName);
    });

    // Connection Management
    socket.on('game:reconnect', ({ gameId, playerName }) => {
        gameHandler.handleReconnect(socket, gameId, playerName);
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        socketMap.delete(socket.id);
        
        // Find and handle disconnect for all games
        const allGames = gameStorage.getAllGames();
        allGames.forEach(game => {
            gameHandler.handleDisconnect(socket, game.gameId);
        });
        
        // Find and handle disconnect for all lobbies
        const allLobbies = lobbyStorage.getAllLobbies();
        allLobbies.forEach(lobby => {
            const player = lobby.players.find(p => p.socketId === socket.id);
            if (player) {
                lobbyHandler.handleLeaveLobby(socket, lobby.lobbyId, player.name);
            }
        });
    });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.io ready for connections`);
});

