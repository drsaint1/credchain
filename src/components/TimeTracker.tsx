import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { SystemProgram } from '@solana/web3.js';
import { Clock, Play, Pause, Square, Calendar, Loader2 } from 'lucide-react';
import { BN } from '@coral-xyz/anchor';
import { usePrograms } from '../hooks/usePrograms';
import { getContractPDA, getTimeSessionPDA } from '../utils/pdaHelpers';

interface TimeTrackerProps {
  contractId: string;
  milestoneIndex: number;
}

interface TimeSession {
  startTime: number;
  endTime: number;
  duration: number;
  description: string;
  nonce: string;
}

export const TimeTracker = ({ contractId, milestoneIndex }: TimeTrackerProps) => {
  const { publicKey } = useWallet();
  const { credchainProgram } = usePrograms();

  const [isTracking, setIsTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentSessionNonce, setCurrentSessionNonce] = useState<BN | null>(null);
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingSession, setFetchingSession] = useState(false);

  useEffect(() => {
    if (publicKey && credchainProgram && contractId) {
      fetchSessions();
    }
  }, [publicKey, credchainProgram, contractId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && currentSessionNonce) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, currentSessionNonce]);

  const fetchSessions = async () => {
    if (!publicKey || !credchainProgram) return;

    setFetchingSession(true);
    try {
      // Time tracking not yet implemented in smart contract
      // const [contractPDA] = getContractPDA(contractId);
      // const allSessions = await credchainProgram.account.timeSession.all([
      //   {
      //     memcmp: {
      //       offset: 8,
      //       bytes: contractPDA.toBase58(),
      //     }
      //   }
      // ]);

      // const milestoneSessions = allSessions
      //   .filter((s: any) => s.account.milestoneIndex === milestoneIndex)
      //   .map((s: any) => ({
      //     startTime: s.account.startTime.toNumber(),
      //     endTime: s.account.endTime?.toNumber() || 0,
      //     duration: s.account.duration?.toNumber() || 0,
      //     description: s.account.description || '',
      //     nonce: s.account.startTime.toString(),
      //   }))
      //   .sort((a: any, b: any) => b.startTime - a.startTime);

      // setSessions(milestoneSessions);
      setSessions([]);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setFetchingSession(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalTime = () => {
    const completedTime = sessions.reduce((total, session) => total + session.duration, 0);
    return completedTime + elapsedTime;
  };

  const handleStart = async () => {
    if (!publicKey || !credchainProgram) {
      alert('Please connect your wallet');
      return;
    }

    setLoading(true);
    try {
      const sessionNonce = new BN(Date.now());
      const [contractPDA] = getContractPDA(contractId);
      const [sessionPDA] = getTimeSessionPDA(contractPDA, sessionNonce);

      console.log('Starting time session...');
      await credchainProgram.methods
        .startTimeSession(contractId, milestoneIndex, sessionNonce)
        .accounts({
          session: sessionPDA,
          contract: contractPDA,
          freelancer: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setCurrentSessionNonce(sessionNonce);
      setIsTracking(true);
      setElapsedTime(0);

      console.log('Time session started successfully!');
    } catch (error: any) {
      console.error('Error starting session:', error);
      alert(`Failed to start session: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = () => {
    setIsTracking(false);
  };

  const handleStop = async () => {
    if (!publicKey || !credchainProgram || !currentSessionNonce) {
      return;
    }

    setIsTracking(false);

    const description = prompt('Add a description for this session:');
    if (!description) {
      alert('Description is required to save the session');
      return;
    }

    setLoading(true);
    try {
      const [contractPDA] = getContractPDA(contractId);
      const [sessionPDA] = getTimeSessionPDA(contractPDA, currentSessionNonce);

      console.log('Ending time session...');
      await credchainProgram.methods
        .endTimeSession(contractId, milestoneIndex, currentSessionNonce, description)
        .accounts({
          session: sessionPDA,
          contract: contractPDA,
          freelancer: publicKey,
        })
        .rpc();

      console.log('Time session ended successfully!');

      
      setSessions([
        {
          startTime: Date.now() / 1000,
          endTime: Date.now() / 1000,
          duration: elapsedTime,
          description,
          nonce: currentSessionNonce.toString(),
        },
        ...sessions,
      ]);

      
      setElapsedTime(0);
      setCurrentSessionNonce(null);

      
      await fetchSessions();
    } catch (error: any) {
      console.error('Error ending session:', error);
      alert(`Failed to end session: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center space-x-2">
          <Clock className="w-6 h-6 text-primary-400" />
          <span>Time Tracker</span>
        </h3>
        <div className="text-sm text-gray-400">
          Total: {formatTime(getTotalTime())}
        </div>
      </div>

      
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center space-y-4">
        <div className="text-5xl font-bold font-mono">{formatTime(elapsedTime)}</div>

        <div className="flex justify-center space-x-3">
          {!isTracking && !currentSessionNonce ? (
            <button
              onClick={handleStart}
              className="btn-primary flex items-center space-x-2"
              disabled={loading || !publicKey}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Start</span>
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2"
                disabled={loading || !isTracking}
              >
                <Pause className="w-5 h-5" />
                <span>{isTracking ? 'Pause' : 'Paused'}</span>
              </button>

              <button
                onClick={handleStop}
                disabled={loading || elapsedTime === 0}
                className={`bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                  loading || elapsedTime === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Square className="w-5 h-5" />
                    <span>Stop & Save</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {isTracking && (
          <div className="flex items-center justify-center space-x-2 text-green-400 animate-pulse">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-sm">Tracking in progress...</span>
          </div>
        )}

        {!publicKey && (
          <p className="text-sm text-yellow-400">Please connect your wallet to track time</p>
        )}
      </div>

      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Recent Sessions</span>
          </h4>
          {fetchingSession && (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          )}
        </div>

        {sessions.length > 0 ? (
          <div className="space-y-2">
            {sessions.map((session, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{session.description}</div>
                  <div className="text-xs text-gray-400">
                    {formatDate(session.startTime)}
                    {session.endTime > 0 && ` - ${formatDate(session.endTime)}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold">{formatTime(session.duration)}</div>
                  <div className="text-xs text-gray-400">
                    {(session.duration / 3600).toFixed(1)} hrs
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No sessions recorded yet</p>
            <p className="text-xs">Start tracking time for this milestone</p>
          </div>
        )}
      </div>

      
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-400">
            {(getTotalTime() / 3600).toFixed(1)}
          </div>
          <div className="text-sm text-gray-400">Total Hours</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-accent-400">
            {sessions.length}
          </div>
          <div className="text-sm text-gray-400">Sessions</div>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Time logs are stored on-chain for transparency and billing verification
      </p>
    </div>
  );
};