import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme } from "nativewind";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark";

interface ThemeState {
  themeMode: ThemeMode;
  hydrated: boolean;
  setThemeMode: (themeMode: ThemeMode) => void;
  setHydrated: (hydrated: boolean) => void;
}

function applyThemeMode(themeMode: ThemeMode) {
  colorScheme.set(themeMode);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeMode: "dark",
      hydrated: false,
      setThemeMode: (themeMode) => {
        applyThemeMode(themeMode);
        set({ themeMode });
      },
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "crediwise-theme",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ themeMode: state.themeMode }),
      onRehydrateStorage: () => (state) => {
        applyThemeMode(state?.themeMode ?? "dark");
        state?.setHydrated(true);
      },
    }
  )
);