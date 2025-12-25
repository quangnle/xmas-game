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
    const modal = $('modal');
    const duelModal = $('duelModal');
    if (modal) modal.classList.add('hidden');
    if (duelModal) duelModal.classList.add('hidden');
};

/**
 * Show modal with title and content
 * @param {string} title - Modal title
 * @param {string} content - Modal content HTML
 */
export const showModal = (title, content) => {
    const modalTitle = $('modalTitle');
    const modalContent = $('modalContent');
    const modal = $('modal');
    if (modalTitle) modalTitle.innerText = title;
    if (modalContent) modalContent.innerHTML = content;
    if (modal) modal.classList.remove('hidden');
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

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {Object} options - Options {position: {x, y}, duration: number}
 */
export const showToast = (message, options = {}) => {
    const div = document.createElement('div');
    div.className = 'absolute bg-yellow-400 text-black font-bold px-6 py-3 rounded-full shadow-xl z-40 animate-bounce';
    
    // Position
    if (options.position) {
        const { x, y } = options.position;
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        div.style.transform = 'translate(-50%, -50%)';
    } else {
        div.className += ' top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
    }
    
    div.innerHTML = message;
    document.body.appendChild(div);
    
    const duration = options.duration || 2000;
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transition = 'opacity 0.3s';
        setTimeout(() => div.remove(), 300);
    }, duration);
};

