<?php

namespace App\Jobs\Middleware;

use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Cache;

class RateLimitEmails
{
    /**
     * Process the queued job.
     *
     * @param  mixed  $job
     * @param  callable  $next
     * @return mixed
     */
    public function handle($job, $next)
    {
        // Resend API limit: 2 requests per second
        // We'll use a sliding window approach with cache
        $key = 'email_rate_limit';
        $maxAttempts = 2; // Max 2 emails per second
        $decaySeconds = 1; // Per second
        
        // Get current attempts in the last second
        $attempts = Cache::get($key, 0);
        
        if ($attempts >= $maxAttempts) {
            // Rate limit exceeded, release job back to queue with delay
            // Release for 1 second to respect the rate limit
            return $job->release(1);
        }
        
        // Increment the counter
        Cache::put($key, $attempts + 1, now()->addSeconds($decaySeconds));
        
        // Process the job
        return $next($job);
    }
}
