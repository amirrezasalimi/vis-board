import OpenAI from "openai";
import { useReactiveBoardStore } from "./board.store";
import { useState } from "react";
import type { MessageItem } from "../types/nodes";
import useOai from "./oai";
import { makeId } from "~/shared/utils/id";
import { useLocalStorage } from "~/shared/hooks/use-local-storage";
import useLocalStore from "./local.store";

const useAi = () => {
  const store = useReactiveBoardStore();
  const { getOai } = useOai();
  const branch = store.branches?.[store.config.activeBranch ?? ""];

  const { isReceivingMessage, setIsReceivingMessage } = useLocalStore();
  const toOaiMessages = (
    messages: MessageItem[]
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] => {
    return messages.map(
      (message) =>
        ({
          role: message.role,
          content: message.content,
        } as any)
    );
  };
  const sendTextMessage = async (message: string) => {
    if (!message || isReceivingMessage) return;

    if (!branch) return;

    const oai = getOai();
    setIsReceivingMessage(true);

    // Add user message with ID
    branch.data.messages.push({
      id: makeId(),
      content: message,
      role: "user",
      timestamp: Date.now(),
    });

    // Get AI response
    const response = await oai.chat.completions.create({
      model: "deepseek/deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "You are a friendly AI assistant that helps people find information.",
        },
        ...toOaiMessages(branch.data.messages),
      ],
      max_tokens: 300,
      stream: true,
    });

    // Stream the response
    let assistantMessageId = makeId();
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        const lastMessage =
          branch.data.messages[branch.data.messages.length - 1];
        if (lastMessage.role === "assistant") {
          lastMessage.content += content;
        } else {
          branch.data.messages.push({
            id: assistantMessageId,
            content,
            role: "assistant",
            timestamp: Date.now(),
          });
        }
      }
    }

    setIsReceivingMessage(false);
  };

  const reloadMessage = async (messageId: string) => {
    if (!branch) return;

    const messageIndex = branch.data.messages.findIndex(
      (m) => m.id === messageId
    );
    if (messageIndex === -1) return;

    const targetMessage = branch.data.messages[messageIndex];
    if (targetMessage.role !== "assistant") return;

    const oai = getOai();
    setIsReceivingMessage(true);

    // Get messages up to the previous user message
    const previousMessages = branch.data.messages.slice(0, messageIndex);

    // Generate new response
    const response = await oai.chat.completions.create({
      model: "deepseek/deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "You are a friendly AI assistant that helps people find information.",
        },
        ...toOaiMessages(previousMessages),
      ],
      max_tokens: 300,
      stream: true,
    });

    // Reset and update existing message
    targetMessage.content = "";
    targetMessage.timestamp = Date.now();

    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        targetMessage.content += content;
      }
    }

    setIsReceivingMessage(false);
  };

  return { isReceivingMessage, sendTextMessage, reloadMessage };
};

export default useAi;
