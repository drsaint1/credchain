import { PublicKey } from '@solana/web3.js';
import { PROGRAM_IDS, PDA_SEEDS, SkillCategory, SKILL_CATEGORY_NAMES } from '../config/programs';
import { BN } from '@coral-xyz/anchor';



export const getContractPDA = (contractId: string): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(PDA_SEEDS.CONTRACT),
      Buffer.from(contractId),
    ],
    PROGRAM_IDS.CREDCHAIN
  );
};


export const getDisputePDA = (contractPubkey: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(PDA_SEEDS.DISPUTE),
      contractPubkey.toBuffer(),
    ],
    PROGRAM_IDS.CREDCHAIN
  );
};


export const getTimeSessionPDA = (
  contractPubkey: PublicKey,
  sessionNonce: BN
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(PDA_SEEDS.SESSION),
      contractPubkey.toBuffer(),
      sessionNonce.toArrayLike(Buffer, 'le', 8),
    ],
    PROGRAM_IDS.CREDCHAIN
  );
};



export const getBadgeAuthorityPDA = (): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.AUTHORITY)],
    PROGRAM_IDS.BADGE_NFT
  );
};


export const getTestResultPDA = (
  candidatePubkey: PublicKey,
  skillCategory: SkillCategory,
  testNonce: BN
): [PublicKey, number] => {
  
  
  const skillCategoryString = SKILL_CATEGORY_NAMES[skillCategory];
  const skillCategoryBytes = Buffer.from(skillCategoryString);

  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(PDA_SEEDS.TEST_RESULT),
      candidatePubkey.toBuffer(),
      skillCategoryBytes,
      testNonce.toArrayLike(Buffer, 'le', 8),
    ],
    PROGRAM_IDS.BADGE_NFT
  );
};


export const getBadgePDA = (
  candidatePubkey: PublicKey,
  skillCategory: SkillCategory
): [PublicKey, number] => {
  
  const skillCategoryString = SKILL_CATEGORY_NAMES[skillCategory];
  const skillCategoryBytes = Buffer.from(skillCategoryString);

  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(PDA_SEEDS.BADGE),
      candidatePubkey.toBuffer(),
      skillCategoryBytes,
    ],
    PROGRAM_IDS.BADGE_NFT
  );
};


export const getBadgeMintPDA = (
  candidatePubkey: PublicKey,
  skillCategory: SkillCategory
): [PublicKey, number] => {
  
  const skillCategoryString = SKILL_CATEGORY_NAMES[skillCategory];
  const skillCategoryBytes = Buffer.from(skillCategoryString);

  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(PDA_SEEDS.BADGE_MINT),
      candidatePubkey.toBuffer(),
      skillCategoryBytes,
    ],
    PROGRAM_IDS.BADGE_NFT
  );
};


export const getLeaderboardPDA = (skillCategory: SkillCategory): [PublicKey, number] => {
  
  const skillCategoryString = SKILL_CATEGORY_NAMES[skillCategory];
  const skillCategoryBytes = Buffer.from(skillCategoryString);

  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(PDA_SEEDS.LEADERBOARD),
      skillCategoryBytes,
    ],
    PROGRAM_IDS.BADGE_NFT
  );
};


export const getMetadataPDA = (mintPubkey: PublicKey): [PublicKey, number] => {
  const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METADATA_PROGRAM_ID.toBuffer(),
      mintPubkey.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );
};


export const getAssociatedTokenAddressPDA = (
  ownerPubkey: PublicKey,
  mintPubkey: PublicKey
): [PublicKey, number] => {
  const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
  );
  const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

  return PublicKey.findProgramAddressSync(
    [
      ownerPubkey.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      mintPubkey.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
};