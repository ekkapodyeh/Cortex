// @ts-nocheck
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import type { Feature, DiffResult, ValidationResult } from '@/lib/types'

const now = Date.now()
const daysAgo = (d: number) => new Date(now - 1000 * 60 * 60 * 24 * d)

// ── Pre-built Mermaid diagrams per category ──────────────────────────────────

const DIAGRAM_AUTH = `flowchart TD
  subgraph User["ผู้ใช้"]
    A([เปิดแอป]) --> B{เลือกวิธีเข้าสู่ระบบ}
    B --> C[Email และรหัสผ่าน]
    B --> D[Sign in with Google]
    B --> E[สมัครสมาชิกใหม่]
    B --> F[ลืมรหัสผ่าน]
  end
  subgraph Frontend["Frontend"]
    G[Firebase Auth SDK]
    H[หน้า OTP 6 หลัก]
  end
  subgraph Backend["Backend"]
    I{ตรวจสอบ Credential}
    J[ออก JWT Token 24 ชม]
    K[ส่ง OTP ทาง SMS หรือ Email]
    L[สร้างบัญชีใหม่]
  end
  C --> I
  D --> G --> I
  I -->|อุปกรณ์ใหม่| K --> H --> J
  I -->|ผ่าน| J
  E --> L --> K
  F --> K
  J --> Z([เข้าสู่ระบบสำเร็จ])`

const DIAGRAM_REPORT = `flowchart TD
  subgraph User["ผู้ใช้"]
    A([เปิดหน้า Report]) --> B{เลือกประเภทรายงาน}
    B --> C[สุขภาพรายวัน]
    B --> D[ประวัตินัดหมาย]
    B --> E[Export เป็น PDF รายเดือน]
  end
  subgraph Frontend["Frontend"]
    F[กราฟแนวโน้ม 7 วัน]
    G[รายการนัดหมาย]
    H[PDF Viewer]
  end
  subgraph Backend["Backend"]
    I[Health Data Service]
    J[Appointment Service]
    K[PDF Generator]
    L[Email Service]
  end
  C --> I --> F
  D --> J --> G
  E --> K --> H
  H --> L --> Z([ส่งออกทางอีเมล หรือบันทึกลงอุปกรณ์])`

const DIAGRAM_MIGRAINE = `flowchart TD
  subgraph User["ผู้ใช้"]
    A([เปิดหน้า Migraine Tracking]) --> B{เลือกการดำเนินการ}
    B --> C[บันทึกอาการ]
    C --> D[ระดับความเจ็บปวด 0-10]
    D --> E[ระบุ Trigger แสง เสียง อาหาร]
    B --> F[ดูประวัติ 30/60/90 วัน]
  end
  subgraph Frontend["Frontend"]
    G[Pain Slider]
    H[Timeline Chart]
    I[Push Notification]
  end
  subgraph Backend["Backend"]
    J[Migraine Record Service]
    K{ตรวจสอบความรุนแรง}
    L[Trigger Analysis]
    M[Notification Service]
  end
  E --> G --> J
  J --> K
  K -->|ระดับ >= 8| M --> I
  K -->|>= 4 ครั้งต่อเดือน| M
  F --> L --> H
  K --> H`

const DIAGRAM_MEDICINE = `flowchart TD
  subgraph User["ผู้ใช้"]
    A([เปิด Medicine Pouch]) --> B{เลือกการดำเนินการ}
    B --> C[เพิ่มรายการยา]
    C --> D[สแกนบาร์โค้ด]
    B --> E[ตั้งเวลาแจ้งเตือน]
    B --> F[ยืนยันการกินยา]
  end
  subgraph Frontend["Frontend"]
    G[Barcode Scanner]
    H[Reminder UI]
    I[Push Notification]
  end
  subgraph Backend["Backend"]
    J[Drug Info API]
    K[Medicine Service]
    L[Reminder Scheduler]
    M[Adherence Tracker]
  end
  D --> G --> J --> K
  E --> H --> L --> I
  F --> M
  M --> N{ยาใกล้หมด?}
  N -->|ใช่| I`

const DIAGRAM_DISCOUNT = `flowchart TD
  subgraph User["ผู้ใช้"]
    A([เปิดหน้าโค้ดส่วนลด]) --> B[ดูรายการโค้ดและเงื่อนไข]
    B --> C{เลือกการดำเนินการ}
    C --> D[ใช้โค้ดตอน Checkout]
    C --> E([รับแจ้งเตือนโค้ดใกล้หมดอายุ])
  end
  subgraph Frontend["Frontend"]
    F[Discount Code List]
    G[Checkout Page]
    H[Push Notification]
  end
  subgraph Backend["Backend"]
    I[Discount Service]
    J{ตรวจสอบโค้ด}
    K[หักส่วนลดอัตโนมัติ]
    L[Notification Scheduler]
  end
  B --> F --> I
  D --> G --> J
  J -->|ถูกต้อง| K --> Z([Order สำเร็จ พร้อมส่วนลด])
  I --> L
  L -->|ใกล้หมดอายุ 3 วัน| H --> E`

const DIAGRAM_MARKETPLACE = `flowchart TD
  subgraph User["ผู้ใช้"]
    A([เปิด Marketplace]) --> B[เลื่อนดูสินค้า Infinite Scroll]
    B --> C[ค้นหาและกรองสินค้า]
    C --> D[เพิ่มลงตะกร้า]
    D --> E[เลือกที่อยู่จัดส่ง]
    E --> F[ชำระเงิน]
    F --> G[ดูสถานะ Order]
    G --> H[ติดตามการจัดส่ง]
  end
  subgraph Frontend["Frontend"]
    I[Product List UI]
    J[Cart และ Checkout UI]
    K[Payment SDK]
    L[Order Tracking UI]
  end
  subgraph Backend["Backend"]
    M[Product Service]
    N[Order Service]
    O{Payment Gateway}
    P[Notification Service]
    Q[Courier Tracking API]
  end
  B --> I --> M
  D --> J
  F --> K --> O
  O -->|สำเร็จ| N --> P
  P --> Z([Push Notification ยืนยัน Order])
  G --> N
  H --> Q --> L`

const DIAGRAM_CM_AUTH = `flowchart TD
  subgraph User["ผู้ป่วย"]
    A([เปิดแอป ClinicMate]) --> B[กรอกเลขบัตรประชาชน 13 หลัก]
    B --> C[กรอกวันเกิด]
  end
  subgraph Backend["Backend"]
    D{ตรวจสอบข้อมูล}
    E[ออก Session Token]
    F[บันทึก Login Log]
  end
  C --> D
  D -->|ถูกต้อง| E --> F --> Z([เข้าสู่ระบบสำเร็จ])
  D -->|ไม่ถูกต้อง| G([แสดงข้อผิดพลาด])`

const DIAGRAM_CM_APPT = `flowchart TD
  subgraph User["ผู้ป่วย"]
    A([เปิดหน้านัดหมาย]) --> B{เลือกการดำเนินการ}
    B --> C[จองนัดใหม่]
    C --> D[เลือกแพทย์]
    D --> E[เลือกวันและเวลา]
    E --> F[เลือกประเภทนัด ตรวจทั่วไป/ฉุกเฉิน]
    B --> G[เลื่อนนัดหมาย]
    B --> H[ยกเลิกนัด พร้อมเหตุผล]
  end
  subgraph Backend["Backend"]
    I[Appointment Service]
    J{ตรวจสอบ ล่วงหน้า >= 2 ชม}
    K[SMS Confirmation]
  end
  F --> I --> K --> Z([ยืนยันนัดทาง SMS])
  G --> J
  J -->|ผ่าน| I
  H --> I`

const DIAGRAM_CM_RECORD = `flowchart TD
  subgraph User["ผู้ป่วย"]
    A([เปิดเวชระเบียน]) --> B{เลือกการดำเนินการ}
    B --> C[ดูประวัติการรักษา]
    C --> D[ดูผลแล็บและใบสั่งยา]
    B --> E[แบ่งปันข้อมูลกับแพทย์]
    E --> F[สร้าง QR Code ชั่วคราว]
  end
  subgraph Backend["Backend"]
    G[Medical Record Service]
    H[QR Token Service]
    I{QR อายุ 24 ชม}
  end
  C --> G
  D --> G
  F --> H --> I
  I -->|ยังไม่หมดอายุ| Z([แพทย์สแกน QR เข้าถึงประวัติได้])`

const DIAGRAM_CM_BILLING = `flowchart TD
  subgraph User["ผู้ป่วย"]
    A([เปิดหน้าการเงิน]) --> B[ดูใบเสร็จค่ารักษา]
    B --> C[รายการค่าบริการ ค่ายา ค่าหัตถการ]
    C --> D{เลือกชำระเงิน}
    D --> E[QR Promptpay]
    D --> F[Credit Card]
  end
  subgraph Frontend["Frontend"]
    G[QR Code Display]
    H[Card Payment Form]
  end
  subgraph Backend["Backend"]
    I{Payment Gateway Thai QR}
    J[Receipt Service]
  end
  E --> G --> I
  F --> H --> I
  I -->|สำเร็จ| J --> Z([ออกใบเสร็จอิเล็กทรอนิกส์])`

const DIAGRAM_CM_TELE = `flowchart TD
  subgraph User["ผู้ป่วย"]
    A([เปิด Telemedicine]) --> B{เลือกช่องทาง}
    B --> C[วิดีโอคอลกับแพทย์]
    B --> D[แชทกับแพทย์และพยาบาล]
    D --> E[ส่งรูปภาพหรือเอกสาร]
  end
  subgraph Frontend["Frontend"]
    F[WebRTC Client iOS/Android]
    G[Chat UI]
  end
  subgraph Backend["Backend"]
    H[Video Call Service]
    I[Chat Service]
    J[Prescription Service]
  end
  C --> F --> H
  D --> G --> I
  E --> I
  I --> J --> Z([รับใบสั่งยาผ่านแชท])`

// ── Feature definitions ───────────────────────────────────────────────────────

export async function GET() {
  return POST()
}

