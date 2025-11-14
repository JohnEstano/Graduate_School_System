/**
 * Centralized CSRF Token Management Utility
 * 
 * This utility ensures consistent CSRF token handling across the application.
 * It provides automatic token refresh and retry logic for failed requests.
 */

/**
 * Get the current CSRF token from the meta tag
 */
export function getCsrfToken(): string {
  return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
}

/**
 * Refresh the CSRF token by fetching a new cookie from the server
 */
export async function refreshCsrfToken(): Promise<string> {
  try {
    await fetch('/sanctum/csrf-cookie', { 
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json' }
    });
    
    // Small delay to ensure the cookie is set and meta tag is updated
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const token = getCsrfToken();
    
    if (!token) {
      console.error('⚠️ CSRF token not found after refresh');
    } else {
      console.log('✅ CSRF token refreshed successfully');
    }
    
    return token;
  } catch (err) {
    console.error('❌ Failed to refresh CSRF token:', err);
    return '';
  }
}

/**
 * Fetch with automatic CSRF token handling and retry logic
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options (headers, method, body, etc.)
 * @param maxRetries - Maximum number of retries for 419 errors (default: 1)
 */
export async function fetchWithCsrf(
  url: string, 
  options: RequestInit = {}, 
  maxRetries: number = 1
): Promise<Response> {
  let retries = 0;
  
  // Ensure headers object exists
  if (!options.headers) {
    options.headers = {};
  }
  
  // Get fresh token before first attempt
  const token = await refreshCsrfToken();
  (options.headers as Record<string, string>)['X-CSRF-TOKEN'] = token;
  
  // Always include credentials for CSRF cookie
  options.credentials = 'same-origin';
  
  while (retries <= maxRetries) {
    try {
      console.log(`🔑 Request attempt ${retries + 1}/${maxRetries + 1} to:`, url);
      
      const response = await fetch(url, options);
      
      console.log(`📥 Response status: ${response.status} ${response.statusText}`);
      
      // If we get a 419 (CSRF token mismatch) and we haven't exhausted retries
      if (response.status === 419 && retries < maxRetries) {
        console.warn('⚠️ CSRF token mismatch (419), refreshing token and retrying...');
        retries++;
        
        // Get a completely fresh token
        const freshToken = await refreshCsrfToken();
        (options.headers as Record<string, string>)['X-CSRF-TOKEN'] = freshToken;
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 100));
        
        continue; // Retry the request
      }
      
      // Return the response (success or non-419 error)
      return response;
      
    } catch (err) {
      console.error('❌ Network error:', err);
      
      // If network error and we have retries left, try again
      if (retries < maxRetries) {
        retries++;
        console.log(`🔄 Retrying due to network error... (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 200));
        continue;
      }
      
      // No more retries, throw the error
      throw new Error('Network error: ' + (err as Error).message);
    }
  }
  
  // This should never be reached, but TypeScript requires a return
  throw new Error('Max retries exceeded');
}

/**
 * Helper function for JSON POST requests with CSRF handling
 */
export async function postWithCsrf(url: string, data: any): Promise<Response> {
  return fetchWithCsrf(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

/**
 * Helper function for JSON PATCH requests with CSRF handling
 */
export async function patchWithCsrf(url: string, data: any): Promise<Response> {
  return fetchWithCsrf(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

/**
 * Helper function for FormData POST requests with CSRF handling
 */
export async function postFormWithCsrf(url: string, formData: FormData): Promise<Response> {
  return fetchWithCsrf(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json'
      // Don't set Content-Type for FormData - browser will set it with boundary
    },
    body: formData
  });
}
