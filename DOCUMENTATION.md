# CredChain - Complete Technical Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Smart Contracts](#smart-contracts)
4. [Frontend Application](#frontend-application)
5. [AI Features](#ai-features)
6. [Data Models](#data-models)
7. [API Reference](#api-reference)
8. [Integration Guide](#integration-guide)
9. [Security](#security)
10. [Testing](#testing)
11. [Deployment](#deployment)

---

## Overview

### What is CredChain?

CredChain is a decentralized freelance marketplace built on Solana that solves three critical problems in the gig economy:

1. **Trust Problem**: Fake credentials and inflated resumes
2. **Payment Problem**: Clients not paying or freelancers not delivering
3. **Verification Problem**: No universal way to verify skills and work history

### How It Works

```
┌─────────────────┐
│   Freelancer    │
└────────┬────────┘
         │
         │ 1. Takes Test
         ▼
┌─────────────────┐      2. Score ≥70%      ┌─────────────────┐
│  Badge NFT      │ ◄─────────────────────► │   Blockchain    │
│   Program       │                          │   (Solana)      │
└─────────────────┘                          └─────────────────┘
         │
         │ 3. Badge Minted
         ▼
┌─────────────────┐
│  NFT Badge in   │
│  Wallet         │
└─────────────────┘
```

**Contract Workflow:**

```
Client creates contract → Deposits to escrow → Freelancer signs NDA
     ↓                           ↓
Freelancer works        Funds locked safely
     ↓                           ↓
Submits milestone       Client reviews
     ↓                           ↓
Client approves         Payment auto-released
     ↓                           ↓
Completion NFT          Reputation updated
```

---

## Architecture

### System Components

```
┌──────────────────────────────────────────────────────────┐
│                     Frontend (React)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Verify    │  │   Job       │  │  Contracts  │     │
│  │   Skills    │  │   Board     │  │  Manager    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└──────────────────────────────────────────────────────────┘
         │                   │                   │
         │                   │ Fetch API         │
         │ Web3 Adapter      ▼                   │
         │            ┌──────────────┐           │
         │            │   Vercel     │           │
         │            │  Serverless  │           │
         │            │  Functions   │           │
         │            └──────────────┘           │
         │                   │                   │
         │                   │ Google Gemini API │
         │                   ▼                   │
         │            ┌──────────────┐           │
         │            │   Gemini     │           │
         │            │  2.0 Flash   │           │
         │            └──────────────┘           │
         │                                       │
         ▼                                       ▼
┌──────────────────────────────────────────────────────────┐
│                   Solana Blockchain                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Badge NFT  │  │  Job Board  │  │  CredChain  │     │
│  │  Program    │  │  Program    │  │  Program    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                   IPFS Storage (Pinata)                   │
│              Deliverables, Metadata, Files                │
└──────────────────────────────────────────────────────────┘
```

### Technology Stack

**Blockchain Layer:**
- Solana (Devnet/Mainnet)
- Anchor Framework v0.29+
- Rust for smart contracts

**Frontend Layer:**
- React 18.3
- TypeScript 5.5
- Vite 7.1
- TailwindCSS 3.4

**Integration Layer:**
- @solana/web3.js 1.95
- @solana/wallet-adapter 0.19
- @coral-xyz/anchor 0.30

**Storage Layer:**
- IPFS via Pinata
- LocalStorage for client-side caching

**AI Layer:**
- Google Gemini 2.0 Flash
- Serverless Edge Functions
- @google/generative-ai SDK 0.21+

---

## Smart Contracts

### 1. Badge NFT Program

**Program ID**: `79s9nmY3ZtsWeKakiBMyagHi6652AGSR413BXRZDZu7Z`

#### Purpose
Manages skill verification through testing and badge issuance.

#### Key Accounts

```rust
#[account]
pub struct Badge {
    pub authority: Pubkey,           // Badge program authority
    pub user: Pubkey,                // Badge owner
    pub mint: Pubkey,                // NFT mint address
    pub skill_category: SkillCategory,
    pub test_score: u8,              // 0-100
    pub issue_date: i64,             // Unix timestamp
    pub expiry_date: i64,            // Unix timestamp
    pub is_valid: bool,              // Active status
    pub revoked: bool,               // Revocation flag
    pub metadata_uri: String,        // IPFS metadata link
    pub bump: u8,                    // PDA bump
}

#[account]
pub struct TestSession {
    pub user: Pubkey,
    pub skill_category: SkillCategory,
    pub start_time: i64,
    pub submitted: bool,
    pub score: u8,
    pub bump: u8,
}

#[account]
pub struct Leaderboard {
    pub skill_category: SkillCategory,
    pub entries: Vec<LeaderboardEntry>,  // Top performers
    pub total_badges: u64,
    pub bump: u8,
}
```

#### Instructions

##### `initialize_leaderboard`
```rust
pub fn initialize_leaderboard(
    ctx: Context<InitializeLeaderboard>,
    skill_category: SkillCategory,
) -> Result<()>
```
**Purpose**: Create a leaderboard for a skill category
**Access**: Admin only
**Accounts**:
- `authority` (signer): Admin wallet
- `leaderboard`: Leaderboard PDA
- `system_program`: System program

##### `create_test_session`
```rust
pub fn create_test_session(
    ctx: Context<CreateTestSession>,
    skill_category: SkillCategory,
) -> Result<()>
```
**Purpose**: Start a certification test
**Accounts**:
- `user` (signer): Test taker
- `test_session`: Test session PDA
- `system_program`: System program

##### `submit_test_answers`
```rust
pub fn submit_test_answers(
    ctx: Context<SubmitTestAnswers>,
    answers: Vec<u8>,
) -> Result<()>
```
**Purpose**: Submit test for grading
**Validation**: Time limit, answer format
**Accounts**:
- `user` (signer): Test taker
- `test_session`: Test session PDA

##### `mint_badge`
```rust
pub fn mint_badge(
    ctx: Context<MintBadge>,
    metadata_uri: String,
) -> Result<()>
```
**Purpose**: Issue NFT badge for passing score
**Requirement**: Test score ≥ 70%
**Accounts**:
- `user` (signer): Badge recipient
- `badge`: Badge account PDA
- `mint`: NFT mint PDA
- `user_token_account`: User's token account
- `metadata`: Metaplex metadata account
- `leaderboard`: Skill leaderboard
- `authority`: Badge authority PDA
- `token_program`: SPL Token program
- `metadata_program`: Metaplex Metadata program

##### `revoke_badge`
```rust
pub fn revoke_badge(
    ctx: Context<RevokeBadge>,
) -> Result<()>
```
**Purpose**: Revoke fraudulent badges
**Access**: Admin only
**Accounts**:
- `authority` (signer): Admin wallet
- `badge`: Badge account

#### PDA Seeds

```typescript
// Badge Account
['badge', userPublicKey, skillCategory]

// Badge Mint
['badge-mint', userPublicKey, skillCategory]

// Test Session
['test-session', userPublicKey, skillCategory]

// Leaderboard
['leaderboard', skillCategory]

// Authority
['authority']
```

---

### 2. Job Board Program

**Program ID**: `mUfeb5rs5gH8n92VCqbuVNWPaU333tM6BhKZvTFEfvd`

#### Purpose
Job posting and discovery with badge-gated positions.

#### Key Accounts

```rust
#[account]
pub struct Job {
    pub job_id: String,              // Unique identifier
    pub employer: Pubkey,            // Job poster
    pub title: String,               // Job title (max 64 chars)
    pub description: String,         // Description (max 500 chars)
    pub required_skills: Vec<SkillCategory>,
    pub budget: u64,                 // In lamports
    pub payment_token: Pubkey,       // SPL token or native SOL
    pub deadline: i64,               // Unix timestamp
    pub status: JobStatus,           // Open, Filled, Cancelled
    pub applicants: Vec<Pubkey>,     // Applicant addresses
    pub created_at: i64,
    pub bump: u8,
}

#[account]
pub struct JobApplication {
    pub job: Pubkey,                 // Job account
    pub applicant: Pubkey,           // Applicant address
    pub cover_letter: String,        // Cover letter (max 500 chars)
    pub proposed_rate: u64,
    pub badges: Vec<Pubkey>,         // Badge proofs
    pub status: ApplicationStatus,
    pub applied_at: i64,
    pub bump: u8,
}
```

#### Instructions

##### `post_job`
```rust
pub fn post_job(
    ctx: Context<PostJob>,
    job_id: String,
    title: String,
    description: String,
    required_skills: Vec<SkillCategory>,
    budget: u64,
    payment_token: Pubkey,
    deadline: i64,
) -> Result<()>
```
**Purpose**: Create a new job listing
**Validation**: Title/description length, budget > 0
**Accounts**:
- `employer` (signer): Job poster
- `job`: Job account PDA
- `system_program`: System program

##### `apply_to_job`
```rust
pub fn apply_to_job(
    ctx: Context<ApplyToJob>,
    cover_letter: String,
    proposed_rate: u64,
    badge_addresses: Vec<Pubkey>,
) -> Result<()>
```
**Purpose**: Submit job application
**Validation**: Badge verification, skills match
**Accounts**:
- `applicant` (signer): Applicant
- `job`: Job account
- `application`: Application PDA
- `badges`: Badge accounts (remaining accounts)

##### `close_job`
```rust
pub fn close_job(
    ctx: Context<CloseJob>,
) -> Result<()>
```
**Purpose**: Mark job as filled/cancelled
**Access**: Job poster only
**Accounts**:
- `employer` (signer): Job poster
- `job`: Job account

---

### 3. CredChain Program

**Program ID**: `J4cUiyURTW8woQCsc3YQwPPe2jMr8M27HFKWst468tUk`

#### Purpose
Contract lifecycle management, escrow, and payments.

#### Key Accounts

```rust
#[account]
pub struct Contract {
    pub contract_id: String,         // Unique identifier
    pub client: Pubkey,              // Client address
    pub freelancer: Pubkey,          // Freelancer address
    pub title: String,               // Contract title (max 64)
    pub description: String,         // Description (max 200)
    pub total_amount: u64,           // Total contract value
    pub paid_amount: u64,            // Amount paid so far
    pub payment_token: Pubkey,       // SPL token or native SOL
    pub status: ContractStatus,      // Active, Funded, InProgress, etc.
    pub milestones: Vec<Milestone>,  // Up to 5 milestones
    pub nda_signed_client: bool,
    pub nda_signed_freelancer: bool,
    pub created_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Milestone {
    pub title: String,               // Milestone title (max 64)
    pub description: String,         // Description (max 150)
    pub amount: u64,                 // Milestone payment
    pub deadline: i64,               // Unix timestamp
    pub status: MilestoneStatus,     // Pending, UnderReview, etc.
    pub deliverables: Vec<Deliverable>,
    pub revision_count: u8,          // Max 3 revisions
    pub completed_at: Option<i64>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Deliverable {
    pub ipfs_hash: String,           // IPFS content hash
    pub file_name: String,
    pub description: String,
    pub uploaded_at: i64,
}

#[account]
pub struct Dispute {
    pub contract: Pubkey,            // Contract account
    pub initiator: Pubkey,           // Who opened dispute
    pub category: DisputeCategory,   // Quality, Deadline, etc.
    pub reason: String,              // Summary (max 100)
    pub description: String,         // Details (max 1000)
    pub status: DisputeStatus,       // Open, UnderReview, Resolved
    pub evidence: Vec<String>,       // IPFS hashes
    pub opened_at: i64,
    pub resolved_at: Option<i64>,
    pub resolution_notes: Option<String>,
    pub bump: u8,
}
```

#### Instructions

##### `create_contract`
```rust
pub fn create_contract(
    ctx: Context<CreateContract>,
    contract_id: String,
    title: String,
    description: String,
    freelancer: Pubkey,
    payment_token: Pubkey,
    milestones: Vec<MilestoneInput>,
) -> Result<()>
```
**Purpose**: Initialize a new contract
**Validation**: 1-5 milestones, amounts > 0
**Accounts**:
- `client` (signer): Client
- `contract`: Contract PDA
- `system_program`: System program

##### `sign_nda`
```rust
pub fn sign_nda(
    ctx: Context<SignNda>,
) -> Result<()>
```
**Purpose**: Cryptographically sign NDA
**Accounts**:
- `signer` (signer): Client or freelancer
- `contract`: Contract account

##### `deposit_escrow`
```rust
pub fn deposit_escrow(
    ctx: Context<DepositEscrow>,
    amount: u64,
) -> Result<()>
```
**Purpose**: Fund contract escrow
**Requirement**: Both parties signed NDA
**Accounts**:
- `client` (signer): Client
- `contract`: Contract account
- `client_token_account`: Client's token account
- `escrow_token_account`: Escrow token account
- `token_program`: SPL Token program

##### `submit_deliverable`
```rust
pub fn submit_deliverable(
    ctx: Context<SubmitDeliverable>,
    milestone_index: u8,
    ipfs_hash: String,
    file_name: String,
    description: String,
) -> Result<()>
```
**Purpose**: Upload milestone work
**Validation**: Milestone pending or revision requested
**Accounts**:
- `freelancer` (signer): Freelancer
- `contract`: Contract account

##### `request_revision`
```rust
pub fn request_revision(
    ctx: Context<RequestRevision>,
    milestone_index: u8,
    reason: String,
) -> Result<()>
```
**Purpose**: Request changes to deliverable
**Limit**: Max 3 revisions per milestone
**Accounts**:
- `client` (signer): Client
- `contract`: Contract account

##### `approve_milestone`
```rust
pub fn approve_milestone(
    ctx: Context<ApproveMilestone>,
    milestone_index: u8,
) -> Result<()>
```
**Purpose**: Approve milestone and release payment
**Effect**: Transfers milestone amount to freelancer
**Accounts**:
- `client` (signer): Client
- `contract`: Contract account
- `escrow_token_account`: Escrow token account
- `freelancer_token_account`: Freelancer's token account
- `token_program`: SPL Token program

##### `open_dispute`
```rust
pub fn open_dispute(
    ctx: Context<OpenDispute>,
    category: DisputeCategory,
    reason: String,
    description: String,
) -> Result<()>
```
**Purpose**: Initiate dispute resolution
**Effect**: Pauses contract
**Accounts**:
- `initiator` (signer): Client or freelancer
- `contract`: Contract account
- `dispute`: Dispute PDA
- `system_program`: System program

#### Contract States

```
Active → Funded → InProgress → Completed
   ↓        ↓          ↓
Cancelled  Disputed   Disputed
```

#### Milestone States

```
Pending → UnderReview → Completed
   ↓            ↓
Cancelled  RevisionRequested
              ↓
         (back to Pending)
```

#### PDA Seeds

```typescript
// Contract
['contract', contractId]

// Dispute
['dispute', contractPublicKey]
```

---

## Frontend Application

### Project Structure

```
src/
├── components/
│   ├── CompletionNFT.tsx        # Contract completion certificate
│   ├── DeliverableUpload.tsx    # IPFS file upload
│   ├── Layout.tsx               # App layout wrapper
│   ├── Navbar.tsx               # Navigation bar
│   └── ToastContainer.tsx       # Toast notifications
├── config/
│   ├── idls.ts                  # Program IDLs
│   └── programs.ts              # Addresses & constants
├── hooks/
│   ├── usePrograms.ts           # Program instances hook
│   └── useToast.ts              # Toast notifications hook
├── pages/
│   ├── CreateContract.tsx       # Contract creation form
│   ├── ContractDetails.tsx      # Contract management
│   ├── Contracts.tsx            # Contract list
│   ├── EmployerVerification.tsx # Credential verification
│   ├── Home.tsx                 # Landing page
│   ├── JobBoard.tsx             # Job listings
│   ├── Leaderboard.tsx          # Skill leaderboards
│   └── VerifySkills.tsx         # Certification testing
├── utils/
│   ├── badgeHelpers.ts          # Badge utilities
│   └── pdaHelpers.ts            # PDA derivation
├── App.tsx                      # App root
├── main.tsx                     # Entry point
└── index.css                    # Global styles
```

### Core Components

#### usePrograms Hook

```typescript
export const usePrograms = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    if (!wallet.publicKey) return null;
    return new AnchorProvider(connection, wallet as any, {
      commitment: 'confirmed',
    });
  }, [connection, wallet]);

  const credchainProgram = useMemo(() => {
    if (!provider) return null;
    return new Program(credchainIdl, provider);
  }, [provider]);

  const badgeNftProgram = useMemo(() => {
    if (!provider) return null;
    return new Program(badgeNftIdl, provider);
  }, [provider]);

  const jobBoardProgram = useMemo(() => {
    if (!provider) return null;
    return new Program(jobBoardIdl, provider);
  }, [provider]);

  return {
    provider,
    connection,
    credchainProgram,
    badgeNftProgram,
    jobBoardProgram,
  };
};
```

#### PDA Helpers

```typescript
import { PublicKey } from '@solana/web3.js';
import { PDA_SEEDS, PROGRAM_IDS } from '../config/programs';

export function getContractPDA(contractId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.CONTRACT), Buffer.from(contractId)],
    PROGRAM_IDS.CREDCHAIN
  );
}

export function getBadgePDA(
  userPubkey: PublicKey,
  skillCategory: string
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(PDA_SEEDS.BADGE),
      userPubkey.toBuffer(),
      Buffer.from(skillCategory),
    ],
    PROGRAM_IDS.BADGE_NFT
  );
}

export function getLeaderboardPDA(
  skillCategory: string
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.LEADERBOARD), Buffer.from(skillCategory)],
    PROGRAM_IDS.BADGE_NFT
  );
}
```

### Key Features Implementation

#### 1. Skill Verification Flow

**File**: `src/pages/VerifySkills.tsx`

```typescript
const handleStartTest = async (category: SkillCategory) => {
  const [testSessionPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('test-session'),
      publicKey.toBuffer(),
      Buffer.from(category),
    ],
    badgeNftProgram.programId
  );

  const tx = await badgeNftProgram.methods
    .createTestSession(category)
    .accounts({
      user: publicKey,
      testSession: testSessionPDA,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  // Start test timer, show questions
};

const handleSubmitTest = async (answers: number[]) => {
  const tx = await badgeNftProgram.methods
    .submitTestAnswers(answers)
    .accounts({
      user: publicKey,
      testSession: testSessionPDA,
    })
    .rpc();

  // Fetch score, mint badge if passed
};
```

#### 2. Contract Creation

**File**: `src/pages/CreateContract.tsx`

```typescript
const handleCreateContract = async (formData: ContractFormData) => {
  const contractId = `contract-${Date.now()}`;
  const [contractPDA] = getContractPDA(contractId);

  const milestones = formData.milestones.map(m => ({
    title: m.title,
    description: m.description,
    amount: new BN(m.amount * LAMPORTS_PER_SOL),
    deadline: new BN(Math.floor(m.deadline.getTime() / 1000)),
  }));

  const tx = await credchainProgram.methods
    .createContract(
      contractId,
      formData.title,
      formData.description,
      new PublicKey(formData.freelancerAddress),
      new PublicKey(formData.paymentToken),
      milestones
    )
    .accounts({
      client: publicKey,
      contract: contractPDA,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log('Contract created:', tx);
};
```

#### 3. File Upload to IPFS

**File**: `src/components/DeliverableUpload.tsx`

```typescript
const uploadToIPFS = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const pinataMetadata = JSON.stringify({
    name: file.name,
    keyvalues: {
      contractId: contractId,
      milestoneIndex: milestoneIndex.toString(),
      uploadedBy: publicKey?.toBase58() || 'unknown',
    },
  });
  formData.append('pinataMetadata', pinataMetadata);

  const response = await fetch(
    `${PINATA_API_URL}/pinning/pinFileToIPFS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    }
  );

  const data = await response.json();
  return data.IpfsHash;
};
```

#### 4. Employer Verification

**File**: `src/pages/EmployerVerification.tsx`

```typescript
const handleVerify = async (walletAddress: string) => {
  const candidatePubkey = new PublicKey(walletAddress);

  // Fetch all badges for the user
  const badges = await badgeNftProgram.account.badge.all([
    {
      memcmp: {
        offset: 8 + 32, // Discriminator + authority
        bytes: candidatePubkey.toBase58(),
      },
    },
  ]);

  // Check validity
  const verifiedBadges = badges.map(badge => {
    const isExpired = badge.account.expiryDate < Date.now() / 1000;
    const isRevoked = badge.account.revoked;

    return {
      skill: badge.account.skillCategory,
      score: badge.account.testScore,
      issueDate: new Date(badge.account.issueDate * 1000),
      status: isRevoked ? 'revoked' : isExpired ? 'expired' : 'valid',
    };
  });

  setVerificationResult({ badges: verifiedBadges });
};
```

---

## AI Features

CredChain integrates Google Gemini AI to provide intelligent automation for freelance workflows. All AI features are powered by serverless edge functions for security and scalability.

### Architecture

**AI Integration Flow:**

```
Frontend Component → Fetch API Call → Vercel Edge Function → Gemini API → Response
     ↓                                        ↓                    ↓
  User Action              Validates Request/Protects Key    AI Processing
                                                                  ↓
Frontend UI Update ← JSON Response ← Structured Output ← Gemini Response
```

### Feature 1: AI Job Matching

**Location**: `src/pages/JobBoard.tsx` + `api/match-jobs.ts`

#### Purpose
Intelligently matches freelancers with suitable job opportunities based on their verified badges, completed projects, and work history.

#### Implementation

**Frontend Integration:**

```typescript
// JobBoard.tsx
const getAIJobMatches = async () => {
  setLoadingAiMatches(true);
  try {
    const response = await fetch('/api/match-jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userBadges: badges.map(b => ({
          skillCategory: b.account.skillCategory,
          testScore: b.account.testScore,
          issueDate: b.account.issueDate,
        })),
        jobs: jobs.map(j => ({
          title: j.account.title,
          description: j.account.description,
          requiredSkills: j.account.requiredSkills,
          budget: j.account.budget.toString(),
        })),
        userCompletions: completedContracts,
      }),
    });

    const data = await response.json();
    setAiMatches(data.matches);
    setShowAiRecommendations(true);
  } catch (error) {
    console.error('AI matching failed:', error);
  } finally {
    setLoadingAiMatches(false);
  }
};
```

**Serverless Function:**

```typescript
// api/match-jobs.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { userBadges, jobs, userCompletions } = await req.json();

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });

  const prompt = `Analyze this freelancer's profile and match them with jobs...`;

  const result = await model.generateContent(prompt);
  const matches = JSON.parse(result.response.text());

  return new Response(JSON.stringify({ matches }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

#### Response Format

```json
{
  "matches": [
    {
      "jobIndex": 0,
      "fitScore": 92,
      "reason": "Perfect match with your Solana Developer badge (score: 87). Your 3 completed blockchain projects demonstrate strong experience.",
      "matchedSkills": ["SolanaDeveloper", "FrontendDeveloper"],
      "missingSkills": []
    }
  ]
}
```

#### UI Components

- **Trigger Button**: "Find Best Matches with AI" in job board header
- **Loading State**: Sparkles icon animation during processing
- **Results Display**: Top 3 matches with fit percentages, color-coded badges
- **Match Details**: Expandable cards showing reasoning and skill alignments

### Feature 2: AI Contract Summary

**Location**: `src/pages/ContractDetails.tsx` + `api/summarize-contract.ts`

#### Purpose
Generates intelligent executive summaries of contracts, highlighting key details, risks, and recommended next steps for both clients and freelancers.

#### Implementation

**Frontend Integration:**

```typescript
// ContractDetails.tsx
const generateAISummary = async () => {
  setLoadingAiSummary(true);
  try {
    const response = await fetch('/api/summarize-contract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contract: {
          title: contract.title,
          description: contract.description,
          totalAmount: contract.totalAmount.toString(),
          paidAmount: contract.paidAmount.toString(),
          status: contract.status,
          milestones: contract.milestones.map(m => ({
            title: m.title,
            description: m.description,
            amount: m.amount.toString(),
            deadline: m.deadline.toString(),
            status: m.status,
            revisionCount: m.revisionCount,
          })),
        },
        userRole: isClient ? 'client' : 'freelancer',
      }),
    });

    const data = await response.json();
    setAiSummary(data.summary);
    setShowAiSummary(true);
  } catch (error) {
    console.error('AI summary failed:', error);
  } finally {
    setLoadingAiSummary(false);
  }
};
```

**Serverless Function:**

```typescript
// api/summarize-contract.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const { contract, userRole } = await req.json();

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.5, // Lower for consistency
    },
  });

  const prompt = `Analyze this contract from the perspective of a ${userRole}...`;

  const result = await model.generateContent(prompt);
  const summary = JSON.parse(result.response.text());

  return new Response(JSON.stringify({ summary }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

#### Response Format

```json
{
  "summary": {
    "overview": "3-milestone web development contract worth 5 SOL",
    "keyDetails": {
      "totalValue": "5 SOL",
      "progress": "60% complete (3/5 SOL paid)",
      "timeline": "2 of 3 milestones completed",
      "status": "InProgress"
    },
    "milestones": [
      {
        "name": "Frontend Development",
        "status": "Completed",
        "payment": "2 SOL",
        "highlights": "Delivered on time, no revisions needed"
      }
    ],
    "riskAssessment": {
      "level": "Low",
      "factors": ["On schedule", "No disputes", "Good communication"]
    },
    "nextSteps": [
      "Review Milestone 3 deliverables",
      "Approve final payment upon completion"
    ]
  }
}
```

#### UI Components

- **Trigger Button**: "Generate AI Summary" in contract header
- **Summary Card**: Collapsible panel with sections for overview, metrics, milestones, risks
- **Risk Indicators**: Color-coded risk levels (green/yellow/red)
- **Action Items**: Checklist of recommended next steps

### Feature 3: AI Job Description Improvement

**Location**: `src/components/PostJobModal.tsx` + `api/improve-job-description.ts`

#### Purpose
Helps clients create compelling, clear job postings by improving titles, enhancing descriptions, and suggesting relevant skills.

#### Implementation

**Frontend Integration:**

```typescript
// PostJobModal.tsx
const handleImproveWithAI = async () => {
  if (!formData.title && !formData.description) {
    toast.error('Please enter a title and description first');
    return;
  }

  setImprovingWithAI(true);
  try {
    const response = await fetch('/api/improve-job-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: formData.title,
        description: formData.description,
        budget: formData.budget,
        currentSkills: formData.requiredSkills,
      }),
    });

    const data = await response.json();

    setFormData({
      ...formData,
      title: data.improvedTitle,
      description: data.improvedDescription,
      requiredSkills: data.suggestedSkills,
    });

    toast.success('Job description improved with AI!');
  } catch (error) {
    toast.error('Failed to improve description');
  } finally {
    setImprovingWithAI(false);
  }
};
```

**Serverless Function:**

```typescript
// api/improve-job-description.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const { title, description, budget, currentSkills } = await req.json();

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.8, // Higher for creativity
    },
  });

  const prompt = `Improve this job posting for a Web3 freelance platform...`;

  const result = await model.generateContent(prompt);
  const improved = JSON.parse(result.response.text());

  return new Response(JSON.stringify(improved), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

#### Response Format

```json
{
  "improvedTitle": "Senior Solana Smart Contract Developer for DeFi Protocol",
  "improvedDescription": "We're building a next-generation DeFi protocol on Solana...",
  "suggestedSkills": ["SolanaDeveloper", "FrontendDeveloper"],
  "improvements": [
    "Added specific technical requirements",
    "Clarified project scope and deliverables",
    "Included timeline expectations"
  ]
}
```

#### UI Components

- **Trigger Button**: "Improve with AI" sparkles button above description field
- **Loading State**: Button shows spinner during processing
- **Preview Mode**: Shows before/after comparison (future enhancement)
- **Success Toast**: Confirmation message with change summary

### API Configuration

#### Environment Variables

```env
GEMINI_API_KEY=your_api_key_here
```

Get your API key from: https://aistudio.google.com/apikey

#### Rate Limits & Performance

- **Context Window**: 1 million tokens
- **Response Time**: ~800-1200ms average

### Error Handling

All AI endpoints implement robust error handling:

```typescript
try {
  const result = await model.generateContent(prompt);
  return result.response.text();
} catch (error) {
  console.error('Gemini API error:', error);

  if (error.message.includes('quota')) {
    return new Response(
      JSON.stringify({ error: 'Daily quota exceeded. Try again tomorrow.' }),
      { status: 429 }
    );
  }

  if (error.message.includes('invalid key')) {
    return new Response(
      JSON.stringify({ error: 'Invalid API key configuration' }),
      { status: 401 }
    );
  }

  return new Response(
    JSON.stringify({ error: 'AI processing failed. Please try again.' }),
    { status: 500 }
  );
}
```

### Performance Optimization

1. **Caching**: Client-side caching of AI responses for 5 minutes
2. **Debouncing**: Job improvement requests debounced by 500ms
3. **Compression**: Edge functions use gzip compression
4. **Token Optimization**: Prompts optimized to use ~200-400 input tokens

### Security

- API keys stored server-side only (never exposed to client)
- Rate limiting prevents abuse
- Input validation on all requests
- Structured JSON output mode prevents injection attacks
- CORS properly configured for serverless deployment

### Future Enhancements

- **AI-Powered Dispute Resolution**: Suggest fair resolutions based on evidence
- **Automated NDA Generation**: Generate custom NDAs based on project scope
- **Smart Milestone Planning**: AI-suggested milestone breakdowns
- **Reputation Insights**: AI analysis of freelancer work patterns
- **Market Rate Suggestions**: AI-powered budget recommendations

---

## Data Models

### Enums

```typescript
export enum SkillCategory {
  SolanaDeveloper = 'SolanaDeveloper',
  UIUXDesigner = 'UIUXDesigner',
  ContentWriter = 'ContentWriter',
  DataAnalyst = 'DataAnalyst',
  MarketingSpecialist = 'MarketingSpecialist',
  FrontendDeveloper = 'FrontendDeveloper',
}

export enum ContractStatus {
  Active = 'Active',             // Created, awaiting funding
  Funded = 'Funded',             // Escrow deposited
  InProgress = 'InProgress',     // Work started
  Completed = 'Completed',       // All milestones done
  Disputed = 'Disputed',         // Under dispute
  Cancelled = 'Cancelled',       // Cancelled
}

export enum MilestoneStatus {
  Pending = 'Pending',
  UnderReview = 'UnderReview',
  RevisionRequested = 'RevisionRequested',
  Completed = 'Completed',
}

export enum DisputeCategory {
  Quality = 'Quality',
  Deadline = 'Deadline',
  Scope = 'Scope',
  Payment = 'Payment',
  Communication = 'Communication',
  Other = 'Other',
}

export enum DisputeStatus {
  Open = 'Open',
  UnderReview = 'UnderReview',
  ResolvedForClient = 'ResolvedForClient',
  ResolvedForFreelancer = 'ResolvedForFreelancer',
  Cancelled = 'Cancelled',
}
```

### Constants

```typescript
export const TEST_CONFIG = {
  MIN_PASS_SCORE: 70,
  MAX_SCORE: 100,
  BADGE_VALIDITY_DAYS: 365,
};

export const CONTRACT_CONFIG = {
  MIN_MILESTONES: 1,
  MAX_MILESTONES: 5,
  MAX_REVISIONS_PER_MILESTONE: 3,
  MAX_TITLE_LENGTH: 64,
  MAX_DESCRIPTION_LENGTH: 200,
  MAX_MILESTONE_TITLE_LENGTH: 64,
  MAX_MILESTONE_DESCRIPTION_LENGTH: 150,
};
```

---

## API Reference

### Badge NFT Program API

#### Get User Badges

```typescript
const getUserBadges = async (
  userAddress: PublicKey,
  program: Program
): Promise<Badge[]> => {
  return await program.account.badge.all([
    {
      memcmp: {
        offset: 8 + 32, // Skip discriminator and authority
        bytes: userAddress.toBase58(),
      },
    },
  ]);
};
```

#### Get Leaderboard

```typescript
const getLeaderboard = async (
  skillCategory: SkillCategory,
  program: Program
): Promise<Leaderboard> => {
  const [leaderboardPDA] = getLeaderboardPDA(skillCategory);
  return await program.account.leaderboard.fetch(leaderboardPDA);
};
```

### CredChain Program API

#### Get User Contracts

```typescript
const getUserContracts = async (
  userAddress: PublicKey,
  program: Program,
  role: 'client' | 'freelancer'
): Promise<Contract[]> => {
  const offset = role === 'client' ? 8 + 32 : 8 + 32 + 32;

  return await program.account.contract.all([
    {
      memcmp: {
        offset,
        bytes: userAddress.toBase58(),
      },
    },
  ]);
};
```

#### Get Contract Details

```typescript
const getContract = async (
  contractId: string,
  program: Program
): Promise<Contract> => {
  const [contractPDA] = getContractPDA(contractId);
  return await program.account.contract.fetch(contractPDA);
};
```

#### Get Dispute

```typescript
const getDispute = async (
  contractPDA: PublicKey,
  program: Program
): Promise<Dispute | null> => {
  const [disputePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('dispute'), contractPDA.toBuffer()],
    program.programId
  );

  try {
    return await program.account.dispute.fetch(disputePDA);
  } catch {
    return null; // No dispute exists
  }
};
```

### Job Board Program API

#### Get All Jobs

```typescript
const getAllJobs = async (
  program: Program,
  status?: JobStatus
): Promise<Job[]> => {
  const jobs = await program.account.job.all();

  if (status) {
    return jobs.filter(
      job => Object.keys(job.account.status)[0] === status.toLowerCase()
    );
  }

  return jobs;
};
```

#### Get Job Applications

```typescript
const getJobApplications = async (
  jobPDA: PublicKey,
  program: Program
): Promise<JobApplication[]> => {
  return await program.account.jobApplication.all([
    {
      memcmp: {
        offset: 8, // Skip discriminator
        bytes: jobPDA.toBase58(),
      },
    },
  ]);
};
```

---

## Integration Guide

### Integrating Badge Verification

External platforms can verify CredChain badges:

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';

// 1. Connect to Solana
const connection = new Connection('https://api.devnet.solana.com');

// 2. Load Badge NFT Program
const BADGE_PROGRAM_ID = '79s9nmY3ZtsWeKakiBMyagHi6652AGSR413BXRZDZu7Z';
const program = new Program(badgeIdl, BADGE_PROGRAM_ID, provider);

// 3. Verify User Badges
async function verifyUserSkills(walletAddress: string) {
  const userPubkey = new PublicKey(walletAddress);

  const badges = await program.account.badge.all([
    {
      memcmp: {
        offset: 8 + 32,
        bytes: userPubkey.toBase58(),
      },
    },
  ]);

  const validBadges = badges.filter(b =>
    b.account.isValid &&
    !b.account.revoked &&
    b.account.expiryDate > Date.now() / 1000
  );

  return validBadges.map(b => ({
    skill: b.account.skillCategory,
    score: b.account.testScore,
    verified: true,
  }));
}
```

### Creating Custom Contract Flows

```typescript
// Custom contract with specific requirements
async function createCustomContract(
  client: PublicKey,
  freelancer: PublicKey,
  requirements: {
    requiredBadges: SkillCategory[];
    minimumScore: number;
  }
) {
  // 1. Verify freelancer has required badges
  const badges = await getUserBadges(freelancer, badgeProgram);
  const hasRequiredSkills = requirements.requiredBadges.every(skill =>
    badges.some(b =>
      b.account.skillCategory === skill &&
      b.account.testScore >= requirements.minimumScore &&
      b.account.isValid
    )
  );

  if (!hasRequiredSkills) {
    throw new Error('Freelancer does not meet requirements');
  }

  // 2. Create contract
  const contractId = `custom-${Date.now()}`;
  const [contractPDA] = getContractPDA(contractId);

  await credchainProgram.methods
    .createContract(/* ... */)
    .accounts({ /* ... */ })
    .rpc();

  return contractPDA;
}
```

---

## Security

### Smart Contract Security

#### Access Control

```rust
// Admin-only functions
require!(
    ctx.accounts.authority.key() == ADMIN_WALLET,
    ErrorCode::Unauthorized
);

// Contract participant validation
require!(
    ctx.accounts.signer.key() == contract.client ||
    ctx.accounts.signer.key() == contract.freelancer,
    ErrorCode::NotContractParty
);
```

#### Input Validation

```rust
// String length checks
require!(
    title.len() <= MAX_TITLE_LENGTH,
    ErrorCode::TitleTooLong
);

// Amount validation
require!(
    amount > 0,
    ErrorCode::InvalidAmount
);

// Milestone count validation
require!(
    milestones.len() >= MIN_MILESTONES &&
    milestones.len() <= MAX_MILESTONES,
    ErrorCode::InvalidMilestoneCount
);
```

#### Overflow Protection

```rust
use anchor_lang::prelude::*;

// Use checked arithmetic
let new_amount = contract.paid_amount
    .checked_add(milestone_amount)
    .ok_or(ErrorCode::Overflow)?;
```

### Frontend Security

#### Transaction Signing

```typescript
// Always display transaction details before signing
const confirmTransaction = (details: TransactionDetails) => {
  const message = `
    Action: ${details.action}
    Amount: ${details.amount} SOL
    Recipient: ${details.recipient}

    Do you want to proceed?
  `;

  return window.confirm(message);
};
```

#### Input Sanitization

```typescript
// Validate addresses
const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

// Sanitize user input
const sanitizeInput = (input: string, maxLength: number): string => {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential XSS
};
```

#### Environment Variables

```typescript
// Never expose private keys
// Use environment variables for sensitive data
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

// Validate environment variables
if (!PINATA_JWT) {
  console.warn('IPFS uploads disabled: PINATA_JWT not configured');
}
```

### Best Practices

1. **Never store private keys in code**
2. **Always validate user input**
3. **Use PDAs instead of user-provided addresses**
4. **Implement proper error handling**
5. **Test thoroughly on devnet before mainnet**
6. **Audit smart contracts before deployment**
7. **Monitor transactions for suspicious activity**
8. **Implement rate limiting for API calls**
9. **Use HTTPS for all external requests**
10. **Keep dependencies updated**

---

## Testing

### Smart Contract Testing

```bash
# Run Anchor tests
anchor test

# Run specific test file
anchor test --skip-deploy tests/badge_nft.ts
```

**Example Test:**

```typescript
describe('badge_nft', () => {
  it('Creates test session', async () => {
    const [testSessionPDA] = await getTestSessionPDA(
      user.publicKey,
      'SolanaDeveloper'
    );

    await program.methods
      .createTestSession({ solanaDeveloper: {} })
      .accounts({
        user: user.publicKey,
        testSession: testSessionPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const session = await program.account.testSession.fetch(testSessionPDA);
    expect(session.submitted).to.be.false;
  });

  it('Mints badge for passing score', async () => {
    // Submit test with passing score
    await program.methods
      .submitTestAnswers([1, 2, 3, 4, 5, 6, 7, 8, 9, 0])
      .accounts({ /* ... */ })
      .rpc();

    // Mint badge
    const [badgePDA] = await getBadgePDA(user.publicKey, 'SolanaDeveloper');

    await program.methods
      .mintBadge('ipfs://metadata-uri')
      .accounts({ /* ... */ })
      .rpc();

    const badge = await program.account.badge.fetch(badgePDA);
    expect(badge.isValid).to.be.true;
    expect(badge.testScore).to.be.gte(70);
  });
});
```

### Frontend Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- --testPathPattern=DeliverableUpload
```

**Example Component Test:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { DeliverableUpload } from './DeliverableUpload';

describe('DeliverableUpload', () => {
  it('uploads file to IPFS', async () => {
    const onUploadComplete = jest.fn();

    render(
      <DeliverableUpload
        contractId="test-contract"
        milestoneIndex={0}
        onUploadComplete={onUploadComplete}
      />
    );

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/select files/i);

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/uploaded to ipfs/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/submit deliverable/i));

    await waitFor(() => {
      expect(onUploadComplete).toHaveBeenCalled();
    });
  });
});
```

### Integration Testing

```typescript
describe('Contract Flow', () => {
  it('completes full contract lifecycle', async () => {
    // 1. Create contract
    const contractId = `test-${Date.now()}`;
    await createContract(contractId, client, freelancer, milestones);

    // 2. Both parties sign NDA
    await signNDA(contractId, client);
    await signNDA(contractId, freelancer);

    // 3. Client deposits escrow
    await depositEscrow(contractId, client, totalAmount);

    // 4. Freelancer submits deliverable
    await submitDeliverable(contractId, freelancer, 0, 'ipfs-hash');

    // 5. Client approves milestone
    await approveMilestone(contractId, client, 0);

    // 6. Verify payment
    const contract = await getContract(contractId);
    expect(contract.milestones[0].status).to.equal('Completed');
    expect(contract.paidAmount).to.equal(milestones[0].amount);
  });
});
```

---

## Deployment

### Prerequisites

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli

# Install Node dependencies
npm install
```

