import '../css/app.css';
import './lib/axios'; // Initialize axios with CSRF handling

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { refreshCSRFToken, getCSRFToken } from './lib/axios';
import axios from 'axios';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// CRITICAL: Ensure fresh CSRF token on app initialization
(async () => {
    try {
        // Force refresh CSRF token when app loads
        await refreshCSRFToken();
        console.log('✓ App initialized with fresh CSRF token');
    } catch (error) {
        console.error('⚠ Failed to initialize CSRF token:', error);
    }
})();

// Set up Inertia to handle CSRF tokens properly
createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// Inertia event listeners for CSRF token management
router.on('navigate', (event) => {
    // Update CSRF token after each navigation
    const currentToken = getCSRFToken();
    if (currentToken) {
        axios.defaults.headers.common['X-CSRF-TOKEN'] = currentToken;
    }
});

router.on('success', (event) => {
    // After successful Inertia request, check if server sent updated token
    const page = event.detail.page;
    if (page?.props) {
        // Check if server sent a csrf_token in props
        const csrfToken = (page.props as any).csrf_token;
        if (csrfToken) {
            // Update meta tag with server-provided token
            const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
            if (meta) {
                meta.content = csrfToken;
                axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
                console.log('✓ CSRF token synced from server');
            }
        } else {
            // Fallback: read from meta tag
            const currentToken = getCSRFToken();
            if (currentToken) {
                axios.defaults.headers.common['X-CSRF-TOKEN'] = currentToken;
            }
        }
    }
});

router.on('error', async (event) => {
    // Check if this is a CSRF error (419)
    // Inertia passes errors in event.detail.errors
    const errors = event.detail.errors;
    
    // Check for 419 status in the response
    // @ts-ignore - Inertia may include status in errors object
    const status = errors?.__status || (window as any).__inertia_csrf_error_status;
    
    if (status === 419 || (errors && typeof errors === 'object' && Object.keys(errors).length === 0)) {
        console.warn('⚠ CSRF token mismatch detected - refreshing token...');
        
        try {
            await refreshCSRFToken();
            
            // Retry the request after token refresh
            console.log('Retrying request after token refresh...');
            
            // Reload the current page to retry with fresh token
            router.reload({
                only: [],
            });
        } catch (error) {
            console.error('Failed to recover from CSRF error:', error);
            // If on login page, don't reload to avoid loops
            if (window.location.pathname !== '/login') {
                window.location.reload();
            }
        }
    }
});

// Refresh CSRF token on page visibility change (user returns to tab)
document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
        // Page is now visible - refresh token if it might be stale
        const currentToken = getCSRFToken();
        if (currentToken) {
            console.log('Page became visible - ensuring token is fresh');
            try {
                await refreshCSRFToken();
            } catch (error) {
                console.error('Failed to refresh token on visibility change:', error);
            }
        }
    }
});

// Refresh CSRF token periodically (every 30 minutes)
const TOKEN_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
setInterval(async () => {
    try {
        console.log('Periodic CSRF token refresh...');
        await refreshCSRFToken();
    } catch (error) {
        console.error('Periodic token refresh failed:', error);
    }
}, TOKEN_REFRESH_INTERVAL);

// This will set light / dark mode on load...
initializeTheme();

// Export the refresh function for manual use if needed
(window as any).refreshCSRFToken = refreshCSRFToken;
