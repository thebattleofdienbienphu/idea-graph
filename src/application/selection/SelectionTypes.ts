export type SelectionType = 'node' | 'edge' | 'branch';

export interface SelectionItem {
  id: string;
  type: SelectionType;
}
