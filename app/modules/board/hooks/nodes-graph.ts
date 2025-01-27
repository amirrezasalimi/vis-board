import type { Edge, Node } from "@xyflow/react";
import { flextree } from "d3-flextree";
import { NODE_SIZES } from "../constants";
import type { ExtraNode } from "../types/nodes";
import type { ExtraEdge } from "../types/edge";

interface CustomNode extends ExtraNode {
  type: keyof typeof NODE_SIZES;
}

function convertToNestedFormat(
  nodes: CustomNode[],
  edges: Edge[],
  rootNodeId: string
) {
  // Create a map for quick lookup of nodes by their id
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  // Create a map to store children of each node
  const childrenMap = new Map();

  // Populate the childrenMap
  edges.forEach((edge) => {
    const parentId = edge.source;
    const childId = edge.target;

    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }

    childrenMap.get(parentId).push(childId);
  });

  // Find the root node(s) - nodes with no incoming edges
  const rootNodes = nodes.filter(
    (node) => !edges.some((edge) => edge.target === node.id)
  );

  // Recursive function to build the nested structure
  const buildNestedStructure = (nodeId: string) => {
    const node = nodeMap.get(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }
    const size = NODE_SIZES[node.type];
    const nestedNode = {
      size, // Assuming width and height are properties of the node
      id: node.id, // Include the id if needed
      children: [],
      full_node: node,
    };

    if (childrenMap.has(nodeId)) {
      nestedNode.children = childrenMap
        .get(nodeId)
        .map((childId: string) => buildNestedStructure(childId));
    }

    return nestedNode;
  };

  // Build the nested structure starting from the root nodes
  const nestedStructure = rootNodes.map((rootNode) =>
    buildNestedStructure(rootNode.id)
  );

  // If there's only one root node, return it directly, otherwise return the array
  return nestedStructure.length === 1 ? nestedStructure[0] : nestedStructure;
}

export const calcNodesPosition = (
  nodes: CustomNode[],
  edges: ExtraEdge[]
): { nodes: CustomNode[] } => {
  const positionedNodes: CustomNode[] = [];

  const roots = nodes.filter((node) => node.type == "branch");

  for (const root of roots) {
    const children = nodes.filter(
      (node) => node.type == "knowledge" || node.data?.branchId == root.id
    );
    const relatedEdges = edges.filter((edge) => edge.data?.branchId == root.id);

    const leftNodes = children.filter((node) => node.data.side == "left");
    const rightNodes = children.filter((node) => node.data.side == "right");

    if (!leftNodes.length && !rightNodes.length) {
      positionedNodes.push({
        ...root,
        position: {
          x: 0,
          y: 0,
        },
      });
      continue;
    }
    const allNodes = [root, ...leftNodes, ...rightNodes];

    const layout = flextree({
      spacing: 0,
    });
    const nestedFormat = convertToNestedFormat(allNodes, relatedEdges, "");
    const tree = layout.hierarchy(nestedFormat);
    layout(tree);

    for (const node of tree.nodes) {
      if (node.data) {
        // @ts-ignore
        const data = node.data.full_node as CustomNode;
        positionedNodes.push({
          ...data,
          position: {
            x: data.data.side == "left" ? -node.y : node.y,
            y: node.x,
          },
        });
      }
    }
  }

  return { nodes: positionedNodes };
};
