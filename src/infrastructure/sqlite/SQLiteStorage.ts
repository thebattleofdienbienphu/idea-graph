import { IStorage } from '../IStorage';
import { Workspace } from '../../domain';

export class SQLiteStorage implements IStorage {
  public async saveWorkspace(_workspace: Workspace): Promise<void> {
    throw new Error('Not implemented: SQLiteStorage.saveWorkspace');
  }

  public async loadWorkspace(_id: string): Promise<Workspace | null> {
    throw new Error('Not implemented: SQLiteStorage.loadWorkspace');
  }
}
