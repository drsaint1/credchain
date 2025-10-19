import { Link } from 'react-router-dom';
import { FileCheck, Award, Shield, Zap, Globe, TrendingUp } from 'lucide-react';

export const Home = () => {
  return (
    <div className="space-y-20">
      
      <section className="text-center space-y-8 py-20 animate-fade-in">
        <h1 className="text-6xl md:text-7xl font-bold leading-tight">
          The Future of
          <span className="block bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 bg-clip-text text-transparent animate-pulse-slow">
            Freelance Work
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
          Secure milestone-based contracts and verifiable skill credentials on Solana.
          No middlemen. No fake reviews. Just trust.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Link to="/contracts" className="btn-primary text-lg px-8 py-4">
            Create Contract
          </Link>
          <Link to="/credentials" className="btn-secondary text-lg px-8 py-4">
            Get Certified
          </Link>
        </div>
      </section>

      
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-slide-up">
        <div className="glass-card p-8 text-center">
          <div className="text-4xl font-bold text-primary-400">$50B+</div>
          <div className="text-gray-300 mt-2">Freelance Market Size</div>
        </div>
        <div className="glass-card p-8 text-center">
          <div className="text-4xl font-bold text-accent-400">2-5%</div>
          <div className="text-gray-300 mt-2">Platform Fees (vs 20%)</div>
        </div>
        <div className="glass-card p-8 text-center">
          <div className="text-4xl font-bold text-primary-400">100%</div>
          <div className="text-gray-300 mt-2">On-Chain Verification</div>
        </div>
      </section>

      
      <section className="space-y-12">
        <h2 className="text-4xl md:text-5xl font-bold text-center">
          Why Choose <span className="text-primary-400">CredChain</span>?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="glass-card p-8 space-y-4 hover:scale-105 transition-transform">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <FileCheck className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold">Milestone-Based Escrow</h3>
            <p className="text-gray-300">
              Clients deposit funds in smart contract escrow. Release payments per milestone.
              Built-in revision requests and dispute resolution.
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start">
                <Shield className="w-5 h-5 text-primary-400 mr-2 mt-0.5" />
                <span>Client deposits full amount upfront</span>
              </li>
              <li className="flex items-start">
                <Zap className="w-5 h-5 text-primary-400 mr-2 mt-0.5" />
                <span>Instant payments on milestone approval</span>
              </li>
              <li className="flex items-start">
                <Shield className="w-5 h-5 text-primary-400 mr-2 mt-0.5" />
                <span>Staked arbitrator dispute resolution</span>
              </li>
            </ul>
          </div>

          
          <div className="glass-card p-8 space-y-4 hover:scale-105 transition-transform">
            <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-700 rounded-xl flex items-center justify-center">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold">Verifiable Skill Badges</h3>
            <p className="text-gray-300">
              Take proctored skill tests. Mint NFT badges on-chain. Employers verify credentials
              instantly. No more fake resumes.
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start">
                <Award className="w-5 h-5 text-accent-400 mr-2 mt-0.5" />
                <span>Proctored challenges (webcam + screen)</span>
              </li>
              <li className="flex items-start">
                <TrendingUp className="w-5 h-5 text-accent-400 mr-2 mt-0.5" />
                <span>Leaderboards for top performers</span>
              </li>
              <li className="flex items-start">
                <Globe className="w-5 h-5 text-accent-400 mr-2 mt-0.5" />
                <span>Global job board for badge holders</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      
      <section className="space-y-12">
        <h2 className="text-4xl md:text-5xl font-bold text-center">
          Popular <span className="text-accent-400">Templates</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Logo Design', price: '0.5-2 SOL', duration: '1-2 weeks' },
            { title: 'Website Build', price: '5-20 SOL', duration: '4-8 weeks' },
            { title: 'Content Writing', price: '0.2-1 SOL', duration: '3-7 days' },
            { title: 'Smart Contract Dev', price: '10-50 SOL', duration: '2-6 weeks' },
            { title: 'UI/UX Design', price: '2-10 SOL', duration: '2-4 weeks' },
            { title: 'Marketing Campaign', price: '5-15 SOL', duration: '4-8 weeks' },
          ].map((template, index) => (
            <div key={index} className="glass-card p-6 space-y-3 hover:border-primary-500 transition-colors cursor-pointer">
              <h4 className="text-xl font-semibold">{template.title}</h4>
              <div className="flex justify-between text-sm text-gray-300">
                <span>Budget: {template.price}</span>
                <span>{template.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      
      <section className="glass-card p-12 text-center space-y-6">
        <h2 className="text-4xl md:text-5xl font-bold">
          Ready to Get Started?
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Join thousands of freelancers and clients building trust on-chain.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link to="/contracts" className="btn-primary text-lg px-8 py-4">
            Post a Job
          </Link>
          <Link to="/credentials" className="btn-secondary text-lg px-8 py-4">
            Browse Talent
          </Link>
        </div>
      </section>
    </div>
  );
};