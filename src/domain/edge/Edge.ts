export interface Edge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  type: string;
  properties: Record<string, any>;
}
