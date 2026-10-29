import { create } from 'zustand';

export type WorkspaceTab = 'data' | 'variable' | 'output';

interface UIState {
  activeProjectId: string | null;
  activeDatasetId: string | null;
  activeTab: WorkspaceTab;
  activeAnalysisId: string | null;
  
  // Modals
  isUploadOpen: boolean;
  isDescriptivesOpen: boolean;
  isNewProjectOpen: boolean;

  // Actions
  setActiveProject: (id: string | null) => void;
  setActiveDataset: (id: string | null) => void;
  setActiveTab: (tab: WorkspaceTab) => void;
  setActiveAnalysis: (id: string | null) => void;
  setUploadOpen: (open: boolean) => void;
  setDescriptivesOpen: (open: boolean) => void;
  setNewProjectOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeProjectId: null,
  activeDatasetId: null,
  activeTab: 'data',
  activeAnalysisId: null,

  isUploadOpen: false,
  isDescriptivesOpen: false,
  isNewProjectOpen: false,

  setActiveProject: (id) => set({ activeProjectId: id }),
  setActiveDataset: (id) => set({ activeDatasetId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveAnalysis: (id) => set({ activeAnalysisId: id, activeTab: 'output' }),
  setUploadOpen: (open) => set({ isUploadOpen: open }),
  setDescriptivesOpen: (open) => set({ isDescriptivesOpen: open }),
  setNewProjectOpen: (open) => set({ isNewProjectOpen: open }),
}));
