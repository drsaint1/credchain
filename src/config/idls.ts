import credchainIdlJson from '../../idl/credchain.json';
import badgeNftIdlJson from '../../idl/badge_nft.json';
import jobBoardIdlJson from '../../idl/job_board.json';
import type { Idl } from '@coral-xyz/anchor';

export const credchainIdl = credchainIdlJson as Idl;
export const badgeNftIdl = badgeNftIdlJson as Idl;
export const jobBoardIdl = jobBoardIdlJson as Idl;


export type CredchainProgram = typeof credchainIdl;
export type BadgeNftProgram = typeof badgeNftIdl;
export type JobBoardProgram = typeof jobBoardIdl;