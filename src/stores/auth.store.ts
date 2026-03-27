import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "../lib/supabase";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  setAuth: (user: User | null, session: Session | null) => void;
  signOut: () => Promise<void>;
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,

  setAuth: (user, session) => set({ user, session }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        user: session?.user ?? null,
        loading: false,
        initialized: true,
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, loading: false });
    });

    return () => subscription.unsubscribe();
  },
}));
