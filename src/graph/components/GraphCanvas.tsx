import React from 'react';
import { ReactFlow, Background, Controls, useReactFlow } from '@xyflow/react';
import { useGraph } from '../providers/GraphProvider';
import '@xyflow/react/dist/style.css';

export default function GraphCanvas({
  onNodeClick,
  onEdgeClick,
  onPaneClick,
  onNodeDragStop,
  onPaneDoubleClick,
  onConnect,
  onNodesDelete,
  onEdgesDelete,
  onSelectionChange,
}: {
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
  onPaneClick?: () => void;
  onNodeDragStop?: (nodeId: string, position: { x: number; y: number }) => void;
  onPaneDoubleClick?: (x: number, y: number) => void;
  onConnect?: (source: string, target: string) => void;
  onNodesDelete?: (nodeIds: string[]) => void;
  onEdgesDelete?: (edgeIds: string[]) => void;
  onSelectionChange?: (selectedNodes: string[], selectedEdges: string[]) => void;
}): React.JSX.Element {
  const { nodes, edges, onNodesChange, onEdgesChange } = useGraph();
  const { screenToFlowPosition } = useReactFlow();

  const handleDoubleClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const isExcluded = target.closest('.react-flow__node') !== null ||
                       target.closest('.react-flow__edge') !== null ||
                       target.closest('.react-flow__controls') !== null ||
                       target.closest('.react-flow__attribution') !== null;

    if (!isExcluded && onPaneDoubleClick) {
      const flowPos = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      onPaneDoubleClick(flowPos.x, flowPos.y);
    }
  };

  return (
    <div
      style={{ width: '100%', height: '100%', minHeight: '500px' }}
      onDoubleClick={handleDoubleClick}
    >
      <ReactFlow
        className="dark"
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick ? (_, node) => onNodeClick(node.id) : undefined}
        onEdgeClick={onEdgeClick ? (_, edge) => onEdgeClick(edge.id) : undefined}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop ? (_, node) => onNodeDragStop(node.id, node.position) : undefined}
        onConnect={onConnect ? (conn) => onConnect(conn.source, conn.target) : undefined}
        onNodesDelete={onNodesDelete ? (deleted) => onNodesDelete(deleted.map((n) => n.id)) : undefined}
        onEdgesDelete={onEdgesDelete ? (deleted) => onEdgesDelete(deleted.map((e) => e.id)) : undefined}
        onSelectionChange={onSelectionChange ? ({ nodes: selNodes, edges: selEdges }) => onSelectionChange(selNodes.map((n) => n.id), selEdges.map((e) => e.id)) : undefined}
        zoomOnDoubleClick={false}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
