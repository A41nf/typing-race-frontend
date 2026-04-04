// ─────────────────────────────────────────────────────────
// data/players.js — Demo players for simulation
// ─────────────────────────────────────────────────────────

export const DEMO_PLAYERS = [
  { id: "P001", name: "أحمد محمد", school: "شمس المعارف", pin: "1234", avatar: "🧑‍🎓" },
  { id: "P002", name: "سارة علي",  school: "شمس المعارف", pin: "5678", avatar: "👩‍🎓" },
  { id: "P003", name: "يوسف حسن",  school: "شمس المعارف", pin: "9012", avatar: "🧑‍🎓" },
  { id: "P004", name: "مريم خالد",  school: "شمس المعارف", pin: "3456", avatar: "👩‍🎓" },
  { id: "P005", name: "عمر سعيد",  school: "شمس المعارف", pin: "7890", avatar: "🧑‍🎓" },
  { id: "P006", name: "نور الدين",  school: "شمس المعارف", pin: "2468", avatar: "👩‍🎓" },
];

export const SCREEN = {
  DASHBOARD: "dashboard",
  LOBBY:     "lobby",
  COUNTDOWN: "countdown",
  RACE:      "race",
  RESULTS:   "results",
};

export const COUNTDOWN_STEPS = ["3", "2", "1", "إبدأ! 🚀"];
export const COUNTDOWN_INTERVAL_MS = 900;
export const MAX_RACE_SECONDS = 120;
export const CHARS_PER_WORD = 5;
