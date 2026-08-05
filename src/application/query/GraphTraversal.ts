import { Node, Edge } from '../../domain';

export class GraphTraversal {
  public static getAncestors(nodeId: string, nodes: Node[], edges: Edge[]): Node[] {
    const ancestors: Node[] = [];
    const visited = new Set<string>();
    const queue: string[] = [];

    // Find direct parents first
    const directParents = edges.filter((e) => e.targetNodeId === nodeId).map((e) => e.sourceNodeId);
    queue.push(...directParents);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (!visited.has(currentId)) {
        visited.add(currentId);
        const node = nodes.find((n) => n.id === currentId);
        if (node) {
          ancestors.push(node);
        }
        // Enqueue parents of current node
        const parents = edges.filter((e) => e.targetNodeId === currentId).map((e) => e.sourceNodeId);
        queue.push(...parents);
      }
    }

    return ancestors;
  }

  public static getDescendants(nodeId: string, nodes: Node[], edges: Edge[]): Node[] {
    const descendants: Node[] = [];
    const visited = new Set<string>();
    const queue: string[] = [];

    // Find direct children first
    const directChildren = edges.filter((e) => e.sourceNodeId === nodeId).map((e) => e.targetNodeId);
    queue.push(...directChildren);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (!visited.has(currentId)) {
        visited.add(currentId);
        const node = nodes.find((n) => n.id === currentId);
        if (node) {
          descendants.push(node);
        }
        // Enqueue children of current node
        const children = edges.filter((e) => e.sourceNodeId === currentId).map((e) => e.targetNodeId);
        queue.push(...children);
      }
    }

    return descendants;
  }
}
