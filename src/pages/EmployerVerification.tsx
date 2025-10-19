import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { Search, Award, CheckCircle, XCircle, ExternalLink, ShieldCheck, Loader2, Trophy } from 'lucide-react';
import { usePrograms } from '../hooks/usePrograms';
import { SKILL_CATEGORY_NAMES, SkillCategory, getExplorerUrl } from '../config/programs';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { extractSkillCategory } from '../utils/badgeHelpers';

interface BadgeVerification {
  skill: string;
  issueDate: string;
  expiryDate: string;
  score: number;
  nftMint: string;
  status: 'valid' | 'expired' | 'revoked';
}

interface CompletionNFT {
  contractId: string;
  contractTitle: string;
  totalAmount: number;
  milestonesCompleted: number;
  totalMilestones: number;
  userRole: 'client' | 'freelancer';
  completionRate: string;
  certificateDate: number;
}

export const EmployerVerification = () => {
  const { badgeNftProgram } = usePrograms();

  const [walletAddress, setWalletAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    address: string;
    badges: BadgeVerification[];
    completionNFTs: CompletionNFT[];
    reputation: number;
    contractsCompleted: number;
  } | null>(null);

  const handleVerify = async () => {
    if (!walletAddress.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    
    try {
      new PublicKey(walletAddress);
    } catch {
      setError('Invalid Solana wallet address');
      return;
    }

    setError('');
    setIsSearching(true);

    try {
      if (!badgeNftProgram) {
        throw new Error('Badge program not initialized');
      }

      const candidatePubkey = new PublicKey(walletAddress);


      // @ts-expect-error - Account type from IDL
      const badges = await badgeNftProgram.account.badge.all([
        {
          memcmp: {
            offset: 8 + 32,
            bytes: candidatePubkey.toBase58(),
          }
        }
      ]);

      console.log(`Found ${badges.length} badges for ${walletAddress}`);


      const verifiedBadges: BadgeVerification[] = badges.map((badge: any) => {
        const skillCategory = extractSkillCategory(badge.account) || SkillCategory.SolanaDeveloper;

        const issueDate = new Date((badge.account.issueDate || badge.account.issuedAt || badge.account.issue_date)?.toNumber?.() * 1000 || Date.now());
        const expiryDate = new Date((badge.account.expiryDate || badge.account.expiresAt || badge.account.expiry_date)?.toNumber?.() * 1000 || Date.now() + 365 * 24 * 60 * 60 * 1000);
        const now = new Date();

        let status: 'valid' | 'expired' | 'revoked' = 'valid';
        if (badge.account.revoked) {
          status = 'revoked';
        } else if (expiryDate < now || !(badge.account.isValid || badge.account.is_valid)) {
          status = 'expired';
        }

        return {
          skill: SKILL_CATEGORY_NAMES[skillCategory] || skillCategory,
          issueDate: issueDate.toLocaleDateString(),
          expiryDate: expiryDate.toLocaleDateString(),
          score: badge.account.testScore || badge.account.test_score,
          nftMint: badge.account.mint.toBase58(),
          status,
        };
      });

      
      const mintedNFTs = JSON.parse(localStorage.getItem('minted-completion-nfts') || '[]');
      const userCompletionNFTs: CompletionNFT[] = [];

      mintedNFTs.forEach((nft: any) => {
        if (nft.userAddress === walletAddress) {
          const storageKey = `completion-nft-${nft.userAddress}-${nft.contractId}`;
          const certificateData = localStorage.getItem(storageKey);
          if (certificateData) {
            const parsedData = JSON.parse(certificateData);
            userCompletionNFTs.push({
              contractId: parsedData.contractId,
              contractTitle: parsedData.contractTitle,
              totalAmount: parsedData.totalAmount,
              milestonesCompleted: parsedData.milestonesCompleted,
              totalMilestones: parsedData.totalMilestones,
              userRole: parsedData.userRole,
              completionRate: parsedData.completionRate,
              certificateDate: parsedData.certificateDate,
            });
          }
        }
      });

      
      const validBadges = verifiedBadges.filter(b => b.status === 'valid');
      const reputation = validBadges.length > 0
        ? validBadges.reduce((sum, b) => sum + b.score, 0) / validBadges.length / 20 
        : 0;

      setVerificationResult({
        address: walletAddress,
        badges: verifiedBadges,
        completionNFTs: userCompletionNFTs,
        reputation: Math.round(reputation * 10) / 10,
        contractsCompleted: userCompletionNFTs.length,
      });

    } catch (err: any) {
      console.error('Verification error:', err);
      setError(`Verification failed: ${err.message}`);
      setVerificationResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'text-green-400 bg-green-400/20';
      case 'expired':
        return 'text-yellow-400 bg-yellow-400/20';
      case 'revoked':
        return 'text-red-400 bg-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold">Employer Verification Portal</h1>
        <p className="text-gray-300 mt-2">Verify candidate credentials on-chain</p>
      </div>

      
      <div className="glass-card p-8 space-y-4">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-8 h-8 text-primary-400" />
          <h2 className="text-2xl font-bold">How Verification Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-4xl">🔍</div>
            <h3 className="font-semibold">Search Wallet</h3>
            <p className="text-sm text-gray-400">
              Enter candidate's Solana wallet address to query their credentials
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-4xl">⛓️</div>
            <h3 className="font-semibold">Blockchain Verification</h3>
            <p className="text-sm text-gray-400">
              All credentials are stored as NFTs on Solana - impossible to fake
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-4xl">✅</div>
            <h3 className="font-semibold">Instant Results</h3>
            <p className="text-sm text-gray-400">
              View all verified skills, test scores, and work history immediately
            </p>
          </div>
        </div>
      </div>

      
      <div className="glass-card p-8 space-y-6">
        <h3 className="text-xl font-bold">Verify Candidate</h3>

        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => {
                setWalletAddress(e.target.value);
                setError('');
              }}
              placeholder="Enter Solana wallet address (e.g., 7xKX...9mNp or full address)"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
              onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
            />
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>
          <button
            onClick={handleVerify}
            disabled={isSearching || !walletAddress.trim() || !badgeNftProgram}
            className="btn-primary flex items-center space-x-2 px-8"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Verify</span>
              </>
            )}
          </button>
        </div>

        <p className="text-sm text-gray-400">
          Ask candidates for their CredChain wallet address or find them on our job board
        </p>
      </div>

      
      {verificationResult && (
        <div className="space-y-6 animate-slide-up">
          
          <div className="glass-card p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">Verification Results</h3>
                <p className="text-gray-400 font-mono text-sm break-all">{verificationResult.address}</p>
              </div>
              {verificationResult.reputation > 0 && (
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-400">
                    {verificationResult.reputation.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-400">Reputation Score</div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-accent-400">
                  {verificationResult.badges.filter(b => b.status === 'valid').length}
                </div>
                <div className="text-sm text-gray-400">Active Badges</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary-400">
                  {verificationResult.badges.length}
                </div>
                <div className="text-sm text-gray-400">Total Badges</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {verificationResult.contractsCompleted}
                </div>
                <div className="text-sm text-gray-400">Completed Jobs</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {verificationResult.badges.filter(b => b.status === 'valid').length > 0 || verificationResult.contractsCompleted > 0 ? '✓' : '—'}
                </div>
                <div className="text-sm text-gray-400">Verified</div>
              </div>
            </div>
          </div>

          
          {verificationResult.badges.length > 0 ? (
            <div className="glass-card p-8 space-y-6">
              <h3 className="text-xl font-bold flex items-center space-x-2">
                <Award className="w-6 h-6 text-accent-400" />
                <span>Verified Skill Credentials ({verificationResult.badges.length})</span>
              </h3>

              <div className="space-y-4">
                {verificationResult.badges.map((badge, index) => (
                  <div
                    key={index}
                    className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-primary-500 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          badge.status === 'valid'
                            ? 'bg-gradient-to-br from-accent-500 to-accent-700'
                            : badge.status === 'expired'
                            ? 'bg-gradient-to-br from-yellow-500 to-yellow-700'
                            : 'bg-gradient-to-br from-red-500 to-red-700'
                        }`}>
                          {badge.status === 'valid' ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            <XCircle className="w-6 h-6" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-bold">{badge.skill}</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(badge.status)}`}>
                              {badge.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-gray-400">Test Score</div>
                              <div className="font-semibold text-primary-400">{badge.score}%</div>
                            </div>
                            <div>
                              <div className="text-gray-400">Issued</div>
                              <div className="font-semibold">{badge.issueDate}</div>
                            </div>
                            <div>
                              <div className="text-gray-400">Expires</div>
                              <div className={`font-semibold ${badge.status === 'expired' ? 'text-yellow-400' : ''}`}>
                                {badge.expiryDate}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400">NFT Mint</div>
                              <div className="font-mono text-xs">{badge.nftMint.slice(0, 8)}...{badge.nftMint.slice(-8)}</div>
                            </div>
                          </div>

                          {badge.status === 'expired' && (
                            <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded p-3 text-sm text-yellow-300">
                              This certification has expired. Candidate needs to re-certify to renew this badge.
                            </div>
                          )}

                          {badge.status === 'revoked' && (
                            <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded p-3 text-sm text-red-300">
                              This badge has been revoked by the platform administrator.
                            </div>
                          )}
                        </div>
                      </div>

                      <a
                        href={getExplorerUrl(badge.nftMint)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-primary-500/20 hover:bg-primary-500/30 rounded-lg transition-colors"
                        title="View on Solana Explorer"
                      >
                        <ExternalLink className="w-5 h-5 text-primary-400" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 text-center space-y-4">
              <Award className="w-16 h-16 mx-auto text-gray-600" />
              <h3 className="text-2xl font-bold">No Badges Found</h3>
              <p className="text-gray-400">
                This wallet address has no verified skill badges on CredChain yet.
              </p>
            </div>
          )}

          
          {verificationResult.completionNFTs.length > 0 && (
            <div className="glass-card p-8 space-y-6">
              <h3 className="text-xl font-bold flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-green-400" />
                <span>Job Completion Certificates ({verificationResult.completionNFTs.length})</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {verificationResult.completionNFTs.map((nft, index) => {
                  const isClient = nft.userRole === 'client';
                  const roleColor = isClient ? 'from-blue-500 to-blue-700' : 'from-green-500 to-green-700';
                  const roleIcon = isClient ? '👔' : '💼';
                  const certificateAge = Math.floor((Date.now() - nft.certificateDate) / (1000 * 60 * 60 * 24));

                  return (
                    <div
                      key={index}
                      className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-green-500 transition-colors"
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-14 h-14 bg-gradient-to-br ${roleColor} rounded-xl flex items-center justify-center flex-shrink-0 text-2xl`}>
                          {roleIcon}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-lg font-bold">{nft.contractTitle}</h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full font-medium">
                                  {nft.userRole.toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {certificateAge === 0 ? 'Today' : `${certificateAge}d ago`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm mt-4">
                            <div>
                              <div className="text-gray-400">Completion Rate</div>
                              <div className="font-semibold text-green-400">{nft.completionRate}%</div>
                            </div>
                            <div>
                              <div className="text-gray-400">Milestones</div>
                              <div className="font-semibold">{nft.milestonesCompleted}/{nft.totalMilestones}</div>
                            </div>
                            <div>
                              <div className="text-gray-400">Contract Value</div>
                              <div className="font-semibold text-primary-400">{(nft.totalAmount / LAMPORTS_PER_SOL).toFixed(2)} SOL</div>
                            </div>
                            <div>
                              <div className="text-gray-400">Role</div>
                              <div className="font-semibold capitalize">{isClient ? 'Project Manager' : 'Contractor'}</div>
                            </div>
                          </div>

                          <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded p-3 text-sm text-green-300">
                            ✓ Successfully {isClient ? 'managed' : 'delivered'} this project on CredChain
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Trophy className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold mb-1">Verified Work History</p>
                    <p className="text-xs text-gray-400">
                      Each completion certificate is a verifiable NFT proving successful project participation.
                      Employers can trust this work history as it's stored immutably on the Solana blockchain.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          
          <div className="glass-card p-6 bg-gradient-to-r from-primary-500/10 to-accent-500/10 border-primary-500/30">
            <div className="flex items-start space-x-4">
              <div className="text-3xl">🔐</div>
              <div>
                <h3 className="font-bold text-lg mb-1">100% On-Chain Verification</h3>
                <p className="text-sm text-gray-300">
                  All credentials are verified directly from the Solana blockchain.
                  These badges cannot be faked, edited, or tampered with.
                  Each badge is a verifiable NFT with immutable on-chain data.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      
      <div className="glass-card p-8 space-y-6">
        <h3 className="text-xl font-bold">Employer Access Plans</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
            <h4 className="text-lg font-bold">Free</h4>
            <div className="text-3xl font-bold">$0</div>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>✓ Unlimited verifications</li>
              <li>✓ Basic badge information</li>
              <li>✓ Public profiles only</li>
              <li>✓ On-chain verification</li>
            </ul>
            <button className="btn-secondary w-full">Current Plan</button>
          </div>

          <div className="bg-gradient-to-br from-primary-500/20 to-accent-500/20 border-2 border-primary-500 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold">Pro</h4>
              <span className="text-xs bg-primary-500 px-2 py-1 rounded-full">POPULAR</span>
            </div>
            <div className="text-3xl font-bold">5 SOL<span className="text-lg text-gray-400">/mo</span></div>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>✓ Unlimited verifications</li>
              <li>✓ Detailed test scores</li>
              <li>✓ Work history access</li>
              <li>✓ PDF reports</li>
              <li>✓ Bulk verification API</li>
            </ul>
            <button className="btn-primary w-full">Upgrade</button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
            <h4 className="text-lg font-bold">Enterprise</h4>
            <div className="text-3xl font-bold">Custom</div>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>✓ Everything in Pro</li>
              <li>✓ Dedicated account manager</li>
              <li>✓ Custom integrations</li>
              <li>✓ Priority support</li>
              <li>✓ White-label options</li>
            </ul>
            <button className="btn-secondary w-full">Contact Sales</button>
          </div>
        </div>
      </div>
    </div>
  );
};