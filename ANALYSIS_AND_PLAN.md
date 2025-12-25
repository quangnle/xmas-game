# PHÂN TÍCH VÀ KẾ HOẠCH CHUYỂN ĐỔI SANG CHẾ ĐỘ ONLINE

## 📋 PHÂN TÍCH CẤU TRÚC HIỆN TẠI

### 1. Kiến trúc hiện tại (Offline Mode)

**Frontend (Client-side):**
- `game.js`: Class Game quản lý toàn bộ game state, logic, rendering
- `config.js`: Cấu hình constants (grid, players, items, etc.)
- `main.js`: Entry point khởi tạo game
- `utils.js`: Utility functions
- `index.html`: UI structure với modals, controls
- `styles.css`: Styling

**Đặc điểm:**
- ✅ Game state được quản lý hoàn toàn ở client
- ✅ Tất cả logic game chạy local
- ✅ Turn-based gameplay với state machine (IDLE, MOVE, DUEL)
- ✅ Random generation (grid, treasures, items) ở client
- ✅ Single device multiplayer (4 players cùng máy)

### 2. Các thành phần game cần đồng bộ

**Game State:**
- Grid terrain (40x40)
- Players (position, coins, inventory, weapons)
- Treasures (position, found status)
- Snowmen (position, treasureIndex)
- Gifts (position)
- Weapons (position, type)
- Current player turn
- Dice value & moves left
- Game state (IDLE, MOVE, DUEL)

**Player Actions:**
- Roll dice
- Move player
- Dig for treasure
- Skip turn
- Duel (weapon selection, dice roll, resolution)
- Pick up items (gifts, weapons, clues)

---

## 🎯 KẾ HOẠCH CHUYỂN ĐỔI SANG ONLINE MODE

### ⚠️ YÊU CẦU QUAN TRỌNG

**Kiến trúc Core:**
- ✅ **Game Processor**: File xử lý logic game thuần túy, KHÔNG có UI
- ✅ **Game Handler**: Nhận và xử lý actions từ client, gọi Game Processor
- ✅ **Memory Storage**: Game state lưu trong memory (Map/Object), KHÔNG cần database
- ✅ **Reconnection**: Player có thể reconnect bằng player name (không cần token phức tạp)
- ✅ **Client Role**: Client CHỈ nhận tín hiệu từ server và render, KHÔNG có logic game
- ✅ **Duel Broadcast**: Tất cả players đều nhìn thấy thông tin duel, không chỉ 2 players engage
- ✅ **Full State Broadcast**: Sau mỗi action, server broadcast TOÀN BỘ game state đến tất cả clients

**Player Actions:**
- `MoveUp`, `MoveDown`, `MoveLeft`, `MoveRight`
- `Dig`
- `Duel` (với các sub-actions: selectWeapon, roll, resolve)
- `NextTurn` (skip turn)
- `RollDice`

---

### PHASE 1: KIẾN TRÚC BACKEND

#### 1.1 Server Setup
**Công nghệ đề xuất:**
- **Node.js + Express**: REST API server
- **Socket.io**: Real-time bidirectional communication
- **Storage**: In-memory (Map/Object) - KHÔNG cần database

**Cấu trúc thư mục backend:**
```
server/
├── src/
│   ├── server.js              # Main server entry
│   ├── config/
│   │   └── gameConfig.js      # Server-side game config
│   ├── core/
│   │   ├── GameProcessor.js   # ⭐ CORE: Pure game logic (NO UI)
│   │   └── GameState.js       # Game state structure
│   ├── handlers/
│   │   ├── GameHandler.js     # ⭐ Handle client actions, call GameProcessor
│   │   └── LobbyHandler.js    # Lobby management
│   ├── storage/
│   │   ├── GameStorage.js     # In-memory game storage (Map)
│   │   └── LobbyStorage.js   # In-memory lobby storage (Map)
│   ├── socket/
│   │   ├── socketHandler.js   # Socket.io connection handling
│   │   └── gameEvents.js      # Game-specific socket events
│   ├── api/
│   │   ├── routes/
│   │   │   ├── game.js        # REST API routes (optional)
│   │   │   └── lobby.js       # Lobby API routes
│   │   └── controllers/
│   │       └── lobbyController.js
│   └── utils/
│       ├── random.js          # Seeded random generator
│       └── validation.js      # Input validation helpers
└── package.json
```

#### 1.2 Game Processor (Core Logic)
**File: `core/GameProcessor.js`**

**Trách nhiệm:**
- ✅ Khởi tạo game (generate map, place items, init players)
- ✅ Xử lý tất cả game logic (move, dig, duel, turn management)
- ✅ Update game state
- ✅ Validate actions
- ✅ **KHÔNG có UI, KHÔNG có network, KHÔNG có database**

**Methods:**
```javascript
class GameProcessor {
  // Initialization
  initializeGame(players, seed?) // Generate map, place items, init state
  
  // Player Actions
  rollDice(gameId, playerName) // Roll dice for current player
  movePlayer(gameId, playerName, direction) // MoveUp/Down/Left/Right
  dig(gameId, playerName) // Dig for treasure
  nextTurn(gameId, playerName) // Skip to next turn
  duelSelectWeapon(gameId, playerName, weaponType) // Select weapon for duel
  duelRoll(gameId, playerName) // Roll dice in duel
  duelResolve(gameId, playerName) // Resolve duel result
  
  // State Management
  getGameState(gameId) // Get full game state
  updatePlayerState(gameId, playerName, updates) // Update player data
  
  // Validation
  canPerformAction(gameId, playerName, action) // Check if action is valid
  isPlayerTurn(gameId, playerName) // Check if it's player's turn
}
```

