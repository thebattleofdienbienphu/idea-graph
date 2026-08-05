import { Command } from './Command';
import { Workspace } from '../../domain';

export class CommandManager {
  private workspace: Workspace;
  private readonly onWorkspaceChange?: (workspace: Workspace) => void;

  constructor(initialWorkspace: Workspace, onWorkspaceChange?: (workspace: Workspace) => void) {
    this.workspace = initialWorkspace;
    this.onWorkspaceChange = onWorkspaceChange;
  }

  public getWorkspace(): Workspace {
    return this.workspace;
  }

  public resetWorkspace(workspace: Workspace): void {
    this.workspace = workspace;
    if (this.onWorkspaceChange) {
      this.onWorkspaceChange(workspace);
    }
  }

  public execute(command: Command): void {
    const nextWorkspace = command.execute(this.workspace);
    this.workspace = nextWorkspace;
    if (this.onWorkspaceChange) {
      this.onWorkspaceChange(nextWorkspace);
    }
  }

  public undo(command: Command): void {
    const nextWorkspace = command.undo(this.workspace);
    this.workspace = nextWorkspace;
    if (this.onWorkspaceChange) {
      this.onWorkspaceChange(nextWorkspace);
    }
  }
}
