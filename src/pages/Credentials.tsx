import { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Award, Code, Palette, PenTool, BarChart3, Megaphone, Clock, Shield, CheckCircle } from 'lucide-react';
import { BN } from '@coral-xyz/anchor';
import { usePrograms } from '../hooks/usePrograms';
import { getBadgePDA, getBadgeMintPDA, getTestResultPDA, getMetadataPDA, getAssociatedTokenAddressPDA, getBadgeAuthorityPDA } from '../utils/pdaHelpers';
import { SkillCategory, SKILL_CATEGORY_NAMES, TEST_CONFIG } from '../config/programs';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useToastContext } from '../components/Layout';
import { SkillTestModal } from '../components/SkillTestModal';
import { skillTests } from '../data/testQuestions';
import { extractSkillCategory } from '../utils/badgeHelpers';

interface SkillCategoryUI {
  id: SkillCategory;
  name: string;
  icon: ReactElement;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

const skillCategories: SkillCategoryUI[] = [
  {
    id: SkillCategory.SolanaDeveloper,
    name: 'Solana Developer',
    icon: <Code className="w-8 h-8" />,
    description: 'Anchor framework, Rust, and Solana program development',
    duration: '90 minutes',
    difficulty: 'Advanced',
  },
  {
    id: SkillCategory.UIUXDesigner,
    name: 'UI/UX Designer',
    icon: <Palette className="w-8 h-8" />,
    description: 'Figma proficiency, design systems, and user research',
    duration: '120 minutes',
    difficulty: 'Intermediate',
  },
  {
    id: SkillCategory.ContentWriter,
    name: 'Content Writer',
    icon: <PenTool className="w-8 h-8" />,
    description: 'SEO writing, copywriting, and technical documentation',
    duration: '60 minutes',
    difficulty: 'Intermediate',
  },
  {
    id: SkillCategory.DataAnalyst,
    name: 'Data Analyst',
    icon: <BarChart3 className="w-8 h-8" />,
    description: 'SQL, Python, data visualization, and statistical analysis',
    duration: '90 minutes',
    difficulty: 'Advanced',
  },
  {
    id: SkillCategory.MarketingSpecialist,
    name: 'Marketing Specialist',
    icon: <Megaphone className="w-8 h-8" />,
    description: 'Campaign strategy, analytics, and growth marketing',
    duration: '75 minutes',
    difficulty: 'Intermediate',
  },
  {
    id: SkillCategory.FrontendDeveloper,
    name: 'Frontend Developer',
    icon: <Code className="w-8 h-8" />,
    description: 'React, TypeScript, and modern web development',
    duration: '120 minutes',
    difficulty: 'Advanced',
  },
];

export const Credentials = () => {
  const { publicKey, connected } = useWallet();
  const { badgeNftProgram } = usePrograms();
  const toast = useToastContext();
  const [selectedSkill, setSelectedSkill] = useState<SkillCategoryUI | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  // const [testScore, setTestScore] = useState(85); 

  
  useEffect(() => {
    if (connected && publicKey && badgeNftProgram) {
      fetchUserBadges();
    }
  }, [connected, publicKey, badgeNftProgram]);

  const fetchUserBadges = async () => {
    if (!publicKey || !badgeNftProgram) return;

    try {
      // @ts-expect-error - Account type from IDL
      const badges = await badgeNftProgram.account.badge.all([
        {
          memcmp: {
            offset: 8 + 32, 
            bytes: publicKey.toBase58(),
          }
        }
      ]);

      setUserBadges(badges);
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };

  const startTest = (skill: SkillCategoryUI) => {
    if (!connected || !publicKey) {
      toast.warning('Please connect your wallet first');
      return;
    }
    setSelectedSkill(skill);
    setShowTestModal(true);
  };

  const completeTestAndMintBadge = async (score: number, duration: number) => {
    if (!publicKey || !badgeNftProgram || !selectedSkill) {
      toast.warning('Please connect your wallet');
      return;
    }

    if (score < TEST_CONFIG.MIN_PASS_SCORE) {
      toast.error(`You need at least ${TEST_CONFIG.MIN_PASS_SCORE}% to earn a badge. You scored ${score}%. Please try again!`);
      setShowTestModal(false);
      setSelectedSkill(null);
      return;
    }

    setLoading(true);

    try {
      
      
      const testNonce = new BN(Date.now() + Math.floor(Math.random() * 1000));

      console.log('DEBUG: selectedSkill.id =', selectedSkill.id);
      console.log('DEBUG: testNonce =', testNonce.toString());

      const [testResultPDA] = getTestResultPDA(publicKey, selectedSkill.id, testNonce);

      
      
      const skillCategoryEnum = { [selectedSkill.id.charAt(0).toLowerCase() + selectedSkill.id.slice(1)]: {} };

      console.log('Recording test completion...');
      console.log('Test Result PDA:', testResultPDA.toBase58());
      console.log('Candidate:', publicKey.toBase58());
      console.log('Score:', score);
      console.log('Duration:', duration);
      console.log('Skill Category Enum:', skillCategoryEnum);
      console.log('Skill Category String:', selectedSkill.id);

      try {
        await badgeNftProgram.methods
          .recordTestCompletion(
            skillCategoryEnum,
            score,
            new BN(duration),
            true,
            testNonce
          )
          .accounts({
            testResult: testResultPDA,
            candidate: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        console.log('✅ Test recorded successfully!');
      } catch (recordError: any) {
        
        
        if (recordError.message?.includes('already been processed')) {
          console.log('⚠️ Transaction may have been processed already, checking account...');

          try {
            // @ts-expect-error - Account type from IDL
            const testResultAccount = await badgeNftProgram.account.testResult.fetch(testResultPDA);
            console.log('✅ Test result exists! Score:', testResultAccount.score, 'Passed:', testResultAccount.passed);

            if (!testResultAccount.passed) {
              throw new Error(`Test result exists but score ${testResultAccount.score}% is below passing threshold`);
            }
          } catch (fetchError) {
            
            throw recordError;
          }
        } else {
          throw recordError;
        }
      }


      const [badgePDA] = getBadgePDA(publicKey, selectedSkill.id);
      const [mintPDA] = getBadgeMintPDA(publicKey, selectedSkill.id);
      const [metadataPDA] = getMetadataPDA(mintPDA);
      const [tokenAccountPDA] = getAssociatedTokenAddressPDA(publicKey, mintPDA);
      const [authorityPDA] = getBadgeAuthorityPDA();

      const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
      const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

      console.log('Minting badge NFT...');
      console.log('Authority PDA:', authorityPDA.toBase58());
      console.log('Badge PDA:', badgePDA.toBase58());
      console.log('Mint PDA:', mintPDA.toBase58());
      console.log('Token Account PDA:', tokenAccountPDA.toBase58());
      console.log('Metadata PDA:', metadataPDA.toBase58());

      const tx = await badgeNftProgram.methods
        .mintBadge(skillCategoryEnum)
        .accounts({
          authority: authorityPDA, 
          testResult: testResultPDA,
          badge: badgePDA,
          mint: mintPDA,
          tokenAccount: tokenAccountPDA,
          metadata: metadataPDA,
          candidate: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          metadataProgram: METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: new PublicKey('SysvarRent111111111111111111111111111111111'),
        })
        .rpc();

      console.log('✅ Badge minted successfully!', tx);
      toast.success(`🎉 Congratulations! You passed with ${score}%! Badge NFT minted! Tx: ${tx.substring(0, 8)}...`);

      setShowTestModal(false);
      setSelectedSkill(null);

      
      await fetchUserBadges();
    } catch (error: any) {
      console.error('❌ Full Error:', error);
      console.error('Error Message:', error.message);
      console.error('Error Logs:', error.logs);

      let errorMessage = 'Failed to mint badge';

      if (error.message) {
        if (error.message.includes('0x1')) {
          errorMessage = 'Insufficient funds. Please add SOL to your wallet.';
        } else if (error.message.includes('0x0')) {
          errorMessage = 'Program error. Please check console for details.';
        } else if (error.message.includes('custom program error')) {
          errorMessage = 'Program error: ' + error.message;
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTestCancel = () => {
    setShowTestModal(false);
    setSelectedSkill(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'text-green-400 bg-green-400/20';
      case 'Intermediate':
        return 'text-yellow-400 bg-yellow-400/20';
      case 'Advanced':
        return 'text-red-400 bg-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const hasBadge = (skillId: SkillCategory) => {
    return userBadges.some(b => {
      const category = extractSkillCategory(b.account);
      return category === skillId;
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold">Skill Credentials</h1>
        <p className="text-gray-300 mt-2">Earn verifiable NFT badges by passing proctored skill tests</p>
      </div>

      
      {connected && userBadges.length > 0 && (
        <div className="glass-card p-8 space-y-4">
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Award className="w-6 h-6 text-primary-400" />
            <span>Your Badges ({userBadges.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userBadges.map((badge, index) => {
              const category = extractSkillCategory(badge.account);
              const skill = skillCategories.find(s => s.id === category);

              if (!category) return null;

              return (
                <div key={index} className="bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/30 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    {skill?.icon}
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="font-bold">{SKILL_CATEGORY_NAMES[category]}</h3>
                  <div className="text-sm text-gray-400">
                    <div>Score: {badge.account.testScore || badge.account.test_score}%</div>
                    <div>Valid: {(badge.account.isValid || badge.account.is_valid) && !badge.account.revoked ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      
      <div className="glass-card p-8 space-y-6">
        <h2 className="text-2xl font-bold flex items-center space-x-2">
          <Shield className="w-6 h-6 text-primary-400" />
          <span>How It Works</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { num: 1, title: 'Choose Test', desc: 'Select a skill category to certify' },
            { num: 2, title: 'Pass Challenge', desc: 'Score minimum 70% to qualify' },
            { num: 3, title: 'Mint NFT', desc: 'Receive badge on-chain' },
            { num: 4, title: 'Get Hired', desc: 'Access exclusive job board' },
          ].map(step => (
            <div key={step.num} className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto">
                <span className="text-xl font-bold text-primary-400">{step.num}</span>
              </div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm text-gray-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Available Certifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skillCategories.map((skill) => {
            const owned = hasBadge(skill.id);

            return (
              <div key={skill.id} className={`glass-card p-6 space-y-4 ${owned ? 'border-green-500/50' : 'hover:border-primary-500'} transition-all hover:scale-105`}>
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-700 rounded-xl flex items-center justify-center">
                    {skill.icon}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(skill.difficulty)}`}>
                    {skill.difficulty}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center space-x-2">
                    <span>{skill.name}</span>
                    {owned && <CheckCircle className="w-5 h-5 text-green-400" />}
                  </h3>
                  <p className="text-sm text-gray-400">{skill.description}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{skill.duration}</span>
                    </div>
                    <div className="text-xs">Min: 70%</div>
                  </div>
                </div>

                {connected ? (
                  <button
                    onClick={() => startTest(skill)}
                    className={owned ? "btn-secondary w-full" : "btn-primary w-full"}
                  >
                    {owned ? 'Retake Test' : 'Take Test'}
                  </button>
                ) : (
                  <button disabled className="btn-secondary w-full opacity-50 cursor-not-allowed">
                    Connect Wallet
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      
      {showTestModal && selectedSkill && (
        <SkillTestModal
          test={skillTests[selectedSkill.id]}
          onComplete={completeTestAndMintBadge}
          onCancel={handleTestCancel}
          loading={loading}
        />
      )}
    </div>
  );
};