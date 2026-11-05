# TewsDay Backend — API Implementation Progress

ไฟล์ติดตามความคืบหน้าการพัฒนา Backend API ของโปรเจกต์ **TewsDay** ตามโครงสร้าง Notion Kanban Board ทั้ง **16 การ์ด**

## สรุปภาพรวม (Overall Status)

| หมวดหมู่งาน | สถานะ | ความคืบหน้า |
| --- | --- | --- |
| **Database Schema & Migrations (`v-1-0-0`, `v-1-1-0`)** | ✅ Done | 32/32 ตาราง (PostgreSQL 16 + PostGIS + pgvector) |
| **Core MVP APIs (การ์ดที่ 1–13, 15, 16)** | ✅ Done | 64/64 เส้น API (`npm run type-check` ผ่าน 100%) |
| **Phase 2 Backlog: Q&A Forum (การ์ดที่ 14)** | ⏳ Backlog (Post-MVP) | 0/5 เส้น API |
| **Background Cron Jobs (`src/job/`)** | ⏳ Pending | Auto-complete 48h, Monthly Commission Billing, Overdue Suspension |
| **Endpoint Docs (`docs/<group>/`) & Bruno (`bruno-api/`)** | ⏳ Pending | ดัชนีใน `docs/README.md` เสร็จแล้ว รอสร้างไฟล์รายเส้น |

---

## รายละเอียดความคืบหน้าทั้ง 16 การ์ด

### ✅ การ์ดที่ 1: `Auth` (`src/api/auth/`) — เสร็จสมบูรณ์ (7/7)
*ไฟล์หลัก:* [`auth.routes.ts`](src/api/auth/auth.routes.ts) | [`auth.controller.ts`](src/api/auth/auth.controller.ts) | [`auth.service.ts`](src/api/auth/auth.service.ts) | [`auth.validation.ts`](src/api/auth/auth.validation.ts) | [`_auth.utils.ts`](src/api/auth/_auth.utils.ts)
- [x] `POST /api/v1/auth/register` — `auth_001_c` สมัครสมาชิกใหม่ด้วยอีเมลและรหัสผ่าน
- [x] `POST /api/v1/auth/login` — `auth_002_c` เข้าสู่ระบบรับ JWT Token และสร้าง Session
- [x] `POST /api/v1/auth/oauth/:provider` — `auth_003_c` ล็อกอินผ่าน Provider ภายนอก (Google / OAuth)
- [x] `POST /api/v1/auth/refresh-token` — `auth_004_c` หมุนเวียนและต่ออายุ Session Token
- [x] `POST /api/v1/auth/logout` — `auth_005_c` ออกจากระบบและเพิกถอนเซสชันปัจจุบัน
- [x] `POST /api/v1/auth/sessions/search` — `auth_006_s` ดูรายการเซสชันของอุปกรณ์ทั้งหมดที่กำลังเข้าสู่ระบบอยู่
- [x] `DELETE /api/v1/auth/sessions/:sessionId/delete` — `auth_006_d` ตัดสิทธิ์เซสชันเครื่องอื่น (Force Logout)

---

### ✅ การ์ดที่ 2: `User / Mode & Notifications` (`src/api/me/profile/`, `src/api/me/notification/`) — เสร็จสมบูรณ์ (7/7)
*ไฟล์หลัก:* [`profile.service.ts`](src/api/me/profile/profile.service.ts) | [`notification.service.ts`](src/api/me/notification/notification.service.ts)
- [x] `GET /api/v1/me/profile/get` — `me_001_g` ดูข้อมูลโปรไฟล์บัญชีตนเอง พร้อม `role` และ `currentMode`
- [x] `PUT /api/v1/me/profile/mode/edit` — `me_001_mode` สลับโหมดหน้าจอการใช้งาน (`student` / `tutor`)
- [x] `PUT /api/v1/me/profile/avatar/edit` — `me_001_avatar` อัปเดตรูปประจำตัว (`profileImageId`)
- [x] `PUT /api/v1/me/profile/notifications/edit` — `me_001_noti_e` อัปเดตการตั้งค่าการแจ้งเตือน (`notificationSettings`)
- [x] `GET /api/v1/me/badge-counts/get` — `me_002_badge` ดึงตัวเลขแจ้งเตือนบน Navbar (Unread Chat, Pending Bookings, Unpaid Invoices)
- [x] `POST /api/v1/me/notifications/search` — `me_002_s` ดึงรายการแจ้งเตือนทั้งหมดของผู้ใช้
- [x] `PUT /api/v1/me/notifications/:id/read` — `me_002_read` ทำเครื่องหมายว่าอ่านการแจ้งเตือนแล้ว

