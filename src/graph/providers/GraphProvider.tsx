import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  ReactFlowProvider,
  useReactFlow,
  Node as RFNode,
  Edge as RFEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import { GraphContextType, DomainNode, DomainEdge, Viewport } from '../types/GraphTypes';
import { ReactFlowAdapter } from '../adapters/ReactFlowAdapter';

export interface GraphInternalContextType extends GraphContextType {
  nodes: RFNode[];
  edges: RFEdge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
}

const GraphContext = createContext<GraphInternalContextType | null>(null);

export function useGraph(): GraphInternalContextType {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error('useGraph must be used within a GraphProvider');
  }
  return context;
}

interface InnerProviderProps {
  children: React.ReactNode;
}

function GraphInnerProvider({ children }: InnerProviderProps) {
  const [nodes, setNodes] = useState<RFNode[]>([]);
  const [edges, setEdges] = useState<RFEdge[]>([]);
  const { getViewport: getRFViewport, setViewport: setRFViewport } = useReactFlow();

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const renderGraph = useCallback((domainNodes: DomainNode[], domainEdges: DomainEdge[]) => {
    setNodes((prevNodes) => {
      const prevNodeMap = new Map(prevNodes.map((n) => [n.id, n]));
      return domainNodes.map((dn) => {
        const prevNode = prevNodeMap.get(dn.id);
        const newNode = ReactFlowAdapter.toReactFlowNode(dn);

        if (prevNode) {
          const positionChanged =
            prevNode.position.x !== newNode.position.x ||
            prevNode.position.y !== newNode.position.y;
          const selectedChanged = prevNode.selected !== newNode.selected;
          const labelChanged = prevNode.data?.label !== newNode.data?.label;
          const contentChanged = prevNode.data?.content !== newNode.data?.content;
          const typeChanged = prevNode.type !== newNode.type;

          if (!positionChanged && !selectedChanged && !labelChanged && !contentChanged && !typeChanged) {
            return prevNode;
          }

          return {
            ...prevNode,
            position: newNode.position,
            selected: newNode.selected,
            data: newNode.data,
            type: newNode.type,
            selectable: newNode.selectable,
            deletable: newNode.deletable,
          };
        }
        return newNode;
      });
    });

    setEdges((prevEdges) => {
      const prevEdgeMap = new Map(prevEdges.map((e) => [e.id, e]));
      return domainEdges.map((de) => {
        const prevEdge = prevEdgeMap.get(de.id);
        const newEdge = ReactFlowAdapter.toReactFlowEdge(de);

        if (prevEdge) {
          const selectedChanged = prevEdge.selected !== newEdge.selected;
          const sourceChanged = prevEdge.source !== newEdge.source;
          const targetChanged = prevEdge.target !== newEdge.target;

          if (!selectedChanged && !sourceChanged && !targetChanged) {
            return prevEdge;
          }

          return {
            ...prevEdge,
            selected: newEdge.selected,
            source: newEdge.source,
            target: newEdge.target,
            selectable: newEdge.selectable,
            deletable: newEdge.deletable,
            markerEnd: newEdge.markerEnd,
          };
        }
        return newEdge;
      });
    });
  }, []);

  const updateGraph = useCallback((domainNodes: DomainNode[], domainEdges: DomainEdge[]) => {
    setNodes((prevNodes) => {
      const nodeMap = new Map(prevNodes.map((n) => [n.id, n]));
      domainNodes.forEach((dn) => {
        nodeMap.set(dn.id, ReactFlowAdapter.toReactFlowNode(dn));
      });
      return Array.from(nodeMap.values());
    });

    setEdges((prevEdges) => {
      const edgeMap = new Map(prevEdges.map((e) => [e.id, e]));
      domainEdges.forEach((de) => {
        edgeMap.set(de.id, ReactFlowAdapter.toReactFlowEdge(de));
      });
      return Array.from(edgeMap.values());
    });
  }, []);

  const getViewport = useCallback((): Viewport => {
    const rfViewport = getRFViewport();
    return {
      x: rfViewport.x,
      y: rfViewport.y,
      zoom: rfViewport.zoom,
    };
  }, [getRFViewport]);

  const setViewport = useCallback((viewport: Viewport) => {
    setRFViewport({
      x: viewport.x,
      y: viewport.y,
      zoom: viewport.zoom,
    }, { duration: 0 });
  }, [setRFViewport]);

  const value: GraphInternalContextType = {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    renderGraph,
    updateGraph,
    getViewport,
    setViewport,
  };

  return <GraphContext.Provider value={value}>{children}</GraphContext.Provider>;
}

export function GraphProvider({ children }: { children: React.ReactNode }) {
  return (
    <ReactFlowProvider>
      <GraphInnerProvider>{children}</GraphInnerProvider>
    </ReactFlowProvider>
  );
}
