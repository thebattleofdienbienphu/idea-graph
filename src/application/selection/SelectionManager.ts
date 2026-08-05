import { SelectionState } from './SelectionState';

export class SelectionManager {
  private state: SelectionState;
  private readonly onSelectionChange?: (state: SelectionState) => void;

  constructor(initialState?: SelectionState, onSelectionChange?: (state: SelectionState) => void) {
    this.state = initialState || {
      selectedNodes: [],
      selectedEdges: [],
      selectedBranches: [],
    };
    this.onSelectionChange = onSelectionChange;
  }

  public getState(): SelectionState {
    return this.state;
  }

  public updateState(newState: SelectionState): void {
    this.state = newState;
    if (this.onSelectionChange) {
      this.onSelectionChange(newState);
    }
  }

  public selectNode(nodeId: string): void {
    this.updateState({
      selectedNodes: [nodeId],
      selectedEdges: [],
      selectedBranches: [],
    });
  }

  public selectEdge(edgeId: string): void {
    this.updateState({
      selectedNodes: [],
      selectedEdges: [edgeId],
      selectedBranches: [],
    });
  }

  public selectBranch(branchId: string): void {
    this.updateState({
      selectedNodes: [],
      selectedEdges: [],
      selectedBranches: [branchId],
    });
  }

  public addNode(nodeId: string): void {
    if (this.state.selectedNodes.includes(nodeId)) return;
    this.updateState({
      ...this.state,
      selectedNodes: [...this.state.selectedNodes, nodeId],
    });
  }

  public addEdge(edgeId: string): void {
    if (this.state.selectedEdges.includes(edgeId)) return;
    this.updateState({
      ...this.state,
      selectedEdges: [...this.state.selectedEdges, edgeId],
    });
  }

  public addBranch(branchId: string): void {
    if (this.state.selectedBranches.includes(branchId)) return;
    this.updateState({
      ...this.state,
      selectedBranches: [...this.state.selectedBranches, branchId],
    });
  }

  public removeNode(nodeId: string): void {
    if (!this.state.selectedNodes.includes(nodeId)) return;
    this.updateState({
      ...this.state,
      selectedNodes: this.state.selectedNodes.filter((id) => id !== nodeId),
    });
  }

  public removeEdge(edgeId: string): void {
    if (!this.state.selectedEdges.includes(edgeId)) return;
    this.updateState({
      ...this.state,
      selectedEdges: this.state.selectedEdges.filter((id) => id !== edgeId),
    });
  }

  public removeBranch(branchId: string): void {
    if (!this.state.selectedBranches.includes(branchId)) return;
    this.updateState({
      ...this.state,
      selectedBranches: this.state.selectedBranches.filter((id) => id !== branchId),
    });
  }

  public toggleNode(nodeId: string): void {
    if (this.state.selectedNodes.includes(nodeId)) {
      this.removeNode(nodeId);
    } else {
      this.addNode(nodeId);
    }
  }

  public toggleEdge(edgeId: string): void {
    if (this.state.selectedEdges.includes(edgeId)) {
      this.removeEdge(edgeId);
    } else {
      this.addEdge(edgeId);
    }
  }

  public toggleBranch(branchId: string): void {
    if (this.state.selectedBranches.includes(branchId)) {
      this.removeBranch(branchId);
    } else {
      this.addBranch(branchId);
    }
  }

  public clear(): void {
    this.updateState({
      selectedNodes: [],
      selectedEdges: [],
      selectedBranches: [],
    });
  }

  public isSelected(id: string): boolean {
    return (
      this.state.selectedNodes.includes(id) ||
      this.state.selectedEdges.includes(id) ||
      this.state.selectedBranches.includes(id)
    );
  }

  public getSelection(): SelectionState {
    return this.state;
  }

  public getSelectionCount(): number {
    return (
      this.state.selectedNodes.length +
      this.state.selectedEdges.length +
      this.state.selectedBranches.length
    );
  }
}
