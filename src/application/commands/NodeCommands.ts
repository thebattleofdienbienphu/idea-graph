import { Command } from './Command';
import { Workspace, Node, Edge } from '../../domain';

export class CreateNodeCommand implements Command {
  private readonly branchId: string;
  private readonly node: Node;

  constructor(branchId: string, node: Node) {
    this.branchId = branchId;
    this.node = node;
  }

  public execute(workspace: Workspace): Workspace {
    return {
      ...workspace,
      branches: workspace.branches.map((b) => {
        if (b.id !== this.branchId) return b;
        return {
          ...b,
          nodes: [...b.nodes, this.node],
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
          nodes: b.nodes.filter((n) => n.id !== this.node.id),
        };
      }),
    };
  }
}

export class DeleteNodeCommand implements Command {
  private readonly branchId: string;
  private readonly nodeId: string;
  private deletedNode: Node | null = null;
  private deletedEdges: Edge[] = [];

  constructor(branchId: string, nodeId: string) {
    this.branchId = branchId;
    this.nodeId = nodeId;
  }

  public execute(workspace: Workspace): Workspace {
    const branch = workspace.branches.find((b) => b.id === this.branchId);
    if (!branch) return workspace;

    const nodeToDelete = branch.nodes.find((n) => n.id === this.nodeId);
    if (!nodeToDelete) return workspace;

    this.deletedNode = nodeToDelete;
    this.deletedEdges = branch.edges.filter(
      (e) => e.sourceNodeId === this.nodeId || e.targetNodeId === this.nodeId
    );

    return {
      ...workspace,
      branches: workspace.branches.map((b) => {
        if (b.id !== this.branchId) return b;
        return {
          ...b,
          nodes: b.nodes.filter((n) => n.id !== this.nodeId),
          edges: b.edges.filter((e) => e.sourceNodeId !== this.nodeId && e.targetNodeId !== this.nodeId),
        };
      }),
    };
  }

  public undo(workspace: Workspace): Workspace {
    if (!this.deletedNode) return workspace;

    return {
      ...workspace,
      branches: workspace.branches.map((b) => {
        if (b.id !== this.branchId) return b;
        return {
          ...b,
          nodes: [...b.nodes, this.deletedNode!],
          edges: [...b.edges, ...this.deletedEdges],
        };
      }),
    };
  }
}

export class UpdateNodeCommand implements Command {
  private readonly branchId: string;
  private readonly nodeId: string;
  private readonly updatedFields: Partial<Omit<Node, 'id'>>;
  private previousFields: Partial<Omit<Node, 'id'>> | null = null;

  constructor(branchId: string, nodeId: string, updatedFields: Partial<Omit<Node, 'id'>>) {
    this.branchId = branchId;
    this.nodeId = nodeId;
    this.updatedFields = updatedFields;
  }

  public execute(workspace: Workspace): Workspace {
    const branch = workspace.branches.find((b) => b.id === this.branchId);
    if (!branch) return workspace;

    const node = branch.nodes.find((n) => n.id === this.nodeId);
    if (!node) return workspace;

    this.previousFields = {
      title: node.title,
      content: node.content,
      type: node.type,
      properties: { ...node.properties },
    };

    return {
      ...workspace,
      branches: workspace.branches.map((b) => {
        if (b.id !== this.branchId) return b;
        return {
          ...b,
          nodes: b.nodes.map((n) => {
            if (n.id !== this.nodeId) return n;
            return {
              ...n,
              ...this.updatedFields,
              properties: this.updatedFields.properties
                ? { ...n.properties, ...this.updatedFields.properties }
                : n.properties,
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
          nodes: b.nodes.map((n) => {
            if (n.id !== this.nodeId) return n;
            return {
              ...n,
              ...this.previousFields!,
            };
          }),
        };
      }),
    };
  }
}

export class MoveNodeCommand implements Command {
  private readonly branchId: string;
  private readonly nodeId: string;
  private readonly newPosition: { x: number; y: number };
  private oldPosition: { x: number; y: number } | null = null;

  constructor(branchId: string, nodeId: string, newPosition: { x: number; y: number }) {
    this.branchId = branchId;
    this.nodeId = nodeId;
    this.newPosition = newPosition;
  }

  public execute(workspace: Workspace): Workspace {
    const branch = workspace.branches.find((b) => b.id === this.branchId);
    if (!branch) return workspace;

    const node = branch.nodes.find((n) => n.id === this.nodeId);
    if (!node) return workspace;

    const currentX = typeof node.properties.x === 'number' ? node.properties.x : 0;
    const currentY = typeof node.properties.y === 'number' ? node.properties.y : 0;
    this.oldPosition = { x: currentX, y: currentY };

    return {
      ...workspace,
      branches: workspace.branches.map((b) => {
        if (b.id !== this.branchId) return b;
        return {
          ...b,
          nodes: b.nodes.map((n) => {
            if (n.id !== this.nodeId) return n;
            return {
              ...n,
              properties: {
                ...n.properties,
                x: this.newPosition.x,
                y: this.newPosition.y,
              },
            };
          }),
        };
      }),
    };
  }

  public undo(workspace: Workspace): Workspace {
    if (!this.oldPosition) return workspace;

    return {
      ...workspace,
      branches: workspace.branches.map((b) => {
        if (b.id !== this.branchId) return b;
        return {
          ...b,
          nodes: b.nodes.map((n) => {
            if (n.id !== this.nodeId) return n;
            return {
              ...n,
              properties: {
                ...n.properties,
                x: this.oldPosition!.x,
                y: this.oldPosition!.y,
              },
            };
          }),
        };
      }),
    };
  }
}