### Smart Contract Deployment

#### 1. Configure Solana CLI

```bash
# Set to devnet
solana config set --url devnet

# Generate keypair (if needed)
solana-keygen new --outfile ~/.config/solana/id.json

# Airdrop SOL
solana airdrop 2
```

#### 2. Build Programs

```bash
# Navigate to program directory
cd programs/badge_nft
anchor build

cd ../job_board
anchor build

cd ../credchain
anchor build
```

#### 3. Deploy Programs

```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Note the program IDs from output
# Update Anchor.toml with new program IDs
```

#### 4. Initialize Program State

```typescript
// Initialize leaderboards
for (const category of Object.values(SkillCategory)) {
  const [leaderboardPDA] = getLeaderboardPDA(category);

  await badgeNftProgram.methods
    .initializeLeaderboard({ [category.toLowerCase()]: {} })
    .accounts({
      authority: adminWallet.publicKey,
      leaderboard: leaderboardPDA,
      systemProgram: SystemProgram.programId,
    })
    .signers([adminWallet])
    .rpc();
}
```

### Frontend Deployment

#### 1. Configure Environment

```bash
# Create production .env
cp .env.example .env

# Update with mainnet values
VITE_SOLANA_NETWORK=mainnet-beta
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
VITE_CREDCHAIN_PROGRAM_ID=<your-mainnet-program-id>
# ... other program IDs
```

