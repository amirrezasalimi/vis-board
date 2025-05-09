import { useEffect, useMemo, useRef, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useReactiveBoardStore } from "~/modules/board/hooks/board.store";
import type { BranchNodeData, ExtraNode } from "~/modules/board/types/nodes";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import NiceHandle from "../nice-handle";
import useCanvasAi from "~/modules/board/hooks/canvas-ai";
import Spinner from "~/assets/images/spinner.svg";
import Note from "~/assets/images/note.svg";

const BranchNode = (props: NodeProps<ExtraNode>) => {
  const data = props.data as BranchNodeData;
  const title = data.title || "";
  const ai = useCanvasAi();
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
        className="-left-2!"
      />
      <NiceHandle
        id={`right`}
        type="source"
        position={Position.Right}
        className="-right-2!"
      />

      <div className="z-50 flex justify-center w-full">
        <h1 className="inline-block grow-0 shrink-0 justify-center items-center bg-[#FF7F7F] p-1 px-5 rounded-full w-auto text-[#5E3535]">
          {title}
        </h1>
      </div>

      {/* Messages */}
      <div className="mt-4 w-full h-[550px]">
        <div
          className={`top-0 z-10 absolute bg-linear-to-b from-[#FFF5E6] via-[#FFF5E6cc] to-transparent duration-200 ease-in-out w-full h-44 ${
            !showGradient && "opacity-0"
          }`}
        ></div>

        <div
          ref={messagesRef}
          className="relative flex flex-col gap-2 px-2.5 rounded-md size-full overflow-y-auto no-drag nopan nowheel"
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
                className="group z-10 relative flex gap-2 w-full"
                style={
                  {
                    "--connector-color": roleStyle?.border,
                  } as React.CSSProperties
                }
              >
                <div className="after:-right-2.5 before:-left-2.5 before:absolute after:absolute flex flex-col gap-2 before:bg-[var(--connector-color)] after:bg-[var(--connector-color)] w-full before:w-1 after:w-1 before:h-full after:h-full before:content-[''] after:content-['']">
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
                      className="group-hover:visible invisible bottom-0 z-10 sticky flex justify-end"
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
                  className="group-hover:visible invisible top-1 right-1 absolute text-red-400 text-xs cursor-pointer"
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
                  className="bg-[#FFE3C4] p-1 px-2 py-1 rounded-md text-[#A75B0E] text-sm"
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
        className={`group-hover/node:visible bottom-8 -left-20 absolute flex justify-center items-center bg-[#FF7F7F] rounded-full cursor-pointer invisible size-12 
          ${ai.distillLoading ? "visible!" : "invisible"}`}
      >
        {!ai.distillLoading && <Note className="w-6 h-6" />}
        {ai.distillLoading && (
          <div className="absolute flex justify-center items-center w-full h-full">
            <Spinner className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
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
