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

  // New Transformation & Variable Management Modals
  isComputeOpen: boolean;
  isRecodeOpen: boolean;
  isAddVariableOpen: boolean;
  selectedValueLabelVarId: string | null;

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
  setComputeOpen: (open: boolean) => void;
  setRecodeOpen: (open: boolean) => void;
  setAddVariableOpen: (open: boolean) => void;
  setSelectedValueLabelVarId: (id: string | null) => void;
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

  isComputeOpen: false,
  isRecodeOpen: false,
  isAddVariableOpen: false,
  selectedValueLabelVarId: null,

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
  setComputeOpen: (open) => set({ isComputeOpen: open }),
  setRecodeOpen: (open) => set({ isRecodeOpen: open }),
  setAddVariableOpen: (open) => set({ isAddVariableOpen: open }),
  setSelectedValueLabelVarId: (id) => set({ selectedValueLabelVarId: id }),
}));
