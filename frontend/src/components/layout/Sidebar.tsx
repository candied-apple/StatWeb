import React from 'react';
import { useProjects } from '@/hooks/use-projects';
import { useUIStore } from '@/stores/use-ui-store';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  ChevronRight,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDataset } from '@/hooks/use-datasets';

export const Sidebar: React.FC = () => {
  const { projects, isLoading } = useProjects();
  const {
    activeProjectId,
    activeDatasetId,
    setActiveProject,
    setActiveDataset,
    setNewProjectOpen,
    setUploadOpen,
  } = useUIStore();

  const { deleteDataset } = useDataset(null);

  // If no active project and projects exist, pick the first
  React.useEffect(() => {
    if (!activeProjectId && projects.length > 0) {
      setActiveProject(projects[0].id);
      if (projects[0].datasets && projects[0].datasets.length > 0 && !activeDatasetId) {
        setActiveDataset(projects[0].datasets[0].id);
      }
    }
  }, [projects, activeProjectId, activeDatasetId, setActiveProject, setActiveDataset]);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  const handleDelete = async (e: React.MouseEvent, datasetId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this dataset?')) {
      await deleteDataset(datasetId);
      if (activeDatasetId === datasetId) {
        setActiveDataset(null);
      }
    }
  };

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-300 flex flex-col h-full select-none text-xs">
      {/* Project Selector Header */}
      <div className="p-3 border-b border-slate-200 bg-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
          <Database className="h-4 w-4 text-blue-700" />
          <span>Project Workspace</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setNewProjectOpen(true)}
          className="h-6 px-2 text-[11px] bg-white"
        >
          <Plus className="h-3 w-3 mr-1" />
          New
        </Button>
      </div>

      {/* Projects Dropdown / List */}
      <div className="px-3 py-2 border-b border-slate-200">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
          Active Project
        </label>
        <select
          value={activeProjectId || ''}
          onChange={(e) => {
            setActiveProject(e.target.value);
            const prj = projects.find((p) => p.id === e.target.value);
            if (prj && prj.datasets && prj.datasets.length > 0) {
              setActiveDataset(prj.datasets[0].id);
            } else {
              setActiveDataset(null);
            }
          }}
          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
          {projects.length === 0 && <option value="">No projects</option>}
        </select>
      </div>

      {/* Datasets Section */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex items-center justify-between px-2 py-1 mb-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Datasets
          </span>
          <button
            onClick={() => setUploadOpen(true)}
            className="text-blue-600 hover:text-blue-800 text-[11px] font-medium flex items-center"
          >
            <Plus className="h-3 w-3 mr-0.5" />
            Import
          </button>
        </div>

        {isLoading ? (
          <div className="p-4 text-center text-slate-400 text-xs">Loading projects...</div>
        ) : !activeProject || !activeProject.datasets || activeProject.datasets.length === 0 ? (
          <div className="p-4 text-center bg-white rounded border border-dashed border-slate-300 text-slate-500 my-2">
            <FileSpreadsheet className="h-6 w-6 mx-auto mb-1 text-slate-400" />
            <p className="font-medium text-[11px]">No datasets yet</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Import CSV, SAV, or XLSX</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUploadOpen(true)}
              className="mt-2 text-[11px] h-6 px-2"
            >
              Import Data
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {activeProject.datasets.map((dataset) => {
              const isActive = dataset.id === activeDatasetId;
              return (
                <div
                  key={dataset.id}
                  onClick={() => setActiveDataset(dataset.id)}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate min-w-0">
                    <FileSpreadsheet
                      className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-blue-600'}`}
                    />
                    <div className="truncate">
                      <div className="truncate text-xs">{dataset.name}</div>
                      <div
                        className={`text-[10px] ${
                          isActive ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {dataset.row_count} rows × {dataset.column_count} vars
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    <button
                      onClick={(e) => handleDelete(e, dataset.id)}
                      className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                        isActive
                          ? 'hover:bg-blue-700 text-blue-200'
                          : 'hover:bg-slate-300 text-slate-400 hover:text-red-600'
                      }`}
                      title="Delete dataset"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    {isActive && <ChevronRight className="h-3.5 w-3.5 text-blue-200" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
