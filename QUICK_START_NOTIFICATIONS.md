# Quick Start Guide - Real-Time Notifications

## ⚡ Quick Setup (COMPLETED! ✅)

### ✅ 1. Laravel Reverb - INSTALLED
```powershell
✓ composer require laravel/reverb
✓ composer require pusher/pusher-php-server
✓ php artisan reverb:install
```

### ✅ 2. Environment Variables - CONFIGURED
Your `.env` file has been updated with:
```env
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=868934
REVERB_APP_KEY=utrr3yf1xzpkgx2sxgol
REVERB_APP_SECRET=g0bpyh6dwwsmzfdvcqjk
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

### 3. Start All Services (DO THIS NOW!)
```powershell
# Option A: Use your existing dev command (recommended)
npm run dev

# Option B: Start services individually in 3 terminals
# Terminal 1:
php artisan serve

# Terminal 2:
npm run dev

# Terminal 3:
php artisan reverb:start
```

### 4. Test It!
1. Open browser at http://localhost:8000
2. Login as a student
3. Open another tab, login as coordinator
4. Have coordinator create a defense notification
5. **Watch the student's notification bell update INSTANTLY!** ✨

## 🎯 That's It!

Your notification system now:
- ✅ Updates in real-time (no refresh needed)
- ✅ Shows unread count on bell badge
- ✅ Marks notifications as read when clicked
- ✅ Navigates to the correct dashboard
- ✅ Syncs across all open tabs

## 📖 Need More Details?

See `NOTIFICATION_SYSTEM_IMPLEMENTATION.md` for:
- Complete feature list
- VPS deployment instructions
- Troubleshooting guide
- Architecture diagrams

## 🚨 Common Issues

**Notifications not showing in real-time?**
- Make sure Reverb server is running: `php artisan reverb:start`
- Check `.env` has `BROADCAST_CONNECTION=reverb`

**Bell badge not updating?**
- Clear browser cache and hard refresh (Ctrl+Shift+R)
- Check browser console for errors

**Still having issues?**
- Run: `php artisan config:clear`
- Restart all services
- Check `storage/logs/laravel.log` for errors
