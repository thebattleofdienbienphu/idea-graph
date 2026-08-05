import { Node as RFNode, Edge as RFEdge, MarkerType } from '@xyflow/react';
import { DomainNode, DomainEdge } from '../types/GraphTypes';

export class ReactFlowAdapter {
  public static toReactFlowNode(domainNode: DomainNode): RFNode {
    return {
      id: domainNode.id,
      type: domainNode.type || 'default',
      position: { ...domainNode.position },
      data: { ...domainNode.data },
      selected: domainNode.selected,
      selectable: true,
      deletable: true,
    };
  }

  public static toReactFlowEdge(domainEdge: DomainEdge): RFEdge {
    return {
      id: domainEdge.id,
      source: domainEdge.source,
      target: domainEdge.target,
      type: domainEdge.type || 'default',
      data: domainEdge.data ? { ...domainEdge.data } : undefined,
      selected: domainEdge.selected,
      selectable: true,
      deletable: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    };
  }

  public static toDomainNode(rfNode: RFNode): DomainNode {
    return {
      id: rfNode.id,
      type: rfNode.type,
      position: { ...rfNode.position },
      data: { ...rfNode.data },
    };
  }

  public static toDomainEdge(rfEdge: RFEdge): DomainEdge {
    return {
      id: rfEdge.id,
      source: rfEdge.source,
      target: rfEdge.target,
      type: rfEdge.type,
      data: rfEdge.data ? { ...rfEdge.data } : undefined,
    };
  }
}
