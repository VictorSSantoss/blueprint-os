import { useEffect, useState } from 'react';
import { LoaderCircleIcon, XIcon } from 'lucide-react';
import { useSettingsStore } from '../../stores';
import { useCloudStore } from '../../stores/cloudStore';
import { listCloudProjects, openCloudProject, type CloudProjectSummary } from '../../stores/cloudSync';
import { formatDateTime } from '../../utils/format';

interface ProjectsDialogProps {
  onClose: () => void;
}

/** *Meus projetos*: lists cloud projects and opens one (FDD-0008 OBJ-05). */
export function ProjectsDialog({ onClose }: ProjectsDialogProps) {
  const t = useSettingsStore((s) => s.t);
  const currentId = useCloudStore((s) => s.projectId);
  const [projects, setProjects] = useState<CloudProjectSummary[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    listCloudProjects().then(setProjects, () => setFailed(true));
  }, []);

  const handleOpen = async (id: string) => {
    try {
      await openCloudProject(id);
      onClose();
    } catch {
      setFailed(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-paper text-ink rounded-lg shadow-xl w-96 max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <h2 className="font-semibold">{t('myProjects')}</h2>
          <button onClick={onClose} className="p-1 hover:bg-hover rounded" title={t('close')}>
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-auto p-2">
          {failed && <p className="p-2 text-sm text-ember">{t('cloudError')}</p>}
          {!failed && !projects && <LoaderCircleIcon className="w-5 h-5 m-4 animate-spin text-ink-faint" />}
          {projects?.length === 0 && <p className="p-2 text-sm text-ink-secondary">{t('cloudNoProjects')}</p>}
          {projects?.map((p) => (
            <button
              key={p.id}
              onClick={() => handleOpen(p.id)}
              className={`w-full text-left px-3 py-2 rounded hover:bg-hover ${p.id === currentId ? 'bg-teal-wash' : ''}`}
            >
              <div className="text-sm font-medium">{p.name}</div>
              <div className="text-xs text-ink-secondary">{formatDateTime(p.updatedAt)}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
