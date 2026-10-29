import { create } from 'zustand';

export type WorkspaceTab = 'data' | 'variable' | 'output';

interface UIState {
  activeProjectId: string | null;
  activeDatasetId: string | null;
  activeTab: WorkspaceTab;
  activeAnalysisId: string | null;

  // Modals
  isUploadOpen: boolean;
  isNewProjectOpen: boolean;
  isDescriptivesOpen: boolean;
  isFrequenciesOpen: boolean;
  isCrosstabsOpen: boolean;
  isTTestOpen: boolean;
  isAnovaOpen: boolean;
  isCorrelationOpen: boolean;
  isRegressionOpen: boolean;

  // Actions
  setActiveProject: (id: string | null) => void;
  setActiveDataset: (id: string | null) => void;
  setActiveTab: (tab: WorkspaceTab) => void;
  setActiveAnalysis: (id: string | null) => void;
  setUploadOpen: (open: boolean) => void;
  setNewProjectOpen: (open: boolean) => void;
  setDescriptivesOpen: (open: boolean) => void;
  setFrequenciesOpen: (open: boolean) => void;
  setCrosstabsOpen: (open: boolean) => void;
  setTTestOpen: (open: boolean) => void;
  setAnovaOpen: (open: boolean) => void;
  setCorrelationOpen: (open: boolean) => void;
  setRegressionOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeProjectId: null,
  activeDatasetId: null,
  activeTab: 'data',
  activeAnalysisId: null,

  isUploadOpen: false,
  isNewProjectOpen: false,
  isDescriptivesOpen: false,
  isFrequenciesOpen: false,
  isCrosstabsOpen: false,
  isTTestOpen: false,
  isAnovaOpen: false,
  isCorrelationOpen: false,
  isRegressionOpen: false,

  setActiveProject: (id) => set({ activeProjectId: id }),
  setActiveDataset: (id) => set({ activeDatasetId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveAnalysis: (id) => set({ activeAnalysisId: id, activeTab: 'output' }),
  setUploadOpen: (open) => set({ isUploadOpen: open }),
  setNewProjectOpen: (open) => set({ isNewProjectOpen: open }),
  setDescriptivesOpen: (open) => set({ isDescriptivesOpen: open }),
  setFrequenciesOpen: (open) => set({ isFrequenciesOpen: open }),
  setCrosstabsOpen: (open) => set({ isCrosstabsOpen: open }),
  setTTestOpen: (open) => set({ isTTestOpen: open }),
  setAnovaOpen: (open) => set({ isAnovaOpen: open }),
  setCorrelationOpen: (open) => set({ isCorrelationOpen: open }),
  setRegressionOpen: (open) => set({ isRegressionOpen: open }),
}));
