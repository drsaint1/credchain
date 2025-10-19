import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

async function main() {
  
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const CREDCHAIN_PROGRAM_ID = new PublicKey("4BQVqgQLGJJTpKQBLkKiP9HrRxej4ZJdnd3SAwroviD5");

  
  const badgeProgram = anchor.workspace.BadgeNft as Program;
  const jobBoardProgram = anchor.workspace.JobBoard as Program;

  console.log("🚀 Starting CredChain Program Initialization...");
  console.log("📍 Network:", provider.connection.rpcEndpoint);
  console.log("👛 Admin Wallet:", provider.wallet.publicKey.toString());
  console.log("📦 Badge NFT Program ID:", badgeProgram.programId.toString());
  console.log("📦 Job Board Program ID:", jobBoardProgram.programId.toString());
  console.log("");

  

  console.log("🎯 Step 1: Initializing Badge NFT Program Authority...");

  const [authorityPDA, authorityBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("authority")],
    badgeProgram.programId
  );

  console.log("   Authority PDA:", authorityPDA.toString());
  console.log("   Authority Bump:", authorityBump);

  try {
    
    try {
      const authorityAccount = await (badgeProgram.account as any).programAuthority.fetch(authorityPDA);
      console.log("   ℹ️  Badge program already initialized!");
      console.log("   Admin:", authorityAccount.admin.toString());
      console.log("   Total Badges Minted:", authorityAccount.totalBadgesMinted.toString());
      console.log("   Total Job Badges Minted:", authorityAccount.totalJobBadgesMinted.toString());
    } catch (fetchErr) {
      
      console.log("   ⏳ Calling initialize instruction...");

      const tx = await (badgeProgram.methods as any)
        .initialize()
        .accounts({
          authority: authorityPDA,
          admin: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("   ✅ Badge NFT Program authority initialized!");
      console.log("   📝 Transaction signature:", tx);
      console.log("   🔗 View on Explorer:");
      console.log(`      https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    }
  } catch (err: any) {
    if (err.toString().includes("already in use") || err.toString().includes("custom program error: 0x0")) {
      console.log("   ℹ️  Badge program already initialized");
    } else {
      console.error("   ❌ Error initializing badge program:", err.message);
      throw err;
    }
  }

  console.log("");

  

  console.log("💼 Step 2: Initializing Job Board Program Authority...");

  const [jobBoardAuthorityPDA, jobBoardAuthorityBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("job-board-authority")],
    jobBoardProgram.programId
  );

  console.log("   Job Board Authority PDA:", jobBoardAuthorityPDA.toString());
  console.log("   Job Board Authority Bump:", jobBoardAuthorityBump);

  try {
    
    try {
      const jobBoardAuthority = await (jobBoardProgram.account as any).jobBoardAuthority.fetch(jobBoardAuthorityPDA);
      console.log("   ℹ️  Job Board program already initialized!");
      console.log("   Admin:", jobBoardAuthority.admin.toString());
      console.log("   Total Jobs Posted:", jobBoardAuthority.totalJobsPosted.toString());
      console.log("   Total Applications:", jobBoardAuthority.totalApplications.toString());
      console.log("   Platform Fee (bps):", jobBoardAuthority.platformFeeBps.toString());
    } catch (fetchErr) {
      
      console.log("   ⏳ Calling initialize instruction...");

      const tx = await (jobBoardProgram.methods as any)
        .initialize()
        .accounts({
          authority: jobBoardAuthorityPDA,
          admin: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("   ✅ Job Board Program authority initialized!");
      console.log("   📝 Transaction signature:", tx);
      console.log("   🔗 View on Explorer:");
      console.log(`      https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    }
  } catch (err: any) {
    if (err.toString().includes("already in use") || err.toString().includes("custom program error: 0x0")) {
      console.log("   ℹ️  Job Board program already initialized");
    } else {
      console.error("   ❌ Error initializing job board program:", err.message);
      throw err;
    }
  }

  console.log("");

  

  console.log("🏆 Step 3: Generating Leaderboard PDAs...");

  const skillCategories = [
    { name: "Solana Developer", key: "SolanaDeveloper" },
    { name: "UI/UX Designer", key: "UIUXDesigner" },
    { name: "Content Writer", key: "ContentWriter" },
    { name: "Data Analyst", key: "DataAnalyst" },
    { name: "Marketing Specialist", key: "MarketingSpecialist" },
    { name: "Frontend Developer", key: "FrontendDeveloper" }
  ];

  console.log("");
  console.log("📊 Leaderboard PDAs (auto-created on first test completion):");

  for (const category of skillCategories) {
    
    const [leaderboardPDA, leaderboardBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("leaderboard"), Buffer.from(category.name)],
      badgeProgram.programId
    );

    console.log(`   ${category.name}:`);
    console.log(`      PDA: ${leaderboardPDA.toString()}`);
    console.log(`      Bump: ${leaderboardBump}`);
  }

  console.log("");

  

  console.log("📋 Step 4: Example Contract PDA Generation...");
  console.log("");

  
  const exampleContractId = "contract-001";
  const [contractPDA, contractBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("contract"), Buffer.from(exampleContractId)],
    CREDCHAIN_PROGRAM_ID
  );

  console.log("   Example Contract PDA (ID: 'contract-001'):");
  console.log(`      PDA: ${contractPDA.toString()}`);
  console.log(`      Bump: ${contractBump}`);

  console.log("");

  
  const [disputePDA, disputeBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("dispute"), contractPDA.toBuffer()],
    CREDCHAIN_PROGRAM_ID
  );

  console.log("   Example Dispute PDA (for above contract):");
  console.log(`      PDA: ${disputePDA.toString()}`);
  console.log(`      Bump: ${disputeBump}`);

  console.log("");

  

  console.log("🏅 Step 5: Example Badge NFT PDAs...");
  console.log("");

  const exampleUserPubkey = provider.wallet.publicKey;
  const exampleSkillName = "Solana Developer"; 

  
  const testNonce = BigInt(Date.now());
  const testNonceBuffer = Buffer.alloc(8);
  testNonceBuffer.writeBigUInt64LE(testNonce);

  const [testResultPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("test-result"),
      exampleUserPubkey.toBuffer(),
      Buffer.from(exampleSkillName), 
      testNonceBuffer 
    ],
    badgeProgram.programId
  );

  const [badgePDA, badgeBump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("badge"),
      exampleUserPubkey.toBuffer(),
      Buffer.from(exampleSkillName) 
    ],
    badgeProgram.programId
  );

  const [badgeMintPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("badge-mint"),
      exampleUserPubkey.toBuffer(),
      Buffer.from(exampleSkillName) 
    ],
    badgeProgram.programId
  );

  console.log(`   Example Badge for user (${exampleUserPubkey.toString().slice(0, 8)}...):`);
  console.log(`      Skill: ${exampleSkillName}`);
  console.log(`      Badge PDA: ${badgePDA.toString()}`);
  console.log(`      Badge Bump: ${badgeBump}`);
  console.log(`      NFT Mint PDA: ${badgeMintPDA.toString()}`);

  console.log("");

  

  console.log("💼 Step 6: Example Job Completion Badge PDAs...");
  console.log("");

  const exampleContractIdForBadge = "contract-001";
  const exampleFreelancer = provider.wallet.publicKey;

  const [jobBadgePDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("job-badge"),
      exampleFreelancer.toBuffer(),
      Buffer.from(exampleContractIdForBadge)
    ],
    badgeProgram.programId
  );

  const [jobBadgeMintPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("job-badge-mint"),
      exampleFreelancer.toBuffer(),
      Buffer.from(exampleContractIdForBadge)
    ],
    badgeProgram.programId
  );

  console.log(`   Example Job Badge (Contract: ${exampleContractIdForBadge}):`);
  console.log(`      Job Badge PDA: ${jobBadgePDA.toString()}`);
  console.log(`      Job Badge Mint PDA: ${jobBadgeMintPDA.toString()}`);

  console.log("");
  console.log("═".repeat(80));
  console.log("");

  

  console.log("✨ INITIALIZATION SUMMARY");
  console.log("");
  console.log("📦 Program IDs:");
  console.log(`   CredChain (Escrow):  ${CREDCHAIN_PROGRAM_ID.toString()}`);
  console.log(`   Badge NFT:           ${badgeProgram.programId.toString()}`);
  console.log(`   Job Board:           ${jobBoardProgram.programId.toString()}`);
  console.log("");
  console.log("🔑 Key Accounts:");
  console.log(`   Admin Wallet:               ${provider.wallet.publicKey.toString()}`);
  console.log(`   Badge Authority PDA:        ${authorityPDA.toString()}`);
  console.log(`   Job Board Authority PDA:    ${jobBoardAuthorityPDA.toString()}`);
  console.log("");
  console.log("✅ Status:");
  console.log("   - Badge NFT Program: Ready");
  console.log("   - Job Board Program: Ready");
  console.log("   - Leaderboard PDAs: Will be created on first test");
  console.log("   - Contract PDAs: Created per contract ID");
  console.log("   - Badge PDAs: Created per user per skill");
  console.log("   - Job PDAs: Created per job ID");
  console.log("");
  console.log("═".repeat(80));
  console.log("");
  console.log("🔗 NEXT STEPS:");
  console.log("");
  console.log("1. Update Frontend Config:");
  console.log("   Create: credchain-frontend/src/config/programs.ts");
  console.log("   Add program IDs and network settings");
  console.log("");
  console.log("2. Test Contract Creation:");
  console.log("   - Navigate to /contracts in your frontend");
  console.log("   - Create a test contract");
  console.log("   - Verify PDA creation on Solana Explorer");
  console.log("");
  console.log("3. Test Badge Minting:");
  console.log("   - Navigate to /credentials");
  console.log("   - Complete a test (mock for now)");
  console.log("   - Mint NFT badge");
  console.log("");
  console.log("4. Verify on Explorer:");
  console.log(`   https://explorer.solana.com/address/${authorityPDA.toString()}?cluster=devnet`);
  console.log("");
  console.log("═".repeat(80));
  console.log("");
  console.log("🎉 Initialization Complete!");
  console.log("");
}

main()
  .then(() => {
    console.log("✅ Script executed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error during initialization:");
    console.error(error);
    process.exit(1);
  });