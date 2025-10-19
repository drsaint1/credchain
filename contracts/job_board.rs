use anchor_lang::prelude::*;

declare_id!("mUfeb5rs5gH8n92VCqbuVNWPaU333tM6BhKZvTFEfvd");

#[program]
pub mod job_board {
    use super::*;

    
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let authority = &mut ctx.accounts.authority;
        authority.admin = ctx.accounts.admin.key();
        authority.total_jobs_posted = 0;
        authority.total_applications = 0;
        authority.platform_fee_bps = 250; 
        authority.bump = ctx.bumps.authority;

        msg!("Job Board program initialized");
        Ok(())
    }

    
    pub fn post_job(
        ctx: Context<PostJob>,
        job_id: String,
        title: String,
        description: String,
        budget_min: u64,
        budget_max: u64,
        job_type: JobType,
        duration: String,
        location: String,
        required_badges: Vec<SkillCategory>,
    ) -> Result<()> {
        require!(title.len() <= 100, ErrorCode::TitleTooLong);
        require!(description.len() <= 500, ErrorCode::DescriptionTooLong);
        require!(job_id.len() <= 32, ErrorCode::JobIdTooLong);
        require!(budget_max >= budget_min, ErrorCode::InvalidBudgetRange);
        require!(required_badges.len() > 0 && required_badges.len() <= 5, ErrorCode::InvalidBadgeCount);

        let job = &mut ctx.accounts.job;
        job.job_id = job_id;
        job.title = title;
        job.description = description;
        job.employer = ctx.accounts.employer.key();
        job.budget_min = budget_min;
        job.budget_max = budget_max;
        job.job_type = job_type;
        job.duration = duration;
        job.location = location;
        job.required_badges = required_badges.clone();
        job.status = JobStatus::Open;
        job.created_at = Clock::get()?.unix_timestamp;
        job.applicant_count = 0;
        job.selected_freelancer = None;
        job.bump = ctx.bumps.job;

        
        let authority = &mut ctx.accounts.authority;
        authority.total_jobs_posted += 1;

        emit!(JobPostedEvent {
            job_id: job.job_id.clone(),
            employer: job.employer,
            title: job.title.clone(),
            budget_min,
            budget_max,
            required_badges,
        });

        msg!("Job posted: {}", job.job_id);
        Ok(())
    }

    
    pub fn apply_to_job(
        ctx: Context<ApplyToJob>,
        cover_letter: String,
        proposed_budget: u64,
        timeline: String,
        portfolio_url: String,
    ) -> Result<()> {
        require!(cover_letter.len() <= 1000, ErrorCode::CoverLetterTooLong);
        require!(timeline.len() <= 100, ErrorCode::TimelineTooLong);
        require!(portfolio_url.len() <= 200, ErrorCode::PortfolioUrlTooLong);

        let job = &mut ctx.accounts.job;
        require!(job.status == JobStatus::Open, ErrorCode::JobNotOpen);

        
        let job_key = job.key();

        
        let freelancer_key = ctx.accounts.freelancer.key();
        for _required_badge in &job.required_badges {
            let badge = &ctx.remaining_accounts[0]; 
            
            
            require!(
                badge.owner == ctx.accounts.badge_program.key,
                ErrorCode::InvalidBadge
            );
        }

        let application = &mut ctx.accounts.application;
        application.job = job_key;
        application.freelancer = freelancer_key;
        application.cover_letter = cover_letter;
        application.proposed_budget = proposed_budget;
        application.timeline = timeline;
        application.portfolio_url = portfolio_url;
        application.status = ApplicationStatus::Pending;
        application.applied_at = Clock::get()?.unix_timestamp;
        application.bump = ctx.bumps.application;

        
        job.applicant_count += 1;

        
        let authority = &mut ctx.accounts.authority;
        authority.total_applications += 1;

        emit!(ApplicationSubmittedEvent {
            job_id: job.job_id.clone(),
            freelancer: freelancer_key,
            proposed_budget,
        });

        msg!("Application submitted for job: {}", job.job_id);
        Ok(())
    }

    
    pub fn accept_application(
        ctx: Context<AcceptApplication>,
    ) -> Result<()> {
        let job = &mut ctx.accounts.job;
        let application = &mut ctx.accounts.application;

        require!(job.status == JobStatus::Open, ErrorCode::JobNotOpen);
        require!(ctx.accounts.employer.key() == job.employer, ErrorCode::UnauthorizedEmployer);
        require!(application.status == ApplicationStatus::Pending, ErrorCode::InvalidApplicationStatus);

        
        application.status = ApplicationStatus::Accepted;

        
        job.status = JobStatus::InProgress;
        job.selected_freelancer = Some(application.freelancer);

        emit!(ApplicationAcceptedEvent {
            job_id: job.job_id.clone(),
            freelancer: application.freelancer,
        });

        msg!("Application accepted for job: {}", job.job_id);
        Ok(())
    }

    
    pub fn reject_application(
        ctx: Context<RejectApplication>,
    ) -> Result<()> {
        let job = &ctx.accounts.job;
        let application = &mut ctx.accounts.application;

        require!(ctx.accounts.employer.key() == job.employer, ErrorCode::UnauthorizedEmployer);
        require!(application.status == ApplicationStatus::Pending, ErrorCode::InvalidApplicationStatus);

        application.status = ApplicationStatus::Rejected;

        emit!(ApplicationRejectedEvent {
            job_id: job.job_id.clone(),
            freelancer: application.freelancer,
        });

        msg!("Application rejected");
        Ok(())
    }

    
    pub fn close_job(
        ctx: Context<CloseJob>,
    ) -> Result<()> {
        let job = &mut ctx.accounts.job;

        require!(ctx.accounts.employer.key() == job.employer, ErrorCode::UnauthorizedEmployer);
        require!(
            job.status == JobStatus::Open || job.status == JobStatus::InProgress,
            ErrorCode::InvalidJobStatus
        );

        job.status = JobStatus::Closed;

        emit!(JobClosedEvent {
            job_id: job.job_id.clone(),
        });

        msg!("Job closed: {}", job.job_id);
        Ok(())
    }

    
    pub fn complete_job(
        ctx: Context<CompleteJob>,
    ) -> Result<()> {
        let job = &mut ctx.accounts.job;

        require!(ctx.accounts.employer.key() == job.employer, ErrorCode::UnauthorizedEmployer);
        require!(job.status == JobStatus::InProgress, ErrorCode::InvalidJobStatus);

        job.status = JobStatus::Completed;

        emit!(JobCompletedEvent {
            job_id: job.job_id.clone(),
            freelancer: job.selected_freelancer.unwrap(),
        });

        msg!("Job completed: {}", job.job_id);
        Ok(())
    }
}



