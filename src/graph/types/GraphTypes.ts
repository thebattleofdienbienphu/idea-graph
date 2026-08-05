export interface DomainNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  selected?: boolean;
}

export interface DomainEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: Record<string, any>;
  selected?: boolean;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface GraphContextType {
  renderGraph: (domainNodes: DomainNode[], domainEdges: DomainEdge[]) => void;
  updateGraph: (domainNodes: DomainNode[], domainEdges: DomainEdge[]) => void;
  getViewport: () => Viewport;
  setViewport: (viewport: Viewport) => void;
}
