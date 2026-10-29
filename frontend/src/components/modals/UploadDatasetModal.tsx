import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUIStore } from '@/stores/use-ui-store';
import { useDataset } from '@/hooks/use-datasets';
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
import { UploadCloud } from 'lucide-react';

const uploadSchema = z.object({
  name: z.string().optional(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

export const UploadDatasetModal: React.FC = () => {
  const { isUploadOpen, setUploadOpen, activeProjectId, setActiveDataset } = useUIStore();
  const { uploadDataset, isUploading } = useDataset(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'xlsx', 'sav'].includes(ext || '')) {
        setErrorMsg('Only CSV (.csv), Excel (.xlsx), and SPSS (.sav) files are supported.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setErrorMsg(null);
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    if (!selectedFile) {
      setErrorMsg('Please choose a file to upload.');
      return;
    }
    if (!activeProjectId) {
      setErrorMsg('Please select or create an active project first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('project_id', activeProjectId);
    if (data.name && data.name.trim()) {
      formData.append('name', data.name.trim());
    }

    try {
      const newDataset = await uploadDataset(formData);
      setActiveDataset(newDataset.id);
      setUploadOpen(false);
      reset();
      setSelectedFile(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload dataset.');
    }
  };

  return (
    <Dialog open={isUploadOpen} onOpenChange={setUploadOpen}>
      <DialogContent onClose={() => setUploadOpen(false)}>
        <DialogHeader>
          <DialogTitle>Import Data</DialogTitle>
          <DialogDescription>
            Upload a dataset in CSV, Excel (.xlsx), or SPSS (.sav) format. Full variable metadata and labels will be preserved.
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
              Dataset Name (Optional)
            </label>
            <Input
              {...register('name')}
              placeholder={selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, '') : 'e.g. Employee Survey 2026'}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Choose File (.csv, .sav, .xlsx)
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors bg-slate-50">
              <input
                type="file"
                accept=".csv,.xlsx,.sav"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-input"
              />
              <label
                htmlFor="file-upload-input"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <UploadCloud className="h-8 w-8 text-blue-600 mb-2" />
                <span className="text-xs font-medium text-slate-700">
                  {selectedFile ? selectedFile.name : 'Click to browse files'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  SPSS (.sav), Excel (.xlsx), CSV (.csv) up to 100MB
                </span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUploadOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!selectedFile || isUploading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUploading ? 'Uploading & Parsing...' : 'Import Dataset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
