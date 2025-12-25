/**
 * Seeded Random Number Generator
 * Ensures reproducible random generation
 */

/**
 * Seeded random number generator
 */
export class SeededRandom {
    /**
     * @param {number} seed - Random seed
     */
    constructor(seed) {
        this.seed = seed;
    }

    /**
     * Generate next random number (0 to 1)
     * @returns {number} Random number between 0 and 1
     */
    next() {
        // Linear Congruential Generator
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    /**
     * Generate random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random integer
     */
    randomInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /**
     * Generate random float between min and max
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random float
     */
    randomFloat(min, max) {
        return this.next() * (max - min) + min;
    }
}

/**
 * Create seeded random generator
 * @param {number} seed - Random seed
 * @returns {SeededRandom} Seeded random generator
 */
export function createSeededRandom(seed) {
    return new SeededRandom(seed);
}

/**
 * Generate random seed
 * @returns {number} Random seed
 */
export function generateSeed() {
    return Math.floor(Math.random() * 1000000);
}

