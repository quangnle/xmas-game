/**
 * Unit tests for validation utilities
 */

import { validatePlayerName, validateLobbyCode } from '../../src/utils/validation.js';

describe('Validation Utils', () => {
    describe('validatePlayerName', () => {
        test('should accept valid player name', () => {
            const result = validatePlayerName('Player1');
            expect(result.valid).toBe(true);
        });

        test('should accept name with spaces', () => {
            const result = validatePlayerName('Player One');
            expect(result.valid).toBe(true);
        });

        test('should accept name with numbers', () => {
            const result = validatePlayerName('Player123');
            expect(result.valid).toBe(true);
        });

        test('should reject empty string', () => {
            const result = validatePlayerName('');
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should reject whitespace only', () => {
            const result = validatePlayerName('   ');
            expect(result.valid).toBe(false);
        });

        test('should reject name too short', () => {
            const result = validatePlayerName('');
            expect(result.valid).toBe(false);
        });

        test('should reject name too long', () => {
            const result = validatePlayerName('A'.repeat(21));
            expect(result.valid).toBe(false);
            expect(result.error).toContain('20');
        });

        test('should reject name with special characters', () => {
            const result = validatePlayerName('Player@123');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('letters, numbers');
        });

        test('should reject null', () => {
            const result = validatePlayerName(null);
            expect(result.valid).toBe(false);
        });

        test('should reject non-string', () => {
            const result = validatePlayerName(123);
            expect(result.valid).toBe(false);
        });
    });

    describe('validateLobbyCode', () => {
        test('should accept valid 6-digit code', () => {
            const result = validateLobbyCode('123456');
            expect(result.valid).toBe(true);
        });

        test('should reject code with letters', () => {
            const result = validateLobbyCode('12345a');
            expect(result.valid).toBe(false);
        });

        test('should reject code too short', () => {
            const result = validateLobbyCode('12345');
            expect(result.valid).toBe(false);
        });

        test('should reject code too long', () => {
            const result = validateLobbyCode('1234567');
            expect(result.valid).toBe(false);
        });

        test('should reject null', () => {
            const result = validateLobbyCode(null);
            expect(result.valid).toBe(false);
        });

        test('should reject non-string', () => {
            const result = validateLobbyCode(123456);
            expect(result.valid).toBe(false);
        });
    });
});

