import { ReactFlow, type EdgeTypes, type NodeTypes } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import BranchNode from "../nodes/branch";
import KnowledgehNode from "../nodes/knowledge";
import { useReactiveBoardStore } from "../../hooks/board.store";
import type { ExtraNode } from "../../types/nodes";
import { calcNodesPosition } from "../../hooks/nodes-graph";
import type { ExtraEdge } from "../../types/edge";
import VisEdge from "../edge";

const nodeTypes: NodeTypes = {
  branch: BranchNode,
  knowledge: KnowledgehNode,
};

const nodeEdges: EdgeTypes = {
  default: VisEdge,
};
const BoardCanvas = () => {
  const { branches, knowledges, edges } = useReactiveBoardStore();
  const flatNodes = [
    ...(Object.values(branches) as ExtraNode[]),
    ...(Object.values(knowledges) as ExtraNode[]),
  ];
  const flatEdges = [...(Object.values(edges) as ExtraEdge[])];

  const g = calcNodesPosition(flatNodes as any, flatEdges);

  return (
    <div className="z-0 absolute size-full">
      <ReactFlow
        nodeTypes={nodeTypes}
        edgeTypes={nodeEdges}
        fitView
        minZoom={0.5}
        maxZoom={1}
        nodes={g.nodes ?? []}
        edges={flatEdges}
      />
    </div>
  );
};

export default BoardCanvas;
