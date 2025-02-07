import { useEffect, useMemo, useRef, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useReactiveBoardStore } from "~/modules/board/hooks/board.store";
import type { BranchNodeData, ExtraNode } from "~/modules/board/types/nodes";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import NiceHandle from "../nice-handle";
import useAi from "~/modules/board/hooks/ai";

const BranchNode = (props: NodeProps<ExtraNode>) => {
  const data = props.data as BranchNodeData;
  const title = data.title || "";
  const ai = useAi();
  const { branches } = useReactiveBoardStore();
  const messages = branches[props.id]?.data.messages ?? [];

  const messagesStyles = {
    assistant: {
      bg: "#FFE3C4",
      border: "#FFA943",
      text: "#A75B0E",
    },
    user: {
      bg: "#EEEEEE",
      border: "#AAAAED",
      text: "#8888CC",
    },
  };

  const [showGradient, setShowGradient] = useState(false);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = event.currentTarget;
    setShowGradient(scrollTop > 50);
  };

  const messagesRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages[messages.length - 1];
  useEffect(() => {
    if (messagesRef.current) {
      setTimeout(() => {
        messagesRef.current?.scrollTo({
          top: messagesRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 50);
    }
  }, [lastMessage.content]);

  const deleteMessage = (id: string, index: number) => {
    if (branches[id]) {
      branches[id].data.messages.splice(index, 1);
    }
  };
  const lastAssistantMessage = useMemo(() => {
    const lastMessage = messages[messages.length - 1];
    return lastMessage.role === "assistant" ? lastMessage : null;
  }, [messages.length]);
  const followups = lastAssistantMessage?.followups ?? [];

  return (
    <div className="group/node flex flex-col justify-center items-center w-[500px]">
      <NiceHandle
        id={`left`}
        type="source"
        position={Position.Left}
        className="!-left-2"
      />
      <NiceHandle
        id={`right`}
        type="source"
        position={Position.Right}
        className="!-right-2"
      />

      <div className="z-50 flex justify-center w-full">
        <h1 className="inline-block flex-grow-0 flex-shrink-0 justify-center items-center bg-[#FF7F7F] px-5 p-1 rounded-full w-auto text-[#5E3535]">
          {title}
        </h1>
      </div>

      {/* Messages */}
      <div className="mt-4 w-full h-[550px]">
        <div
          className={`top-0 z-10 absolute bg-gradient-to-b from-[#FFF5E6] via-[#FFF5E6cc] to-transparent duration-200 ease-in-out w-full h-44 ${
            !showGradient && "opacity-0"
          }`}
        ></div>

        <div
          ref={messagesRef}
          className="relative flex flex-col gap-2 px-2.5 rounded-md overflow-y-auto no-drag nopan nowheel size-full"
          onScroll={handleScroll}
        >
          {messages.map((message, index) => {
            const roleStyle =
              messagesStyles[message.role as keyof typeof messagesStyles];

            if (!roleStyle) {
              return null;
            }

            return (
              <div
                key={message.id}
                className="group relative z-10 flex gap-2 w-full"
                style={
                  {
                    "--connector-color": roleStyle?.border,
                  } as React.CSSProperties
                }
              >
                <div className="after:-right-2.5 before:-left-2.5 before:absolute after:absolute flex flex-col before:content-[''] after:content-[''] gap-2 before:bg-[var(--connector-color)] after:bg-[var(--connector-color)] w-full before:w-1 after:w-1 before:h-full after:h-full">
                  <div
                    className="p-3 w-full"
                    style={{
                      backgroundColor: roleStyle.bg,
                      color: roleStyle.text,
                    }}
                  >
                    <p className="font-medium capitalize">{message.role}:</p>
                    <p className="mt-1">
                      <Markdown
                        className="markdown"
                        remarkPlugins={[remarkParse, remarkGfm]}
                        rehypePlugins={[remarkRehype]}
                      >
                        {message.content}
                      </Markdown>
                    </p>
                    <div
                      className="group-hover:visible bottom-0 z-10 sticky flex justify-end invisible"
                      style={{
                        backgroundColor: roleStyle.bg,
                      }}
                    >
                      {message.role === "assistant" && (
                        <button
                          className="py-1 text-xs"
                          onClick={() => ai.reloadMessage(message.id)}
                        >
                          RELOAD
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  onClick={() => {
                    deleteMessage(props.id, index);
                  }}
                  className="group-hover:visible top-1 right-1 absolute text-red-400 text-xs cursor-pointer invisible"
                >
                  DELETE
                </span>
              </div>
            );
          })}
        </div>
        {!!followups.length && (
          <div className="flex flex-wrap gap-1 mt-1 w-full">
            {followups.map((followup, index) => {
              return (
                <button
                  key={followup}
                  className="bg-[#FFE3C4] px-2 py-1 p-1 rounded-md text-[#A75B0E] text-sm"
                  onClick={() => {
                    ai.sendTextMessage(followup);
                  }}
                >
                  {followup}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* distill */}
      <div
        onClick={() => {
          ai.distillMessage();
        }}
        className="group-hover/node:visible bottom-8 -left-20 absolute flex justify-center items-center bg-[#FF7F7F] rounded-full cursor-pointer invisible size-12"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 2V6"
            stroke="white"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M12 2V6"
            stroke="white"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M16 2V6"
            stroke="white"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M18 4H6C4.89543 4 4 4.89543 4 6V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V6C20 4.89543 19.1046 4 18 4Z"
            stroke="white"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M8 10H14"
            stroke="white"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M8 14H16"
            stroke="white"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M8 18H13"
            stroke="white"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        {/* triangle before */}
        <svg
          width="17"
          height="13"
          viewBox="0 0 17 13"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute translate-x-8"
        >
          <path d="M17 5.5L0 0V12.5L17 5.5Z" fill="#FF7F7F" />
        </svg>
      </div>
    </div>
  );
};

export default BranchNode;
