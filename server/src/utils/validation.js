/**
 * Input Validation Utilities
 */

/**
 * Validate player name
 * @param {string} name - Player name
 * @returns {{valid: boolean, error?: string}}
 */
export function validatePlayerName(name) {
    if (!name || typeof name !== 'string') {
        return { valid: false, error: 'Player name must be a string' };
    }
    
    const trimmed = name.trim();
    
    if (trimmed.length === 0) {
        return { valid: false, error: 'Player name cannot be empty' };
    }
    
    if (trimmed.length < 1 || trimmed.length > 20) {
        return { valid: false, error: 'Player name must be between 1 and 20 characters' };
    }
    
    // Only allow letters, numbers, and spaces
    if (!/^[a-zA-Z0-9\s]+$/.test(trimmed)) {
        return { valid: false, error: 'Player name can only contain letters, numbers, and spaces' };
    }
    
    return { valid: true };
}

/**
 * Validate lobby code
 * @param {string} code - Lobby code
 * @returns {{valid: boolean, error?: string}}
 */
export function validateLobbyCode(code) {
    if (!code || typeof code !== 'string') {
        return { valid: false, error: 'Lobby code must be a string' };
    }
    
    if (!/^\d{3}$/.test(code)) {
        return { valid: false, error: 'Lobby code must be 3 digits' };
    }
    
    return { valid: true };
}

