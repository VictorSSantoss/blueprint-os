import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Cloud save state shown in the header (FDD-0008 §4.2). `denied` means the email is not on the allow-list. */
export type CloudStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'denied';

interface CloudState {
  /** Signed-in email, or null when signed out. */
  email: string | null;
  /** Cloud project the plan on screen belongs to; null until the first save. */
  projectId: string | null;
  /** True when the plan on screen has changes the cloud does not have yet. */
  dirty: boolean;
  status: CloudStatus;
}

type PersistedCloud = Pick<CloudState, 'projectId' | 'dirty'>;

/** Raw cloud state. Change it only through the functions in `stores/cloudSync.ts`. */
export const useCloudStore = create<CloudState>()(
  persist<CloudState, [], [], PersistedCloud>(
    () => ({ email: null, projectId: null, dirty: false, status: 'idle' }),
    { name: 'blueprint-cloud', partialize: ({ projectId, dirty }) => ({ projectId, dirty }) }
  )
);
