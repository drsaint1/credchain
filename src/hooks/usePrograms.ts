import { useMemo } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { credchainIdl, badgeNftIdl, jobBoardIdl } from '../config/idls';


export const usePrograms = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const { provider, credchainProgram, badgeNftProgram, jobBoardProgram } = useMemo(() => {
    if (!wallet) {
      return {
        provider: null,
        credchainProgram: null,
        badgeNftProgram: null,
        jobBoardProgram: null,
      };
    }

    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });


    const credchainProgram = new Program(
      credchainIdl,
      provider
    );

    const badgeNftProgram = new Program(
      badgeNftIdl,
      provider
    );

    const jobBoardProgram = new Program(
      jobBoardIdl,
      provider
    );

    return {
      provider,
      credchainProgram,
      badgeNftProgram,
      jobBoardProgram,
    };
  }, [connection, wallet]);

  return {
    provider,
    connection,
    credchainProgram,
    badgeNftProgram,
    jobBoardProgram,
    connected: !!wallet,
  };
};