**Game State Structure:**
```javascript
{
  gameId: string,
  status: 'WAITING' | 'PLAYING' | 'FINISHED',
  seed: number, // For reproducible random generation
  
  // Turn Management
  currentPlayerIndex: number,
  turnState: 'IDLE' | 'MOVE' | 'DUEL',
  diceValue: number,
  currentMoves: number,
  hasExtraTurn: boolean,
  
  // Players
  players: [{
    id: string,
    name: string, // ⭐ Used for reconnection
    color: string,
    x: number,
    y: number,
    coins: number,
    inventory: [number], // Treasure clue indices
    weapons: [string], // ['KNIFE', 'SWORD', ...]
    startPos: {x, y},
    socketId: string | null // null if disconnected
  }],
  
  // Map & Items
  grid: number[][], // 40x40 terrain grid
  treasures: [{x, y, value, found, index}],
  snowmen: [{x, y, treasureIndex}],
  gifts: [{x, y}],
  weapons: [{x, y, type: 'KNIFE' | 'SWORD'}],
  
  // Duel State (if in duel)
  duelState: {
    player1: string, // player name
    player2: string, // player name
    player1Weapon: string | null,
    player2Weapon: string | null,
    player1Roll: number | null,
    player2Roll: number | null,
    phase: 'SELECT_WEAPON' | 'ROLLING' | 'RESOLVING'
  } | null
}
```

#### 1.3 Game Handler
**File: `handlers/GameHandler.js`**

**Trách nhiệm:**
- ✅ Nhận actions từ client (qua Socket.io)
- ✅ Validate request (player exists, game exists, etc.)
- ✅ Gọi GameProcessor để xử lý logic
- ✅ Broadcast full game state đến tất cả clients sau mỗi action
- ✅ Handle reconnection (match by player name)

**Flow:**
```
Client Action → GameHandler → GameProcessor → Update State → Broadcast to All Clients
```

**Methods:**
```javascript
class GameHandler {
  // Action Handlers
  handleRollDice(socket, gameId)
  handleMove(socket, gameId, direction) // 'UP', 'DOWN', 'LEFT', 'RIGHT'
  handleDig(socket, gameId)
  handleNextTurn(socket, gameId)
  handleDuelSelectWeapon(socket, gameId, weaponType)
  handleDuelRoll(socket, gameId)
  handleDuelResolve(socket, gameId)
  
  // Connection Management
  handleReconnect(socket, gameId, playerName) // Reconnect by name
  handleDisconnect(socket, gameId)
  
  // Broadcasting
  broadcastGameState(gameId) // Send full state to all players
  broadcastToPlayer(socket, event, data) // Send to specific player
}
```

#### 1.4 Game Storage (In-Memory)
**File: `storage/GameStorage.js`**

**Trách nhiệm:**
- ✅ Lưu trữ game state trong memory (Map)
- ✅ Quản lý game lifecycle
- ✅ Cleanup khi game end

```javascript
class GameStorage {
  private games: Map<string, GameState> = new Map();
  
  createGame(gameId, initialState)
  getGame(gameId): GameState
  updateGame(gameId, updates)
  deleteGame(gameId)
  getAllGames(): GameState[]
}
```


---

### PHASE 2: LOBBY SYSTEM

#### 2.1 Lobby Features
**Chức năng cần có:**
- ✅ Tạo lobby (host) - **Host phải nhập tên**
- ✅ Join lobby bằng code/ID - **⭐ BẮT BUỘC nhập player name**
- ✅ List public lobbies
- ✅ Player ready system
- ✅ Lobby settings (max players, map size, etc.)
- ✅ Kick player (host only)
- ✅ Start game (host only, khi đủ players ready)
- ✅ Leave lobby
- ✅ Auto-cleanup empty lobbies

**⭐ Yêu cầu quan trọng:**
- **Player name là BẮT BUỘC** khi join lobby
- Player name phải unique trong lobby (không trùng)
- Player name được dùng để reconnect sau này
- Client phải có input field cho player name trước khi join

**Lobby State:**
```javascript
{
  lobbyId: string,
  hostId: string,
  code: string, // 6-digit code
  players: [{
    userId: string,
    name: string,
    color: string,
    ready: boolean,
    socketId: string
  }],
  settings: {
    maxPlayers: number,
    gridSize: number,
    // ... other settings
  },
  status: 'WAITING' | 'STARTING' | 'IN_GAME'
}
```

#### 2.2 API Endpoints
```
POST   /api/lobby/create          # Tạo lobby
# Body: { hostName: string } ⭐ Host name bắt buộc

POST   /api/lobby/join/:code     # Join lobby
# Body: { playerName: string } ⭐ Player name BẮT BUỘC

GET    /api/lobby/:id             # Get lobby info
POST   /api/lobby/:id/ready       # Toggle ready
POST   /api/lobby/:id/start       # Start game (host only)
POST   /api/lobby/:id/leave       # Leave lobby
GET    /api/lobby/list            # List public lobbies
DELETE /api/lobby/:id             # Delete lobby (host only)
```

**Validation:**
- ✅ `playerName` không được trống
- ✅ `playerName` không được trùng trong lobby
- ✅ `playerName` có độ dài hợp lệ (ví dụ: 1-20 ký tự)
- ✅ `playerName` chỉ chứa ký tự hợp lệ (chữ, số, khoảng trắng, không có ký tự đặc biệt)

