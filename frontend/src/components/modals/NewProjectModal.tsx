import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUIStore } from '@/stores/use-ui-store';
import { useProjects } from '@/hooks/use-projects';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export const NewProjectModal: React.FC = () => {
  const { isNewProjectOpen, setNewProjectOpen, setActiveProject } = useUIStore();
  const { createProject, isCreating } = useProjects();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    try {
      const newProj = await createProject(data);
      setActiveProject(newProj.id);
      setNewProjectOpen(false);
      reset();
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create project');
    }
  };

  return (
    <Dialog open={isNewProjectOpen} onOpenChange={setNewProjectOpen}>
      <DialogContent onClose={() => setNewProjectOpen(false)}>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Organize datasets and statistical analyses within a dedicated project workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errorMsg && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Project Name *
            </label>
            <Input {...register('name')} placeholder="e.g. Clinical Trial Analysis 2026" />
            {errors.name && (
              <p className="text-[11px] text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Description (Optional)
            </label>
            <Input {...register('description')} placeholder="e.g. Phase 2 efficacy data" />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setNewProjectOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isCreating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreating ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
