use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("J4cUiyURTW8woQCsc3YQwPPe2jMr8M27HFKWst468tUk");

#[program]
pub mod credchain {
    use super::*;

    

    
    pub fn create_contract(
        ctx: Context<CreateContract>,
        contract_id: String,
        title: String,
        description: String,
        total_amount: u64,
        milestones: Vec<MilestoneData>,
        payment_token: Pubkey,
    ) -> Result<()> {
        require!(milestones.len() > 0 && milestones.len() <= 5, ErrorCode::InvalidMilestoneCount);

        let contract = &mut ctx.accounts.contract;
        contract.contract_id = contract_id;
        contract.title = title;
        contract.description = description;
        contract.client = ctx.accounts.client.key();
        contract.freelancer = ctx.accounts.freelancer.key();
        contract.total_amount = total_amount;
        contract.paid_amount = 0;
        contract.payment_token = payment_token;
        contract.status = ContractStatus::Active;
        contract.created_at = Clock::get()?.unix_timestamp;
        contract.nda_signed_client = false;
        contract.nda_signed_freelancer = false;
        contract.bump = ctx.bumps.contract;

        
        for (i, milestone_data) in milestones.iter().enumerate() {
            contract.milestones.push(Milestone {
                index: i as u8,
                title: milestone_data.title.clone(),
                description: milestone_data.description.clone(),
                amount: milestone_data.amount,
                deadline: milestone_data.deadline,
                status: MilestoneStatus::Pending,
                completed_at: 0,
                revision_count: 0,
                deliverables: vec![],
            });
        }

        msg!("Contract created: {}", contract.contract_id);
        Ok(())
    }

    
    pub fn deposit_escrow(
        ctx: Context<DepositEscrow>,
        amount: u64,
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        require!(contract.status == ContractStatus::Active, ErrorCode::InvalidContractStatus);
        require!(amount == contract.total_amount, ErrorCode::InvalidDepositAmount);

        
        let cpi_accounts = Transfer {
            from: ctx.accounts.client_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.client.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        contract.status = ContractStatus::Funded;
        msg!("Escrow funded: {} tokens", amount);
        Ok(())
    }

    
    pub fn sign_nda(ctx: Context<SignNDA>) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let signer = ctx.accounts.signer.key();

        if signer == contract.client {
            contract.nda_signed_client = true;
        } else if signer == contract.freelancer {
            contract.nda_signed_freelancer = true;
        } else {
            return Err(ErrorCode::UnauthorizedSigner.into());
        }

        msg!("NDA signed by: {}", signer);
        Ok(())
    }

    
    pub fn submit_deliverable(
        ctx: Context<SubmitDeliverable>,
        milestone_index: u8,
        ipfs_hash: String,
        file_name: String,
        description: String,
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        require!(ctx.accounts.freelancer.key() == contract.freelancer, ErrorCode::UnauthorizedFreelancer);
        require!((milestone_index as usize) < contract.milestones.len(), ErrorCode::InvalidMilestoneIndex);

        let milestone = &mut contract.milestones[milestone_index as usize];
        require!(milestone.status == MilestoneStatus::Pending, ErrorCode::InvalidMilestoneStatus);

        milestone.deliverables.push(Deliverable {
            ipfs_hash,
            file_name,
            description,
            uploaded_at: Clock::get()?.unix_timestamp,
        });

        milestone.status = MilestoneStatus::UnderReview;
        msg!("Deliverable submitted for milestone {}", milestone_index);
        Ok(())
    }

    
    pub fn request_revision(
        ctx: Context<RequestRevision>,
        milestone_index: u8,
        reason: String,
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        require!(ctx.accounts.client.key() == contract.client, ErrorCode::UnauthorizedClient);
        require!((milestone_index as usize) < contract.milestones.len(), ErrorCode::InvalidMilestoneIndex);

        
        let contract_id = contract.contract_id.clone();

        let milestone = &mut contract.milestones[milestone_index as usize];
        require!(milestone.status == MilestoneStatus::UnderReview, ErrorCode::InvalidMilestoneStatus);
        require!(milestone.revision_count < 3, ErrorCode::MaxRevisionsReached);

        milestone.revision_count += 1;
        milestone.status = MilestoneStatus::RevisionRequested;
        let revision_count = milestone.revision_count;

        emit!(RevisionRequestedEvent {
            contract_id,
            milestone_index,
            reason,
            revision_count,
        });

        msg!("Revision requested for milestone {}", milestone_index);
        Ok(())
    }

    
    pub fn approve_milestone(
        ctx: Context<ApproveMilestone>,
        milestone_index: u8,
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        require!(ctx.accounts.client.key() == contract.client, ErrorCode::UnauthorizedClient);
        require!(contract.status == ContractStatus::Funded, ErrorCode::InvalidContractStatus);
        require!((milestone_index as usize) < contract.milestones.len(), ErrorCode::InvalidMilestoneIndex);

        
        let amount = contract.milestones[milestone_index as usize].amount;
        require!(
            contract.milestones[milestone_index as usize].status == MilestoneStatus::UnderReview,
            ErrorCode::InvalidMilestoneStatus
        );

        
        let contract_id = contract.contract_id.clone();
        let contract_bump = contract.bump;

        
        let seeds = &[
            b"contract",
            contract_id.as_bytes(),
            &[contract_bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.freelancer_token_account.to_account_info(),
            authority: contract.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        
        contract.milestones[milestone_index as usize].status = MilestoneStatus::Completed;
        contract.milestones[milestone_index as usize].completed_at = Clock::get()?.unix_timestamp;
        contract.paid_amount += amount;

        
        if contract.milestones.iter().all(|m| m.status == MilestoneStatus::Completed) {
            contract.status = ContractStatus::Completed;
        }

        emit!(MilestoneApprovedEvent {
            contract_id,
            milestone_index,
            amount,
        });

        msg!("Milestone {} approved, {} tokens released", milestone_index, amount);
        Ok(())
    }

    
    pub fn open_dispute(
        ctx: Context<OpenDispute>,
        category: DisputeCategory,
        reason: String,
        description: String,
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let dispute = &mut ctx.accounts.dispute;

        require!(
            ctx.accounts.initiator.key() == contract.client ||
            ctx.accounts.initiator.key() == contract.freelancer,
            ErrorCode::UnauthorizedDispute
        );

        dispute.contract = contract.key();
        dispute.initiator = ctx.accounts.initiator.key();
        dispute.category = category;
        dispute.reason = reason;
        dispute.description = description;
        dispute.status = DisputeStatus::Open;
        dispute.created_at = Clock::get()?.unix_timestamp;
        dispute.arbitrators = vec![];
        dispute.votes = vec![];
        dispute.bump = ctx.bumps.dispute;

        contract.status = ContractStatus::Disputed;

        emit!(DisputeOpenedEvent {
            contract_id: contract.contract_id.clone(),
            initiator: dispute.initiator,
            category: dispute.category.clone(),
        });

        msg!("Dispute opened");
        Ok(())
    }

    
    pub fn submit_arbitrator_vote(
        ctx: Context<SubmitArbitratorVote>,
        vote_for_client: bool,
        reasoning: String,
    ) -> Result<()> {
        let dispute = &mut ctx.accounts.dispute;
        require!(dispute.status == DisputeStatus::UnderReview, ErrorCode::InvalidDisputeStatus);

        
        require!(
            dispute.arbitrators.contains(&ctx.accounts.arbitrator.key()),
            ErrorCode::UnauthorizedArbitrator
        );

        
        require!(
            !dispute.votes.iter().any(|v| v.arbitrator == ctx.accounts.arbitrator.key()),
            ErrorCode::AlreadyVoted
        );

        dispute.votes.push(ArbitratorVote {
            arbitrator: ctx.accounts.arbitrator.key(),
            vote_for_client,
            reasoning,
            voted_at: Clock::get()?.unix_timestamp,
        });

        
        if dispute.votes.len() >= 2 {
            let client_votes = dispute.votes.iter().filter(|v| v.vote_for_client).count();
            dispute.status = if client_votes >= 2 {
                DisputeStatus::ResolvedForClient
            } else {
                DisputeStatus::ResolvedForFreelancer
            };
        }

        msg!("Arbitrator vote submitted");
        Ok(())
    }

    

    
    pub fn start_time_session(
        ctx: Context<StartTimeSession>,
        _contract_id: String,
        milestone_index: u8,
        _session_nonce: u64,
    ) -> Result<()> {
        let session = &mut ctx.accounts.session;
        session.contract = ctx.accounts.contract.key();
        session.freelancer = ctx.accounts.freelancer.key();
        session.milestone_index = milestone_index;
        session.start_time = Clock::get()?.unix_timestamp;
        session.end_time = 0;
        session.duration = 0;
        session.description = String::new();
        session.bump = ctx.bumps.session;

        msg!("Time session started");
        Ok(())
    }

    
    pub fn end_time_session(
        ctx: Context<EndTimeSession>,
        description: String,
    ) -> Result<()> {
        let session = &mut ctx.accounts.session;
        let current_time = Clock::get()?.unix_timestamp;

        session.end_time = current_time;
        session.duration = current_time - session.start_time;
        session.description = description;

        msg!("Time session ended: {} seconds", session.duration);
        Ok(())
    }
}



#[derive(Accounts)]
#[instruction(contract_id: String)]
pub struct CreateContract<'info> {
    #[account(
        init,
        payer = client,
        space = 8 + 4000, 
        seeds = [b"contract", contract_id.as_bytes()],
        bump
    )]
    pub contract: Account<'info, Contract>,
    #[account(mut)]
    pub client: Signer<'info>,

    
    pub freelancer: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositEscrow<'info> {
    #[account(mut)]
    pub contract: Account<'info, Contract>,
    #[account(mut)]
    pub client: Signer<'info>,
    #[account(mut)]
    pub client_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SignNDA<'info> {
    #[account(mut)]
    pub contract: Account<'info, Contract>,
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct SubmitDeliverable<'info> {
    #[account(mut)]
    pub contract: Account<'info, Contract>,
    pub freelancer: Signer<'info>,
}

