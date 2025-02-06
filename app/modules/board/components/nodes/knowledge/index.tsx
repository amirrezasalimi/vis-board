import { NodeResizeControl, Position, type NodeProps } from "@xyflow/react";
import { NODE_SIZES } from "~/modules/board/constants";
import {
  useReactiveBoardStore,
  useBoardStoreYDoc,
} from "~/modules/board/hooks/board.store";
import type { ExtraNode, KnowledgeNodeData } from "~/modules/board/types/nodes";
import { useEffect, useRef, useState } from "react";
import NiceHandle from "../nice-handle";

const KnowledgehNode = ({ data, id, width, height }: NodeProps<ExtraNode>) => {
  const [isHovering, setIsHovering] = useState(false);
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
      });
    }, 300);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
      }}
    >
      <div
        className={`border-[#D8BFD8] size-full flex flex-col knowledge relative bg-[#F7F1E5] p-2 border rounded-md no-drag nopan nowheel group`}
      >
        <div className="absolute inset-0 flex flex-col p-2 size-full">
          <span
            className="group-hover:visible top-1 right-2.5 absolute text-red-500 cursor-pointer invisible"
            onClick={() => remove()}
          >
            x
          </span>
          <NiceHandle
            type="target"
            id="right"
            position={Position.Right}
            className="!-right-1.5"
          />
          <NiceHandle
            type="target"
            id="left"
            position={Position.Left}
            className="!-left-1.5"
          />

          {title && <div className="font-semibold">{title}</div>}
          <div className="relative pb-2 h-full overflow-hidden overflow-y-auto knowledge-content markdown">
            <span>{content}</span>
          </div>

          <NodeResizeControl
            minWidth={NODE_SIZES.knowledge[0]}
            minHeight={NODE_SIZES.knowledge[1]}
            nodeId={id}
            position="bottom-right"
            className="!top-[unset] !right-2 !bottom-2 !left-[unset] z-10 !absolute !bg-transparent !border-none"
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

          <div
            className="-bottom-14 left-0 absolute flex justify-center items-end w-full h-12"
            onMouseEnter={() => setIsHovering(true)}
          >
            {isHovering && (
              <div className="flex justify-center items-center gap-4 bg-[#FFE9CF] px-4 py-2 rounded-full text-lg cursor-pointer">
                <div className="hover:font-semibold">How</div>
                <div className="hover:font-semibold">Pros</div>
                <div className="hover:font-semibold">Cons</div>
                <div className="hover:font-semibold">Origin</div>
                <div className="hover:font-semibold">eli5</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgehNode;
