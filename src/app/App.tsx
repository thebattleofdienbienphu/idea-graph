import React, { useState, useMemo, useEffect } from 'react';
import { Workspace, Node as DomainNodeItem } from '../domain';
import { CommandManager, CreateNodeCommand, MoveNodeCommand, CreateEdgeCommand, DeleteNodeCommand, DeleteEdgeCommand } from '../application/commands';
import { SelectionManager, SelectionState } from '../application/selection';
import { GraphProvider, useGraph } from '../graph/providers/GraphProvider';
import GraphCanvas from '../graph/components/GraphCanvas';
import { DomainNode as GraphDomainNode, DomainEdge as GraphDomainEdge } from '../graph/types/GraphTypes';
import './App.css';

// ----------------------------------------------------
// INITIAL WORKSPACE FIXTURE (Empty graph at startup)
// ----------------------------------------------------
const initialWorkspace: Workspace = {
  id: 'ws-1',
  name: 'Workspace 1',
  branches: [
    {
      id: 'branch-main',
      name: 'Main',
      nodes: [],
      edges: [],
    },
  ],
  activeBranchId: 'branch-main',
};

// ----------------------------------------------------
// GRAPH CONTROLLER SUB-COMPONENT
// Syncs domain data with the Graph rendering layer
// ----------------------------------------------------
interface GraphControllerProps {
  graphNodes: GraphDomainNode[];
  graphEdges: GraphDomainEdge[];
  onPaneDoubleClick?: (x: number, y: number) => void;
  onNodeDragStop?: (nodeId: string, position: { x: number; y: number }) => void;
  onConnect?: (source: string, target: string) => void;
  onNodesDelete?: (nodeIds: string[]) => void;
  onEdgesDelete?: (edgeIds: string[]) => void;
  onSelectionChange?: (selectedNodes: string[], selectedEdges: string[]) => void;
}

function GraphController({
  graphNodes,
  graphEdges,
  onPaneDoubleClick,
  onNodeDragStop,
  onConnect,
  onNodesDelete,
  onEdgesDelete,
  onSelectionChange,
}: GraphControllerProps) {
  const { renderGraph } = useGraph();

  useEffect(() => {
    renderGraph(graphNodes, graphEdges);
  }, [graphNodes, graphEdges, renderGraph]);

  return (
    <GraphCanvas
      onPaneDoubleClick={onPaneDoubleClick}
      onNodeDragStop={onNodeDragStop}
      onConnect={onConnect}
      onNodesDelete={onNodesDelete}
      onEdgesDelete={onEdgesDelete}
      onSelectionChange={onSelectionChange}
    />
  );
}

