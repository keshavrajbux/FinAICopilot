# Database Troubleshooting Guide
## Financial Decision Copilot

This guide addresses issues with financial data not being saved to the Supabase database and provides solutions that have been implemented.

## Fixes Implemented

### 1. Enhanced Error Handling and Diagnostics

We've added comprehensive error handling and troubleshooting utilities to help identify database issues:

- **Database Tester Tool**: A new diagnostics page at `/diagnostics` provides a tool to test your database connection, validate tables, and check environment variables.
- **Detailed Error Logging**: The app now logs detailed information about database operations, making it easier to identify issues.
- **Status Indicators**: Visual indicators show whether data was successfully saved to the database.

### 2. Database API Improvements

The `analyze-finances.ts` API endpoint has been improved:

- **Better Error Checking**: The API now checks if tables exist before attempting to insert data.
- **Environment Variable Verification**: Validates that Supabase credentials are present before operating.
- **Graceful Fallbacks**: Even if database operations fail, the application still provides analysis results to the user.
- **Metadata in Responses**: API responses now include information about whether data was saved successfully.

### 3. Database Setup Tools

We've provided tools to ensure the database is set up correctly:

- **SQL Setup Script**: The `setup-database.sql` file contains the SQL commands to create the necessary tables and policies.
- **Database Setup Node Script**: The `setup-database.js` script automates the creation of tables and can be run with `node setup-database.js`.

## Common Issues and Solutions

### 1. Missing Environment Variables

**Issue**: Supabase URL or keys are not properly configured in `.env.local`.

**Solution**: 
- Check that your `.env.local` file contains the following variables:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
  SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
  ```
- You can use the diagnostics page to verify your environment variables.

### 2. Database Tables Don't Exist

**Issue**: The required `financial_data` and `financial_analyses` tables don't exist in your Supabase project.

**Solution**:
- Run the database setup script: `node setup-database.js`
- Or manually execute the SQL in `setup-database.sql` in your Supabase SQL Editor.

### 3. Row Level Security (RLS) Issues

**Issue**: Data is not being saved due to RLS policy restrictions.

**Solution**:
- The SQL setup script includes policies for both authenticated users and the demo user.
- Make sure policies are set to allow the demo user ID `demo-user-123` to insert data.
- For testing purposes, you can temporarily disable RLS on the tables in the Supabase dashboard.

### 4. Client vs. Admin Supabase Client

**Issue**: The regular client might not have sufficient permissions for some operations.

**Solution**:
- The app now uses the admin client with the service role key when available.
- Ensure your `SUPABASE_SERVICE_ROLE_KEY` is correctly set in the environment variables.

## Verifying the Fix

After applying these fixes:

1. Visit the application and enter financial data
2. Click "Analyze My Finances"
3. Check for the status indicator showing whether data was saved successfully
4. If there are still issues, visit the `/diagnostics` page for detailed troubleshooting

## Fallback Behavior

Even if database saving fails, the application will still:
- Calculate financial metrics
- Generate financial insights
- Display analysis results to the user

This ensures that users can still benefit from the financial analysis features even if there are database connectivity issues.

## Getting Help

If you continue to experience issues:
- Check the browser console (F12) for detailed error messages
- Run the database diagnostics test from the `/diagnostics` page
- Examine the API response in the Network tab of browser dev tools 