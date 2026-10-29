import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  DescriptivesRequest,
  FrequenciesRequest,
  CrosstabRequest,
  IndependentTTestRequest,
  PairedTTestRequest,
  AnovaRequest,
  CorrelationRequest,
  RegressionRequest,
  AnalysisRun,
} from '@/types/analysis';

export function useAnalyses(datasetId?: string | null) {
  const queryClient = useQueryClient();

  const analysesQuery = useQuery({
    queryKey: ['analyses', datasetId],
    queryFn: () => apiClient.get<AnalysisRun[]>(`/analyses/dataset/${datasetId}`),
    enabled: Boolean(datasetId),
  });

  const invalidate = (data: AnalysisRun) => {
    queryClient.invalidateQueries({ queryKey: ['analyses', data.dataset_id] });
  };

  const descriptivesMutation = useMutation({
    mutationFn: (data: DescriptivesRequest) => apiClient.post<AnalysisRun>('/analyses/descriptives', data),
    onSuccess: invalidate,
  });

  const frequenciesMutation = useMutation({
    mutationFn: (data: FrequenciesRequest) => apiClient.post<AnalysisRun>('/analyses/frequencies', data),
    onSuccess: invalidate,
  });

  const crosstabsMutation = useMutation({
    mutationFn: (data: CrosstabRequest) => apiClient.post<AnalysisRun>('/analyses/crosstabs', data),
    onSuccess: invalidate,
  });

  const independentTTestMutation = useMutation({
    mutationFn: (data: IndependentTTestRequest) => apiClient.post<AnalysisRun>('/analyses/ttest-ind', data),
    onSuccess: invalidate,
  });

  const pairedTTestMutation = useMutation({
    mutationFn: (data: PairedTTestRequest) => apiClient.post<AnalysisRun>('/analyses/ttest-paired', data),
    onSuccess: invalidate,
  });

  const anovaMutation = useMutation({
    mutationFn: (data: AnovaRequest) => apiClient.post<AnalysisRun>('/analyses/anova', data),
    onSuccess: invalidate,
  });

  const correlationMutation = useMutation({
    mutationFn: (data: CorrelationRequest) => apiClient.post<AnalysisRun>('/analyses/correlation', data),
    onSuccess: invalidate,
  });

  const regressionMutation = useMutation({
    mutationFn: (data: RegressionRequest) => apiClient.post<AnalysisRun>('/analyses/regression', data),
    onSuccess: invalidate,
  });

  return {
    analyses: analysesQuery.data ?? [],
    isLoading: analysesQuery.isLoading,
    runDescriptives: descriptivesMutation.mutateAsync,
    runFrequencies: frequenciesMutation.mutateAsync,
    runCrosstabs: crosstabsMutation.mutateAsync,
    runIndependentTTest: independentTTestMutation.mutateAsync,
    runPairedTTest: pairedTTestMutation.mutateAsync,
    runAnova: anovaMutation.mutateAsync,
    runCorrelation: correlationMutation.mutateAsync,
    runRegression: regressionMutation.mutateAsync,
  };
}

export function useAnalysisRun(analysisId: string | null) {
  return useQuery({
    queryKey: ['analysis-run', analysisId],
    queryFn: () => apiClient.get<AnalysisRun>(`/analyses/${analysisId}`),
    enabled: Boolean(analysisId),
  });
}
