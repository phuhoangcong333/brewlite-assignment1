BrewLite – Đăng ký / Đăng nhập

Chức năng đăng ký, đăng nhập tài khoản bằng JWT, bcrypt và PostgreSQL.

Yêu cầu

Node.js 20 trở lên, PostgreSQL, Git.

Chạy dự án

1. Database

Khởi động PostgreSQL và tạo file backend/.env:

DATABASE_URL="postgresql://postgres:MAT_KHAU@localhost:5432/brewlite?schema=public"
JWT_SECRET="your-secret-key"

Cập nhật database:

cd backend
node_modules/.bin/prisma.cmd migrate dev --schema prisma/schema.prisma

2. Backend

Mở terminal:

cd backend
npm install
npm run start:dev

Backend chạy tại:

http://localhost:3000

3. Frontend

Mở terminal khác:

cd frontend
npm install
npm run dev

Frontend chạy tại:

http://localhost:3001

Chức năng

POST /auth/register – Đăng ký

POST /auth/login – Đăng nhập

Mật khẩu được băm bằng bcrypt

Đăng nhập trả về JWT

JWT Guard bảo vệ API

Mật khẩu tối thiểu 8 ký tự, có chữ hoa, chữ thường và số

Giao diện

Đăng ký: http://localhost:3001/register

Đăng nhập: http://localhost:3001/login

Prisma Studio

cd backend
node_modules/.bin/prisma.cmd studio --schema prisma/schema.prisma

Mở http://localhost:5555 để xem dữ liệu bảng User.