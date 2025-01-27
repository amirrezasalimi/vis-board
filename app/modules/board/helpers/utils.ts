import type { Node } from "@xyflow/react";
import type { BranchNodeData, KnowledgeNodeData } from "../types/nodes";
import { NODE_SIZES } from "../constants";

export const calcNewknowledgePosition = ({
  branch,
  knowledges,
  parentId,
}: {
  branch: Node<BranchNodeData>;
  knowledges: Node<KnowledgeNodeData>[];
  parentId?: string | null;
}) => {
  const pos = {
    x: 0,
    y: 0,
  };
  const space = 64;

  const branchPos = branch.position;
  const parent = parentId && knowledges.find((node) => node.id === parentId);
  if (parent) {
    const parentPos = parent.position;
    //
    const is_right = parentPos.x > branchPos.x;
    if (is_right) {
      pos.x = parentPos.x;
    } else {
      pos.x = parentPos.x - space - NODE_SIZES.knowledge[0];
    }
    const siblings = knowledges.filter(
      (node) => node.data.parentId === parentId
    );
    const sortedSiblings = siblings.sort((a, b) => {
      // by time
      return b.data.timestamp - a.data.timestamp;
    });
    const lastSibling = sortedSiblings[0];
    if (lastSibling) {
      pos.y = lastSibling.position.y + NODE_SIZES.knowledge[1] + space;
    } else {
      pos.y = branchPos.y + parentPos.y + space;
    }
  } else {
    const branchWidth = 500;
    const branchPos = branch.position;

    const right_side = Math.random() > 0.5;
    if (right_side) {
      pos.x = branchPos.x + branchWidth + space;
    } else {
      pos.x = branchPos.x - space - NODE_SIZES.knowledge[0];
    }
    const branchSingleKnowledges = knowledges.filter(
      (node) => !node.data.parentId
    );
    const sortedBranches = branchSingleKnowledges.sort((a, b) => {
      // by time
      return b.data.timestamp - a.data.timestamp;
    });
    const lastBranch = sortedBranches[0];

    pos.y = branchPos.y;

    if (lastBranch) {
      pos.y += lastBranch.position.y + NODE_SIZES.knowledge[1] + space;
    }
  }
  const is_right = pos.x > branchPos.x;

  return {
    is_right,
    pos,
  };
};
