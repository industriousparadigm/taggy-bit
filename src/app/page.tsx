'use client';
import React, { useState, useEffect } from 'react';
import styles from './page.module.css';

export type Transaction = {
  txid: string;
  time: string;       // e.g. "25 April 2025 22:48:21"
  amount: number;     // in BTC
  usdAmount: number;  // historical USD value (at time)
  currentUsd: number; // current USD value (today)
  diffUsd: number;    // difference between current and historical USD value
  type: 'receive' | 'send' | 'unknown';
};

type ViewMode = 'landing' | 'results';

export default function LandingPage() {
  // The pubkey entered by the user.
  const [pubkey, setPubkey] = useState('');
  // All transactions loaded from the API.
  const [apiTxs, setApiTxs] = useState<Transaction[]>([]);
  // Saved transactions loaded from and persisted to localStorage.
  const [savedTxs, setSavedTxs] = useState<Transaction[]>([]);
  // The current view mode.
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount, load saved transactions from localStorage.
  useEffect(() => {
    const saved = localStorage.getItem('savedTxs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Transaction[];
        setSavedTxs(parsed);
      } catch {
        // Ignore errors.
      }
    }
  }, []);

  // Persist saved transactions to localStorage whenever they change.
  useEffect(() => {
    localStorage.setItem('savedTxs', JSON.stringify(savedTxs));
  }, [savedTxs]);

  // Handler for submitting a pubkey search.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/transactions?pubkey=${encodeURIComponent(pubkey)}`);
      const result = await res.json();
      if (result.error) {
        setError(result.error + (result.details ? `: ${result.details}` : ""));
        setApiTxs([]);
      } else {
        setApiTxs(result.transactions);
        // Switch to "results" mode after a successful load.
        setViewMode('results');
      }
    } catch {
      setError("Failed to fetch transactions.");
    }
    setLoading(false);
  };

  // Toggle the saved state of a transaction.
  const toggleSaveTransaction = (tx: Transaction) => {
    setSavedTxs((prev) => {
      const exists = prev.find((saved) => saved.txid === tx.txid);
      if (exists) {
        // Remove from saved.
        return prev.filter((saved) => saved.txid !== tx.txid);
      } else {
        // Add to saved.
        return [...prev, tx];
      }
    });
  };

  // In "results" mode, show all API transactions, marking saved ones.
  // In "landing" mode, show only saved transactions.
  const displayedTxs =
    viewMode === 'results'
      ? apiTxs
      : savedTxs;

  return (
    <div className={styles.container}>
      {/* Always show the search input at the top */}
      <h1 className={styles.title}>Your Transactions</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          value={pubkey}
          onChange={(e) => setPubkey(e.target.value)}
          placeholder="Enter your xpub or zpub..."
          className={styles.input}
        />
        <button type="submit" className={styles.button}>
          Search
        </button>
      </form>
      {loading && <p className={styles.loading}>Loading...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {/* Display Transactions */}
      <ul className={styles.list}>
        {displayedTxs.length === 0 ? (
          <p className={styles.info}>
            {viewMode === 'landing'
              ? "No saved transactions yet."
              : "No transactions found."}
          </p>
        ) : (
          displayedTxs.map((tx) => (
            <li
              key={tx.txid}
              className={`${styles.card} ${
                savedTxs.find((saved) => saved.txid === tx.txid)
                  ? styles.savedCard
                  : ''
              }`}
              onClick={() => toggleSaveTransaction(tx)}
            >
              <div className={styles.datetime}>{tx.time}</div>
              <div
                className={styles.amount}
                style={{ color: tx.type === 'send' ? 'red' : 'green' }}
              >
                {tx.type === 'send' ? '-' : '+'}{Math.abs(tx.amount)} BTC
              </div>
              <div className={styles.priceRow}>
                <span className={styles.priceValue}>
                  ${tx.usdAmount.toFixed(2)} (then)
                </span>
                <span className={styles.priceValue}>
                  ${tx.currentUsd.toFixed(2)} (now)
                </span>
              </div>
              <div className={styles.priceRow}>
                <span
                  className={styles.priceValue}
                  style={{ color: tx.diffUsd < 0 ? 'red' : 'green' }}
                >
                  {tx.diffUsd < 0 ? '-' : '+'}${Math.abs(tx.diffUsd).toFixed(2)}
                </span>
              </div>
              <div className={styles.txid}>{tx.txid}</div>
              {savedTxs.find((saved) => saved.txid === tx.txid) && (
                <div className={styles.savedBadge}>SAVED</div>
              )}
            </li>
          ))
        )}
      </ul>

      {/* Navigation */}
      {viewMode === 'results' && (
        <button className={styles.backButton} onClick={() => setViewMode('landing')}>
          ← Back to Saved Transactions
        </button>
      )}
      {viewMode === 'landing' && apiTxs.length > 0 && (
        <button className={styles.switchButton} onClick={() => setViewMode('results')}>
          Show Search Results
        </button>
      )}
    </div>
  );
}
