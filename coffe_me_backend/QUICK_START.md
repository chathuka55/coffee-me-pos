# Coffee Me - Quick Start - Running the Backend

## ⚠️ Important: Database Setup Required

Before running the server, you need to set up PostgreSQL:

### Option 1: Use Existing PostgreSQL

1. **Update `.env` file** with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/brewbite_pos?schema=public"
   ```

2. **Create the database:**
   ```sql
   CREATE DATABASE brewbite_pos;
   ```

3. **Run migrations:**
   ```bash
   npm run prisma:migrate
   ```

### Option 2: Use Docker (Easiest)

```bash
# Start PostgreSQL in Docker
docker run --name brewbite-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=brewbite_pos -p 5432:5432 -d postgres

# Update .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/brewbite_pos?schema=public"

# Run migrations
npm run prisma:migrate
```

## 🚀 Starting the Server

### Method 1: Using npm (Recommended)

```bash
cd brew-bite-backend
npm run dev
```

### Method 2: Using PowerShell Script

```powershell
cd brew-bite-backend
.\start-server.ps1
```

### Method 3: Manual Start (to see errors)

```bash
cd brew-bite-backend
npx ts-node src/app.ts
```

## ✅ Verify Server is Running

Once started, you should see:
```
🚀 Server running on http://localhost:5000
📝 Environment: development
🔗 Frontend URL: http://localhost:5173
💾 Database: Configured
```

Then test with:
```bash
curl http://localhost:5000/api/health
```

Or open in browser: http://localhost:5000/api/health

## 🐛 Troubleshooting

### Server Won't Start

1. **Check for errors in terminal** - Look for red error messages
2. **Verify Node.js version**: `node --version` (should be v18+)
3. **Check if port 5000 is in use**: 
   ```powershell
   netstat -ano | findstr :5000
   ```
4. **Verify .env file exists** and has DATABASE_URL

### Database Connection Errors

The server will start even without a database, but API calls will fail. You'll see warnings like:
```
⚠️  Database connection warning: ...
```

**Fix**: Set up PostgreSQL and update DATABASE_URL in `.env`

### Port Already in Use

Change port in `.env`:
```env
PORT=5001
```

## 📝 Next Steps

1. ✅ Set up PostgreSQL database
2. ✅ Update `.env` with DATABASE_URL
3. ✅ Run `npm run prisma:migrate`
4. ✅ Start server with `npm run dev`
5. ✅ Test with `curl http://localhost:5000/api/health`

## 💡 Tip

To see all error messages clearly, run the server in the foreground (not in background):
```bash
npm run dev
```

This will show you exactly what's preventing the server from starting.