#### 2. Build Frontend

```bash
npm run build
```

#### 3. Deploy to Hosting Platform

Deploy the built application to your preferred hosting platform that supports serverless functions for AI features to work properly.

### Post-Deployment Checklist

**Blockchain Features:**
- [ ] Verify all program IDs are correct
- [ ] Test wallet connection
- [ ] Test badge minting
- [ ] Test contract creation
- [ ] Test payment flow
- [ ] Verify IPFS uploads

**AI Features:**
- [ ] Confirm GEMINI_API_KEY is set in environment variables
- [ ] Test AI job matching from job board
- [ ] Test AI contract summary generation
- [ ] Test AI job description improvement
- [ ] Verify AI responses are properly formatted
- [ ] Check AI error handling (try with invalid inputs)

**General:**
- [ ] Check mobile responsiveness
- [ ] Monitor transaction costs
- [ ] Set up error monitoring (Sentry)
- [ ] Configure analytics
- [ ] Update documentation with mainnet addresses
- [ ] Announce launch

### Monitoring

```typescript
// Add transaction monitoring
import * as Sentry from '@sentry/react';

try {
  const tx = await program.methods./* ... */.rpc();
  console.log('Transaction successful:', tx);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      component: 'ContractCreation',
      wallet: publicKey?.toBase58(),
    },
  });
  throw error;
}
```

