use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_metadata_accounts_v3, CreateMetadataAccountsV3, Metadata,
        mpl_token_metadata::types::DataV2,
    },
    token_interface::{mint_to, Mint, MintTo, TokenAccount, TokenInterface},
};

declare_id!("79s9nmY3ZtsWeKakiBMyagHi6652AGSR413BXRZDZu7Z");

#[program]
pub mod badge_nft {
    use super::*;

    
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let authority = &mut ctx.accounts.authority;
        authority.admin = ctx.accounts.admin.key();
        authority.total_badges_minted = 0;
        authority.total_job_badges_minted = 0;
        authority.bump = ctx.bumps.authority;

        msg!("Badge NFT program initialized");
        Ok(())
    }

    
    pub fn record_test_completion(
        ctx: Context<RecordTestCompletion>,
        skill_category: SkillCategory,
        score: u8,
        duration: i64,
        proctored: bool,
        _test_nonce: u64,
    ) -> Result<()> {
        require!(score <= 100, ErrorCode::InvalidScore);
        require!(score >= 70, ErrorCode::ScoreTooLow); 

        let test_result = &mut ctx.accounts.test_result;
        test_result.candidate = ctx.accounts.candidate.key();
        test_result.skill_category = skill_category.clone();
        test_result.score = score;
        test_result.passed = score >= 70;
        test_result.test_date = Clock::get()?.unix_timestamp;
        test_result.duration = duration;
        test_result.proctored = proctored;
        test_result.badge_minted = false;
        test_result.bump = ctx.bumps.test_result;

        emit!(TestCompletedEvent {
            candidate: ctx.accounts.candidate.key(),
            skill_category: skill_category.clone(),
            score,
            passed: test_result.passed,
        });

        msg!("Test completed: {} - Score: {}", skill_category.to_string(), score);
        Ok(())
    }

    
    pub fn mint_badge(
        ctx: Context<MintBadge>,
        skill_category: SkillCategory,
    ) -> Result<()> {
        let test_result = &mut ctx.accounts.test_result;
        require!(test_result.passed, ErrorCode::TestNotPassed);
        require!(!test_result.badge_minted, ErrorCode::BadgeAlreadyMinted);

        let current_time = Clock::get()?.unix_timestamp;

        
        let expiry_date = current_time + (365 * 24 * 60 * 60);

        
        let candidate_key = ctx.accounts.candidate.key();
        let skill_category_str = skill_category.to_string();

        
        let seeds = &[
            b"badge-mint" as &[u8],
            candidate_key.as_ref(),
            skill_category_str.as_bytes(),
            &[ctx.bumps.mint],
        ];
        let signer = &[&seeds[..]];

        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.mint.to_account_info(),
                },
                signer,
            ),
            1, 
        )?;

        
        let metadata_uri = format!(
            "https://gateway.pinata.cloud/ipfs/bafybeiaxverp4nugxlsfj6a2waw5psojz763n7il5xx3apx57lfb6xuyqq/{}.json",
            skill_category_str.to_lowercase().replace(" ", "-")
        );

        let data_v2 = DataV2 {
            name: format!("CredChain {} Badge", skill_category_str),
            symbol: "CRED".to_string(),
            uri: metadata_uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };

        
        
        let mint_info = ctx.accounts.mint.to_account_info();

        create_metadata_accounts_v3(
            CpiContext::new_with_signer(
                ctx.accounts.metadata_program.to_account_info(),
                CreateMetadataAccountsV3 {
                    metadata: ctx.accounts.metadata.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    mint_authority: ctx.accounts.mint.to_account_info(),
                    update_authority: mint_info,
                    payer: ctx.accounts.candidate.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
                signer,
            ),
            data_v2,
            true,  
            true,  
            None,  
        )?;

        
        let badge = &mut ctx.accounts.badge;
        badge.mint = ctx.accounts.mint.key();
        badge.owner = candidate_key;
        badge.skill_category = skill_category.clone();
        badge.issue_date = current_time;
        badge.expiry_date = expiry_date;
        badge.test_score = test_result.score;
        badge.is_valid = true;
        badge.revoked = false;
        badge.bump = ctx.bumps.badge;

        
        test_result.badge_minted = true;

        
        let authority = &mut ctx.accounts.authority;
        authority.total_badges_minted += 1;

        emit!(BadgeMintedEvent {
            candidate: candidate_key,
            skill_category: skill_category.clone(),
            mint: ctx.accounts.mint.key(),
            score: test_result.score,
            expiry_date,
        });

        msg!("Badge NFT minted for {}", skill_category_str);
        Ok(())
    }

    
    pub fn verify_badge(ctx: Context<VerifyBadge>) -> Result<VerificationResult> {
        let badge = &ctx.accounts.badge;
        let current_time = Clock::get()?.unix_timestamp;

        let is_expired = current_time > badge.expiry_date;
        let is_valid = badge.is_valid && !badge.revoked && !is_expired;

        let result = VerificationResult {
            owner: badge.owner,
            skill_category: badge.skill_category.clone(),
            test_score: badge.test_score,
            issue_date: badge.issue_date,
            expiry_date: badge.expiry_date,
            is_valid,
            is_expired,
            is_revoked: badge.revoked,
        };

        emit!(BadgeVerifiedEvent {
            badge: ctx.accounts.badge.key(),
            verifier: ctx.accounts.verifier.key(),
            is_valid,
        });

        msg!("Badge verification: Valid={}", is_valid);
        Ok(result)
    }

    
    pub fn revoke_badge(
        ctx: Context<RevokeBadge>,
        reason: String,
    ) -> Result<()> {
        
        let badge_key = ctx.accounts.badge.key();

        let badge = &mut ctx.accounts.badge;
        require!(!badge.revoked, ErrorCode::BadgeAlreadyRevoked);

        let owner = badge.owner;
        let skill_category = badge.skill_category.clone();

        badge.revoked = true;
        badge.is_valid = false;

        emit!(BadgeRevokedEvent {
            badge: badge_key,
            owner,
            skill_category,
            reason,
        });

        msg!("Badge revoked");
        Ok(())
    }

    
    pub fn update_leaderboard(
        ctx: Context<UpdateLeaderboard>,
        skill_category: SkillCategory,
    ) -> Result<()> {
        let leaderboard = &mut ctx.accounts.leaderboard;
        let candidate = ctx.accounts.candidate.key();

        
        if let Some(entry) = leaderboard.entries.iter_mut().find(|e| e.candidate == candidate) {
            entry.total_score += ctx.accounts.test_result.score as u32;
            entry.test_count += 1;
            entry.average_score = entry.total_score / entry.test_count;
            entry.last_updated = Clock::get()?.unix_timestamp;
        } else {
            leaderboard.entries.push(LeaderboardEntry {
                candidate,
                total_score: ctx.accounts.test_result.score as u32,
                test_count: 1,
                average_score: ctx.accounts.test_result.score as u32,
                badge_count: 1,
                last_updated: Clock::get()?.unix_timestamp,
            });
        }

        
        leaderboard.entries.sort_by(|a, b| b.average_score.cmp(&a.average_score));

        
        if leaderboard.entries.len() > 100 {
            leaderboard.entries.truncate(100);
        }

        msg!("Leaderboard updated for {}", skill_category.to_string());
        Ok(())
    }

    
    pub fn mint_job_completion_badge(
        ctx: Context<MintJobCompletionBadge>,
        contract_id: String,
        job_title: String,
        contract_amount: u64,
    ) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp;
        let freelancer_key = ctx.accounts.freelancer.key();

        
        let job_badge = &mut ctx.accounts.job_badge;
        job_badge.mint = ctx.accounts.mint.key();
        job_badge.freelancer = freelancer_key;
        job_badge.client = ctx.accounts.client.key();
        job_badge.contract_id = contract_id.clone();
        job_badge.job_title = job_title.clone();
        job_badge.completion_date = current_time;
        job_badge.contract_amount = contract_amount;
        job_badge.is_valid = true;
        job_badge.bump = ctx.bumps.job_badge;

        
        let seeds = &[
            b"job-badge-mint" as &[u8],
            freelancer_key.as_ref(),
            contract_id.as_bytes(),
            &[ctx.bumps.mint],
        ];
        let signer = &[&seeds[..]];

        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.mint.to_account_info(),
                },
                signer,
            ),
            1,
        )?;

        
        let metadata_uri = "https://gateway.pinata.cloud/ipfs/bafybeiaxverp4nugxlsfj6a2waw5psojz763n7il5xx3apx57lfb6xuyqq/job-completion-template.json".to_string();

        let data_v2 = DataV2 {
            name: format!("CredChain Job: {}", job_title),
            symbol: "CRED-JOB".to_string(),
            uri: metadata_uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };

        let mint_info = ctx.accounts.mint.to_account_info();

        create_metadata_accounts_v3(
            CpiContext::new_with_signer(
                ctx.accounts.metadata_program.to_account_info(),
                CreateMetadataAccountsV3 {
                    metadata: ctx.accounts.metadata.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    mint_authority: ctx.accounts.mint.to_account_info(),
                    update_authority: mint_info,
                    payer: ctx.accounts.freelancer.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
                signer,
            ),
            data_v2,
            true,
            true,
            None,
        )?;

        
        let authority = &mut ctx.accounts.authority;
        authority.total_job_badges_minted += 1;

        emit!(JobBadgeMintedEvent {
            freelancer: freelancer_key,
            contract_id: contract_id.clone(),
            job_title,
            mint: ctx.accounts.mint.key(),
            completion_date: current_time,
        });

        msg!("Job completion badge minted for contract: {}", contract_id);
        Ok(())
    }
}



