"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// The whole "who are you" story is just a name kept in localStorage. No
// accounts, no passwords, fine for a private friend group. The name is sent
// along with every write so we know who added / reviewed / spun.

type NameContext = {
  name: string | null;
  ready: boolean; // true once we've read localStorage (avoids flash)
  setName: (name: string) => void;
  clearName: () => void;
};

const Ctx = createContext<NameContext | null>(null);
const KEY = "weeklymovies.name";

export function NameProvider({ children }: { children: ReactNode }) {
  const [name, setNameState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(KEY);
      if (stored) setNameState(stored);
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  const setName = (value: string) => {
    const trimmed = value.trim().slice(0, 40);
    if (!trimmed) return;
    setNameState(trimmed);
    try {
      window.localStorage.setItem(KEY, trimmed);
    } catch {
      // ignore
    }
  };

  const clearName = () => {
    setNameState(null);
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  };

  return (
    <Ctx.Provider value={{ name, ready, setName, clearName }}>
      {children}
    </Ctx.Provider>
  );
}

export function useName() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useName must be used inside <NameProvider>");
  return ctx;
}
