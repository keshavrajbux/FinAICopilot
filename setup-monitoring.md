# Setting Up Monitoring for FinAI Agent

## Diagnosing API Fallback Issues

When the application falls back to local calculations instead of using AI services, follow these steps to diagnose:

### 1. Check Vercel Logs

1. Go to your Vercel dashboard: https://vercel.com
2. Select your FinAICopilot project
3. Navigate to "Logs" section
4. Look for console errors containing:
   - "Claude API Error"
   - "API Fallback: Using local calculations"
   - "Client Fallback: Using local calculations"

### 2. Verify Environment Variables

1. In Vercel dashboard, go to "Settings" > "Environment Variables"
2. Ensure the following variables are correctly configured:
   - `ANTHROPIC_API_KEY` - Your valid Claude API key
   - `OPENAI_API_KEY` - Your valid OpenAI API key (optional backup)

### 3. API Key Troubleshooting

If you see API errors:

1. Go to your Anthropic dashboard: https://console.anthropic.com
2. Check if your API key is active and has sufficient quota
3. If using free tier, be aware of rate limits 
4. Generate a new API key if necessary

### 4. Network Configuration

If API calls are failing:

1. Check if your Vercel region is compatible with the API endpoints
2. Ensure there are no network restrictions blocking API access
3. Consider adding a retry mechanism for transient network issues

## Setting Up Error Monitoring

For better visibility, consider integrating:

1. **Sentry**: For real-time error tracking
   - Sign up at https://sentry.io
   - Follow Next.js integration docs

2. **Vercel Analytics**: For performance monitoring
   - Enable in Vercel dashboard under "Analytics"

3. **Custom Logging Solution**:
   - Consider writing errors to a database table
   - Add a simple admin panel to view error logs 