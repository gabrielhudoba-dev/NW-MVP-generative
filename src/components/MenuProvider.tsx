"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface MenuCtx {
  open:       boolean;
  navigating: boolean;
  toggle:     () => void;
  close:      () => void;
  setNavigating: (v: boolean) => void;
}

const Ctx = createContext<MenuCtx>({
  open:       false,
  navigating: false,
  toggle:     () => {},
  close:      () => {},
  setNavigating: () => {},
});

export function MenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  return (
    <Ctx.Provider value={{
      open,
      navigating,
      toggle: () => setOpen(v => !v),
      close:  () => { setOpen(false); setNavigating(false); },
      setNavigating,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMenu() {
  return useContext(Ctx);
}
