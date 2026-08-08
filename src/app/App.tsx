import React, { useState, useMemo, useEffect } from 'react';
import { Workspace, Node as DomainNodeItem } from '../domain';
import { CommandManager, CreateNodeCommand, MoveNodeCommand, CreateEdgeCommand, DeleteNodeCommand, DeleteEdgeCommand, UpdateNodeCommand } from '../application/commands';
import { SelectionManager, SelectionState } from '../application/selection';
import { GraphProvider, useGraph } from '../graph/providers/GraphProvider';
import GraphCanvas from '../graph/components/GraphCanvas';
import { DomainNode as GraphDomainNode, DomainEdge as GraphDomainEdge } from '../graph/types/GraphTypes';
import { LocalStorageAdapter } from '../infrastructure/localstorage/LocalStorageAdapter';
import './App.css';

// ----------------------------------------------------
// PERSISTENCE — LocalStorage adapter (singleton)
// ----------------------------------------------------
const storage = new LocalStorageAdapter();

/** Fallback when no saved workspace exists. */
const emptyWorkspace: Workspace = {
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

/**
 * Synchronously load the workspace from localStorage.
 * We use the synchronous localStorage API directly here so the
 * lazy useState initializer can run without async/await.
 * Returns the saved workspace or the empty default.
 */
function loadOrDefault(): Workspace {
  try {
    const json = localStorage.getItem('idea-graph.workspace');
    if (json === null) return emptyWorkspace;
    const parsed = JSON.parse(json);
    if (
      typeof parsed !== 'object' ||
      typeof parsed.id !== 'string' ||
      typeof parsed.name !== 'string' ||
      !Array.isArray(parsed.branches) ||
      typeof parsed.activeBranchId !== 'string'
    ) {
      return emptyWorkspace;
    }
    return parsed as Workspace;
  } catch {
    return emptyWorkspace;
  }
}

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
  onNodeUpdate?: (nodeId: string, fields: { label?: string; content?: string }) => void;
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
  onNodeUpdate,
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
      onNodeUpdate={onNodeUpdate}
    />
  );
}

