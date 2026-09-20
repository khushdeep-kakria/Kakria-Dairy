# Kakria Dairy (?????? ?????) � Since 2002 by DKK

Pure, authentic, and homemade dairy storefront and order management platform based in Kotakpura, Punjab.

## Features
- **Pure Storefront**: Handcrafted Cow Ghee, Buffalo Ghee, A2 Binola Ghee, Fresh Paneer, Pure Khoya, Makhan, and Chatti Milk.
- **Bilingual**: English and Punjabi (??????) with full dictionary translations and Gurmukhi typography.
- **Dark & Light Mode**: System-preference detected, localStorage preserved, zero-FOUC theme switching.
- **Dynamic UPI Checkout**: Real-time UPI QR generation per order, mobile deep-link (`upi://pay`), WhatsApp confirmation, and 12-digit UTR verification.
- **Storefront Admin Integration**: Discrete admin login directly overlaying controls (In-stock toggle, soft-discontinue, price edit, Cloudinary photo change, and live order drawer) onto the storefront.
- **Customer Reviews**: Rating submission with anti-spam honeypot, rate limiting (3/hr/IP), client-side photo compression, and admin moderation (Approve / Hide / Delete).
- **Production Performance**: Server-side caching, compound MongoDB indexes, Cloudinary image transformations, lean queries, gzip compression, and security headers.

---

## Quick Setup

### 1. Prerequisites
- Node.js 18+ (Node 20 Recommended)
- MongoDB Database (Atlas or local)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Key environment variables:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for admin session authentication
- `ADMIN_USERNAME`: Admin login username
- `ADMIN_PASSWORD`: Admin login password
- `UPI_ID`: Shop UPI VPA for receiving payments
- `PAYEE_NAME`: Registered payee name
- `UNCLE_WHATSAPP`: Shop contact number (+91 98153 42224)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Cloudinary credentials (optional)

### 4. Build and Run

#### Development Server
```bash
npm run dev
```

#### Production Server (Port 3000)
```bash
npm run build
npm start
```

### 5. Health Check
Check application and database health:
```bash
curl http://localhost:3000/api/health
```

### 6. Docker Deployment
```bash
docker build -t kakria-dairy .
docker run -p 3000:3000 --env-file .env kakria-dairy
```
