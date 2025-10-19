import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  FileText, Shield, CheckCircle, XCircle, Clock, DollarSign,
  Upload, AlertTriangle, ArrowLeft, Download, Loader2, Edit3, Sparkles
} from 'lucide-react';
import { BN } from '@coral-xyz/anchor';
import { usePrograms } from '../hooks/usePrograms';
import { getContractPDA } from '../utils/pdaHelpers';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { useToastContext } from '../components/Layout';

const PINATA_GATEWAY_URL = import.meta.env.VITE_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud';

interface ContractData {
  publicKey: PublicKey;
  account: {
    contractId: string;
    title: string;
    description: string;
    client: PublicKey;
    freelancer: PublicKey;
    totalAmount: BN;
    paidAmount: BN;
    paymentToken: PublicKey;
    status: any;
    createdAt: BN;
    ndaSignedClient: boolean;
    ndaSignedFreelancer: boolean;
    milestones: any[];
    bump: number;
  };
}

export const ContractDetails = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const { publicKey, connected } = useWallet();
  const { credchainProgram, connection } = usePrograms();
  const navigate = useNavigate();
  const toast = useToastContext();

  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [userRole, setUserRole] = useState<'client' | 'freelancer' | null>(null);

  
  const [showSubmitDeliverable, setShowSubmitDeliverable] = useState(false);
  const [selectedMilestoneIndex, setSelectedMilestoneIndex] = useState<number>(0);
  const [deliverableData, setDeliverableData] = useState({
    ipfsHash: '',
    fileName: '',
    description: '',
  });

  
  const [showRequestRevision, setShowRequestRevision] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');


  const [showDispute, setShowDispute] = useState(false);
  const [disputeData, setDisputeData] = useState({
    category: 'Quality',
    reason: '',
    description: '',
  });

  // AI Summary
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState(false);

  useEffect(() => {
    if (connected && publicKey && credchainProgram && contractId) {
      fetchContract();
    }
  }, [connected, publicKey, credchainProgram, contractId]);

  const fetchContract = async () => {
    if (!publicKey || !credchainProgram || !contractId) return;

    try {
      setLoading(true);
      const [contractPDA] = getContractPDA(contractId);
      const contractAccount = await credchainProgram.account.contract.fetch(contractPDA);

      const contractData: ContractData = {
        publicKey: contractPDA,
        account: contractAccount as any,
      };

      setContract(contractData);

      
      if (contractAccount.client.toBase58() === publicKey.toBase58()) {
        setUserRole('client');
      } else if (contractAccount.freelancer.toBase58() === publicKey.toBase58()) {
        setUserRole('freelancer');
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
      toast.error('Contract not found');
      navigate('/contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleDepositEscrow = async () => {
    if (!publicKey || !credchainProgram || !contract) return;

    try {
      setActionLoading(true);

      
      if (contract.account.paymentToken.toBase58() === SystemProgram.programId.toBase58()) {
        toast.info('SOL escrow deposit not yet implemented. Please use SPL tokens.');
        return;
      }

      
      const clientTokenAccount = await getAssociatedTokenAddress(
        contract.account.paymentToken,
        publicKey
      );

      const escrowTokenAccount = await getAssociatedTokenAddress(
        contract.account.paymentToken,
        contract.publicKey,
        true 
      );

      const tx = await credchainProgram.methods
        .depositEscrow(contract.account.totalAmount)
        .accounts({
          contract: contract.publicKey,
          client: publicKey,
          clientTokenAccount: clientTokenAccount,
          escrowTokenAccount: escrowTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log('✅ Escrow deposited! Transaction:', tx);
      toast.success(`Escrow deposited! Tx: ${tx.substring(0, 8)}...`);
      await fetchContract();
    } catch (error: any) {
      console.error('❌ Error depositing escrow:', error);
      toast.error(`Failed to deposit escrow: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignNDA = async () => {
    if (!publicKey || !credchainProgram || !contract) return;

    try {
      setActionLoading(true);

      const tx = await credchainProgram.methods
        .signNda()
        .accounts({
          contract: contract.publicKey,
          signer: publicKey,
        })
        .rpc();

      console.log('✅ NDA signed! Transaction:', tx);
      toast.success(`NDA signed! Tx: ${tx.substring(0, 8)}...`);
      await fetchContract();
    } catch (error: any) {
      console.error('❌ Error signing NDA:', error);
      toast.error(`Failed to sign NDA: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitDeliverable = async () => {
    if (!publicKey || !credchainProgram || !contract) return;

    if (!deliverableData.ipfsHash || !deliverableData.fileName || !deliverableData.description) {
      toast.warning('Please fill in all deliverable fields');
      return;
    }

    try {
      setActionLoading(true);

      const tx = await credchainProgram.methods
        .submitDeliverable(
          selectedMilestoneIndex,
          deliverableData.ipfsHash,
          deliverableData.fileName,
          deliverableData.description
        )
        .accounts({
          contract: contract.publicKey,
          freelancer: publicKey,
        })
        .rpc();

      console.log('✅ Deliverable submitted! Transaction:', tx);
      toast.success(`Deliverable submitted! Tx: ${tx.substring(0, 8)}...`);

      
      setDeliverableData({ ipfsHash: '', fileName: '', description: '' });
      setShowSubmitDeliverable(false);
      await fetchContract();
    } catch (error: any) {
      console.error('❌ Error submitting deliverable:', error);
      toast.error(`Failed to submit deliverable: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async (milestoneIndex: number) => {
    if (!publicKey || !credchainProgram || !contract) return;

    if (!revisionReason.trim()) {
      toast.warning('Please provide a revision reason');
      return;
    }

    try {
      setActionLoading(true);

      const tx = await credchainProgram.methods
        .requestRevision(milestoneIndex, revisionReason)
        .accounts({
          contract: contract.publicKey,
          client: publicKey,
        })
        .rpc();

      console.log('✅ Revision requested! Transaction:', tx);
      toast.success(`Revision requested! Tx: ${tx.substring(0, 8)}...`);

      setRevisionReason('');
      setShowRequestRevision(false);
      await fetchContract();
    } catch (error: any) {
      console.error('❌ Error requesting revision:', error);
      toast.error(`Failed to request revision: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveMilestone = async (milestoneIndex: number) => {
    if (!publicKey || !credchainProgram || !contract || !connection) return;

    try {
      setActionLoading(true);

      
      const escrowTokenAccount = await getAssociatedTokenAddress(
        contract.account.paymentToken,
        contract.publicKey,
        true
      );

      const freelancerTokenAccount = await getAssociatedTokenAddress(
        contract.account.paymentToken,
        contract.account.freelancer
      );

      const tx = await credchainProgram.methods
        .approveMilestone(milestoneIndex)
        .accounts({
          contract: contract.publicKey,
          client: publicKey,
          escrowTokenAccount: escrowTokenAccount,
          freelancerTokenAccount: freelancerTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log('✅ Milestone approved! Transaction:', tx);
      toast.success(`Milestone approved and payment released! Tx: ${tx.substring(0, 8)}...`);
      await fetchContract();
    } catch (error: any) {
      console.error('❌ Error approving milestone:', error);
      toast.error(`Failed to approve milestone: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDispute = async () => {
    if (!publicKey || !credchainProgram || !contract) return;

    if (!disputeData.reason.trim() || !disputeData.description.trim()) {
      toast.warning('Please fill in all dispute fields');
      return;
    }

    try {
      setActionLoading(true);

      
      const categoryEnum = { [disputeData.category.toLowerCase()]: {} };

      const [disputePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('dispute'), contract.publicKey.toBuffer()],
        credchainProgram.programId
      );

      const tx = await credchainProgram.methods
        .openDispute(categoryEnum, disputeData.reason, disputeData.description)
        .accounts({
          contract: contract.publicKey,
          dispute: disputePDA,
          initiator: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('✅ Dispute opened! Transaction:', tx);
      toast.success(`Dispute opened! Tx: ${tx.substring(0, 8)}...`);

      setDisputeData({ category: 'Quality', reason: '', description: '' });
      setShowDispute(false);
      await fetchContract();
    } catch (error: any) {
      console.error('❌ Error opening dispute:', error);
      toast.error(`Failed to open dispute: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const generateAISummary = async () => {
    if (!contract) return;

    setLoadingAiSummary(true);
    try {
      const response = await fetch('/api/summarize-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract: {
            contractId: contract.account.contractId,
            title: contract.account.title,
            description: contract.account.description,
            totalAmount: (contract.account.totalAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(2) + ' SOL',
            paidAmount: (contract.account.paidAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(2) + ' SOL',
            status: getStatusLabel(contract.account.status),
            createdAt: new Date(contract.account.createdAt.toNumber() * 1000).toLocaleDateString(),
            milestones: contract.account.milestones.map((m: any, idx: number) => ({
              index: idx + 1,
              title: m.title,
              description: m.description,
              amount: (m.amount.toNumber() / LAMPORTS_PER_SOL).toFixed(2) + ' SOL',
              deadline: new Date(m.deadline.toNumber() * 1000).toLocaleDateString(),
              status: getMilestoneStatusLabel(m.status),
              deliverableIpfsHash: m.deliverableIpfsHash || null,
              revisionCount: m.revisionCount || 0,
            })),
            client: contract.account.client.toBase58(),
            freelancer: contract.account.freelancer.toBase58(),
          }
        })
      });

      const data = await response.json();

      if (data.success && data.summary) {
        setAiSummary(data.summary);
        setShowAiSummary(true);
        toast.success('AI summary generated successfully!');
      } else {
        toast.error('Failed to generate AI summary');
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
      toast.error('AI summary service unavailable');
    } finally {
      setLoadingAiSummary(false);
    }
  };

  const getStatusColor = (status: any) => {
    const statusKey = Object.keys(status)[0];
    switch (statusKey) {
      case 'active': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'funded': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inProgress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'disputed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'cancelled': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: any) => {
    const statusKey = Object.keys(status)[0];
    return statusKey.charAt(0).toUpperCase() + statusKey.slice(1);
  };

  const getMilestoneStatusLabel = (status: any) => {
    const statusKey = Object.keys(status)[0];
    const labels: any = {
      pending: 'Pending',
      underReview: 'Under Review',
      revisionRequested: 'Revision Requested',
      completed: 'Completed',
    };
    return labels[statusKey] || statusKey;
  };

  const getMilestoneStatusColor = (status: any) => {
    const statusKey = Object.keys(status)[0];
    switch (statusKey) {
      case 'pending': return 'bg-gray-500/20 text-gray-400';
      case 'underReview': return 'bg-blue-500/20 text-blue-400';
      case 'revisionRequested': return 'bg-orange-500/20 text-orange-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="glass-card p-12 text-center">
        <AlertTriangle className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
        <h3 className="text-2xl font-bold mb-2">Contract Not Found</h3>
        <p className="text-gray-400 mb-6">The contract you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/contracts')} className="btn-primary">
          Back to Contracts
        </button>
      </div>
    );
  }

  const contractStatus = getStatusLabel(contract.account.status);
  const isFunded = Object.keys(contract.account.status)[0] !== 'active';
  const isCompleted = Object.keys(contract.account.status)[0] === 'completed';
  const isDisputed = Object.keys(contract.account.status)[0] === 'disputed';

  return (
    <div className="space-y-8">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/contracts')}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-4xl font-bold">{contract.account.title}</h1>
            <p className="text-gray-400 mt-1">Contract ID: {contract.account.contractId}</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(contract.account.status)}`}>
          {contractStatus}
        </span>
      </div>

      {/* AI Contract Summary */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-accent-400" />
            <h3 className="text-lg font-bold">AI Contract Summary</h3>
          </div>
          <button
            onClick={generateAISummary}
            disabled={loadingAiSummary}
            className="btn-primary flex items-center space-x-2"
          >
            {loadingAiSummary ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Summary</span>
              </>
            )}
          </button>
        </div>

        {showAiSummary && aiSummary && (
          <div className="space-y-4 mt-4">
            {/* Overview */}
            <div className="p-4 bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/30 rounded-lg">
              <h4 className="font-bold mb-2">Overview</h4>
              <p className="text-gray-300 text-sm">{aiSummary.overview}</p>
            </div>

            {/* Key Details */}
            {aiSummary.keyDetails && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Total Amount</p>
                  <p className="font-bold">{aiSummary.keyDetails.totalAmount}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Milestones</p>
                  <p className="font-bold">{aiSummary.keyDetails.numberOfMilestones}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <p className="font-bold">{aiSummary.keyDetails.currentStatus}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Progress</p>
                  <p className="font-bold">{aiSummary.keyDetails.completionPercentage}%</p>
                </div>
              </div>
            )}

            {/* Risk Assessment */}
            {aiSummary.riskAssessment && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <h4 className="font-bold mb-2 text-yellow-400">Risk Assessment</h4>
                <p className="text-sm text-gray-300">{aiSummary.riskAssessment}</p>
              </div>
            )}

            {/* Next Steps */}
            {aiSummary.nextSteps && aiSummary.nextSteps.length > 0 && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <h4 className="font-bold mb-2 text-green-400">Next Steps</h4>
                <ul className="list-disc list-inside space-y-1">
                  {aiSummary.nextSteps.map((step: string, idx: number) => (
                    <li key={idx} className="text-sm text-gray-300">{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-primary-400" />
            <span>Your Role</span>
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">You are the:</p>
              <p className="font-semibold text-primary-400 capitalize">{userRole}</p>
            </div>
            <div className="pt-3 border-t border-white/10">
              <p className="text-sm text-gray-400">Client:</p>
              <p className="text-xs font-mono break-all">{contract.account.client.toBase58()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Freelancer:</p>
              <p className="text-xs font-mono break-all">{contract.account.freelancer.toBase58()}</p>
            </div>
          </div>
        </div>

        
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span>Payment</span>
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Total Amount:</p>
              <p className="text-2xl font-bold text-white">
                {(contract.account.totalAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(2)} SOL
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Paid:</p>
              <p className="font-semibold text-green-400">
                {(contract.account.paidAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(2)} SOL
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Remaining:</p>
              <p className="font-semibold">
                {((contract.account.totalAmount.toNumber() - contract.account.paidAmount.toNumber()) / LAMPORTS_PER_SOL).toFixed(2)} SOL
              </p>
            </div>
          </div>
        </div>

        
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-yellow-400" />
            <span>NDA Status</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Client:</span>
              {contract.account.ndaSignedClient ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Freelancer:</span>
              {contract.account.ndaSignedFreelancer ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            {((userRole === 'client' && !contract.account.ndaSignedClient) ||
              (userRole === 'freelancer' && !contract.account.ndaSignedFreelancer)) && (
              <button
                onClick={handleSignNDA}
                disabled={actionLoading}
                className="btn-primary w-full mt-3"
              >
                {actionLoading ? 'Signing...' : 'Sign NDA'}
              </button>
            )}
          </div>
        </div>
      </div>

      
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-3">Description</h3>
        <p className="text-gray-300">{contract.account.description}</p>
      </div>

      
      {!isCompleted && !isDisputed && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userRole === 'client' && !isFunded && (
              <button
                onClick={handleDepositEscrow}
                disabled={actionLoading}
                className="btn-primary flex items-center justify-center space-x-2"
              >
                <DollarSign className="w-5 h-5" />
                <span>Deposit Escrow</span>
              </button>
            )}
            {!isDisputed && (
              <button
                onClick={() => setShowDispute(true)}
                disabled={actionLoading}
                className="btn-secondary flex items-center justify-center space-x-2"
              >
                <AlertTriangle className="w-5 h-5" />
                <span>Open Dispute</span>
              </button>
            )}
          </div>
        </div>
      )}

      
      <div className="glass-card p-6">
        <h3 className="text-2xl font-bold mb-6">Milestones</h3>
        <div className="space-y-6">
          {contract.account.milestones.map((milestone: any, index: number) => {
            const milestoneStatus = getMilestoneStatusLabel(milestone.status);
            const isPending = Object.keys(milestone.status)[0] === 'pending';
            const isUnderReview = Object.keys(milestone.status)[0] === 'underReview';
            const isRevisionRequested = Object.keys(milestone.status)[0] === 'revisionRequested';
            const isMilestoneCompleted = Object.keys(milestone.status)[0] === 'completed';

            return (
              <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-semibold">
                      Milestone #{index + 1}: {milestone.title}
                    </h4>
                    <p className="text-gray-400 text-sm mt-1">{milestone.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getMilestoneStatusColor(milestone.status)}`}>
                    {milestoneStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Amount:</p>
                    <p className="font-semibold">
                      {(milestone.amount.toNumber() / LAMPORTS_PER_SOL).toFixed(2)} SOL
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Deadline:</p>
                    <p className="font-semibold">
                      {new Date(milestone.deadline.toNumber() * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Revisions:</p>
                    <p className="font-semibold">{milestone.revisionCount}/3</p>
                  </div>
                  {isMilestoneCompleted && (
                    <div>
                      <p className="text-sm text-gray-400">Completed:</p>
                      <p className="font-semibold text-green-400">
                        {new Date(milestone.completedAt.toNumber() * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                
                {milestone.deliverables && milestone.deliverables.length > 0 && (
                  <div className="mb-4 p-4 bg-white/5 rounded-lg">
                    <h5 className="font-semibold mb-3 flex items-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Deliverables</span>
                    </h5>
                    <div className="space-y-2">
                      {milestone.deliverables.map((deliverable: any, dIndex: number) => (
                        <div key={dIndex} className="flex items-center justify-between p-3 bg-white/5 rounded">
                          <div>
                            <p className="font-medium">{deliverable.fileName}</p>
                            <p className="text-sm text-gray-400">{deliverable.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Uploaded: {new Date(deliverable.uploadedAt.toNumber() * 1000).toLocaleString()}
                            </p>
                          </div>
                          <a
                            href={`${PINATA_GATEWAY_URL}/ipfs/${deliverable.ipfsHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-sm"
                          >
                            View File
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                
                <div className="flex flex-wrap gap-3">
                  
                  {userRole === 'freelancer' && (isPending || isRevisionRequested) && isFunded && (
                    <button
                      onClick={() => {
                        setSelectedMilestoneIndex(index);
                        setShowSubmitDeliverable(true);
                      }}
                      disabled={actionLoading}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Submit Deliverable</span>
                    </button>
                  )}

                  
                  {userRole === 'client' && isUnderReview && milestone.revisionCount < 3 && (
                    <button
                      onClick={() => {
                        setSelectedMilestoneIndex(index);
                        setShowRequestRevision(true);
                      }}
                      disabled={actionLoading}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Request Revision</span>
                    </button>
                  )}

                  
                  {userRole === 'client' && isUnderReview && (
                    <button
                      onClick={() => handleApproveMilestone(index)}
                      disabled={actionLoading}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve & Release Payment</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      
      {showSubmitDeliverable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">Submit Deliverable</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">IPFS Hash</label>
                <input
                  type="text"
                  value={deliverableData.ipfsHash}
                  onChange={(e) => setDeliverableData({ ...deliverableData, ipfsHash: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
                  placeholder="QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  maxLength={64}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">File Name</label>
                <input
                  type="text"
                  value={deliverableData.fileName}
                  onChange={(e) => setDeliverableData({ ...deliverableData, fileName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
                  placeholder="design-final.zip"
                  maxLength={64}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={deliverableData.description}
                  onChange={(e) => setDeliverableData({ ...deliverableData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 h-24"
                  placeholder="Brief description of the deliverable..."
                  maxLength={100}
                />
              </div>
              <div className="flex space-x-4 mt-6">
                <button
                  onClick={handleSubmitDeliverable}
                  disabled={actionLoading}
                  className="btn-primary flex-1"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Deliverable'}
                </button>
                <button
                  onClick={() => setShowSubmitDeliverable(false)}
                  disabled={actionLoading}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {showRequestRevision && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-8 max-w-2xl w-full">
            <h3 className="text-2xl font-bold mb-6">Request Revision</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Revision Reason</label>
                <textarea
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 h-32"
                  placeholder="Explain what needs to be changed..."
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleRequestRevision(selectedMilestoneIndex)}
                  disabled={actionLoading}
                  className="btn-primary flex-1"
                >
                  {actionLoading ? 'Requesting...' : 'Request Revision'}
                </button>
                <button
                  onClick={() => setShowRequestRevision(false)}
                  disabled={actionLoading}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {showDispute && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-8 max-w-2xl w-full">
            <h3 className="text-2xl font-bold mb-6 flex items-center space-x-2">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <span>Open Dispute</span>
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={disputeData.category}
                  onChange={(e) => setDisputeData({ ...disputeData, category: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
                >
                  <option value="Quality">Quality</option>
                  <option value="Deadline">Deadline</option>
                  <option value="Scope">Scope</option>
                  <option value="Payment">Payment</option>
                  <option value="Communication">Communication</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reason (Summary)</label>
                <input
                  type="text"
                  value={disputeData.reason}
                  onChange={(e) => setDisputeData({ ...disputeData, reason: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
                  placeholder="Brief summary of the issue"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description (Detailed)</label>
                <textarea
                  value={disputeData.description}
                  onChange={(e) => setDisputeData({ ...disputeData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 h-32"
                  placeholder="Provide detailed information about the dispute..."
                  maxLength={1000}
                />
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-sm text-yellow-400">
                  ⚠️ Opening a dispute will pause the contract and involve arbitrators. Only proceed if you cannot resolve the issue directly.
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleOpenDispute}
                  disabled={actionLoading}
                  className="btn-primary flex-1 bg-red-500 hover:bg-red-600"
                >
                  {actionLoading ? 'Opening...' : 'Open Dispute'}
                </button>
                <button
                  onClick={() => setShowDispute(false)}
                  disabled={actionLoading}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};