#### 2.3 Socket Events - Lobby
```javascript
// Client -> Server
socket.emit('lobby:create', { hostName: string }) // ⭐ Host name bắt buộc
socket.emit('lobby:join', { lobbyId, playerName: string }) // ⭐ Player name BẮT BUỘC
socket.emit('lobby:ready', { lobbyId })
socket.emit('lobby:leave', { lobbyId })
socket.emit('lobby:start', { lobbyId })

// Server -> Client
socket.on('lobby:created', (lobbyData))
socket.on('lobby:joined', (lobbyData))
socket.on('lobby:joinError', ({ message, code })) // ⭐ Error nếu name trùng hoặc invalid
socket.on('lobby:playerJoined', (playerData))
socket.on('lobby:playerLeft', (playerId))
socket.on('lobby:playerReady', ({ playerId, ready }))
socket.on('lobby:updated', (lobbyData))
socket.on('lobby:gameStarting', (gameData))
```

**Validation trên Server:**
- ✅ Validate `playerName` không trống
- ✅ Validate `playerName` không trùng trong lobby
- ✅ Validate `playerName` format hợp lệ
- ✅ Return error nếu validation fail: `lobby:joinError` event

#### 2.4 LobbyHandler Implementation
**File: `handlers/LobbyHandler.js`**

**Methods:**
```javascript
class LobbyHandler {
  // Lobby Management
  handleCreateLobby(socket, hostName) {
    // ⭐ Validate hostName
    if (!this.validatePlayerName(hostName)) {
      return this.sendError(socket, 'Invalid host name');
    }
    
    // Create lobby với host
    const lobby = this.lobbyStorage.createLobby(hostName, socket.id);
    socket.join(lobby.lobbyId);
    socket.emit('lobby:created', lobby);
  }
  
  handleJoinLobby(socket, lobbyId, playerName) {
    // ⭐ Validate playerName
    if (!this.validatePlayerName(playerName)) {
      return this.sendError(socket, 'Invalid player name');
    }
    
    const lobby = this.lobbyStorage.getLobby(lobbyId);
    if (!lobby) {
      return this.sendError(socket, 'Lobby not found');
    }
    
    // ⭐ Check name trùng
    if (lobby.players.some(p => p.name === playerName)) {
      return this.sendError(socket, 'Player name already taken');
    }
    
    // Add player to lobby
    const player = this.lobbyStorage.addPlayer(lobbyId, playerName, socket.id);
    socket.join(lobbyId);
    socket.emit('lobby:joined', lobby);
    
    // Broadcast to other players
    socket.to(lobbyId).emit('lobby:playerJoined', player);
  }
  
  // Validation helper
  validatePlayerName(name) {
    if (!name || typeof name !== 'string') return false;
    if (name.trim().length === 0) return false;
    if (name.length < 1 || name.length > 20) return false;
    // Chỉ cho phép chữ, số, khoảng trắng
    if (!/^[a-zA-Z0-9\s]+$/.test(name)) return false;
    return true;
  }
}
```

---

### PHASE 3: GAME PROCESSOR IMPLEMENTATION

#### 3.1 Game Processor Logic
**Tất cả logic game được implement trong GameProcessor:**

**Initialization:**
- ✅ Generate grid với seeded random
- ✅ Place treasures, snowmen, gifts, weapons
- ✅ Initialize players với starting positions
- ✅ Set initial game state

**Action Processing:**
- ✅ `rollDice()`: Roll 2 dice, set moves, check extra turn
- ✅ `movePlayer(direction)`: Validate move, update position, check tile events
- ✅ `dig()`: Check treasure, validate clue, update coins
- ✅ `nextTurn()`: Switch to next player, reset state
- ✅ `duelSelectWeapon()`: Set weapon for duel
- ✅ `duelRoll()`: Roll dice for duel
- ✅ `duelResolve()`: Calculate winner, update positions/coins

**State Updates:**
- ✅ Update player position, coins, inventory, weapons
- ✅ Remove collected items (gifts, weapons)
- ✅ Mark found treasures
- ✅ Manage turn state transitions

#### 3.2 Action Validation trong GameProcessor
**Mỗi action method validate:**
- ✅ Is it player's turn? (`isPlayerTurn()`)
- ✅ Is action valid in current state? (IDLE/MOVE/DUEL)
- ✅ Are resources available? (moves left, items, etc.)
- ✅ Is position valid? (boundaries, terrain cost)
- ✅ Is player in game? (check playerName exists)

---

### PHASE 4: SOCKET COMMUNICATION

#### 4.1 Socket Events - Game Actions
**Client → Server (Player Actions):**
```javascript
// Dice & Turn
socket.emit('game:rollDice', { gameId, playerName })
socket.emit('game:nextTurn', { gameId, playerName })

// Movement
socket.emit('game:move', { gameId, playerName, direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' })
// Hoặc tách riêng:
socket.emit('game:moveUp', { gameId, playerName })
socket.emit('game:moveDown', { gameId, playerName })
socket.emit('game:moveLeft', { gameId, playerName })
socket.emit('game:moveRight', { gameId, playerName })

// Actions
socket.emit('game:dig', { gameId, playerName })

// Duel Actions
socket.emit('game:duel:selectWeapon', { gameId, playerName, weaponType: 'KNIFE' | 'SWORD' })
socket.emit('game:duel:roll', { gameId, playerName })
socket.emit('game:duel:resolve', { gameId, playerName })

// Connection
socket.emit('game:reconnect', { gameId, playerName })
```

