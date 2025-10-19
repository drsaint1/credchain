import { PublicKey } from '@solana/web3.js';


export const NETWORK = {
  CLUSTER_URL: import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  CLUSTER: (import.meta.env.VITE_SOLANA_NETWORK || 'devnet') as 'devnet' | 'mainnet-beta' | 'testnet',
};


export const PROGRAM_IDS = {
  CREDCHAIN: new PublicKey(import.meta.env.VITE_CREDCHAIN_PROGRAM_ID || 'J4cUiyURTW8woQCsc3YQwPPe2jMr8M27HFKWst468tUk'),
  BADGE_NFT: new PublicKey(import.meta.env.VITE_BADGE_NFT_PROGRAM_ID || '79s9nmY3ZtsWeKakiBMyagHi6652AGSR413BXRZDZu7Z'),
  JOB_BOARD: new PublicKey(import.meta.env.VITE_JOB_BOARD_PROGRAM_ID || 'mUfeb5rs5gH8n92VCqbuVNWPaU333tM6BhKZvTFEfvd'),
};


export const ADMIN_WALLET = new PublicKey(import.meta.env.VITE_ADMIN_WALLET || 'FXtdnHTgD2sDEih5s7WgXGrsY9MeGh484h7tzfxqXu6h');


export const KEY_PDAS = {
  
  BADGE_AUTHORITY: new PublicKey(import.meta.env.VITE_BADGE_AUTHORITY_PDA || 'Ffgb54Ati4yhPPEfvjDhGJwXERmxeCbXMEUWTb8jxhLj'),

  
  JOB_BOARD_AUTHORITY: new PublicKey(import.meta.env.VITE_JOB_BOARD_AUTHORITY_PDA || '8mwhHLC55UAVbZjLZd9YtFZVRqyporKSvoD7MFFkyA6K'),

  
  LEADERBOARDS: {
    SOLANA_DEVELOPER: new PublicKey(import.meta.env.VITE_LEADERBOARD_SOLANA_DEVELOPER || 'GeVfHx6fbwuKCRZ7nDkxA8zaBc4BSpi9HHaqyhB6NtZW'),
    UI_UX_DESIGNER: new PublicKey(import.meta.env.VITE_LEADERBOARD_UI_UX_DESIGNER || '2Xf2pBgEx4HkGxHB2pV7B8JGrLEQYcLaBcobfYUjcogH'),
    CONTENT_WRITER: new PublicKey(import.meta.env.VITE_LEADERBOARD_CONTENT_WRITER || 'DhUM7fALcch3TvELqR5uh6f4CoRsuZSbJgaDwT7gjrMk'),
    DATA_ANALYST: new PublicKey(import.meta.env.VITE_LEADERBOARD_DATA_ANALYST || '8Xe1K2pQuiShGxzM1VvLuxKyMMcNgcBBUdEZtcTWwTMV'),
    MARKETING_SPECIALIST: new PublicKey(import.meta.env.VITE_LEADERBOARD_MARKETING_SPECIALIST || '3tnBczYgEcV6keEkJwt8xeNzG4d8jeDyfZspi1PaRas4'),
    FRONTEND_DEVELOPER: new PublicKey(import.meta.env.VITE_LEADERBOARD_FRONTEND_DEVELOPER || 'Avb4jeD7wsJMHbgzGa6uPX72uHWNz1yebVYj3FkrMZW9'),
  },
};


export enum SkillCategory {
  SolanaDeveloper = 'SolanaDeveloper',
  UIUXDesigner = 'UIUXDesigner',
  ContentWriter = 'ContentWriter',
  DataAnalyst = 'DataAnalyst',
  MarketingSpecialist = 'MarketingSpecialist',
  FrontendDeveloper = 'FrontendDeveloper',
}


export const SKILL_CATEGORY_NAMES: Record<SkillCategory, string> = {
  [SkillCategory.SolanaDeveloper]: 'Solana Developer',
  [SkillCategory.UIUXDesigner]: 'UI/UX Designer',
  [SkillCategory.ContentWriter]: 'Content Writer',
  [SkillCategory.DataAnalyst]: 'Data Analyst',
  [SkillCategory.MarketingSpecialist]: 'Marketing Specialist',
  [SkillCategory.FrontendDeveloper]: 'Frontend Developer',
};


export enum ContractStatus {
  Active = 'Active',
  Funded = 'Funded',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Disputed = 'Disputed',
  Cancelled = 'Cancelled',
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


export const PDA_SEEDS = {
  CONTRACT: 'contract',
  DISPUTE: 'dispute',
  SESSION: 'session',
  AUTHORITY: 'authority',
  TEST_RESULT: 'test-result',
  BADGE: 'badge',
  BADGE_MINT: 'badge-mint',
  LEADERBOARD: 'leaderboard',
  JOB_BADGE: 'job-badge',
  JOB_BADGE_MINT: 'job-badge-mint',
  JOB_BOARD_AUTHORITY: 'job-board-authority',
};



export const EXPLORER_URL = import.meta.env.VITE_EXPLORER_BASE_URL || 'https://explorer.solana.com';

export const getExplorerUrl = (address: string, type: 'address' | 'tx' = 'address') => {
  return `${EXPLORER_URL}/${type}/${address}?cluster=${NETWORK.CLUSTER}`;
};


export const BADGE_METADATA_BASE_URL = import.meta.env.VITE_BADGE_METADATA_BASE_URL || 'https://gateway.pinata.cloud/ipfs/bafybeiaxverp4nugxlsfj6a2waw5psojz763n7il5xx3apx57lfb6xuyqq';


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