---

## Troubleshooting

### Common Issues

#### Issue: "Transaction simulation failed"

**Cause**: Account not initialized or insufficient funds

**Solution**:
```typescript
// Check if account exists
const accountInfo = await connection.getAccountInfo(pda);
if (!accountInfo) {
  // Initialize account first
  await initializeAccount();
}

// Check balance
const balance = await connection.getBalance(publicKey);
if (balance < requiredAmount) {
  throw new Error('Insufficient funds');
}
```

#### Issue: "Badge not appearing after test"

**Cause**: Transaction confirmed but UI not updated

**Solution**:
```typescript
// Wait for confirmation
const tx = await program.methods.mintBadge(/* ... */).rpc();
await connection.confirmTransaction(tx, 'confirmed');

// Force refresh
await refetchBadges();
```

#### Issue: "IPFS upload fails"

**Cause**: Missing or invalid Pinata JWT

**Solution**:
1. Get JWT from https://pinata.cloud/
2. Add to `.env`: `VITE_PINATA_JWT=your_jwt_here`
3. Restart dev server

#### Issue: "Contract escrow deposit fails"

**Cause**: Token account not created

**Solution**:
```typescript
// Create associated token account if needed
const ata = await getAssociatedTokenAddress(mint, owner);
const accountInfo = await connection.getAccountInfo(ata);

if (!accountInfo) {
  const ix = createAssociatedTokenAccountInstruction(
    payer,
    ata,
    owner,
    mint
  );
  // Add instruction to transaction
}
```

