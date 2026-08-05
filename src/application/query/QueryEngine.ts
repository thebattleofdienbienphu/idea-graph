import { Node, Edge } from '../../domain';
import { GraphTraversal } from './GraphTraversal';

export class QueryEngine {
  private readonly nodes: readonly Node[];
  private readonly edges: readonly Edge[];

  constructor(nodes: Node[], edges: Edge[]) {
    this.nodes = [...nodes];
    this.edges = [...edges];
  }

  public findNode(id: string): Node | null {
    return this.nodes.find((n) => n.id === id) || null;
  }

  public findParent(nodeId: string): Node[] {
    const parentIds = this.edges
      .filter((e) => e.targetNodeId === nodeId)
      .map((e) => e.sourceNodeId);
    return this.nodes.filter((n) => parentIds.includes(n.id));
  }

  public findChildren(nodeId: string): Node[] {
    const childIds = this.edges
      .filter((e) => e.sourceNodeId === nodeId)
      .map((e) => e.targetNodeId);
    return this.nodes.filter((n) => childIds.includes(n.id));
  }

  public findAncestors(nodeId: string): Node[] {
    return GraphTraversal.getAncestors(nodeId, this.nodes as Node[], this.edges as Edge[]);
  }

  public findDescendants(nodeId: string): Node[] {
    return GraphTraversal.getDescendants(nodeId, this.nodes as Node[], this.edges as Edge[]);
  }

  public findRootNodes(): Node[] {
    const targetIds = new Set(this.edges.map((e) => e.targetNodeId));
    return this.nodes.filter((n) => !targetIds.has(n.id));
  }

  public findLeafNodes(): Node[] {
    const sourceIds = new Set(this.edges.map((e) => e.sourceNodeId));
    return this.nodes.filter((n) => !sourceIds.has(n.id));
  }

  public findConnectedNodes(nodeId: string): Node[] {
    const connectedIds = new Set<string>();
    this.edges.forEach((e) => {
      if (e.sourceNodeId === nodeId) {
        connectedIds.add(e.targetNodeId);
      } else if (e.targetNodeId === nodeId) {
        connectedIds.add(e.sourceNodeId);
      }
    });
    return this.nodes.filter((n) => connectedIds.has(n.id));
  }

  public exists(nodeId: string): boolean {
    return this.nodes.some((n) => n.id === nodeId);
  }
}
