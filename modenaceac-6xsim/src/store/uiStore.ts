import { create } from 'zustand';

interface TelemetryData {
  alt: number;
  vvi: number;
  ias: number;
  pitch: number;
  roll: number;
  hdg: number;
  rpm: number;
  rotor: number;
}

interface UiState {
  theme: 'light' | 'dark';
  timer: number;
  timerInt: ReturnType<typeof setInterval> | null;
  manSel: string | null;
  evals: Record<string, string>;
  td: TelemetryData;
  setTheme: (theme: 'light' | 'dark') => void;
  startTimer: () => void;
  stopTimer: () => void;
  setManSel: (id: string | null) => void;
  setEval: (manId: string, result: string) => void;
  resetEvals: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: 'light',
  timer: 0,
  timerInt: null,
  manSel: null,
  evals: {},
  td: { alt: 1180, vvi: -80, ias: 42, pitch: -1.8, roll: 0.5, hdg: 248, rpm: 6380, rotor: 322 },

  setTheme: (theme) => set({ theme }),

  startTimer: () => {
    const { timerInt } = get();
    if (timerInt) return;
    const interval = setInterval(() => {
      set((state) => {
        let newTd = { ...state.td };
        if (state.timer % 3 === 0) {
          newTd.alt += Math.round((Math.random() - 0.5) * 25);
          newTd.vvi = Math.round((Math.random() - 0.5) * 180);
          newTd.ias = Math.max(0, newTd.ias + Math.round((Math.random() - 0.5) * 4));
          newTd.pitch = parseFloat((newTd.pitch + (Math.random() - 0.5) * 0.4).toFixed(1));
          newTd.roll = parseFloat((newTd.roll + (Math.random() - 0.5) * 0.4).toFixed(1));
          newTd.hdg = (newTd.hdg + Math.round((Math.random() - 0.5) * 2) + 360) % 360;
          newTd.rpm = Math.max(6100, Math.min(6700, newTd.rpm + Math.round((Math.random() - 0.5) * 40)));
          newTd.rotor = Math.max(310, Math.min(340, newTd.rotor + Math.round((Math.random() - 0.5) * 3)));
        }
        return { timer: state.timer + 1, td: newTd };
      });
    }, 1000);
    set({ timerInt: interval });
  },

  stopTimer: () => {
    const { timerInt } = get();
    if (timerInt) {
      clearInterval(timerInt);
      set({ timerInt: null, timer: 0 });
    }
  },

  setManSel: (id) => set((state) => ({ manSel: state.manSel === id ? null : id })),

  setEval: (manId, result) => set((state) => ({ evals: { ...state.evals, [manId]: result }, manSel: null })),

  resetEvals: () => set({ evals: {} })
}));