#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + ProgramAuthority::INIT_SPACE,
        seeds = [b"authority"],
        bump
    )]
    pub authority: Account<'info, ProgramAuthority>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(skill_category: SkillCategory, _score: u8, _duration: i64, _proctored: bool, test_nonce: u64)]
pub struct RecordTestCompletion<'info> {
    #[account(
        init,
        payer = candidate,
        space = 8 + TestResult::INIT_SPACE,
        seeds = [
            b"test-result",
            candidate.key().as_ref(),
            skill_category.to_string().as_bytes(),
            &test_nonce.to_le_bytes()
        ],
        bump
    )]
    pub test_result: Account<'info, TestResult>,
    #[account(mut)]
    pub candidate: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(skill_category: SkillCategory)]
pub struct MintBadge<'info> {
    #[account(
        mut,
        seeds = [b"authority"],
        bump = authority.bump
    )]
    pub authority: Account<'info, ProgramAuthority>,

    #[account(mut)]
    pub test_result: Account<'info, TestResult>,

    #[account(
        init,
        payer = candidate,
        space = 8 + Badge::INIT_SPACE,
        seeds = [
            b"badge",
            candidate.key().as_ref(),
            skill_category.to_string().as_bytes()
        ],
        bump
    )]
    pub badge: Account<'info, Badge>,

    #[account(
        init,
        payer = candidate,
        mint::decimals = 0,
        mint::authority = mint,
        mint::token_program = token_program,
        seeds = [
            b"badge-mint",
            candidate.key().as_ref(),
            skill_category.to_string().as_bytes()
        ],
        bump
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        payer = candidate,
        associated_token::mint = mint,
        associated_token::authority = candidate,
        associated_token::token_program = token_program
    )]
    pub token_account: InterfaceAccount<'info, TokenAccount>,

    
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    #[account(mut)]
    pub candidate: Signer<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct VerifyBadge<'info> {
    pub badge: Account<'info, Badge>,
    pub verifier: Signer<'info>,
}

