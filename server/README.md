# Xmas Game Server

Treasure Hunt Game Server với Socket.io support.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
server/
├── src/
│   ├── config/        # Game configuration
│   ├── core/          # GameProcessor (pure logic)
│   ├── storage/       # In-memory storage
│   ├── handlers/      # GameHandler, LobbyHandler
│   ├── socket/        # Socket.io setup
│   └── utils/         # Utilities
└── tests/
    └── unit/          # Unit tests
```

## Current Status

✅ Phase 0: Setup complete
✅ Phase 1.1: GameStorage complete
🔄 Phase 1.2: GameProcessor.initializeGame() in progress
⏳ Phase 1.3: Action methods (rollDice, movePlayer)
⏳ Phase 1.4: Advanced actions (dig, nextTurn, duel)

