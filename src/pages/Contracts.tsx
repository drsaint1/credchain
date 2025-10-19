import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, ComputeBudgetProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { Plus, FileText, Shield, Loader2 } from 'lucide-react';
import { BN } from '@coral-xyz/anchor';
import { usePrograms } from '../hooks/usePrograms';
import { getContractPDA } from '../utils/pdaHelpers';
import { CONTRACT_CONFIG, ContractStatus, MilestoneStatus } from '../config/programs';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { CompletionNFT } from '../components/CompletionNFT';
import { useToastContext } from '../components/Layout';

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: string;
  deadline: string;
}

interface Contract {
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
    milestones: any[];
  };
}


const DEV_MODE = true;

export const Contracts = () => {
  const { publicKey, connected } = useWallet();
  const { credchainProgram } = usePrograms();
  const navigate = useNavigate();
  const toast = useToastContext();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: '1', title: '', description: '', amount: '', deadline: '' }
  ]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    freelancerAddress: '',
    totalAmount: '',
    paymentToken: 'SOL',
  });

  
  useEffect(() => {
    if (connected && publicKey && credchainProgram) {
      fetchContracts();
    }
  }, [connected, publicKey, credchainProgram]);

  const fetchContracts = async () => {
    if (!publicKey || !credchainProgram) return;

    try {
      
      const allContractsRaw = await credchainProgram.account.contract.all();
      console.log('📦 Total contracts in program:', allContractsRaw.length);

      if (allContractsRaw.length > 0) {
        console.log('🔍 First contract sample:', {
          publicKey: allContractsRaw[0].publicKey.toBase58(),
          client: allContractsRaw[0].account.client.toBase58(),
          freelancer: allContractsRaw[0].account.freelancer.toBase58(),
          title: allContractsRaw[0].account.title,
        });
      }

      
      const userContracts = allContractsRaw.filter((contract: any) => {
        const isClient = contract.account.client.toBase58() === publicKey.toBase58();
        const isFreelancer = contract.account.freelancer.toBase58() === publicKey.toBase58();
        return isClient || isFreelancer;
      });

      console.log('✅ Fetched user contracts:', userContracts.length);
      setContracts(userContracts as any);
    } catch (error) {
      console.error('❌ Error fetching contracts:', error);
    }
  };

  
  const fillDevData = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    setFormData({
      title: 'Test Logo Design Project',
      description: 'Create a modern logo for tech startup',
      freelancerAddress: 'FXtdnHTgD2sDEih5s7WgXGrsY9MeGh484h7tzfxqXu6h', 
      totalAmount: '',
      paymentToken: 'SOL',
    });

    setMilestones([
      {
        id: '1',
        title: 'Initial Concepts',
        description: 'Create 3 initial logo concepts',
        amount: '0.5',
        deadline: tomorrowStr,
      },
      {
        id: '2',
        title: 'Final Design',
        description: 'Deliver final logo files',
        amount: '1.0',
        deadline: tomorrowStr,
      },
    ]);

    console.log('✅ Dev data filled');
  };

  const addMilestone = () => {
    if (milestones.length >= CONTRACT_CONFIG.MAX_MILESTONES) {
      toast.warning(`Maximum ${CONTRACT_CONFIG.MAX_MILESTONES} milestones allowed`);
      return;
    }
    setMilestones([
      ...milestones,
      { id: Date.now().toString(), title: '', description: '', amount: '', deadline: '' }
    ]);
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: string) => {
    setMilestones(milestones.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const removeMilestone = (id: string) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter(m => m.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!publicKey || !credchainProgram) {
      toast.warning('Please connect your wallet');
      return;
    }

    setLoading(true);

    try {
      
      const contractId = `contract-${Date.now()}`;

      
      const [contractPDA] = getContractPDA(contractId);

      
      const freelancerPubkey = new PublicKey(formData.freelancerAddress);

      
      const programMilestones = milestones.map(m => ({
        title: m.title,
        description: m.description,
        amount: new BN(parseFloat(m.amount) * LAMPORTS_PER_SOL),
        deadline: new BN(new Date(m.deadline).getTime() / 1000),
      }));

      
      const totalAmount = new BN(
        milestones.reduce((sum, m) => sum + parseFloat(m.amount || '0'), 0) * LAMPORTS_PER_SOL
      );

      
      const paymentToken = formData.paymentToken === 'SOL'
        ? SystemProgram.programId
        : new PublicKey(formData.paymentToken);

      console.log('Creating contract with:');
      console.log('- Contract ID:', contractId);
      console.log('- Title:', formData.title);
      console.log('- Milestones:', programMilestones.length);
      console.log('- Total Amount:', totalAmount.toString(), 'lamports');
      console.log('- Contract PDA:', contractPDA.toBase58());

      
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 600_000, 
      });

      const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1, 
      });

      
      const tx = await credchainProgram.methods
        .createContract(
          contractId,
          formData.title,
          formData.description,
          totalAmount,
          programMilestones,
          paymentToken
        )
        .accounts({
          contract: contractPDA,
          client: publicKey,
          freelancer: freelancerPubkey,
          systemProgram: SystemProgram.programId,
        })
        .preInstructions([modifyComputeUnits, addPriorityFee])
        .rpc();

      console.log('✅ Contract created successfully!');
      console.log('Transaction signature:', tx);
      console.log('Contract PDA:', contractPDA.toBase58());

      toast.success(`Contract created successfully! Transaction: ${tx.substring(0, 8)}...`);

      
      setFormData({
        title: '',
        description: '',
        freelancerAddress: '',
        totalAmount: '',
        paymentToken: 'SOL',
      });
      setMilestones([{ id: '1', title: '', description: '', amount: '', deadline: '' }]);
      setShowCreateForm(false);

      
      await fetchContracts();
    } catch (error: any) {
      console.error('❌ Error creating contract:');
      console.error('Error message:', error.message);
      console.error('Error details:', error);

      
      if (error.logs) {
        console.error('Transaction logs:', error.logs);
      }

      
      console.error('Full error object:', JSON.stringify(error, null, 2));

      toast.error(`Failed to create contract: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: any) => {
    const statusKey = Object.keys(status)[0];
    switch (statusKey) {
      case 'active': return 'bg-blue-500/20 text-blue-400';
      case 'funded': return 'bg-green-500/20 text-green-400';
      case 'inProgress': return 'bg-yellow-500/20 text-yellow-400';
      case 'completed': return 'bg-purple-500/20 text-purple-400';
      case 'disputed': return 'bg-red-500/20 text-red-400';
      case 'cancelled': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status: any) => {
    const statusKey = Object.keys(status)[0];
    return statusKey.charAt(0).toUpperCase() + statusKey.slice(1);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold">Escrow Contracts</h1>
          <p className="text-gray-300 mt-2">Secure milestone-based payments on Solana</p>
        </div>
        {connected && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary flex items-center space-x-2"
            disabled={loading}
          >
            <Plus className="w-5 h-5" />
            <span>New Contract</span>
          </button>
        )}
      </div>

      {!connected && (
        <div className="glass-card p-12 text-center">
          <Shield className="w-16 h-16 mx-auto text-primary-400 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Connect Your Wallet</h3>
          <p className="text-gray-300">Please connect your Solana wallet to create and manage contracts.</p>
        </div>
      )}

      {connected && showCreateForm && (
        <div className="glass-card p-8 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Create New Contract</h2>
            {DEV_MODE && (
              <button
                type="button"
                onClick={fillDevData}
                className="text-sm px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
              >
                🔧 Fill Test Data
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Contract Title <span className="text-xs text-gray-400">(max {CONTRACT_CONFIG.MAX_TITLE_LENGTH} chars)</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
                  placeholder="E.g., Logo Design for Tech Startup"
                  maxLength={CONTRACT_CONFIG.MAX_TITLE_LENGTH}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description <span className="text-xs text-gray-400">(max {CONTRACT_CONFIG.MAX_DESCRIPTION_LENGTH} chars)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 h-32"
                  placeholder="Describe the project scope, deliverables, and requirements..."
                  maxLength={CONTRACT_CONFIG.MAX_DESCRIPTION_LENGTH}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Freelancer Wallet Address</label>
                  <input
                    type="text"
                    value={formData.freelancerAddress}
                    onChange={(e) => setFormData({ ...formData, freelancerAddress: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
                    placeholder="Solana wallet address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Payment Token</label>
                  <select
                    value={formData.paymentToken}
                    onChange={(e) => setFormData({ ...formData, paymentToken: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
                  >
                    <option value="SOL">SOL</option>
                  </select>
                </div>
              </div>
            </div>

            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Milestones ({milestones.length}/{CONTRACT_CONFIG.MAX_MILESTONES})</h3>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="text-primary-400 hover:text-primary-300 flex items-center space-x-1"
                  disabled={milestones.length >= CONTRACT_CONFIG.MAX_MILESTONES}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Milestone</span>
                </button>
              </div>

              {milestones.map((milestone, index) => (
                <div key={milestone.id} className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Milestone #{index + 1}</h4>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(milestone.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2">
                        Milestone Title <span className="text-xs text-gray-400">(max {CONTRACT_CONFIG.MAX_MILESTONE_TITLE_LENGTH})</span>
                      </label>
                      <input
                        type="text"
                        value={milestone.title}
                        onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
                        placeholder="E.g., Initial concept designs"
                        maxLength={CONTRACT_CONFIG.MAX_MILESTONE_TITLE_LENGTH}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2">Amount ({formData.paymentToken})</label>
                      <input
                        type="number"
                        step="0.01"
                        value={milestone.amount}
                        onChange={(e) => updateMilestone(milestone.id, 'amount', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2">
                      Description <span className="text-xs text-gray-400">(max {CONTRACT_CONFIG.MAX_MILESTONE_DESCRIPTION_LENGTH})</span>
                    </label>
                    <textarea
                      value={milestone.description}
                      onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500 h-20"
                      placeholder="Describe what needs to be delivered for this milestone..."
                      maxLength={CONTRACT_CONFIG.MAX_MILESTONE_DESCRIPTION_LENGTH}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Deadline</label>
                    <input
                      type="date"
                      value={milestone.deadline}
                      onChange={(e) => updateMilestone(milestone.id, 'deadline', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            
            <div className="glass-card p-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Total Milestones:</span>
                <span className="font-semibold">{milestones.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Total Amount:</span>
                <span className="font-semibold text-primary-400">
                  {milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0).toFixed(2)} {formData.paymentToken}
                </span>
              </div>
            </div>

            <div className="flex space-x-4">
              <button type="submit" className="btn-primary flex-1 flex items-center justify-center space-x-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Contract</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      
      {connected && !showCreateForm && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Your Contracts</h2>
          {contracts.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">No Contracts Yet</h3>
              <p className="text-gray-400">Create your first contract to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contracts.map((contract) => {
                const completedMilestones = contract.account.milestones.filter(
                  (m: any) => Object.keys(m.status)[0] === 'completed'
                ).length;
                const isCompleted = Object.keys(contract.account.status)[0] === 'completed';
                const isClient = contract.account.client.toBase58() === publicKey?.toBase58();
                const userRole = isClient ? 'client' : 'freelancer';

                return (
                  <div key={contract.publicKey.toString()} className="space-y-4">
                    <div className="glass-card p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3">
                          <FileText className="w-8 h-8 text-primary-400 mt-1" />
                          <div>
                            <h3 className="text-xl font-bold">{contract.account.title}</h3>
                            <p className="text-gray-400 text-sm">
                              {completedMilestones} of {contract.account.milestones.length} milestones completed
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(contract.account.status)}`}>
                          {getStatusLabel(contract.account.status)}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Value:</span>
                          <span className="font-semibold">
                            {(contract.account.totalAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(2)} SOL
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Paid:</span>
                          <span className="text-primary-400">
                            {(contract.account.paidAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(2)} SOL
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Remaining:</span>
                          <span>
                            {((contract.account.totalAmount.toNumber() - contract.account.paidAmount.toNumber()) / LAMPORTS_PER_SOL).toFixed(2)} SOL
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/10">
                        <button
                          className="btn-primary w-full"
                          onClick={() => navigate(`/contracts/${contract.account.contractId}`)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>

                    
                    {isCompleted && (
                      <CompletionNFT
                        contractId={contract.account.contractId}
                        contractTitle={contract.account.title}
                        totalAmount={contract.account.totalAmount.toNumber()}
                        milestonesCompleted={completedMilestones}
                        totalMilestones={contract.account.milestones.length}
                        clientAddress={contract.account.client.toBase58()}
                        freelancerAddress={contract.account.freelancer.toBase58()}
                        completedAt={contract.account.createdAt.toNumber()}
                        userRole={userRole}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};