---

### ✅ การ์ดที่ 3: `Storage` (`src/api/storage/`) — เสร็จสมบูรณ์ (3/3)
*ไฟล์หลัก:* [`storage.routes.ts`](src/api/storage/storage.routes.ts) | [`storage.controller.ts`](src/api/storage/storage.controller.ts) | [`storage.service.ts`](src/api/storage/storage.service.ts) | [`storage.validation.ts`](src/api/storage/storage.validation.ts)
- [x] `POST /api/v1/storage/presigned-upload` — `storage_001_c` ขอ S3 Presigned URL เพื่ออัปโหลดไฟล์จากหน้าบ้าน
- [x] `POST /api/v1/storage/confirm-upload` — `storage_002_c` ยืนยันการอัปโหลดไฟล์เพื่อบันทึกลงตาราง `File`
- [x] `GET /api/v1/storage/:fileId/view-url` — `storage_003_g` ขอ Signed URL ชั่วคราวสำหรับดูไฟล์เอกสาร

---

### ✅ การ์ดที่ 4: `Tutor Profile` (`src/api/me/tutor/`) — เสร็จสมบูรณ์ (7/7)
*ไฟล์หลัก:* [`tutor.routes.ts`](src/api/me/tutor/tutor.routes.ts) | [`tutor.controller.ts`](src/api/me/tutor/tutor.controller.ts) | [`tutor.service.ts`](src/api/me/tutor/tutor.service.ts) | [`tutor.validation.ts`](src/api/me/tutor/tutor.validation.ts)
- [x] `GET /api/v1/me/tutor/get` — `me_003_g` ดูข้อมูลโปรไฟล์ติวเตอร์ของตนเอง พร้อมวิชาและวุฒิการศึกษา
- [x] `PUT /api/v1/me/tutor/edit` — `me_003_e` แก้ไขประวัติ, เรทราคาต่อชั่วโมง, พิกัด PostGIS, เลขบัญชี/PromptPay, และวิชาที่สอน
- [x] `POST /api/v1/me/tutor/education/create` — `me_003_edu_c` เพิ่มประวัติการศึกษาพร้อมแนบไฟล์วุฒิ
- [x] `DELETE /api/v1/me/tutor/education/:eduId/delete` — `me_003_edu_d` ลบประวัติการศึกษา (Soft Delete)
- [x] `GET /api/v1/me/tutor/availability/get` — `me_003_avail_g` ดึงตารางเวลาว่างของตนเองทั้งหมด
- [x] `PUT /api/v1/me/tutor/availability/edit` — `me_003_avail_e` บันทึก/อัปเดตตารางเวลาว่าง (Recurring รายสัปดาห์ / ระบุวันเจาะจง)
- [x] `POST /api/v1/me/tutor/change-requests/create` — `me_003_req_c` ยื่นคำขอแก้ไขข้อมูลสำคัญที่ต้องรอแอดมินอนุมัติ

---

