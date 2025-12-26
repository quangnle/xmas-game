# TREASURE HUNTER

A multiplayer online board game where players explore a map, collect clues, hunt for treasures, and battle each other in duels!

## 🎮 How to Play

### Getting Started

#### Local Development

1. **Start the Server**: Run `start-api-server.bat` to start the game server (port 3000)
2. **Start the Client**: Run `start-web-server.bat` to start the web server (port 8000)
3. **Open the Game**: Open `http://localhost:8000` in your browser

#### Multiplayer (Same Network)

1. **Start the Server**: Run `start-api-server.bat` - note the IP address shown in the console
2. **Start the Client**: Run `start-web-server.bat` on the same machine
3. **For Other Players**: 
   - Make sure they're on the same network
   - Open `http://YOUR_IP:8000` in their browsers (replace YOUR_IP with the server machine's IP)
   - The game will automatically connect to the server on port 3000
   - If needed, you can override the server URL: `http://YOUR_IP:8000?server=http://SERVER_IP:3000`

#### Creating/Joining Rooms

1. **Create a Room**: 
   - Enter your name
   - Optionally set a custom 3-digit room code
   - Configure advanced settings (grid size, treasures, weapons, etc.)
   - Click "Create Room"
2. **Join a Room**: 
   - Browse available rooms
   - Click on a room to join
   - Enter your name and the room code
   - Click "Join" or "Reconnect" (if game already started)
3. **Start the Game**: Once all players are ready, the host can start the game

### Basic Gameplay

1. **Roll Dice**: Click "ROLL DICE" to roll 2 dice (total: 2-12). This determines how many move points you have
2. **Move**: Use the D-Pad buttons or arrow keys to move around the map
3. **Terrain Costs**: Different terrain types cost different move points:
   - ⬜ **Snow**: 1 move point
   - ❄️ **Ice**: 2 move points
   - 🎄 **Tree**: 3 move points
4. **End Turn**: Click "NEXT TURN" when you're done moving, or wait for your moves to run out

### Collecting Items

- **🎁 Gifts**: Pick up gifts scattered around the map to earn coins (default: +10 coins each)
- **🔪 Knife**: Collect knives to use in duels (+2 bonus)
- **🗡️ Sword**: Collect swords to use in duels (+3 bonus)
- **⛄ Snowmen**: Visit snowmen to receive clues about treasure locations

### Finding Treasures

1. **Get Clues**: Visit snowmen (⛄) to receive snapshot clues showing the terrain around hidden treasures
2. **View Clues**: Open your inventory to review all collected clues
3. **Dig for Treasure**: When you think you've found a treasure location, stand on it and click "DIG"
   - If correct: You win the treasure value in coins!
   - If incorrect: You dig an empty spot (no penalty)
   - If you have no clues: You can't dig

### Duels ⚔️

When you land on another player's tile, a duel automatically begins:

1. **Automatic Weapon Selection**: If you have weapons, the first available weapon is automatically selected
2. **Fight**: Click "FIGHT!" to start the duel (only the attacker can click)
3. **Dice Roll**: Both players automatically roll dice
4. **Tie Resolution**: If the totals (dice + weapon bonus) are equal, both players re-roll until there's a winner
5. **Results**:
   - **Winner**: Takes coins from the loser (amount varies)
   - **Loser**: Loses coins, is sent back to starting position, and loses the weapon used (if any)
   - **Weapons**: Only consumed after a decisive win/loss (not during ties)

### Special Features

- **Extra Turn**: Rolling a total of 6 or 12 gives you an extra turn immediately after your current turn!
- **Reconnection**: If you disconnect, you can reconnect by browsing rooms, finding your game, and entering your player name and room code
- **Custom Game Settings**: Room creators can customize:
  - Grid size (25-50)
  - Number of gifts (5-50)
  - Treasure values (1-8 treasures with custom values)
  - Number of knives (0-20)
  - Number of swords (0-20)

### Winning

The player with the most coins at the end wins! Coins are earned from:
- Finding treasures (values vary, default: 100, 200, 500, 1000)
- Collecting gifts (+10 coins each, default)
- Winning duels (taking coins from opponents)

## 🎯 Tips & Strategies

- **Plan Your Moves**: Save move points wisely - trees are expensive to cross!
- **Collect Multiple Clues**: The more clues you have, the easier it is to find treasures
- **Weapon Strategy**: 
  - Collect weapons early for duel advantages
  - Save stronger weapons (🗡️ Swords) for important duels
  - Remember: weapons are consumed after use, so use them wisely!
- **Duel Tactics**: 
  - Avoid other players if you're low on coins
  - Attack when you have weapons for better chances
  - Be prepared to be sent back to start if you lose!
- **Map Exploration**: Click and drag to pan the map and explore different areas
- **Inventory Management**: Check your inventory regularly to review clues and weapons

## 🛠️ Technical Details

- **Server**: Node.js with Express and Socket.io
- **Client**: Vanilla JavaScript with HTML5 Canvas
- **Architecture**: Client-server with server-side authoritative game state
- **Multiplayer**: Real-time synchronization via WebSockets
- **Grid Size**: Default 40x40, customizable 25-50
- **Max Players**: 4 players per game
