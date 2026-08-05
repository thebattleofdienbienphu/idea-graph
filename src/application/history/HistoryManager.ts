import { Command } from '../commands/Command';
import { CommandManager } from '../commands/CommandManager';
import { HistoryStack } from './HistoryStack';

export class HistoryManager {
  private readonly commandManager: CommandManager;
  private readonly stack: HistoryStack;

  constructor(commandManager: CommandManager) {
    this.commandManager = commandManager;
    this.stack = new HistoryStack();
  }

  public execute(command: Command): void {
    this.commandManager.execute(command);
    this.stack.pushUndo(command);
    this.stack.clearRedo();
  }

  public undo(): void {
    if (!this.stack.canUndo()) return;
    const command = this.stack.popUndo();
    if (command) {
      this.commandManager.undo(command);
      this.stack.pushRedo(command);
    }
  }

  public redo(): void {
    if (!this.stack.canRedo()) return;
    const command = this.stack.popRedo();
    if (command) {
      this.commandManager.execute(command);
      this.stack.pushUndo(command);
    }
  }

  public canUndo(): boolean {
    return this.stack.canUndo();
  }

  public canRedo(): boolean {
    return this.stack.canRedo();
  }

  public clear(): void {
    this.stack.clear();
  }

  public getUndoCount(): number {
    return this.stack.getUndoCount();
  }

  public getRedoCount(): number {
    return this.stack.getRedoCount();
  }
}
