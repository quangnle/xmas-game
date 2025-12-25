# CHIẾN LƯỢC IMPLEMENTATION - BÀN BẠC

## 🎯 PHÂN TÍCH VÀ ĐỀ XUẤT

### 1. QUAN ĐIỂM CHIẾN LƯỢC

**Nguyên tắc:**
- ✅ **Bottom-up approach**: Xây dựng từ core logic lên, không phụ thuộc vào network/UI
- ✅ **Test-driven**: GameProcessor PHẢI có unit tests trước khi integrate
- ✅ **Isolation**: Mỗi component có thể test độc lập
- ✅ **Incremental**: Làm từng phần nhỏ, test kỹ trước khi tiếp tục

---

## 📋 THỨ TỰ IMPLEMENTATION ĐỀ XUẤT

### PHASE 0: PREPARATION & SETUP (1-2 ngày)

**Mục tiêu:** Chuẩn bị môi trường và cấu trúc cơ bản

**Tasks:**
1. ✅ Setup project structure (server/ và client/)
2. ✅ Setup Node.js project với package.json
3. ✅ Install dependencies: Express, Socket.io, testing framework (Jest/Mocha)
4. ✅ Setup testing configuration
5. ✅ Copy và refactor `config.js` để dùng chung cho server và client
6. ✅ Tạo TypeScript definitions hoặc JSDoc cho type safety (optional nhưng recommended)

**Output:**
- Project structure sẵn sàng
- Testing framework hoạt động
- Config shared giữa server và client

**Lý do:** Cần foundation vững chắc trước khi code logic

---

### PHASE 1: GAME PROCESSOR CORE (3-5 ngày) ⭐ QUAN TRỌNG NHẤT

**Mục tiêu:** Xây dựng GameProcessor với unit tests đầy đủ

**Tại sao bắt đầu từ đây?**
- ✅ GameProcessor là core logic, không phụ thuộc vào network/UI
- ✅ Có thể test độc lập hoàn toàn
- ✅ Nếu logic sai, toàn bộ game sẽ sai
- ✅ Dễ debug và fix khi không có network complexity

**Implementation Order:**

#### 1.1 GameState Structure & Storage (1 ngày)
```
Tasks:
- Tạo GameState.js với type definitions
- Tạo GameStorage.js (in-memory Map)
- Test: Storage CRUD operations
- Test: GameState structure validation
```

**Unit Tests cần có:**
```javascript
describe('GameStorage', () => {
  test('createGame - tạo game mới')
  test('getGame - lấy game theo ID')
  test('updateGame - update game state')
  test('deleteGame - xóa game')
  test('getAllGames - lấy tất cả games')
})
```

#### 1.2 GameProcessor - Initialization (1 ngày)
```
Tasks:
- Implement initializeGame()
- Generate grid với seeded random
- Place items (treasures, snowmen, gifts, weapons)
- Initialize players
- Test với nhiều seeds khác nhau
```

**Unit Tests cần có:**
```javascript
describe('GameProcessor - initializeGame', () => {
  test('initializeGame với 2 players - tạo game state đúng')
  test('initializeGame với 4 players - tạo game state đúng')
  test('initializeGame với seed - tạo map giống nhau')
  test('initializeGame - items không overlap')
  test('initializeGame - players có startPos đúng')
  test('initializeGame - grid size đúng (40x40)')
  test('initializeGame - đủ số lượng items (treasures, gifts, etc.)')
})
```

#### 1.3 GameProcessor - Basic Actions (2 ngày)
```
Tasks:
- rollDice() với validation
- movePlayer() với 4 directions
- Validation methods (isPlayerTurn, canPerformAction)
- Test từng action riêng biệt
```

**Unit Tests cần có:**
```javascript
describe('GameProcessor - rollDice', () => {
  test('rollDice - chỉ current player mới roll được')
  test('rollDice - return dice value 2-12')
  test('rollDice - set currentMoves đúng')
  test('rollDice - check extra turn (6 hoặc 12)')
  test('rollDice - không roll được khi không phải turn')
  test('rollDice - không roll được khi turnState != IDLE')
})

describe('GameProcessor - movePlayer', () => {
  test('movePlayer UP - di chuyển đúng')
  test('movePlayer DOWN - di chuyển đúng')
  test('movePlayer LEFT - di chuyển đúng')
  test('movePlayer RIGHT - di chuyển đúng')
  test('movePlayer - không move được khi hết moves')
  test('movePlayer - không move được khi không đủ moves cho terrain')
  test('movePlayer - không move được khi ra ngoài boundary')
  test('movePlayer - không move được khi không phải turn')
  test('movePlayer - check tile events (gift, weapon, snowman)')
  test('movePlayer - check duel khi gặp player khác')
})
```

