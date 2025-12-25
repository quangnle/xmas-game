/**
 * Socket.io Client Connection
 * Handles all socket communication with server
 */

import { io } from 'https://cdn.socket.io/4.5.4/socket.io.esm.min.js';
import { SERVER_URL } from './config.js';

export class SocketClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.eventHandlers = new Map();
    }

    /**
     * Connect to server
     */
    connect() {
        if (this.socket?.connected) {
            return;
        }

        this.socket = io(SERVER_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            console.log('Connected to server:', this.socket.id);
            this.isConnected = true;
            this.emit('client:connected');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.isConnected = false;
            this.emit('client:disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.emit('client:error', { message: 'Failed to connect to server' });
        });
    }

    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    /**
     * Emit event to server
     * @param {string} event - Event name
     * @param {any} data - Data to send
     */
    emit(event, data) {
        if (!this.socket || !this.isConnected) {
            console.warn('Socket not connected, cannot emit:', event);
            return;
        }
        this.socket.emit(event, data);
    }

    /**
     * Listen to server event
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    on(event, handler) {
        if (!this.socket) {
            console.warn('Socket not initialized, cannot listen to:', event);
            return;
        }
        this.socket.on(event, handler);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} handler - Event handler (optional)
     */
    off(event, handler) {
        if (!this.socket) {
            return;
        }
        if (handler) {
            this.socket.off(event, handler);
        } else {
            this.socket.off(event);
        }
    }

    /**
     * Get socket ID
     * @returns {string|null}
     */
    getId() {
        return this.socket?.id || null;
    }

    /**
     * Check if connected
     * @returns {boolean}
     */
    connected() {
        return this.isConnected && this.socket?.connected;
    }
}