#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + JobBoardAuthority::INIT_SPACE,
        seeds = [b"job-board-authority"],
        bump
    )]
    pub authority: Account<'info, JobBoardAuthority>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(job_id: String)]
pub struct PostJob<'info> {
    #[account(
        mut,
        seeds = [b"job-board-authority"],
        bump = authority.bump
    )]
    pub authority: Account<'info, JobBoardAuthority>,

    #[account(
        init,
        payer = employer,
        space = 8 + Job::INIT_SPACE,
        seeds = [b"job", job_id.as_bytes()],
        bump
    )]
    pub job: Account<'info, Job>,

    #[account(mut)]
    pub employer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApplyToJob<'info> {
    #[account(
        mut,
        seeds = [b"job-board-authority"],
        bump = authority.bump
    )]
    pub authority: Account<'info, JobBoardAuthority>,

    #[account(mut)]
    pub job: Account<'info, Job>,

    #[account(
        init,
        payer = freelancer,
        space = 8 + JobApplication::INIT_SPACE,
        seeds = [b"application", job.key().as_ref(), freelancer.key().as_ref()],
        bump
    )]
    pub application: Account<'info, JobApplication>,

    #[account(mut)]
    pub freelancer: Signer<'info>,

    
    pub badge_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AcceptApplication<'info> {
    #[account(mut)]
    pub job: Account<'info, Job>,

    #[account(mut)]
    pub application: Account<'info, JobApplication>,

    pub employer: Signer<'info>,
}

