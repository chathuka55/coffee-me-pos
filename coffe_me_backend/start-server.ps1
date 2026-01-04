# Start Backend Server Script
Write-Host "Starting Coffee Me Backend Server..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if Prisma Client is generated
if (-not (Test-Path "src/generated/prisma")) {
    Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
    npx prisma generate
}

Write-Host "Starting server on http://localhost:5000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
npm run dev
