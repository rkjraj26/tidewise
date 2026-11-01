import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppData } from '../lib/types';
import { emptyData, getStorage, loadData, saveData } from '../lib/storage';
import { todayKey } from '../lib/dates';

interface Store {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
  replace: (d: AppData) => void;
  reset: () => void;
  persistent: boolean;
  saveFailed: boolean;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const storage = useRef(getStorage());
  const [data, setData] = useState<AppData>(() => loadData(storage.current.store));
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    setSaveFailed(!saveData(storage.current.store, data));
  }, [data]);

  const update = useCallback((fn: (d: AppData) => AppData) => setData((d) => fn(d)), []);
  const replace = useCallback((d: AppData) => setData(d), []);
  const reset = useCallback(() => setData(emptyData()), []);

  const value = useMemo(
    () => ({ data, update, replace, reset, persistent: storage.current.persistent, saveFailed }),
    [data, update, replace, reset, saveFailed],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside provider');
  return s;
}

/** Today's key, refreshed every 30 s so the app rolls over at midnight. */
export function useToday(): string {
  const [t, setT] = useState(todayKey());
  useEffect(() => {
    const id = window.setInterval(() => setT(todayKey()), 30_000);
    const onVis = () => setT(todayKey());
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);
  return t;
}
