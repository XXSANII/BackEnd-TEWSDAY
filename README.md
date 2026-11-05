# TewsDay Backend API

ระบบหลังบ้านของแพลตฟอร์มจับคู่ติวเตอร์และนักเรียน **TewsDay** พัฒนาด้วย **Express 5 + TypeScript** บนฐานข้อมูล **PostgreSQL 16 (`PostGIS` + `pgvector` + `pg_trgm`)** และ **Redis**

---

## 🛠️ สิ่งที่ต้องมีในเครื่องก่อนเริ่มรัน (Prerequisites)

1. **Node.js** เวอร์ชัน `20.x` ขึ้นไป
2. **Docker Desktop** (สำหรับรัน PostgreSQL 16 + PostGIS + pgvector และ Redis)
3. **Postman** (สำหรับนำเข้าไฟล์ [`TewsDay_Postman_Collection.json`](TewsDay_Postman_Collection.json) เพื่อยิงทดสอบ API ทั้ง 70 เส้น)

---

## 🚀 ขั้นตอนการติดตั้งและรันโปรเจกต์ (Step-by-Step)

### Step 1: Clone โปรเจกต์และติดตั้ง Dependencies

```bash
git clone https://github.com/XXSANII/BackEnd-TEWSDAY.git
cd BackEnd-TEWSDAY
npm install
```

---

### Step 2: สร้างไฟล์ `.env`

คัดลอกไฟล์ `.env.example` ไปเป็น `.env` (ค่าเริ่มต้นใน `.env.example` ตั้งค่าให้ตรงกับ Docker เรียบร้อยแล้ว ไม่ต้องแก้เพิ่มก็รันได้ทันที):

```bash
cp .env.example .env
```

---

### Step 3: รันฐานข้อมูล PostgreSQL (PostGIS + pgvector) และ Redis ด้วย Docker

สามารถรันผ่าน **Docker Compose** คำสั่งเดียวได้เลย:

```bash
docker compose up -d
```

*(หรือถ้าเคยรัน Container `tewsday-postgres` และ `tewsday-redis` ไว้แล้ว ให้เช็คด้วยคำสั่ง `docker ps` หรือสั่ง `docker start tewsday-postgres tewsday-redis`)*

---

### Step 4: รัน Database Migration (สร้างตารางทั้งหมด 32 ตาราง)

```bash
npm run db:migrate-up
```

---

### Step 5: รัน Seed Data (เพิ่มข้อมูลจำลอง: แอดมิน, 8 วิชา, 3 ติวเตอร์, 2 นักเรียน, งานสอน, การจองคอร์ส, บิล, แชท)

```bash
npm run db:seed
```

---

### Step 6: เปิดรันเซิร์ฟเวอร์ Backend

```bash
npm run dev
```

เมื่อรันสำเร็จ หน้าจอจะแสดงผล:
- Server ทำงานที่: `http://localhost:5001`
- ทดสอบ Health Check ได้ที่: `http://localhost:5001/status-check`

---

## 🧪 ขั้นตอนการทดสอบ API ด้วย Postman

1. เปิดโปรแกรม **Postman** -> กดปุ่ม **Import**
2. เลือกไฟล์ [`TewsDay_Postman_Collection.json`](TewsDay_Postman_Collection.json) ในโฟลเดอร์โปรเจกต์
3. จะได้ Collection ชื่อ **`TewsDay Backend API (All 70 Endpoints)`** แบ่งหมวดหมู่ตามการ์ดทั้ง 15 การ์ด
4. เมื่อกดยิง API ในโฟลเดอร์ **`01 - Card 1: Auth`** (เช่น Login หรือ Register) ระบบจะบันทึกค่า `{{token}}` และ ID ต่างๆ ลงใน Collection Variables ให้อัตโนมัติ

---

## 👤 บัญชีผู้ใช้งานจำลอง (จาก `npm run db:seed`)

ทุกบัญชีใช้รหัสผ่านเดียวกันคือ: **`SomePassword1234`**

