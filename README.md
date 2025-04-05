# 🤖 Financial Decision Copilot

<div align="center">

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)

An intelligent financial assistant powered by Claude and OpenAI that helps users make informed financial decisions through comprehensive analysis and personalized recommendations.

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black.svg)](https://finaicopilot.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-blue.svg)](https://github.com/keshavrajbux/FinAICopilot)

</div>

## 🌟 Features

### 💰 Financial Analysis
- **Spending Pattern Analysis**
  - Transaction categorization
  - Budget optimization
  - Recurring expense tracking
  - Savings recommendations

- **Investment Portfolio Analysis**
  - Performance tracking
  - Risk assessment
  - Portfolio rebalancing
  - Market opportunity monitoring

- **Scenario Planning**
  - Financial projections
  - Risk simulation
  - Goal achievement tracking
  - Strategy optimization

### 🛡️ Security & Privacy
- End-to-end encryption
- Secure data handling
- Privacy-first approach
- No real financial data required for testing

### 🎯 Demo Mode
- Risk-free testing environment
- Pre-configured scenarios
- Real-time analysis
- Interactive visualizations

### 🧠 Multi-AI Provider Support
- Primary analysis with Claude AI
- Fallback to OpenAI when needed
- Local calculations as final fallback
- Enhanced error handling and logging

## 🚀 Tech Stack

<div align="center">

| Frontend | Backend | Database | AI/ML | Deployment |
|----------|---------|----------|-------|------------|
| Next.js | Next.js API Routes | Supabase | Claude AI | Vercel |
| Chakra UI | TypeScript | PostgreSQL | OpenAI | Edge Functions |
| React | Serverless | Row-level Security | Tiered Fallbacks | Serverless |

</div>

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/keshavrajbux/FinAICopilot.git
cd FinAICopilot

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

## ⚙️ Configuration

Edit the `.env.local` file with your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Claude API Configuration (Primary)
ANTHROPIC_API_KEY=your_anthropic_api_key

# OpenAI API Configuration (Fallback)
OPENAI_API_KEY=your_openai_api_key

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

You can use either Claude, OpenAI, or both. The application will automatically:
1. Try Claude first (if configured)
2. Fall back to OpenAI if Claude fails (if configured)
3. Use local calculations as a final fallback

## 🎮 Usage

### Development
```bash
# Start the development server
npm run dev
```

### Production Build
```bash
# Build for production
npm run build

# Start the production server
npm start
```

### Testing
```bash
# Run tests
npm test
```

## 🏗️ Project Structure

```
FinAICopilot/
├── src/
│   ├── components/           # React components
│   ├── lib/                  # Utilities and business logic
│   │   ├── claude.ts         # Claude API client
│   │   ├── openai.ts         # OpenAI API client
│   │   ├── supabase.ts       # Supabase client
│   │   └── financial-analysis-agent.ts # Specialized agent
│   ├── pages/
│   │   ├── api/              # API routes (serverless functions)
│   │   │   ├── analyze-finances.ts # Financial analysis endpoint
│   │   │   └── get-financial-data.ts # Data retrieval endpoint
│   │   ├── _app.tsx          # App component with providers
│   │   └── index.tsx         # Main application page
│   └── styles/
│       └── globals.css       # Global styles
├── public/                   # Static assets
├── .env.example              # Example environment variables
├── .gitattributes            # Git line ending configuration
├── .gitignore                # Files to exclude from Git
├── next.config.js            # Next.js configuration
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── setup-monitoring.md       # Documentation for monitoring setup
├── DATABASE_SETUP.md         # Database setup instructions
├── AI-CONFIG-README.md       # AI configuration documentation
└── vercel.json               # Vercel deployment configuration
```

## 🧪 Supabase Database Setup

The application requires two tables in your Supabase database:

### 1. financial_data
```sql
CREATE TABLE financial_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  financial_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index on user_id for query performance
CREATE INDEX financial_data_user_id_idx ON financial_data(user_id);
```

### 2. financial_analyses
```sql
CREATE TABLE financial_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index on user_id for query performance
CREATE INDEX financial_analyses_user_id_idx ON financial_analyses(user_id);
```

## 🚀 Deployment

### Deploying to Vercel

1. Connect your GitHub repository to Vercel
2. Configure environment variables in the Vercel dashboard:
   - Add all variables from your `.env.local` file
3. Deploy your application
4. Monitor logs for any AI service connection issues

For more detailed error tracking, see `setup-monitoring.md`.

## 📊 Error Handling and Monitoring

The application includes a robust error handling system:

1. **Tiered AI Fallbacks**:
   - Claude AI → OpenAI → Local Calculations
   - Graceful degradation of service

2. **Enhanced Logging**:
   - Detailed error information in server logs
   - User-friendly error messages
   - Console logging for debugging

3. **Monitoring Setup**:
   - See `setup-monitoring.md` for configuration details
   - Vercel logs integration
   - Optional Sentry integration

## 🔄 Git Configuration

This project uses a `.gitattributes` file to ensure consistent line endings across different operating systems. This prevents CRLF/LF issues when collaborating.

For Windows users:
```bash
git config core.autocrlf input
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Anthropic for the Claude AI API
- OpenAI for the GPT API
- Supabase for the database and authentication
- Chakra UI for the component library
- Vercel for hosting and deployment

---

<div align="center">

Made by Keshav Rajbux

[![Twitter](https://img.shields.io/badge/Twitter-@keshavrajbux-blue.svg)](https://twitter.com/keshavrajbux)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Keshav%20Rajbux-blue.svg)](https://linkedin.com/in/keshavrajbux)

</div> 
