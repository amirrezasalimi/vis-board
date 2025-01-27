import type { Node } from "@xyflow/react";

export type NodeTypes = "branch" | "knowledge";

export interface MessageItem {
  role: "function" | "user" | "assistant" | "system" | "developer" | "tool";
  content?: string | null;
  timestamp?: number;
  took_seconds?: number;
  token_per_second?: number;
}

export interface BranchNodeData {
  title: string;
  messages: MessageItem[];
  [key: string]: unknown;
  linked?: boolean;
}

export interface KnowledgeNodeData {
  branchId: string;
  title: string | null;
  content: string;
  timestamp: number;
  took_seconds: number;
  token_per_second: number;
  [key: string]: unknown;
  parentId?: string;
  side: "left" | "right" | "top";
}

type NodeData = BranchNodeData | KnowledgeNodeData;

export type ExtraNode = Node<NodeData>;