### ✅ การ์ดที่ 5: `Student Profile` (`src/api/me/student/`) — เสร็จสมบูรณ์ (3/3)
*ไฟล์หลัก:* [`student.routes.ts`](src/api/me/student/student.routes.ts) | [`student.controller.ts`](src/api/me/student/student.controller.ts) | [`student.service.ts`](src/api/me/student/student.service.ts) | [`student.validation.ts`](src/api/me/student/student.validation.ts)
- [x] `GET /api/v1/me/student/get` — `me_004_g` ดูโปรไฟล์นักเรียนและข้อมูลผู้ติดต่อฉุกเฉิน
- [x] `PUT /api/v1/me/student/edit` — `me_004_e` แก้ไขข้อมูลนักเรียน, ระดับชั้น, โรงเรียน, พิกัดที่อยู่
- [x] `PUT /api/v1/me/student/emergency-contact/edit` — `me_004_emergency_e` แก้ไขข้อมูลผู้ปกครองและเบอร์ติดต่อฉุกเฉิน

---

### ✅ การ์ดที่ 6: `Subjects` (`src/api/public/subject/`, `src/api/admin/subject/`) — เสร็จสมบูรณ์ (4/4)
*ไฟล์หลัก:* [`public/subject/subject.service.ts`](src/api/public/subject/subject.service.ts) | [`admin/subject/subject.service.ts`](src/api/admin/subject/subject.service.ts)
- [x] `POST /api/v1/public/subjects/search` — `pub_001_s` ดึงรายชื่อหมวดหมู่วิชาทั้งหมดที่เปิดสอน
- [x] `GET /api/v1/public/subjects/:subjectId/get` — `pub_001_g` ดูรายละเอียดของรายวิชา
- [x] `POST /api/v1/admin/subjects/create` — `adm_003_c` เพิ่มวิชาใหม่ (Admin Only)
- [x] `PUT /api/v1/admin/subjects/:subjectId/edit` — `adm_003_e` แก้ไขข้อมูลวิชา (Admin Only)

---

### ✅ การ์ดที่ 7: `Tutor Search` (`src/api/public/tutor/`) — เสร็จสมบูรณ์ (3/3)
*ไฟล์หลัก:* [`tutor.routes.ts`](src/api/public/tutor/tutor.routes.ts) | [`tutor.controller.ts`](src/api/public/tutor/tutor.controller.ts) | [`tutor.service.ts`](src/api/public/tutor/tutor.service.ts) | [`tutor.validation.ts`](src/api/public/tutor/tutor.validation.ts)
- [x] `POST /api/v1/public/tutors/search` — `pub_002_s` ค้นหาติวเตอร์ (Filter: วิชา, ระยะทาง Onsite ด้วย PostGIS, เรทราคา, คะแนนรีวิว)
- [x] `GET /api/v1/public/tutors/:tutorId/get` — `pub_002_g` ดูหน้าโปรไฟล์สาธารณะของติวเตอร์, วิดีโอแนะนำตัว, วิชาที่สอน, และสรุปเรตติ้ง
- [x] `GET /api/v1/public/tutors/:tutorId/availability/get` — `pub_002_avail_g` ตรวจสอบตารางเวลาว่างของติวเตอร์เพื่อเลือกเวลานัดเรียน

---

