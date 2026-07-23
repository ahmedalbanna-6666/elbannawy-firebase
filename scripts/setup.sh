#!/bin/bash
set -euo pipefail

echo "========================================"
echo "  El-bannawy Platform - Setup Script"
echo "========================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "ERROR: Node.js is not installed."
  exit 1
fi
echo "✓ Node.js $(node --version)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
  echo "ERROR: pnpm is not installed. Run: npm install -g pnpm"
  exit 1
fi
echo "✓ pnpm $(pnpm --version)"

# Install dependencies
echo ""
echo "Installing dependencies..."
pnpm install
echo "✓ Dependencies installed"

# Generate Prisma client
echo ""
echo "Generating Prisma client..."
pnpm --filter @el-bannawy/database generate 2>/dev/null || echo "WARNING: Prisma generation skipped"

# Copy environment files
if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
  echo "✓ .env created from .env.example"
fi
if [ ! -f apps/web/.env.local ]; then
  echo "! apps/web/.env.local not found. Create it from .env.example with your Firebase config."
fi

# Check firebase-tools
if command -v firebase &> /dev/null; then
  echo "✓ firebase-tools $(firebase --version)"
else
  echo "WARNING: firebase-tools is not installed. Run: npm install -g firebase-tools"
fi

# Check Java (required for emulators)
if command -v java &> /dev/null; then
  echo "✓ Java $(java -version 2>&1 | head -1)"
else
  echo "WARNING: Java is not installed. Firebase emulators require Java (JRE 11+)."
  echo "  Install from: https://adoptium.net/"
fi

echo ""
echo "========================================"
echo "  Setup complete!"
echo "========================================"
echo ""
echo "  Start dev server:   pnpm dev"
echo "  Start emulators:    pnpm firebase:emulators"
echo "  Seed data:          pnpm firebase:seed"
echo "  Emulator UI:        http://localhost:4001"