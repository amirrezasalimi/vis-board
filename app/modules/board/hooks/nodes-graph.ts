import dagre from "dagre";
import { NODE_SIZES } from "../constants";
import type { ExtraEdge } from "../types/edge";
import type { ExtraNode } from "../types/nodes";
interface CustomNode extends ExtraNode {
  type: keyof typeof NODE_SIZES;
}

// Configuration constants
const HORIZONTAL_SPACING = 64; // Distance between nodes horizontally
const VERTICAL_SPACING = 64; // Distance between nodes vertically

/**
 * Creates a horizontal layout for nodes and edges.
 * @param nodes - Array of nodes to position.
 * @param edges - Array of edges connecting nodes.
 * @returns Object containing positioned nodes.
 */
export const calcNodesPosition = (
  nodes: CustomNode[],
  edges: ExtraEdge[]
): { nodes: CustomNode[] } => {
  const positionedNodes: CustomNode[] = [];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const roots = nodes.filter((node) => node.type === "branch");

  for (const root of roots) {
    // Filter direct children for left and right sides
    const directLeftChildren = nodes.filter(
      (n) => n.data?.branch_id === root.id && n.data?.side === "left"
    );
    const directRightChildren = nodes.filter(
      (n) => n.data?.branch_id === root.id && n.data?.side === "right"
    );

    // Initialize Dagre graph
    const graph = new dagre.graphlib.Graph();
    graph.setGraph({
      rankdir: "LR", // Horizontal layout (Left-to-Right)
      nodesep: HORIZONTAL_SPACING,
      ranksep: VERTICAL_SPACING,
    });
    graph.setDefaultEdgeLabel(() => ({}));

    // Add root node to the graph
    const rootSize = NODE_SIZES.branch;
    graph.setNode(root.id, {
      width: rootSize[0],
      height: rootSize[1],
      node: root,
    });

    // Process nodes for a specific side (left or right)
    const processSide = (sideNodes: CustomNode[], side: "left" | "right") => {
      sideNodes.forEach((node) => {
        const default_size = NODE_SIZES[node.type];
        const nodeSize = {
          width: node.width || default_size[0],
          height: node.height || default_size[1],
        };
        graph.setNode(node.id, {
          width: nodeSize.width,
          height: nodeSize.height,
          node,
        });

        // Connect root to side nodes
        graph.setEdge(root.id, node.id, {
          weight: 1,
          labelpos: side === "left" ? "l" : "r",
        });
      });
    };

    // Process left and right sides
    processSide(directLeftChildren, "left");
    processSide(directRightChildren, "right");

    // Perform layout calculation
    dagre.layout(graph);

    // Position nodes based on layout
    graph.nodes().forEach((nodeId) => {
      const dagreNode = graph.node(nodeId);
      // @ts-ignore
      const originalNode = dagreNode.node;

      if (originalNode.id === root.id) {
        // Center the root node
        positionedNodes.push({
          ...originalNode,
          position: { x: 0, y: 0 },
        });
      } else {
        // Offset side nodes vertically
        const side = originalNode.data?.side;
        const x = dagreNode.x - dagreNode.width / 2 + 64;
        positionedNodes.push({
          ...originalNode,
          position: {
            x: side == "left" ? -x : x, // Center horizontally
            y: dagreNode.y - dagreNode.height / 2, // Add vertical offset
          },
        });
      }
    });
  }

  return { nodes: positionedNodes };
};
