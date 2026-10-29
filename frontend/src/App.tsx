import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/AppHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBar } from '@/components/layout/StatusBar';
import { DatasetWorkspace } from '@/views/DatasetWorkspace';
import { useUIStore } from '@/stores/use-ui-store';
import { useDataset } from '@/hooks/use-datasets';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const AppContent: React.FC = () => {
  const { activeDatasetId } = useUIStore();
  const { dataset } = useDataset(activeDatasetId);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          <DatasetWorkspace />
        </main>
      </div>
      <StatusBar dataset={dataset} />
    </div>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
