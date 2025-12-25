# Cách chạy ứng dụng

## Bước 1: Chạy Server (Backend)

Mở terminal và chạy:
```bash
cd server
npm start
```

Server sẽ chạy trên `http://localhost:3000`

## Bước 2: Mở Client (Frontend)

### Cách 1: Dùng Python HTTP Server (Khuyến nghị)
```bash
# Từ thư mục gốc của project
python -m http.server 8000
```

Sau đó mở browser và vào: `http://localhost:8000`

### Cách 2: Dùng Node.js http-server
```bash
# Cài đặt http-server (chỉ cần 1 lần)
npm install -g http-server

# Chạy server
http-server -p 8000
```

Sau đó mở browser và vào: `http://localhost:8000`

### Cách 3: Mở trực tiếp file
- Mở file `index.html` trong browser
- **Lưu ý**: Có thể gặp lỗi CORS với ES modules, nên dùng cách 1 hoặc 2

## Quick Start Script

### Windows:
```bash
# Terminal 1: Chạy server
cd server
npm start

# Terminal 2: Chạy client
python -m http.server 8000
```

### Linux/Mac:
```bash
# Terminal 1: Chạy server
cd server
npm start

# Terminal 2: Chạy client
python3 -m http.server 8000
```

## Truy cập

- **Client**: http://localhost:8000
- **Server API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## Troubleshooting

1. **Port 3000 đã được sử dụng:**
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /F /PID <PID>
   
   # Linux/Mac
   lsof -ti:3000 | xargs kill
   ```

2. **Port 8000 đã được sử dụng:**
   - Dùng port khác: `python -m http.server 8080`
   - Hoặc thay đổi trong URL: `http://localhost:8080`

3. **Lỗi CORS:**
   - Đảm bảo client chạy qua HTTP server (không phải file://)
   - Kiểm tra SERVER_URL trong `client/config.js`

