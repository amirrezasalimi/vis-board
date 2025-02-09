import dagre from "dagre";
import { NODE_SIZES } from "../constants";
import type { ExtraEdge } from "../types/edge";
import type { ExtraNode } from "../types/nodes";

interface CustomNode extends ExtraNode {
  type: keyof typeof NODE_SIZES;
}

const HORIZONTAL_SPACING = 64;
const VERTICAL_SPACING = 24;

/**
 * Lays out branch nodes (root) and their direct branch children via dagre,
 * then positions “knowledge” children (nodes with data.parent_id) horizontally.
 */
export const calcNodesPosition = (
  nodes: CustomNode[],
  edges: ExtraEdge[]
): { nodes: CustomNode[] } => {
  const positionedNodes: CustomNode[] = [];

  // Process each branch node as a root.
  const roots = nodes.filter((n) => n.type === "branch");
  for (const root of roots) {
    // Build a dagre graph for the branch (root) and its direct children.
    const graph = new dagre.graphlib.Graph();
    graph.setGraph({
      rankdir: "LR",
      nodesep: HORIZONTAL_SPACING,
      ranksep: VERTICAL_SPACING,
    });
    graph.setDefaultEdgeLabel(() => ({}));

    // Add the branch node (centered at (0,0)).
    const [rootW, rootH] = NODE_SIZES.branch;
    graph.setNode(root.id, { width: rootW, height: rootH, node: root });

    // For each side, add direct branch children (filtered by branch_id and side).
    const processSide = (side: "left" | "right") => {
      const sideNodes = nodes.filter(
        (n) => n.data?.branch_id === root.id && n.data?.side === side
      );
      sideNodes.forEach((child) => {
        const [cw, ch] = NODE_SIZES[child.type] || [0, 0];
        const width = child.width || cw;
        const height = child.height || ch;
        graph.setNode(child.id, { width, height, node: child });
        graph.setEdge(root.id, child.id, {
          weight: 1,
          labelpos: side === "left" ? "l" : "r",
        });
      });
    };
    processSide("left");
    processSide("right");

    dagre.layout(graph);

    // Save dagre positions for the branch and its direct children.
    const dagrePositions = new Map<string, { x: number; y: number }>();
    graph.nodes().forEach((id) => {
      const dagNode = graph.node(id);
      if (dagNode.node.id === root.id) {
        dagrePositions.set(id, { x: 0, y: 0 });
      } else {
        // Offset computed x by subtracting half width and adding spacing.
        const baseX = dagNode.x - dagNode.width / 2 + HORIZONTAL_SPACING;
        // Flip left–side nodes.
        const finalX = dagNode.node.data?.side === "left" ? -baseX : baseX;
        dagrePositions.set(id, {
          x: finalX,
          y: dagNode.y - dagNode.height / 2,
        });
      }
    });

    dagrePositions.forEach((pos, id) => {
      const n = graph.node(id).node;
      positionedNodes.push({ ...n, position: pos });
    });

    // For any node attached via parent_id (knowledge nodes), override dagre’s layout.
    // They will be arranged in a horizontal row relative to their parent.
    const positionKnowledgeChildren = (parent: CustomNode) => {
      const children = nodes.filter((n) => n.data?.parent_id === parent.id);
      if (!children.length) return;
      // Get parent’s already assigned position.
      const parentPos = positionedNodes.find(
        (n) => n.id === parent.id
      )?.position;
      if (!parentPos) return;
      // Use the parent's side (if set) or default to "right".
      const side: "left" | "right" = parent.data?.side || "right";
      // Compute total width for all children.
      let totalWidth = 0;
      const childrenSizes = children.map((child) => {
        const [cw, ch] = NODE_SIZES[child.type] || [0, 0];
        const width = child.width || cw;
        totalWidth += width;
        return { child, width, height: child.height || ch };
      });
      totalWidth += (children.length - 1) * HORIZONTAL_SPACING;
      // Starting x: for right side, children begin to the right of parent's boundary;
      // for left side, they extend to the left.
      let startX: number;
      const parentWidth = parent.width || NODE_SIZES[parent.type][0];
      if (side === "right") {
        startX = parentPos.x + parentWidth / 2 + HORIZONTAL_SPACING;
      } else {
        startX =
          parentPos.x - parentWidth / 2 - HORIZONTAL_SPACING - totalWidth;
      }
      for (const { child, width, height } of childrenSizes) {
        const childPos = {
          x: startX + width / 2,
          y: parentPos.y, // align with parent's vertical center
        };
        positionedNodes.push({ ...child, position: childPos });
        startX += width + HORIZONTAL_SPACING;
        // Recursively position any further knowledge children.
        positionKnowledgeChildren(child);
      }
    };

    // For each branch child, position its knowledge subtree.
    const branchChildren = nodes.filter((n) => n.data?.branch_id === root.id);
    branchChildren.forEach((child) => positionKnowledgeChildren(child));
  }

  return { nodes: positionedNodes };
};
