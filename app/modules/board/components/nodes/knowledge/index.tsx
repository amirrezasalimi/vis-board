import { Handle, Position, type NodeProps } from "@xyflow/react";
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

const KnowledgehNode = ({ data, id }: NodeProps<ExtraNode>) => {
  const store = useReactiveBoardStore();
  const ydoc = useBoardStoreYDoc();
  const { content, title } = data as KnowledgeNodeData;

  const remove = () => {
    const edgeIndex = store.edges.findIndex((edge) => edge.target === id);
    if (edgeIndex !== -1) {
      console.log(`edgeIndex`, edgeIndex);

      ydoc.transact(() => {
        delete store.edges[edgeIndex];
        delete store.knowledges[id as string];
      });
    }
  };

  if (!store.knowledges?.[id as string]) {
    return null;
  }
  return (
    <div
      className={`border-[#D8BFD8] knowledge bg-[#F7F1E5] p-2 border rounded-sm overflow-y-auto no-drag nopan nowheel group`}
      style={{
        width: NODE_SIZES.knowledge[0],
        height: NODE_SIZES.knowledge[1],
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
    </div>
  );
};

export default KnowledgehNode;