**Server → Client (State Updates):**
```javascript
// ⭐ MAIN EVENT: Broadcast full game state sau mỗi action
socket.on('game:stateUpdate', (fullGameState) => {
  // fullGameState chứa TOÀN BỘ thông tin:
  // - grid, players, treasures, snowmen, gifts, weapons
  // - currentPlayerIndex, turnState, diceValue, currentMoves
  // - duelState (nếu đang duel)
  // Client chỉ cần render state này
})

// Specific events (optional, for UI feedback)
socket.on('game:actionResult', ({ action, success, message }))
socket.on('game:error', ({ message, code }))
socket.on('game:playerReconnected', ({ playerName }))
socket.on('game:playerDisconnected', ({ playerName }))
socket.on('game:ended', ({ winner, scores }))
```

#### 4.2 State Synchronization Strategy
**⭐ FULL STATE BROADCAST (Required):**

Sau MỖI action (move, dig, duel, roll dice, nextTurn), server PHẢI:
1. GameHandler nhận action từ client
2. GameHandler gọi GameProcessor để xử lý
3. GameProcessor update game state
4. GameHandler broadcast **TOÀN BỘ game state** đến TẤT CẢ players trong game

**Broadcast Pattern:**
```javascript
// Trong GameHandler, sau mỗi action:
handleMove(socket, gameId, direction) {
  // 1. Validate
  if (!this.canPerformAction(gameId, playerName, 'MOVE')) {
    return this.sendError(socket, 'Invalid action');
  }
  
  // 2. Process action
  const result = this.gameProcessor.movePlayer(gameId, playerName, direction);
  
  // 3. Get updated state
  const fullState = this.gameProcessor.getGameState(gameId);
  
  // 4. Broadcast to ALL players (including sender)
  this.broadcastGameState(gameId, fullState);
}

broadcastGameState(gameId, gameState) {
  const game = this.storage.getGame(gameId);
  game.players.forEach(player => {
    if (player.socketId) {
      const socket = this.getSocket(player.socketId);
      socket.emit('game:stateUpdate', gameState);
    }
  });
}
```

**Duel Broadcast:**
- ⚠️ **QUAN TRỌNG**: Khi duel xảy ra, TẤT CẢ players phải nhìn thấy:
  - Duel modal với 2 players
  - Weapon selection của cả 2 players
  - Dice rolls của cả 2 players
  - Duel result
  
- Duel state được include trong `fullGameState.duelState`
- Client render duel UI dựa trên `duelState` (không phải chỉ 2 players engage mới thấy)

---

### PHASE 5: CLIENT REFACTORING

#### 5.1 Client Architecture - Render Only
**⭐ QUAN TRỌNG: Client KHÔNG có game logic, CHỈ render**

**Cấu trúc mới:**
```
client/
├── src/
│   ├── game/
│   │   ├── GameRenderer.js    # ⭐ Render game state (grid, players, items)
│   │   ├── GameUI.js          # UI controls (buttons, modals)
│   │   └── GameState.js       # Local state holder (chỉ lưu state từ server)
│   ├── network/
│   │   ├── SocketClient.js    # Socket.io client wrapper
│   │   └── ApiClient.js       # REST API client (cho lobby)
│   ├── lobby/
│   │   ├── LobbyManager.js    # Lobby UI logic
│   │   └── LobbyUI.js         # Lobby UI components
│   ├── utils/
│   │   └── ... (existing utils - chỉ UI helpers)
│   └── main.js                # Entry point
```

#### 5.2 GameRenderer - Pure Rendering
**File: `game/GameRenderer.js`**

**Trách nhiệm:**
- ✅ Render grid từ `gameState.grid`
- ✅ Render players từ `gameState.players`
- ✅ Render items từ `gameState.treasures`, `gameState.snowmen`, etc.
- ✅ Render UI dựa trên `gameState.turnState`, `gameState.currentPlayerIndex`
- ✅ Render duel UI từ `gameState.duelState` (nếu có)
- ❌ **KHÔNG có logic**: Không validate moves, không roll dice, không tính toán

**Methods:**
```javascript
class GameRenderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.gameState = null; // State từ server
  }
  
  // Update state từ server
  updateState(gameState) {
    this.gameState = gameState;
    this.render(); // Re-render ngay
  }
  
  // Render methods
  render() {
    this.renderGrid();
    this.renderItems();
    this.renderPlayers();
    this.renderUI();
  }
  
  renderGrid() { /* Render từ gameState.grid */ }
  renderPlayers() { /* Render từ gameState.players */ }
  renderItems() { /* Render từ gameState.treasures, etc. */ }
  renderUI() { /* Render UI dựa trên gameState.turnState */ }
  renderDuel() { /* Render từ gameState.duelState */ }
}
```

#### 5.3 GameUI - Action Dispatcher
**File: `game/GameUI.js`**

**Trách nhiệm:**
- ✅ Setup UI controls (buttons, keyboard)
- ✅ Gửi actions lên server (KHÔNG xử lý logic)
- ✅ Update UI state dựa trên `gameState.turnState`
- ✅ Show/hide modals dựa trên `gameState.duelState`

