export interface Node {
  id: string;
  title: string;
  content: string;
  type: string;
  properties: Record<string, any>;
}
