# Quick Start Guide

## 🚀 Running the Server

```bash
# Install dependencies (if not done)
npm install

# Start server
npm start

# Or run in development mode (with auto-reload)
npm run dev
```

Server will run on `http://localhost:3000`

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📡 Socket.io Events

### Client → Server

**Game Actions:**
- `game:rollDice` - `{ gameId, playerName }`
- `game:move` - `{ gameId, playerName, direction: 'UP'|'DOWN'|'LEFT'|'RIGHT' }`
- `game:dig` - `{ gameId, playerName }`
- `game:nextTurn` - `{ gameId, playerName }`

**Duel Actions:**
- `game:duel:selectWeapon` - `{ gameId, playerName, weaponType: 'KNIFE'|'SWORD'|null }`
- `game:duel:roll` - `{ gameId, playerName }`
- `game:duel:resolve` - `{ gameId, playerName }`

**Connection:**
- `game:reconnect` - `{ gameId, playerName }`

### Server → Client

**Main Event:**
- `game:stateUpdate` - Full game state (broadcasted after every action)

**Other Events:**
- `game:error` - `{ message, code }`
- `game:playerReconnected` - `{ playerName }`
- `game:playerDisconnected` - `{ playerName }`
- `game:ended` - `{ winner, scores }`

## 📝 Example Usage

```javascript
// Client side (using socket.io-client)
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

// Create/join game (via lobby - to be implemented)
// For now, game must be created via GameProcessor

// Roll dice
socket.emit('game:rollDice', { gameId: 'game-123', playerName: 'Player1' });

// Move
socket.emit('game:move', { gameId: 'game-123', playerName: 'Player1', direction: 'UP' });

// Listen for state updates
socket.on('game:stateUpdate', (gameState) => {
    console.log('Game state updated:', gameState);
    // Render game state
});
```

## ✅ Current Status

- ✅ GameProcessor: Complete with all actions
- ✅ GameHandler: Complete with all handlers
- ✅ Socket.io: Server setup complete
- ✅ Broadcast: Full state broadcast working
- ⏳ Lobby System: Pending
- ⏳ Client Refactoring: Pending

