# AI Integration Configuration

This application supports multiple AI providers for financial analysis. You can choose to use either Claude AI or OpenAI (or both as fallbacks).

## API Key Configuration

### Setting Up Your API Keys

1. **Create an `.env.local` file** in the root of your project (if not already created)
2. **Add your API keys** to the file:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Claude API Configuration (Optional)
ANTHROPIC_API_KEY=your_anthropic_api_key

# OpenAI API Configuration (Optional, but recommended)
OPENAI_API_KEY=your_openai_api_key
```

You can use either Claude, OpenAI, or both. The application will automatically:
1. Try Claude first (if configured)
2. Fall back to OpenAI if Claude fails (if configured)
3. Use local calculations as a final fallback

## Database Setup

The application requires Supabase tables for storing financial data and analyses.

### Setting Up the Database

1. **Log in to your Supabase dashboard**
2. **Navigate to the SQL Editor**
3. **Run the setup script** from the `setup-database.sql` file included in this project

This will create:
- `financial_data` table: For storing user financial data
- `financial_analyses` table: For storing AI-generated analyses

## Fallback Mechanism

The application uses a tiered fallback approach:

1. **Claude AI** - Primary AI provider with comprehensive analysis capabilities
2. **OpenAI** - Secondary AI provider used when Claude is unavailable
3. **Local Calculations** - Basic calculations performed client-side when AI is unavailable

### When Using With OpenAI Free Credits

If you're using OpenAI's free tier:

1. Set the `OPENAI_API_KEY` in your `.env.local` file
2. Leave `ANTHROPIC_API_KEY` blank or remove it
3. The application will automatically bypass Claude and use OpenAI directly

## Troubleshooting

### Common Issues

1. **"Using Local Analysis" message appears**
   - Check that your API keys are correctly configured
   - Verify you have sufficient API credits on your account

2. **Data not saving to database**
   - Ensure your Supabase URL and keys are correct
   - Run the database setup script to create the necessary tables
   - Check that your service role key has proper permissions

3. **Error with Claude API**
   - Claude requires a paid subscription - if you're using the free trial, credits may have expired
   - Use OpenAI as an alternative by providing an OpenAI API key

## Advanced Configuration

If you want to modify the AI behavior, you can adjust:

- **Model selection**: Change the model in `src/lib/claude.ts` or `src/lib/openai.ts`
- **Prompt engineering**: Modify the prompts in the financial analysis agent
- **Fallback logic**: Adjust the order of fallbacks in `src/lib/financial-analysis-agent.ts` 