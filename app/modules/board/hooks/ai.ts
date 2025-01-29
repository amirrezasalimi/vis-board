import OpenAI from "openai";
import { useReactiveBoardStore } from "./board.store";
import type { MessageItem } from "../types/nodes";
import useOai from "./oai";
import { makeId } from "~/shared/utils/id";
import useLocalStore from "./local.store";
import { extractFirstJson } from "../helpers/json";

const useAi = () => {
  const store = useReactiveBoardStore();
  const { getOai, model } = useOai();
  const branch = store.branches?.[store.config.activeBranch ?? ""];

  const {
    isReceivingMessage,
    setIsReceivingMessage,
    generatingFollowups,
    setGeneratingFollowups,
  } = useLocalStore();
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
  const SystemPrompt = `You are a friendly AI assistant that helps people find information.\n you always answer in markdown format.`;
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
      model,
      messages: [
        {
          role: "system",
          content: SystemPrompt,
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
    generateFollowups(assistantMessageId);
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
      model,
      messages: [
        {
          role: "system",
          content: SystemPrompt,
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
    generateFollowups(messageId);
    setIsReceivingMessage(false);
  };

  const getModels = async () => {
    const oai = getOai();
    if (!oai.baseURL) return;
    const response = await oai.models.list();
    return response.data;
  };

  const generateFollowups = async (messageId: string) => {
    console.log("generateFollowups", messageId);

    if (!branch || generatingFollowups) return;
    const message = branch.data.messages.find((m) => m.id === messageId);
    if (message) {
      setGeneratingFollowups(true);
      const oai = getOai();
      const response = await oai.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: `
<AssistantMessage>:
${message.content}
</AssistantMessage>
---

Please generate 4 very short followup questions based on the assistant message ( maximum 4 words each),
the followups should questions user can ask from ai related to that message.
if the assistant message was casual/regular talk and not much information on it, you have to return an empty array.

---
return in the valid json array without any talk or message.
Return in this JSON array format, no extra talk:
[
   "...",
   "...",
]
`,
          },
        ],
      });
      const ai_content = response.choices[0]?.message?.content;
      if (ai_content) {
        try {
          const followups = extractFirstJson(ai_content);
          if (Array.isArray(followups) && followups.length) {
            message.followups = followups;
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
    setGeneratingFollowups(false);
  };
  return {
    isReceivingMessage,
    sendTextMessage,
    reloadMessage,
    getModels,
    generateFollowups,
  };
};

export default useAi;