#[derive(Accounts)]
pub struct RejectApplication<'info> {
    pub job: Account<'info, Job>,

    #[account(mut)]
    pub application: Account<'info, JobApplication>,

    pub employer: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseJob<'info> {
    #[account(mut)]
    pub job: Account<'info, Job>,

    pub employer: Signer<'info>,
}

#[derive(Accounts)]
pub struct CompleteJob<'info> {
    #[account(mut)]
    pub job: Account<'info, Job>,

    pub employer: Signer<'info>,
}



#[account]
#[derive(InitSpace)]
pub struct JobBoardAuthority {
    pub admin: Pubkey,
    pub total_jobs_posted: u64,
    pub total_applications: u64,
    pub platform_fee_bps: u16, 
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Job {
    #[max_len(32)]
    pub job_id: String,
    #[max_len(100)]
    pub title: String,
    #[max_len(500)]
    pub description: String,
    pub employer: Pubkey,
    pub budget_min: u64,
    pub budget_max: u64,
    pub job_type: JobType,
    #[max_len(50)]
    pub duration: String,
    #[max_len(100)]
    pub location: String,
    #[max_len(5)]
    pub required_badges: Vec<SkillCategory>,
    pub status: JobStatus,
    pub created_at: i64,
    pub applicant_count: u32,
    pub selected_freelancer: Option<Pubkey>,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct JobApplication {
    pub job: Pubkey,
    pub freelancer: Pubkey,
    #[max_len(1000)]
    pub cover_letter: String,
    pub proposed_budget: u64,
    #[max_len(100)]
    pub timeline: String,
    #[max_len(200)]
    pub portfolio_url: String,
    pub status: ApplicationStatus,
    pub applied_at: i64,
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace, Debug)]
pub enum JobType {
    FullTime,
    PartTime,
    Contract,
    Freelance,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace, Debug)]
pub enum JobStatus {
    Open,
    InProgress,
    Completed,
    Closed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace, Debug)]
pub enum ApplicationStatus {
    Pending,
    Accepted,
    Rejected,
    Withdrawn,
}



#[event]
pub struct JobPostedEvent {
    pub job_id: String,
    pub employer: Pubkey,
    pub title: String,
    pub budget_min: u64,
    pub budget_max: u64,
    pub required_badges: Vec<SkillCategory>,
}

#[event]
pub struct ApplicationSubmittedEvent {
    pub job_id: String,
    pub freelancer: Pubkey,
    pub proposed_budget: u64,
}

#[event]
pub struct ApplicationAcceptedEvent {
    pub job_id: String,
    pub freelancer: Pubkey,
}

#[event]
pub struct ApplicationRejectedEvent {
    pub job_id: String,
    pub freelancer: Pubkey,
}

#[event]
pub struct JobClosedEvent {
    pub job_id: String,
}

#[event]
pub struct JobCompletedEvent {
    pub job_id: String,
    pub freelancer: Pubkey,
}



#[error_code]
pub enum ErrorCode {
    #[msg("Title too long (max 100 chars)")]
    TitleTooLong,
    #[msg("Description too long (max 500 chars)")]
    DescriptionTooLong,
    #[msg("Job ID too long (max 32 chars)")]
    JobIdTooLong,
    #[msg("Invalid budget range (max must be >= min)")]
    InvalidBudgetRange,
    #[msg("Invalid badge count (1-5 required)")]
    InvalidBadgeCount,
    #[msg("Cover letter too long (max 1000 chars)")]
    CoverLetterTooLong,
    #[msg("Timeline too long (max 100 chars)")]
    TimelineTooLong,
    #[msg("Portfolio URL too long (max 200 chars)")]
    PortfolioUrlTooLong,
    #[msg("Job is not open")]
    JobNotOpen,
    #[msg("Invalid badge - freelancer doesn't have required credentials")]
    InvalidBadge,
    #[msg("Unauthorized employer")]
    UnauthorizedEmployer,
    #[msg("Invalid application status")]
    InvalidApplicationStatus,
    #[msg("Invalid job status")]
    InvalidJobStatus,
}