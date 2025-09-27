#!/bin/bash

# BuildaQuest Deployment Script
# This script helps deploy the platform to production

set -e

echo "🗺️ BuildaQuest Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.local exists
if [ ! -f .env.local ]; then
    print_warning ".env.local not found. Creating from example..."
    cp .env.example .env.local
    print_warning "Please edit .env.local with your actual values before continuing."
    read -p "Press enter when ready to continue..."
fi

print_status "Checking dependencies..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_NODE="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE" ]; then
    print_error "Node.js $REQUIRED_NODE or higher is required. Current: $NODE_VERSION"
    exit 1
fi

print_success "Node.js version check passed"

# Install dependencies
print_status "Installing dependencies..."
npm install

# Build the project
print_status "Building the project..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

print_status "Checking environment variables..."

# Read environment variables
source .env.local

MISSING_VARS=()

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    MISSING_VARS+=("NEXT_PUBLIC_SUPABASE_URL")
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    MISSING_VARS+=("NEXT_PUBLIC_SUPABASE_ANON_KEY")
fi

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    print_error "Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

print_success "Environment variables check passed"

# Deploy to Vercel
print_status "Deploying to Vercel..."

# Check if this is first deployment
if [ ! -f .vercel/project.json ]; then
    print_status "First time deployment detected"
    vercel --prod
else
    print_status "Redeploying existing project"
    vercel --prod
fi

if [ $? -eq 0 ]; then
    print_success "Deployment completed successfully!"
    echo ""
    echo "🎉 Your BuildaQuest platform is now live!"
    echo ""
    echo "Next steps:"
    echo "1. Test the authentication flow"
    echo "2. Create your first hunt model in /admin"
    echo "3. Set up your first event in /dashboard"
    echo "4. Test the mobile player experience"
    echo ""
    echo "Don't forget to:"
    echo "- Set up your Stripe webhooks if using payments"
    echo "- Configure your custom domain if needed"
    echo "- Test on mobile devices"
    echo ""
else
    print_error "Deployment failed"
    exit 1
fi