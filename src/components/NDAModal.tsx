import { useState } from 'react';
import { Shield, FileText, Check } from 'lucide-react';

interface NDAModalProps {
  isOpen: boolean;
  contractTitle: string;
  onSign: () => void;
  onCancel: () => void;
}

export const NDAModal = ({ isOpen, contractTitle, onSign, onCancel }: NDAModalProps) => {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  const handleSign = () => {
    if (agreed) {
      onSign();
      setAgreed(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-6 animate-slide-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Non-Disclosure Agreement</h3>
              <p className="text-gray-400 text-sm">For: {contractTitle}</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4 max-h-96 overflow-y-auto">
          <h4 className="font-bold text-lg">Confidentiality Agreement</h4>

          <div className="space-y-3 text-sm text-gray-300">
            <p>
              This Non-Disclosure Agreement ("Agreement") is entered into by and between the parties
              engaging in this contract through the CredChain platform ("Parties").
            </p>

            <div>
              <h5 className="font-semibold text-white mb-2">1. Confidential Information</h5>
              <p>
                "Confidential Information" means any information disclosed by one party to the other
                party, either directly or indirectly, in writing, orally, or by inspection of tangible
                objects, including without limitation documents, business plans, source code, software,
                documentation, financial information, and any other materials related to this contract.
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-white mb-2">2. Obligations</h5>
              <p>
                The receiving party agrees to:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Keep all Confidential Information strictly confidential</li>
                <li>Not disclose Confidential Information to any third parties</li>
                <li>Use Confidential Information solely for the purpose of this contract</li>
                <li>Return or destroy all Confidential Information upon contract completion</li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-white mb-2">3. Exclusions</h5>
              <p>
                Confidential Information does not include information that:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Is or becomes publicly available without breach of this Agreement</li>
                <li>Was rightfully in possession prior to disclosure</li>
                <li>Is independently developed without use of Confidential Information</li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-white mb-2">4. Term</h5>
              <p>
                This Agreement shall remain in effect for the duration of the contract and for
                two (2) years following its completion or termination.
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-white mb-2">5. Blockchain Record</h5>
              <p>
                By signing this NDA, both parties acknowledge that this agreement is recorded on the
                Solana blockchain and is legally binding. The signature timestamp and wallet addresses
                serve as proof of acceptance.
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-white mb-2">6. Remedies</h5>
              <p>
                Breach of this Agreement may result in irreparable harm. The non-breaching party
                shall be entitled to seek injunctive relief and damages through the CredChain
                dispute resolution process.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm">
              I have read and agree to the terms of this Non-Disclosure Agreement. I understand
              that my wallet signature will serve as a legally binding electronic signature, and
              this agreement will be recorded on the Solana blockchain.
            </span>
          </label>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleSign}
            disabled={!agreed}
            className={`btn-primary flex-1 flex items-center justify-center space-x-2 ${
              !agreed ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Sign with Wallet</span>
          </button>
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">
          Your wallet signature creates a cryptographic proof of agreement stored on-chain
        </p>
      </div>
    </div>
  );
};