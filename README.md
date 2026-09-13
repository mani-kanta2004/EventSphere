# EventSphere — Event Ticket Booking Platform

> **Tagline:** *"Discover. Book. Experience."*

**EventSphere** is a complete, placement-quality, full-stack **Event Ticket Booking SaaS Web Application** built with Node.js, Express.js, MongoDB/Mongoose, JWT authentication, role-based authorization, vanilla JavaScript frontend, INR payment simulation, digital ticket generation, and Chart.js admin analytics.

---

## 🌟 Key Features

### 👤 User Roles & Capabilities
- **User Authentication**: Secure registration and login using JWT tokens and bcrypt password hashing.
- **Event Catalog & Filtering**: Search events dynamically by title, city/location, category, and price sorting.
- **Real-Time Ticket Reservation**: Ticket availability calculation on the backend with overbooking protection.
- **Demo Payment Simulation**: Interactive payment portal supporting UPI, Credit/Debit Cards, and Net Banking in INR (`₹`).
- **Digital Ticket Passes**: Instant ticket confirmation with unique Ticket IDs (`EVT-2026-XXXXXX`), transaction IDs (`TXN-XXXXXX`), QR code generation, and browser print/PDF export.
- **Booking Management**: View past/upcoming bookings, cancel reservations (restoring tickets to inventory) with simulated refunds.
- **User Profile**: Update personal contact details and password securely.

### 🛡️ Admin Management & Analytics
- **Protected Admin Portal**: Role-based authorization middleware enforcing `403 Forbidden` for non-admin API access.
- **Real-Time Dashboard Metrics**: MongoDB aggregation pipelines calculating total events, users, bookings, tickets sold, and total revenue in INR.
- **Data Visualizations**: Dynamic Chart.js graphs displaying **Revenue by Event** and **Sales by Category**.
- **Full Event CRUD**: Create new events, edit details/pricing, adjust capacity safely, and cancel/delete events.
- **Event-Specific Analytics**: Inspect individual event sales ratio, capacity pie chart, and customer purchase logs.
- **User & Booking Directories**: Audit all registered accounts and filter customer transactions.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+), Fetch API, Chart.js (No React/Angular/Vue) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB & Mongoose ORM |
| **Authentication** | JSON Web Tokens (JWT), `bcryptjs` password hashing |
| **Utilities** | `dotenv`, `cors`, `express-validator`, `mongodb-memory-server` (Zero-config DB Fallback) |

---

## 📁 Project Structure

```text
EventSphere/
│
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & auto MongoMemoryServer fallback
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, profile management
│   │   ├── eventController.js    # Public event listing, filters & Admin CRUD
│   │   ├── bookingController.js  # Ticket reservation engine & cancellation logic
│   │   └── adminController.js    # Dashboard stats, revenue aggregation, user list, event analytics
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT validation middleware
│   │   └── adminMiddleware.js    # Admin role verification middleware (403 if role !== 'admin')
│   ├── models/
│   │   ├── User.js               # User Mongoose schema (name, email, password, phone, role)
│   │   ├── Event.js              # Event Mongoose schema (title, description, category, venue, pricing, capacity)
│   │   └── Booking.js            # Booking Mongoose schema (breakdown fees, paymentStatus, transactionId, ticketId)
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth endpoints
│   │   ├── eventRoutes.js        # /api/events endpoints
│   │   ├── bookingRoutes.js      # /api/bookings endpoints
│   │   └── adminRoutes.js        # /api/admin endpoints
│   ├── utils/
│   │   ├── generateTicket.js     # Ticket ID & Transaction ID generator helpers
│   │   └── seedData.js           # Sample users & Indian events dataset
│   ├── seed.js                   # Executable database seed script
│   ├── createAdmin.js            # Script to seed default Admin account
│   ├── .env                      # Environment configuration
│   ├── .env.example              # Environment variables template
│   ├── server.js                 # Express server bootstrap & static file server
│   └── package.json              # Backend dependencies configuration
│
├── frontend/
│   ├── index.html                # Landing page & featured events catalog
│   ├── login.html                # User login page
│   ├── register.html             # User registration page
│   ├── events.html               # Event search catalog with category & city filters
│   ├── event-details.html        # Event details & quantity selector
│   ├── booking.html              # Booking summary & fee breakdown (Subtotal, GST, Fee, Total in INR)
│   ├── payment.html              # Demo payment portal (Card, UPI, NetBanking simulation)
│   ├── booking-success.html      # Confirmation & printable digital ticket pass
│   ├── my-bookings.html          # User booking history & digital ticket viewer
│   ├── profile.html              # User profile update page
│   │
│   ├── admin/
│   │   ├── login.html            # Dedicated Admin login page
│   │   ├── dashboard.html        # Admin metrics, KPI cards, and Chart.js graphs
│   │   ├── events.html           # Admin event management table
│   │   ├── create-event.html     # Add / Edit event form
│   │   ├── bookings.html         # All bookings directory and filter
│   │   ├── users.html            # Registered users directory
│   │   └── event-details.html    # Event-specific analytics & ticket capacity chart
│   │
│   ├── css/
│   │   ├── style.css             # Main design system (CSS variables, buttons, nav, footer, badges)
│   │   ├── auth.css              # Auth card & input styles
│   │   ├── user.css              # User catalog, ticket cards, booking summary & digital ticket CSS
│   │   └── admin.css             # Sidebar layout, metrics cards, table styles, Chart.js container
│   │
│   └── js/
│       ├── main.js               # Common API fetch helper, toast notifications, auth check, INR formatter
│       ├── auth.js               # Registration & login form handlers
│       ├── events.js             # Catalog rendering, search, category & city filters
│       ├── event-details.js      # Quantity picker & inventory validation
│       ├── booking.js            # Summary breakdown calculation & checkout session
│       ├── payment.js            # Payment simulation & API confirmation call
│       ├── my-bookings.js        # User bookings table & cancellation handler
│       ├── profile.js            # Profile update handler
│       └── admin.js              # Admin metrics, Chart.js rendering, event CRUD & user directory
│
├── package.json                  # Root npm configuration & run scripts
└── README.md                     # Complete project documentation
```

