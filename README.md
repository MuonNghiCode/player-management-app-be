# Football Player Management System - Backend

## 📖 Mô tả dự án

Đây là phần Backend của hệ thống quản lý cầu thủ bóng đá, được xây dựng bằng **Node.js**, **Express.js** và **MongoDB**. Hệ thống cung cấp API để quản lý các cầu thủ, đội bóng, thành viên và xác thực người dùng.

## 🚀 Tính năng chính

- **Quản lý cầu thủ**: CRUD operations cho thông tin cầu thủ
- **Quản lý đội bóng**: Tạo và quản lý các đội bóng
- **Quản lý thành viên**: Đăng ký, đăng nhập và phân quyền người dùng
- **Xác thực & Phân quyền**: JWT authentication với role-based access
- **Comment System**: Hệ thống bình luận cho cầu thủ
- **File Upload**: Upload hình ảnh cầu thủ
- **Data Seeding**: Script tự động tạo dữ liệu mẫu

## 🛠 Công nghệ sử dụng

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Token)
- **Password Hashing**: bcrypt
- **Environment Variables**: dotenv
- **Template Engine**: EJS
- **File Upload**: Multer
- **CORS**: cors middleware

## 📁 Cấu trúc thư mục

```
AssignmentBE/
├── app.js                 # Entry point của ứng dụng
├── package.json           # Dependencies và scripts
├── .env                   # Environment variables
├── bin/
│   └── www               # Server startup script
├── controllers/          # Controllers xử lý business logic
│   ├── memberController.js
│   ├── playerController.js
│   └── teamController.js
├── db/
│   └── connect.js        # Database connection
├── middlewares/
│   └── auth.js           # Authentication middleware
├── models/               # Mongoose models
│   ├── comment.js
│   ├── member.js
│   ├── player.js
│   └── team.js
├── routes/               # API routes
│   ├── accountRouter.js
│   ├── authRouter.js
│   ├── index.js
│   ├── playerRouter.js
│   ├── teamRouter.js
│   └── users.js
├── scripts/
│   └── insertSampleData.js  # Data seeding script
├── public/               # Static files
│   ├── images/
│   ├── javascripts/
│   └── stylesheets/
└── views/                # EJS templates
    ├── error.ejs
    ├── index.ejs
    ├── layout.ejs
    ├── accounts/
    ├── auth/
    ├── partials/
    ├── players/
    └── teams/
```

## ⚙️ Cài đặt và chạy dự án

### 1. Clone repository

```bash
git clone <repository-url>
cd AssignmentBE
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình Environment Variables

Tạo file `.env` trong thư mục gốc:

```env
MONGO_URI=mongodb://localhost:27017/football-management
PORT=3000
SECRET_KEY=your-jwt-secret-key-here
```

### 4. Khởi chạy MongoDB

Đảm bảo MongoDB đang chạy trên máy của bạn hoặc sử dụng MongoDB Atlas.

### 5. Chạy script tạo dữ liệu mẫu (tùy chọn)

```bash
node scripts/insertSampleData.js
```

### 6. Khởi chạy server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại `http://localhost:3000`

## 📚 API Endpoints

### Authentication
- `POST /auth/signin` - Đăng nhập
- `POST /auth/signup` - Đăng ký
- `POST /auth/logout` - Đăng xuất

### Players
- `GET /players` - Lấy danh sách cầu thủ
- `GET /players/:id` - Lấy thông tin chi tiết cầu thủ
- `POST /players` - Tạo cầu thủ mới (Admin only)
- `PUT /players/:id` - Cập nhật thông tin cầu thủ (Admin only)
- `DELETE /players/:id` - Xóa cầu thủ (Admin only)
- `POST /players/:id/comments` - Thêm bình luận

### Teams
- `GET /teams` - Lấy danh sách đội bóng
- `GET /teams/:id` - Lấy thông tin chi tiết đội bóng
- `POST /teams` - Tạo đội bóng mới (Admin only)
- `PUT /teams/:id` - Cập nhật thông tin đội bóng (Admin only)
- `DELETE /teams/:id` - Xóa đội bóng (Admin only)

### Members
- `GET /accounts` - Lấy danh sách thành viên (Admin only)
- `GET /accounts/:id` - Lấy thông tin chi tiết thành viên
- `PUT /accounts/:id` - Cập nhật thông tin thành viên
- `DELETE /accounts/:id` - Xóa thành viên (Admin only)

## 🔐 Authentication & Authorization

Hệ thống sử dụng JWT tokens để xác thực. Có 2 loại người dùng:

- **Admin**: Có quyền CRUD tất cả tài nguyên
- **User**: Chỉ có quyền xem và bình luận

### Headers yêu cầu

```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

## 📊 Database Schema

### Member Model
```javascript
{
  membername: String (unique),
  password: String (hashed),
  name: String,
  YOB: Number,
  isAdmin: Boolean
}
```

### Player Model
```javascript
{
  playerName: String,
  image: String (URL),
  cost: Number,
  isCaptain: Boolean,
  information: String,
  team: ObjectId (ref: Team),
  comments: [ObjectId] (ref: Comment)
}
```

### Team Model
```javascript
{
  teamName: String (unique)
}
```

### Comment Model
```javascript
{
  content: String,
  author: ObjectId (ref: Member),
  player: ObjectId (ref: Player),
  createdAt: Date
}
```

## 🧪 Testing

```bash
# Chạy tests
npm test

# Test với coverage
npm run test:coverage
```

## 📝 Scripts có sẵn

- `npm start` - Chạy server production
- `npm run dev` - Chạy server development với nodemon
- `npm test` - Chạy test suite
- `node scripts/insertSampleData.js` - Tạo dữ liệu mẫu

## 🚀 Deployment

### Sử dụng PM2

```bash
# Cài đặt PM2
npm install -g pm2

# Chạy với PM2
pm2 start app.js --name "football-api"

# Monitor
pm2 monit
```

### Environment Variables for Production

```env
MONGO_URI=
PORT=3000
SECRET_KEY=your-super-secret-jwt-key
NODE_ENV=production
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🐛 Known Issues & Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Đảm bảo MongoDB đang chạy
   - Kiểm tra MONGO_URI trong file .env

2. **JWT Token Invalid**
   - Kiểm tra SECRET_KEY
   - Đảm bảo token chưa hết hạn

3. **Permission Denied**
   - Kiểm tra role của user (admin/user)
   - Đảm bảo có token hợp lệ

## 📞 Support

Nếu có vấn đề hoặc câu hỏi, vui lòng tạo issue trên GitHub hoặc liên hệ qua email.

---

**Happy Coding! ⚽️**