**Action Dispatching:**
```javascript
class GameUI {
  constructor(socketClient, gameState) {
    this.socket = socketClient;
    this.gameState = gameState;
    this.setupControls();
  }
  
  setupControls() {
    // Buttons chỉ emit events, không có logic
    $('rollBtn').onclick = () => {
      this.socket.emit('game:rollDice', { 
        gameId: this.gameState.gameId,
        playerName: this.getCurrentPlayerName()
      });
    };
    
    $('btnUp').onclick = () => {
      this.socket.emit('game:move', { 
        gameId: this.gameState.gameId,
        playerName: this.getCurrentPlayerName(),
        direction: 'UP'
      });
    };
    
    // ... các buttons khác
  }
  
  updateUI() {
    // Update button states dựa trên gameState
    const isMyTurn = this.isMyTurn();
    const canMove = isMyTurn && this.gameState.turnState === 'MOVE' && this.gameState.currentMoves > 0;
    
    $('btnUp').disabled = !canMove;
    $('btnDown').disabled = !canMove;
    // ... update các controls khác
  }
  
  showDuelModal() {
    // Show duel modal dựa trên gameState.duelState
    if (this.gameState.duelState) {
      // Render duel UI cho TẤT CẢ players
      // Không chỉ 2 players engage
    }
  }
}
```

#### 5.4 Socket Event Handlers
**File: `network/SocketClient.js`**

**Trách nhiệm:**
- ✅ Connect to server
- ✅ Listen to `game:stateUpdate` events
- ✅ Update GameRenderer khi nhận state mới
- ✅ Handle errors và reconnection

```javascript
class SocketClient {
  constructor(gameRenderer, gameUI) {
    this.socket = io();
    this.gameRenderer = gameRenderer;
    this.gameUI = gameUI;
    this.setupListeners();
  }
  
  setupListeners() {
    // ⭐ MAIN EVENT: Nhận full state từ server
    this.socket.on('game:stateUpdate', (fullGameState) => {
      // Update renderer
      this.gameRenderer.updateState(fullGameState);
      
      // Update UI controls
      this.gameUI.updateUI();
      
      // Show/hide modals dựa trên state
      if (fullGameState.duelState) {
        this.gameUI.showDuelModal(fullGameState.duelState);
      }
    });
    
    this.socket.on('game:error', ({ message }) => {
      showModal('Error', message);
    });
  }
  
  // Action methods (chỉ emit, không xử lý)
  rollDice(gameId, playerName) {
    this.socket.emit('game:rollDice', { gameId, playerName });
  }
  
  move(gameId, playerName, direction) {
    this.socket.emit('game:move', { gameId, playerName, direction });
  }
  
  // ... các actions khác
}
```

#### 5.5 Client Flow
```
1. User clicks button → GameUI emits action → SocketClient sends to server
2. Server processes → GameProcessor updates state → GameHandler broadcasts
3. Client receives 'game:stateUpdate' → GameRenderer updates → UI re-renders
```

**Key Points:**
- ✅ Client KHÔNG validate actions (server validate)
- ✅ Client KHÔNG calculate moves (server calculate)
- ✅ Client CHỈ render state và emit actions
- ✅ Tất cả logic ở server (GameProcessor)

#### 5.3 Lobby UI
**Cần tạo:**

**1. Lobby Creation Screen:**
- ⭐ **Input field cho Host Name** (bắt buộc)
- Button "Create Lobby"
- Validation: Name không trống, format hợp lệ
- Sau khi tạo, chuyển đến waiting room

**2. Lobby Join Screen:**
- ⭐ **Input field cho Player Name** (BẮT BUỘC)
- Input field cho Lobby Code
- Button "Join Lobby"
- Validation: 
  - Name không trống
  - Name format hợp lệ (1-20 ký tự, không có ký tự đặc biệt)
  - Code format hợp lệ
- Error message nếu name trùng hoặc invalid
- Sau khi join thành công, chuyển đến waiting room

**3. Lobby Waiting Room:**
- Hiển thị danh sách players (với names)
- Ready button cho mỗi player
- Start game button (chỉ host thấy)
- Leave lobby button
- Real-time updates khi có player join/leave

**4. Game Start Transition:**
- Loading screen
- Chuyển sang game screen khi game bắt đầu

**UI Flow:**
```
Home Screen
  ↓
[Enter Player Name] ← ⭐ BẮT BUỘC
  ↓
Create Lobby OR Join Lobby
  ↓
Waiting Room (với player names)
  ↓
Game Start
```

---

### PHASE 6: SECURITY & VALIDATION

#### 6.1 Security Concerns
- ✅ **Cheat Prevention**: 
  - Dice rolls phải ở server
  - Move validation ở server
  - Rate limiting cho actions
- ✅ **Input Validation**: 
  - Validate tất cả inputs
  - Sanitize user data
  - ⭐ **Player Name Validation**:
    - Không được trống
    - Độ dài hợp lệ (1-20 ký tự)
    - Format hợp lệ (chữ, số, khoảng trắng, không có ký tự đặc biệt)
    - Không trùng trong lobby
- ✅ **Authentication** (Optional):
  - User accounts
  - Session management
- ✅ **Authorization**:
  - Verify player ownership
  - Verify turn ownership

#### 6.2 Anti-Cheat Measures
- Server-side random generation
- Action validation
- State checksums (optional)
- Rate limiting
- Reconnection handling (prevent duplicate actions)

---

### PHASE 7: ERROR HANDLING & EDGE CASES

#### 7.1 Connection Issues
- **Disconnect handling**: 
  - Pause game khi player disconnect
  - Reconnection với state recovery
  - Auto-kick sau timeout
- **Network latency**:
  - Optimistic UI updates (optional)
  - Server reconciliation
- **Server errors**:
  - Graceful error messages
  - State recovery

#### 7.2 Game Edge Cases
- Player leaves mid-game
- Duel khi player disconnect
- Turn timeout (auto-skip)
- Game abandonment

---

## 📐 CẤU TRÚC ĐỀ NGHỊ CHI TIẾT

