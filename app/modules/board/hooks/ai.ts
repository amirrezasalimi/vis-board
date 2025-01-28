import OpenAI from "openai";
import { useReactiveBoardStore } from "./board.store";
import { useState } from "react";
import type { KnowledgeNodeData, MessageItem } from "../types/nodes";
import { makeId } from "~/shared/utils/id";
import useOai from "./oai";

const useAi = () => {
  const store = useReactiveBoardStore();
  const { getOai } = useOai();
  const [isSending, setIsSending] = useState(false);

  const getKnowledges = () => {
    const knowledges = store.knowledges;

    return Object.values(knowledges).filter(
      (node) => node?.data.branch_id === store.config.activeBranch
    );
  };

  const toOaiMessages = (
    messages: MessageItem[]
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] => {
    return messages.map((message) => {
      return {
        role: message.role,
        content: message.content,
      } as OpenAI.Chat.Completions.ChatCompletionMessageParam;
    });
  };

  const extractXMLKnowledge = (content: string) => {
    const match = content.match(/<knowledge>([\s\S]*?)<\/knowledge>/);
    const xmlContent = match ? match[1].trim() : null;
    if (xmlContent) {
      return `<knowledge>${xmlContent}</knowledge>`;
    }
    return null;
  };

  const parseKnowledgeResponse = (res: string) => {
    // does include <response>
    if (!res) {
      return false;
    }
    const xmlContent = extractXMLKnowledge(res);

    if (!xmlContent) {
      return false;
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "application/xml");
    // Extract individual elements
    const knowledge = xmlDoc?.getElementsByTagName("knowledge")?.[0];
    const knowledge_title = knowledge?.getElementsByTagName("title")?.[0];
    const knowledge_content = knowledge?.getElementsByTagName("content")?.[0];
    const related_knowledge_id = knowledge?.getElementsByTagName(
      "related_knowledge_id"
    )?.[0];
    const extractedNumberFromKnowledgeDB =
      related_knowledge_id?.textContent?.match(/\d+/);
    return {
      title: knowledge_title?.textContent,
      content: knowledge_content?.textContent,
      parentId: extractedNumberFromKnowledgeDB
        ? Number(extractedNumberFromKnowledgeDB)
        : null,
    };
  };

  const sendTextMessage = async (message: string) => {
    const branch = store.branches[store.config.activeBranch ?? ""];
    if (!branch) return;

    const oai = getOai();
    setIsSending(true);
    const model = "deepseek/deepseek-chat";
    branch.data.messages.push({
      content: message,
      role: "user",
      timestamp: Date.now(),
      token_per_second: 0,
      took_seconds: 0,
    });
    const messages: MessageItem[] = [
      {
        role: "system",
        content: `You are a friendly AI assistant that helps people find information. If you don't know the answer, just say that you don't know, don't try to make up an answer.
1. Answer short and briefly.
          `,
      },
      ...branch.data.messages,
    ];

    // to get initial response.
    const ai_first_response = await oai.chat.completions.create({
      model,
      messages: toOaiMessages(messages),
      max_tokens: 300,
    });
    if (!ai_first_response.choices.length) {
      setIsSending(false);
      return;
    }
    const res = ai_first_response.choices[0].message.content;
    // add response to messages
    branch.data.messages.push({
      content: res,
      role: "assistant",
      timestamp: Date.now(),
      token_per_second: 0,
      took_seconds: 0,
    });
    const branchKnowledges = getKnowledges().filter((node) =>
      node?.data.title?.trim()
    );

    const knowledgesPrompt = `
    ${
      branchKnowledges?.length
        ? branchKnowledges
            .map(
              (knowledge, index) =>
                `${index + 1}. ${knowledge?.data.title ?? ""}`
            )
            .join("\n--")
        : "Empty."
    }
    `;

    // check does answer look like knowledge or casual talk
    const ai_prompt = `
<user_message>
${message}
</user_message>

<assistant_response>
${res}
</assistant_response>


<knowledges_db>
${knowledgesPrompt}
</knowledges_db>

----
Based on assistant response, decide is content useful and do not exists in our <knowledges_db>:
- if response was NEW and useful content, respond with <knowledge>, otherwise respond with </casual>.
- make sure always end the xml tags if started.
- if there was related knowledge, put it in <related_knowledge_index> tag.
IN THIS XML RESPONSE FORMAT:
<knowledge>
    <related_knowledge_index> -- </related_knowledge_index>
    <title> -- </title>
    <content> -- </content>
</knowledge>
OR:
</casual>
`;

    const ai_response = await oai.chat.completions.create({
      model,
      messages: [
        ...toOaiMessages(messages),

        {
          role: "user",
          content: ai_prompt,
        },
      ],
      // max_tokens: 300,
      temperature: 0.1,
    });

    if (ai_response.choices.length) {
      const res = ai_response.choices[0].message.content;
      if (res) {
        const knowledge = parseKnowledgeResponse(res);
        if (knowledge) {
          const related_knowledge = knowledge.parentId
            ? branchKnowledges[knowledge.parentId - 1]
            : null;

          const parentSide = related_knowledge?.data.side;
          const is_right = parentSide
            ? parentSide == "right"
            : Math.random() > 0.5;
          const id = makeId();
          store.knowledges[id] = {
            type: "knowledge",
            data: {
              branch_id: branch.id,
              title: knowledge.title,
              content: knowledge.content,
              timestamp: Date.now(),
              token_per_second: 0,
              took_seconds: 0,
              parentId: related_knowledge?.id,
              side: is_right ? "right" : "left",
            } as KnowledgeNodeData,
            id,
            position: {
              x: 0,
              y: 0,
            },
          };
          const toBranchId =
            related_knowledge?.id ?? store.config.activeBranch ?? "";
          // add edge
          store.edges.push({
            id: `edge-${id}-${toBranchId}`,
            sourceHandle: is_right ? "right" : "left",
            targetHandle: is_right ? "left" : "right",
            source: toBranchId,
            target: id,
            type: "bezier",
            data: {
              branch_id: branch.id,
            },
          });
        }
      }
    }

    setIsSending(false);
  };

  return {
    isSending,
    sendTextMessage,
  };
};

export default useAi;