| บทบาท | อีเมล (Email) | รหัสผ่าน (Password) | ชื่อที่แสดง | รายละเอียด |
| --- | --- | --- | --- | --- |
| **Admin** | `admin@myapp.com` | `SomePassword1234` | TewsDay Administrator | แอดมินระบบ (ใช้จัดการวิชา/อนุมัติติวเตอร์/ตรวจสลิป) |
| **Tutor 1** | `tutor.non@tewsday.com` | `SomePassword1234` | ครูพี่นนท์ วิศวะ จุฬาฯ | `verified` (เรท 550฿/ชม., พิกัดสยาม/สามย่าน) |
| **Tutor 2** | `tutor.ploi@tewsday.com` | `SomePassword1234` | ครูพี่พลอย อักษรฯ จุฬาฯ (IELTS 8.5) | `verified` (เรท 600฿/ชม., สอนออนไลน์) |
| **Tutor 3** | `tutor.mark@tewsday.com` | `SomePassword1234` | พี่มาร์ค Full-Stack & Python | `pending` (รอแอดมินอนุมัติ) |
| **Student 1** | `student.min@tewsday.com` | `SomePassword1234` | น้องมิน เตรียมอุดมฯ ม.6 | นักเรียน ม.6 (มีคอร์สเรียนและแชทกับครูพี่นนท์) |
| **Student 2** | `student.arm@tewsday.com` | `SomePassword1234` | น้องอาร์ม ปี 1 วิศวะ | นิสิตปี 1 จุฬาฯ |

---

## 🗄️ วิธีเช็คข้อมูลใน Database (`PostgreSQL`) และ `Redis`

### 1. เชื่อมต่อผ่านโปรแกรม GUI (DBeaver / TablePlus / pgAdmin / VS Code Extension)
- **Host:** `localhost`
- **Port:** `5432`
- **Database:** `tewsday`
- **Username:** `postgres`
- **Password:** `postgres`

### 2. เช็คผ่าน Terminal (`psql`)
```bash
docker exec -it tewsday-postgres psql -U postgres -d tewsday
```
ตัวอย่างคำสั่ง SQL ด้านใน:
```sql
\dt                                                                      -- ดูตารางทั้งหมด 32 ตาราง
SELECT "userId", "email", "displayName", "role", "currentMode" FROM "User";
SELECT "subjectId", "name", "category" FROM "Subject";
SELECT "tutorProfileId", "hourlyRate", "verificationStatus" FROM "TutorProfile";
\q                                                                       -- ออกจาก psql
```

---

## 📜 คำสั่ง NPM Scripts ทั้งหมด

| คำสั่ง | การทำงาน |
| --- | --- |
| `npm run dev` | รันเซิร์ฟเวอร์โหมดพัฒนา (`nodemon` + `tsx`) ที่พอร์ต `5001` |
| `npm run type-check` | ตรวจสอบ TypeScript ทั้งโปรเจกต์ (`tsc --noEmit`) |
| `npm run build` | คอมไพล์โค้ดเป็น JavaScript ลงโฟลเดอร์ `dist/` |
| `npm start` | รันเซิร์ฟเวอร์ Production จากโฟลเดอร์ `dist/` |
| `npm run db:migrate-up` | รัน Migration สร้าง/อัปเดตตารางในฐานข้อมูล |
| `npm run db:migrate-down` | ย้อนกลับ Migration ล่าสุด 1 ขั้น |
| `npm run db:seed` | รันข้อมูลจำลองตั้งต้นลงฐานข้อมูล (`seeds/v-1-0-0.ts`) |

---

## 📁 เอกสารเพิ่มเติมในโปรเจกต์

- [`API_PROGRESS.md`](API_PROGRESS.md) — สรุปความคืบหน้าของ API ทั้ง 16 การ์ด
- [`docs/README.md`](docs/README.md) — ดัชนีรหัส API (`API Code`) และ Path ของทุกเส้นในระบบ
- [`TewsDay_Postman_Collection.json`](TewsDay_Postman_Collection.json) — ไฟล์ Postman Collection ครบ 70 เส้น
- [`AGENTS.md`](AGENTS.md) — กฎและโครงสร้างสถาปัตยกรรมของโปรเจกต์
