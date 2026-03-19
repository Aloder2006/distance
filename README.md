# 🌍 Distance Between Us

A premium, full-stack web application designed to calculate the precise direct distance between an administrator and visitors in real-time. Featuring an elegant dark wood & liquid glassmorphism UI, interactive live mapping, and powerful advanced device fingerprinting telemetry.

## ✨ Features

- **🌐 Real-Time Distance Calculation**: Accurately calculates the direct path (in meters/kilometers) between the admin's saved location and the visitor using the Haversine formula.
- **🗺️ Interactive Maps**: Integrates Leaflet with OpenStreetMap tiles, styled natively with a custom dark-mode inverted filter for an ultra-premium aesthetic.
- **📱 Deep Device Fingerprinting**: Silently gathers advanced hardware telemetry from visitors (even if location permissions are denied) directly upon page entry, including:
  - Exact WebGL GPU Renderer
  - CPU Cores & RAM estimation
  - Network Speed & Connection Type
  - Screen Resolution, Touch Points, & DPI
  - Raw User-Agent, OS Platform, & Browser Vendor
- **🕵️‍♂️ IP & GPS Geolocation**: Combines precise GPS coordinates (reverse-geocoded via Nominatim) with a fallback IP-based geolocation mechanism via `ip-api`.
- **🔐 Secure Admin Dashboard**: A beautifully crafted, password-protected admin portal utilizing JWT authentication to view incoming messages, live locations, and in-depth visitor telemetry.
- **💧 Premium UI/UX**: Built entirely with Tailwind CSS featuring a custom "Liquid Glassmorphism" aesthetic layered over deep, warm wood-toned gradients.

## 🛠️ Tech Stack

- **Frontend**: React.js, Tailwind CSS, React-Leaflet, Vercel Speed Insights.
- **Backend**: Node.js, Express.js, Mongoose.
- **Database**: MongoDB (Atlas).
- **Authentication**: JSON Web Tokens (JWT).
- **APIs**: Nominatim OpenStreetMap (Reverse Geocoding), IP-API (Network Geolocation).

## 🚀 Deployment

This project is fully automated and optimized for **Vercel** serverless environments. The backend operates seamlessly as single Vercel serverless functions through the `api/index.js` entry point.

### Environment Variables (.env)

Ensure the following variables are configured in your deployment environment:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/distance-app
JWT_SECRET=your_super_secret_jwt_key
ADMIN_PASSWORD=your_secure_dashboard_password
```

## 💻 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Aloder2006/distance.git
   cd distance-app
   ```

2. **Install dependencies concurrently:**
   ```bash
   npm run install:all
   ```

3. **Start the development server:**
   Both backend and frontend will run concurrently on a single terminal using the powerful `concurrently` package.
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Visitor Portal: `http://localhost:3000`
   - Admin Dashboard: Access via your React routing or modify internal components.
   - Backend API: `http://localhost:5000/api`

---
*Crafted with precision for elegant geolocation, unbreakable functionality, and massive analytical power.*
