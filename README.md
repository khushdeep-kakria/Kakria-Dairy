# 🥛 Kakria Dairy

### Pure • Authentic • Homemade Dairy Products

Kakria Dairy is a bilingual dairy storefront and order management platform built for a family-owned dairy business based in Kotakpura, Punjab.

The platform allows customers to explore dairy products, place orders, make UPI payments, and submit reviews, while administrators can manage products, orders, inventory, and customer reviews.

---

## ✨ Features

### 🛍️ Customer Storefront

- Browse dairy products
- View product prices and availability
- Responsive design for desktop and mobile
- Available products include:
  - Cow Ghee
  - Buffalo Ghee
  - A2 Binola Ghee
  - Fresh Paneer
  - Pure Khoya
  - Makhan
  - Chatti Milk

### 🌐 Bilingual Interface

- English and Punjabi language support
- Punjabi translations using Gurmukhi typography
- Dictionary-based translations

### 🌓 Dark & Light Mode

- Automatic system theme detection
- Manual theme switching
- Theme preference saved using `localStorage`
- Zero-FOUC theme switching

### 💳 UPI Payment System

- Dynamic UPI QR generation for each order
- UPI mobile deep-link support
- Order-based payment flow
- UTR submission and verification
- WhatsApp order confirmation

### 🔐 Admin Management

Administrators can:

- Securely log in
- Update product prices
- Toggle product availability
- Soft-discontinue products
- Change product images
- View incoming orders
- Manage orders through a live order drawer

### ⭐ Customer Reviews

- Customer rating submission
- Optional photo uploads
- Client-side image compression
- Honeypot anti-spam protection
- Rate limiting
- Admin moderation
- Approve, hide, or delete reviews

### ⚡ Performance & Security

- Server-side caching
- Optimized MongoDB queries
- Compound MongoDB indexes
- Cloudinary image transformations
- Gzip compression
- Security headers
- Lean database queries

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js | Full-stack web application |
| TypeScript | Application development |
| Tailwind CSS | UI styling |
| MongoDB | Database |
| Cloudinary | Image storage and transformations |
| JWT | Admin authentication |
| UPI | Online payments |
| WhatsApp | Order confirmation |
| Docker | Containerization |

---

## 📁 Project Structure

```text
Kakria-Dairy/
│
├── app/                  # Next.js application routes and pages
├── components/           # Reusable UI components
├── context/              # React context and application state
├── data/                 # Static data and dictionaries
├── lib/                  # Utility functions and services
├── models/               # MongoDB models
├── public/               # Static assets
├── scripts/              # Utility and setup scripts
├── types/                # TypeScript type definitions
│
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── next.config.mjs
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md