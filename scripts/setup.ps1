param(
  [switch]$NoDocker,
  [switch]$NoFirebase
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  El-bannawy Platform - Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: Node.js is not installed." -ForegroundColor Red
  exit 1
}
Write-Host "✓ Node.js $nodeVersion" -ForegroundColor Green

# Check pnpm
$pnpmVersion = pnpm --version
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: pnpm is not installed. Run: npm install -g pnpm" -ForegroundColor Red
  exit 1
}
Write-Host "✓ pnpm $pnpmVersion" -ForegroundColor Green

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: pnpm install failed." -ForegroundColor Red
  exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Generate Prisma client
Write-Host "`nGenerating Prisma client..." -ForegroundColor Yellow
pnpm --filter @el-bannawy/database generate
if ($LASTEXITCODE -ne 0) {
  Write-Host "WARNING: Prisma generation skipped (database may not be configured yet)." -ForegroundColor Yellow
}

# Copy environment files
if (-not (Test-Path -LiteralPath ".env")) {
  if (Test-Path -LiteralPath ".env.example") {
    Copy-Item -LiteralPath ".env.example" -Destination ".env"
    Write-Host "✓ .env created from .env.example" -ForegroundColor Green
  }
}
if (-not (Test-Path -LiteralPath "apps/web/.env.local")) {
  if (Test-Path -LiteralPath "apps/web/.env.local.example" -or (Test-Path -LiteralPath ".env.example")) {
    Write-Host "! apps/web/.env.local not found. Create it from .env.example with your Firebase config." -ForegroundColor Yellow
  }
}

# Check firebase-tools
$firebaseExists = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseExists) {
  Write-Host "WARNING: firebase-tools is not installed. Run: npm install -g firebase-tools" -ForegroundColor Yellow
} else {
  Write-Host "✓ firebase-tools $(firebase --version)" -ForegroundColor Green
}

# Start Docker services
if (-not $NoDocker) {
  $dockerExists = Get-Command docker -ErrorAction SilentlyContinue
  if ($dockerExists) {
    Write-Host "`nStarting Docker services..." -ForegroundColor Yellow
    docker compose -f docker/docker-compose.yml up -d
    if ($LASTEXITCODE -eq 0) {
      Write-Host "✓ Docker services started" -ForegroundColor Green
    } else {
      Write-Host "WARNING: Docker services failed to start." -ForegroundColor Yellow
    }
  } else {
    Write-Host "WARNING: Docker is not installed. Start PostgreSQL and Redis manually." -ForegroundColor Yellow
  }
}

# Firebase emulator setup
if (-not $NoFirebase -and $firebaseExists) {
  Write-Host "`nSetting up Firebase emulators..." -ForegroundColor Yellow
  $emulatorRunning = $null
  $portCheck = Get-NetTCPConnection -LocalPort 9099 -ErrorAction SilentlyContinue
  if ($portCheck) {
    Write-Host "✓ Firebase Auth emulator already running on port 9099" -ForegroundColor Green
    $emulatorRunning = $true
  }
  $portCheck = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
  if ($portCheck) {
    Write-Host "✓ Firestore emulator already running on port 8080" -ForegroundColor Green
    $emulatorRunning = $true
  }
  if (-not $emulatorRunning) {
    Write-Host "  Start emulators with: pnpm firebase:emulators" -ForegroundColor Cyan
    Write-Host "  Then seed data with:  pnpm firebase:seed" -ForegroundColor Cyan
  }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Setup complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