// ----------------------------------------------------
// COMPOSITION ROOT
// ----------------------------------------------------
export default function App(): React.JSX.Element {
  // 1. Core State
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);
  const [selection, setSelection] = useState<SelectionState>({
    selectedNodes: [],
    selectedEdges: [],
    selectedBranches: [],
  });

  // 3. Application Command Manager Instantiation (Constructor DI)
  const commandManager = useMemo(() => {
    return new CommandManager(workspace, (next) => {
      setWorkspace(next);
    });
  }, []);

  // 3.1. Application Selection Manager Instantiation (Constructor DI)
  const selectionManager = useMemo(() => {
    return new SelectionManager(selection, (next) => {
      setSelection(next);
    });
  }, []);

  // Sync state reference inside CommandManager in case workspace updates
  useEffect(() => {
    if (commandManager.getWorkspace() !== workspace) {
      commandManager.resetWorkspace(workspace);
    }
  }, [workspace, commandManager]);

  // 4. Application Query Engine Setup for current active branch
  const activeBranch = useMemo(() => {
    return workspace.branches.find((b) => b.id === workspace.activeBranchId) || null;
  }, [workspace]);

  // 5. Adapt Domain structures to Graph contract structures (Adapter Pattern)
  const graphNodes = useMemo((): GraphDomainNode[] => {
    if (!activeBranch) return [];
    return activeBranch.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: {
        x: typeof n.properties.x === 'number' ? n.properties.x : 0,
        y: typeof n.properties.y === 'number' ? n.properties.y : 0,
      },
      data: { label: n.title },
      selected: selection.selectedNodes.includes(n.id),
    }));
  }, [activeBranch, selection.selectedNodes]);

  const graphEdges = useMemo((): GraphDomainEdge[] => {
    if (!activeBranch) return [];
    return activeBranch.edges.map((e) => ({
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      type: e.type,
      selected: selection.selectedEdges.includes(e.id),
    }));
  }, [activeBranch, selection.selectedEdges]);

  const handlePaneDoubleClick = (x: number, y: number) => {
    if (!activeBranch) return;
    const nodeId = `n-${Math.floor(Math.random() * 1000000)}`;
    const newNode: DomainNodeItem = {
      id: nodeId,
      title: 'New Node',
      content: '# New Node\nDescription here.',
      type: 'default',
      properties: { x, y },
    };
    commandManager.execute(new CreateNodeCommand(activeBranch.id, newNode));
  };

  const handleNodeDragStop = (nodeId: string, position: { x: number; y: number }) => {
    if (!activeBranch) return;
    commandManager.execute(new MoveNodeCommand(activeBranch.id, nodeId, position));
  };

  const handleConnect = (source: string, target: string) => {
    if (!activeBranch) return;

    // 1. Prevent self-connections
    if (source === target) {
      console.warn('Prevented self-connection');
      return;
    }

    // 2. Prevent duplicate Edges between same source and target
    const duplicateExists = activeBranch.edges.some(
      (e) => e.sourceNodeId === source && e.targetNodeId === target
    );
    if (duplicateExists) {
      console.warn('Connection already exists');
      return;
    }

    // 3. Verify nodes exist in branch
    const sourceExists = activeBranch.nodes.some((n) => n.id === source);
    const targetExists = activeBranch.nodes.some((n) => n.id === target);
    if (!sourceExists || !targetExists) {
      console.warn('Source or Target node does not exist in branch');
      return;
    }

    const edgeId = `e-${Math.floor(Math.random() * 1000000)}`;
    const newEdge = {
      id: edgeId,
      sourceNodeId: source,
      targetNodeId: target,
      type: 'default',
      properties: {},
    };

    commandManager.execute(new CreateEdgeCommand(activeBranch.id, newEdge));
  };

  const handleNodesDelete = (nodeIds: string[]) => {
    if (!activeBranch) return;
    nodeIds.forEach((id) => {
      commandManager.execute(new DeleteNodeCommand(activeBranch.id, id));
    });
    selectionManager.clear();
  };

  const handleEdgesDelete = (edgeIds: string[]) => {
    if (!activeBranch) return;
    edgeIds.forEach((id) => {
      commandManager.execute(new DeleteEdgeCommand(activeBranch.id, id));
    });
    selectionManager.clear();
  };

  const handleSelectionChange = (nodeIds: string[], edgeIds: string[]) => {
    const nodesEqual =
      selection.selectedNodes.length === nodeIds.length &&
      selection.selectedNodes.every((id) => nodeIds.includes(id));
    const edgesEqual =
      selection.selectedEdges.length === edgeIds.length &&
      selection.selectedEdges.every((id) => edgeIds.includes(id));

    if (nodesEqual && edgesEqual) {
      return;
    }

    selectionManager.updateState({
      selectedNodes: nodeIds,
      selectedEdges: edgeIds,
      selectedBranches: [],
    });
  };

  return (
    <div className="app-container">
      {/* HEADER SECTION */}
      <header className="app-header">
        <div className="app-logo">
          <h1>idea-graph</h1>
          <span>blender node style</span>
        </div>
      </header>

      {/* MINIMAL CANVAS LAYOUT */}
      <div className="main-layout" style={{ height: 'calc(100vh - 60px)' }}>
        <main className="canvas-area" style={{ flex: 1 }}>
          <GraphProvider>
            <GraphController
              graphNodes={graphNodes}
              graphEdges={graphEdges}
              onPaneDoubleClick={handlePaneDoubleClick}
              onNodeDragStop={handleNodeDragStop}
              onConnect={handleConnect}
              onNodesDelete={handleNodesDelete}
              onEdgesDelete={handleEdgesDelete}
              onSelectionChange={handleSelectionChange}
            />
          </GraphProvider>
        </main>
      </div>
    </div>
  );
}
