import type { Node } from "@xyflow/react";

export type NodeTypes = "branch" | "knowledge";

export interface MessageItem {
  id: string;
  role: "function" | "user" | "assistant" | "system" | "developer" | "tool";
  content?: string | null;
  timestamp?: number;
  took_seconds?: number;
  token_per_second?: number;
  followups?: string[];
}

export interface BranchNodeData {
  parent_branch_id?: string;
  title: string;
  messages: MessageItem[];
  [key: string]: unknown;
  bg_color?: string;
}

export interface KnowledgeNodeData {
  branch_id: string;
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
