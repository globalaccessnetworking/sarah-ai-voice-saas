// ── FIX 2: Audio Interruption Bug ─────────────────────────────────────────────
// This hook manages polling WITHOUT exposing state that would cause audio
// components to unmount/remount. The complaints array is updated in-place
// using functional setState, and IDs are stable DB integers so React key
// reconciliation will UPDATE rows (not replace them) on every poll cycle.
//
// The audio player state (playingId, audioRef) lives in RegistryPage — OUTSIDE
// this hook — so polling updates never touch audio state.

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchComplaints, type Complaint } from '../lib/api';

interface UseComplaintsOptions {
  search?: string;
  status?: string;
  district?: string;
  pollInterval?: number; // ms — default 3000
  onNewComplaint?: (complaint: Complaint) => void;
}

export interface UseComplaintsResult {
  complaints: Complaint[];
  stats: { total: string; pending: string; resolved: string; unresolved: string };
  districts: string[];
  isLoading: boolean;
  lastUpdated: Date | null;
  refetch: () => void;
}

export function useComplaints({
  search = '',
  status = 'all',
  district = 'all',
  pollInterval = 3000,
  onNewComplaint,
}: UseComplaintsOptions = {}): UseComplaintsResult {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState({
    total: '0', pending: '0', resolved: '0', unresolved: '0',
  });
  const [districts, setDistricts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Stable ref for tracking known complaint IDs (for new-complaint detection)
  const knownIdsRef = useRef<Set<number>>(new Set());
  const isFirstFetchRef = useRef(true);
  const prevFiltersRef = useRef({ search, status, district });

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await fetchComplaints({ search, status, district });

      const filtersChanged = 
        prevFiltersRef.current.search !== search ||
        prevFiltersRef.current.status !== status ||
        prevFiltersRef.current.district !== district;

      if (filtersChanged) {
        prevFiltersRef.current = { search, status, district };
      }

      // ── New Complaint Detection ──────────────────────────────────────
      if (!isFirstFetchRef.current && onNewComplaint && !filtersChanged) {
        for (const complaint of data.complaints) {
          if (!knownIdsRef.current.has(complaint.id)) {
            onNewComplaint(complaint);
          }
        }
      }
      
      // Accumulate ALL seen IDs so they never trigger toasts again
      for (const complaint of data.complaints) {
        knownIdsRef.current.add(complaint.id);
      }
      
      isFirstFetchRef.current = false;
      // ────────────────────────────────────────────────────────────────

      // Sort newest first
      const sorted = [...data.complaints].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setComplaints(sorted);
      setStats(data.stats);
      setDistricts(data.districts);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[useComplaints] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, status, district, onNewComplaint]);

  // Initial fetch
  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Polling interval — silent re-fetches do NOT trigger isLoading=true,
  // so the table stays stable and audio is never interrupted
  useEffect(() => {
    const timer = setInterval(() => fetchData(true), pollInterval);
    return () => clearInterval(timer);
  }, [fetchData, pollInterval]);

  return {
    complaints,
    stats,
    districts,
    isLoading,
    lastUpdated,
    refetch: () => fetchData(false),
  };
}