#### 1.4 GameProcessor - Advanced Actions (2 ngày)
```
Tasks:
- dig()
- nextTurn()
- Duel methods (selectWeapon, roll, resolve)
- Test edge cases
```

**Unit Tests cần có:**
```javascript
describe('GameProcessor - dig', () => {
  test('dig - tìm treasure khi có clue')
  test('dig - không tìm được khi không có clue')
  test('dig - không tìm được khi treasure đã found')
  test('dig - update coins đúng')
  test('dig - remove treasure khỏi map')
  test('dig - không dig được khi không phải turn')
})

describe('GameProcessor - nextTurn', () => {
  test('nextTurn - chuyển sang player tiếp theo')
  test('nextTurn - reset dice và moves')
  test('nextTurn - giữ extra turn nếu có')
  test('nextTurn - không skip được khi đang duel')
})

describe('GameProcessor - Duel', () => {
  test('duelSelectWeapon - select weapon đúng')
  test('duelSelectWeapon - không select được weapon không có')
  test('duelRoll - roll dice cho cả 2 players')
  test('duelRoll - apply weapon bonus đúng')
  test('duelResolve - winner đúng (higher roll)')
  test('duelResolve - loser về startPos')
  test('duelResolve - transfer coins đúng')
  test('duelResolve - tie thì roll lại')
  test('duelResolve - consume weapons sau khi dùng')
})
```

**Test Coverage Goal:** 
- ✅ Ít nhất 80% code coverage
- ✅ Tất cả edge cases được cover
- ✅ Tất cả validation paths được test

**Output:**
- GameProcessor hoàn chỉnh với tất cả methods
- Unit tests đầy đủ và pass
- Documentation cho mỗi method

---

### PHASE 2: GAME HANDLER & SOCKET SETUP (2-3 ngày)

**Mục tiêu:** Kết nối GameProcessor với network layer

**Tại sao sau GameProcessor?**
- ✅ GameProcessor đã được test kỹ, logic đúng
- ✅ GameHandler chỉ là wrapper, dễ test
- ✅ Có thể test GameHandler với mock GameProcessor

**Implementation Order:**

#### 2.1 GameHandler - Basic Structure (1 ngày)
```
Tasks:
- Tạo GameHandler class
- Inject GameProcessor và GameStorage
- Setup basic action handlers
- Test với mock GameProcessor
```

**Unit Tests:**
```javascript
describe('GameHandler', () => {
  test('handleRollDice - gọi GameProcessor.rollDice')
  test('handleRollDice - broadcast state sau khi roll')
  test('handleRollDice - return error nếu validation fail')
  test('handleMove - gọi GameProcessor.movePlayer')
  test('handleMove - broadcast state sau khi move')
  // ... tương tự cho các actions khác
})
```

#### 2.2 Socket.io Setup (1 ngày)
```
Tasks:
- Setup Express server
- Setup Socket.io
- Bind GameHandler methods to socket events
- Test socket connection
```

**Integration Tests:**
```javascript
describe('Socket Events', () => {
  test('game:rollDice - emit và nhận response')
  test('game:move - emit và nhận stateUpdate')
  test('game:stateUpdate - broadcast đến tất cả players')
  // ... test các events khác
})
```

#### 2.3 Broadcast Mechanism (1 ngày)
```
Tasks:
- Implement broadcastGameState()
- Test broadcast đến tất cả players
- Test reconnection flow
```

**Output:**
- GameHandler hoàn chỉnh
- Socket events hoạt động
- Broadcast mechanism verified

---

### PHASE 3: LOBBY SYSTEM (2-3 ngày)

**Mục tiêu:** Implement lobby để players có thể join game

**Tại sao sau Game Handler?**
- ✅ Game logic đã sẵn sàng
- ✅ Lobby chỉ là wrapper để start game
- ✅ Có thể test lobby độc lập

**Implementation Order:**

#### 3.1 LobbyStorage & LobbyHandler (1 ngày)
```
Tasks:
- Tạo LobbyStorage (in-memory)
- Tạo LobbyHandler với validation
- Test player name validation
- Test lobby CRUD operations
```