#[derive(Accounts)]
pub struct RevokeBadge<'info> {
    #[account(
        mut,
        seeds = [b"authority"],
        bump = authority.bump,
        has_one = admin
    )]
    pub authority: Account<'info, ProgramAuthority>,
    #[account(mut)]
    pub badge: Account<'info, Badge>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(skill_category: SkillCategory)]
pub struct UpdateLeaderboard<'info> {
    #[account(
        init,
        payer = candidate,
        space = 8 + Leaderboard::INIT_SPACE,
        seeds = [b"leaderboard", skill_category.to_string().as_bytes()],
        bump
    )]
    pub leaderboard: Account<'info, Leaderboard>,
    pub test_result: Account<'info, TestResult>,
    #[account(mut)]
    pub candidate: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(contract_id: String, job_title: String, contract_amount: u64)]
pub struct MintJobCompletionBadge<'info> {
    #[account(
        mut,
        seeds = [b"authority"],
        bump = authority.bump
    )]
    pub authority: Account<'info, ProgramAuthority>,

    #[account(
        init,
        payer = freelancer,
        space = 8 + JobCompletionBadge::INIT_SPACE,
        seeds = [
            b"job-badge",
            freelancer.key().as_ref(),
            contract_id.as_bytes()
        ],
        bump
    )]
    pub job_badge: Account<'info, JobCompletionBadge>,

    #[account(
        init,
        payer = freelancer,
        mint::decimals = 0,
        mint::authority = mint,
        mint::token_program = token_program,
        seeds = [
            b"job-badge-mint",
            freelancer.key().as_ref(),
            contract_id.as_bytes()
        ],
        bump
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        payer = freelancer,
        associated_token::mint = mint,
        associated_token::authority = freelancer,
        associated_token::token_program = token_program
    )]
    pub token_account: InterfaceAccount<'info, TokenAccount>,

    
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    #[account(mut)]
    pub freelancer: Signer<'info>,

    
    pub client: UncheckedAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}



