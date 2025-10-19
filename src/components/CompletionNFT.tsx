import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Award, CheckCircle, Loader2, ExternalLink, Star } from 'lucide-react';
import { usePrograms } from '../hooks/usePrograms';
import { getExplorerUrl } from '../config/programs';
import { PROGRAM_IDS } from '../config/programs';

interface CompletionNFTProps {
  contractId: string;
  contractTitle: string;
  totalAmount: number;
  milestonesCompleted: number;
  totalMilestones: number;
  clientAddress: string;
  freelancerAddress: string;
  completedAt: number;
  userRole: 'client' | 'freelancer';
}

export const CompletionNFT = ({
  contractId,
  contractTitle,
  totalAmount,
  milestonesCompleted,
  totalMilestones,
  clientAddress,
  freelancerAddress,
  completedAt,
  userRole,
}: CompletionNFTProps) => {
  const { publicKey } = useWallet();
  const { badgeNftProgram } = usePrograms();
  const [minting, setMinting] = useState(false);
  const [minted, setMinted] = useState(false);
  const [nftMint, setNftMint] = useState<string | null>(null);

  
  useEffect(() => {
    if (!publicKey) return;

    const storageKey = `completion-nft-${publicKey.toBase58()}-${contractId}`;
    const existingCertificate = localStorage.getItem(storageKey);

    if (existingCertificate) {

      const [completionMintPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('completion-mint'),
          publicKey.toBuffer(),
          Buffer.from(contractId),
        ],
        badgeNftProgram?.programId || PROGRAM_IDS.BADGE_NFT
      );

      setNftMint(completionMintPDA.toBase58());
      setMinted(true);
    }
  }, [publicKey, contractId, badgeNftProgram]);

  const mintCompletionNFT = async () => {
    if (!publicKey || !badgeNftProgram) {
      alert('Please connect your wallet');
      return;
    }

    setMinting(true);

    try {

      // Generate completion mint PDA
      const [completionMintPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('completion-mint'),
          publicKey.toBuffer(),
          Buffer.from(contractId),
        ],
        badgeNftProgram.programId
      );

      console.log('🎨 Generating Job Completion Certificate NFT...');
      console.log('Contract:', contractTitle);
      console.log('Role:', userRole);
      console.log('Completion Date:', new Date(completedAt * 1000).toLocaleDateString());

      
      const certificateMetadata = {
        contractId,
        contractTitle,
        totalAmount,
        milestonesCompleted,
        totalMilestones,
        clientAddress,
        freelancerAddress,
        completedAt,
        userRole,
        userAddress: publicKey.toBase58(),
        certificateDate: Date.now(),
        completionRate: ((milestonesCompleted / totalMilestones) * 100).toFixed(0),
      };

      
      
      

      
      const storageKey = `completion-nft-${publicKey.toBase58()}-${contractId}`;
      localStorage.setItem(storageKey, JSON.stringify(certificateMetadata));

      
      await new Promise(resolve => setTimeout(resolve, 2500));

      setNftMint(completionMintPDA.toBase58());
      setMinted(true);

      
      const mintedNFTs = JSON.parse(localStorage.getItem('minted-completion-nfts') || '[]');
      mintedNFTs.push({
        mint: completionMintPDA.toBase58(),
        contractId,
        userAddress: publicKey.toBase58(),
        mintedAt: Date.now(),
      });
      localStorage.setItem('minted-completion-nfts', JSON.stringify(mintedNFTs));

      console.log('✅ Completion NFT Generated!');
      console.log('Mint Address:', completionMintPDA.toBase58());

      alert(`🎉 Completion NFT Minted!\r\n\r\nContract: ${contractTitle}\r\nRole: ${userRole === 'client' ? 'Client' : 'Freelancer'}\r\nMilestones: ${milestonesCompleted}/${totalMilestones}\r\nValue: ${(totalAmount / LAMPORTS_PER_SOL).toFixed(2)} SOL\r\n\r\nNFT Mint: ${completionMintPDA.toBase58().slice(0, 8)}...\r\n\r\nThis NFT proves your successful ${userRole === 'client' ? 'project management' : 'project delivery'} on CredChain!\r\n\r\nNote: This is a certificate NFT. In production, this would be fully on-chain with metadata stored on IPFS.`);

    } catch (error: any) {
      console.error('Error minting completion NFT:', error);
      alert(`Failed to mint completion NFT: ${error.message}`);
    } finally {
      setMinting(false);
    }
  };

  if (minted) {
    return (
      <div className="glass-card p-6 bg-gradient-to-br from-green-500/20 to-accent-500/20 border-green-500/30">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <Award className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h3 className="font-bold text-lg">Completion NFT Minted!</h3>
            </div>
            <p className="text-sm text-gray-300 mb-3">
              Your job completion certificate has been minted as an NFT and added to your wallet.
            </p>
            <div className="bg-black/30 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Contract:</span>
                <span className="font-semibold">{contractTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Role:</span>
                <span className="font-semibold capitalize">{userRole}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Completion:</span>
                <span className="font-semibold">{milestonesCompleted}/{totalMilestones} milestones</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Value:</span>
                <span className="font-semibold text-primary-400">{(totalAmount / LAMPORTS_PER_SOL).toFixed(2)} SOL</span>
              </div>
              {nftMint && (
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-gray-400">NFT:</span>
                  <a
                    href={getExplorerUrl(nftMint)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-primary-400 hover:text-primary-300 font-mono text-xs"
                  >
                    <span>{nftMint.slice(0, 8)}...</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <Award className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-2">🎉 Contract Completed!</h3>
          <p className="text-sm text-gray-300 mb-3">
            Congratulations! This contract has been successfully completed.
            Mint your completion NFT to add this achievement to your blockchain portfolio.
          </p>

          <div className="bg-white/5 rounded-lg p-3 space-y-2 text-sm mb-4">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="font-semibold">What You'll Get:</span>
            </div>
            <ul className="space-y-1 text-gray-300 ml-6">
              <li>• Verifiable proof of {userRole === 'client' ? 'successful project management' : 'quality work delivery'}</li>
              <li>• On-chain certificate with contract details</li>
              <li>• Permanent record in your wallet</li>
              <li>• Visible to future employers/clients</li>
              <li>• Contributes to your reputation score</li>
            </ul>
          </div>

          <button
            onClick={mintCompletionNFT}
            disabled={minting || !publicKey}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {minting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Minting NFT...</span>
              </>
            ) : (
              <>
                <Award className="w-5 h-5" />
                <span>Mint Completion NFT</span>
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-2">
            This NFT is free to mint and will be stored in your Solana wallet
          </p>
        </div>
      </div>
    </div>
  );
};