**Unit Tests:**
```javascript
describe('LobbyHandler', () => {
  test('handleCreateLobby - tạo lobby với host name')
  test('handleJoinLobby - join với player name')
  test('handleJoinLobby - reject nếu name trùng')
  test('handleJoinLobby - reject nếu name invalid')
  test('handleStartGame - start game từ lobby')
  test('handleStartGame - gọi GameProcessor.initializeGame')
})
```

#### 3.2 Lobby Socket Events (1 ngày)
```
Tasks:
- Bind lobby events to socket
- Test lobby flow end-to-end
```

#### 3.3 Lobby UI (1 ngày)
```
Tasks:
- Tạo lobby creation screen
- Tạo lobby join screen với player name input
- Tạo waiting room
- Test UI flow
```

**Output:**
- Lobby system hoàn chỉnh
- Players có thể tạo/join lobby
- Game start từ lobby

---

### PHASE 4: CLIENT REFACTORING (3-4 ngày)

**Mục tiêu:** Refactor client để chỉ render, không có logic

**Tại sao sau khi server sẵn sàng?**
- ✅ Server đã hoàn chỉnh, có thể test client với real server
- ✅ Client chỉ cần connect và render
- ✅ Dễ test khi server đã stable

**Implementation Order:**

#### 4.1 GameRenderer - Pure Rendering (1 ngày)
```
Tasks:
- Tách rendering logic từ game.js
- Remove game logic
- Chỉ render từ gameState
- Test rendering với mock state
```

#### 4.2 GameUI - Action Dispatch (1 ngày)
```
Tasks:
- Tách UI controls
- Setup action emitters
- Remove validation logic
- Test action dispatch
```

#### 4.3 SocketClient Integration (1 ngày)
```
Tasks:
- Setup SocketClient
- Listen to game:stateUpdate
- Update renderer khi nhận state
- Test với real server
```

#### 4.4 Remove Old Logic (1 ngày)
```
Tasks:
- Remove tất cả game logic từ client
- Clean up old code
- Verify client chỉ render
```

**Output:**
- Client chỉ render và emit actions
- Không còn game logic ở client
- Test với real server

---

## 🧪 TESTING STRATEGY

### Unit Tests (GameProcessor)
**Framework:** Jest hoặc Mocha + Chai
**Coverage Goal:** 80%+

**Test Structure:**
```
server/
├── src/
│   └── core/
│       └── GameProcessor.js
└── tests/
    └── unit/
        └── GameProcessor.test.js
            ├── initializeGame.test.js
            ├── rollDice.test.js
            ├── movePlayer.test.js
            ├── dig.test.js
            ├── nextTurn.test.js
            └── duel.test.js
```

**Test Examples:**
```javascript
// GameProcessor.test.js
describe('GameProcessor', () => {
  let processor;
  let storage;
  
  beforeEach(() => {
    storage = new GameStorage();
    processor = new GameProcessor(storage);
  });
  
  describe('initializeGame', () => {
    it('should create game with correct structure', () => {
      const players = [
        { name: 'Player1', color: '#ff0000' },
        { name: 'Player2', color: '#0000ff' }
      ];
      
      const gameId = processor.initializeGame(players, 12345);
      const state = processor.getGameState(gameId);
      
      expect(state.players).toHaveLength(2);
      expect(state.grid).toHaveLength(40);
      expect(state.grid[0]).toHaveLength(40);
      expect(state.treasures).toHaveLength(4);
      // ... more assertions
    });
    
    it('should generate same map with same seed', () => {
      const players = [{ name: 'P1', color: '#ff0000' }];
      
      const game1 = processor.initializeGame(players, 12345);
      const game2 = processor.initializeGame(players, 12345);
      
      const state1 = processor.getGameState(game1);
      const state2 = processor.getGameState(game2);
      
      expect(state1.grid).toEqual(state2.grid);
      // ... more assertions
    });
  });
  
  describe('rollDice', () => {
    it('should only allow current player to roll', () => {
      const gameId = processor.initializeGame([...]);
      const state = processor.getGameState(gameId);
      
      // Try to roll with wrong player
      const result = processor.rollDice(gameId, 'WrongPlayer');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not your turn');
    });
    
    it('should set moves correctly', () => {
      // ... test implementation
    });
  });
  
  // ... more test suites
});
```

### Integration Tests
**Test:** GameHandler + Socket.io
**Framework:** Jest với socket.io-client

