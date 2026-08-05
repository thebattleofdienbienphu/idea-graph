import { Command } from './Command';
import { Workspace, Branch } from '../../domain';

export class CreateBranchCommand implements Command {
  private readonly branch: Branch;

  constructor(branch: Branch) {
    this.branch = branch;
  }

  public execute(workspace: Workspace): Workspace {
    return {
      ...workspace,
      branches: [...workspace.branches, this.branch],
    };
  }

  public undo(workspace: Workspace): Workspace {
    return {
      ...workspace,
      branches: workspace.branches.filter((b) => b.id !== this.branch.id),
      activeBranchId:
        workspace.activeBranchId === this.branch.id
          ? workspace.branches[0]?.id || ''
          : workspace.activeBranchId,
    };
  }
}

export class DeleteBranchCommand implements Command {
  private readonly branchId: string;
  private deletedBranch: Branch | null = null;
  private previousActiveBranchId: string = '';

  constructor(branchId: string) {
    this.branchId = branchId;
  }

  public execute(workspace: Workspace): Workspace {
    const branchToDelete = workspace.branches.find((b) => b.id === this.branchId);
    if (!branchToDelete) return workspace;

    this.deletedBranch = branchToDelete;
    this.previousActiveBranchId = workspace.activeBranchId;

    const remainingBranches = workspace.branches.filter((b) => b.id !== this.branchId);
    const newActiveBranchId =
      workspace.activeBranchId === this.branchId
        ? remainingBranches[0]?.id || ''
        : workspace.activeBranchId;

    return {
      ...workspace,
      branches: remainingBranches,
      activeBranchId: newActiveBranchId,
    };
  }

  public undo(workspace: Workspace): Workspace {
    if (!this.deletedBranch) return workspace;

    return {
      ...workspace,
      branches: [...workspace.branches, this.deletedBranch],
      activeBranchId: this.previousActiveBranchId,
    };
  }
}

export class RenameBranchCommand implements Command {
  private readonly branchId: string;
  private readonly newName: string;
  private oldName: string = '';

  constructor(branchId: string, newName: string) {
    this.branchId = branchId;
    this.newName = newName;
  }

  public execute(workspace: Workspace): Workspace {
    const branch = workspace.branches.find((b) => b.id === this.branchId);
    if (!branch) return workspace;

    this.oldName = branch.name;

    return {
      ...workspace,
      branches: workspace.branches.map((b) => {
        if (b.id !== this.branchId) return b;
        return {
          ...b,
          name: this.newName,
        };
      }),
    };
  }

  public undo(workspace: Workspace): Workspace {
    if (!this.oldName) return workspace;

    return {
      ...workspace,
      branches: workspace.branches.map((b) => {
        if (b.id !== this.branchId) return b;
        return {
          ...b,
          name: this.oldName,
        };
      }),
    };
  }
}
