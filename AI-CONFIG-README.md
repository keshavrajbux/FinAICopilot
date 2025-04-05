# Financial Decision Copilot - AI Configuration Guide

This guide explains how to set up and utilize the AI capabilities in the Financial Decision Copilot, including API configurations and troubleshooting.

## API Keys and Environment Configuration

To get started, you need to set up your environment variables:

1. Create a `.env.local` file in the root directory of the project
2. Add the following variables:

```
# Supabase Configuration (for data storage)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI API Configuration (primary provider)
OPENAI_API_KEY=your_openai_api_key

# Claude API Configuration (secondary/fallback provider)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## AI Provider Prioritization

The Financial Decision Copilot now uses a tiered approach for financial analysis:

1. **Primary: OpenAI API** - The application first attempts to use OpenAI for analysis
2. **Secondary: Claude API** - If OpenAI fails, the app falls back to using Claude
3. **Final Fallback: Local Calculations** - If both APIs fail, the app uses local calculations

## Database Setup

The application stores financial data and analysis results in Supabase. To set up your database:

1. Create a Supabase account and project at [supabase.com](https://supabase.com)
2. Get your project URL and API keys from the Supabase dashboard
3. Run the database setup script: `node setup-database.js`

## Troubleshooting Common Issues

### API Key Issues

- **OpenAI API Errors**: Ensure your OpenAI API key is valid and has sufficient credits. The app will fall back to Claude if there are issues.
- **Claude API Errors**: If you see "Claude API Error" messages, check that your Anthropic API key is correctly set and has sufficient usage limits.
- **Missing API Keys**: If you don't configure any AI provider keys, the application will use local calculations only.

### Database Issues

- **Data Not Saving**: Check your Supabase configuration in the `.env.local` file
- **Table Not Found**: Run the database setup script to create the required tables
- **Permission Denied**: Ensure Row Level Security (RLS) policies are correctly set up

## Advanced Configuration

### Switching AI Providers

While OpenAI is now the default, you can adjust the prioritization:

1. To use Claude as primary again, modify the `analyze` method in `src/lib/financial-analysis-agent.ts`
2. To use only one provider, simply omit the API key for the provider you don't want to use

### Model Selection

- OpenAI: You can change the OpenAI model used in `src/lib/openai.ts` (default is `gpt-3.5-turbo`)
- Claude: You can change the Claude model used in `src/lib/claude.ts` (default is `claude-3-haiku-20240307`)

## Using Development Mode

Access development tools and diagnostics by:

1. Adding `?devMode=true` to any page URL
2. Setting `NODE_ENV=development` in your environment

This will show additional technical information and debugging options in the UI. 