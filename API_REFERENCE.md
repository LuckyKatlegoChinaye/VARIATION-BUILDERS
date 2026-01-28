# Shop Management System - API Reference & Implementation Guide

## 🚀 Quick Start

### 1. Database Setup
```bash
# Create database
createdb shop_management_db

# Navigate to server
cd server

# Install dependencies
npm install

# Configure .env
# DATABASE_URL=postgresql://user:password@localhost:5432/shop_management_db
# JWT_SECRET=your-secret-key

# Run migrations
npx prisma migrate dev --name init

# Seed initial data
npx prisma db seed
```

### 2. Start Servers
```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm run dev
```

## 🔑 Authentication Workflow

### Register New User
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+267-71-123456",
    "address": "123 Main St"
  }'
```

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "message": "Login successful",
  "user": {
    "id": "clid...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CUSTOMER"
  },
  "token": "eyJhbGc..."
}
```

## 📌 API Endpoints - Complete Reference

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account
- **Body**: `name`, `email`, `password`, `phone?`, `address?`
- **Response**: User object + JWT token

#### POST /api/auth/login
Login with email and password
- **Body**: `email`, `password`
- **Response**: User object + JWT token

#### GET /api/auth/me
Get current authenticated user
- **Headers**: `Authorization: Bearer {token}`
- **Response**: User object with all details

#### PUT /api/auth/update-profile
Update user profile information
- **Headers**: `Authorization: Bearer {token}`
- **Body**: `name?`, `phone?`, `address?`
- **Response**: Updated user object

#### POST /api/auth/change-password
Change user password
- **Headers**: `Authorization: Bearer {token}`
- **Body**: `currentPassword`, `newPassword`, `confirmPassword`
- **Response**: Success message

---

### Shop Endpoints (Admin/Cashier)

#### GET /api/shops
Get all shops (Admin) or assigned shop (Cashier)
- **Headers**: `Authorization: Bearer {token}`
- **Query**: None
- **Response**: Array of shop objects with statistics

#### GET /api/shops/:id
Get specific shop details
- **Headers**: `Authorization: Bearer {token}`
- **Params**: `id` - Shop ID
- **Response**: Shop object with cashiers and counts

#### POST /api/shops
Create a new shop (Admin only)
- **Headers**: `Authorization: Bearer {token}`
- **Role Required**: ADMIN
- **Body**: `name`, `location`, `phone?`, `email?`
- **Response**: Created shop object

#### PUT /api/shops/:id
Update shop details (Admin only)
- **Headers**: `Authorization: Bearer {token}`
- **Role Required**: ADMIN
- **Body**: `name?`, `location?`, `phone?`, `email?`
- **Response**: Updated shop object

#### DELETE /api/shops/:id
Delete a shop (Admin only)
- **Headers**: `Authorization: Bearer {token}`
- **Role Required**: ADMIN
- **Response**: Success message

#### POST /api/shops/:id/assign-cashier
Assign cashier to shop (Admin only)
- **Headers**: `Authorization: Bearer {token}`
- **Role Required**: ADMIN
- **Body**: `cashierId`
- **Response**: Updated user object

#### GET /api/shops/:id/dashboard
Get shop dashboard statistics
- **Headers**: `Authorization: Bearer {token}`
- **Params**: `id` - Shop ID
- **Response**: Dashboard data with sales, products, low stock items

---

### Product Endpoints

#### GET /api/products
Get products (with pagination and filtering)
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**:
  - `shopId?` - Filter by shop
  - `category?` - Filter by category
  - `search?` - Search by name or SKU
  - `page?` - Page number (default: 1)
  - `limit?` - Items per page (default: 20)
- **Response**: Paginated products array

#### GET /api/products/:id
Get product details with inventory
- **Headers**: `Authorization: Bearer {token}`
- **Params**: `id` - Product ID
- **Response**: Product object with inventory info

