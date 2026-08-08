import { IStorage } from '../IStorage';
import { Workspace } from '../../domain';

const STORAGE_KEY = 'idea-graph.workspace';

/**
 * LocalStorageAdapter
 *
 * Implements IStorage using the browser's localStorage API.
 * Stores the complete Workspace as a single JSON snapshot under
 * the key "idea-graph.workspace".
 *
 * Architecture notes:
 * - Depends only on IStorage (Infrastructure) and Workspace (Domain).
 * - Does NOT depend on React, React Flow, or UI layer.
 * - Invalid / missing data returns null; callers are responsible for
 *   creating a default Workspace when null is returned.
 */
export class LocalStorageAdapter implements IStorage {
  public async saveWorkspace(workspace: Workspace): Promise<void> {
    try {
      const json = JSON.stringify(workspace);
      localStorage.setItem(STORAGE_KEY, json);
    } catch {
      // localStorage may throw if storage quota is exceeded.
      // Silently ignore to avoid interrupting user interaction.
    }
  }

  public async loadWorkspace(_id: string): Promise<Workspace | null> {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (json === null) {
        return null;
      }
      const parsed = JSON.parse(json);
      // Basic shape validation: must have the required Workspace fields.
      if (
        typeof parsed !== 'object' ||
        typeof parsed.id !== 'string' ||
        typeof parsed.name !== 'string' ||
        !Array.isArray(parsed.branches) ||
        typeof parsed.activeBranchId !== 'string'
      ) {
        return null;
      }
      return parsed as Workspace;
    } catch {
      // JSON.parse can throw on corrupted data; return null so the
      // application falls back to a new empty Workspace.
      return null;
    }
  }
}
