import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Dataset, DatasetDataPage } from '@/types/dataset';

export function useDataset(datasetId: string | null) {
  const queryClient = useQueryClient();

  const datasetQuery = useQuery({
    queryKey: ['dataset', datasetId],
    queryFn: () => apiClient.get<Dataset>(`/datasets/${datasetId}`),
    enabled: Boolean(datasetId),
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) =>
      apiClient.post<Dataset>('/datasets/upload', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/datasets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return {
    dataset: datasetQuery.data,
    isLoading: datasetQuery.isLoading,
    error: datasetQuery.error,
    uploadDataset: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    deleteDataset: deleteMutation.mutateAsync,
  };
}

export function useDatasetData(datasetId: string | null, offset: number = 0, limit: number = 50) {
  return useQuery({
    queryKey: ['dataset-data', datasetId, offset, limit],
    queryFn: () =>
      apiClient.get<DatasetDataPage>(`/datasets/${datasetId}/data?offset=${offset}&limit=${limit}`),
    enabled: Boolean(datasetId),
  });
}
