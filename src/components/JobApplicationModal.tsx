import { useState } from 'react';
import { Loader2, Send, X } from 'lucide-react';

interface JobApplicationModalProps {
  jobTitle: string;
  company: string;
  budget: string;
  onSubmit: (proposal: {
    coverLetter: string;
    proposedBudget: string;
    timeline: string;
    portfolio: string;
  }) => void;
  onClose: () => void;
  loading?: boolean;
}

export const JobApplicationModal = ({
  jobTitle,
  company,
  budget,
  onSubmit,
  onClose,
  loading = false
}: JobApplicationModalProps) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedBudget, setProposedBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [portfolio, setPortfolio] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ coverLetter, proposedBudget, timeline, portfolio });
  };

  const isValid = coverLetter.length >= 50 && proposedBudget && timeline;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="glass-card p-6 md:p-8 max-w-3xl w-full space-y-6 my-8">
        
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold">Apply for Position</h3>
            <p className="text-gray-300 mt-1">
              {jobTitle} at <span className="text-primary-400">{company}</span>
            </p>
            <p className="text-sm text-gray-400 mt-1">Budget: {budget}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Cover Letter *
              <span className="text-gray-400 ml-2">
                ({coverLetter.length}/500 characters, min 50)
              </span>
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value.slice(0, 500))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 min-h-[150px] resize-none"
              placeholder="Tell the employer why you're the best fit for this role. Highlight your relevant experience and skills..."
              required
              minLength={50}
              maxLength={500}
            />
            {coverLetter.length > 0 && coverLetter.length < 50 && (
              <p className="text-sm text-yellow-400 mt-1">
                Write at least {50 - coverLetter.length} more characters
              </p>
            )}
          </div>

          
          <div>
            <label className="block text-sm font-medium mb-2">
              Your Proposed Budget * (in SOL)
            </label>
            <input
              type="text"
              value={proposedBudget}
              onChange={(e) => setProposedBudget(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
              placeholder="e.g., 50 SOL or 50-100 SOL"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Suggested range: {budget}
            </p>
          </div>

          
          <div>
            <label className="block text-sm font-medium mb-2">
              Estimated Timeline *
            </label>
            <input
              type="text"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
              placeholder="e.g., 2-3 weeks, 1 month, etc."
              required
            />
          </div>

          
          <div>
            <label className="block text-sm font-medium mb-2">
              Portfolio / Previous Work (Optional)
            </label>
            <input
              type="url"
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
              placeholder="https://yourportfolio.com or https://github.com/yourusername"
            />
          </div>

          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-blue-400 mb-2">What happens next?</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Your application will be sent to the employer</li>
              <li>• Your verified badges prove your qualifications</li>
              <li>• If selected, a smart contract will be created</li>
              <li>• Escrow protects both parties during work</li>
            </ul>
          </div>

          
          <div className="flex space-x-4">
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center space-x-2"
              disabled={!isValid || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Application</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};