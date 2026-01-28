# Variation Builders — Full-Stack Quotation & Invoicing System

A complete, professional web application for managing quotations and invoices. Users can log in, browse inventory, create custom quotations (with cart), and convert them to invoices. Built with Express.js (Node.js) backend and React frontend.

## Features

- **User Authentication** — Sign up / login with email & password (or Google OAuth when configured)
- **Professional Dashboard** — Overview of quotes and invoices at a glance
- **Inventory Management** — Browse all products (tunas, laser printers, furniture, stationery, etc.)
- **Quotation Builder** — Select items, adjust quantities, and create customized quotations
- **Invoice Generation** — Convert quotations to invoices with a single click
- **JWT-Based Auth** — Secure API endpoints with token-based authentication
- **Responsive UI** — Clean, professional design built with React

## Tech Stack

- **Backend:** Express.js (Node.js), JSON datastore (easily swappable with SQLite/Postgres)
- **Frontend:** React + Vite, React Router, Axios
- **Auth:** JWT + bcryptjs, Passport.js (for Google OAuth)
- **Styling:** Inline CSS (easily customize with Tailwind, Bootstrap, etc.)

## Quick Start

### Prerequisites
- Node.js (v14+) installed
- npm or yarn

### 1. Install Dependencies

**Backend:**
```powershell
cd "c:\Users\Administrator\Desktop\VARIATION WEBSITE\server"
npm install
```

**Frontend:**
```powershell
cd "c:\Users\Administrator\Desktop\VARIATION WEBSITE\client"
npm install
```

### 2. Seed the Database

Pre-populate the server with sample inventory and a test user:

```powershell
cd "c:\Users\Administrator\Desktop\VARIATION WEBSITE\server"
node seed.js
```

This creates:
- Sample inventory: tunas, laser printers, office furniture, stationery
- Test user: `john@example.com` / password `password123`

### 3. Start the Backend

```powershell
cd "c:\Users\Administrator\Desktop\VARIATION WEBSITE\server"
npm run dev
```

The backend will listen on `http://localhost:4000`

### 4. Start the Frontend (in a new terminal)

```powershell
cd "c:\Users\Administrator\Desktop\VARIATION WEBSITE\client"
npm run dev
```

The frontend will run on `http://localhost:5173`

## Testing the Flows

### Login with Test User
1. Open http://localhost:5173 in your browser
2. Email: `john@example.com`
3. Password: `password123`

### Create a Quotation
1. Click "Inventory" in the dashboard
2. Select products from the table and click "Add"
3. Adjust quantities in the cart
4. Click "Create Quote" to finalize

### Convert to Invoice
1. Go to "Quotes" page
2. View your created quotations
3. Click "Convert" to turn a quote into an invoice
4. Invoices appear in the "Invoices" panel

## API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login with email & password
- `GET /api/auth/google` — Start Google OAuth flow (if configured)
- `GET /api/auth/google/callback` — Google OAuth callback

### Inventory
- `GET /api/inventory` — List all products
- `POST /api/inventory` — Add a new product (admin only)

### Quotations
- `GET /api/quotes` — List all quotes
- `POST /api/quotes` — Create a new quote (protected)
- `POST /api/quotes/:id/convert` — Convert quote to invoice (protected)

### Invoices
- `GET /api/invoices` — List all invoices
- `GET /api/invoices/my` — Get current user's invoices (protected)

## Enable Google OAuth (Optional)

To add "Sign in with Google" support:

1. **Create Google OAuth Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project (or use existing)
   - Navigate to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Select "Web application"
   - Add Authorized redirect URI: `http://localhost:4000/api/auth/google/callback`
   - Copy the Client ID and Client Secret

2. **Set Environment Variables** (PowerShell)
   ```powershell
   $env:GOOGLE_CLIENT_ID="your-client-id-here"
   $env:GOOGLE_CLIENT_SECRET="your-client-secret-here"
   $env:CLIENT_URL="http://localhost:5173"
   ```

3. **Restart the Server**
   ```powershell
   cd "c:\Users\Administrator\Desktop\VARIATION WEBSITE\server"
   npm run dev
   ```

Now the "Sign in with Google" button on the login page will work.

## Project Structure

```
VARIATION WEBSITE/
├── server/
│   ├── index.js                 # Express app entry point
│   ├── seed.js                  # Database seeding script
│   ├── dataStore.js             # JSON file DB helper
│   ├── data/
│   │   └── db.json              # Datastore (auto-generated)
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT verification
│   ├── routes/
│   │   ├── auth.js              # Auth endpoints
│   │   ├── inventory.js         # Inventory endpoints
│   │   ├── quotes.js            # Quotation endpoints
│   │   └── invoices.js          # Invoice endpoints
│   ├── package.json
│   └── README.md
│
└── client/
    ├── index.html               # HTML entry point
    ├── vite.config.js           # Vite configuration with API proxy
    ├── src/
    │   ├── main.jsx             # React app root with routes
    │   ├── styles.css           # Global styles
    │   └── pages/
    │       ├── Login.jsx        # Login / signup page
    │       ├── Dashboard.jsx    # User dashboard
    │       ├── Inventory.jsx    # Product browsing & quotation builder
    │       └── Quotes.jsx       # Quotations & invoices view
    ├── package.json
    └── README.md
```

## Next Steps & Production Readiness

### Before Deploying to Production:

1. **Replace JSON Datastore**
   - Migrate to SQLite (with better-sqlite3) or PostgreSQL
   - Use an ORM like Prisma or Sequelize for schema management
   - Run migrations: `npm run migrate`

2. **Secure Authentication**
   - Use HTTP-only cookies instead of localStorage for tokens
   - Implement refresh token rotation
   - Add HTTPS/TLS in production

3. **Add QuickBooks Integration**
   - Implement OAuth flow for QuickBooks Online
   - Sync invoices automatically after creation
   - See `/server/routes/` for integration stubs

4. **Improve UI/UX**
   - Add form validation and error messages
   - Implement loading states and notifications
   - Add PDF export for quotations & invoices
   - Implement pagination for large lists

5. **Add Admin Features**
   - User role management (admin, sales rep, customer)
   - Bulk inventory import (CSV)
   - Quotation templates

6. **Deployment**
   - Deploy backend to Heroku, Railway, or similar
   - Deploy frontend to Vercel, Netlify, or GitHub Pages
   - Set up environment variables on hosting platform
   - Configure CORS for cross-origin requests

## Environment Variables

Create a `.env` file in the `server/` directory:

```
PORT=4000
JWT_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
CLIENT_URL=http://localhost:5173
```

For the `client/`, the Vite config is pre-configured to proxy `/api` calls to the backend.

## Troubleshooting

**Q: Backend won't start**
- Ensure Node.js is installed: `node --version`
- Check if port 4000 is available: `netstat -ano | findstr :4000`
- Clear `node_modules` and reinstall: `npm install`

**Q: Frontend won't connect to backend**
- Verify backend is running on `http://localhost:4000`
- Check Vite proxy config in `client/vite.config.js`
- Clear browser cache and hard refresh (Ctrl+Shift+R)

**Q: Google OAuth not working**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Check redirect URI matches in Google Cloud Console
- Restart the server after setting env vars

**Q: Database issues**
- Delete `server/data/db.json` and run `node seed.js` to reset
- Check file permissions if on Linux/Mac

## Support & Contributions

For issues or feature requests, please reach out. Happy quoting!

---

**Built with ❤️ for Variation Builders**
