import { createContext, useContext } from 'react';

/**
 * Context for passing node update callback from the App layer
 * into custom node components without violating architecture boundaries.
 * This is UI-layer only — no Domain knowledge.
 */
export interface NodeCallbackContextType {
  onNodeUpdate: (nodeId: string, fields: { label?: string; content?: string }) => void;
}

export const NodeCallbackContext = createContext<NodeCallbackContextType>({
  onNodeUpdate: () => {},
});

export function useNodeCallback(): NodeCallbackContextType {
  return useContext(NodeCallbackContext);
}