export async function POST() {
  await db.sprintRequirement.deleteMany()
  await db.projectUpdateDoc.deleteMany()
  await db.knowledgeDoc.deleteMany()
  await db.documentRequirement.deleteMany()
  await db.analysisJob.deleteMany()
  await db.project.deleteMany()

  // ──────────────────────────────────────────
  // PROJECT 1: Doctor Mobile
  // ──────────────────────────────────────────
  const doctorMobile = await db.project.create({
    data: {
      name: 'Doctor Mobile',
      repoUrl: 'https://github.com/gooddoctor-th/doctor-mobile',
      platform: 'GITHUB',
      webhookSecret: 'whsec-dm-001',
      createdAt: daysAgo(90),
    },
  })

  // ── Technical specs for AUTH features ────────────────────────────────────────
  const TECH_AUTH001 = {
    sequenceDiagram: `sequenceDiagram
    actor User as ผู้ใช้
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    participant Mail as Email Service
    User->>FE: กรอก Email + Password
    FE->>BE: POST /api/auth/login
    BE->>DB: ตรวจสอบ credentials
    DB-->>BE: พบข้อมูลผู้ใช้
    alt อุปกรณ์ใหม่
        BE->>Mail: ส่ง OTP 6 หลัก (หมดอายุ 5 นาที)
        BE-->>FE: 200 { requiresOtp: true }
        FE->>User: แสดงหน้ากรอก OTP
        User->>FE: กรอก OTP
        FE->>BE: POST /api/auth/verify-otp
        BE->>DB: ตรวจสอบและ mark OTP ว่าใช้แล้ว
        BE-->>FE: 200 { token, user }
    else อุปกรณ์เดิม
        BE-->>FE: 200 { token, user }
    end
    FE->>User: เข้าสู่ระบบสำเร็จ`,
    apiEndpoints: [
      {
        method: 'POST', path: '/api/auth/login',
        headers: { 'Content-Type': 'application/json' },
        requestBody: `{\n  "email": "user@example.com",\n  "password": "••••••••",\n  "deviceFingerprint": "abc123xyz"\n}`,
        response: `{\n  "requiresOtp": false,\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\n  "user": {\n    "id": 1,\n    "email": "user@example.com",\n    "name": "สมชาย ใจดี"\n  }\n}`,
      },
      {
        method: 'POST', path: '/api/auth/send-otp',
        headers: { 'Content-Type': 'application/json' },
        requestBody: `{\n  "email": "user@example.com",\n  "type": "LOGIN"\n}`,
        response: `{\n  "message": "OTP ส่งไปยังอีเมลของคุณแล้ว",\n  "expiresIn": 300\n}`,
      },
      {
        method: 'POST', path: '/api/auth/verify-otp',
        headers: { 'Content-Type': 'application/json' },
        requestBody: `{\n  "email": "user@example.com",\n  "otp": "123456",\n  "type": "LOGIN"\n}`,
        response: `{\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\n  "user": {\n    "id": 1,\n    "email": "user@example.com",\n    "name": "สมชาย ใจดี"\n  }\n}`,
      },
    ],
    pages: [
      {
        name: 'login', path: '/login',
        endpoints: [{ method: 'POST', path: '/api/auth/login' }],
        description: 'หน้าเข้าสู่ระบบหลัก กรอกอีเมลและรหัสผ่าน อุปกรณ์ใหม่จะ redirect ไปหน้ากรอก OTP',
      },
      {
        name: 'verify-otp', path: '/login/verify',
        endpoints: [{ method: 'POST', path: '/api/auth/verify-otp' }, { method: 'POST', path: '/api/auth/send-otp' }],
        description: 'หน้ากรอก OTP สำหรับอุปกรณ์ใหม่ มีปุ่มส่ง OTP ใหม่เมื่อหมดอายุ',
      },
    ],
    databaseTables: [
      {
        name: 'users', description: 'ตารางเก็บข้อมูลผู้ใช้งานทั้งหมดในระบบ',
        columns: [
          { name: 'id', type: 'INT', description: 'รหัสผู้ใช้ (Primary Key)', primaryKey: true },
          { name: 'email', type: 'VARCHAR(255)', description: 'อีเมลสำหรับเข้าสู่ระบบ (unique)' },
          { name: 'password_hash', type: 'VARCHAR(255)', description: 'รหัสผ่านที่ hash ด้วย bcrypt' },
          { name: 'name', type: 'VARCHAR(100)', description: 'ชื่อ-นามสกุลผู้ใช้' },
          { name: 'phone', type: 'VARCHAR(20)', description: 'เบอร์โทรศัพท์' },
          { name: 'created_at', type: 'TIMESTAMP', description: 'วันที่สร้างบัญชี' },
        ],
      },
      {
        name: 'otp_codes', description: 'ตารางเก็บรหัส OTP ชั่วคราว หมดอายุใน 5 นาที',
        columns: [
          { name: 'id', type: 'INT', description: 'รหัส OTP (Primary Key)', primaryKey: true },
          { name: 'user_id', type: 'INT', description: 'FK → users.id' },
          { name: 'code', type: 'VARCHAR(6)', description: 'รหัส OTP 6 หลัก' },
          { name: 'type', type: 'VARCHAR(10)', description: 'ประเภท: LOGIN, REGISTER, RESET' },
          { name: 'expires_at', type: 'TIMESTAMP', description: 'เวลาหมดอายุ (5 นาที)' },
          { name: 'used', type: 'BOOLEAN', description: 'ใช้งานแล้วหรือยัง' },
        ],
      },
    ],
  }

  const TECH_AUTH002 = {
    sequenceDiagram: `sequenceDiagram
    actor User as ผู้ใช้
    participant FE as Frontend
    participant BE as Backend API
    participant Google as Google OAuth 2.0
    participant DB as Database
    User->>FE: กดปุ่ม Sign in with Google
    FE->>Google: เปิด OAuth 2.0 Consent Screen
    User->>Google: อนุญาตสิทธิ์
    Google-->>FE: ID Token
    FE->>BE: POST /api/auth/google { idToken }
    BE->>Google: ตรวจสอบ ID Token
    Google-->>BE: User Profile (email, name, googleId)
    BE->>DB: ค้นหาหรือสร้างบัญชีใหม่
    DB-->>BE: User record
    BE-->>FE: 200 { token, user }
    FE->>User: เข้าสู่ระบบสำเร็จ`,
    apiEndpoints: [
      {
        method: 'POST', path: '/api/auth/google',
        headers: { 'Content-Type': 'application/json' },
        requestBody: `{\n  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ii...",\n  "deviceFingerprint": "abc123xyz"\n}`,
        response: `{\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\n  "user": {\n    "id": 42,\n    "email": "user@gmail.com",\n    "name": "สมหญิง รักเรียน",\n    "avatar": "https://lh3.googleusercontent.com/a/...",\n    "isNew": false\n  }\n}`,
      },
    ],
    pages: [
      {
        name: 'login', path: '/login',
        endpoints: [{ method: 'POST', path: '/api/auth/google' }],
        description: 'กดปุ่ม Sign in with Google เพื่อเปิด Google OAuth consent screen',
      },
    ],
    databaseTables: [
      {
        name: 'users', description: 'ตารางเก็บข้อมูลผู้ใช้งาน รองรับ Social Login',
        columns: [
          { name: 'id', type: 'INT', description: 'รหัสผู้ใช้ (Primary Key)', primaryKey: true },
          { name: 'google_id', type: 'VARCHAR(50)', description: 'Google User ID (nullable)' },
          { name: 'email', type: 'VARCHAR(255)', description: 'อีเมลจาก Google Profile (unique)' },
          { name: 'name', type: 'VARCHAR(100)', description: 'ชื่อจาก Google Profile' },
          { name: 'avatar', type: 'VARCHAR(500)', description: 'URL รูปโปรไฟล์จาก Google' },
          { name: 'created_at', type: 'TIMESTAMP', description: 'วันที่สร้างบัญชี' },
        ],
      },
    ],
  }

  const TECH_AUTH003 = {
    sequenceDiagram: `sequenceDiagram
    actor User as ผู้ใช้
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    participant Mail as Email Service
    User->>FE: กรอกข้อมูล (Email, ชื่อ, เบอร์, วันเกิด)
    FE->>BE: POST /api/auth/register
    BE->>DB: ตรวจสอบอีเมลซ้ำ
    DB-->>BE: อีเมลว่างอยู่
    BE->>DB: บันทึกข้อมูลผู้ใช้ (email_verified=false)
    BE->>Mail: ส่ง OTP ยืนยันอีเมล
    BE-->>FE: 201 { userId, message }
    User->>FE: กรอก OTP จากอีเมล
    FE->>BE: POST /api/auth/verify-email
    BE->>DB: ตรวจสอบ OTP และ update email_verified=true
    BE-->>FE: 200 { token, user }
    FE->>User: ลงทะเบียนสำเร็จ`,
    apiEndpoints: [
      {
        method: 'POST', path: '/api/auth/register',
        headers: { 'Content-Type': 'application/json' },
        requestBody: `{\n  "email": "newuser@example.com",\n  "password": "MyPass123!",\n  "name": "วิชัย มีสุข",\n  "phone": "0812345678",\n  "birthday": "1995-06-15"\n}`,
        response: `{\n  "userId": 99,\n  "message": "ส่ง OTP ยืนยันอีเมลแล้ว กรุณาตรวจสอบกล่องขาเข้า"\n}`,
      },
      {
        method: 'POST', path: '/api/auth/verify-email',
        headers: { 'Content-Type': 'application/json' },
        requestBody: `{\n  "userId": 99,\n  "otp": "847291"\n}`,
        response: `{\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\n  "user": {\n    "id": 99,\n    "email": "newuser@example.com",\n    "name": "วิชัย มีสุข"\n  }\n}`,
      },
    ],
    pages: [
      {
        name: 'register', path: '/register',
        endpoints: [{ method: 'POST', path: '/api/auth/register' }],
        description: 'หน้าลงทะเบียนสมาชิกใหม่ กรอกข้อมูลส่วนตัวและรหัสผ่าน ระบบจะส่ง OTP ยืนยันอีเมล',
      },
      {
        name: 'verify-email', path: '/register/verify',
        endpoints: [{ method: 'POST', path: '/api/auth/verify-email' }],
        description: 'หน้ากรอก OTP ที่ได้รับทางอีเมล เพื่อยืนยันตัวตนและเปิดใช้งานบัญชี',
      },
    ],
    databaseTables: [
      {
        name: 'users', description: 'ตารางเก็บข้อมูลผู้ใช้งาน',
        columns: [
          { name: 'id', type: 'INT', description: 'รหัสผู้ใช้ (Primary Key)', primaryKey: true },
          { name: 'email', type: 'VARCHAR(255)', description: 'อีเมลสำหรับเข้าสู่ระบบ (unique)' },
          { name: 'password_hash', type: 'VARCHAR(255)', description: 'รหัสผ่านที่ hash ด้วย bcrypt' },
          { name: 'name', type: 'VARCHAR(100)', description: 'ชื่อ-นามสกุล' },
          { name: 'phone', type: 'VARCHAR(20)', description: 'เบอร์โทรศัพท์' },
          { name: 'birthday', type: 'DATE', description: 'วันเกิด' },
          { name: 'email_verified', type: 'BOOLEAN', description: 'ยืนยันอีเมลแล้วหรือยัง' },
          { name: 'created_at', type: 'TIMESTAMP', description: 'วันที่สร้างบัญชี' },
        ],
      },
      {
        name: 'otp_codes', description: 'ตารางเก็บรหัส OTP ชั่วคราว',
        columns: [
          { name: 'id', type: 'INT', description: 'รหัส OTP (Primary Key)', primaryKey: true },
          { name: 'user_id', type: 'INT', description: 'FK → users.id' },
          { name: 'code', type: 'VARCHAR(6)', description: 'รหัส OTP 6 หลัก' },
          { name: 'type', type: 'VARCHAR(10)', description: 'ประเภท: LOGIN, REGISTER, RESET' },
          { name: 'expires_at', type: 'TIMESTAMP', description: 'เวลาหมดอายุ (5 นาที)' },
          { name: 'used', type: 'BOOLEAN', description: 'ใช้งานแล้วหรือยัง' },
        ],
      },
    ],
  }

  const TECH_AUTH004 = {
    sequenceDiagram: `sequenceDiagram
    actor User as ผู้ใช้
    participant FE as Frontend
    participant BE as Backend API
    participant SMS as SMS Service
    participant DB as Database
    User->>FE: กรอกเบอร์โทรที่ผูกกับบัญชี
    FE->>BE: POST /api/auth/forgot-password
    BE->>DB: ค้นหาผู้ใช้จากเบอร์โทร
    DB-->>BE: พบผู้ใช้
    BE->>SMS: ส่ง OTP 6 หลัก (หมดอายุ 5 นาที)
    BE-->>FE: 200 { message, expiresIn }
    User->>FE: กรอก OTP จาก SMS
    FE->>BE: POST /api/auth/reset-password
    BE->>DB: ตรวจสอบ OTP
    User->>FE: ตั้งรหัสผ่านใหม่
    FE->>BE: POST /api/auth/set-password
    BE->>DB: อัปเดต password_hash
    BE-->>FE: 200 { token, user }
    FE->>User: เข้าสู่ระบบสำเร็จด้วยรหัสผ่านใหม่`,
    apiEndpoints: [
      { method: 'POST', path: '/api/auth/forgot-password', headers: { 'Content-Type': 'application/json' }, requestBody: `{\n  "phone": "0812345678"\n}`, response: `{\n  "message": "ส่ง OTP ไปยังเบอร์ของคุณแล้ว",\n  "expiresIn": 300\n}` },
      { method: 'POST', path: '/api/auth/reset-password', headers: { 'Content-Type': 'application/json' }, requestBody: `{\n  "phone": "0812345678",\n  "otp": "592841",\n  "newPassword": "NewPass123!"\n}`, response: `{\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\n  "user": { "id": 1, "name": "สมชาย ใจดี" }\n}` },
    ],
    pages: [
      { name: 'forgot-password', path: '/forgot-password', endpoints: [{ method: 'POST', path: '/api/auth/forgot-password' }], description: 'หน้ากรอกเบอร์โทรเพื่อขอ OTP รีเซ็ตรหัสผ่าน' },
      { name: 'reset-password', path: '/reset-password', endpoints: [{ method: 'POST', path: '/api/auth/reset-password' }], description: 'หน้ากรอก OTP และตั้งรหัสผ่านใหม่' },
    ],
    databaseTables: [
      { name: 'users', description: 'ตารางผู้ใช้งาน', columns: [{ name: 'id', type: 'INT', description: 'Primary Key', primaryKey: true }, { name: 'phone', type: 'VARCHAR(20)', description: 'เบอร์โทรที่ผูกกับบัญชี' }, { name: 'password_hash', type: 'VARCHAR(255)', description: 'รหัสผ่านที่ hash ด้วย bcrypt' }] },
      { name: 'otp_codes', description: 'OTP ชั่วคราว', columns: [{ name: 'id', type: 'INT', description: 'Primary Key', primaryKey: true }, { name: 'phone', type: 'VARCHAR(20)', description: 'เบอร์โทรปลายทาง' }, { name: 'code', type: 'VARCHAR(6)', description: 'รหัส OTP 6 หลัก' }, { name: 'expires_at', type: 'TIMESTAMP', description: 'หมดอายุใน 5 นาที' }, { name: 'used', type: 'BOOLEAN', description: 'ใช้แล้วหรือยัง' }] },
    ],
  }

  const TECH_RPT001 = {
    sequenceDiagram: `sequenceDiagram
    actor User as ผู้ใช้
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    User->>FE: เปิดหน้า Dashboard สุขภาพ
    FE->>BE: GET /api/health/daily-report
    BE->>DB: ดึงข้อมูลสุขภาพ 7 วันล่าสุด
    DB-->>BE: pain_level, sleep_hours, steps, spo2
    BE-->>FE: 200 { today, trend7days }
    FE->>User: แสดง Dashboard + กราฟแนวโน้ม`,
    apiEndpoints: [
      { method: 'GET', path: '/api/health/daily-report', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "today": {\n    "painLevel": 3,\n    "sleepHours": 7.5,\n    "steps": 8420,\n    "spo2": 98\n  },\n  "trend7days": [\n    { "date": "2025-05-20", "painLevel": 5, "sleepHours": 6 },\n    { "date": "2025-05-21", "painLevel": 3, "sleepHours": 7.5 }\n  ]\n}` },
      { method: 'POST', path: '/api/health/daily-report', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {token}' }, requestBody: `{\n  "painLevel": 3,\n  "sleepHours": 7.5,\n  "steps": 8420,\n  "spo2": 98,\n  "recordedAt": "2025-05-27T08:00:00Z"\n}`, response: `{\n  "id": "hr_001",\n  "message": "บันทึกข้อมูลสุขภาพสำเร็จ"\n}` },
    ],
    pages: [
      { name: 'dashboard', path: '/dashboard', endpoints: [{ method: 'GET', path: '/api/health/daily-report' }], description: 'หน้า Dashboard แสดงสรุปสุขภาพวันนี้และกราฟแนวโน้ม 7 วัน' },
    ],
    databaseTables: [
      { name: 'health_records', description: 'ข้อมูลสุขภาพรายวันของผู้ใช้', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key (UUID)', primaryKey: true }, { name: 'user_id', type: 'INT', description: 'FK → users.id' }, { name: 'pain_level', type: 'TINYINT', description: 'ระดับความเจ็บปวด 0–10' }, { name: 'sleep_hours', type: 'DECIMAL(4,1)', description: 'ชั่วโมงนอนหลับ' }, { name: 'steps', type: 'INT', description: 'จำนวนก้าวเดิน' }, { name: 'spo2', type: 'TINYINT', description: 'ค่าออกซิเจนในเลือด (%)' }, { name: 'recorded_at', type: 'TIMESTAMP', description: 'เวลาที่บันทึก' }] },
    ],
  }

  const TECH_RPT002 = {
    sequenceDiagram: `sequenceDiagram
    actor User as ผู้ใช้
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    User->>FE: เปิดหน้าประวัติการนัดหมาย
    FE->>BE: GET /api/appointments?status=all
    BE->>DB: ดึงนัดหมายทั้งหมดของผู้ใช้
    DB-->>BE: รายการนัดหมาย + บันทึกแพทย์
    BE-->>FE: 200 { upcoming, past }
    FE->>User: แสดงรายการนัดหมาย
    User->>FE: กดดูรายละเอียดนัดหมาย
    FE->>BE: GET /api/appointments/{id}
    BE->>DB: ดึงบันทึกการวินิจฉัยและคำแนะนำ
    BE-->>FE: 200 { appointment, diagnosis, notes }`,
    apiEndpoints: [
      { method: 'GET', path: '/api/appointments', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "upcoming": [\n    { "id": "apt_001", "doctorName": "นพ.สมศักดิ์", "date": "2025-06-01", "time": "09:00", "status": "confirmed" }\n  ],\n  "past": [\n    { "id": "apt_002", "doctorName": "นพ.สมศักดิ์", "date": "2025-05-10", "diagnosis": "ไมเกรน" }\n  ]\n}` },
      { method: 'GET', path: '/api/appointments/{id}', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "id": "apt_002",\n  "doctorName": "นพ.สมศักดิ์",\n  "date": "2025-05-10",\n  "diagnosis": "ไมเกรนชนิดไม่มี aura",\n  "prescription": ["Sumatriptan 50mg", "Ibuprofen 400mg"],\n  "notes": "ควรหลีกเลี่ยง trigger: แสงจ้า เสียงดัง"\n}` },
    ],
    pages: [
      { name: 'appointments', path: '/appointments', endpoints: [{ method: 'GET', path: '/api/appointments' }], description: 'หน้ารายการนัดหมายทั้งหมด แยก upcoming/past' },
      { name: 'appointment-detail', path: '/appointments/[id]', endpoints: [{ method: 'GET', path: '/api/appointments/{id}' }], description: 'รายละเอียดนัดหมาย บันทึกวินิจฉัย ใบสั่งยา' },
    ],
    databaseTables: [
      { name: 'appointments', description: 'ตารางนัดหมายแพทย์', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'user_id', type: 'INT', description: 'FK → users.id' }, { name: 'doctor_name', type: 'VARCHAR(100)', description: 'ชื่อแพทย์' }, { name: 'scheduled_at', type: 'TIMESTAMP', description: 'วันเวลานัดหมาย' }, { name: 'status', type: 'VARCHAR(20)', description: 'confirmed / cancelled / completed' }, { name: 'diagnosis', type: 'TEXT', description: 'บันทึกการวินิจฉัย' }, { name: 'notes', type: 'TEXT', description: 'คำแนะนำของแพทย์' }] },
    ],
  }

  const TECH_RPT003 = {
    sequenceDiagram: `sequenceDiagram
    actor User as ผู้ใช้
    participant FE as Frontend
    participant BE as Backend API
    participant PDF as PDF Generator
    participant Mail as Email Service
    User->>FE: เลือกเดือนที่ต้องการ Export
    FE->>BE: POST /api/reports/export-pdf
    BE->>BE: รวบรวมข้อมูลสุขภาพรายเดือน
    BE->>PDF: สร้าง PDF พร้อมโลโก้คลินิก
    PDF-->>BE: PDF buffer
    alt ส่งทางอีเมล
        BE->>Mail: แนบ PDF ส่งอีเมลผู้ใช้
        BE-->>FE: 200 { message: "ส่งอีเมลแล้ว" }
    else บันทึกลงอุปกรณ์
        BE-->>FE: 200 { downloadUrl }
        FE->>User: เริ่ม download อัตโนมัติ
    end`,
    apiEndpoints: [
      { method: 'POST', path: '/api/reports/export-pdf', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {token}' }, requestBody: `{\n  "month": "2025-05",\n  "deliveryMethod": "email"\n}`, response: `{\n  "message": "ส่งรายงาน PDF ไปยัง user@example.com แล้ว"\n}` },
      { method: 'GET', path: '/api/reports/download/{token}', headers: {}, response: `PDF file (application/pdf)` },
    ],
    pages: [
      { name: 'reports', path: '/reports', endpoints: [{ method: 'POST', path: '/api/reports/export-pdf' }], description: 'หน้าเลือกช่วงเวลาและวิธีส่ง PDF report สุขภาพรายเดือน' },
    ],
    databaseTables: [
      { name: 'health_records', description: 'ข้อมูลสุขภาพรายวัน (ใช้รวบรวมเป็น monthly report)', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'user_id', type: 'INT', description: 'FK → users.id' }, { name: 'recorded_at', type: 'TIMESTAMP', description: 'วันที่บันทึก' }] },
      { name: 'report_exports', description: 'ประวัติการ Export รายงาน', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'user_id', type: 'INT', description: 'FK → users.id' }, { name: 'month', type: 'VARCHAR(7)', description: 'เดือนที่ export เช่น 2025-05' }, { name: 'file_url', type: 'VARCHAR(500)', description: 'URL ไฟล์ PDF (S3)' }, { name: 'created_at', type: 'TIMESTAMP', description: 'วันที่สร้าง' }] },
    ],
  }

  const TECH_MIG001 = {
    sequenceDiagram: `sequenceDiagram
    actor User as ผู้ใช้
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    participant Push as Push Notification
    User->>FE: กรอกข้อมูลอาการ (level, location, triggers)
    FE->>BE: POST /api/migraine/records
    BE->>DB: บันทึกอาการ
    BE->>BE: ตรวจสอบ level >= 8 หรือบ่อยผิดปกติ
    alt อาการรุนแรง
        BE->>Push: ส่ง notification แนะนำพบแพทย์
    end
    BE-->>FE: 201 { id, message }
    FE->>User: บันทึกสำเร็จ`,
    apiEndpoints: [
      { method: 'POST', path: '/api/migraine/records', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {token}' }, requestBody: `{\n  "painLevel": 7,\n  "location": "ขมับซ้าย",\n  "durationMinutes": 120,\n  "triggers": ["แสงจ้า", "ความเครียด"],\n  "recordedAt": "2025-05-27T14:30:00Z"\n}`, response: `{\n  "id": "mig_001",\n  "message": "บันทึกอาการสำเร็จ"\n}` },
      { method: 'GET', path: '/api/migraine/records', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "records": [\n    { "id": "mig_001", "painLevel": 7, "location": "ขมับซ้าย", "triggers": ["แสงจ้า"], "recordedAt": "2025-05-27T14:30:00Z" }\n  ]\n}` },
    ],
    pages: [
      { name: 'migraine-log', path: '/migraine/log', endpoints: [{ method: 'POST', path: '/api/migraine/records' }], description: 'หน้าบันทึกอาการปวดหัวไมเกรน กรอกระดับ ตำแหน่ง และ trigger' },
    ],
    databaseTables: [
      { name: 'migraine_records', description: 'บันทึกอาการปวดหัวไมเกรน', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'user_id', type: 'INT', description: 'FK → users.id' }, { name: 'pain_level', type: 'TINYINT', description: 'ระดับความเจ็บปวด 0–10' }, { name: 'location', type: 'VARCHAR(100)', description: 'ตำแหน่งที่ปวด' }, { name: 'duration_minutes', type: 'INT', description: 'ระยะเวลาที่ปวด (นาที)' }, { name: 'triggers', type: 'JSON', description: 'รายการ trigger ที่เกี่ยวข้อง' }, { name: 'recorded_at', type: 'TIMESTAMP', description: 'เวลาที่บันทึก' }] },
    ],
  }

  const TECH_MIG002 = {
    sequenceDiagram: `sequenceDiagram
    actor User as ผู้ใช้
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    User->>FE: เลือกช่วง 30/60/90 วัน
    FE->>BE: GET /api/migraine/history?days=30
    BE->>DB: ดึงประวัติและวิเคราะห์ trigger
    DB-->>BE: records + trigger frequency
    BE-->>FE: 200 { timeline, topTriggers, trend }
    FE->>User: แสดงกราฟ timeline และสถิติ trigger`,
    apiEndpoints: [
      { method: 'GET', path: '/api/migraine/history', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "timeline": [\n    { "date": "2025-05-01", "painLevel": 6, "triggers": ["แสงจ้า"] }\n  ],\n  "topTriggers": [\n    { "trigger": "แสงจ้า", "count": 8, "percentage": 62 },\n    { "trigger": "ความเครียด", "count": 5, "percentage": 38 }\n  ],\n  "monthlyAverage": 4.2\n}` },
    ],
    pages: [
      { name: 'migraine-history', path: '/migraine/history', endpoints: [{ method: 'GET', path: '/api/migraine/history' }], description: 'หน้าดูประวัติอาการ กราฟ timeline และวิเคราะห์ trigger ที่พบบ่อย' },
    ],
    databaseTables: [
      { name: 'migraine_records', description: 'ประวัติอาการปวดหัวไมเกรน', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'user_id', type: 'INT', description: 'FK → users.id' }, { name: 'pain_level', type: 'TINYINT', description: 'ระดับความเจ็บปวด' }, { name: 'triggers', type: 'JSON', description: 'รายการ trigger' }, { name: 'recorded_at', type: 'TIMESTAMP', description: 'วันที่บันทึก' }] },
    ],
  }

  const TECH_MIG003 = {
    sequenceDiagram: `sequenceDiagram
    participant CRON as Cron Job (ทุก 1 ชม.)
    participant BE as Backend API
    participant DB as Database
    participant Push as FCM Push
    CRON->>BE: ตรวจสอบอาการรุนแรง
    BE->>DB: ดึงบันทึกอาการล่าสุดของทุก user
    DB-->>BE: records
    BE->>BE: level >= 8 หรือ > 4 ครั้ง/เดือน?
    alt เข้าเกณฑ์
        BE->>Push: ส่ง notification แนะนำพบแพทย์
        BE->>DB: บันทึกว่าส่ง alert แล้ว
    end`,
    apiEndpoints: [
      { method: 'GET', path: '/api/migraine/alerts', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "alerts": [\n    { "type": "HIGH_PAIN", "message": "อาการปวดระดับสูง ควรปรึกษาแพทย์", "sentAt": "2025-05-27T15:00:00Z" }\n  ]\n}` },
    ],
    pages: [
      { name: 'notifications', path: '/notifications', endpoints: [{ method: 'GET', path: '/api/migraine/alerts' }], description: 'หน้าแสดง alert ที่ส่งไปแล้ว พร้อมคำแนะนำ' },
    ],
    databaseTables: [
      { name: 'migraine_alerts', description: 'ประวัติการส่ง alert อาการรุนแรง', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'user_id', type: 'INT', description: 'FK → users.id' }, { name: 'alert_type', type: 'VARCHAR(30)', description: 'HIGH_PAIN / HIGH_FREQUENCY' }, { name: 'sent_at', type: 'TIMESTAMP', description: 'เวลาที่ส่ง alert' }] },
    ],
  }

  const TECH_MED001 = {
    sequenceDiagram: `sequenceDiagram
    actor User as ผู้ใช้
    participant FE as Frontend
    participant BE as Backend API
    participant Barcode as Barcode API
    participant DB as Database
    User->>FE: สแกนบาร์โค้ดยา
    FE->>BE: GET /api/medicines/lookup?barcode=xxx
    BE->>Barcode: ค้นหาข้อมูลยาจาก barcode
    Barcode-->>BE: ชื่อยา ขนาด วิธีใช้
    BE-->>FE: 200 { name, dosage, instructions }
    FE->>User: แสดงข้อมูลยา ให้ยืนยันบันทึก
    User->>FE: ยืนยันบันทึก
    FE->>BE: POST /api/medicines
    BE->>DB: บันทึกรายการยา
    BE-->>FE: 201 { id }`,
    apiEndpoints: [
      { method: 'GET', path: '/api/medicines', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "medicines": [\n    { "id": "med_001", "name": "Sumatriptan", "dosage": "50mg", "frequency": "เมื่อมีอาการ", "expiresAt": "2026-03-01" }\n  ]\n}` },
      { method: 'POST', path: '/api/medicines', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {token}' }, requestBody: `{\n  "name": "Sumatriptan",\n  "dosage": "50mg",\n  "frequency": "เมื่อมีอาการ",\n  "expiresAt": "2026-03-01"\n}`, response: `{\n  "id": "med_001",\n  "message": "เพิ่มยาสำเร็จ"\n}` },
      { method: 'PUT', path: '/api/medicines/{id}', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {token}' }, requestBody: `{\n  "dosage": "100mg",\n  "frequency": "วันละ 2 ครั้ง"\n}`, response: `{\n  "message": "อัปเดตสำเร็จ"\n}` },
      { method: 'DELETE', path: '/api/medicines/{id}', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "message": "ลบยาสำเร็จ"\n}` },
    ],
    pages: [
      { name: 'medicine-list', path: '/medicines', endpoints: [{ method: 'GET', path: '/api/medicines' }, { method: 'DELETE', path: '/api/medicines/{id}' }], description: 'หน้ารายการยาส่วนตัว เพิ่ม แก้ไข และลบได้' },
      { name: 'add-medicine', path: '/medicines/add', endpoints: [{ method: 'POST', path: '/api/medicines' }], description: 'หน้าเพิ่มยาใหม่ รองรับสแกนบาร์โค้ด' },
    ],
    databaseTables: [
      { name: 'user_medicines', description: 'รายการยาส่วนตัวของผู้ใช้', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'user_id', type: 'INT', description: 'FK → users.id' }, { name: 'name', type: 'VARCHAR(200)', description: 'ชื่อยา' }, { name: 'dosage', type: 'VARCHAR(50)', description: 'ขนาดยา เช่น 50mg' }, { name: 'frequency', type: 'VARCHAR(100)', description: 'ความถี่การกิน' }, { name: 'expires_at', type: 'DATE', description: 'วันหมดอายุยา' }] },
    ],
  }

  const TECH_MED002 = {
    sequenceDiagram: `sequenceDiagram
    actor User as ผู้ใช้
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    participant Push as FCM Push
    User->>FE: ตั้งเวลาแจ้งเตือนยา
    FE->>BE: POST /api/medicine-reminders
    BE->>DB: บันทึก schedule
    BE-->>FE: 201 { id }
    Note over Push,BE: ถึงเวลาตามที่ตั้งไว้
    BE->>Push: ส่ง push notification
    Push->>User: แสดง notification "ถึงเวลากิน Sumatriptan"
    User->>FE: กด "กินยาแล้ว" จาก notification
    FE->>BE: POST /api/medicine-reminders/{id}/confirm
    BE->>DB: บันทึก adherence log`,
    apiEndpoints: [
      { method: 'POST', path: '/api/medicine-reminders', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {token}' }, requestBody: `{\n  "medicineId": "med_001",\n  "times": ["08:00", "20:00"],\n  "startDate": "2025-05-27"\n}`, response: `{\n  "id": "rem_001",\n  "message": "ตั้งแจ้งเตือนสำเร็จ"\n}` },
      { method: 'POST', path: '/api/medicine-reminders/{id}/confirm', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "message": "บันทึกการกินยาสำเร็จ"\n}` },
    ],
    pages: [
      { name: 'medicine-reminders', path: '/medicines/reminders', endpoints: [{ method: 'POST', path: '/api/medicine-reminders' }], description: 'หน้าตั้งเวลาแจ้งเตือนกินยา' },
    ],
    databaseTables: [
      { name: 'medicine_reminders', description: 'ตั้งเวลาแจ้งเตือนกินยา', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'user_id', type: 'INT', description: 'FK → users.id' }, { name: 'medicine_id', type: 'VARCHAR(36)', description: 'FK → user_medicines.id' }, { name: 'times', type: 'JSON', description: 'รายการเวลาแจ้งเตือน เช่น ["08:00","20:00"]' }] },
      { name: 'adherence_logs', description: 'ประวัติการกินยา', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'reminder_id', type: 'VARCHAR(36)', description: 'FK → medicine_reminders.id' }, { name: 'taken_at', type: 'TIMESTAMP', description: 'เวลาที่กินยา' }, { name: 'on_time', type: 'BOOLEAN', description: 'กินตรงเวลาหรือไม่' }] },
    ],
  }

  const TECH_MED003 = {
    sequenceDiagram: `sequenceDiagram
    actor User as ผู้ใช้
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    participant Push as FCM Push
    User->>FE: เปิดหน้าประวัติการกินยา
    FE->>BE: GET /api/medicine-adherence?week=current
    BE->>DB: ดึงประวัติและคำนวณ adherence rate
    DB-->>BE: logs + rate
    BE-->>FE: 200 { adherenceRate, logs, lowStockWarnings }
    alt ยาใกล้หมด
        BE->>Push: แจ้งเตือน "ยา X เหลือน้อย"
    end
    FE->>User: แสดงสถิติและแจ้งเตือน`,
    apiEndpoints: [
      { method: 'GET', path: '/api/medicine-adherence', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "adherenceRate": 85,\n  "logs": [\n    { "medicineName": "Sumatriptan", "scheduledAt": "2025-05-27T08:00:00Z", "takenAt": "2025-05-27T08:05:00Z", "onTime": true }\n  ],\n  "lowStockWarnings": [\n    { "medicineName": "Ibuprofen", "remainingDays": 3 }\n  ]\n}` },
    ],
    pages: [
      { name: 'adherence-stats', path: '/medicines/history', endpoints: [{ method: 'GET', path: '/api/medicine-adherence' }], description: 'หน้าสถิติ adherence รายสัปดาห์ และรายการยาใกล้หมด' },
    ],
    databaseTables: [
      { name: 'adherence_logs', description: 'ประวัติการกินยา', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'reminder_id', type: 'VARCHAR(36)', description: 'FK → medicine_reminders.id' }, { name: 'taken_at', type: 'TIMESTAMP', description: 'เวลากินยา' }, { name: 'on_time', type: 'BOOLEAN', description: 'ตรงเวลาหรือไม่' }] },
    ],
  }

  const TECH_DIS001 = {
    sequenceDiagram: `sequenceDiagram
    actor User as ผู้ใช้
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    User->>FE: กรอกโค้ดส่วนลด
    FE->>BE: POST /api/coupons/collect { code }
    BE->>DB: ตรวจสอบโค้ดและเงื่อนไข
    alt โค้ดถูกต้อง
        BE->>DB: เพิ่มโค้ดในกระเป๋าผู้ใช้
        BE-->>FE: 200 { coupon, message }
    else โค้ดผิดหรือหมดอายุ
        BE-->>FE: 400 { error }
    end`,
    apiEndpoints: [
      { method: 'GET', path: '/api/coupons', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "coupons": [\n    { "id": "coup_001", "code": "MIGRA20", "discount": 20, "type": "percent", "expiresAt": "2025-06-30" }\n  ]\n}` },
      { method: 'POST', path: '/api/coupons/collect', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {token}' }, requestBody: `{\n  "code": "MIGRA20"\n}`, response: `{\n  "coupon": { "id": "coup_001", "discount": 20, "expiresAt": "2025-06-30" },\n  "message": "เพิ่มโค้ดสำเร็จ"\n}` },
    ],
    pages: [
      { name: 'coupons', path: '/coupons', endpoints: [{ method: 'GET', path: '/api/coupons' }, { method: 'POST', path: '/api/coupons/collect' }], description: 'หน้ากระเป๋าโค้ดส่วนลด เพิ่มโค้ดใหม่และดูรายการที่มี' },
    ],
    databaseTables: [
      { name: 'coupons', description: 'โค้ดส่วนลดที่ partner ออกให้', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'code', type: 'VARCHAR(50)', description: 'รหัสโค้ด (unique)' }, { name: 'discount', type: 'DECIMAL(10,2)', description: 'มูลค่าส่วนลด' }, { name: 'type', type: 'VARCHAR(10)', description: 'percent / fixed' }, { name: 'expires_at', type: 'TIMESTAMP', description: 'วันหมดอายุ' }] },
      { name: 'user_coupons', description: 'โค้ดที่ผู้ใช้เก็บไว้', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'user_id', type: 'INT', description: 'FK → users.id' }, { name: 'coupon_id', type: 'VARCHAR(36)', description: 'FK → coupons.id' }, { name: 'used', type: 'BOOLEAN', description: 'ใช้แล้วหรือยัง' }, { name: 'collected_at', type: 'TIMESTAMP', description: 'วันที่เก็บ' }] },
    ],
  }

  const TECH_DIS002 = {
    sequenceDiagram: `sequenceDiagram
    actor User as ผู้ใช้
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    User->>FE: เลือกโค้ดใน checkout
    FE->>BE: POST /api/orders/apply-coupon
    BE->>DB: ตรวจสอบโค้ดและเงื่อนไข
    BE->>BE: คำนวณส่วนลด
    BE-->>FE: 200 { originalPrice, discount, finalPrice }
    FE->>User: แสดงราคาหลังหักส่วนลด`,
    apiEndpoints: [
      { method: 'POST', path: '/api/orders/apply-coupon', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {token}' }, requestBody: `{\n  "couponCode": "MIGRA20",\n  "cartTotal": 500\n}`, response: `{\n  "originalPrice": 500,\n  "discount": 100,\n  "finalPrice": 400,\n  "couponId": "coup_001"\n}` },
    ],
    pages: [
      { name: 'checkout', path: '/checkout', endpoints: [{ method: 'POST', path: '/api/orders/apply-coupon' }], description: 'หน้า checkout เลือกและใช้โค้ดส่วนลด ระบบคำนวณยอดสุทธิอัตโนมัติ' },
    ],
    databaseTables: [
      { name: 'orders', description: 'คำสั่งซื้อ', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'user_id', type: 'INT', description: 'FK → users.id' }, { name: 'coupon_id', type: 'VARCHAR(36)', description: 'FK → coupons.id (nullable)' }, { name: 'total', type: 'DECIMAL(10,2)', description: 'ยอดรวมก่อนส่วนลด' }, { name: 'discount', type: 'DECIMAL(10,2)', description: 'มูลค่าส่วนลด' }, { name: 'final_total', type: 'DECIMAL(10,2)', description: 'ยอดสุทธิ' }] },
    ],
  }

  const TECH_DIS003 = {
    sequenceDiagram: `sequenceDiagram
    participant CRON as Cron Job (ทุกวัน 09:00)
    participant BE as Backend API
    participant DB as Database
    participant Push as FCM Push
    CRON->>BE: ตรวจสอบโค้ดใกล้หมดอายุ
    BE->>DB: ดึง user_coupons ที่หมดอายุใน 3 วัน
    DB-->>BE: รายการโค้ด
    BE->>Push: ส่ง notification พร้อมลิงก์สินค้า
    BE->>DB: บันทึกว่าส่ง alert แล้ว`,
    apiEndpoints: [
      { method: 'GET', path: '/api/coupons/expiring', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "expiring": [\n    { "code": "MIGRA20", "expiresAt": "2025-05-30", "daysLeft": 3 }\n  ]\n}` },
    ],
    pages: [
      { name: 'coupons', path: '/coupons', endpoints: [{ method: 'GET', path: '/api/coupons/expiring' }], description: 'แสดง badge เตือนโค้ดใกล้หมดอายุในหน้ากระเป๋าโค้ด' },
    ],
    databaseTables: [
      { name: 'user_coupons', description: 'โค้ดของผู้ใช้', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'user_id', type: 'INT', description: 'FK → users.id' }, { name: 'coupon_id', type: 'VARCHAR(36)', description: 'FK → coupons.id' }, { name: 'alert_sent', type: 'BOOLEAN', description: 'ส่ง notification แล้วหรือยัง' }] },
    ],
  }

  const TECH_MKT001 = {
    sequenceDiagram: `sequenceDiagram
    actor User as ผู้ใช้
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    User->>FE: เปิดหน้า Migra Shop
    FE->>BE: GET /api/products?page=1&limit=20
    BE->>DB: ดึงสินค้าพร้อม rating และ review count
    DB-->>BE: products array
    BE-->>FE: 200 { products, totalPages }
    FE->>User: แสดงสินค้า + infinite scroll
    User->>FE: เลื่อนลงถึงล่าง
    FE->>BE: GET /api/products?page=2&limit=20
    BE-->>FE: หน้าถัดไป`,
    apiEndpoints: [
      { method: 'GET', path: '/api/products', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "products": [\n    {\n      "id": "prod_001",\n      "name": "สเปรย์น้ำมันหอมระเหยบรรเทาปวด",\n      "price": 299,\n      "rating": 4.5,\n      "reviewCount": 128,\n      "imageUrl": "https://cdn.example.com/prod_001.jpg"\n    }\n  ],\n  "totalPages": 5\n}` },
    ],
    pages: [
      { name: 'shop', path: '/shop', endpoints: [{ method: 'GET', path: '/api/products' }], description: 'หน้าแสดงรายการสินค้า Migra Shop รองรับ infinite scroll' },
    ],
    databaseTables: [
      { name: 'products', description: 'รายการสินค้าใน Migra Shop', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'name', type: 'VARCHAR(200)', description: 'ชื่อสินค้า' }, { name: 'price', type: 'DECIMAL(10,2)', description: 'ราคา (บาท)' }, { name: 'stock', type: 'INT', description: 'จำนวนสินค้าคงเหลือ' }, { name: 'image_url', type: 'VARCHAR(500)', description: 'URL รูปภาพสินค้า' }] },
      { name: 'product_reviews', description: 'รีวิวสินค้า', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'product_id', type: 'VARCHAR(36)', description: 'FK → products.id' }, { name: 'user_id', type: 'INT', description: 'FK → users.id' }, { name: 'rating', type: 'TINYINT', description: 'คะแนน 1–5' }, { name: 'comment', type: 'TEXT', description: 'ข้อความรีวิว' }] },
    ],
  }

  const TECH_MKT002 = {
    sequenceDiagram: `sequenceDiagram
    actor User as ผู้ใช้
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    User->>FE: พิมพ์ค้นหา / ตั้ง filter
    FE->>BE: GET /api/products/search?q=&minPrice=&maxPrice=&minRating=
    BE->>DB: Full-text search + filter
    DB-->>BE: ผลลัพธ์ที่ตรงเงื่อนไข
    BE-->>FE: 200 { products, total }
    FE->>User: แสดงผลการค้นหา`,
    apiEndpoints: [
      { method: 'GET', path: '/api/products/search', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "products": [\n    { "id": "prod_001", "name": "...", "price": 299, "rating": 4.5 }\n  ],\n  "total": 12\n}` },
    ],
    pages: [
      { name: 'search', path: '/shop/search', endpoints: [{ method: 'GET', path: '/api/products/search' }], description: 'หน้าค้นหาและกรองสินค้าตามชื่อ ราคา และคะแนน' },
    ],
    databaseTables: [
      { name: 'products', description: 'รายการสินค้า', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'name', type: 'VARCHAR(200)', description: 'ชื่อสินค้า (indexed สำหรับ full-text search)' }, { name: 'price', type: 'DECIMAL(10,2)', description: 'ราคา' }, { name: 'category', type: 'VARCHAR(50)', description: 'หมวดหมู่สินค้า' }] },
    ],
  }

  const TECH_MKT003 = {
    sequenceDiagram: `sequenceDiagram
    actor User as ผู้ใช้
    participant FE as Frontend
    participant BE as Backend API
    participant Payment as Payment Gateway
    participant DB as Database
    participant Push as FCM Push
    User->>FE: เพิ่มสินค้าลงตะกร้า
    FE->>BE: POST /api/cart/items
    User->>FE: กด Checkout
    FE->>BE: POST /api/orders { items, addressId, couponCode }
    BE->>Payment: สร้าง payment intent
    Payment-->>BE: QR / payment URL
    BE-->>FE: 200 { orderId, paymentUrl }
    User->>Payment: ชำระเงิน
    Payment->>BE: Webhook: payment success
    BE->>DB: อัปเดต order status = confirmed
    BE->>Push: แจ้งเตือน "ยืนยัน order แล้ว"`,
    apiEndpoints: [
      { method: 'POST', path: '/api/cart/items', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {token}' }, requestBody: `{\n  "productId": "prod_001",\n  "quantity": 2\n}`, response: `{\n  "cartId": "cart_001",\n  "itemCount": 2,\n  "total": 598\n}` },
      { method: 'POST', path: '/api/orders', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {token}' }, requestBody: `{\n  "cartId": "cart_001",\n  "addressId": "addr_001",\n  "couponCode": "MIGRA20",\n  "paymentMethod": "promptpay"\n}`, response: `{\n  "orderId": "ord_001",\n  "paymentUrl": "https://payment.example.com/qr/xxx",\n  "total": 478\n}` },
    ],
    pages: [
      { name: 'cart', path: '/cart', endpoints: [{ method: 'POST', path: '/api/cart/items' }], description: 'หน้าตะกร้าสินค้า เพิ่ม/ลดจำนวน ลบสินค้า' },
      { name: 'checkout', path: '/checkout', endpoints: [{ method: 'POST', path: '/api/orders' }], description: 'เลือกที่อยู่ โค้ดส่วนลด วิธีชำระ และยืนยัน order' },
    ],
    databaseTables: [
      { name: 'orders', description: 'คำสั่งซื้อ', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'user_id', type: 'INT', description: 'FK → users.id' }, { name: 'status', type: 'VARCHAR(20)', description: 'pending / confirmed / shipped / delivered' }, { name: 'total', type: 'DECIMAL(10,2)', description: 'ยอดรวม' }, { name: 'payment_method', type: 'VARCHAR(20)', description: 'promptpay / credit_card' }] },
      { name: 'order_items', description: 'รายการสินค้าในแต่ละ order', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'order_id', type: 'VARCHAR(36)', description: 'FK → orders.id' }, { name: 'product_id', type: 'VARCHAR(36)', description: 'FK → products.id' }, { name: 'quantity', type: 'INT', description: 'จำนวน' }, { name: 'unit_price', type: 'DECIMAL(10,2)', description: 'ราคาต่อชิ้น ณ เวลาซื้อ' }] },
    ],
  }

  const TECH_MKT004 = {
    sequenceDiagram: `sequenceDiagram
    actor User as ผู้ใช้
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    User->>FE: เปิดหน้าประวัติการสั่งซื้อ
    FE->>BE: GET /api/orders
    BE->>DB: ดึง orders พร้อมรายการสินค้าและสถานะ
    DB-->>BE: orders array
    BE-->>FE: 200 { orders }
    FE->>User: แสดงรายการ order พร้อมสถานะ`,
    apiEndpoints: [
      { method: 'GET', path: '/api/orders', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "orders": [\n    {\n      "id": "ord_001",\n      "status": "delivered",\n      "total": 478,\n      "createdAt": "2025-05-20",\n      "items": [{ "name": "สเปรย์น้ำมันหอมระเหย", "qty": 2 }]\n    }\n  ]\n}` },
    ],
    pages: [
      { name: 'my-purchases', path: '/my-purchases', endpoints: [{ method: 'GET', path: '/api/orders' }], description: 'หน้าประวัติการสั่งซื้อทั้งหมด พร้อมสถานะและยอดรวม' },
    ],
    databaseTables: [
      { name: 'orders', description: 'คำสั่งซื้อ', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'user_id', type: 'INT', description: 'FK → users.id' }, { name: 'status', type: 'VARCHAR(20)', description: 'สถานะ order' }, { name: 'total', type: 'DECIMAL(10,2)', description: 'ยอดรวม' }, { name: 'created_at', type: 'TIMESTAMP', description: 'วันที่สั่ง' }] },
    ],
  }

  const TECH_MKT005 = {
    sequenceDiagram: `sequenceDiagram
    actor User as ผู้ใช้
    participant FE as Frontend
    participant BE as Backend API
    participant Courier as Courier API
    participant DB as Database
    User->>FE: กดดูสถานะการจัดส่ง
    FE->>BE: GET /api/orders/{id}/tracking
    BE->>Courier: ดึงสถานะจาก tracking number
    Courier-->>BE: tracking events
    BE-->>FE: 200 { trackingNumber, events, estimatedDelivery }
    FE->>User: แสดง tracking timeline`,
    apiEndpoints: [
      { method: 'GET', path: '/api/orders/{id}/tracking', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "trackingNumber": "TH123456789",\n  "carrier": "Kerry Express",\n  "estimatedDelivery": "2025-05-30",\n  "events": [\n    { "time": "2025-05-28T10:00:00Z", "status": "รับพัสดุแล้ว", "location": "คลังกรุงเทพ" },\n    { "time": "2025-05-28T18:00:00Z", "status": "กำลังจัดส่ง", "location": "สาขาลาดพร้าว" }\n  ]\n}` },
    ],
    pages: [
      { name: 'order-tracking', path: '/my-purchases/[id]/tracking', endpoints: [{ method: 'GET', path: '/api/orders/{id}/tracking' }], description: 'หน้าติดตามพัสดุ แสดง tracking events และ estimated delivery' },
    ],
    databaseTables: [
      { name: 'orders', description: 'คำสั่งซื้อ', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'tracking_number', type: 'VARCHAR(50)', description: 'หมายเลข tracking' }, { name: 'carrier', type: 'VARCHAR(50)', description: 'ขนส่งที่ใช้' }, { name: 'status', type: 'VARCHAR(20)', description: 'สถานะ order' }] },
    ],
  }

  const TECH_CM_AUTH = {
    sequenceDiagram: `sequenceDiagram
    actor Patient as ผู้ป่วย
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    Patient->>FE: กรอกเลขบัตรประชาชน 13 หลัก + วันเกิด
    FE->>BE: POST /api/patient/login
    BE->>DB: ค้นหาผู้ป่วยจากเลขบัตรและวันเกิด
    alt พบข้อมูล
        DB-->>BE: patient record
        BE-->>FE: 200 { token, patient }
        FE->>Patient: เข้าสู่ระบบสำเร็จ
    else ไม่พบข้อมูล
        BE-->>FE: 401 { error: "ไม่พบข้อมูลผู้ป่วย" }
    end`,
    apiEndpoints: [
      { method: 'POST', path: '/api/patient/login', headers: { 'Content-Type': 'application/json' }, requestBody: `{\n  "nationalId": "1234567890123",\n  "birthday": "1990-06-15"\n}`, response: `{\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\n  "patient": {\n    "id": "pat_001",\n    "name": "นายสมชาย รักสุขภาพ",\n    "hn": "HN-20250001"\n  }\n}` },
    ],
    pages: [
      { name: 'login', path: '/login', endpoints: [{ method: 'POST', path: '/api/patient/login' }], description: 'หน้าเข้าสู่ระบบด้วยเลขบัตรประชาชนและวันเกิด ไม่ต้องจดจำรหัสผ่าน' },
    ],
    databaseTables: [
      { name: 'patients', description: 'ข้อมูลผู้ป่วยที่ลงทะเบียนกับคลินิก', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'national_id', type: 'CHAR(13)', description: 'เลขบัตรประชาชน 13 หลัก (hashed)' }, { name: 'name', type: 'VARCHAR(150)', description: 'ชื่อ-นามสกุล' }, { name: 'birthday', type: 'DATE', description: 'วันเกิด' }, { name: 'hn', type: 'VARCHAR(20)', description: 'Hospital Number' }] },
    ],
  }

  const TECH_CM_APPT1 = {
    sequenceDiagram: `sequenceDiagram
    actor Patient as ผู้ป่วย
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    participant SMS as SMS Service
    Patient->>FE: เลือกแพทย์ + วันเวลา + ประเภทนัด
    FE->>BE: GET /api/doctors/{id}/slots
    BE->>DB: ดึงช่วงเวลาว่าง
    BE-->>FE: 200 { availableSlots }
    Patient->>FE: เลือก slot และยืนยัน
    FE->>BE: POST /api/appointments
    BE->>DB: จอง slot + สร้าง appointment
    BE->>SMS: ส่ง SMS ยืนยันนัด
    BE-->>FE: 201 { appointmentId, confirmationCode }`,
    apiEndpoints: [
      { method: 'GET', path: '/api/doctors/{id}/slots', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "slots": [\n    { "date": "2025-06-01", "time": "09:00", "available": true },\n    { "date": "2025-06-01", "time": "09:30", "available": false }\n  ]\n}` },
      { method: 'POST', path: '/api/appointments', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {token}' }, requestBody: `{\n  "doctorId": "doc_001",\n  "slotDate": "2025-06-01",\n  "slotTime": "09:00",\n  "type": "general"\n}`, response: `{\n  "appointmentId": "apt_001",\n  "confirmationCode": "APT-2506-0001",\n  "message": "จองนัดสำเร็จ SMS ยืนยันส่งแล้ว"\n}` },
    ],
    pages: [
      { name: 'book-appointment', path: '/appointments/book', endpoints: [{ method: 'GET', path: '/api/doctors/{id}/slots' }, { method: 'POST', path: '/api/appointments' }], description: 'เลือกแพทย์ ดูช่วงเวลาว่าง และยืนยันนัดหมาย' },
    ],
    databaseTables: [
      { name: 'appointments', description: 'ตารางนัดหมายผู้ป่วย', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'patient_id', type: 'VARCHAR(36)', description: 'FK → patients.id' }, { name: 'doctor_id', type: 'VARCHAR(36)', description: 'FK → doctors.id' }, { name: 'scheduled_at', type: 'TIMESTAMP', description: 'วันเวลานัด' }, { name: 'type', type: 'VARCHAR(20)', description: 'general / emergency' }, { name: 'status', type: 'VARCHAR(20)', description: 'confirmed / completed / cancelled' }] },
    ],
  }

  const TECH_CM_APPT2 = {
    sequenceDiagram: `sequenceDiagram
    actor Patient as ผู้ป่วย
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    participant SMS as SMS Service
    Patient->>FE: เลือกนัดที่ต้องการเลื่อน/ยกเลิก
    FE->>BE: PUT /api/appointments/{id} { action, newSlot? }
    BE->>BE: ตรวจสอบ >= 2 ชั่วโมงก่อนนัด
    alt ยังทันเวลา
        BE->>DB: อัปเดตสถานะ / เปลี่ยน slot
        BE->>SMS: แจ้ง SMS ยืนยันการเปลี่ยนแปลง
        BE-->>FE: 200 { message }
    else สายเกินไป
        BE-->>FE: 400 { error: "ไม่สามารถเปลี่ยนแปลงได้แล้ว" }
    end`,
    apiEndpoints: [
      { method: 'PUT', path: '/api/appointments/{id}', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {token}' }, requestBody: `{\n  "action": "reschedule",\n  "newDate": "2025-06-03",\n  "newTime": "10:00",\n  "reason": "ติดธุระ"\n}`, response: `{\n  "message": "เลื่อนนัดสำเร็จ SMS ยืนยันส่งแล้ว"\n}` },
      { method: 'DELETE', path: '/api/appointments/{id}', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "message": "ยกเลิกนัดสำเร็จ"\n}` },
    ],
    pages: [
      { name: 'appointment-detail', path: '/appointments/[id]', endpoints: [{ method: 'PUT', path: '/api/appointments/{id}' }, { method: 'DELETE', path: '/api/appointments/{id}' }], description: 'หน้าจัดการนัดหมาย เลื่อนหรือยกเลิกพร้อมระบุเหตุผล' },
    ],
    databaseTables: [
      { name: 'appointments', description: 'ตารางนัดหมาย', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'status', type: 'VARCHAR(20)', description: 'confirmed / rescheduled / cancelled' }, { name: 'cancel_reason', type: 'TEXT', description: 'เหตุผลการยกเลิก' }, { name: 'rescheduled_at', type: 'TIMESTAMP', description: 'วันที่เปลี่ยนนัด' }] },
    ],
  }

  const TECH_CM_REC1 = {
    sequenceDiagram: `sequenceDiagram
    actor Patient as ผู้ป่วย
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    Patient->>FE: เปิดหน้าประวัติการรักษา
    FE->>BE: GET /api/patient/medical-records
    BE->>DB: ดึงประวัติ visits, labs, prescriptions
    DB-->>BE: medical records
    BE-->>FE: 200 { visits, labResults, prescriptions }
    Patient->>FE: กดดูผลแล็บ
    FE->>BE: GET /api/patient/lab-results/{id}
    BE-->>FE: 200 { labData, referenceRange, interpretation }`,
    apiEndpoints: [
      { method: 'GET', path: '/api/patient/medical-records', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "visits": [\n    { "date": "2025-05-10", "doctor": "นพ.สมศักดิ์", "diagnosis": "ไมเกรน", "notes": "สั่งยา Sumatriptan" }\n  ],\n  "labResults": [\n    { "id": "lab_001", "date": "2025-04-20", "type": "CBC", "status": "normal" }\n  ],\n  "prescriptions": [\n    { "medicine": "Sumatriptan 50mg", "quantity": 10, "dispensedAt": "2025-05-10" }\n  ]\n}` },
    ],
    pages: [
      { name: 'medical-records', path: '/medical-records', endpoints: [{ method: 'GET', path: '/api/patient/medical-records' }], description: 'หน้าประวัติการรักษา ผลแล็บ และใบสั่งยาทั้งหมด' },
    ],
    databaseTables: [
      { name: 'medical_visits', description: 'ประวัติการเข้ารับการรักษา', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'patient_id', type: 'VARCHAR(36)', description: 'FK → patients.id' }, { name: 'doctor_id', type: 'VARCHAR(36)', description: 'FK → doctors.id' }, { name: 'diagnosis', type: 'TEXT', description: 'การวินิจฉัยโรค' }, { name: 'notes', type: 'TEXT', description: 'บันทึกของแพทย์' }, { name: 'visited_at', type: 'TIMESTAMP', description: 'วันที่เข้ารับการรักษา' }] },
      { name: 'lab_results', description: 'ผลการตรวจแล็บ', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'patient_id', type: 'VARCHAR(36)', description: 'FK → patients.id' }, { name: 'test_type', type: 'VARCHAR(50)', description: 'ประเภทการตรวจ เช่น CBC, LFT' }, { name: 'result_data', type: 'JSON', description: 'ผลตรวจแบบ structured JSON' }, { name: 'tested_at', type: 'TIMESTAMP', description: 'วันที่ตรวจ' }] },
    ],
  }

  const TECH_CM_REC2 = {
    sequenceDiagram: `sequenceDiagram
    actor Patient as ผู้ป่วย
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    Patient->>FE: กด "แชร์ประวัติกับแพทย์"
    FE->>BE: POST /api/patient/share-record
    BE->>BE: สร้าง token ชั่วคราว + QR code (อายุ 24 ชั่วโมง)
    BE->>DB: บันทึก share_token
    BE-->>FE: 200 { qrCode, expiresAt }
    FE->>Patient: แสดง QR code
    Note over Patient: แพทย์คนอื่นสแกน QR
    FE->>BE: GET /api/patient/shared-record/{token}
    BE->>DB: ตรวจสอบ token ยังใช้ได้
    BE-->>FE: 200 { medicalRecords }`,
    apiEndpoints: [
      { method: 'POST', path: '/api/patient/share-record', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "qrCode": "data:image/png;base64,...",\n  "shareToken": "share_abc123",\n  "expiresAt": "2025-05-28T15:00:00Z"\n}` },
      { method: 'GET', path: '/api/patient/shared-record/{token}', headers: {}, response: `{\n  "patient": { "name": "นายสมชาย", "hn": "HN-20250001" },\n  "visits": [...],\n  "prescriptions": [...]\n}` },
    ],
    pages: [
      { name: 'share-record', path: '/medical-records/share', endpoints: [{ method: 'POST', path: '/api/patient/share-record' }], description: 'หน้าสร้าง QR code ชั่วคราวเพื่อแบ่งปันประวัติการรักษา อายุ 24 ชั่วโมง' },
    ],
    databaseTables: [
      { name: 'record_share_tokens', description: 'Token ชั่วคราวสำหรับแบ่งปันประวัติ', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'patient_id', type: 'VARCHAR(36)', description: 'FK → patients.id' }, { name: 'token', type: 'VARCHAR(100)', description: 'Token เข้าถึงแบบ one-time' }, { name: 'expires_at', type: 'TIMESTAMP', description: 'หมดอายุใน 24 ชั่วโมง' }, { name: 'used', type: 'BOOLEAN', description: 'ใช้แล้วหรือยัง' }] },
    ],
  }

  const TECH_CM_BIL1 = {
    sequenceDiagram: `sequenceDiagram
    actor Patient as ผู้ป่วย
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    Patient->>FE: เปิดหน้าใบเสร็จ
    FE->>BE: GET /api/patient/bills
    BE->>DB: ดึงรายการค่ารักษาทั้งหมด
    DB-->>BE: bills + items
    BE-->>FE: 200 { bills }
    Patient->>FE: กดดูรายละเอียด
    FE->>BE: GET /api/patient/bills/{id}
    BE-->>FE: 200 { items, subtotals, paymentStatus }`,
    apiEndpoints: [
      { method: 'GET', path: '/api/patient/bills', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "bills": [\n    { "id": "bill_001", "date": "2025-05-10", "total": 1850, "status": "paid" }\n  ]\n}` },
      { method: 'GET', path: '/api/patient/bills/{id}', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "id": "bill_001",\n  "items": [\n    { "name": "ค่าตรวจ", "amount": 500 },\n    { "name": "Sumatriptan 50mg x10", "amount": 1200 },\n    { "name": "ค่าหัตถการ", "amount": 150 }\n  ],\n  "total": 1850,\n  "status": "paid"\n}` },
    ],
    pages: [
      { name: 'bills', path: '/bills', endpoints: [{ method: 'GET', path: '/api/patient/bills' }], description: 'หน้ารายการใบเสร็จค่ารักษาทั้งหมด พร้อมสถานะชำระเงิน' },
      { name: 'bill-detail', path: '/bills/[id]', endpoints: [{ method: 'GET', path: '/api/patient/bills/{id}' }], description: 'รายละเอียดใบเสร็จ รายการค่าบริการ ค่ายา ค่าหัตถการ' },
    ],
    databaseTables: [
      { name: 'bills', description: 'ใบเสร็จค่ารักษา', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'patient_id', type: 'VARCHAR(36)', description: 'FK → patients.id' }, { name: 'visit_id', type: 'VARCHAR(36)', description: 'FK → medical_visits.id' }, { name: 'total', type: 'DECIMAL(10,2)', description: 'ยอดรวมทั้งหมด' }, { name: 'status', type: 'VARCHAR(20)', description: 'pending / paid' }] },
      { name: 'bill_items', description: 'รายการในใบเสร็จ', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'bill_id', type: 'VARCHAR(36)', description: 'FK → bills.id' }, { name: 'name', type: 'VARCHAR(200)', description: 'รายการ เช่น ค่าตรวจ ค่ายา' }, { name: 'amount', type: 'DECIMAL(10,2)', description: 'ราคา' }] },
    ],
  }

  const TECH_CM_BIL2 = {
    sequenceDiagram: `sequenceDiagram
    actor Patient as ผู้ป่วย
    participant FE as Frontend
    participant BE as Backend API
    participant Payment as Thai QR Payment
    participant DB as Database
    Patient->>FE: เลือกใบเสร็จที่ค้างชำระ
    FE->>BE: POST /api/patient/bills/{id}/pay
    BE->>Payment: สร้าง QR code ตาม Thai QR Standard
    Payment-->>BE: QR code + reference
    BE-->>FE: 200 { qrCode, reference, amount }
    FE->>Patient: แสดง QR code
    Patient->>Payment: สแกนและชำระเงิน
    Payment->>BE: Webhook: payment confirmed
    BE->>DB: อัปเดต bill status = paid
    BE-->>FE: SSE push: ชำระเงินสำเร็จ`,
    apiEndpoints: [
      { method: 'POST', path: '/api/patient/bills/{id}/pay', headers: { 'Authorization': 'Bearer {token}' }, requestBody: `{\n  "method": "promptpay"\n}`, response: `{\n  "qrCode": "data:image/png;base64,...",\n  "reference": "REF-20250527-001",\n  "amount": 1850\n}` },
    ],
    pages: [
      { name: 'bill-payment', path: '/bills/[id]/pay', endpoints: [{ method: 'POST', path: '/api/patient/bills/{id}/pay' }], description: 'หน้าชำระเงิน แสดง QR promptpay รอยืนยันจาก webhook' },
    ],
    databaseTables: [
      { name: 'payments', description: 'ประวัติการชำระเงิน', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'bill_id', type: 'VARCHAR(36)', description: 'FK → bills.id' }, { name: 'method', type: 'VARCHAR(20)', description: 'promptpay / credit_card' }, { name: 'reference', type: 'VARCHAR(50)', description: 'รหัสอ้างอิงการชำระ' }, { name: 'paid_at', type: 'TIMESTAMP', description: 'เวลาที่ชำระสำเร็จ' }] },
    ],
  }

  const TECH_CM_TELE1 = {
    sequenceDiagram: `sequenceDiagram
    actor Patient as ผู้ป่วย
    actor Doctor as แพทย์
    participant FE_P as Patient App
    participant FE_D as Doctor Dashboard
    participant BE as Backend API
    participant WS as WebRTC Signaling
    Patient->>FE_P: กดเริ่ม Video Call
    FE_P->>BE: POST /api/telemedicine/sessions
    BE-->>FE_P: 200 { sessionId, token }
    BE-->>FE_D: Push: มีผู้ป่วยรอสาย
    Doctor->>FE_D: รับสาย
    FE_P->>WS: offer SDP
    FE_D->>WS: answer SDP
    WS-->>FE_P: ICE candidates
    WS-->>FE_D: ICE candidates
    Note over FE_P,FE_D: WebRTC P2P connection
    FE_P->>FE_D: Video + Audio stream`,
    apiEndpoints: [
      { method: 'POST', path: '/api/telemedicine/sessions', headers: { 'Authorization': 'Bearer {token}' }, requestBody: `{\n  "doctorId": "doc_001",\n  "appointmentId": "apt_001"\n}`, response: `{\n  "sessionId": "sess_001",\n  "token": "room_token_xyz",\n  "stunServers": ["stun:stun.example.com:3478"]\n}` },
      { method: 'GET', path: '/api/telemedicine/sessions/{id}', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "sessionId": "sess_001",\n  "status": "active",\n  "startedAt": "2025-05-27T14:00:00Z"\n}` },
    ],
    pages: [
      { name: 'video-call', path: '/telemedicine/[sessionId]', endpoints: [{ method: 'POST', path: '/api/telemedicine/sessions' }], description: 'หน้า video call ใช้ WebRTC สำหรับผู้ป่วยปรึกษาแพทย์ทางไกล' },
    ],
    databaseTables: [
      { name: 'telemedicine_sessions', description: 'Session video call', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'patient_id', type: 'VARCHAR(36)', description: 'FK → patients.id' }, { name: 'doctor_id', type: 'VARCHAR(36)', description: 'FK → doctors.id' }, { name: 'appointment_id', type: 'VARCHAR(36)', description: 'FK → appointments.id' }, { name: 'status', type: 'VARCHAR(20)', description: 'waiting / active / ended' }, { name: 'started_at', type: 'TIMESTAMP', description: 'เวลาเริ่ม call' }, { name: 'ended_at', type: 'TIMESTAMP', description: 'เวลาสิ้นสุด call' }] },
    ],
  }

  const TECH_CM_TELE2 = {
    sequenceDiagram: `sequenceDiagram
    actor Patient as ผู้ป่วย
    actor Doctor as แพทย์/พยาบาล
    participant FE as Frontend
    participant BE as Backend API
    participant WS as WebSocket
    participant DB as Database
    Patient->>FE: ส่งข้อความ / รูป
    FE->>WS: emit message { text, attachments }
    WS->>BE: save + broadcast
    BE->>DB: บันทึก message
    WS-->>Doctor: รับข้อความแบบ real-time
    Doctor->>FE: ส่งใบสั่งยาผ่านแชท
    FE->>BE: POST /api/chat/{id}/prescription
    BE->>DB: บันทึกใบสั่งยาในประวัติ`,
    apiEndpoints: [
      { method: 'GET', path: '/api/chat/{sessionId}/messages', headers: { 'Authorization': 'Bearer {token}' }, response: `{\n  "messages": [\n    { "id": "msg_001", "from": "patient", "text": "มีอาการปวดหัวมาก", "sentAt": "2025-05-27T14:05:00Z" },\n    { "id": "msg_002", "from": "doctor", "type": "prescription", "medicines": ["Sumatriptan 50mg x5"] }\n  ]\n}` },
      { method: 'POST', path: '/api/chat/{sessionId}/prescription', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {token}' }, requestBody: `{\n  "medicines": [\n    { "name": "Sumatriptan", "dosage": "50mg", "quantity": 5, "instructions": "กินเมื่อมีอาการ" }\n  ]\n}`, response: `{\n  "prescriptionId": "rx_001",\n  "message": "ส่งใบสั่งยาสำเร็จ"\n}` },
    ],
    pages: [
      { name: 'chat', path: '/telemedicine/chat/[sessionId]', endpoints: [{ method: 'GET', path: '/api/chat/{sessionId}/messages' }], description: 'หน้าแชทกับแพทย์/พยาบาล รับใบสั่งยาผ่านแชท real-time' },
    ],
    databaseTables: [
      { name: 'chat_messages', description: 'ข้อความในระบบ telemedicine', columns: [{ name: 'id', type: 'VARCHAR(36)', description: 'Primary Key', primaryKey: true }, { name: 'session_id', type: 'VARCHAR(36)', description: 'FK → telemedicine_sessions.id' }, { name: 'sender_role', type: 'VARCHAR(10)', description: 'patient / doctor / nurse' }, { name: 'message_type', type: 'VARCHAR(20)', description: 'text / image / file / prescription' }, { name: 'content', type: 'TEXT', description: 'เนื้อหาข้อความ' }, { name: 'sent_at', type: 'TIMESTAMP', description: 'เวลาที่ส่ง' }] },
    ],
  }

  // AUTH
  const AUTH001_v1: Feature = { id: 'AUTH001', title: 'เข้าสู่ระบบด้วย Email และ Password', description: 'ผู้ใช้ล็อกอินด้วยอีเมลและรหัสผ่าน ตรวจสอบ credential ผ่าน Firebase Auth ออก JWT token อายุ 24 ชั่วโมง', category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'การเข้าสู่ระบบด้วย Email และ Password' }
  const AUTH001_v2: Feature = { id: 'AUTH001', title: 'เข้าสู่ระบบด้วย Email และ Password + OTP', description: 'ผู้ใช้ล็อกอินด้วยอีเมลและรหัสผ่าน เพิ่มขั้นตอน OTP 6 หลักทาง Email สำหรับอุปกรณ์ใหม่ หมดอายุใน 5 นาที', category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'การเข้าสู่ระบบด้วย Email และ Password', flowDiagram: DIAGRAM_AUTH, technicalSpec: TECH_AUTH001 }
  const AUTH002: Feature = { id: 'AUTH002', title: 'เข้าสู่ระบบด้วย Google Account', description: 'รองรับ Sign in with Google OAuth 2.0 เชื่อมกับ Firebase Auth ใช้งานได้ทั้ง iOS และ Android', category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'การเข้าสู่ระบบด้วย Google Account', technicalSpec: TECH_AUTH002 }
  const AUTH003: Feature = { id: 'AUTH003', title: 'ลงทะเบียนสมาชิกใหม่', description: 'สร้างบัญชีด้วยอีเมล ชื่อ-นามสกุล เบอร์โทร และวันเกิด ยืนยัน OTP ทางอีเมลก่อนเข้าใช้งาน', category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'ลงทะเบียนสมาชิก', technicalSpec: TECH_AUTH003 }
  const AUTH004: Feature = { id: 'AUTH004', title: 'รีเซ็ตรหัสผ่านผ่าน OTP SMS', description: 'ส่ง OTP 6 หลักทาง SMS ใช้เบอร์โทรที่ผูกกับบัญชี หมดอายุใน 5 นาที กรอก OTP แล้วตั้งรหัสผ่านใหม่ได้ทันที', category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'รีเซ็ตรหัสผ่าน', technicalSpec: TECH_AUTH004 }

  // Report
  const RPT001: Feature = { id: 'RPT001', title: 'รายงานสุขภาพประจำวัน', description: 'สรุปข้อมูลสุขภาพรายวัน ได้แก่ ระดับความเจ็บปวด จำนวนชั่วโมงนอนหลับ ขั้นตอนการเดิน และค่า SpO2 พร้อมกราฟแนวโน้ม 7 วัน', category: 'Report', subcategory: '', flowDiagram: DIAGRAM_REPORT, technicalSpec: TECH_RPT001 }
  const RPT002: Feature = { id: 'RPT002', title: 'ประวัติการนัดหมายแพทย์', description: 'แสดงรายการนัดหมายที่ผ่านมาและที่กำลังจะมาถึง พร้อมบันทึกการวินิจฉัยและคำแนะนำของแพทย์', category: 'Report', subcategory: '', technicalSpec: TECH_RPT002 }
  const RPT003: Feature = { id: 'RPT003', title: 'Export รายงานเป็น PDF', description: 'สร้างรายงานสุขภาพสรุปรายเดือนเป็น PDF พร้อมโลโก้คลินิก ส่งออกทางอีเมลหรือบันทึกลงอุปกรณ์', category: 'Report', subcategory: '', technicalSpec: TECH_RPT003 }

  // Migraine Tracking
  const MIG001: Feature = { id: 'MIG001', title: 'บันทึกอาการปวดหัวไมเกรน', description: 'กรอกระดับความเจ็บปวด (0–10) ตำแหน่ง ระยะเวลา และ trigger เช่น แสง เสียง อาหาร ความเครียด บันทึกเวลาได้แบบ real-time หรือย้อนหลัง', category: 'Migraine Tracking', subcategory: '', flowDiagram: DIAGRAM_MIGRAINE, technicalSpec: TECH_MIG001 }
  const MIG002: Feature = { id: 'MIG002', title: 'ดูประวัติอาการและ Trigger', description: 'กราฟ timeline แสดงประวัติอาการ 30/60/90 วัน วิเคราะห์ trigger ที่พบบ่อย และแนวโน้มของอาการ', category: 'Migraine Tracking', subcategory: '', technicalSpec: TECH_MIG002 }
  const MIG003: Feature = { id: 'MIG003', title: 'แจ้งเตือนอาการรุนแรง', description: 'ตรวจจับเมื่อระดับความเจ็บปวด ≥ 8 หรืออาการเกิดบ่อยกว่า 4 ครั้งต่อเดือน ส่ง push notification แนะนำให้พบแพทย์', category: 'Migraine Tracking', subcategory: '', technicalSpec: TECH_MIG003 }

  // Medicine Pouch
  const MED001: Feature = { id: 'MED001', title: 'จัดการรายการยาส่วนตัว', description: 'เพิ่ม แก้ไข ลบรายการยา ระบุชื่อยา ขนาด ความถี่ และวันหมดอายุ รองรับสแกนบาร์โค้ดเพื่อค้นหาข้อมูลยาอัตโนมัติ', category: 'Medicine Pouch', subcategory: '', flowDiagram: DIAGRAM_MEDICINE, technicalSpec: TECH_MED001 }
  const MED002: Feature = { id: 'MED002', title: 'แจ้งเตือนเวลากินยา', description: 'ตั้งเวลาแจ้งเตือน push notification + in-app สำหรับแต่ละมื้อยา กดยืนยันการกินยาได้จากการแจ้งเตือนโดยตรง', category: 'Medicine Pouch', subcategory: '', technicalSpec: TECH_MED002 }
  const MED003: Feature = { id: 'MED003', title: 'บันทึกประวัติการกินยา', description: 'บันทึกว่ากินยาตรงเวลาหรือไม่ แสดงสถิติ adherence rate รายสัปดาห์ แจ้งเตือนเมื่อยาใกล้หมด', category: 'Medicine Pouch', subcategory: '', technicalSpec: TECH_MED003 }

  // Discount code collection
  const DIS001: Feature = { id: 'DIS001', title: 'รวบรวมและจัดการโค้ดส่วนลด', description: 'เพิ่มโค้ดส่วนลดจาก partner clinic หรือพันธมิตร แสดงมูลค่า วันหมดอายุ และเงื่อนไขการใช้งาน', category: 'Discount code collection', subcategory: '', flowDiagram: DIAGRAM_DISCOUNT, technicalSpec: TECH_DIS001 }
  const DIS002: Feature = { id: 'DIS002', title: 'ใช้โค้ดส่วนลดในการซื้อสินค้า', description: 'กรอกหรือเลือกโค้ดระหว่าง checkout ระบบตรวจสอบความถูกต้องและหักส่วนลดอัตโนมัติ', category: 'Discount code collection', subcategory: '', technicalSpec: TECH_DIS002 }
  const DIS003: Feature = { id: 'DIS003', title: 'แจ้งเตือนโค้ดใกล้หมดอายุ', description: 'ส่ง push notification เมื่อโค้ดจะหมดอายุภายใน 3 วัน พร้อมลิงก์ไปยังสินค้าที่ใช้โค้ดได้', category: 'Discount code collection', subcategory: '', technicalSpec: TECH_DIS003 }

  // Marketplace — Migra Shop
  const MKT001: Feature = { id: 'MKT001', title: 'หน้าแสดงรายการสินค้า', description: 'แสดงสินค้าผลิตภัณฑ์ดูแลไมเกรนพร้อมรูปภาพ ราคา และรีวิวจากผู้ใช้จริง รองรับการเลื่อนดูแบบ infinite scroll', category: 'Marketplace', subcategory: 'Migra Shop', flowDiagram: DIAGRAM_MARKETPLACE, technicalSpec: TECH_MKT001 }
  const MKT002: Feature = { id: 'MKT002', title: 'ค้นหาและกรองสินค้า', description: 'ค้นหาสินค้าด้วยชื่อหรือหมวดหมู่ กรองตามราคา คะแนน และสินค้าที่ใช้โค้ดส่วนลดได้', category: 'Marketplace', subcategory: 'Migra Shop', technicalSpec: TECH_MKT002 }
  const MKT003: Feature = { id: 'MKT003', title: 'ตะกร้าสินค้าและ Checkout', description: 'เพิ่มสินค้าลงตะกร้า ระบุจำนวน เลือกที่อยู่จัดส่ง ชำระผ่าน credit card หรือ promptpay ยืนยัน order ทาง push notification', category: 'Marketplace', subcategory: 'Migra Shop', technicalSpec: TECH_MKT003 }

  // Marketplace — My Purchase
  const MKT004: Feature = { id: 'MKT004', title: 'ดูประวัติการสั่งซื้อ', description: 'แสดงรายการ order ทั้งหมด พร้อมสถานะ (รอยืนยัน / จัดส่งแล้ว / ได้รับแล้ว) วันที่ และยอดรวม', category: 'Marketplace', subcategory: 'My Purchase', technicalSpec: TECH_MKT004 }
  const MKT005: Feature = { id: 'MKT005', title: 'ติดตามสถานะการจัดส่ง', description: 'แสดง tracking number พร้อมลิงก์ไปยังหน้าติดตามของ partner courier อัปเดตสถานะแบบ real-time', category: 'Marketplace', subcategory: 'My Purchase', technicalSpec: TECH_MKT005 }

  // ── Feature sets per version ──────────────────────────────────────────────

  const featuresV1: Feature[] = [AUTH001_v1, AUTH002, AUTH003, AUTH004, RPT001, RPT002]

  const featuresV2: Feature[] = [AUTH001_v1, AUTH002, AUTH003, AUTH004, RPT001, RPT002, RPT003, MIG001, MIG002, MIG003]

  const featuresV3: Feature[] = [
    AUTH001_v2, AUTH002, AUTH003, AUTH004,
    RPT001, RPT002, RPT003,
    MIG001, MIG002, MIG003,
    MED001, MED002, MED003,
    DIS001, DIS002, DIS003,
    MKT001, MKT002, MKT003, MKT004, MKT005,
  ]

  // ── Job 1: Initial release (30 วันที่แล้ว) ───────────────────────────────
  const dmJob1 = await db.analysisJob.create({
    data: {
      projectId: doctorMobile.id,
      commitSha: 'a1b2c3d4e5f6a1b2c3d4e5f6',
      commitMsg: 'feat: initial release — email auth, google login, appointment history',
      author: 'thanakit.p',
      status: 'DONE',
      triggeredAt: daysAgo(30),
    },
  })

  await db.projectUpdateDoc.create({
    data: {
      jobId: dmJob1.id,
      projectId: doctorMobile.id,
      featuresNew: featuresV1,
      diff: { added: featuresV1, removed: [], modified: [] } as DiffResult,
      validation: { passed: true, missing: [], extra: [], mismatched: [] } as ValidationResult,
      status: 'APPROVED',
      reviewedAt: daysAgo(29),
    },
  })

  await db.knowledgeDoc.create({
    data: {
      projectId: doctorMobile.id,
      version: 1,
      features: featuresV1,
      approvedBy: 'thanakit.p',
      sourceJobId: dmJob1.id,
      createdAt: daysAgo(29),
    },
  })

  // ── Job 2: Migraine + PDF (14 วันที่แล้ว) ────────────────────────────────
  const dmJob2 = await db.analysisJob.create({
    data: {
      projectId: doctorMobile.id,
      commitSha: 'b2c3d4e5f6a7b2c3d4e5f6a7',
      commitMsg: 'feat: add migraine tracking module and PDF health report export',
      author: 'thanakit.p',
      status: 'DONE',
      triggeredAt: daysAgo(14),
    },
  })

  await db.projectUpdateDoc.create({
    data: {
      jobId: dmJob2.id,
      projectId: doctorMobile.id,
      featuresNew: featuresV2,
      diff: { added: [RPT003, MIG001, MIG002, MIG003], removed: [], modified: [] } as DiffResult,
      validation: { passed: true, missing: [], extra: [], mismatched: [] } as ValidationResult,
      status: 'APPROVED',
      reviewedAt: daysAgo(13),
    },
  })

  await db.knowledgeDoc.create({
    data: {
      projectId: doctorMobile.id,
      version: 2,
      features: featuresV2,
      approvedBy: 'thanakit.p',
      sourceJobId: dmJob2.id,
      createdAt: daysAgo(13),
    },
  })

  // ── Job 3: Sprint 3 — Medicine, Discount, Marketplace (2 วันที่แล้ว) ─────
  const sprintDiff: DiffResult = {
    added: [MED001, MED002, MED003, DIS001, DIS002, DIS003, MKT001, MKT002, MKT003, MKT004, MKT005],
    removed: [],
    modified: [{ old: AUTH001_v1, new: AUTH001_v2 }],
  }

  const dmJob3 = await db.analysisJob.create({
    data: {
      projectId: doctorMobile.id,
      commitSha: 'c3d4e5f6a7b8c3d4e5f6a7b8',
      commitMsg: 'feat: sprint 3 — medicine pouch, discount codes, marketplace (migra shop + my purchase)',
      author: 'thanakit.p',
      status: 'DONE',
      triggeredAt: daysAgo(2),
    },
  })

  await db.projectUpdateDoc.create({
    data: {
      jobId: dmJob3.id,
      projectId: doctorMobile.id,
      featuresNew: featuresV3,
      diff: sprintDiff,
      validation: {
        passed: false,
        missing: [],
        extra: [DIS002, DIS003, MKT005],
        mismatched: [],
      } as ValidationResult,
      status: 'PENDING',
    },
  })

  await db.knowledgeDoc.create({
    data: {
      projectId: doctorMobile.id,
      version: 3,
      features: featuresV3,
      approvedBy: 'thanakit.p',
      sourceJobId: dmJob3.id,
      createdAt: daysAgo(2),
    },
  })

  await db.sprintRequirement.create({
    data: {
      jobId: dmJob3.id,
      projectId: doctorMobile.id,
      fileName: 'sprint3-requirements.pdf',
      createdBy: 'thanakit.p',
      items: [
        { featureId: 'AUTH001', changeType: 'modify' },
        { featureId: 'MED001', changeType: 'add' },
        { featureId: 'MED002', changeType: 'add' },
        { featureId: 'MED003', changeType: 'add' },
        { featureId: 'MKT001', changeType: 'add' },
        { featureId: 'MKT002', changeType: 'add' },
        { featureId: 'MKT003', changeType: 'add' },
        { featureId: 'MKT004', changeType: 'add' },
        { featureId: 'DIS001', changeType: 'add' },
      ],
    },
  })

  // Job RUNNING (กำลังวิเคราะห์)
  await db.analysisJob.create({
    data: {
      projectId: doctorMobile.id,
      commitSha: 'd4e5f6a7b8c9d4e5f6a7b8c9',
      commitMsg: 'fix: resolve OTP expiry edge case and improve checkout flow UX',
      author: 'thanakit.p',
      status: 'RUNNING',
      triggeredAt: new Date(now - 1000 * 60 * 18),
    },
  })

  // ──────────────────────────────────────────
  // PROJECT 2: ClinicMate
  // ──────────────────────────────────────────
  const clinicMate = await db.project.create({
    data: {
      name: 'ClinicMate',
      repoUrl: 'https://github.com/clinicmate-th/clinicmate-app',
      platform: 'GITHUB',
      webhookSecret: 'whsec-cm-001',
      createdAt: daysAgo(60),
    },
  })

  const CM_AUTH: Feature = { id: 'CM_AUTH001', title: 'เข้าสู่ระบบด้วยเลขบัตรประชาชน', description: 'ผู้ป่วยเข้าระบบด้วยเลขบัตรประชาชน 13 หลักและวันเกิด ไม่ต้องจดจำรหัสผ่าน', category: 'การเข้าสู่ระบบ', subcategory: '', flowDiagram: DIAGRAM_CM_AUTH, technicalSpec: TECH_CM_AUTH }
  const CM_APPT1: Feature = { id: 'CM_APPT001', title: 'จองคิวนัดแพทย์', description: 'เลือกแพทย์ วันเวลา และประเภทการนัด (ตรวจทั่วไป/ฉุกเฉิน) ยืนยันนัดผ่าน SMS', category: 'การนัดหมาย', subcategory: '', flowDiagram: DIAGRAM_CM_APPT, technicalSpec: TECH_CM_APPT1 }
  const CM_APPT2: Feature = { id: 'CM_APPT002', title: 'เลื่อนและยกเลิกนัด', description: 'เลื่อนนัดหมายล่วงหน้าอย่างน้อย 2 ชั่วโมง หรือยกเลิกพร้อมแจ้งเหตุผล', category: 'การนัดหมาย', subcategory: '', technicalSpec: TECH_CM_APPT2 }
  const CM_REC1: Feature = { id: 'CM_REC001', title: 'ดูประวัติการรักษา', description: 'ผู้ป่วยดูประวัติการรักษา ผลแล็บ และใบสั่งยาจากการเยี่ยมครั้งก่อน', category: 'เวชระเบียน', subcategory: '', flowDiagram: DIAGRAM_CM_RECORD, technicalSpec: TECH_CM_REC1 }
  const CM_REC2: Feature = { id: 'CM_REC002', title: 'แบ่งปันข้อมูลสุขภาพ', description: 'สร้าง QR code ชั่วคราวเพื่อแบ่งปันประวัติการรักษากับแพทย์คนอื่น อายุ 24 ชั่วโมง', category: 'เวชระเบียน', subcategory: '', technicalSpec: TECH_CM_REC2 }
  const CM_BIL1: Feature = { id: 'CM_BIL001', title: 'ดูใบเสร็จค่ารักษา', description: 'แสดงใบเสร็จรายการค่าบริการ ค่ายา และค่าหัตถการ พร้อมสถานะชำระเงิน', category: 'การเงิน', subcategory: '', flowDiagram: DIAGRAM_CM_BILLING, technicalSpec: TECH_CM_BIL1 }
  const CM_BIL2: Feature = { id: 'CM_BIL002', title: 'ชำระค่ารักษาออนไลน์', description: 'ชำระเงินผ่าน QR promptpay หรือ credit card รองรับ Thai QR Payment Standard', category: 'การเงิน', subcategory: '', technicalSpec: TECH_CM_BIL2 }
  const CM_TELE1: Feature = { id: 'CM_TELE001', title: 'ปรึกษาแพทย์ผ่านวิดีโอคอล', description: 'เริ่ม video call กับแพทย์ผ่าน WebRTC รองรับ iOS และ Android ไม่ต้องติดตั้งแอปเพิ่ม', category: 'Telemedicine', subcategory: '', flowDiagram: DIAGRAM_CM_TELE, technicalSpec: TECH_CM_TELE1 }
  const CM_TELE2: Feature = { id: 'CM_TELE002', title: 'แชทกับแพทย์และพยาบาล', description: 'ส่งข้อความ รูปภาพ และไฟล์เอกสารกับทีมแพทย์ รับใบสั่งยาผ่านแชท', category: 'Telemedicine', subcategory: '', technicalSpec: TECH_CM_TELE2 }

  const cmFeaturesV1: Feature[] = [CM_AUTH, CM_APPT1, CM_APPT2, CM_REC1, CM_REC2, CM_BIL1, CM_BIL2]
  const cmFeaturesV2: Feature[] = [...cmFeaturesV1, CM_TELE1, CM_TELE2]

  const cmJob1 = await db.analysisJob.create({
    data: {
      projectId: clinicMate.id,
      commitSha: 'e1f2a3b4c5d6e1f2a3b4c5d6',
      commitMsg: 'feat: initial release — patient login, appointment booking, medical records, billing',
      author: 'nattapong.w',
      status: 'DONE',
      triggeredAt: daysAgo(45),
    },
  })

  await db.projectUpdateDoc.create({
    data: {
      jobId: cmJob1.id,
      projectId: clinicMate.id,
      featuresNew: cmFeaturesV1,
      diff: { added: cmFeaturesV1, removed: [], modified: [] } as DiffResult,
      validation: { passed: true, missing: [], extra: [], mismatched: [] } as ValidationResult,
      status: 'APPROVED',
      reviewedAt: daysAgo(44),
    },
  })

  await db.knowledgeDoc.create({
    data: {
      projectId: clinicMate.id,
      version: 1,
      features: cmFeaturesV1,
      approvedBy: 'nattapong.w',
      sourceJobId: cmJob1.id,
      createdAt: daysAgo(44),
    },
  })

  const cmJob2 = await db.analysisJob.create({
    data: {
      projectId: clinicMate.id,
      commitSha: 'f2a3b4c5d6e7f2a3b4c5d6e7',
      commitMsg: 'feat: add telemedicine — video consultation and doctor chat',
      author: 'nattapong.w',
      status: 'DONE',
      triggeredAt: daysAgo(7),
    },
  })

  await db.projectUpdateDoc.create({
    data: {
      jobId: cmJob2.id,
      projectId: clinicMate.id,
      featuresNew: cmFeaturesV2,
      diff: { added: [CM_TELE1, CM_TELE2], removed: [], modified: [] } as DiffResult,
      validation: { passed: true, missing: [], extra: [], mismatched: [] } as ValidationResult,
      status: 'APPROVED',
      reviewedAt: daysAgo(6),
    },
  })

  await db.knowledgeDoc.create({
    data: {
      projectId: clinicMate.id,
      version: 2,
      features: cmFeaturesV2,
      approvedBy: 'nattapong.w',
      sourceJobId: cmJob2.id,
      createdAt: daysAgo(6),
    },
  })

  await db.sprintRequirement.create({
    data: {
      jobId: cmJob2.id,
      projectId: clinicMate.id,
      fileName: 'clinicmate-sprint2-req.pdf',
      createdBy: 'nattapong.w',
      items: [
        { featureId: 'CM_TELE001', changeType: 'add' },
        { featureId: 'CM_TELE002', changeType: 'add' },
      ],
    },
  })

  return NextResponse.json({
    ok: true,
    projects: [doctorMobile.name, clinicMate.name],
    doctorMobile: {
      knowledgeDocs: 3,
      jobs: 4,
      categories: ['การเข้าสู่ระบบ/ลงทะเบียน', 'Report', 'Migraine Tracking', 'Medicine Pouch', 'Discount code collection', 'Marketplace'],
    },
    clinicMate: {
      knowledgeDocs: 2,
      jobs: 2,
      categories: ['การเข้าสู่ระบบ', 'การนัดหมาย', 'เวชระเบียน', 'การเงิน', 'Telemedicine'],
    },
  })
}
