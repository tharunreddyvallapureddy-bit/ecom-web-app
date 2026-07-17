# 🍔 Gourmet Express - Premium Food Delivery Platform

Gourmet Express is a responsive, modern food delivery e-commerce web application and Progressive Web App (PWA) built using **React**, **TypeScript**, and **Firebase** (Authentication & Firestore). It features a multi-role architecture, live GPS rider tracking, a zero-cost payment gateway (dynamic UPI QR codes), and a complete administrative dashboard.

---

## 🚀 Key Features

### 1. Multi-Role System Architecture
- **Customer Portal:** Browse menu, filter categories, view recommendations ("Trending Now", "Frequently Ordered Together"), manage saved delivery addresses, apply discount promo coupons, and track active deliveries.
- **Delivery Partner Portal:** Mobile-optimized view for riders to manage assigned orders, toggle order statuses (Picked Up / Delivered), and broadcast real-time GPS coordinates.
- **Admin Dashboard Console:** Full menu & coupon CRUD management, live logistics Kanban dispatch queue, delivery team provisioning, and COD cash settlement ledger tracking.

### 2. Live GPS Route Tracking Map
- Implements an interactive **Leaflet.js** map utilizing OpenStreetMap.
- Streams live coordinates using `navigator.geolocation.watchPosition` from the Delivery Partner's mobile portal.
- Employs customized HTML/SVG markers to avoid broken image asset path errors common in standard Leaflet setups.

### 3. Zero-Cost Payment Framework
- **Cash on Delivery (COD):** Generates orders with `UNPAID_COD` status and bypasses external merchant gateways directly to the kitchen pipeline.
- **UPI Deep Link & Dynamic QR Generator:** Compiles a standard `upi://pay` deep link using payee VPA details, order amount, and transaction ID. Generates dynamic QR codes allowing desktop users to scan and complete payments on GPay, PhonePe, or Paytm with 0% transaction fees.

### 4. Dual-Mode Operations
- Can run in **Mock mode** (using local storage and in-memory PubSub events) to test features immediately.
- Switches automatically to **Live mode** once your Firebase environment variables are defined in `.env`.

---

## 🛠️ Technology Stack
- **Frontend:** React (Vite), TypeScript, Tailwind CSS (v4), Lucide React (Icons).
- **Mapping:** Leaflet.js, OpenStreetMap.
- **Backend & Database:** Firebase Auth, Firestore.

---

## ⚙️ Installation & Setup

1. **Clone & Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```ini
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

3. **Deploy Security Rules:**
   Apply the Firestore rules located in the setup guide directly to your Firebase Console -> Firestore -> Rules.

4. **Launch Application:**
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure

```
ecom-web/
├── src/
│   ├── components/       # LiveTrackingMap, QRCodeGenerator, Navbar, ProtectedRoute
│   ├── context/          # AuthContext (Multi-role session), CartContext
│   ├── pages/            # Home (Menu), Login, Register, Cart (Checkout), Tracking
│   │   ├── admin/        # Menu CRUD, Coupon CRUD, Logistics Kanban, Cash Settlement
│   │   └── delivery/     # Assigned Orders, Pickup/Delivered, WatchPosition GPS Broadcast
│   ├── services/         # db.ts (unified repository), firebase.ts, mockFirebase.ts
│   ├── types/            # UserProfile and Order strict TypeScript models
│   ├── App.tsx           # Global Browser router definitions
│   └── index.css         # Tailwind v4 directives & Leaflet styling
└── package.json
```
