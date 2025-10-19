import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { SystemProgram } from '@solana/web3.js';
import { AlertTriangle, Scale, Users, FileText, Send, Check, Loader2 } from 'lucide-react';
import { usePrograms } from '../hooks/usePrograms';
import { getContractPDA, getDisputePDA } from '../utils/pdaHelpers';

interface DisputeResolutionProps {
  contractId: string;
  contractTitle: string;
  onDisputeOpened?: () => void;
}

export const DisputeResolution = ({ contractId, contractTitle, onDisputeOpened }: DisputeResolutionProps) => {
  const { publicKey } = useWallet();
  const { credchainProgram } = usePrograms();

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<'reason' | 'evidence' | 'confirm'>('reason');
  const [loading, setLoading] = useState(false);
  const [disputeData, setDisputeData] = useState({
    reason: '',
    category: 'quality',
    description: '',
    evidence: [] as File[],
    evidenceIpfsHashes: [] as string[],
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setDisputeData({ ...disputeData, evidence: [...disputeData.evidence, ...files] });
    }
  };

  
  const uploadEvidenceToIPFS = async (files: File[]): Promise<string[]> => {
    
    
    console.log('Uploading evidence to IPFS:', files);
    return files.map((f, i) => `QmEvidence${Date.now()}${i}-${f.name}`);
  };

  const handleSubmitDispute = async () => {
    if (!publicKey || !credchainProgram) {
      alert('Please connect your wallet');
      return;
    }

    setLoading(true);

    try {
      
      let evidenceHashes: string[] = [];
      if (disputeData.evidence.length > 0) {
        console.log('Uploading evidence files to IPFS...');
        evidenceHashes = await uploadEvidenceToIPFS(disputeData.evidence);
        console.log('Evidence uploaded:', evidenceHashes);
      }

      
      const [contractPDA] = getContractPDA(contractId);
      const [disputePDA] = getDisputePDA(contractPDA);

      
      const fullDescription = `${disputeData.reason}\n\n${disputeData.description}\n\nEvidence: ${evidenceHashes.join(', ')}`.slice(0, 500);

      console.log('Opening dispute on blockchain...');
      const tx = await credchainProgram.methods
        .openDispute(contractId, fullDescription)
        .accounts({
          dispute: disputePDA,
          contract: contractPDA,
          initiator: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Dispute opened!', tx);
      alert(`✅ Dispute Submitted Successfully!\n\nTransaction: ${tx}\n\nArbitrators will be assigned within 24 hours.\nYou will be notified when they begin reviewing your case.`);

      
      setShowModal(false);
      setStep('reason');
      setDisputeData({ reason: '', category: 'quality', description: '', evidence: [], evidenceIpfsHashes: [] });

      if (onDisputeOpened) {
        onDisputeOpened();
      }
    } catch (error: any) {
      console.error('Error opening dispute:', error);
      alert(`Failed to open dispute: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2"
        disabled={!publicKey}
      >
        <AlertTriangle className="w-5 h-5" />
        <span>{publicKey ? 'Open Dispute' : 'Connect Wallet'}</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-6 animate-slide-up">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold flex items-center space-x-2">
                  <Scale className="w-7 h-7 text-red-400" />
                  <span>Dispute Resolution</span>
                </h3>
                <p className="text-gray-400 mt-1">Contract: {contractTitle}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
                disabled={loading}
              >
                ✕
              </button>
            </div>

            
            <div className="flex items-center justify-between">
              <div className={`flex items-center space-x-2 ${step === 'reason' ? 'text-primary-400' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ 
                  step === 'reason' ? 'bg-primary-500' : 'bg-gray-700'
                }`}>
                  1
                </div>
                <span className="text-sm font-medium">Reason</span>
              </div>
              <div className="flex-1 h-px bg-gray-700 mx-4"></div>
              <div className={`flex items-center space-x-2 ${step === 'evidence' ? 'text-primary-400' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ 
                  step === 'evidence' ? 'bg-primary-500' : 'bg-gray-700'
                }`}>
                  2
                </div>
                <span className="text-sm font-medium">Evidence</span>
              </div>
              <div className="flex-1 h-px bg-gray-700 mx-4"></div>
              <div className={`flex items-center space-x-2 ${step === 'confirm' ? 'text-primary-400' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ 
                  step === 'confirm' ? 'bg-primary-500' : 'bg-gray-700'
                }`}>
                  3
                </div>
                <span className="text-sm font-medium">Confirm</span>
              </div>
            </div>

            
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-200">
                <p className="font-semibold mb-2">Important: Dispute Resolution Policy</p>
                <ul className="space-y-1 text-red-300">
                  <li>• Frivolous disputes may result in reputation penalties</li>
                  <li>• Both parties will be required to stake tokens during arbitration</li>
                  <li>• Arbitrators decision is final and binding</li>
                  <li>• Resolution typically takes 2-7 days</li>
                </ul>
              </div>
            </div>

            
            {step === 'reason' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Dispute Category</label>
                  <select
                    value={disputeData.category}
                    onChange={(e) => setDisputeData({ ...disputeData, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
                  >
                    <option value="quality">Work Quality Issues</option>
                    <option value="deadline">Missed Deadline</option>
                    <option value="scope">Scope Disagreement</option>
                    <option value="payment">Payment Dispute</option>
                    <option value="communication">Communication Issues</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Brief Summary (What went wrong?)
                  </label>
                  <input
                    type="text"
                    value={disputeData.reason}
                    onChange={(e) => setDisputeData({ ...disputeData, reason: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
                    placeholder="E.g., Deliverables do not meet agreed specifications"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Detailed Description
                  </label>
                  <textarea
                    value={disputeData.description}
                    onChange={(e) => setDisputeData({ ...disputeData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 h-40"
                    placeholder="Provide a detailed explanation of the dispute, including timeline, expectations vs. reality, and any relevant context..."
                    required
                  />
                </div>

                <button
                  onClick={() => setStep('evidence')}
                  disabled={!disputeData.reason || !disputeData.description}
                  className="btn-primary w-full"
                >
                  Continue to Evidence
                </button>
              </div>
            )}

            
            {step === 'evidence' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Upload Supporting Evidence (Optional)</h4>
                  <p className="text-sm text-gray-400 mb-4">
                    Screenshots, messages, documents, or any other proof that supports your case
                  </p>

                  <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="mb-4">Drag and drop files or click to upload</p>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="evidence-upload"
                    />
                    <label htmlFor="evidence-upload" className="btn-secondary inline-block cursor-pointer">
                      Select Files
                    </label>
                  </div>

                  {disputeData.evidence.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">Uploaded Files ({disputeData.evidence.length}):</p>
                      {disputeData.evidence.map((file, index) => (
                        <div key={index} className="bg-white/5 p-3 rounded-lg flex items-center justify-between">
                          <span className="text-sm">{file.name}</span>
                          <button
                            onClick={() => {
                              const newEvidence = disputeData.evidence.filter((_, i) => i !== index);
                              setDisputeData({ ...disputeData, evidence: newEvidence });
                            }}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep('reason')}
                    className="btn-secondary flex-1"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('confirm')}
                    className="btn-primary flex-1"
                  >
                    Continue to Review
                  </button>
                </div>
              </div>
            )}

            
            {step === 'confirm' && (
              <div className="space-y-6">
                <div className="glass-card p-6 space-y-4">
                  <h4 className="font-bold text-lg">Review Your Dispute</h4>

                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400 text-sm">Category:</span>
                      <p className="font-medium capitalize">{disputeData.category}</p>
                    </div>

                    <div>
                      <span className="text-gray-400 text-sm">Summary:</span>
                      <p className="font-medium">{disputeData.reason}</p>
                    </div>

                    <div>
                      <span className="text-gray-400 text-sm">Description:</span>
                      <p className="text-sm">{disputeData.description}</p>
                    </div>

                    <div>
                      <span className="text-gray-400 text-sm">Evidence Files:</span>
                      <p className="font-medium">{disputeData.evidence.length} file(s) attached</p>
                    </div>
                  </div>
                </div>

                
                <div className="glass-card p-6 space-y-4">
                  <h4 className="font-bold flex items-center space-x-2">
                    <Users className="w-5 h-5 text-accent-400" />
                    <span>What Happens Next?</span>
                  </h4>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium">1. Stake Requirement</p>
                        <p className="text-gray-400">Both parties must stake 5% of contract value to proceed</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium">2. Arbitrator Assignment</p>
                        <p className="text-gray-400">3 random verified arbitrators will be assigned</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium">3. Review Period</p>
                        <p className="text-gray-400">Arbitrators review evidence and arguments (2-7 days)</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium">4. Voting & Decision</p>
                        <p className="text-gray-400">Majority vote determines outcome (2 of 3)</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium">5. Resolution</p>
                        <p className="text-gray-400">Funds distributed based on decision, losing party loses stake</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep('evidence')}
                    className="btn-secondary flex-1"
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmitDispute}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex-1 flex items-center justify-center space-x-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Submit Dispute</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};