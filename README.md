# 🤖 Financial Decision Copilot

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)

An intelligent financial assistant powered by Claude AI that helps users make informed financial decisions through comprehensive analysis and personalized recommendations.

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black.svg)](https://your-deployment-url.vercel.app)
[![Documentation](https://img.shields.io/badge/Docs-Read-blue.svg)](https://your-docs-url.com)

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

## 🚀 Tech Stack

<div align="center">

| Frontend | Backend | Database | AI/ML | Deployment |
|----------|---------|----------|-------|------------|
| Next.js | Next.js API Routes | Supabase | Claude AI | Vercel |
| Chakra UI | TypeScript | PostgreSQL | Anthropic SDK | Edge Functions |
| React | Serverless | Row-level Security | - | Serverless |

</div>

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/FinAICopilot.git
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

# Claude API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

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
├── next.config.js            # Next.js configuration
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
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

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to Vercel
vercel
```

Or simply push to your GitHub repository and connect it to Vercel for automatic deployments.

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
- Supabase for the database and authentication
- Chakra UI for the component library
- Vercel for hosting and deployment

---

<div align="center">

Made by Keshav Rajbux

[![Twitter](https://img.shields.io/badge/Twitter-@yourhandle-blue.svg)](https://twitter.com/yourhandle)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Your%20Name-blue.svg)](https://linkedin.com/in/yourprofile)

</div> 
