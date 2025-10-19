import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Briefcase, Award, DollarSign, MapPin, Clock, Filter, Search, CheckCircle, Plus, Sparkles, Target } from 'lucide-react';
import { usePrograms } from '../hooks/usePrograms';
import { SKILL_CATEGORY_NAMES, SkillCategory, PROGRAM_IDS } from '../config/programs';
import { useToastContext } from '../components/Layout';
import { JobApplicationModal } from '../components/JobApplicationModal';
import { PostJobModal } from '../components/PostJobModal';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import { extractSkillCategory } from '../utils/badgeHelpers';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance';
  budget: string;
  duration: string;
  requiredBadges: string[];
  description: string;
  postedAt: string;
  applicants: number;
}

interface JobMatch {
  jobId: string;
  title: string;
  fitScore: number;
  reason: string;
  matchedSkills: string[];
}



export const JobBoard = () => {
  const { publicKey, connected } = useWallet();
  const { badgeNftProgram, jobBoardProgram, connection } = usePrograms();
  const toast = useToastContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedBadge, setSelectedBadge] = useState<string>('All');
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [applicationModal, setApplicationModal] = useState<Job | null>(null);
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [postJobModal, setPostJobModal] = useState(false);
  const [postingJob, setPostingJob] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  // const [fetchingJobs, setFetchingJobs] = useState(false);
  const [aiMatches, setAiMatches] = useState<JobMatch[]>([]);
  const [loadingAiMatches, setLoadingAiMatches] = useState(false);
  const [showAiRecommendations, setShowAiRecommendations] = useState(false);


  useEffect(() => {
    if (connected && publicKey && badgeNftProgram) {
      fetchUserBadges();
    } else {
      setUserBadges([]);
    }
  }, [connected, publicKey, badgeNftProgram]);

  
  useEffect(() => {
    if (jobBoardProgram) {
      fetchJobs();
    }
  }, [jobBoardProgram]);

  const fetchJobs = async () => {
    if (!jobBoardProgram) return;

    // setFetchingJobs(true);
    try {
      // @ts-expect-error - Account type from IDL
      const jobAccounts = await jobBoardProgram.account.job.all();

      console.log(`Fetched ${jobAccounts.length} jobs from blockchain`);


      const fetchedJobs: Job[] = jobAccounts.map((jobAccount: any) => {
        const job = jobAccount.account;

        
        const jobTypeKey = Object.keys(job.jobType)[0];
        const jobTypeMap: any = {
          'fullTime': 'Full-time',
          'partTime': 'Part-time',
          'contract': 'Contract',
          'freelance': 'Freelance',
        };
        const jobType = jobTypeMap[jobTypeKey] || 'Contract';

        
        const requiredBadges = job.requiredBadges.map((badge: any) => {
          const badgeKey = Object.keys(badge)[0];
          const categoryMap: Record<string, SkillCategory> = {
            'solanaDeveloper': SkillCategory.SolanaDeveloper,
            'uiUxDesigner': SkillCategory.UIUXDesigner,
            'contentWriter': SkillCategory.ContentWriter,
            'dataAnalyst': SkillCategory.DataAnalyst,
            'marketingSpecialist': SkillCategory.MarketingSpecialist,
            'frontendDeveloper': SkillCategory.FrontendDeveloper,
          };
          const category = categoryMap[badgeKey];
          return SKILL_CATEGORY_NAMES[category];
        });

        
        const budgetMinSol = job.budgetMin.toNumber() / anchor.web3.LAMPORTS_PER_SOL;
        const budgetMaxSol = job.budgetMax.toNumber() / anchor.web3.LAMPORTS_PER_SOL;
        const budget = `${budgetMinSol.toFixed(1)}-${budgetMaxSol.toFixed(1)} SOL`;

        
        const now = Date.now() / 1000;
        const createdAt = job.createdAt.toNumber();
        const secondsSince = now - createdAt;
        const hoursSince = Math.floor(secondsSince / 3600);
        const daysSince = Math.floor(secondsSince / 86400);

        let postedAt;
        if (daysSince > 0) {
          postedAt = daysSince === 1 ? '1 day ago' : `${daysSince} days ago`;
        } else if (hoursSince > 0) {
          postedAt = hoursSince === 1 ? '1 hour ago' : `${hoursSince} hours ago`;
        } else {
          postedAt = 'Just now';
        }

        return {
          id: job.jobId,
          title: job.title,
          company: job.employer.toString().slice(0, 8) + '...',
          location: job.location,
          type: jobType as any,
          budget,
          duration: job.duration,
          requiredBadges,
          description: job.description,
          postedAt,
          applicants: job.applicantCount,
        };
      });

      setJobs(fetchedJobs);

      if (fetchedJobs.length > 0) {
        console.log('Loaded jobs:', fetchedJobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      // setFetchingJobs(false);
    }
  };

  const fetchUserBadges = async () => {
    if (!publicKey || !badgeNftProgram) return;

    setLoading(true);
    try {
      // @ts-expect-error - Account type from IDL
      const badges = await badgeNftProgram.account.badge.all([
        {
          memcmp: {
            offset: 8 + 32,
            bytes: publicKey.toBase58(),
          }
        }
      ]);

      console.log('Fetched badges:', badges);

      const badgeNames = badges
        .filter((b: any) => (b.account.isValid || b.account.is_valid) && !b.account.revoked)
        .map((badge: any) => {
          const category = extractSkillCategory(badge.account);

          if (!category) {
            return undefined;
          }

          return SKILL_CATEGORY_NAMES[category];
        })
        .filter((name: any) => name !== undefined) as string[];

      console.log('Badge names:', badgeNames);
      setUserBadges(badgeNames);

      if (badgeNames.length > 0) {
        toast.success(`Loaded ${badgeNames.length} verified badge${badgeNames.length > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
      toast.error('Failed to load your badges');
    } finally {
      setLoading(false);
    }
  };

  const getAIJobMatches = async () => {
    if (!publicKey || jobs.length === 0) return;

    setLoadingAiMatches(true);
    try {
      // Get user's completion count from localStorage
      const completionNFTs = JSON.parse(localStorage.getItem('minted-completion-nfts') || '[]');
      const userCompletions = completionNFTs.filter((nft: any) =>
        nft.freelancer === publicKey.toBase58()
      ).length;

      // Call the AI matching serverless function
      const response = await fetch('/api/match-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userBadges,
          jobs: jobs.map(job => ({
            id: job.id,
            title: job.title,
            description: job.description,
            requiredBadges: job.requiredBadges,
            budget: job.budget,
            type: job.type,
            duration: job.duration
          })),
          userCompletions
        })
      });

      const data = await response.json();

      if (data.success && data.matches) {
        setAiMatches(data.matches);
        setShowAiRecommendations(true);
        toast.success(`AI found ${data.matches.length} matching opportunities!`);
      } else {
        toast.error('Failed to get AI recommendations');
      }
    } catch (error) {
      console.error('Error getting AI matches:', error);
      toast.error('AI matching service unavailable');
    } finally {
      setLoadingAiMatches(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || job.type === selectedType;
    const matchesBadge = selectedBadge === 'All' ||
                        job.requiredBadges.includes(selectedBadge);
    return matchesSearch && matchesType && matchesBadge;
  });

  
  useEffect(() => {
    const stored = localStorage.getItem('appliedJobs');
    if (stored) {
      setAppliedJobs(new Set(JSON.parse(stored)));
    }
  }, []);

  const canApply = (job: Job) => {
    const result = job.requiredBadges.every(badge => userBadges.includes(badge));

    
    if (!result) {
      console.log('Cannot apply to job:', job.title);
      console.log('Required badges:', job.requiredBadges);
      console.log('User badges:', userBadges);
      console.log('Missing badges:', job.requiredBadges.filter(badge => !userBadges.includes(badge)));
    }

    return result;
  };

  const hasApplied = (jobId: string) => {
    return appliedJobs.has(jobId);
  };

  const handleApplyClick = (job: Job) => {
    setApplicationModal(job);
  };

  const handleApplicationSubmit = async (proposal: {
    coverLetter: string;
    proposedBudget: string;
    timeline: string;
    portfolio: string;
  }) => {
    if (!applicationModal) return;

    setSubmittingApplication(true);

    try {

      await new Promise(resolve => setTimeout(resolve, 1500));


      const application = {
        jobId: applicationModal.id,
        jobTitle: applicationModal.title,
        company: applicationModal.company,
        ...proposal,
        appliedAt: new Date().toISOString(),
        status: 'pending',
        walletAddress: publicKey?.toBase58(),
        badges: [...userBadges]
      };


      const existingApplications = JSON.parse(localStorage.getItem('jobApplications') || '[]');
      existingApplications.push(application);
      localStorage.setItem('jobApplications', JSON.stringify(existingApplications));


      const newAppliedJobs = new Set(appliedJobs);
      newAppliedJobs.add(applicationModal.id);
      setAppliedJobs(newAppliedJobs);
      localStorage.setItem('appliedJobs', JSON.stringify([...newAppliedJobs]));

      toast.success(`Application submitted successfully! The employer will review your proposal.`);
      setApplicationModal(null);
    } catch (error: any) {
      toast.error(`Failed to submit application: ${error.message}`);
    } finally {
      setSubmittingApplication(false);
    }
  };

  const handlePostJob = async (jobData: {
    jobId: string;
    title: string;
    description: string;
    budgetMin: number;
    budgetMax: number;
    jobType: 'FullTime' | 'PartTime' | 'Contract' | 'Freelance';
    duration: string;
    location: string;
    requiredBadges: SkillCategory[];
  }) => {
    if (!publicKey || !jobBoardProgram || !connection) {
      toast.error('Please connect your wallet');
      return;
    }

    setPostingJob(true);

    try {
      
      const budgetMinLamports = new BN(jobData.budgetMin * anchor.web3.LAMPORTS_PER_SOL);
      const budgetMaxLamports = new BN(jobData.budgetMax * anchor.web3.LAMPORTS_PER_SOL);

      
      const [jobPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('job'), Buffer.from(jobData.jobId)],
        PROGRAM_IDS.JOB_BOARD
      );

      
      const [authorityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('job-board-authority')],
        PROGRAM_IDS.JOB_BOARD
      );

      
      const requiredBadges = jobData.requiredBadges.map((badge) => {
        return { [badge.charAt(0).toLowerCase() + badge.slice(1)]: {} };
      });

      
      const jobType = { [jobData.jobType.charAt(0).toLowerCase() + jobData.jobType.slice(1)]: {} };

      
      const tx = await jobBoardProgram.methods
        .postJob(
          jobData.jobId,
          jobData.title,
          jobData.description,
          budgetMinLamports,
          budgetMaxLamports,
          jobType,
          jobData.duration,
          jobData.location,
          requiredBadges
        )
        .accounts({
          authority: authorityPda,
          job: jobPda,
          employer: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log('Job posted! Transaction:', tx);
      toast.success('Job posted successfully on-chain!');
      setPostJobModal(false);

      
      await fetchJobs();
    } catch (error: any) {
      console.error('Error posting job:', error);
      toast.error(`Failed to post job: ${error.message}`);
    } finally {
      setPostingJob(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold">Job Board</h1>
          <p className="text-gray-300 mt-2">Exclusive opportunities for verified talent</p>
        </div>
        {connected && (
          <button
            onClick={() => setPostJobModal(true)}
            className="btn-primary mt-4 md:mt-0 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Post a Job</span>
          </button>
        )}
      </div>

      
      {!connected && (
        <div className="glass-card p-8 text-center">
          <Award className="w-16 h-16 mx-auto text-accent-400 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Connect Wallet to Access Jobs</h3>
          <p className="text-gray-300 mb-4">
            Only badge holders can view and apply for opportunities
          </p>
        </div>
      )}

      {connected && (
        <>
          
          <div className="glass-card p-6">
            <h3 className="font-bold mb-3">Your Verified Skills</h3>
            {loading ? (
              <div className="text-center py-4">
                <p className="text-gray-400">Loading your badges...</p>
              </div>
            ) : userBadges.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {userBadges.map((badge, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-accent-500 to-accent-700 rounded-full text-sm font-medium flex items-center space-x-2"
                    >
                      <Award className="w-4 h-4" />
                      <span>{badge}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-400 mt-3">
                  These badges unlock exclusive job opportunities. Earn more badges to access more jobs!
                </p>
              </>
            ) : (
              <div className="text-center py-6">
                <Award className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400 mb-2">You don't have any verified badges yet</p>
                <p className="text-sm text-gray-500">
                  <a href="/credentials" className="text-primary-400 hover:text-primary-300">
                    Earn badges
                  </a>
                  {' '}
                  to unlock job opportunities!
                </p>
              </div>
            )}
          </div>

          {/* AI Job Matching */}
          {userBadges.length > 0 && jobs.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-accent-400" />
                  <h3 className="text-lg font-bold">AI Job Matching</h3>
                </div>
                <button
                  onClick={getAIJobMatches}
                  disabled={loadingAiMatches}
                  className="btn-primary flex items-center space-x-2"
                >
                  {loadingAiMatches ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4" />
                      <span>Find Best Matches</span>
                    </>
                  )}
                </button>
              </div>

              {showAiRecommendations && aiMatches.length > 0 && (
                <div className="space-y-3 mt-4">
                  <p className="text-sm text-gray-400">AI-powered recommendations based on your skills and experience:</p>
                  {aiMatches.slice(0, 3).map((match, index) => {
                    const job = jobs.find(j => j.id === match.jobId);
                    if (!job) return null;

                    return (
                      <div
                        key={match.jobId}
                        className="p-4 bg-gradient-to-r from-accent-500/10 to-primary-500/10 border border-accent-500/30 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-lg font-bold">#{index + 1}</span>
                              <h4 className="font-bold">{match.title}</h4>
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                                {match.fitScore}% Match
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 mb-2">{match.reason}</p>
                            <div className="flex flex-wrap gap-1">
                              {match.matchedSkills.map((skill, idx) => (
                                <span key={idx} className="px-2 py-1 bg-accent-500/20 text-accent-300 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const element = document.getElementById(`job-${match.jobId}`);
                              element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            className="btn-secondary text-sm ml-4"
                          >
                            View Job
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}


          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center space-x-2 text-lg font-bold">
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary-500"
                    placeholder="Search jobs..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">Job Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
                >
                  <option value="All">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2">Required Badge</label>
                <select
                  value={selectedBadge}
                  onChange={(e) => setSelectedBadge(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
                >
                  <option value="All">All Badges</option>
                  <option value="Solana Developer">Solana Developer</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="Content Writer">Content Writer</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="Marketing Specialist">Marketing Specialist</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                </select>
              </div>
            </div>
          </div>

          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {filteredJobs.length} {filteredJobs.length === 1 ? 'Opportunity' : 'Opportunities'}
              </h2>
            </div>

            {filteredJobs.map((job) => (
              <div
                key={job.id}
                id={`job-${job.id}`}
                className={`glass-card p-6 space-y-4 hover:border-primary-500 transition-all ${
                  !canApply(job) ? 'opacity-60' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-4 md:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1">{job.title}</h3>
                        <p className="text-gray-300">{job.company}</p>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-400 mt-2">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{job.duration}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span>{job.budget}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-300 mt-4">{job.description}</p>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {job.requiredBadges.map((badge, index) => (
                        <div
                          key={index}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            userBadges.includes(badge)
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {badge} {userBadges.includes(badge) ? '✓' : '✗'}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-3">
                    <span className={`px-4 py-1 rounded-full text-sm font-medium ${
                      job.type === 'Full-time' ? 'bg-blue-500/20 text-blue-400' :
                      job.type === 'Part-time' ? 'bg-yellow-500/20 text-yellow-400' :
                      job.type === 'Contract' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {job.type}
                    </span>
                    <p className="text-sm text-gray-400">{job.postedAt}</p>
                    <p className="text-sm text-gray-400">{job.applicants} applicants</p>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-white/10">
                  {hasApplied(job.id) ? (
                    <button
                      className="btn-secondary flex-1 cursor-not-allowed opacity-75"
                      disabled
                    >
                      <CheckCircle className="w-5 h-5 inline mr-2" />
                      Applied
                    </button>
                  ) : canApply(job) ? (
                    <>
                      <button
                        onClick={() => handleApplyClick(job)}
                        className="btn-primary flex-1"
                      >
                        Apply Now
                      </button>
                      <button className="btn-secondary">Save</button>
                    </>
                  ) : (
                    <div className="flex-1 text-center">
                      <p className="text-yellow-400 text-sm mb-2">
                        You need the following badges to apply:
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {job.requiredBadges
                          .filter(badge => !userBadges.includes(badge))
                          .map((badge, index) => (
                            <span key={index} className="text-sm text-red-400">
                              {badge}
                            </span>
                          ))}
                      </div>
                      <a href="/credentials" className="btn-secondary mt-3 inline-block">
                        Earn Missing Badges
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="glass-card p-12 text-center">
              <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-2xl font-bold mb-2">No Jobs Found</h3>
              <p className="text-gray-400">Try adjusting your filters</p>
            </div>
          )}
        </>
      )}


      {applicationModal && (
        <JobApplicationModal
          jobTitle={applicationModal.title}
          company={applicationModal.company}
          budget={applicationModal.budget}
          onSubmit={handleApplicationSubmit}
          onClose={() => setApplicationModal(null)}
          loading={submittingApplication}
        />
      )}

      
      {postJobModal && (
        <PostJobModal
          onSubmit={handlePostJob}
          onClose={() => setPostJobModal(false)}
          loading={postingJob}
        />
      )}
    </div>
  );
};