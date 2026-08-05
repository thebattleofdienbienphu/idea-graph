import { Node } from '../node/Node';
import { Edge } from '../edge/Edge';

export interface Branch {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
}
