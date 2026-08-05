import { Command } from '../commands/Command';

export interface HistoryState {
  undoStack: readonly Command[];
  redoStack: readonly Command[];
}
