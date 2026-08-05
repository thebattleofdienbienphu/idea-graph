import { Command } from './Command';
import { Workspace, Edge } from '../../domain';

export class CreateEdgeCommand implements Command {
  private readonly branchId: string;
  private readonly edge: Edge;

  constructor(branchId: string, edge: Edge) {
    this.branchId = branchId;
    this.edge = edge;
  }

  public execute(workspace: Workspace): Workspace {
    return {
      ...workspace,
      branches: workspace.branches.map((b) => {
        if (b.id !== this.branchId) return b;
        return {
          ...b,
          edges: [...b.edges, this.edge],
        };
      }),
    };
  }

  public undo(workspace: Workspace): Workspace {
    return {
      ...workspace,
      branches: workspace.branches.map((b) => {
        if (b.id !== this.branchId) return b;
        return {
          ...b,
          edges: b.edges.filter((e) => e.id !== this.edge.id),
        };
      }),
    };
  }
}

export class DeleteEdgeCommand implements Command {
  private readonly branchId: string;
  private readonly edgeId: string;
  private deletedEdge: Edge | null = null;

  constructor(branchId: string, edgeId: string) {
    this.branchId = branchId;
    this.edgeId = edgeId;
  }

  public execute(workspace: Workspace): Workspace {
    const branch = workspace.branches.find((b) => b.id === this.branchId);
    if (!branch) return workspace;

    const edgeToDelete = branch.edges.find((e) => e.id === this.edgeId);
    if (!edgeToDelete) return workspace;

    this.deletedEdge = edgeToDelete;

    return {
      ...workspace,
      branches: workspace.branches.map((b) => {
        if (b.id !== this.branchId) return b;
        return {
          ...b,
          edges: b.edges.filter((e) => e.id !== this.edgeId),
        };
      }),
    };
  }

  public undo(workspace: Workspace): Workspace {
    if (!this.deletedEdge) return workspace;

    return {
      ...workspace,
      branches: workspace.branches.map((b) => {
        if (b.id !== this.branchId) return b;
        return {
          ...b,
          edges: [...b.edges, this.deletedEdge!],
        };
      }),
    };
  }
}

export class UpdateEdgeCommand implements Command {
  private readonly branchId: string;
  private readonly edgeId: string;
  private readonly updatedFields: Partial<Omit<Edge, 'id' | 'sourceNodeId' | 'targetNodeId'>>;
  private previousFields: Partial<Omit<Edge, 'id' | 'sourceNodeId' | 'targetNodeId'>> | null = null;

  constructor(
    branchId: string,
    edgeId: string,
    updatedFields: Partial<Omit<Edge, 'id' | 'sourceNodeId' | 'targetNodeId'>>
  ) {
    this.branchId = branchId;
    this.edgeId = edgeId;
    this.updatedFields = updatedFields;
  }

  public execute(workspace: Workspace): Workspace {
    const branch = workspace.branches.find((b) => b.id === this.branchId);
    if (!branch) return workspace;

    const edge = branch.edges.find((e) => e.id === this.edgeId);
    if (!edge) return workspace;

    this.previousFields = {
      type: edge.type,
      properties: { ...edge.properties },
    };

    return {
      ...workspace,
      branches: workspace.branches.map((b) => {
        if (b.id !== this.branchId) return b;
        return {
          ...b,
          edges: b.edges.map((e) => {
            if (e.id !== this.edgeId) return e;
            return {
              ...e,
              ...this.updatedFields,
              properties: this.updatedFields.properties
                ? { ...e.properties, ...this.updatedFields.properties }
                : e.properties,
            };
          }),
        };
      }),
    };
  }

  public undo(workspace: Workspace): Workspace {
    if (!this.previousFields) return workspace;

    return {
      ...workspace,
      branches: workspace.branches.map((b) => {
        if (b.id !== this.branchId) return b;
        return {
          ...b,
          edges: b.edges.map((e) => {
            if (e.id !== this.edgeId) return e;
            return {
              ...e,
              ...this.previousFields!,
            };
          }),
        };
      }),
    };
  }
}
