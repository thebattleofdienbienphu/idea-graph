import { Command } from '../commands/Command';
import { HistoryState } from './HistoryState';

export class HistoryStack {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  public pushUndo(command: Command): void {
    this.undoStack.push(command);
  }

  public popUndo(): Command | undefined {
    return this.undoStack.pop();
  }

  public pushRedo(command: Command): void {
    this.redoStack.push(command);
  }

  public popRedo(): Command | undefined {
    return this.redoStack.pop();
  }

  public clearRedo(): void {
    this.redoStack = [];
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public getUndoCount(): number {
    return this.undoStack.length;
  }

  public getRedoCount(): number {
    return this.redoStack.length;
  }

  public getStateSnapshot(): HistoryState {
    return {
      undoStack: [...this.undoStack],
      redoStack: [...this.redoStack],
    };
  }
}