### ✅ การ์ดที่ 8: `Marketplace (Student Jobs)` (`src/api/public/job/`, `src/api/me/job/`) — เสร็จสมบูรณ์ (8/8)
*ไฟล์หลัก:* [`public/job/job.service.ts`](src/api/public/job/job.service.ts) | [`me/job/job.service.ts`](src/api/me/job/job.service.ts)
- [x] `POST /api/v1/public/jobs/search` — `pub_003_s` ดึงรายการประกาศหาติวเตอร์ทั้งหมด (Filter: วิชา, ออนไลน์/ออนไซต์, งบประมาณ)
- [x] `GET /api/v1/public/jobs/:jobId/get` — `pub_003_g` ดูรายละเอียดประกาศงาน
- [x] `POST /api/v1/public/jobs/:jobId/share` — `pub_003_share` เพิ่มยอดสถิติการกดแชร์ประกาศงาน (`shareCount + 1`)
- [x] `POST /api/v1/me/jobs/create` — `me_005_c` สร้างประกาศหาติวเตอร์ใหม่ ระบุวิชา เป้าหมาย งบประมาณ และพิกัด
- [x] `PUT /api/v1/me/jobs/:jobId/status/edit` — `me_005_status_e` เปลี่ยนสถานะประกาศงาน (`closed` / `cancelled`)
- [x] `POST /api/v1/me/jobs/:jobId/applications/search` — `me_005_apps_s` ดูรายการข้อเสนอสอนที่ติวเตอร์ยื่นเข้ามา
- [x] `POST /api/v1/me/jobs/:jobId/apply` — `me_005_apply_c` ติวเตอร์ส่งใบสมัครเสนอสอน พร้อมระบุราคาและข้อความแนะนำ
- [x] `PUT /api/v1/me/applications/:applicationId/status/edit` — `me_005_app_status_e` นักเรียนกดตอบรับ (`accepted`) หรือปฏิเสธ (`rejected`) ใบสมัคร

---

### ✅ การ์ดที่ 9: `Bookings` (`src/api/me/booking/`) — เสร็จสมบูรณ์ (4/4)
*ไฟล์หลัก:* [`booking.routes.ts`](src/api/me/booking/booking.routes.ts) | [`booking.controller.ts`](src/api/me/booking/booking.controller.ts) | [`booking.service.ts`](src/api/me/booking/booking.service.ts) | [`booking.validation.ts`](src/api/me/booking/booking.validation.ts)
- [x] `POST /api/v1/me/bookings/create` — `me_006_c` สร้างคำขอเปิดคอร์สเรียนพร้อมตารางชั่วโมงเรียนเริ่มต้น
- [x] `POST /api/v1/me/bookings/search` — `me_006_s` ดึงรายการคอร์สเรียนทั้งหมดของผู้ใช้
- [x] `GET /api/v1/me/bookings/:bookingId/get` — `me_006_g` ดูรายละเอียดการจองคอร์ส, สถานที่นัดสอน หรือลิงก์ห้องเรียนออนไลน์
- [x] `PUT /api/v1/me/bookings/:bookingId/cancel` — `me_006_cancel` ยกเลิกการจองคอร์สเรียนและชั่วโมงเรียนที่ยังไม่เริ่ม

---

### ✅ การ์ดที่ 10: `Class Sessions` (`src/api/me/session/`) — เสร็จสมบูรณ์ (5/5)
*ไฟล์หลัก:* [`session.routes.ts`](src/api/me/session/session.routes.ts) | [`session.controller.ts`](src/api/me/session/session.controller.ts) | [`session.service.ts`](src/api/me/session/session.service.ts) | [`session.validation.ts`](src/api/me/session/session.validation.ts)
- [x] `POST /api/v1/me/bookings/:bookingId/sessions/search` — `me_007_s` ดูรายการชั่วโมงเรียนทั้งหมดในคอร์ส
- [x] `POST /api/v1/me/sessions/:sessionId/start` — `me_007_start` ติวเตอร์กดเริ่มคลาสสอน (บันทึก `actualStart`)
- [x] `POST /api/v1/me/sessions/:sessionId/complete` — `me_007_complete` ติวเตอร์กดจบการสอนและบันทึกสรุปผลการเรียน/การบ้าน
- [x] `POST /api/v1/me/sessions/:sessionId/confirm-attendance` — `me_007_confirm` นักเรียนกดยืนยันเข้าเรียน และสร้างรายการค่าคอมมิชชันแพลตฟอร์มอัตโนมัติ
- [x] `POST /api/v1/me/sessions/:sessionId/dispute` — `me_007_dispute` เปิดข้อพิพาทรายงานปัญหาชั่วโมงเรียน

---

