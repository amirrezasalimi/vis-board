import OpenAI from "openai";
import { useReactiveBoardStore } from "./board.store";
import type { KnowledgeNodeData, MessageItem } from "../types/nodes";
import useOai from "./oai";
import { makeId } from "~/shared/utils/id";
import useLocalStore from "./local.store";
import { extractFirstJson } from "../helpers/json";
import type { Node } from "@xyflow/react";
import { useState } from "react";
import { xmlParse } from "../helpers/xml";

const useCanvasAi = () => {
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

  const [distillLoading, setDistillLoading] = useState(false);
  const distillMessage = async (side: "left" | "right" = "left") => {
    if (!branch || distillLoading) return;
    const messageId = branch.data.messages[branch.data.messages.length - 1].id;

    const message = branch.data.messages.find((m) => m.id === messageId);
    // ask ai to distill the message into a knowledge node
    const oai = getOai();
    setDistillLoading(true);
    const res = await oai.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: `
<AssistantMessage>
${message?.content}
</AssistantMessage>
---
- the response should be correct xml format with start and closing tags, without extra talk.
- title should be short and to the point.
- content should be normal short text in simple format.

Please Distill the knowledge from the assistant message into in this xml format, with out any extra talk:
<knowledge>
  <title>--</title>
  <content>--</content>
</knowledge>
`,
        },
      ],
    });
    const ai_response = res.choices[0]?.message?.content;

    if (ai_response) {
      const xml = xmlParse(ai_response, "knowledge");

      const title = xml?.getElementsByTagName("title")[0]?.textContent;
      const content = xml?.getElementsByTagName("content")[0]?.textContent;
      if (title && content) {
        const new_knowledge = {
          id: makeId(),
          type: "knowledge",
          data: {
            branch_id: branch.id,
            title,
            content,
            timestamp: Date.now(),
            took_seconds: 0,
            token_per_second: 0,
            side,
          } as KnowledgeNodeData,
          position: {
            x: 0,
            y: 0,
          },
        } as Node<KnowledgeNodeData>;
        if (message) {
          store.knowledges[new_knowledge.id] = new_knowledge;
          // add edge
          store.edges.push({
            id: makeId(),
            source: branch.id,
            target: new_knowledge.id,
            sourceHandle: side,
            targetHandle: side === "left" ? "right" : "left",
            type: "default",
          });
        }
      }
    }
    setDistillLoading(false);
  };

  const distillKnowledge = async (knowledgeId: string, type: string) => {
    if (!branch || distillLoading) return;

    setDistillLoading(true);
    const knowledge = store.knowledges[knowledgeId];
    if (!knowledge) return;
    const content = knowledge?.data.content;

    const prompt = `
Message:
${content}

---

Based on the message above, please distill the ${type} from the message.
raw text, maximum 4 paragraphs, no extra talk:
`;

    const new_knowledge_id = makeId();

    // add knowledge node
    store.knowledges[new_knowledge_id] = {
      id: new_knowledge_id,
      type: "knowledge",
      data: {
        branch_id: branch.id,
        title: type,
        content: "",
        timestamp: Date.now(),
        took_seconds: 0,
        token_per_second: 0,
        parentId: knowledgeId,
        side: knowledge.data.side,
      } as KnowledgeNodeData,
      position: {
        x: 0,
        y: 0,
      },
    };
    // ai
    const oai = getOai();
    const res = await oai.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: true,
    });

    let ai_response = "";
    for await (const chunk of res) {
      ai_response += chunk.choices[0].delta.content;
      store.knowledges[new_knowledge_id].data.content = ai_response;
    }
    console.log(`Distilled knowledge: ${ai_response}`);

    // add edge
    store.edges.push({
      id: makeId(),
      source: knowledgeId,
      target: new_knowledge_id,
      sourceHandle: knowledge.data.side,
      targetHandle: knowledge.data.side === "left" ? "right" : "left",
      type: "default",
    });

    setDistillLoading(false);
  };
  return {
    isReceivingMessage,
    sendTextMessage,
    reloadMessage,
    getModels,
    generateFollowups,
    distillMessage,
    distillLoading,
    distillKnowledge,
  };
};

export default useCanvasAi;
