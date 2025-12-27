'use client';

import { useAccount, useWriteContract, useReadContract, useWatchContractEvent, usePublicClient } from 'wagmi';
import { useState, useEffect, useRef, useCallback } from 'react';
import { parseEther, formatEther, parseAbiItem } from 'viem';
import LendingPoolABI from '../LendingPool.json';
import CreditManagerABI from '../CreditManager.json';

// Contract addresses (Base Sepolia - Deployed)
const CREDIT_MANAGER_ADDRESS = '0xDB45F3c87d48Da1bc7776c45f3a2B6087751D8A0' as const;
const LENDING_POOL_ADDRESS = '0x88da6bd67403caa64641Ca5C3D7fD00d05A4a0B3' as const;

// Transaction log interface
interface TransactionLog {
  id: string;
  type: 'Deposit' | 'Borrow' | 'Repay';
  user: string;
  amount: bigint;
  interest?: bigint;
  blockNumber?: bigint;
  logIndex?: bigint;
  blockTimestamp?: number; // seconds
  displayTime: string; // "Dec 27, 14:30" (local)
  txHash?: `0x${string}` | string | null;
  flash?: boolean; // subtle highlight for live rows
}

// Tier configuration
const getTierInfo = (score: number) => {
  if (score > 800) return { name: 'Gold', color: 'from-yellow-400 to-amber-500', badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
  if (score >= 501) return { name: 'Silver', color: 'from-slate-300 to-slate-400', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
  if (score >= 200) return { name: 'Bronze', color: 'from-orange-400 to-orange-600', badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
  return { name: 'Starter', color: 'from-zinc-400 to-zinc-500', badge: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' };
};

// Address shortener
const shortenAddress = (addr: string) => {
  if (!addr) return '—';
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const formatUnixSecondsLocalShort = (sec: number | bigint) => {
  const n = typeof sec === 'bigint' ? Number(sec) : sec;
  if (!Number.isFinite(n) || n <= 0) return '—';
  return timeFormatter.format(new Date(n * 1000));
};

export function Dashboard() {
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  
  // Form states
  const [depositAmount, setDepositAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  
  // Button states
  const [initButtonText, setInitButtonText] = useState('Initialize Score');
  const [depositButtonText, setDepositButtonText] = useState('Deposit & Boost Score');
  const [borrowButtonText, setBorrowButtonText] = useState('Borrow');
  const [repayButtonText, setRepayButtonText] = useState('Repay Loan');
  const [harvestButtonText, setHarvestButtonText] = useState('Harvest Fees');

  // Transaction log state
  const [transactionLogs, setTransactionLogs] = useState<TransactionLog[]>([]);
  const [isPreloadingLogs, setIsPreloadingLogs] = useState(false);

  // Cache for block timestamps to avoid repeated RPC calls
  const blockTimestampCacheRef = useRef<Map<bigint, number>>(new Map());
  const seenLogIdsRef = useRef<Set<string>>(new Set());

  const makeLogId = (type: TransactionLog['type'], log: any, fallbackIndex: number) => {
    const tx = (log?.transactionHash ?? '0x') as string;
    const bn = typeof log?.blockNumber === 'bigint' ? log.blockNumber : undefined;
    const li = typeof log?.logIndex === 'bigint' ? log.logIndex : undefined;
    return `${type}-${tx}-${bn?.toString() ?? '0'}-${li?.toString() ?? String(fallbackIndex)}`;
  };

  const mergeIntoFeed = (incoming: TransactionLog[]) => {
    if (incoming.length === 0) return;

    setTransactionLogs((prev) => {
      const next: TransactionLog[] = [];

      // newest first
      for (const row of incoming) next.push(row);
      for (const row of prev) next.push(row);

      // dedupe + cap
      const seen = new Set<string>();
      const deduped: TransactionLog[] = [];
      for (const row of next) {
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        deduped.push(row);
        if (deduped.length >= 10) break;
      }
      return deduped;
    });
  };

  const getBlockTimestamp = async (blockNumber: bigint): Promise<number | null> => {
    if (!publicClient) return null;
    const cached = blockTimestampCacheRef.current.get(blockNumber);
    if (cached) return cached;

    try {
      const block = await publicClient.getBlock({ blockNumber });
      const ts = typeof block.timestamp === 'bigint' ? Number(block.timestamp) : Number(block.timestamp);
      if (Number.isFinite(ts) && ts > 0) {
        blockTimestampCacheRef.current.set(blockNumber, ts);
        return ts;
      }
      return null;
    } catch {
      return null;
    }
  };

  // ============ READ HOOKS ============
  
  // Credit Score
  const { data: creditScore, isLoading: isScoreLoading, refetch: refetchScore } = useReadContract({
    address: CREDIT_MANAGER_ADDRESS,
    abi: CreditManagerABI.abi,
    functionName: 'getCreditScore',
    args: address ? [address] : undefined,
  });

  // Profile Initialized
  const { data: isInitialized, refetch: refetchInitialized } = useReadContract({
    address: CREDIT_MANAGER_ADDRESS,
    abi: CreditManagerABI.abi,
    functionName: 'isProfileInitialized',
    args: address ? [address] : undefined,
  });

  // Borrow Limit
  const { data: borrowLimit, refetch: refetchLimit } = useReadContract({
    address: CREDIT_MANAGER_ADDRESS,
    abi: CreditManagerABI.abi,
    functionName: 'getBorrowLimit',
    args: address ? [address] : undefined,
  });

  // Score Breakdown
  const { data: scoreBreakdown, refetch: refetchBreakdown } = useReadContract({
    address: CREDIT_MANAGER_ADDRESS,
    abi: CreditManagerABI.abi,
    functionName: 'getScoreBreakdown',
    args: address ? [address] : undefined,
  });

  // LP Shares
  const { data: userShares, refetch: refetchShares } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: LendingPoolABI.abi,
    functionName: 'getShares',
    args: address ? [address] : undefined,
  });

  // Share Value
  const { data: shareValue, refetch: refetchShareValue } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: LendingPoolABI.abi,
    functionName: 'getShareValue',
    args: address ? [address] : undefined,
  });

  // Loan Info
  const { data: loanData, refetch: refetchLoan } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: LendingPoolABI.abi,
    functionName: 'getLoan',
    args: address ? [address] : undefined,
  });

  // Amount Due
  const { data: amountDue, refetch: refetchAmountDue } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: LendingPoolABI.abi,
    functionName: 'getAmountDue',
    args: address ? [address] : undefined,
  });

  // Pool Owner (for admin check)
  const { data: poolOwner } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: LendingPoolABI.abi,
    functionName: 'owner',
  });

  // Treasury Fees
  const { data: treasuryFees, refetch: refetchFees } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: LendingPoolABI.abi,
    functionName: 'treasuryFees',
  });

  // Pool Liquidity
  const { data: poolLiquidity, refetch: refetchPoolLiquidity } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: LendingPoolABI.abi,
    functionName: 'getAvailableLiquidity',
  });

  // Derived flags used by effects/watchers
  // Use !! to convert to boolean, avoiding 'unknown' type in JSX conditionals
  const isAdminUser = !!(address && poolOwner && address.toLowerCase() === (poolOwner as string).toLowerCase());
  const hasActiveLoanUser = !!(loanData && (loanData as any).isActive);

  // ============ EVENT WATCHERS (Admin Transaction Log) ============

  // Preload last ~10 events (admin only), then keep live feed running
  useEffect(() => {
    if (!isAdminUser || !publicClient) return;

    let cancelled = false;

    const preload = async () => {
      setIsPreloadingLogs(true);
      try {
        const latest = await publicClient.getBlockNumber();
        const lookback = BigInt(5000);
        const fromBlock = latest > lookback ? latest - lookback : BigInt(0);
        const toBlock = latest;

        const liquidityEvent = parseAbiItem('event LiquidityAdded(address indexed user, uint256 amount)');
        const loanTakenEvent = parseAbiItem('event LoanTaken(address indexed user, uint256 amount)');
        const loanRepaidEvent = parseAbiItem('event LoanRepaid(address indexed user, uint256 amount, uint256 interest)');

        const [depositLogs, borrowLogs, repayLogs] = await Promise.all([
          publicClient.getLogs({ address: LENDING_POOL_ADDRESS, event: liquidityEvent, fromBlock, toBlock }),
          publicClient.getLogs({ address: LENDING_POOL_ADDRESS, event: loanTakenEvent, fromBlock, toBlock }),
          publicClient.getLogs({ address: LENDING_POOL_ADDRESS, event: loanRepaidEvent, fromBlock, toBlock }),
        ]);

        const toRow = async (type: TransactionLog['type'], log: any, index: number): Promise<TransactionLog | null> => {
          const id = makeLogId(type, log, index);
          if (seenLogIdsRef.current.has(id)) return null;

          const blockNumber = typeof log.blockNumber === 'bigint' ? log.blockNumber : undefined;
          const logIndex = typeof log.logIndex === 'bigint' ? log.logIndex : undefined;
          const ts = blockNumber ? await getBlockTimestamp(blockNumber) : null;

          return {
            id,
            type,
            user: log?.args?.user ?? '',
            amount: log?.args?.amount ?? BigInt(0),
            interest: type === 'Repay' ? (log?.args?.interest ?? BigInt(0)) : undefined,
            blockNumber,
            logIndex,
            blockTimestamp: ts ?? undefined,
            displayTime: ts ? formatUnixSecondsLocalShort(ts) : '—',
            txHash: (log?.transactionHash ?? null) as any,
            flash: false,
          };
        };

        const rowsRaw = await Promise.all([
          ...depositLogs.map((l, i) => toRow('Deposit', l, i)),
          ...borrowLogs.map((l, i) => toRow('Borrow', l, i)),
          ...repayLogs.map((l, i) => toRow('Repay', l, i)),
        ]);

        const rows = rowsRaw.filter(Boolean) as TransactionLog[];

        rows.sort((a, b) => {
          const abn = a.blockNumber ?? BigInt(0);
          const bbn = b.blockNumber ?? BigInt(0);
          if (abn !== bbn) return abn > bbn ? -1 : 1;
          const ali = a.logIndex ?? BigInt(0);
          const bli = b.logIndex ?? BigInt(0);
          if (ali !== bli) return ali > bli ? -1 : 1;
          return 0;
        });

        const top10 = rows.slice(0, 10);
        if (cancelled) return;

        for (const r of top10) seenLogIdsRef.current.add(r.id);
        setTransactionLogs(top10);
      } finally {
        if (!cancelled) setIsPreloadingLogs(false);
      }
    };

    void preload();

    return () => {
      cancelled = true;
    };
  }, [isAdminUser, publicClient]);

  // Watch LiquidityAdded events
  useWatchContractEvent({
    address: LENDING_POOL_ADDRESS,
    abi: LendingPoolABI.abi,
    eventName: 'LiquidityAdded',
    onLogs(logs) {
      const placeholders: TransactionLog[] = [];

      logs.forEach((log, index) => {
        const id = makeLogId('Deposit', log, index);
        if (seenLogIdsRef.current.has(id)) return;
        seenLogIdsRef.current.add(id);

        placeholders.push({
          id,
          type: 'Deposit',
          user: (log as any).args?.user || '',
          amount: (log as any).args?.amount || BigInt(0),
          blockNumber: (log as any).blockNumber,
          logIndex: (log as any).logIndex,
          displayTime: '…',
          txHash: (log as any).transactionHash ?? null,
          flash: true,
        });
      });

      mergeIntoFeed(placeholders);

      void (async () => {
        const enriched = await Promise.all(
          placeholders.map(async (row) => {
            if (!row.blockNumber) return row;
            const ts = await getBlockTimestamp(row.blockNumber);
            return {
              ...row,
              blockTimestamp: ts ?? undefined,
              displayTime: ts ? formatUnixSecondsLocalShort(ts) : '—',
            };
          })
        );

        setTransactionLogs((prev) =>
          prev.map((p) => enriched.find((e) => e.id === p.id) ?? p).slice(0, 10)
        );
      })();
    },
  });

  // Watch LoanTaken events
  useWatchContractEvent({
    address: LENDING_POOL_ADDRESS,
    abi: LendingPoolABI.abi,
    eventName: 'LoanTaken',
    onLogs(logs) {
      const placeholders: TransactionLog[] = [];

      logs.forEach((log, index) => {
        const id = makeLogId('Borrow', log, index);
        if (seenLogIdsRef.current.has(id)) return;
        seenLogIdsRef.current.add(id);

        placeholders.push({
          id,
          type: 'Borrow',
          user: (log as any).args?.user || '',
          amount: (log as any).args?.amount || BigInt(0),
          blockNumber: (log as any).blockNumber,
          logIndex: (log as any).logIndex,
          displayTime: '…',
          txHash: (log as any).transactionHash ?? null,
          flash: true,
        });
      });

      mergeIntoFeed(placeholders);

      void (async () => {
        const enriched = await Promise.all(
          placeholders.map(async (row) => {
            if (!row.blockNumber) return row;
            const ts = await getBlockTimestamp(row.blockNumber);
            return {
              ...row,
              blockTimestamp: ts ?? undefined,
              displayTime: ts ? formatUnixSecondsLocalShort(ts) : '—',
            };
          })
        );

        setTransactionLogs((prev) =>
          prev.map((p) => enriched.find((e) => e.id === p.id) ?? p).slice(0, 10)
        );
      })();
    },
  });

  // Watch LoanRepaid events
  useWatchContractEvent({
    address: LENDING_POOL_ADDRESS,
    abi: LendingPoolABI.abi,
    eventName: 'LoanRepaid',
    onLogs(logs) {
      const placeholders: TransactionLog[] = [];

      logs.forEach((log, index) => {
        const id = makeLogId('Repay', log, index);
        if (seenLogIdsRef.current.has(id)) return;
        seenLogIdsRef.current.add(id);

        placeholders.push({
          id,
          type: 'Repay',
          user: (log as any).args?.user || '',
          amount: (log as any).args?.amount || BigInt(0),
          interest: (log as any).args?.interest || BigInt(0),
          blockNumber: (log as any).blockNumber,
          logIndex: (log as any).logIndex,
          displayTime: '…',
          txHash: (log as any).transactionHash ?? null,
          flash: true,
        });
      });

      mergeIntoFeed(placeholders);

      void (async () => {
        const enriched = await Promise.all(
          placeholders.map(async (row) => {
            if (!row.blockNumber) return row;
            const ts = await getBlockTimestamp(row.blockNumber);
            return {
              ...row,
              blockTimestamp: ts ?? undefined,
              displayTime: ts ? formatUnixSecondsLocalShort(ts) : '—',
            };
          })
        );

        setTransactionLogs((prev) =>
          prev.map((p) => enriched.find((e) => e.id === p.id) ?? p).slice(0, 10)
        );
      })();
    },
  });

  // ============ WRITE HOOKS ============
  
  // Initialize Score
  const { 
    writeContract: writeInitialize, 
    isPending: isInitPending, 
    isSuccess: isInitSuccess, 
    isError: isInitError,
    reset: resetInit
  } = useWriteContract();

  // Deposit
  const { 
    writeContract: writeDeposit, 
    isPending: isDepositPending, 
    isSuccess: isDepositSuccess, 
    isError: isDepositError,
    reset: resetDeposit
  } = useWriteContract();

  // Borrow
  const { 
    writeContract: writeBorrow, 
    isPending: isBorrowPending, 
    isSuccess: isBorrowSuccess, 
    isError: isBorrowError,
    reset: resetBorrow
  } = useWriteContract();

  // Repay
  const { 
    writeContract: writeRepay, 
    isPending: isRepayPending, 
    isSuccess: isRepaySuccess, 
    isError: isRepayError,
    reset: resetRepay
  } = useWriteContract();

  // Harvest Fees
  const { 
    writeContract: writeHarvest, 
    isPending: isHarvestPending, 
    isSuccess: isHarvestSuccess, 
    isError: isHarvestError,
    reset: resetHarvest
  } = useWriteContract();

  // ============ HANDLERS ============

  const refetchAll = useCallback(() => {
    // Refetch all data after transaction is successful
    // Using a small delay to ensure blockchain state has updated
    setTimeout(() => {
      refetchScore();
      refetchInitialized();
      refetchLimit();
      refetchBreakdown();
      refetchShares();
      refetchShareValue();
      refetchLoan();
      refetchAmountDue();
      refetchPoolLiquidity();
    }, 1500); // Wait 1.5 seconds for transaction to be mined and state to update
  }, [refetchScore, refetchInitialized, refetchLimit, refetchBreakdown, refetchShares, refetchShareValue, refetchLoan, refetchAmountDue, refetchPoolLiquidity]);

  // ============ EFFECTS ============

  // Initialize button state
  useEffect(() => {
    if (isInitPending) setInitButtonText('Initializing...');
    else if (isInitSuccess) {
      setInitButtonText('Success!');
      refetchAll();
      setTimeout(() => { setInitButtonText('Initialize Score'); resetInit(); }, 3000);
    } else if (isInitError) {
      setInitButtonText('Error');
      setTimeout(() => { setInitButtonText('Initialize Score'); resetInit(); }, 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitPending, isInitSuccess, isInitError]);

  // Deposit button state
  useEffect(() => {
    if (isDepositPending) setDepositButtonText('Depositing...');
    else if (isDepositSuccess) {
      setDepositButtonText('Success!');
      setDepositAmount('');
      refetchAll();
      setTimeout(() => { setDepositButtonText('Deposit & Boost Score'); resetDeposit(); }, 3000);
    } else if (isDepositError) {
      setDepositButtonText('Error');
      setTimeout(() => { setDepositButtonText('Deposit & Boost Score'); resetDeposit(); }, 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDepositPending, isDepositSuccess, isDepositError]);

  // Borrow button state
  useEffect(() => {
    if (isBorrowPending) setBorrowButtonText('Processing...');
    else if (isBorrowSuccess) {
      setBorrowButtonText('Success!');
      setBorrowAmount('');
      refetchAll();
      setTimeout(() => { setBorrowButtonText('Borrow'); resetBorrow(); }, 3000);
    } else if (isBorrowError) {
      setBorrowButtonText('Error');
      setTimeout(() => { setBorrowButtonText('Borrow'); resetBorrow(); }, 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBorrowPending, isBorrowSuccess, isBorrowError]);

  // Repay button state
  useEffect(() => {
    if (isRepayPending) setRepayButtonText('Repaying...');
    else if (isRepaySuccess) {
      setRepayButtonText('Success!');
      refetchAll();
      setTimeout(() => { setRepayButtonText('Repay Loan'); resetRepay(); }, 3000);
    } else if (isRepayError) {
      setRepayButtonText('Error');
      setTimeout(() => { setRepayButtonText('Repay Loan'); resetRepay(); }, 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRepayPending, isRepaySuccess, isRepayError]);

  // Harvest button state
  useEffect(() => {
    if (isHarvestPending) setHarvestButtonText('Harvesting...');
    else if (isHarvestSuccess) {
      setHarvestButtonText('Success!');
      refetchFees();
      setTimeout(() => { setHarvestButtonText('Harvest Fees'); resetHarvest(); }, 3000);
    } else if (isHarvestError) {
      setHarvestButtonText('Error');
      setTimeout(() => { setHarvestButtonText('Harvest Fees'); resetHarvest(); }, 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHarvestPending, isHarvestSuccess, isHarvestError]);

  const handleInitialize = () => {
    if (!address) return;
    writeInitialize({
      address: CREDIT_MANAGER_ADDRESS,
      abi: CreditManagerABI.abi,
      functionName: 'calculateGenesisScore',
      args: [address],
    });
  };

  const handleDeposit = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert('Please enter a valid deposit amount');
      return;
    }
    writeDeposit({
      address: LENDING_POOL_ADDRESS,
      abi: LendingPoolABI.abi,
      functionName: 'deposit',
      value: parseEther(depositAmount),
    });
  };

  const handleBorrow = () => {
    if (!borrowAmount || parseFloat(borrowAmount) <= 0) {
      alert('Please enter a valid borrow amount');
      return;
    }
    writeBorrow({
      address: LENDING_POOL_ADDRESS,
      abi: LendingPoolABI.abi,
      functionName: 'borrow',
      args: [parseEther(borrowAmount)],
    });
  };

  const handleRepay = () => {
    if (!amountDue) return;
    writeRepay({
      address: LENDING_POOL_ADDRESS,
      abi: LendingPoolABI.abi,
      functionName: 'repay',
      value: amountDue as bigint,
    });
  };

  const handleHarvest = () => {
    writeHarvest({
      address: LENDING_POOL_ADDRESS,
      abi: LendingPoolABI.abi,
      functionName: 'withdrawFees',
    });
  };

  // ============ FORMATTERS ============

  const score = Number(creditScore || 0);
  const tierInfo = getTierInfo(score);

  const formatScore = () => isScoreLoading ? '...' : score.toString();
  const formatLimit = () => borrowLimit ? formatEther(borrowLimit as bigint) : '0';
  const formatShares = () => userShares ? (Number(userShares) / 1e18).toFixed(4) : '0';
  const formatShareValue = () => shareValue ? formatEther(shareValue as bigint) : '0';
  const formatAmountDue = () => amountDue ? formatEther(amountDue as bigint) : '0';
  const formatTreasuryFees = () => treasuryFees ? formatEther(treasuryFees as bigint) : '0';
  const formatLiquidity = () => poolLiquidity ? formatEther(poolLiquidity as bigint) : '0';

  // Score breakdown
  const breakdown = scoreBreakdown as [bigint, bigint, bigint, bigint] | undefined;
  const genesisScore = breakdown ? Number(breakdown[0]) : 0;
  const depositBoost = breakdown ? Number(breakdown[1]) : 0;
  const repaymentBoost = breakdown ? Number(breakdown[2]) : 0;

  // Transaction type badge colors
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Deposit': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Borrow': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Repay': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  // ============ RENDER ============

  if (!isConnected) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-[#050b1a] to-slate-950">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl motion-safe:animate-[basedDrift_18s_ease-in-out_infinite] motion-reduce:animate-none" />
          <div className="absolute -bottom-40 right-[-120px] h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl motion-safe:animate-[basedDrift_22s_ease-in-out_infinite] motion-reduce:animate-none" />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay based-noise" />
        <div className="text-center px-6">
          <div className="mb-8">
            <div className="mx-auto h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 ring-1 ring-blue-400/20">
              <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-white">
            BaseD
          </h2>
          <p className="text-zinc-400 max-w-md mx-auto text-lg">
            BaseD: Your On-Chain Reputation &amp; Credit Protocol
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-[#050b1a] to-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-35">
        <div className="absolute -top-56 left-[-140px] h-[680px] w-[680px] rounded-full bg-blue-500/15 blur-3xl motion-safe:animate-[basedDrift_26s_ease-in-out_infinite] motion-reduce:animate-none" />
        <div className="absolute -bottom-60 right-[-220px] h-[720px] w-[720px] rounded-full bg-indigo-500/10 blur-3xl motion-safe:animate-[basedDrift_32s_ease-in-out_infinite] motion-reduce:animate-none" />
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay based-noise" />
      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500">BaseD</div>
            <h2 className="text-3xl font-bold text-white">Dashboard</h2>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-2 backdrop-blur-sm">
            <span className="text-sm text-slate-400">Pool Liquidity</span>
            <span className="text-emerald-400 font-mono text-sm">{formatLiquidity()} ETH</span>
          </div>
        </div>
        
        {/* Card Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          
          {/* ========== CARD A: Credit Profile ========== */}
          <div className="relative lg:col-span-2 overflow-hidden rounded-2xl border border-slate-800/70 bg-gradient-to-br from-[#0b1226]/80 via-slate-950/45 to-[#050b1a]/80 p-6 shadow-2xl shadow-blue-500/10 backdrop-blur-sm ring-1 ring-blue-500/15 transition-shadow duration-300 md:hover:shadow-blue-500/20 md:hover:ring-blue-500/25">
            <div className="pointer-events-none absolute inset-0 opacity-50">
              <div className="absolute -top-28 left-1/2 h-64 w-[520px] -translate-x-1/2 bg-gradient-to-r from-blue-500/10 via-white/5 to-indigo-500/10 blur-2xl" />
            </div>
            <div className="pointer-events-none absolute -inset-24 opacity-0 md:opacity-100 motion-safe:animate-[basedSheen_10s_ease-in-out_infinite] motion-reduce:animate-none">
              <div className="absolute left-0 top-1/2 h-24 w-[60%] -translate-y-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-xl" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h3 className="text-xl font-semibold text-white mb-2 sm:mb-0">Credit Profile</h3>
              <span className={`px-4 py-1.5 text-sm font-medium rounded-full border ${tierInfo.badge}`}>
                {tierInfo.name} Tier
              </span>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-3">
              {/* Score Display */}
              <div className="sm:col-span-1">
                <div className="relative">
                  <div className={`text-6xl font-black bg-gradient-to-r ${tierInfo.color} bg-clip-text text-transparent drop-shadow-sm`}>
                    {formatScore()}
                  </div>
                  <div className="text-zinc-500 text-sm mt-1">/ 1000 points</div>
                  {/* Progress bar */}
                  <div className="mt-4 h-2 bg-slate-900/70 rounded-full overflow-hidden ring-1 ring-slate-800/60">
                    <div 
                      className={`h-full bg-gradient-to-r ${tierInfo.color} transition-all duration-500`}
                      style={{ width: `${Math.min(score / 10, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="sm:col-span-1 space-y-3">
                <div className="text-sm text-slate-400">Score Breakdown</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Genesis (Wallet)</span>
                    <span className="text-white font-mono">+{genesisScore}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Deposit Boost</span>
                    <span className="text-emerald-400 font-mono">+{depositBoost}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Repayment Boost</span>
                    <span className="text-blue-400 font-mono">+{repaymentBoost}</span>
                  </div>
                </div>
              </div>

              {/* Borrow Limit & Initialize */}
              <div className="sm:col-span-1 space-y-4">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Available Borrow Limit</div>
                  <div className="text-3xl font-bold text-white">{formatLimit()} <span className="text-slate-500 text-lg">ETH</span></div>
                </div>
                
                {!isInitialized && (
                  <button
                    onClick={handleInitialize}
                    disabled={isInitPending}
                    className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 transform-gpu hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
                      isInitPending ? 'bg-blue-600/50 cursor-not-allowed' :
                      isInitSuccess ? 'bg-green-600' :
                      isInitError ? 'bg-red-600' :
                      'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/20'
                    }`}
                  >
                    {initButtonText}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ========== CARD B: Liquidity & Earn ========== */}
          <div className="rounded-2xl border border-slate-800/70 bg-gradient-to-br from-slate-900/70 via-slate-950/45 to-[#050b1a]/80 p-6 shadow-2xl shadow-blue-500/10 backdrop-blur-sm ring-1 ring-blue-500/10 transition-shadow duration-300 md:hover:shadow-blue-500/20 md:hover:ring-blue-500/20">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-semibold text-white">Liquidity & Earn</h3>
              <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                10% APR
              </span>
            </div>
            
            <div className="mb-4 p-4 rounded-xl bg-slate-950/30 border border-slate-800/60">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Your LP Shares</span>
                <span className="text-white font-mono text-base">{formatShares()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Share Value</span>
                <span className="text-emerald-400 font-mono text-base">{formatShareValue()} ETH</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Deposit Amount (ETH)</label>
                <input
                  type="text"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full rounded-xl border border-slate-800/70 bg-slate-950/40 px-4 py-3 text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  disabled={isDepositPending}
                />
              </div>
              <button
                onClick={handleDeposit}
                disabled={isDepositPending || !depositAmount}
                className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 transform-gpu hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
                  isDepositPending ? 'bg-blue-600/50 cursor-not-allowed' :
                  isDepositSuccess ? 'bg-green-600' :
                  isDepositError ? 'bg-red-600' :
                  'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/20'
                }`}
              >
                {depositButtonText}
              </button>
            </div>
            
            <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-slate-200">
                💡 Earn interest + get <span className="font-bold">+50 points</span> per 0.1 ETH deposited (max +400)
              </p>
            </div>
          </div>

          {/* ========== CARD C: Active Loan ========== */}
          <div className="rounded-2xl border border-slate-800/70 bg-gradient-to-br from-slate-900/70 via-slate-950/45 to-[#050b1a]/80 p-6 shadow-2xl shadow-blue-500/10 backdrop-blur-sm ring-1 ring-blue-500/10 transition-shadow duration-300 md:hover:shadow-blue-500/20 md:hover:ring-blue-500/20">
            <h3 className="text-xl font-semibold text-white mb-4">Active Loan</h3>
            
            {hasActiveLoanUser ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 ring-1 ring-amber-500/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-amber-400 text-sm font-medium">Outstanding Debt</span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400">Active</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{formatAmountDue()} <span className="text-zinc-500 text-lg">ETH</span></div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Principal: {loanData ? formatEther((loanData as any).principal) : '0'} ETH + Interest
                  </div>
                </div>
                <button
                  onClick={handleRepay}
                  disabled={isRepayPending}
                  className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 transform-gpu hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 ${
                    isRepayPending ? 'bg-amber-600/50 cursor-not-allowed' :
                    isRepaySuccess ? 'bg-green-600' :
                    isRepayError ? 'bg-red-600' :
                    'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/20'
                  }`}
                >
                  {repayButtonText}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-800/60">
                  <p className="text-slate-400 text-sm mb-2">No active loan. You can borrow up to:</p>
                  <p className="text-2xl font-bold text-white">{formatLimit()} <span className="text-zinc-500 text-lg">ETH</span></p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Borrow Amount (ETH)</label>
                  <input
                    type="text"
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full rounded-xl border border-slate-800/70 bg-slate-950/40 px-4 py-3 text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    disabled={isBorrowPending || !isInitialized}
                  />
                </div>
                <button
                  onClick={handleBorrow}
                  disabled={isBorrowPending || !borrowAmount || !isInitialized}
                  className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 transform-gpu hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
                    !isInitialized ? 'bg-zinc-700 cursor-not-allowed text-zinc-500' :
                    isBorrowPending ? 'bg-blue-600/50 cursor-not-allowed' :
                    isBorrowSuccess ? 'bg-green-600' :
                    isBorrowError ? 'bg-red-600' :
                    'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/20'
                  }`}
                >
                  {!isInitialized ? 'Initialize Score First' : borrowButtonText}
                </button>
                <p className="text-xs text-slate-500">
                  Interest Rate: 10% APR • Repay anytime
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ========== ADMIN PANEL ========== */}
        {isAdminUser && (
          <div className="mt-10 rounded-2xl border-2 border-red-500/60 bg-gradient-to-br from-[#2a060b]/70 via-[#120309]/60 to-slate-950 p-6 shadow-2xl shadow-red-500/10 ring-1 ring-red-500/15">
            <div className="flex items-center gap-3 mb-6">
              <h3 className="text-xl font-semibold text-red-400">🔐 Admin Panel</h3>
              <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                Owner Only
              </span>
            </div>
            
            {/* Treasury Section */}
            <div className="grid gap-4 sm:grid-cols-2 mb-6">
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 ring-1 ring-red-500/10">
                <div className="text-sm text-slate-300 mb-1">Accumulated Treasury Fees</div>
                <div className="text-3xl font-bold text-red-300">{formatTreasuryFees()} <span className="text-slate-500 text-lg">ETH</span></div>
                <div className="text-xs text-slate-500 mt-1">20% of all interest payments</div>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={handleHarvest}
                  disabled={isHarvestPending || !treasuryFees || treasuryFees === BigInt(0)}
                  className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 transform-gpu hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 ${
                    isHarvestPending ? 'bg-red-600/50 cursor-not-allowed' :
                    isHarvestSuccess ? 'bg-green-600' :
                    isHarvestError ? 'bg-red-800' :
                    'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-500/20 ring-1 ring-red-400/20'
                  }`}
                >
                  {harvestButtonText}
                </button>
              </div>
            </div>

            {/* Live Transaction Feed */}
            <div className="border-t border-red-500/20 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <h4 className="text-lg font-semibold text-red-300">Admin Activity Feed</h4>
                {isPreloadingLogs && (
                  <span className="ml-2 text-xs text-slate-500">Loading recent activity…</span>
                )}
              </div>

              {transactionLogs.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <p className="text-sm">No transactions yet. Waiting for activity...</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-slate-950/30">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 border-b border-slate-800/60">
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">User</th>
                        <th className="px-4 py-3 font-medium">Amount</th>
                        <th className="px-4 py-3 font-medium">Time</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {transactionLogs.map((log) => (
                        <tr
                          key={log.id}
                          className={`text-sm ${log.flash ? 'motion-safe:animate-[basedRowFlash_1.8s_ease-out_1]' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full border ${getTypeBadge(log.type)}`}>
                              {log.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-200">
                            {shortenAddress(log.user)}
                          </td>
                          <td className="px-4 py-3 text-white font-mono">
                            {formatEther(log.amount)} ETH
                            {log.interest && log.interest > BigInt(0) && (
                              <span className="text-zinc-500 text-xs ml-1">
                                (+{formatEther(log.interest)} interest)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-400">
                            {log.displayTime}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-emerald-400 font-semibold">✓</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
