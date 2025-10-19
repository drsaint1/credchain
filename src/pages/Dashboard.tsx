import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Award, FileCheck, DollarSign, TrendingUp, Star, Loader2, Trophy } from 'lucide-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { usePrograms } from '../hooks/usePrograms';
import { SKILL_CATEGORY_NAMES } from '../config/programs';
import { extractSkillCategory } from '../utils/badgeHelpers';

interface ContractData {
  publicKey: string;
  account: any;
}

interface BadgeData {
  publicKey: string;
  account: any;
}

interface CompletionNFTData {
  contractId: string;
  contractTitle: string;
  totalAmount: number;
  milestonesCompleted: number;
  totalMilestones: number;
  clientAddress: string;
  freelancerAddress: string;
  completedAt: number;
  userRole: 'client' | 'freelancer';
  userAddress: string;
  certificateDate: number;
  completionRate: string;
}

export const Dashboard = () => {
  const { connected, publicKey } = useWallet();
  const { credchainProgram, badgeNftProgram } = usePrograms();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [completionNFTs, setCompletionNFTs] = useState<CompletionNFTData[]>([]);
  const [stats, setStats] = useState({
    activeContracts: 0,
    totalEarned: 0,
    badgeCount: 0,
    completedMilestones: 0,
    completionNFTCount: 0,
  });

  useEffect(() => {
    if (connected && publicKey && credchainProgram && badgeNftProgram) {
      fetchDashboardData();
    }
  }, [connected, publicKey, credchainProgram, badgeNftProgram]);

  const fetchDashboardData = async () => {
    if (!publicKey || !credchainProgram || !badgeNftProgram) return;

    setLoading(true);
    try {
      // @ts-expect-error - Account type from IDL
      const allContracts = await credchainProgram.account.contract.all();

      const userContracts = allContracts.filter((c: any) =>
        c.account.client.toBase58() === publicKey.toBase58() ||
        c.account.freelancer.toBase58() === publicKey.toBase58()
      );

      setContracts(userContracts);

      // @ts-expect-error - Account type from IDL
      const userBadges = await badgeNftProgram.account.badge.all([
        {
          memcmp: {
            offset: 8 + 32, 
            bytes: publicKey.toBase58(),
          }
        }
      ]);

      setBadges(userBadges);

      
      const mintedNFTs = JSON.parse(localStorage.getItem('minted-completion-nfts') || '[]');
      const userCompletionNFTs: CompletionNFTData[] = [];

      mintedNFTs.forEach((nft: any) => {
        if (nft.userAddress === publicKey.toBase58()) {
          const storageKey = `completion-nft-${nft.userAddress}-${nft.contractId}`;
          const certificateData = localStorage.getItem(storageKey);
          if (certificateData) {
            userCompletionNFTs.push(JSON.parse(certificateData));
          }
        }
      });

      setCompletionNFTs(userCompletionNFTs);


      const activeCount = userContracts.filter((c: any) => {
        const status = Object.keys(c.account.status)[0];
        return status === 'active' || status === 'funded' || status === 'inProgress';
      }).length;

      let totalEarned = 0;
      let completedMilestones = 0;

      userContracts.forEach((contract: any) => {
        
        if (contract.account.freelancer.toBase58() === publicKey.toBase58()) {
          contract.account.milestones.forEach((milestone: any) => {
            const milestoneStatus = Object.keys(milestone.status)[0];
            if (milestoneStatus === 'completed') {
              totalEarned += milestone.amount.toNumber();
              completedMilestones++;
            }
          });
        }
      });

      setStats({
        activeContracts: activeCount,
        totalEarned: totalEarned / LAMPORTS_PER_SOL,
        badgeCount: userBadges.length,
        completedMilestones,
        completionNFTCount: userCompletionNFTs.length,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="glass-card p-12 text-center space-y-4">
        <FileCheck className="w-16 h-16 mx-auto text-primary-400 mb-4" />
        <h2 className="text-3xl font-bold">Connect Your Wallet</h2>
        <p className="text-gray-300">Please connect your Solana wallet to view your dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card p-12 text-center space-y-4">
        <Loader2 className="w-16 h-16 mx-auto text-primary-400 mb-4 animate-spin" />
        <h2 className="text-2xl font-bold">Loading Dashboard...</h2>
        <p className="text-gray-300">Fetching your contracts and badges from the blockchain.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'funded':
      case 'inProgress':
        return 'text-green-400 bg-green-400/20';
      case 'completed':
        return 'text-blue-400 bg-blue-400/20';
      case 'cancelled':
        return 'text-red-400 bg-red-400/20';
      case 'disputed':
        return 'text-yellow-400 bg-yellow-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/([A-Z])/g, ' $1');
  };

  const calculateContractProgress = (contract: any) => {
    const totalMilestones = contract.account.milestones.length;
    const completedMilestones = contract.account.milestones.filter((m: any) =>
      Object.keys(m.status)[0] === 'completed'
    ).length;
    return { completed: completedMilestones, total: totalMilestones };
  };

  const calculatePaidAmount = (contract: any) => {
    let paid = 0;
    contract.account.milestones.forEach((milestone: any) => {
      const status = Object.keys(milestone.status)[0];
      if (status === 'completed') {
        paid += milestone.amount.toNumber();
      }
    });
    return paid / LAMPORTS_PER_SOL;
  };

  const getBadgeIcon = (skillCategory: string) => {
    const icons: Record<string, string> = {
      'solanaDeveloper': '💻',
      'uiuxDesigner': '🎨',
      'contentWriter': '✍️',
      'dataAnalyst': '📊',
      'marketingSpecialist': '📢',
      'frontendDeveloper': '⚛️',
    };
    return icons[skillCategory] || '🏆';
  };

  const getBadgeColor = (skillCategory: string) => {
    const colors: Record<string, string> = {
      'solanaDeveloper': 'from-purple-500 to-purple-700',
      'uiuxDesigner': 'from-pink-500 to-pink-700',
      'contentWriter': 'from-blue-500 to-blue-700',
      'dataAnalyst': 'from-green-500 to-green-700',
      'marketingSpecialist': 'from-orange-500 to-orange-700',
      'frontendDeveloper': 'from-cyan-500 to-cyan-700',
    };
    return colors[skillCategory] || 'from-gray-500 to-gray-700';
  };

  // const formatDate = (timestamp: number) => {
  //   return new Date(timestamp * 1000).toLocaleDateString();
  // };

  return (
    <div className="space-y-8">
      
      <div>
        <h1 className="text-4xl md:text-5xl font-bold">Dashboard</h1>
        <p className="text-gray-300 mt-2 font-mono">{publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}</p>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-gray-400 text-sm">Active Contracts</div>
              <div className="text-3xl font-bold mt-1">{stats.activeContracts}</div>
            </div>
            <FileCheck className="w-8 h-8 text-primary-400" />
          </div>
          <div className="text-xs text-gray-400">{contracts.length} total contracts</div>
        </div>

        <div className="glass-card p-6 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-gray-400 text-sm">Total Earned</div>
              <div className="text-3xl font-bold mt-1">{stats.totalEarned.toFixed(2)} SOL</div>
            </div>
            <DollarSign className="w-8 h-8 text-accent-400" />
          </div>
          <div className="text-xs text-gray-400">{stats.completedMilestones} milestones completed</div>
        </div>

        <div className="glass-card p-6 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-gray-400 text-sm">Skill Badges</div>
              <div className="text-3xl font-bold mt-1">{stats.badgeCount}</div>
            </div>
            <Award className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="text-xs text-gray-400">
            {badges.length > 0 ? 'Verified credentials' : 'Earn your first badge!'}
          </div>
        </div>

        <div className="glass-card p-6 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-gray-400 text-sm">Completion Rate</div>
              <div className="text-3xl font-bold mt-1">
                {contracts.length > 0
                  ? Math.round((stats.completedMilestones / contracts.reduce((acc, c) => acc + c.account.milestones.length, 0)) * 100)
                  : 0}%
              </div>
            </div>
            <Star className="w-8 h-8 text-primary-400" />
          </div>
          <div className="text-xs text-gray-400">Based on milestones</div>
        </div>
      </div>

      
      {badges.length > 0 && (
        <div className="glass-card p-8 space-y-6">
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Award className="w-6 h-6 text-accent-400" />
            <span>My Skill Badges ({badges.length})</span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {badges.map((badge, index) => {
              const skillCategory = extractSkillCategory(badge.account);
              const isValid = (badge.account.isValid || badge.account.is_valid) && !badge.account.revoked;

              if (!skillCategory) return null;

              
              const skillCategoryKey = skillCategory.charAt(0).toLowerCase() + skillCategory.slice(1);

              return (
                <div key={index} className={`glass-card p-4 space-y-3 text-center hover:scale-105 transition-transform ${!isValid ? 'opacity-50' : ''}`}>
                  <div className={`w-16 h-16 bg-gradient-to-br ${getBadgeColor(skillCategoryKey)} rounded-xl flex items-center justify-center mx-auto text-3xl`}>
                    {getBadgeIcon(skillCategoryKey)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">
                      {SKILL_CATEGORY_NAMES[skillCategory]}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Score: {badge.account.testScore || badge.account.test_score}%
                    </div>
                    <div className="text-xs text-gray-400">
                      {isValid ? '✓ Valid' : '✗ Expired/Revoked'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      
      {completionNFTs.length > 0 && (
        <div className="glass-card p-8 space-y-6">
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-green-400" />
            <span>Job Completion Certificates ({completionNFTs.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completionNFTs.map((nft, index) => {
              const isClient = nft.userRole === 'client';
              const roleColor = isClient ? 'from-blue-500 to-blue-700' : 'from-green-500 to-green-700';
              const roleIcon = isClient ? '👔' : '💼';
              const certificateAge = Math.floor((Date.now() - nft.certificateDate) / (1000 * 60 * 60 * 24));

              return (
                <div key={index} className="glass-card p-5 space-y-4 hover:scale-105 transition-transform bg-gradient-to-br from-green-500/10 to-accent-500/10 border-green-500/30">
                  <div className="flex items-start space-x-3">
                    <div className={`w-14 h-14 bg-gradient-to-br ${roleColor} rounded-xl flex items-center justify-center flex-shrink-0 text-2xl`}>
                      {roleIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate">{nft.contractTitle}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full font-medium">
                          {nft.userRole === 'client' ? 'Client' : 'Freelancer'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {certificateAge === 0 ? 'Today' : `${certificateAge}d ago`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-lg p-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Milestones:</span>
                      <span className="font-semibold">{nft.milestonesCompleted}/{nft.totalMilestones}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Completion:</span>
                      <span className="font-semibold text-green-400">{nft.completionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Value:</span>
                      <span className="font-semibold text-primary-400">{(nft.totalAmount / LAMPORTS_PER_SOL).toFixed(2)} SOL</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <span className="text-gray-400">NFT:</span>
                      <div className="flex items-center space-x-1">
                        <span className="font-mono text-[10px] text-primary-400">Certificate</span>
                        <Trophy className="w-3 h-3 text-green-400" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {isClient ? 'Managed Project' : 'Delivered Work'}
                    </span>
                    <span className="text-green-400 font-semibold">✓ Verified</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Trophy className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold mb-1">About Completion NFTs</p>
                <p className="text-xs text-gray-400">
                  These certificates prove your successful project participation on CredChain.
                  They're visible to potential employers and contribute to your on-chain reputation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {contracts.length > 0 ? (
        <div className="glass-card p-8 space-y-6">
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <FileCheck className="w-6 h-6 text-primary-400" />
            <span>My Contracts ({contracts.length})</span>
          </h2>

          <div className="space-y-4">
            {contracts.slice(0, 5).map((contract, index) => {
              const status = Object.keys(contract.account.status)[0];
              const progress = calculateContractProgress(contract);
              const paidAmount = calculatePaidAmount(contract);
              const totalAmount = contract.account.totalAmount.toNumber() / LAMPORTS_PER_SOL;
              const isFreelancer = contract.account.freelancer.toBase58() === publicKey?.toBase58();
              const otherParty = isFreelancer ? contract.account.client : contract.account.freelancer;

              return (
                <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-primary-500 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-bold">{contract.account.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {getStatusLabel(status)}
                        </span>
                      </div>
                      <div className="flex flex-col space-y-1 text-sm text-gray-400">
                        <span className="font-mono">
                          {isFreelancer ? 'Client' : 'Freelancer'}: {otherParty.toBase58().slice(0, 8)}...{otherParty.toBase58().slice(-8)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {contract.account.description.slice(0, 100)}...
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end space-y-2">
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Progress</div>
                          <div className="font-semibold">{progress.completed}/{progress.total} milestones</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">{isFreelancer ? 'Earned' : 'Paid'}</div>
                          <div className="font-semibold text-primary-400">{paidAmount.toFixed(2)}/{totalAmount.toFixed(2)} SOL</div>
                        </div>
                      </div>
                      <div className="w-full md:w-48 bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all"
                          style={{ width: `${(paidAmount / totalAmount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {contracts.length > 5 && (
            <div className="text-center">
              <p className="text-gray-400 text-sm">Showing 5 of {contracts.length} contracts</p>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card p-12 text-center space-y-4">
          <FileCheck className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-2xl font-bold">No Contracts Yet</h3>
          <p className="text-gray-400">Create your first contract to get started!</p>
        </div>
      )}

      
      <div className="glass-card p-8 space-y-6">
        <h2 className="text-2xl font-bold flex items-center space-x-2">
          <TrendingUp className="w-6 h-6 text-accent-400" />
          <span>Quick Stats</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 p-6 rounded-lg space-y-2">
            <div className="text-3xl font-bold text-primary-400">{contracts.length}</div>
            <div className="text-sm text-gray-400">Total Contracts</div>
            <div className="text-xs text-gray-500">
              {contracts.filter(c => c.account.client.toBase58() === publicKey?.toBase58()).length} as client, {' '}
              {contracts.filter(c => c.account.freelancer.toBase58() === publicKey?.toBase58()).length} as freelancer
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-lg space-y-2">
            <div className="text-3xl font-bold text-accent-400">{stats.badgeCount}</div>
            <div className="text-sm text-gray-400">Verified Skills</div>
            <div className="text-xs text-gray-500">
              {badges.filter(b => (b.account.isValid || b.account.is_valid) && !b.account.revoked).length} currently valid
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-lg space-y-2">
            <div className="text-3xl font-bold text-yellow-400">{stats.completedMilestones}</div>
            <div className="text-sm text-gray-400">Completed Milestones</div>
            <div className="text-xs text-gray-500">
              Across all contracts
            </div>
          </div>
        </div>
      </div>

      
      <div className="glass-card p-6 bg-gradient-to-r from-primary-500/10 to-accent-500/10 border-primary-500/30">
        <div className="flex items-start space-x-4">
          <div className="text-3xl">💡</div>
          <div>
            <h3 className="font-bold text-lg mb-1">Platform Features</h3>
            <p className="text-sm text-gray-300">
              All your contracts and badges are stored on the Solana blockchain.
              Your credentials are verifiable, immutable, and truly yours!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};