### Backend Structure
```
server/
├── src/
│   ├── server.js                    # Express + Socket.io setup
│   │
│   ├── core/
│   │   ├── GameProcessor.js         # ⭐ CORE: Pure game logic
│   │   │   ├── initializeGame()
│   │   │   ├── rollDice()
│   │   │   ├── movePlayer()
│   │   │   ├── dig()
│   │   │   ├── nextTurn()
│   │   │   ├── duelSelectWeapon()
│   │   │   ├── duelRoll()
│   │   │   ├── duelResolve()
│   │   │   └── getGameState()
│   │   │
│   │   └── GameState.js             # Game state type/interface
│   │
│   ├── handlers/
│   │   ├── GameHandler.js           # ⭐ Handle client actions
│   │   │   ├── handleRollDice()
│   │   │   ├── handleMove()
│   │   │   ├── handleDig()
│   │   │   ├── handleNextTurn()
│   │   │   ├── handleDuel*()
│   │   │   ├── handleReconnect()
│   │   │   └── broadcastGameState()
│   │   │
│   │   └── LobbyHandler.js          # Lobby management
│   │
│   ├── storage/
│   │   ├── GameStorage.js           # In-memory game storage
│   │   │   ├── games: Map<string, GameState>
│   │   │   ├── createGame()
│   │   │   ├── getGame()
│   │   │   └── deleteGame()
│   │   │
│   │   └── LobbyStorage.js          # In-memory lobby storage
│   │
│   ├── socket/
│   │   ├── socketHandler.js         # Socket.io connection setup
│   │   └── gameEvents.js            # Game socket event bindings
│   │
│   ├── config/
│   │   └── gameConfig.js            # Game constants (import từ client config)
│   │
│   └── utils/
│       ├── random.js                # Seeded random generator
│       └── validation.js            # Input validation
│
└── package.json
```

### Frontend Structure
```
client/
├── src/
│   ├── game/
│   │   ├── GameRenderer.js          # ⭐ Pure rendering
│   │   │   ├── updateState()
│   │   │   ├── render()
│   │   │   ├── renderGrid()
│   │   │   ├── renderPlayers()
│   │   │   └── renderItems()
│   │   │
│   │   ├── GameUI.js                # ⭐ UI controls & action dispatch
│   │   │   ├── setupControls()
│   │   │   ├── updateUI()
│   │   │   └── showDuelModal()
│   │   │
│   │   └── GameState.js             # Local state holder
│   │
│   ├── network/
│   │   ├── SocketClient.js          # Socket.io client wrapper
│   │   │   ├── setupListeners()
│   │   │   └── action methods (rollDice, move, etc.)
│   │   │
│   │   └── ApiClient.js             # REST API client (lobby)
│   │
│   ├── lobby/
│   │   ├── LobbyManager.js
│   │   └── LobbyUI.js
│   │
│   ├── utils/
│   │   └── ... (existing)
│   │
│   └── main.js
│
├── index.html
├── styles.css
└── config.js (shared với server)
```

### Data Flow
```
┌─────────┐         ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ Client  │ Action  │ GameHandler  │  Call   │GameProcessor │ Update  │ GameStorage │
│ (UI)    │────────>│              │────────>│              │────────>│             │
└─────────┘         └──────────────┘         └──────────────┘         └──────────────┘
     ▲                      │                         │                        │
     │                      │                         │                        │
     │                      │                         │                        │
     │              Broadcast Full State              │                        │
     │<─────────────────────────────────────────────────────────────────────────┘
     │
     │ Render
     │
┌─────────┐
│Renderer │
└─────────┘
```

---

## 📊 IMPLEMENTATION PRIORITY

### Phase 1: Core Foundation (Week 1)
1. ✅ Setup Node.js server với Express + Socket.io
2. ✅ Tạo GameStorage (in-memory Map)
3. ✅ Tạo GameState structure
4. ✅ Implement GameProcessor cơ bản:
   - initializeGame()
   - getGameState()
   - Basic validation methods

### Phase 2: Game Processor Logic (Week 1-2)
1. ✅ Implement tất cả action methods trong GameProcessor:
   - rollDice()
   - movePlayer() (4 directions)
   - dig()
   - nextTurn()
   - Duel methods (selectWeapon, roll, resolve)
2. ✅ Test GameProcessor độc lập (unit tests)

### Phase 3: Game Handler & Socket (Week 2)
1. ✅ Implement GameHandler:
   - Action handlers (gọi GameProcessor)
   - broadcastGameState()
   - handleReconnect()
2. ✅ Setup Socket.io events
3. ✅ Test với multiple clients

### Phase 4: Client Refactoring (Week 2-3)
1. ✅ Tách GameRenderer (pure rendering)
2. ✅ Tách GameUI (action dispatch)
3. ✅ Setup SocketClient listeners
4. ✅ Remove tất cả game logic từ client

### Phase 5: Lobby System (Week 3)
1. ✅ Lobby API endpoints
2. ✅ Lobby Socket events
3. ✅ Lobby UI (frontend)

### Phase 6: Polish & Testing (Week 3-4)
1. ✅ Error handling
2. ✅ Reconnection testing
3. ✅ Duel broadcast testing (tất cả players thấy)
4. ✅ Full state broadcast verification
5. ✅ UI/UX improvements

---

## 🔧 TECHNICAL DECISIONS

### 1. State Management Pattern
**Option A: Server Authoritative (Recommended)**
- Server là single source of truth
- Client chỉ render và gửi actions
- Pros: Secure, consistent, simple
- Cons: Latency visible, requires good connection

**Option B: Client Prediction**
- Client predict actions, server reconcile
- Pros: Feels responsive
- Cons: Complex, can cause desync

