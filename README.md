# CredChain

> Decentralized Freelance Platform with On-Chain Credentials on Solana

CredChain is a blockchain-powered freelance marketplace that combines verifiable skill certification with trustless escrow payments. Built on Solana for speed and low costs, CredChain ensures that credentials can't be faked, payments are secure, and reputation is permanently verifiable on-chain.

![Solana](https://img.shields.io/badge/Solana-14F195?style=for-the-badge&logo=solana&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Anchor](https://img.shields.io/badge/Anchor-8247E5?style=for-the-badge)
![Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
![AI](https://img.shields.io/badge/AI_Powered-Enabled-00D9FF?style=for-the-badge)

## Features

### For Freelancers
- **Skill Certification** - Take on-chain tests and earn NFT badges proving your expertise
- **Work History NFTs** - Every completed project becomes a verifiable certificate in your wallet
- **Milestone-Based Payments** - Get paid automatically as you complete project milestones
- **Reputation System** - Build an immutable reputation score based on real blockchain data

### For Clients
- **Escrow Protection** - Funds are held securely in smart contracts until work is delivered
- **Milestone Management** - Break projects into phases with individual deliverables
- **Dispute Resolution** - Built-in arbitration system for contract disagreements
- **NDA Support** - On-chain NDA signing for confidential projects

### For Employers
- **Instant Verification** - Verify candidate credentials directly from the blockchain
- **Fraud-Proof Credentials** - All badges and certificates are verifiable NFTs
- **Work History Access** - See complete project history with completion rates
- **No Fake Resumes** - Impossible to falsify on-chain credentials

## AI Features (Powered by Google Gemini)

CredChain integrates Google Gemini AI to enhance the freelance experience with intelligent automation. All AI features use the Gemini 2.0 Flash model for fast and accurate responses.

### 1. AI Job Matching 🎯

Intelligently matches freelancers with the most suitable job opportunities based on their skills, badges, and work history.

**Features:**
- Analyzes your verified badges and completed projects
- Scores each job with a fit percentage (0-100%)
- Provides detailed explanations for each match
- Highlights which of your skills align with job requirements
- Shows top 3 personalized recommendations

**Usage:** Navigate to Job Board → Click "Find Best Matches with AI"

### 2. AI Contract Summary 📋

Generates intelligent summaries of contract details, milestones, and risks to help both parties understand agreements quickly.

**Features:**
- Executive overview of contract scope
- Key metrics at a glance (total value, duration, milestones)
- Milestone-by-milestone breakdown
- Risk assessment highlighting potential concerns
- Suggested next steps for both parties

**Usage:** Open any contract → Click "Generate AI Summary"

### 3. AI Job Description Improvement ✨

Helps clients create compelling, clear job postings that attract the right talent.

**Features:**
- Improves job title for clarity and appeal
- Enhances description with better structure and details
- Suggests relevant skills to require
- Provides improvement explanations
- Maintains original intent while optimizing wording

**Usage:** When posting a job → Click "Improve with AI" button

### Performance

- **Speed:** 40-45% faster than alternative AI providers
- **Context:** Handles up to 1 million tokens per request
- **Quality:** Production-grade responses optimized for Web3 use cases

### API Architecture

All AI features use serverless edge functions to protect API keys and ensure security:
- `/api/match-jobs` - Job matching endpoint
- `/api/summarize-contract` - Contract summary endpoint
- `/api/improve-job-description` - Job enhancement endpoint

## Tech Stack

- **Blockchain**: Solana (Devnet)
- **Smart Contracts**: Anchor Framework (Rust)
- **Frontend**: React 18 + TypeScript + Vite
- **Wallet**: Solana Wallet Adapter
- **Styling**: TailwindCSS
- **Storage**: IPFS (via Pinata)
- **State Management**: React Hooks
- **AI**: Google Gemini 2.0 Flash
- **API**: Serverless Edge Functions

## Architecture

CredChain consists of three Solana programs:

1. **Badge NFT Program** (`79s9nmY3ZtsWeKakiBMyagHi6652AGSR413BXRZDZu7Z`)
   - Issues skill verification badges
   - Manages leaderboards
   - Handles badge revocation

2. **Job Board Program** (`mUfeb5rs5gH8n92VCqbuVNWPaU333tM6BhKZvTFEfvd`)
   - Job posting and discovery
   - Badge-gated opportunities
   - Skill-based matching

3. **CredChain Program** (`J4cUiyURTW8woQCsc3YQwPPe2jMr8M27HFKWst468tUk`)
   - Contract creation and management
   - Escrow and milestone payments
   - Dispute resolution

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Solana CLI tools
- A Solana wallet (Phantom, Solflare, etc.)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd realcred/credchain-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file** with your configuration:
   ```env
   # Network Configuration
   VITE_SOLANA_NETWORK=devnet
   VITE_SOLANA_RPC_URL=https://api.devnet.solana.com

   # Program IDs (already configured for devnet)
   VITE_CREDCHAIN_PROGRAM_ID=J4cUiyURTW8woQCsc3YQwPPe2jMr8M27HFKWst468tUk
   VITE_BADGE_NFT_PROGRAM_ID=79s9nmY3ZtsWeKakiBMyagHi6652AGSR413BXRZDZu7Z
   VITE_JOB_BOARD_PROGRAM_ID=mUfeb5rs5gH8n92VCqbuVNWPaU333tM6BhKZvTFEfvd

   # Optional: Add your Pinata JWT for IPFS uploads
   VITE_PINATA_JWT=your_pinata_jwt_here

   # AI Features (Get your key from https://aistudio.google.com/apikey)
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. **Get your Gemini API key** (for AI features):
   - Visit [Google AI Studio](https://aistudio.google.com/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the key and add it to your `.env` file

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:5173`

### Get Devnet SOL

You'll need devnet SOL to interact with the platform:

```bash
solana airdrop 2 <your-wallet-address> --url devnet
```

Or use the [Solana Faucet](https://faucet.solana.com/)

## Usage

### For Freelancers

1. **Get Verified**
   - Navigate to "Verify Skills"
   - Select a skill category
   - Take the certification test
   - Score 70%+ to earn your NFT badge

2. **Create Your Profile**
   - Your badges automatically build your profile
   - Complete contracts to earn completion NFTs
   - Build reputation through quality work

3. **Find Work**
   - Browse the job board
   - Apply to badge-gated positions
   - Accept contracts and sign NDAs

4. **Deliver Work**
   - Submit deliverables for each milestone
   - Upload files to IPFS
   - Wait for client approval and payment

### For Clients

1. **Post a Job**
   - Navigate to "Post Job"
   - Set skill requirements
   - Define budget and timeline

2. **Create a Contract**
   - Go to "Create Contract"
   - Define milestones with amounts
   - Set deadlines and descriptions

3. **Fund Escrow**
   - Deposit total contract amount
   - Funds held securely in smart contract

4. **Manage Milestones**
   - Review deliverables
   - Request revisions (up to 3 per milestone)
   - Approve to release payments

### For Employers

1. **Verify Candidates**
   - Navigate to "Employer Verification"
   - Enter candidate's wallet address
   - View all credentials and work history instantly

2. **Check Reputation**
   - See aggregate reputation score
   - View test scores for each skill
   - Review completed contracts

## Project Structure

```
credchain-frontend/
├── src/
│   ├── components/          # React components
│   │   ├── CompletionNFT.tsx
│   │   ├── DeliverableUpload.tsx
│   │   ├── Layout.tsx
│   │   ├── Navbar.tsx
│   │   └── ToastContainer.tsx
│   ├── config/              # Configuration
│   │   ├── idls.ts         # Program IDLs
│   │   └── programs.ts      # Program addresses & constants
│   ├── hooks/               # Custom React hooks
│   │   ├── usePrograms.ts
│   │   └── useToast.ts
│   ├── pages/               # Page components
│   │   ├── CreateContract.tsx
│   │   ├── ContractDetails.tsx
│   │   ├── Contracts.tsx
│   │   ├── EmployerVerification.tsx
│   │   ├── Home.tsx
│   │   ├── JobBoard.tsx
│   │   ├── Leaderboard.tsx
│   │   └── VerifySkills.tsx
│   ├── utils/               # Utility functions
│   │   ├── badgeHelpers.ts
│   │   └── pdaHelpers.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── idl/                     # Anchor IDL files
│   ├── badge_nft.json
│   ├── credchain.json
│   └── job_board.json
├── public/                  # Static assets
├── .env                     # Environment variables (create from .env.example)
├── .env.example            # Environment template
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Smart Contract Programs

### Badge NFT Program
- **Program ID**: `79s9nmY3ZtsWeKakiBMyagHi6652AGSR413BXRZDZu7Z`
- **Purpose**: Skill verification and badge management
- **Key Functions**:
  - `initializeLeaderboard` - Create skill category leaderboard
  - `createTestSession` - Start a certification test
  - `submitTestAnswers` - Submit test for grading
  - `mintBadge` - Issue NFT badge for passing score
  - `revokeBadge` - Revoke invalid badges (admin)

### Job Board Program
- **Program ID**: `mUfeb5rs5gH8n92VCqbuVNWPaU333tM6BhKZvTFEfvd`
- **Purpose**: Job posting and discovery
- **Key Functions**:
  - `postJob` - Create new job listing
  - `applyToJob` - Submit application
  - `closeJob` - Mark job as filled

### CredChain Program
- **Program ID**: `J4cUiyURTW8woQCsc3YQwPPe2jMr8M27HFKWst468tUk`
- **Purpose**: Contract and payment management
- **Key Functions**:
  - `createContract` - Initialize new contract
  - `signNda` - Sign contract NDA
  - `depositEscrow` - Fund contract escrow
  - `submitDeliverable` - Upload milestone work
  - `requestRevision` - Request changes
  - `approveMilestone` - Approve and release payment
  - `openDispute` - Initiate dispute resolution

## Available Skill Categories

1. **Solana Developer** - Blockchain development, smart contracts, Rust
2. **Frontend Developer** - React, TypeScript, Web3 integration
3. **UI/UX Designer** - User interface and experience design
4. **Content Writer** - Technical writing, documentation
5. **Data Analyst** - Data analysis and visualization
6. **Marketing Specialist** - Digital marketing and growth

## Development

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Configuration

### Environment Variables

All configuration is managed through environment variables in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_SOLANA_NETWORK` | Solana cluster | `devnet` |
| `VITE_SOLANA_RPC_URL` | RPC endpoint | `https://api.devnet.solana.com` |
| `VITE_CREDCHAIN_PROGRAM_ID` | Main program ID | See `.env.example` |
| `VITE_BADGE_NFT_PROGRAM_ID` | Badge program ID | See `.env.example` |
| `VITE_JOB_BOARD_PROGRAM_ID` | Job board program ID | See `.env.example` |
| `VITE_PINATA_JWT` | Pinata API key (optional) | - |
| `VITE_PINATA_GATEWAY_URL` | IPFS gateway | `https://gateway.pinata.cloud` |
| `VITE_PINATA_API_URL` | Pinata API URL | `https://api.pinata.cloud` |
| `GEMINI_API_KEY` | Google Gemini AI key | Get from [AI Studio](https://aistudio.google.com/apikey) |

### Deploying to Mainnet

1. Update `.env` with mainnet program IDs
2. Change `VITE_SOLANA_NETWORK` to `mainnet-beta`
3. Update `VITE_SOLANA_RPC_URL` to mainnet RPC
4. Rebuild and deploy

## Troubleshooting

### Wallet Connection Issues
- Ensure your wallet is set to Devnet
- Try refreshing the page after connecting
- Check browser console for errors

### Transaction Failures
- Ensure you have enough SOL for transaction fees
- Check that accounts have been initialized
- Verify contract status before performing actions

### Badge Not Appearing
- Wait a few seconds for blockchain confirmation
- Check transaction on Solana Explorer
- Verify you passed the test (70%+ required)

### IPFS Upload Errors
- Add your Pinata JWT to `.env`
- Check file size (max 100MB)
- Verify internet connection

## Security Considerations

- **Never share your private keys**
- **Review all transactions before signing**
- **Use reputable RPC providers**
- **Verify contract details before depositing funds**
- **This is a devnet demo - don't use real funds**

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- [ ] Mainnet deployment
- [ ] Multi-token payment support (USDC, USDT)
- [ ] Advanced dispute resolution with arbitrators
- [ ] Team contracts with multiple freelancers
- [ ] Recurring contracts/retainers
- [ ] Reputation-based fee discounts
- [ ] Mobile app (React Native)
- [ ] Integration with traditional payment systems

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- **Documentation**: See [DOCUMENTATION.md](./DOCUMENTATION.md)
- **Issues**: [GitHub Issues](<repository-url>/issues)
- **Discord**: [Join our community](<discord-link>)
- **Twitter**: [@CredChain](<twitter-link>)

## Acknowledgments

- Built with [Anchor Framework](https://www.anchor-lang.com/)
- Powered by [Solana](https://solana.com/)
- IPFS storage via [Pinata](https://pinata.cloud/)
- UI inspired by modern Web3 design patterns

---

**Disclaimer**: This is a demonstration project on Solana Devnet. Do not use with real funds or sensitive information. Always audit smart contracts before mainnet deployment.