// ----------------------------------------------------
// COMPOSITION ROOT
// ----------------------------------------------------
export default function App(): React.JSX.Element {
  // 1. Core State
  // Lazy initializer runs once before the first render — loads from localStorage
  // without causing a flash of empty state.
  const [workspace, setWorkspace] = useState<Workspace>(loadOrDefault);
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

  // Auto-save: persist the workspace to localStorage on every change.
  // storage.saveWorkspace is async but we do not need to await it here —
  // localStorage writes are effectively synchronous and non-blocking.
  useEffect(() => {
    storage.saveWorkspace(workspace);
  }, [workspace]);

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
      data: { 
        label: n.title,
        content: n.content
      },
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

  const handleNodeUpdate = (nodeId: string, fields: { label?: string; content?: string }) => {
    if (!activeBranch) return;
    commandManager.execute(
      new UpdateNodeCommand(activeBranch.id, nodeId, {
        ...(fields.label !== undefined ? { title: fields.label } : {}),
        ...(fields.content !== undefined ? { content: fields.content } : {}),
      })
    );
  };

  const handleSaveWorkspace = async () => {
    try {
      const exportData = {
        format: 'idea-graph',
        version: 1,
        workspace,
      };
      const jsonContent = JSON.stringify(exportData, null, 2);

      const anyWindow = window as any;
      if (anyWindow.showSaveFilePicker) {
        try {
          const handle = await anyWindow.showSaveFilePicker({
            suggestedName: `${workspace.name.toLowerCase().replace(/\s+/g, '_')}.ideagraph`,
            types: [
              {
                description: 'Idea Graph Files (*.ideagraph)',
                accept: {
                  'application/json': ['.ideagraph'],
                },
              },
            ],
          });
          const writable = await handle.createWritable();
          await writable.write(jsonContent);
          await writable.close();
          return;
        } catch (err: any) {
          if (err.name === 'AbortError') return;
          throw err;
        }
      }

      // Fallback for browsers without File System Access API
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${workspace.name.toLowerCase().replace(/\s+/g, '_')}.ideagraph`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Failed to save workspace file: ${err.message}`);
    }
  };

  const handleLoadWorkspace = async () => {
    try {
      const anyWindow = window as any;
      let textContent: string = '';

      if (anyWindow.showOpenFilePicker) {
        try {
          const [handle] = await anyWindow.showOpenFilePicker({
            types: [
              {
                description: 'Idea Graph Files (*.ideagraph)',
                accept: {
                  'application/json': ['.ideagraph'],
                },
              },
            ],
          });
          const file = await handle.getFile();
          textContent = await file.text();
        } catch (err: any) {
          if (err.name === 'AbortError') return;
          throw err;
        }
      } else {
        // Fallback for browsers without File System Access API
        textContent = await new Promise<string>((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.ideagraph';
          input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (!file) {
              reject(new Error('No file selected'));
              return;
            }
            try {
              const text = await file.text();
              resolve(text);
            } catch (err) {
              reject(err);
            }
          };
          input.click();
        });
      }

      const parsed = JSON.parse(textContent);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('File root must be a valid JSON object.');
      }
      if (parsed.format !== 'idea-graph') {
        throw new Error(`Unsupported format identifier: expected 'idea-graph' but got '${parsed.format || 'none'}'.`);
      }
      if (parsed.version !== 1) {
        throw new Error(`Unsupported format version: only version 1 is supported, but the file is version ${parsed.version}.`);
      }

      const ws = parsed.workspace;
      if (
        typeof ws !== 'object' ||
        ws === null ||
        typeof ws.id !== 'string' ||
        typeof ws.name !== 'string' ||
        !Array.isArray(ws.branches) ||
        typeof ws.activeBranchId !== 'string'
      ) {
        throw new Error('Invalid workspace data structure inside the file.');
      }

      // Check branches structure
      for (const branch of ws.branches) {
        if (
          typeof branch !== 'object' ||
          branch === null ||
          typeof branch.id !== 'string' ||
          typeof branch.name !== 'string' ||
          !Array.isArray(branch.nodes) ||
          !Array.isArray(branch.edges)
        ) {
          throw new Error('Corrupted branch data inside the workspace.');
        }
      }

      // Replace workspace
      commandManager.resetWorkspace(ws);
      selectionManager.clear();
    } catch (err: any) {
      alert(`Failed to load workspace file:\n${err.message}`);
    }
  };

  const selectedNode = useMemo(() => {
    if (!activeBranch || selection.selectedNodes.length !== 1) return null;
    const selectedId = selection.selectedNodes[0];
    return activeBranch.nodes.find((n) => n.id === selectedId) || null;
  }, [activeBranch, selection.selectedNodes]);

  return (
    <div className="app-container">
      {/* FLOATING TITLE */}
      <div className="app-title-floating">idea-graph</div>

      {/* FLOATING WORKSPACE MENU */}
      <div className="workspace-menu">
        <div className="workspace-menu-content">
          <button className="btn-secondary menu-item" onClick={handleSaveWorkspace}>
            Save Workspace
          </button>
          <button className="btn-secondary menu-item" onClick={handleLoadWorkspace}>
            Load Workspace
          </button>
        </div>
        <button className="workspace-menu-trigger btn-primary">
          Workspace
        </button>
      </div>

      {/* MINIMAL CANVAS LAYOUT */}
      <div className="main-layout" style={{ height: '100vh' }}>
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
              onNodeUpdate={handleNodeUpdate}
            />
          </GraphProvider>
        </main>

        {/* RIGHT SIDEBAR */}
        {selectedNode && (
          <aside className="sidebar-right">
            <div className="sidebar-section">
              <h3>Edit Node</h3>
              <div className="form-group">
                <label htmlFor="node-title">Title</label>
                <input
                  id="node-title"
                  type="text"
                  className="form-input"
                  value={selectedNode.title}
                  onChange={(e) => {
                    commandManager.execute(
                      new UpdateNodeCommand(activeBranch!.id, selectedNode.id, {
                        title: e.target.value,
                      })
                    );
                  }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="node-content">Content</label>
                <textarea
                  id="node-content"
                  className="form-textarea"
                  value={selectedNode.content}
                  onChange={(e) => {
                    commandManager.execute(
                      new UpdateNodeCommand(activeBranch!.id, selectedNode.id, {
                        content: e.target.value,
                      })
                    );
                  }}
                />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