#[derive(Accounts)]
pub struct RequestRevision<'info> {
    #[account(mut)]
    pub contract: Account<'info, Contract>,
    pub client: Signer<'info>,
}

#[derive(Accounts)]
pub struct ApproveMilestone<'info> {
    #[account(mut)]
    pub contract: Account<'info, Contract>,
    #[account(mut)]
    pub client: Signer<'info>,
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub freelancer_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct OpenDispute<'info> {
    #[account(mut)]
    pub contract: Account<'info, Contract>,
    #[account(
        init,
        payer = initiator,
        space = 8 + Dispute::INIT_SPACE,
        seeds = [b"dispute", contract.key().as_ref()],
        bump
    )]
    pub dispute: Account<'info, Dispute>,
    #[account(mut)]
    pub initiator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitArbitratorVote<'info> {
    #[account(mut)]
    pub dispute: Account<'info, Dispute>,
    pub arbitrator: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(_contract_id: String, _milestone_index: u8, session_nonce: u64)]
pub struct StartTimeSession<'info> {
    pub contract: Account<'info, Contract>,
    #[account(
        init,
        payer = freelancer,
        space = 8 + TimeSession::INIT_SPACE,
        seeds = [b"session", contract.key().as_ref(), &session_nonce.to_le_bytes()],
        bump
    )]
    pub session: Account<'info, TimeSession>,
    #[account(mut)]
    pub freelancer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EndTimeSession<'info> {
    #[account(mut)]
    pub session: Account<'info, TimeSession>,
    pub freelancer: Signer<'info>,
}