**Recommendation**: Bắt đầu với Option A, optimize sau.

### 2. Storage Strategy
**⭐ In-Memory Only (Map/Object):**
- ✅ Game state lưu trong memory (Map<string, GameState>)
- ✅ Fast, đơn giản, không cần setup database
- ✅ Đủ cho MVP và production nếu không cần persistence
- ⚠️ Mất data khi server restart (acceptable trade-off)
- ✅ GameStorage class quản lý Map

**Storage Structure:**
```javascript
// storage/GameStorage.js
class GameStorage {
  private games: Map<string, GameState> = new Map();
  private lobbies: Map<string, LobbyState> = new Map();
  
  // Simple CRUD operations
  createGame(gameId, state) { this.games.set(gameId, state); }
  getGame(gameId) { return this.games.get(gameId); }
  deleteGame(gameId) { this.games.delete(gameId); }
}
```

**Note**: Nếu sau này cần persistence, có thể thêm database layer, nhưng hiện tại KHÔNG cần.

### 3. Random Generation
**Seeded Random**:
- Server generate seed khi tạo game
- Tất cả random dùng seed này
- Đảm bảo tất cả clients có cùng map/items

---

## 🚨 CHALLENGES & SOLUTIONS

### Challenge 1: State Synchronization
**Problem**: Đảm bảo tất cả clients có state giống nhau
**Solution**: 
- Server broadcast full state sau mỗi action
- Client replace state hoàn toàn
- Checksums để verify (optional)

### Challenge 2: Latency
**Problem**: Actions có delay, game cảm giác laggy
**Solution**:
- Optimistic UI updates (show action ngay, rollback nếu fail)
- Smooth animations che giấu latency
- Good server infrastructure

### Challenge 3: Reconnection
**Problem**: Player disconnect, làm sao rejoin?
**Solution**:
- ✅ Store game state trong memory (GameStorage)
- ✅ Reconnect bằng **player name** (không cần token phức tạp)
- ✅ GameHandler.matchPlayerByName() tìm player trong game
- ✅ Update player.socketId khi reconnect
- ✅ Send full state khi reconnect

**Reconnection Flow:**
```javascript
// Client
socket.emit('game:reconnect', { gameId, playerName: 'Red' });

// Server (GameHandler)
handleReconnect(socket, gameId, playerName) {
  const game = this.storage.getGame(gameId);
  if (!game) {
    return this.sendError(socket, 'Game not found');
  }
  
  // Tìm player bằng name
  const player = game.players.find(p => p.name === playerName);
  if (!player) {
    return this.sendError(socket, 'Player not found in game');
  }
  
  // Update socketId
  player.socketId = socket.id;
  
  // Send full state
  const fullState = this.gameProcessor.getGameState(gameId);
  socket.emit('game:stateUpdate', fullState);
  
  // Notify other players
  this.broadcastToOthers(gameId, playerName, 'game:playerReconnected', { playerName });
}
```

### Challenge 4: Turn Management
**Problem**: Player không action trong turn, timeout?
**Solution**:
- Turn timer (30-60s)
- Auto-skip nếu timeout
- Warning trước khi skip

---

## 📝 NEXT STEPS

### Trước khi code:
1. ✅ **Quyết định tech stack**: Node.js + Express + Socket.io (recommended)
2. ✅ **Quyết định database**: Redis cho active games, MongoDB cho history
3. ✅ **Design API contracts**: Define tất cả endpoints và socket events
4. ✅ **Design data models**: Game state, Lobby, Player structures
5. ✅ **Plan migration strategy**: Làm từng phần, test kỹ

### Khi bắt đầu code:
1. Setup server structure
2. Implement lobby system trước (dễ test)
3. Migrate game logic từng phần
4. Test thoroughly mỗi phase
5. Deploy và test với multiple clients

---

## ⚠️ CÁC ĐIỂM QUAN TRỌNG CẦN LƯU Ý

### 1. Game Processor - Pure Logic
- ✅ **TUYỆT ĐỐI KHÔNG** có UI code trong GameProcessor
- ✅ **TUYỆT ĐỐI KHÔNG** có network code trong GameProcessor
- ✅ **TUYỆT ĐỐI KHÔNG** có database code trong GameProcessor
- ✅ GameProcessor chỉ nhận input, xử lý logic, return output
- ✅ Có thể test GameProcessor độc lập (unit tests)

### 2. Full State Broadcast
- ✅ **SAU MỖI ACTION**, server PHẢI broadcast full state
- ✅ Broadcast đến TẤT CẢ players (không chỉ player thực hiện action)
- ✅ Full state bao gồm: grid, players, items, turn state, duel state
- ✅ Client replace state hoàn toàn (không merge)

### 3. Duel Broadcast
- ✅ **TẤT CẢ players** phải nhìn thấy duel UI
- ✅ Duel state trong `gameState.duelState`
- ✅ Client render duel modal dựa trên `duelState` (không check player name)
- ✅ Khi duel end, `duelState = null`, client hide modal

### 4. Reconnection
- ✅ Reconnect bằng **player name** (đơn giản, không cần token)
- ✅ GameHandler tìm player trong game bằng name
- ✅ Update `player.socketId` khi reconnect
- ✅ Send full state ngay khi reconnect

### 5. Client - Render Only
- ✅ Client **KHÔNG validate** actions (server validate)
- ✅ Client **KHÔNG calculate** moves (server calculate)
- ✅ Client **CHỈ render** state và **emit** actions
- ✅ Tất cả logic ở server (GameProcessor)