#### POST /api/products
Create new product (Admin only)
- **Headers**: `Authorization: Bearer {token}`
- **Role Required**: ADMIN
- **Body**:
  ```json
  {
    "name": "Product Name",
    "description": "Product description",
    "sku": "PROD001",
    "price": 99.99,
    "cost": 50.00,
    "category": "Electronics",
    "image": "image-url",
    "shopId": "shop-id",
    "quantity": 10
  }
  ```
- **Response**: Created product with inventory

#### PUT /api/products/:id
Update product (Admin only)
- **Headers**: `Authorization: Bearer {token}`
- **Role Required**: ADMIN
- **Body**: `name?`, `description?`, `price?`, `cost?`, `category?`, `image?`
- **Response**: Updated product

#### DELETE /api/products/:id
Delete product (Admin only)
- **Headers**: `Authorization: Bearer {token}`
- **Role Required**: ADMIN
- **Response**: Success message

#### PUT /api/products/:id/inventory
Update product inventory (Admin only)
- **Headers**: `Authorization: Bearer {token}`
- **Role Required**: ADMIN
- **Body**: `quantity?`, `reorderLevel?`
- **Response**: Updated inventory

#### GET /api/products/inventory/low-stock/:shopId
Get low stock products for a shop
- **Headers**: `Authorization: Bearer {token}`
- **Params**: `shopId` - Shop ID
- **Response**: Array of low stock products

---

### Sales (POS) Endpoints

#### GET /api/sales
Get sales with filtering
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**:
  - `shopId?` - Filter by shop
  - `status?` - Filter by status (COMPLETED, PENDING, CANCELLED)
  - `startDate?` - Filter from date
  - `endDate?` - Filter to date
  - `page?` - Page number
  - `limit?` - Items per page
- **Response**: Paginated sales array

#### GET /api/sales/:id
Get sale/invoice details
- **Headers**: `Authorization: Bearer {token}`
- **Params**: `id` - Sale ID
- **Response**: Sale object with items, cashier, shop info

#### POST /api/sales
Create new sale (Cashier only)
- **Headers**: `Authorization: Bearer {token}`
- **Role Required**: CASHIER
- **Body**:
  ```json
  {
    "shopId": "shop-id",
    "items": [
      {
        "productId": "product-id",
        "quantity": 2
      }
    ],
    "paymentMethod": "CASH",
    "amountPaid": 500.00,
    "tax": 10,
    "discount": 5
  }
  ```
- **Response**: Created sale with invoice number

#### PUT /api/sales/:id/cancel
Cancel a sale (Admin only)
- **Headers**: `Authorization: Bearer {token}`
- **Role Required**: ADMIN
- **Response**: Updated sale with CANCELLED status

#### GET /api/sales/reports/daily/:shopId
Get daily sales report
- **Headers**: `Authorization: Bearer {token}`
- **Params**: `shopId` - Shop ID
- **Query**: `startDate?`, `endDate?`
- **Response**: Sales summary and top products

---

### Quotation Endpoints

#### GET /api/quotations
Get quotations (Customer sees only theirs)
- **Headers**: `Authorization: Bearer {token}`
- **Query**:
  - `status?` - Filter by status
  - `page?` - Page number
  - `limit?` - Items per page
- **Response**: Paginated quotations

#### GET /api/quotations/:id
Get quotation details
- **Headers**: `Authorization: Bearer {token}`
- **Params**: `id` - Quotation ID
- **Response**: Quotation with items and customer

#### POST /api/quotations
Create quotation (Customer or Admin)
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "customerId": "customer-id",
    "items": [
      {
        "productId": "product-id",
        "quantity": 5
      }
    ],
    "validUntil": "2024-12-31",
    "notes": "Special notes"
  }
  ```
- **Response**: Created quotation

#### PUT /api/quotations/:id
Update quotation (Before acceptance)
- **Headers**: `Authorization: Bearer {token}`
- **Body**: `items?`, `validUntil?`, `notes?`
- **Response**: Updated quotation

#### PUT /api/quotations/:id/accept
Accept quotation (Customer only)
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Quotation with ACCEPTED status

#### PUT /api/quotations/:id/reject
Reject quotation (Customer only)
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Quotation with REJECTED status

---

### Expense Endpoints

#### GET /api/expenses
Get expenses (with filtering)
- **Headers**: `Authorization: Bearer {token}`
- **Query**:
  - `shopId?` - Filter by shop
  - `category?` - Filter by category
  - `startDate?`, `endDate?` - Date range
  - `page?`, `limit?` - Pagination
- **Response**: Paginated expenses

#### GET /api/expenses/:id
Get expense details
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Expense object

#### POST /api/expenses
Create expense (Admin, Cashier)
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "shopId": "shop-id",
    "category": "UTILITIES",
    "description": "Monthly electricity bill",
    "amount": 500.00,
    "receipt": "receipt-url"
  }
  ```
