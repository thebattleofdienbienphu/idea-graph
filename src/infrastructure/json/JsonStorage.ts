import { IStorage } from '../IStorage';
import { Workspace } from '../../domain';
import { FileSystem } from '../filesystem/FileSystem';

export class JsonStorage implements IStorage {
  private fileSystem: FileSystem;

  constructor(fileSystem: FileSystem) {
    this.fileSystem = fileSystem;
  }

  public async saveWorkspace(workspace: Workspace): Promise<void> {
    const json = JSON.stringify(workspace, null, 2);
    const fileName = `workspace-${workspace.id}.json`;
    await this.fileSystem.writeFile(fileName, json);
  }

  public async loadWorkspace(id: string): Promise<Workspace | null> {
    try {
      const fileName = `workspace-${id}.json`;
      const json = await this.fileSystem.readFile(fileName);
      return JSON.parse(json) as Workspace;
    } catch {
      return null;
    }
  }
}