### 6. Memory Storage
- ✅ Game state lưu trong Map (in-memory)
- ✅ Không cần database
- ✅ GameStorage quản lý Map
- ✅ Cleanup khi game end

### 7. Player Name Requirement
- ✅ **BẮT BUỘC** nhập player name khi join lobby
- ✅ Player name phải unique trong lobby (không trùng)
- ✅ Client phải có input field và validate trước khi join
- ✅ Server validate player name:
  - Không trống
  - Độ dài hợp lệ (1-20 ký tự)
  - Format hợp lệ (chữ, số, khoảng trắng, không có ký tự đặc biệt)
  - Không trùng trong lobby
- ✅ Return error nếu validation fail
- ✅ Player name được dùng để reconnect sau này

---

## 🎯 SUCCESS CRITERIA

### Core Functionality
- ✅ GameProcessor xử lý tất cả game logic (không có UI/network/DB code)
- ✅ GameHandler nhận actions và broadcast full state
- ✅ Client chỉ render và emit actions (không có logic)
- ✅ Full state broadcast sau mỗi action
- ✅ Tất cả players nhìn thấy duel (không chỉ 2 players engage)

### Gameplay
- ✅ Players có thể tạo/join lobby
- ✅ **Player name BẮT BUỘC khi join lobby** (client + server validation)
- ✅ Player name unique trong lobby
- ✅ Game start với multiple players
- ✅ Actions được validate và sync
- ✅ No cheating possible (server-side validation)
- ✅ Smooth gameplay experience
- ✅ Handle disconnections gracefully (reconnect by name)
- ✅ Game có thể finish và show winner

### Technical
- ✅ Game state lưu trong memory (Map)
- ✅ Reconnection bằng player name
- ✅ Duel broadcast cho tất cả players
- ✅ Full state broadcast sau mỗi action

---

## 📚 RESOURCES NEEDED

**Backend:**
- Node.js server
- Socket.io library
- Express framework
- Redis (optional)
- Database (optional)

**Frontend:**
- Socket.io-client
- API client (fetch/axios)
- UI updates cho lobby

**Infrastructure:**
- Server hosting
- Domain (optional)
- SSL certificate

---

---

## 📋 TÓM TẮT ACTION METHODS

### GameProcessor Methods
```javascript
// Initialization
initializeGame(players, seed?) → GameState

// Actions
rollDice(gameId, playerName) → { success, diceValue, moves, hasExtraTurn }
movePlayer(gameId, playerName, direction: 'UP'|'DOWN'|'LEFT'|'RIGHT') → { success, newPos, movesLeft, events }
dig(gameId, playerName) → { success, found, treasureValue, coins }
nextTurn(gameId, playerName) → { success, nextPlayerIndex }

// Duel Actions
duelSelectWeapon(gameId, playerName, weaponType) → { success }
duelRoll(gameId, playerName) → { success, roll, total }
duelResolve(gameId, playerName) → { success, winner, loser, coinTransfer }

// State
getGameState(gameId) → GameState
canPerformAction(gameId, playerName, action) → boolean
isPlayerTurn(gameId, playerName) → boolean
```

### GameHandler Methods
```javascript
// Action Handlers (gọi GameProcessor + broadcast)
handleRollDice(socket, gameId, playerName)
handleMove(socket, gameId, playerName, direction)
handleDig(socket, gameId, playerName)
handleNextTurn(socket, gameId, playerName)
handleDuelSelectWeapon(socket, gameId, playerName, weaponType)
handleDuelRoll(socket, gameId, playerName)
handleDuelResolve(socket, gameId, playerName)

// Connection
handleReconnect(socket, gameId, playerName)
handleDisconnect(socket, gameId)

// Broadcasting
broadcastGameState(gameId) // Broadcast full state to all players
```

### Socket Events Summary
```javascript
// Client → Server
'game:rollDice', { gameId, playerName }
'game:move', { gameId, playerName, direction }
'game:dig', { gameId, playerName }
'game:nextTurn', { gameId, playerName }
'game:duel:selectWeapon', { gameId, playerName, weaponType }
'game:duel:roll', { gameId, playerName }
'game:duel:resolve', { gameId, playerName }
'game:reconnect', { gameId, playerName }

// Server → Client
'game:stateUpdate', fullGameState // ⭐ MAIN EVENT - Broadcast sau mỗi action
'game:error', { message, code }
'game:playerReconnected', { playerName }
'game:playerDisconnected', { playerName }
'game:ended', { winner, scores }
```

---

## 🎯 KẾT LUẬN

**Kiến trúc đề nghị:**
1. **GameProcessor**: Pure game logic, không có UI/network/DB
2. **GameHandler**: Nhận actions, gọi GameProcessor, broadcast full state
3. **GameStorage**: In-memory Map, không cần database
4. **Client**: Chỉ render và emit actions, không có logic

**Implementation Strategy:**
- Bắt đầu với GameProcessor (test độc lập)
- Sau đó implement GameHandler và Socket events
- Cuối cùng refactor client (remove logic, chỉ render)
- Test kỹ mỗi phase, đặc biệt là duel broadcast và full state sync

**Key Points:**
- ✅ Full state broadcast sau mỗi action
- ✅ Tất cả players nhìn thấy duel
- ✅ Reconnect bằng player name
- ✅ Client chỉ render, không có logic
- ✅ Memory storage, không cần DB

Đây là một dự án có thể làm được với kiến trúc rõ ràng. Quan trọng là tách biệt GameProcessor (logic) và GameHandler (network), và đảm bảo client chỉ render state từ server.

