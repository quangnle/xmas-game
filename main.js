/**
 * Main entry point
 * Initialize game when DOM is ready
 */

import { Game } from './game.js';
import { closeModal } from './utils.js';

// Make closeModal available globally for onclick handlers
window.closeModal = closeModal;

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