### ✅ การ์ดที่ 11: `Invoices & Commission Billing` (`src/api/me/invoice/`) — เสร็จสมบูรณ์ (3/3)
*ไฟล์หลัก:* [`invoice.routes.ts`](src/api/me/invoice/invoice.routes.ts) | [`invoice.controller.ts`](src/api/me/invoice/invoice.controller.ts) | [`invoice.service.ts`](src/api/me/invoice/invoice.service.ts) | [`invoice.validation.ts`](src/api/me/invoice/invoice.validation.ts)
- [x] `POST /api/v1/me/invoices/search` — `me_009_s` ดูรายการใบแจ้งหนี้ทั้งหมดของผู้ใช้
- [x] `GET /api/v1/me/invoices/:invoiceId/get` — `me_009_g` ดูรายละเอียดใบแจ้งหนี้และรายการย่อย (`InvoiceItem`)
- [x] `POST /api/v1/me/invoices/:invoiceId/slip/upload` — `me_009_slip_c` แนบหลักฐานสลิปโอนเงินค่าคอมมิชชันเพื่อรอแอดมินตรวจสอบ

---

### ✅ การ์ดที่ 12: `Chat & Messaging` (`src/api/me/chat/`) — เสร็จสมบูรณ์ (6/6)
*ไฟล์หลัก:* [`chat.routes.ts`](src/api/me/chat/chat.routes.ts) | [`chat.controller.ts`](src/api/me/chat/chat.controller.ts) | [`chat.service.ts`](src/api/me/chat/chat.service.ts) | [`chat.validation.ts`](src/api/me/chat/chat.validation.ts)
- [x] `POST /api/v1/me/conversations/search` — `me_010_conv_s` ดึงรายการห้องสนทนาทั้งหมดของผู้ใช้
- [x] `POST /api/v1/me/conversations/create` — `me_010_conv_c` สร้างหรือเปิดห้องสนทนาระหว่างนักเรียนและติวเตอร์
- [x] `POST /api/v1/me/conversations/:conversationId/messages/search` — `me_010_msg_s` ดึงประวัติข้อความในห้องสนทนา
- [x] `POST /api/v1/me/conversations/:conversationId/messages/create` — `me_010_msg_c` ส่งข้อความหรือไฟล์แนบในห้องสนทนา
- [x] `PUT /api/v1/me/conversations/:conversationId/read` — `me_010_read` อัปเดตสถานะว่าอ่านข้อความในห้องสนทนาแล้ว
- [x] `DELETE /api/v1/me/messages/:messageId/delete` — `me_010_msg_d` ลบข้อความของตนเอง (Soft Delete)

---

### ✅ การ์ดที่ 13: `Reviews & Ratings` (`src/api/me/review/`, `src/api/public/tutor/`) — เสร็จสมบูรณ์ (3/3)
*ไฟล์หลัก:* [`me/review/review.service.ts`](src/api/me/review/review.service.ts) | [`public/tutor/tutor.service.ts`](src/api/public/tutor/tutor.service.ts)
- [x] `POST /api/v1/me/sessions/:sessionId/reviews/create` — `me_011_c` ส่งรีวิวและให้คะแนน 1–5 ดาวหลังจบคลาส พร้อมอัปเดต `popularityScore`
- [x] `POST /api/v1/public/tutors/:tutorId/reviews/search` — `pub_002_rev_s` ดึงรายการรีวิวทั้งหมดของติวเตอร์
- [x] `POST /api/v1/me/reviews/search` — `me_011_s` ดูประวัติรีวิวทั้งหมดที่ตนเองเคยเขียน

---

### ⏳ การ์ดที่ 14: `Q&A Community Forum` (Phase 2 — Post-MVP Backlog) (0/5)
> *หมายเหตุ:* ตามเอกสาร BRD หัวข้อที่ 10 ระบบ Q&A ถูกจัดอยู่ในเฟสที่ 2 หลังจบ MVP
- [ ] `POST /api/v1/public/questions/search` — `pub_004_s` ค้นหากระทู้คำถาม
- [ ] `POST /api/v1/me/questions/create` — `me_012_c` ตั้งกระทู้ถามการบ้านพร้อมแนบรูปโจทย์
- [ ] `POST /api/v1/me/questions/:questionId/answers/create` — `me_012_ans_c` ตอบคำถามในกระทู้
- [ ] `PUT /api/v1/me/answers/:answerId/accept` — `me_012_ans_accept` เลือกคำตอบที่ดีที่สุด (Best Answer)
- [ ] `POST /api/v1/me/answers/:answerId/upvote` — `me_012_ans_vote` กดโหวตให้คะแนนคำตอบ

