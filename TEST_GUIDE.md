# Testing Guide

## 🚀 Quick Start

### 1. Start Server
```bash
cd server
npm start
```

Server sẽ chạy trên `http://localhost:3000`

### 2. Open Client
Mở `index.html` trong browser (hoặc dùng local server như `python -m http.server`)

### 3. Test Flow

#### Test Lobby System:
1. **Create Lobby:**
   - Mở browser tab 1
   - Nhập tên (ví dụ: "Player1")
   - Click "Create Lobby"
   - Lưu lại lobby code

2. **Join Lobby:**
   - Mở browser tab 2
   - Click "Join Lobby" tab
   - Nhập tên khác (ví dụ: "Player2")
   - Nhập lobby code từ tab 1
   - Click "Join Lobby"

3. **Ready & Start:**
   - Cả 2 players click "Not Ready" để toggle ready
   - Host click "Start Game"
   - Game sẽ bắt đầu

#### Test Game Actions:
1. **Roll Dice:**
   - Current player click "ROLL DICE"
   - Dice value sẽ hiển thị
   - Moves left sẽ update

2. **Move:**
   - Click D-Pad hoặc dùng arrow keys
   - Player sẽ di chuyển
   - Moves sẽ giảm

3. **Dig:**
   - Di chuyển đến vị trí có treasure
   - Click "DIG"
   - Nếu có clue, sẽ nhận coins

4. **Next Turn:**
   - Click "NEXT TURN" khi hết moves
   - Turn sẽ chuyển sang player khác

#### Test Duel:
1. **Trigger Duel:**
   - 2 players di chuyển đến cùng vị trí
   - Duel modal sẽ hiện

2. **Select Weapon:**
   - Mỗi player chọn weapon (nếu có)
   - Click "Fight!" để roll dice

3. **Resolve:**
   - Winner nhận coins từ loser
   - Loser respawn về start position

## 🔍 Debugging

### Server Console:
- Xem connection logs
- Xem game action logs
- Xem error messages

### Browser Console:
- Xem socket connection status
- Xem game state updates
- Xem error messages

### Common Issues:

1. **Cannot connect to server:**
   - Check server đang chạy
   - Check SERVER_URL trong `client/config.js`
   - Check CORS settings

2. **Game state not updating:**
   - Check socket connection
   - Check browser console for errors
   - Verify `game:stateUpdate` event được emit

3. **Lobby not working:**
   - Check player name validation
   - Check lobby code format (6 digits)
   - Check socket events trong browser console

## 📝 Test Checklist

- [ ] Server starts without errors
- [ ] Client connects to server
- [ ] Create lobby works
- [ ] Join lobby works
- [ ] Player name validation works
- [ ] Ready system works
- [ ] Start game works
- [ ] Game state renders correctly
- [ ] Roll dice works
- [ ] Move works
- [ ] Dig works
- [ ] Next turn works
- [ ] Duel triggers correctly
- [ ] Duel weapon selection works
- [ ] Duel resolution works
- [ ] State syncs across all players
- [ ] Reconnection works

