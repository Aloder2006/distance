# The Distance Between Us — دليل التشغيل الكامل

## هيكل المشروع

```
project/
├── backend/
│   ├── models/index.js       # نماذج Mongoose
│   ├── routes/
│   │   ├── location.js
│   │   ├── messages.js
│   │   └── visitors.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
│   │   ├── pages/
│   │   │   ├── VisitorPage.js   # واجهة الزائر
│   │   │   └── AdminPage.js     # لوحة التحكم
│   │   ├── utils/
│   │   │   ├── api.js           # استدعاءات API
│   │   │   └── distance.js      # حساب المسافة (Haversine)
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
    ├── tailwind.config.js
    ├── package.json
    └── .env.example
```

---

## 1. تثبيت الـ Backend

```bash
cd backend
npm install
cp .env.example .env
# عدّل MONGO_URI في .env إذا لزم
npm run dev   # للتطوير (nodemon)
# أو: npm start  للإنتاج
```

يعمل على: `http://localhost:5000`

---

## 2. تثبيت الـ Frontend

```bash
cd frontend
npm install
cp .env.example .env
# عدّل REACT_APP_API_URL ليشير لعنوان الـ backend
npm start
```

يعمل على: `http://localhost:3000`

---

## 3. إعداد Tailwind CSS

إذا لم يكن Tailwind مُضمّناً مع CRA، ثبّته يدوياً:

```bash
cd frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

تأكد أن `tailwind.config.js` يحتوي على:
```js
content: ["./src/**/*.{js,jsx,ts,tsx}"]
```

---

## 4. نقاط API

| الطريقة | المسار              | الوصف                          |
|---------|---------------------|-------------------------------|
| GET     | /api/location       | جلب موقع المشرف               |
| POST    | /api/location       | تحديث موقع المشرف (upsert)    |
| POST    | /api/visitors       | تسجيل زيارة (صامت)            |
| GET     | /api/visitors       | جلب جميع الزيارات              |
| POST    | /api/messages       | إرسال رسالة جديدة              |
| GET     | /api/messages       | جلب جميع الرسائل               |

---

## 5. نماذج قاعدة البيانات

### Location (وثيقة واحدة دائماً)
```js
{ adminLat: Number, adminLng: Number, updatedAt: Date }
```

### Message
```js
{ text: String, distanceInMeters: Number, senderLat: Number, senderLng: Number, createdAt: Date }
```

### Visitor
```js
{ userAgent: String, visitDate: String, visitTime: String }
```

---

## 6. للنشر على الإنترنت (Deployment)

### Backend (مثال: Render / Railway)
- ضع متغير البيئة `MONGO_URI` مع رابط MongoDB Atlas
- ضع `PORT` إذا لزم

### Frontend (مثال: Vercel / Netlify)
- ضع متغير البيئة `REACT_APP_API_URL` ليشير لرابط الـ backend المنشور
- ابنِ المشروع: `npm run build`

---

## 7. إضافة إشعارات Telegram مستقبلاً

في `backend/routes/messages.js`، قم بإلغاء تعليق الكود التالي وضع رابط webhook الخاص بك:

```js
if (process.env.WEBHOOK_URL) {
  await fetch(process.env.WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
}
```

ثم أضف `WEBHOOK_URL=https://your-n8n.com/webhook/...` في `.env`

---

## 9. كلمة مرور لوحة التحكم

كلمة المرور الافتراضية: `admin123`

لتغييرها، أضف في `frontend/.env`:
```
REACT_APP_ADMIN_PASSWORD=كلمتك_السرية_هنا
```

الجلسة تُحفظ في `sessionStorage` — تنتهي عند إغلاق المتصفح تلقائياً.

---

## 10. الملفات الجديدة المضافة

| الملف | الوظيفة |
|-------|---------|
| `frontend/public/index.html` | نقطة دخول HTML مع RTL و Google Fonts |
| `frontend/postcss.config.js` | إعداد PostCSS لـ Tailwind |
| `frontend/src/components/AdminGate.js` | شاشة كلمة المرور لحماية `/admin` |
| `backend/routes/messages.js` (محدّث) | أُضيف `DELETE /api/messages/:id` |
| `frontend/src/utils/api.js` (محدّث) | أُضيفت `deleteMessage()` |
| `frontend/src/pages/AdminPage.js` (محدّث) | حذف الرسائل + هيكل تحميل + زر خروج |
