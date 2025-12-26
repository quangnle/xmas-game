# Cách chạy ứng dụng

## Bước 1: Chạy Server (Backend)

Mở terminal và chạy:
```bash
cd server
npm start
```

Server sẽ chạy trên `http://localhost:3000`

## Bước 2: Mở Client (Frontend)

### Cách 1: Dùng Batch File (Khuyến nghị cho Windows)
```bash
# Chạy file batch từ thư mục gốc
start-web-server.bat
```

File này sẽ tự động:
- Kiểm tra và dọn dẹp port 8000
- Cài đặt http-server nếu chưa có
- Khởi động web server trên port 8000

Sau đó mở browser và vào: `http://localhost:8000`

### Cách 2: Dùng Node.js http-server thủ công
```bash
# Cài đặt http-server (chỉ cần 1 lần)
npm install -g http-server

# Chạy server từ thư mục gốc
http-server -p 8000 -c-1 --cors
```

Sau đó mở browser và vào: `http://localhost:8000`

### Cách 3: Dùng Python HTTP Server (nếu không có Node.js)
```bash
# Từ thư mục gốc của project
python -m http.server 8000
```

### Cách 4: Mở trực tiếp file
- Mở file `index.html` trong browser
- **Lưu ý**: Có thể gặp lỗi CORS với ES modules, nên dùng cách 1, 2 hoặc 3

## Quick Start Script

### Windows (Sử dụng Batch Files):
```bash
# Terminal 1: Chạy API server
start-api-server.bat

# Terminal 2: Chạy web server
start-web-server.bat
```

Hoặc chạy thủ công:
```bash
# Terminal 1: Chạy API server
cd server
npm start

# Terminal 2: Chạy web server (từ thư mục gốc)
http-server -p 8000 -c-1 --cors
```

### Linux/Mac:
```bash
# Terminal 1: Chạy API server
cd server
npm start

# Terminal 2: Chạy web server
http-server -p 8000 -c-1 --cors
# Hoặc dùng Python: python3 -m http.server 8000
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
   - File `start-web-server.bat` sẽ tự động dọn dẹp port 8000
   - Hoặc dùng port khác: `http-server -p 8080 -c-1 --cors`
   - Hoặc thay đổi trong URL: `http://localhost:8080`

3. **Lỗi CORS:**
   - Đảm bảo client chạy qua HTTP server (không phải file://)
   - Kiểm tra SERVER_URL trong `client/config.js`