#[account]
#[derive(InitSpace)]
pub struct Contract {
    #[max_len(32)]  
    pub contract_id: String,
    #[max_len(64)]  
    pub title: String,
    #[max_len(200)] 
    pub description: String,
    pub client: Pubkey,
    pub freelancer: Pubkey,
    pub total_amount: u64,
    pub paid_amount: u64,
    pub payment_token: Pubkey,
    pub status: ContractStatus,
    pub created_at: i64,
    pub nda_signed_client: bool,
    pub nda_signed_freelancer: bool,
    #[max_len(5)]  
    pub milestones: Vec<Milestone>,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct Milestone {
    pub index: u8,
    #[max_len(64)]  
    pub title: String,
    #[max_len(150)] 
    pub description: String,
    pub amount: u64,
    pub deadline: i64,
    pub status: MilestoneStatus,
    pub completed_at: i64,
    pub revision_count: u8,
    #[max_len(3)]  
    pub deliverables: Vec<Deliverable>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct Deliverable {
    #[max_len(64)]  
    pub ipfs_hash: String,
    #[max_len(64)]  
    pub file_name: String,
    #[max_len(100)] 
    pub description: String,
    pub uploaded_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct MilestoneData {
    #[max_len(64)]  
    pub title: String,
    #[max_len(150)] 
    pub description: String,
    pub amount: u64,
    pub deadline: i64,
}

#[account]
#[derive(InitSpace)]
pub struct Dispute {
    pub contract: Pubkey,
    pub initiator: Pubkey,
    pub category: DisputeCategory,
    #[max_len(100)]
    pub reason: String,
    #[max_len(1000)]
    pub description: String,
    pub status: DisputeStatus,
    pub created_at: i64,
    #[max_len(3)]
    pub arbitrators: Vec<Pubkey>,
    #[max_len(3)]
    pub votes: Vec<ArbitratorVote>,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct ArbitratorVote {
    pub arbitrator: Pubkey,
    pub vote_for_client: bool,
    #[max_len(500)]
    pub reasoning: String,
    pub voted_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct TimeSession {
    pub contract: Pubkey,
    pub freelancer: Pubkey,
    pub milestone_index: u8,
    pub start_time: i64,
    pub end_time: i64,
    pub duration: i64,
    #[max_len(200)]
    pub description: String,
    pub bump: u8,
}



#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum ContractStatus {
    Active,
    Funded,
    InProgress,
    Completed,
    Disputed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum MilestoneStatus {
    Pending,
    UnderReview,
    RevisionRequested,
    Completed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum DisputeCategory {
    Quality,
    Deadline,
    Scope,
    Payment,
    Communication,
    Other,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum DisputeStatus {
    Open,
    UnderReview,
    ResolvedForClient,
    ResolvedForFreelancer,
    Cancelled,
}



#[event]
pub struct RevisionRequestedEvent {
    pub contract_id: String,
    pub milestone_index: u8,
    pub reason: String,
    pub revision_count: u8,
}

#[event]
pub struct MilestoneApprovedEvent {
    pub contract_id: String,
    pub milestone_index: u8,
    pub amount: u64,
}

#[event]
pub struct DisputeOpenedEvent {
    pub contract_id: String,
    pub initiator: Pubkey,
    pub category: DisputeCategory,
}



#[error_code]
pub enum ErrorCode {
    #[msg("Invalid milestone count (1-5 allowed)")]
    InvalidMilestoneCount,
    #[msg("Invalid contract status")]
    InvalidContractStatus,
    #[msg("Invalid deposit amount")]
    InvalidDepositAmount,
    #[msg("Unauthorized signer")]
    UnauthorizedSigner,
    #[msg("Unauthorized freelancer")]
    UnauthorizedFreelancer,
    #[msg("Unauthorized client")]
    UnauthorizedClient,
    #[msg("Invalid milestone index")]
    InvalidMilestoneIndex,
    #[msg("Invalid milestone status")]
    InvalidMilestoneStatus,
    #[msg("Maximum revisions reached (3)")]
    MaxRevisionsReached,
    #[msg("Unauthorized dispute initiator")]
    UnauthorizedDispute,
    #[msg("Invalid dispute status")]
    InvalidDisputeStatus,
    #[msg("Unauthorized arbitrator")]
    UnauthorizedArbitrator,
    #[msg("Already voted")]
    AlreadyVoted,
}