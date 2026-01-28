# Variation Builders — Server

This is a minimal starter Express server for the Variation Builders quotation system. It uses a JSON file as a datastore for simplicity. For production use, replace with a proper SQL database and ORM.

Quick start

1. Open a terminal in `server/` and install dependencies:

```powershell
cd "c:\Users\Administrator\Desktop\VARIATION WEBSITE\server"
npm install
```

2. Run the server:

```powershell
npm run dev
```

3. The API root will be at `http://localhost:4000/`.

Endpoints (starter)

- `POST /api/auth/register` — { name, email, password }
- `POST /api/auth/login` — { email, password }
- `GET  /api/inventory` — list inventory
- `POST /api/inventory` — add inventory item { name, price, qty }
- `GET  /api/quotes` — list quotes
- `POST /api/quotes` — create quote { userId, items: [{ itemId, qty }] }
- `POST /api/quotes/:id/convert` — convert quote to invoice

Notes

- This is a development scaffold. Next steps: add persistent DB (Postgres/SQLite + Prisma), implement role-based auth, and build the frontend.
