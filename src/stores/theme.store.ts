import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark";

interface ThemeState {
  themeMode: ThemeMode;
  hydrated: boolean;
  setThemeMode: (themeMode: ThemeMode) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeMode: "dark",
      hydrated: false,
      setThemeMode: (themeMode) => set({ themeMode }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "crediwise-theme",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ themeMode: state.themeMode }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);