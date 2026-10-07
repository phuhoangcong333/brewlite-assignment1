# BrewLite Backend

NestJS backend using PostgreSQL and Prisma. The official database schema is
`prisma/schema.prisma`.

## Cài database

Mỗi thành viên sử dụng PostgreSQL cục bộ của mình. Không commit `.env`.

1. Sao chép `backend/.env.example` thành `backend/.env`, sau đó điền
   credentials PostgreSQL cục bộ và JWT secret ngẫu nhiên:

   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/brewlite?schema=public"
   JWT_SECRET=replace-with-a-long-random-secret
   ```

   Muốn tạo database tên khác, đổi phần tên database trong `DATABASE_URL`
   (ví dụ `brewlite`) trước khi chạy Prisma.

2. Từ thư mục `backend`, cài dependencies và chạy Prisma Migrate:

   ```powershell
   npm install
   npx prisma migrate dev --schema prisma/schema.prisma
   ```

   Prisma dùng database trong `DATABASE_URL`; nếu database chưa tồn tại, lệnh
   sẽ yêu cầu tạo database mới rồi áp dụng các migration trong
   `prisma/migrations`. Tài khoản PostgreSQL cần quyền tạo database. Nếu tài
   khoản không có quyền này, tạo database rỗng trước bằng `createdb` hoặc
   `psql`, rồi chạy lại lệnh Prisma.

   `@prisma/client` và Prisma CLI đã được khai báo trong `package.json`.
   Nếu cần cài riêng hai package này, giữ chúng cùng phiên bản:

   ```powershell
   npm install @prisma/client@6.19.0
   npm install --save-dev prisma@6.19.0
   ```

3. Generate Prisma Client và nạp dữ liệu mẫu:

   ```powershell
   npx prisma generate --schema prisma/schema.prisma
   npm run db:seed
   ```

Seed thêm 8 sản phẩm với stock ban đầu 50 và hai mã `GIAM10`/`BREW20`. Seed
có thể chạy lại mà không reset stock hay lượt khuyến mãi đã thay đổi.

> Repo đã có migration khởi tạo. Khi tạo database mới cho BrewLite, chạy
> `prisma migrate dev` như trên để áp dụng migration đó; không thêm
> `--name init`. Chỉ dùng `--name init` để tạo migration lần đầu cho project
> chưa có migration trong `prisma/migrations`.

## Migration

Migration đầu tiên và `migration_lock.toml` nằm trong `prisma/migrations` và
được commit cùng schema. Khi thay đổi schema, tạo migration mới:

```powershell
npx prisma migrate dev --schema prisma/schema.prisma --name describe_change
```

Không xóa hoặc sửa migration đã áp dụng. Mỗi developer chạy migration đã có
trong repo lên database cục bộ của mình.

## Chạy backend

```powershell
npm run start:dev
```

Backend mặc định chạy tại http://localhost:3001.

## Kiểm tra

```powershell
npm test
npm run build
npm run lint
```
