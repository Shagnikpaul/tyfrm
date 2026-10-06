import { create } from "zustand"

type SelectedItem =
  | { kind: "welcome" }
  | { kind: "question"; id: string }
  | { kind: "ending" }
  | null

interface BuilderState {
  selectedItem: SelectedItem
  rightPanelTab: "question" | "design" | "logic"
  saveStatus: "idle" | "saving" | "saved" | "error"
  setSelectedItem: (item: SelectedItem) => void
  setRightPanelTab: (tab: "question" | "design" | "logic") => void
  setSaveStatus: (status: "idle" | "saving" | "saved" | "error") => void
}

export const useBuilderStore = create<BuilderState>((set) => ({
  selectedItem: null,
  rightPanelTab: "question",
  saveStatus: "idle",
  setSelectedItem: (item) => set({ selectedItem: item }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setSaveStatus: (status) => set({ saveStatus: status }),
}))