### Debug Mode

```typescript
// Enable detailed logging
localStorage.setItem('debug', 'credchain:*');

// Log all RPC calls
const provider = new AnchorProvider(connection, wallet, {
  commitment: 'confirmed',
  preflightCommitment: 'confirmed',
  skipPreflight: false,
});
```

### Support Resources

- **GitHub Issues**: Report bugs and request features
- **Discord**: Real-time community support
- **Documentation**: This file and README.md
- **Solana Docs**: https://docs.solana.com
- **Anchor Docs**: https://www.anchor-lang.com

---

## Appendix

### Glossary

- **PDA**: Program Derived Address - Deterministic address derived from seeds
- **IDL**: Interface Definition Language - JSON describing program interface
- **Escrow**: Smart contract holding funds until conditions met
- **Milestone**: Project phase with defined deliverable and payment
- **Badge**: NFT certifying skill verification
- **Leaderboard**: Ranking of top performers in skill category
- **NDA**: Non-Disclosure Agreement signed on-chain
- **IPFS**: InterPlanetary File System for decentralized storage

### Useful Links

- **Solana Explorer**: https://explorer.solana.com
- **Anchor Documentation**: https://www.anchor-lang.com
- **Solana Web3.js**: https://solana-labs.github.io/solana-web3.js/
- **Wallet Adapter**: https://github.com/solana-labs/wallet-adapter
- **Metaplex**: https://docs.metaplex.com
- **Pinata**: https://docs.pinata.cloud

### Code Examples Repository

Complete code examples available at:
- Badge minting: `examples/mint-badge.ts`
- Contract creation: `examples/create-contract.ts`
- IPFS upload: `examples/upload-to-ipfs.ts`
- Employer verification: `examples/verify-credentials.ts`

---

**Document Version**: 1.0.0
**Last Updated**: 2025
**Maintained By**: CredChain Team

For questions or contributions, please open an issue or submit a pull request.
