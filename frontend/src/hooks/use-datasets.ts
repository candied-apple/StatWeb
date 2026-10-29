import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  Dataset,
  DatasetDataPage,
  CellUpdateItem,
  AddVariablePayload,
  ComputeVariablePayload,
  RecodeVariablePayload,
} from '@/types/dataset';

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

  const updateCellsMutation = useMutation({
    mutationFn: (updates: CellUpdateItem[]) =>
      apiClient.patch(`/datasets/${datasetId}/cells`, { updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataset-data', datasetId] });
    },
  });

  const addRowMutation = useMutation({
    mutationFn: (values?: Record<string, any>) =>
      apiClient.post(`/datasets/${datasetId}/rows`, { values: values || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataset', datasetId] });
      queryClient.invalidateQueries({ queryKey: ['dataset-data', datasetId] });
    },
  });

  const deleteRowMutation = useMutation({
    mutationFn: (rowIndex: number) =>
      apiClient.delete(`/datasets/${datasetId}/rows/${rowIndex}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataset', datasetId] });
      queryClient.invalidateQueries({ queryKey: ['dataset-data', datasetId] });
    },
  });

  const addVariableMutation = useMutation({
    mutationFn: (payload: AddVariablePayload) =>
      apiClient.post(`/datasets/${datasetId}/variables`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataset', datasetId] });
      queryClient.invalidateQueries({ queryKey: ['dataset-data', datasetId] });
    },
  });

  const deleteVariableMutation = useMutation({
    mutationFn: (variableName: string) =>
      apiClient.delete(`/datasets/${datasetId}/variables/${variableName}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataset', datasetId] });
      queryClient.invalidateQueries({ queryKey: ['dataset-data', datasetId] });
    },
  });

  const computeVariableMutation = useMutation({
    mutationFn: (payload: ComputeVariablePayload) =>
      apiClient.post(`/datasets/${datasetId}/compute`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataset', datasetId] });
      queryClient.invalidateQueries({ queryKey: ['dataset-data', datasetId] });
    },
  });

  const recodeVariableMutation = useMutation({
    mutationFn: (payload: RecodeVariablePayload) =>
      apiClient.post(`/datasets/${datasetId}/recode`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataset', datasetId] });
      queryClient.invalidateQueries({ queryKey: ['dataset-data', datasetId] });
    },
  });

  const exportDataset = (format: 'csv' | 'xlsx' = 'csv') => {
    if (!datasetId) return;
    window.open(`/api/v1/datasets/${datasetId}/export?format=${format}`, '_blank');
  };

  return {
    dataset: datasetQuery.data,
    isLoading: datasetQuery.isLoading,
    error: datasetQuery.error,
    uploadDataset: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    deleteDataset: deleteMutation.mutateAsync,
    updateCells: updateCellsMutation.mutateAsync,
    addRow: addRowMutation.mutateAsync,
    deleteRow: deleteRowMutation.mutateAsync,
    addVariable: addVariableMutation.mutateAsync,
    deleteVariable: deleteVariableMutation.mutateAsync,
    computeVariable: computeVariableMutation.mutateAsync,
    recodeVariable: recodeVariableMutation.mutateAsync,
    exportDataset,
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
