# Graduate School System - Production Deployment Script
# This script optimizes the entire application for production deployment

Write-Host "=== Graduate School System - Production Deployment ===" -ForegroundColor Green

# Step 1: Clear all caches
Write-Host "Step 1: Clearing all caches..." -ForegroundColor Yellow
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Step 2: Optimize for production
Write-Host "Step 2: Optimizing for production..." -ForegroundColor Yellow
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Step 3: Install production dependencies
Write-Host "Step 3: Installing/updating dependencies..." -ForegroundColor Yellow
composer install --optimize-autoloader --no-dev
npm ci --production

# Step 4: Build frontend assets
Write-Host "Step 4: Building frontend assets..." -ForegroundColor Yellow
npm run build

# Step 5: Set proper file permissions
Write-Host "Step 5: Setting file permissions..." -ForegroundColor Yellow
# Note: On Windows, this is handled differently, but for deployment on Linux:
# chmod -R 755 storage bootstrap/cache

# Step 6: Generate application key if needed
Write-Host "Step 6: Ensuring application key exists..." -ForegroundColor Yellow
php artisan key:generate --show

# Step 7: Run database optimizations
Write-Host "Step 7: Database ready - remember to run production_database_setup.sql in Supabase" -ForegroundColor Yellow

# Step 8: Test the application
Write-Host "Step 8: Starting application server..." -ForegroundColor Yellow
Write-Host "Application will be available at: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server when ready" -ForegroundColor Green

php artisan serve --host=0.0.0.0 --port=8000
