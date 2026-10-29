import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Variable, VariableUpdate } from '@/types/variable';

export function useVariables(datasetId?: string) {
  const queryClient = useQueryClient();

  const updateVariableMutation = useMutation({
    mutationFn: ({ variableId, data }: { variableId: string; data: VariableUpdate }) =>
      apiClient.patch<Variable>(`/variables/${variableId}`, data),
    onSuccess: () => {
      if (datasetId) {
        queryClient.invalidateQueries({ queryKey: ['dataset', datasetId] });
      }
    },
  });

  return {
    updateVariable: updateVariableMutation.mutateAsync,
    isUpdating: updateVariableMutation.isPending,
  };
}