- **Response**: Created expense

#### PUT /api/expenses/:id
Update expense (Admin only)
- **Headers**: `Authorization: Bearer {token}`
- **Body**: `category?`, `description?`, `amount?`, `receipt?`
- **Response**: Updated expense

#### DELETE /api/expenses/:id
Delete expense (Admin only)
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Success message

#### GET /api/expenses/reports/summary/:shopId
Get expense summary report
- **Headers**: `Authorization: Bearer {token}`
- **Query**: `startDate?`, `endDate?`
- **Response**: Total expenses and breakdown by category

---

## 🔐 User Roles & Permissions

### Admin
Full system access including:
- Shop management (create, update, delete)
- User management and role assignment
- Product catalog management
- Inventory management
- View all sales and reports
- Manage expenses
- Cancel sales
- View all quotations

### Cashier
Shop-specific operations:
- Process sales (POS)
- View assigned shop inventory
- Create/manage quotations for their shop
- View their shop's dashboard and reports
- Add expenses for their shop
- Access limited to assigned shop only

### Customer
Limited customer operations:
- View available products
- Create quotation requests
- View/manage their quotations
- Accept or reject quotations

---

## 📊 Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "message": "Error description",
  "error": { /* error details */ }
}
```

### Paginated Response
```json
{
  "data": [ /* items */ ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

---

## 🧪 Testing Examples

### Example 1: Complete POS Transaction
```bash
# 1. Cashier logs in
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cashier1@example.com","password":"cashier123"}' \
  | jq -r '.token')

# 2. Get available products
curl -X GET "http://localhost:4000/api/products?shopId=<shop-id>" \
  -H "Authorization: Bearer $TOKEN"

# 3. Create sale
curl -X POST http://localhost:4000/api/sales \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "<shop-id>",
    "items": [{"productId": "<product-id>", "quantity": 2}],
    "paymentMethod": "CASH",
    "amountPaid": 5000.00,
    "tax": 10,
    "discount": 0
  }'

# 4. Get sales report
curl -X GET "http://localhost:4000/api/sales/reports/daily/<shop-id>" \
  -H "Authorization: Bearer $TOKEN"
```

### Example 2: Create and Manage Quotation
```bash
# 1. Login as customer
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"customer123"}' \
  | jq -r '.token')

# 2. Create quotation
curl -X POST http://localhost:4000/api/quotations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "<product-id>", "quantity": 3}],
    "validUntil": "2024-12-31",
    "notes": "Urgent request"
  }'

# 3. Accept quotation
curl -X PUT "http://localhost:4000/api/quotations/<quotation-id>/accept" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📱 Frontend Usage

### Using AuthContext
```jsx
import { useAuth } from './context/AuthContext';

function LoginComponent() {
  const { login, user, token } = useAuth();

  const handleLogin = async () => {
    const result = await login('user@example.com', 'password');
    if (result.success) {
      // User logged in, redirect to dashboard
    }
  };
}
```

### Making API Calls
```jsx
import axios from 'axios';
import { useAuth } from './context/AuthContext';

function ProductList() {
  const { token } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          'http://localhost:4000/api/products',
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setProducts(response.data.data);
      } catch (error) {
        console.error('Failed to fetch products', error);
      }
    };
    fetchProducts();
  }, [token]);
}
```

---

**Version**: 1.0.0
**Last Updated**: 2024