---

## ⚡ Quick Start & Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database
Populates the database with 1 Admin account, 5 User accounts, 10 realistic Indian events across major cities, and sample bookings:
```bash
npm run seed
```

Alternatively, to populate or reset just the Admin account:
```bash
npm run create-admin
```

### 3. Start the Server
```bash
npm start
```
Open your browser and navigate to:
```text
http://localhost:5000
```

> **Note on MongoDB Setup:**
> The server connects to your local MongoDB instance (`mongodb://127.0.0.1:27017/eventSphereDB`) by default. If MongoDB is not running locally, it automatically initializes an embedded **In-Memory MongoDB Server**, allowing you to run and evaluate the application instantly without manual setup!

---

## 🔑 Demo Credentials

### 🛡️ Administrator Account
- **Page:** `http://localhost:5000/admin/login.html`
- **Email:** `admin@eventsphere.com`
- **Password:** `Admin@123`

### 👤 Regular User Account
- **Page:** `http://localhost:5000/login.html`
- **Email:** `manikanta@example.com`
- **Password:** `User@123`

---

## 📡 REST API Documentation

### 🔐 Authentication Endpoints
- `POST /api/auth/register` — Register new user account.
- `POST /api/auth/login` — Login user or admin, returns JWT token.
- `GET  /api/auth/me` — Get logged-in user profile (Protected).
- `PUT  /api/auth/profile` — Update user profile details (Protected).

### 📅 Event Endpoints
- `GET    /api/events` — Get all events with optional filters (`query`, `category`, `location`, `sort`).
- `GET    /api/events/:id` — Get detailed information for a single event.
- `POST   /api/events` — Create new event (Admin required).
- `PUT    /api/events/:id` — Update event details or capacity (Admin required).
- `DELETE /api/events/:id` — Delete or safely mark event as Cancelled (Admin required).

### 🎟️ Booking Endpoints
- `POST /api/bookings` — Reserve tickets with backend fee calculation & atomic capacity deduction (User).
- `GET  /api/bookings/my` — Get logged-in user's booking history (User).
- `GET  /api/bookings/:id` — Get booking details & digital ticket pass (User/Admin).
- `PUT  /api/bookings/:id/cancel` — Cancel booking & restore tickets to event inventory (User/Admin).

### 📊 Admin Analytics Endpoints
- `GET /api/admin/dashboard` — Get dashboard KPIs, total revenue in INR, recent bookings (Admin required).
- `GET /api/admin/bookings` — Get all platform bookings with status filter (Admin required).
- `GET /api/admin/users` — Get registered users list with booking count and total spent (Admin required).
- `GET /api/admin/events/:id/stats` — Get event-specific sales breakdown & capacity ratio (Admin required).
- `GET /api/admin/analytics` — Get aggregated data for Chart.js graphs (Admin required).

---

## 🔒 Security & Business Rules

1. **Backend Pricing Calculation**: Ticket subtotal, booking fees, GST (18%), and total amounts are strictly computed on the backend. Frontend prices are never trusted.
2. **Atomic Inventory Control**: Uses MongoDB atomic operators (`findOneAndUpdate` with `$gte` and `$inc`) to prevent race conditions and overbooking.
3. **Capacity Modification Protection**: When an admin updates an event's total tickets, the system ensures `newTotalTickets >= ticketsAlreadySold`.
4. **Role Enforcement**: Middleware checks `req.user.role === 'admin'`. Non-admin access to `/api/admin/*` immediately returns `403 Forbidden`.
5. **24-Hour Cancellation Policy**: Non-admin users can only cancel bookings up to 24 hours prior to the event date.
