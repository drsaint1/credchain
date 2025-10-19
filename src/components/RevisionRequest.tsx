import { useState } from 'react';
import { AlertCircle, MessageSquare, Send } from 'lucide-react';

interface RevisionRequestProps {
  contractId: string;
  milestoneId: string;
  currentRevisions: number;
  maxRevisions: number;
  onSubmit: (reason: string) => void;
}

export const RevisionRequest = ({
  contractId,
  milestoneId,
  currentRevisions,
  maxRevisions,
  onSubmit
}: RevisionRequestProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason);
      setReason('');
      setIsOpen(false);
    }
  };

  const remainingRevisions = maxRevisions - currentRevisions;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={remainingRevisions <= 0}
        className={`btn-secondary flex items-center space-x-2 ${
          remainingRevisions <= 0 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <MessageSquare className="w-5 h-5" />
        <span>Request Revision ({remainingRevisions}/{maxRevisions})</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-8 max-w-2xl w-full space-y-6 animate-slide-up">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold">Request Revision</h3>
                <p className="text-gray-400 mt-1">
                  Revisions remaining: {remainingRevisions}/{maxRevisions}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div className="text-sm text-yellow-200">
                <p className="font-semibold mb-1">Revision Policy</p>
                <ul className="space-y-1 text-yellow-300">
                  <li>• Be specific about what needs to be changed</li>
                  <li>• Revisions must be within original scope</li>
                  <li>• Maximum {maxRevisions} revisions per milestone</li>
                  <li>• Excessive revisions may trigger dispute resolution</li>
                </ul>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                What needs to be revised?
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 h-40"
                placeholder="Describe the changes you'd like to see in detail..."
                required
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleSubmit}
                disabled={!reason.trim()}
                className="btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>Submit Revision Request</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};