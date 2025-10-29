import axios from 'axios';

// Get CSRF token from meta tag
const getCSRFToken = (): string => {
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    return meta?.content || '';
};

// Update CSRF token in meta tag
const updateCSRFToken = (token: string): void => {
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    if (meta) {
        meta.content = token;
    }
};

// Global token refresh state
let isRefreshingCSRF = false;
let refreshPromise: Promise<void> | null = null;

// Refresh CSRF token from server
const refreshCSRFToken = async (): Promise<void> => {
    // If already refreshing, wait for that to complete
    if (isRefreshingCSRF && refreshPromise) {
        return refreshPromise;
    }

    isRefreshingCSRF = true;
    refreshPromise = (async () => {
        try {
            // Fetch fresh CSRF cookie
            await axios.get('/sanctum/csrf-cookie', {
                baseURL: window.location.origin,
                withCredentials: true,
                // Don't use interceptors for this request
                transformRequest: [(data, headers) => {
                    delete headers['X-CSRF-TOKEN'];
                    return data;
                }],
            });

            // Small delay to ensure cookie is processed
            await new Promise(resolve => setTimeout(resolve, 100));

            const newToken = getCSRFToken();
            if (newToken) {
                axios.defaults.headers.common['X-CSRF-TOKEN'] = newToken;
                console.log('✓ CSRF token refreshed');
            }
        } catch (error) {
            console.error('✗ CSRF token refresh failed:', error);
            throw error;
        } finally {
            isRefreshingCSRF = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
};

// Configure axios defaults
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.withCredentials = true;

// Set initial CSRF token
const initialToken = getCSRFToken();
if (initialToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = initialToken;
}

// Request interceptor - ensure fresh token on every request
axios.interceptors.request.use(
    (config) => {
        const token = getCSRFToken();
        if (token && config.url !== '/sanctum/csrf-cookie') {
            config.headers['X-CSRF-TOKEN'] = token;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle 419 errors
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 419 CSRF token mismatch
        if (error.response?.status === 419 && !originalRequest._retry) {
            originalRequest._retry = true;

            console.warn('⚠ CSRF token mismatch on request to:', originalRequest.url);

            try {
                // Refresh the CSRF token
                await refreshCSRFToken();

                // Update the failed request with new token
                const newToken = getCSRFToken();
                if (newToken) {
                    originalRequest.headers['X-CSRF-TOKEN'] = newToken;
                }

                // Retry the original request
                console.log('↻ Retrying request with fresh token...');
                return axios(originalRequest);
            } catch (refreshError) {
                console.error('Failed to refresh CSRF token:', refreshError);
                
                // Only reload if not on login/register pages to avoid loops
                const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].some(
                    path => window.location.pathname.startsWith(path)
                );
                
                if (!isAuthPage) {
                    console.log('Reloading page to get fresh session...');
                    window.location.reload();
                }
                
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

// Export axios instance and utility functions
export default axios;
export { getCSRFToken, updateCSRFToken, refreshCSRFToken };

