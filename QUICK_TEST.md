# Quick Test Guide

## ✅ Server Tests (All Passing)
- 98 unit tests passing
- GameProcessor logic verified
- GameHandler verified
- LobbyHandler verified

## 🧪 Manual Testing Steps

### 1. Start Server
```bash
cd server
npm start
```
Server chạy trên `http://localhost:3000`

### 2. Test Client Connection
1. Mở `index.html` trong browser
2. Mở Browser Console (F12)
3. Kiểm tra log: "Connected to server"

### 3. Test Lobby Flow

#### Tab 1 - Create Lobby:
1. Nhập tên: "Player1"
2. Click "Create Lobby"
3. Lưu lại lobby code (6 chữ số)
4. Click "Not Ready" để toggle ready

#### Tab 2 - Join Lobby:
1. Click "Join Lobby" tab
2. Nhập tên: "Player2" (khác Player1)
3. Nhập lobby code từ Tab 1
4. Click "Join Lobby"
5. Click "Not Ready" để toggle ready

#### Start Game:
1. Tab 1 (Host): Click "Start Game"
2. Cả 2 tabs sẽ chuyển sang game screen

### 4. Test Game Actions

#### Roll Dice:
- Current player click "ROLL DICE"
- Dice value hiển thị
- Moves left update

#### Move:
- Click D-Pad hoặc arrow keys
- Player di chuyển
- Moves giảm

#### Dig:
- Di chuyển đến vị trí có treasure
- Click "DIG"
- Nhận coins nếu có clue

#### Next Turn:
- Click "NEXT TURN" khi hết moves
- Turn chuyển sang player khác

### 5. Test Duel
1. 2 players di chuyển đến cùng vị trí
2. Duel modal hiện
3. Chọn weapon (nếu có)
4. Click "Fight!" để roll
5. Winner nhận coins, loser respawn

## 🔍 Debug Checklist

- [ ] Server console shows "Server running on port 3000"
- [ ] Browser console shows "Connected to server"
- [ ] Lobby UI appears correctly
- [ ] Can create lobby
- [ ] Can join lobby with code
- [ ] Ready system works
- [ ] Start game works
- [ ] Game renders correctly
- [ ] Actions work (roll, move, dig, next turn)
- [ ] State syncs across tabs
- [ ] Duel works

## 🐛 Common Issues

1. **CORS Error:**
   - Check server CORS settings
   - Check SERVER_URL in client/config.js

2. **Socket Connection Failed:**
   - Check server is running
   - Check firewall/port 3000

3. **Game State Not Updating:**
   - Check browser console for errors
   - Verify socket events are firing
   - Check GameHandler.broadcastGameState()

4. **Lobby Not Working:**
   - Check player name validation
   - Check lobby code format
   - Check socket events in console

