/**
 * Utility Functions
 */

/**
 * Get element by ID
 * @param {string} id - Element ID
 * @returns {HTMLElement}
 */
export const $ = (id) => document.getElementById(id);

/**
 * Close all modals
 */
export const closeModal = () => {
    $('modal').classList.add('hidden');
    $('duelModal').classList.add('hidden');
};

/**
 * Show modal with title and content
 * @param {string} title - Modal title
 * @param {string} content - Modal content HTML
 */
export const showModal = (title, content) => {
    $('modalTitle').innerText = title;
    $('modalContent').innerHTML = content;
    $('modal').classList.remove('hidden');
};

/**
 * Generate random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number}
 */
export const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Roll a single die
 * @returns {number} - Value between 1 and 6
 */
export const rollDie = () => {
    return randomInt(1, 6);
};

