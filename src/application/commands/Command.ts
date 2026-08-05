import { Workspace } from '../../domain';

export interface Command {
  execute(workspace: Workspace): Workspace;
  undo(workspace: Workspace): Workspace;
}
