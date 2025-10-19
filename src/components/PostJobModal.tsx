import { useState } from 'react';
import { X, Plus, Minus, Sparkles, Loader2 } from 'lucide-react';
import { SKILL_CATEGORY_NAMES, SkillCategory } from '../config/programs';
import { useToastContext } from './Layout';

interface PostJobModalProps {
  onSubmit: (jobData: {
    jobId: string;
    title: string;
    description: string;
    budgetMin: number;
    budgetMax: number;
    jobType: 'FullTime' | 'PartTime' | 'Contract' | 'Freelance';
    duration: string;
    location: string;
    requiredBadges: SkillCategory[];
  }) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

export const PostJobModal = ({ onSubmit, onClose, loading }: PostJobModalProps) => {
  const toast = useToastContext();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budgetMin: '',
    budgetMax: '',
    jobType: 'Contract' as const,
    duration: '',
    location: 'Remote',
    requiredBadges: [] as SkillCategory[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [improvingWithAI, setImprovingWithAI] = useState(false);

  const jobTypes: Array<'FullTime' | 'PartTime' | 'Contract' | 'Freelance'> = [
    'FullTime',
    'PartTime',
    'Contract',
    'Freelance',
  ];

  const availableBadges = Object.entries(SKILL_CATEGORY_NAMES) as [SkillCategory, string][];

  const toggleBadge = (badge: SkillCategory) => {
    if (formData.requiredBadges.includes(badge)) {
      setFormData({
        ...formData,
        requiredBadges: formData.requiredBadges.filter((b) => b !== badge),
      });
    } else {
      if (formData.requiredBadges.length >= 5) {
        setErrors({ ...errors, badges: 'Maximum 5 badges allowed' });
        return;
      }
      setFormData({
        ...formData,
        requiredBadges: [...formData.requiredBadges, badge],
      });
      setErrors({ ...errors, badges: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    else if (formData.title.length > 100) newErrors.title = 'Title must be 100 characters or less';

    if (!formData.description.trim()) newErrors.description = 'Description is required';
    else if (formData.description.length > 500)
      newErrors.description = 'Description must be 500 characters or less';

    const minBudget = parseFloat(formData.budgetMin);
    const maxBudget = parseFloat(formData.budgetMax);

    if (!formData.budgetMin) newErrors.budgetMin = 'Minimum budget is required';
    else if (isNaN(minBudget) || minBudget < 0)
      newErrors.budgetMin = 'Invalid budget amount';

    if (!formData.budgetMax) newErrors.budgetMax = 'Maximum budget is required';
    else if (isNaN(maxBudget) || maxBudget < 0)
      newErrors.budgetMax = 'Invalid budget amount';

    if (minBudget && maxBudget && maxBudget < minBudget) {
      newErrors.budgetMax = 'Maximum budget must be greater than or equal to minimum';
    }

    if (!formData.duration.trim()) newErrors.duration = 'Duration is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';

    if (formData.requiredBadges.length === 0) {
      newErrors.badges = 'At least one badge is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const jobId = `job-${Date.now()}`;
    const minBudget = parseFloat(formData.budgetMin);
    const maxBudget = parseFloat(formData.budgetMax);

    await onSubmit({
      jobId,
      title: formData.title.trim(),
      description: formData.description.trim(),
      budgetMin: minBudget,
      budgetMax: maxBudget,
      jobType: formData.jobType,
      duration: formData.duration.trim(),
      location: formData.location.trim(),
      requiredBadges: formData.requiredBadges,
    });
  };

  const improveWithAI = async () => {
    if (!formData.title && !formData.description) {
      toast.error('Please enter a title or description first');
      return;
    }

    setImprovingWithAI(true);
    try {
      const selectedBadges = formData.requiredBadges.map(badge =>
        SKILL_CATEGORY_NAMES[badge]
      );

      const response = await fetch('/api/improve-job-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: selectedBadges.join(', '),
          budget: formData.budgetMin && formData.budgetMax
            ? `${formData.budgetMin}-${formData.budgetMax} SOL`
            : '',
          jobType: formData.jobType
        })
      });

      const data = await response.json();

      if (data.success && data.improvement) {
        // Apply improvements to form
        setFormData({
          ...formData,
          title: data.improvement.improvedTitle || formData.title,
          description: data.improvement.improvedDescription || formData.description,
        });

        // Show suggestions in toast
        toast.success('Job description improved with AI!');

        // Optionally show what was improved
        if (data.improvement.improvements && data.improvement.improvements.length > 0) {
          console.log('AI Improvements made:', data.improvement.improvements);
        }
        if (data.improvement.missingInfo && data.improvement.missingInfo.length > 0) {
          console.log('Consider adding:', data.improvement.missingInfo);
        }
      } else {
        toast.error('Failed to improve job description');
      }
    } catch (error) {
      console.error('Error improving job description:', error);
      toast.error('AI improvement service unavailable');
    } finally {
      setImprovingWithAI(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-white/10 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Post a Job</h2>
              <p className="text-gray-400 text-sm mt-1">
                Find verified talent for your project
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Job Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
              placeholder="e.g., Senior Solana Developer"
              maxLength={100}
              disabled={loading}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.title && <p className="text-red-400 text-sm">{errors.title}</p>}
              <p className="text-gray-500 text-xs ml-auto">{formData.title.length}/100</p>
            </div>
          </div>


          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">
                Description <span className="text-red-400">*</span>
              </label>
              <button
                onClick={improveWithAI}
                disabled={improvingWithAI || loading}
                className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-accent-500 to-primary-500 text-white rounded-lg text-xs font-medium hover:from-accent-600 hover:to-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {improvingWithAI ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Improving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>Improve with AI</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 min-h-[120px]"
              placeholder="Describe the job, requirements, and expectations..."
              maxLength={500}
              disabled={loading}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.description && (
                <p className="text-red-400 text-sm">{errors.description}</p>
              )}
              <p className="text-gray-500 text-xs ml-auto">
                {formData.description.length}/500
              </p>
            </div>
          </div>

          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Min Budget (SOL) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.budgetMin}
                onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
                placeholder="10"
                min="0"
                step="0.1"
                disabled={loading}
              />
              {errors.budgetMin && (
                <p className="text-red-400 text-sm mt-1">{errors.budgetMin}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Max Budget (SOL) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.budgetMax}
                onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
                placeholder="50"
                min="0"
                step="0.1"
                disabled={loading}
              />
              {errors.budgetMax && (
                <p className="text-red-400 text-sm mt-1">{errors.budgetMax}</p>
              )}
            </div>
          </div>

          
          <div>
            <label className="block text-sm font-medium mb-2">
              Job Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {jobTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setFormData({ ...formData, jobType: type })}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    formData.jobType === type
                      ? 'bg-primary-500 border-primary-500 text-white'
                      : 'bg-white/5 border-white/10 hover:border-primary-500'
                  }`}
                  disabled={loading}
                >
                  {type === 'FullTime'
                    ? 'Full-time'
                    : type === 'PartTime'
                    ? 'Part-time'
                    : type}
                </button>
              ))}
            </div>
          </div>

          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Duration <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
                placeholder="e.g., 3-6 months"
                disabled={loading}
              />
              {errors.duration && (
                <p className="text-red-400 text-sm mt-1">{errors.duration}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Location <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
                placeholder="Remote"
                disabled={loading}
              />
              {errors.location && (
                <p className="text-red-400 text-sm mt-1">{errors.location}</p>
              )}
            </div>
          </div>

          
          <div>
            <label className="block text-sm font-medium mb-2">
              Required Badges (1-5) <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Select the verified skills required for this position
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableBadges.map(([key, name]) => (
                <button
                  key={key}
                  onClick={() => toggleBadge(key)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                    formData.requiredBadges.includes(key)
                      ? 'bg-accent-500 border-accent-500 text-white'
                      : 'bg-white/5 border-white/10 hover:border-accent-500'
                  }`}
                  disabled={loading}
                >
                  {formData.requiredBadges.includes(key) ? (
                    <Minus className="w-3 h-3 inline mr-1" />
                  ) : (
                    <Plus className="w-3 h-3 inline mr-1" />
                  )}
                  {name}
                </button>
              ))}
            </div>
            {errors.badges && <p className="text-red-400 text-sm mt-2">{errors.badges}</p>}
          </div>

          
          <div className="flex space-x-3 pt-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Posting Job...' : 'Post Job'}
            </button>
          </div>

          
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
            <p className="text-sm text-gray-300">
              <span className="font-semibold">Platform Fee:</span> 2.5% of the final contract
              value will be collected upon job completion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};