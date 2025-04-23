#!/bin/bash

# Create a script to prepare the application for export to another environment
# This script will:
# 1. Build the application
# 2. Copy necessary files
# 3. Create an export archive

# Ensure the script is run from the project root
if [ ! -f "package.json" ]; then
  echo "Error: This script must be run from the project root"
  exit 1
fi

# Create export directory
EXPORT_DIR="export"
mkdir -p $EXPORT_DIR

echo "Building application..."
npm run build

echo "Copying necessary files..."
cp -r dist $EXPORT_DIR/
cp -r scenarios $EXPORT_DIR/
cp .env.example $EXPORT_DIR/
cp README.md $EXPORT_DIR/
cp Dockerfile $EXPORT_DIR/
cp docker-compose.yml $EXPORT_DIR/

# Create a simplified package.json for production
cat > $EXPORT_DIR/package.json << EOF
{
  "name": "cybersecurity-threat-simulator",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "start": "NODE_ENV=production node dist/server/index.js",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.10.4",
    "connect-pg-simple": "^10.0.0",
    "drizzle-orm": "^0.39.1",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "js-yaml": "^4.1.0",
    "node-cron": "^3.0.3",
    "simple-git": "^3.27.0",
    "ws": "^8.18.0",
    "zod": "^3.24.2"
  }
}
EOF

echo "Creating export archive..."
cd $EXPORT_DIR
tar -czf ../cybersecurity-threat-simulator.tar.gz .
cd ..

echo "Export preparation complete!"
echo "The application is ready for export in cybersecurity-threat-simulator.tar.gz"
echo ""
echo "To deploy in a new environment:"
echo "1. Extract the archive"
echo "2. Copy .env.example to .env and configure the variables"
echo "3. Run 'npm install' to install dependencies"
echo "4. Run 'npm start' to start the application"