# Coffee Me POS Backend

Backend API for the Coffee Me Point of Sale system built with Node.js, Express, TypeScript, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and update DATABASE_URL with your PostgreSQL credentials
   ```

3. **Set up the database:**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate

   # Run migrations
   npm run prisma:migrate
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
brew-bite-backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript type definitions
│   └── app.ts           # Express app entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── .env                 # Environment variables
└── package.json
```

## 🗄️ Database Setup

### Using PostgreSQL

1. **Install PostgreSQL** (if not already installed)
2. **Create a database:**
   ```sql
   CREATE DATABASE brewbite_pos;
   ```

3. **Update `.env` with your database credentials:**
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/brewbite_pos?schema=public"
   ```

4. **Run migrations:**
   ```bash
   npm run prisma:migrate
   ```

### Using Prisma Studio (Database GUI)

```bash
npm run prisma:studio
```

This will open Prisma Studio at `http://localhost:5555` where you can view and edit your database.

## 📡 API Endpoints

### Base URL: `http://localhost:5000/api`

### Items
- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get item by ID
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `PATCH /api/items/:id/stock` - Update stock quantity

### Orders
- `GET /api/orders` - Get all orders (with filters)
- `GET /api/orders/pending` - Get pending orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `POST /api/orders/:id/checkout` - Complete order (checkout)
- `PATCH /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Delete order

### Tables
- `GET /api/tables` - Get all tables
- `GET /api/tables/:id` - Get table by ID
- `POST /api/tables` - Create new table
- `PUT /api/tables/:id` - Update table
- `DELETE /api/tables/:id` - Delete table
- `PATCH /api/tables/:id/status` - Update table status

### Settings
- `GET /api/settings` - Get shop settings
- `PUT /api/settings` - Update shop settings

### Health Check
- `GET /api/health` - Server health status

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

### Debugging

The server includes comprehensive logging in development mode:
- Request logging (method, path, query, body)
- Error logging with stack traces
- Database query logging

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT secret key | Required |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

## 🧪 Testing

To test the API, you can use:

- **Postman** - Import the API endpoints
- **curl** - Command line testing
- **Thunder Client** - VS Code extension
- **Frontend** - Connect your React frontend

### Example API Request

```bash
# Get all items
curl http://localhost:5000/api/items

# Create an item
curl -X POST http://localhost:5000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cappuccino",
    "category": "Coffee",
    "price": 450,
    "costPrice": 150,
    "stock": 30,
    "sku": "CAP-001",
    "description": "Classic Italian cappuccino"
  }'
```

## 📝 Notes

- The server uses Prisma as the ORM for database operations
- All database operations use transactions for data consistency
- Stock is automatically updated when orders are created/completed
- Table status is automatically managed for dine-in orders
- Error handling is centralized in middleware

## 🐛 Troubleshooting

### Database Connection Issues

1. Check PostgreSQL is running:
   ```bash
   # Windows
   Get-Service postgresql*

   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. Verify DATABASE_URL in `.env` is correct

3. Test connection:
   ```bash
   npx prisma db pull
   ```

### Port Already in Use

Change the port in `.env`:
```env
PORT=5001
```

### Prisma Client Not Generated

```bash
npm run prisma:generate
```

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 📄 License

ISC
