import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Project } from '@/types/project';

export function useProjects() {
  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.get<Project[]>('/projects'),
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiClient.post<Project>('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: string) => apiClient.delete(`/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return {
    projects: projectsQuery.data ?? [],
    isLoading: projectsQuery.isLoading,
    error: projectsQuery.error,
    createProject: createProjectMutation.mutateAsync,
    isCreating: createProjectMutation.isPending,
    deleteProject: deleteProjectMutation.mutateAsync,
  };
}
