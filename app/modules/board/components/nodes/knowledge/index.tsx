import {
  Handle,
  NodeResizeControl,
  Position,
  type NodeProps,
} from "@xyflow/react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { NODE_SIZES } from "~/modules/board/constants";
import {
  useReactiveBoardStore,
  useBoardStoreYDoc,
} from "~/modules/board/hooks/board.store";
import type { ExtraNode, KnowledgeNodeData } from "~/modules/board/types/nodes";
import { useEffect, useRef, useState } from "react";

const KnowledgehNode = ({ data, id, width, height }: NodeProps<ExtraNode>) => {
  const store = useReactiveBoardStore();
  const ydoc = useBoardStoreYDoc();
  const { content, title } = data as KnowledgeNodeData;
  const node = store.knowledges?.[id as string];

  // Local state for immediate updates
  const [dimensions, setDimensions] = useState({
    width: node?.width ?? NODE_SIZES.knowledge[0],
    height: node?.height ?? NODE_SIZES.knowledge[1],
  });

  // Ref for tracking debounce timeout
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  // Sync local state with store updates
  useEffect(() => {
    setDimensions({
      width: node?.width ?? NODE_SIZES.knowledge[0],
      height: node?.height ?? NODE_SIZES.knowledge[1],
    });
  }, [node?.width, node?.height]);

  // Cleanup timeout on unmount
  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  const remove = () => {
    const edgeIndex = store.edges.findIndex((edge) => edge.target === id);
    if (edgeIndex !== -1) {
      ydoc.transact(() => {
        delete store.edges[edgeIndex];
        delete store.knowledges[id as string];
      });
    }
  };

  if (!node) return null;

  const handleResize = (width: number, height: number) => {
    // Update local state immediately
    setDimensions({ width, height });

    // Clear previous timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Set new timeout for store update
    timeoutRef.current = setTimeout(() => {
      ydoc.transact(() => {
        node.width = width;
        node.height = height;
        console.log(`resize node ${id} to ${width}x${height}`);
      });
    }, 30);
  };

  return (
    <div
      className={`border-[#D8BFD8] relative knowledge bg-[#F7F1E5] p-2 border rounded-md overflow-y-auto no-drag nopan nowheel group`}
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
      }}
    >
      <span
        className="group-hover:visible top-1 right-2.5 absolute text-red-500 cursor-pointer invisible"
        onClick={() => remove()}
      >
        x
      </span>
      <Handle type="target" id={"right"} position={Position.Right} />
      <Handle type="source" id={"right"} position={Position.Right} />
      <Handle type="source" id={"left"} position={Position.Left} />
      <Handle type="target" id={"left"} position={Position.Left} />

      {title && <div className="font-semibold">{title}</div>}
      <Markdown
        className="knowledge-content markdown"
        remarkPlugins={[remarkParse, remarkGfm]}
        rehypePlugins={[remarkRehype]}
      >
        {content}
      </Markdown>

      <NodeResizeControl
        className="!top-[unset] !right-2 !bottom-2 !left-[unset] z-10 !absolute !bg-transparent"
        onResize={(_, params) => handleResize(params.width, params.height)}
      >
        <svg
          width="9"
          height="9"
          viewBox="0 0 9 9"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M7.5 1L1 7.5" stroke="#D8BFD8" />
          <path d="M8 5L5 8" stroke="#D8BFD8" />
        </svg>
      </NodeResizeControl>
    </div>
  );
};

export default KnowledgehNode;