---

### ✅ การ์ดที่ 15: `AI Recommendations Engine` (`src/api/me/recommendation/`) — เสร็จสมบูรณ์ (3/3)
*ไฟล์หลัก:* [`recommendation.routes.ts`](src/api/me/recommendation/recommendation.routes.ts) | [`recommendation.controller.ts`](src/api/me/recommendation/recommendation.controller.ts) | [`recommendation.service.ts`](src/api/me/recommendation/recommendation.service.ts) | [`recommendation.validation.ts`](src/api/me/recommendation/recommendation.validation.ts)
- [x] `POST /api/v1/me/recommendations/tutors/search` — `me_008_tutors_s` ดึงติวเตอร์แนะนำเฉพาะบุคคลด้วย Hybrid Scoring
- [x] `POST /api/v1/me/recommendations/jobs/search` — `me_008_jobs_s` ดึงงานสอนแนะนำเฉพาะบุคคลสำหรับติวเตอร์
- [x] `POST /api/v1/me/recommendations/feedback/create` — `me_008_feedback_c` บันทึกผลการตอบรับหรือเหตุผลที่กดข้าม (`RecommendationFeedback`)

---

### ✅ การ์ดที่ 16: `Admin Moderation & Back-office` (`src/api/admin/moderation/`) — เสร็จสมบูรณ์ (9/9)
*ไฟล์หลัก:* [`moderation.routes.ts`](src/api/admin/moderation/moderation.routes.ts) | [`moderation.controller.ts`](src/api/admin/moderation/moderation.controller.ts) | [`moderation.service.ts`](src/api/admin/moderation/moderation.service.ts) | [`moderation.validation.ts`](src/api/admin/moderation/moderation.validation.ts)
- [x] `POST /api/v1/admin/tutors/verification/search` — `adm_001_s` ดูรายชื่อติวเตอร์ที่รอตรวจสอบวุฒิการศึกษาและวิดีโอแนะนำตัว
- [x] `PUT /api/v1/admin/tutors/:tutorId/verify` — `adm_001_verify` อนุมัติหรือปฏิเสธการยืนยันตัวตนติวเตอร์
- [x] `POST /api/v1/admin/change-requests/search` — `adm_002_s` ดูรายการคำขอแก้ไขข้อมูลสำคัญที่ติวเตอร์ยื่นเข้ามา
- [x] `PUT /api/v1/admin/change-requests/:requestId/resolve` — `adm_002_resolve` อนุมัติหรือปฏิเสธคำขอแก้ข้อมูล
- [x] `POST /api/v1/admin/invoices/commission/search` — `adm_004_s` ดูรายการบิลค่าคอมมิชชันและสลิปโอนเงินที่ติวเตอร์ส่งมา
- [x] `PUT /api/v1/admin/invoices/:invoiceId/verify-slip` — `adm_004_verify` ตรวจสอบและอนุมัติสลิปค่าคอมมิชชัน
- [x] `POST /api/v1/admin/disputes/search` — `adm_005_s` ดูรายการข้อพิพาทคลาสเรียนทั้งหมด
- [x] `PUT /api/v1/admin/disputes/:disputeId/resolve` — `adm_005_resolve` ตัดสินข้อพิพาทการเรียน
- [x] `PUT /api/v1/admin/users/:userId/suspend` — `adm_006_suspend` สั่งระงับหรือปลดระงับบัญชีผู้ใช้ พร้อมล้างแคชเซสชันทันที