#[account]
#[derive(InitSpace)]
pub struct ProgramAuthority {
    pub admin: Pubkey,
    pub total_badges_minted: u64,
    pub total_job_badges_minted: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct TestResult {
    pub candidate: Pubkey,
    pub skill_category: SkillCategory,
    pub score: u8,
    pub passed: bool,
    pub test_date: i64,
    pub duration: i64,
    pub proctored: bool,
    pub badge_minted: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Badge {
    pub mint: Pubkey,
    pub owner: Pubkey,
    pub skill_category: SkillCategory,
    pub issue_date: i64,
    pub expiry_date: i64,
    pub test_score: u8,
    pub is_valid: bool,
    pub revoked: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Leaderboard {
    pub skill_category: SkillCategory,
    #[max_len(100)]
    pub entries: Vec<LeaderboardEntry>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct LeaderboardEntry {
    pub candidate: Pubkey,
    pub total_score: u32,
    pub test_count: u32,
    pub average_score: u32,
    pub badge_count: u32,
    pub last_updated: i64,
}

#[account]
#[derive(InitSpace)]
pub struct JobCompletionBadge {
    pub mint: Pubkey,
    pub freelancer: Pubkey,
    pub client: Pubkey,
    #[max_len(32)]
    pub contract_id: String,
    #[max_len(64)]
    pub job_title: String,
    pub completion_date: i64,
    pub contract_amount: u64,
    pub is_valid: bool,
    pub bump: u8,
}



#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace, Debug)]
pub enum SkillCategory {
    SolanaDeveloper,
    UIUXDesigner,
    ContentWriter,
    DataAnalyst,
    MarketingSpecialist,
    FrontendDeveloper,
}

impl SkillCategory {
    pub fn to_string(&self) -> String {
        match self {
            SkillCategory::SolanaDeveloper => "Solana Developer".to_string(),
            SkillCategory::UIUXDesigner => "UI/UX Designer".to_string(),
            SkillCategory::ContentWriter => "Content Writer".to_string(),
            SkillCategory::DataAnalyst => "Data Analyst".to_string(),
            SkillCategory::MarketingSpecialist => "Marketing Specialist".to_string(),
            SkillCategory::FrontendDeveloper => "Frontend Developer".to_string(),
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VerificationResult {
    pub owner: Pubkey,
    pub skill_category: SkillCategory,
    pub test_score: u8,
    pub issue_date: i64,
    pub expiry_date: i64,
    pub is_valid: bool,
    pub is_expired: bool,
    pub is_revoked: bool,
}



#[event]
pub struct TestCompletedEvent {
    pub candidate: Pubkey,
    pub skill_category: SkillCategory,
    pub score: u8,
    pub passed: bool,
}

#[event]
pub struct BadgeMintedEvent {
    pub candidate: Pubkey,
    pub skill_category: SkillCategory,
    pub mint: Pubkey,
    pub score: u8,
    pub expiry_date: i64,
}

#[event]
pub struct BadgeVerifiedEvent {
    pub badge: Pubkey,
    pub verifier: Pubkey,
    pub is_valid: bool,
}

#[event]
pub struct BadgeRevokedEvent {
    pub badge: Pubkey,
    pub owner: Pubkey,
    pub skill_category: SkillCategory,
    pub reason: String,
}

#[event]
pub struct JobBadgeMintedEvent {
    pub freelancer: Pubkey,
    pub contract_id: String,
    pub job_title: String,
    pub mint: Pubkey,
    pub completion_date: i64,
}



#[error_code]
pub enum ErrorCode {
    #[msg("Invalid score (0-100)")]
    InvalidScore,
    #[msg("Score too low (minimum 70%)")]
    ScoreTooLow,
    #[msg("Test not passed")]
    TestNotPassed,
    #[msg("Badge already minted")]
    BadgeAlreadyMinted,
    #[msg("Badge already revoked")]
    BadgeAlreadyRevoked,
}