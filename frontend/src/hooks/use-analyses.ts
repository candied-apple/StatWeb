import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { DescriptivesRequest, AnalysisRun } from '@/types/analysis';

export function useAnalyses(datasetId?: string | null) {
  const queryClient = useQueryClient();

  const analysesQuery = useQuery({
    queryKey: ['analyses', datasetId],
    queryFn: () => apiClient.get<AnalysisRun[]>(`/analyses/dataset/${datasetId}`),
    enabled: Boolean(datasetId),
  });

  const runDescriptivesMutation = useMutation({
    mutationFn: (data: DescriptivesRequest) =>
      apiClient.post<AnalysisRun>('/analyses/descriptives', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['analyses', data.dataset_id] });
    },
  });

  return {
    analyses: analysesQuery.data ?? [],
    isLoading: analysesQuery.isLoading,
    runDescriptives: runDescriptivesMutation.mutateAsync,
    isRunning: runDescriptivesMutation.isPending,
  };
}

export function useAnalysisRun(analysisId: string | null) {
  return useQuery({
    queryKey: ['analysis-run', analysisId],
    queryFn: () => apiClient.get<AnalysisRun>(`/analyses/${analysisId}`),
    enabled: Boolean(analysisId),
  });
}
