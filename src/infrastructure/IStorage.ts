import { Workspace } from '../domain';

export interface IStorage {
  saveWorkspace(workspace: Workspace): Promise<void>;
  loadWorkspace(id: string): Promise<Workspace | null>;
}