```javascript
describe('GameHandler Integration', () => {
  let server;
  let clientSocket;
  
  beforeAll(() => {
    // Setup test server
  });
  
  afterAll(() => {
    // Cleanup
  });
  
  it('should handle rollDice and broadcast state', async () => {
    // Connect client
    // Emit rollDice
    // Wait for stateUpdate
    // Verify state
  });
});
```

### End-to-End Tests
**Test:** Full flow từ lobby đến game
**Framework:** Jest + Puppeteer (optional)

---

## 🔄 DEPENDENCIES & ORDER

```
Phase 0 (Setup)
    ↓
Phase 1 (GameProcessor) ⭐ CORE
    ↓
Phase 2 (GameHandler)
    ↓
Phase 3 (Lobby)
    ↓
Phase 4 (Client Refactoring)
```

**Dependencies:**
- GameHandler phụ thuộc vào GameProcessor ✅
- Lobby phụ thuộc vào GameProcessor ✅
- Client phụ thuộc vào Server ✅
- Tất cả phụ thuộc vào Config ✅

---

## ⚠️ RISKS & MITIGATION

### Risk 1: GameProcessor Logic Sai
**Impact:** Toàn bộ game sai
**Mitigation:** 
- ✅ Unit tests đầy đủ trước khi integrate
- ✅ Test với nhiều edge cases
- ✅ Code review kỹ

### Risk 2: State Synchronization Issues
**Impact:** Clients không sync
**Mitigation:**
- ✅ Full state broadcast (đơn giản, đảm bảo)
- ✅ Test với multiple clients
- ✅ Verify state consistency

### Risk 3: Client vẫn có Logic
**Impact:** Khó maintain, có thể cheat
**Mitigation:**
- ✅ Code review
- ✅ Remove tất cả logic từ client
- ✅ Verify client chỉ render

---

## 📊 METRICS & SUCCESS CRITERIA

### Phase 1 Success:
- ✅ GameProcessor có 80%+ test coverage
- ✅ Tất cả unit tests pass
- ✅ Logic game đúng (verified bằng tests)

### Phase 2 Success:
- ✅ GameHandler gọi đúng GameProcessor
- ✅ Broadcast hoạt động đúng
- ✅ Socket events hoạt động

### Phase 3 Success:
- ✅ Lobby tạo/join được
- ✅ Player name validation đúng
- ✅ Game start từ lobby

### Phase 4 Success:
- ✅ Client chỉ render
- ✅ Không còn logic ở client
- ✅ Test với real server pass

---

## 🎯 RECOMMENDATION

**Bắt đầu từ:**
1. **Phase 0** (1-2 ngày): Setup project và testing framework
2. **Phase 1** (3-5 ngày): GameProcessor với unit tests ⭐ QUAN TRỌNG NHẤT
3. **Phase 2** (2-3 ngày): GameHandler và Socket
4. **Phase 3** (2-3 ngày): Lobby System
5. **Phase 4** (3-4 ngày): Client Refactoring

**Tổng thời gian ước tính:** 11-17 ngày (2-3 tuần)

**Lý do:**
- GameProcessor là foundation, phải làm đúng và test kỹ
- Các phase sau phụ thuộc vào GameProcessor
- Unit tests đảm bảo quality
- Incremental approach dễ debug

---

## 💡 SUGGESTIONS

### 1. Testing Framework
**Đề xuất:** Jest
- ✅ Built-in với Node.js
- ✅ Mocking dễ dàng
- ✅ Coverage reports
- ✅ Snapshot testing (optional)

### 2. Code Organization
**Đề xuất:** 
- Mỗi method trong GameProcessor nên có JSDoc
- Type definitions (TypeScript hoặc JSDoc)
- Clear error messages

### 3. Development Workflow
**Đề xuất:**
- TDD (Test-Driven Development) cho GameProcessor
- Write test trước, implement sau
- Refactor khi cần

### 4. Documentation
**Đề xuất:**
- Document mỗi method trong GameProcessor
- Document game state structure
- Document socket events

---

## ❓ QUESTIONS TO DISCUSS

1. **Testing Framework:** Jest hay Mocha? (Recommend Jest)
2. **Type Safety:** TypeScript hay JSDoc? (Recommend JSDoc cho đơn giản)
3. **Error Handling:** Error objects hay throw exceptions?
4. **Logging:** Console.log hay logger library?
5. **Code Style:** ESLint config nào?

---

**Kết luận:** Bắt đầu từ GameProcessor với unit tests là cách tốt nhất. Đảm bảo logic đúng trước khi integrate với network layer.

