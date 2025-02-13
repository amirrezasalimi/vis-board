import { useState } from "react";
import type { Card } from "../types/card";
import useOai from "./oai";
import { extractFirstJson } from "../helpers/json";

const useCardsAi = () => {
  const oai = useOai();
  const [isLoading, setIsLoading] = useState(false);

  const create = async (title: string, description: string, count: number) => {
    setIsLoading(true);
    let cards: Card[] = [];
    const prompt = `
Generate a set of flashcards based on the topic: ${title}. For each flashcard,

Count: ${count > 0 ? count : `Auto`}
${description ? `Topic: ${description}` : ""}

provide the following details in JSON format, ensuring clarity, accuracy, and educational value. Each flashcard should have:
1. **Title**: A concise and informative title for the flashcard.
2. **Description**: A detailed, yet concise explanation or definition related to the title.

Ensure the content is structured and relevant to the chosen topic, focusing on clarity and ease of understanding for educational purposes.
The final output should follow this JSON structure:
[
  {
    "title": "Flashcard Title 1",
    "description": "Description of the first flashcard"
  },
  {
    "title": "Flashcard Title 2",
    "description": "Description of the second flashcard"
  },
  ...
]`;

    try {
      const res = await oai.getOai().chat.completions.create({
        model: oai.model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });
      const content = res.choices[0].message.content;
      if (!content) {
        return [];
      }
      cards = extractFirstJson(content);
    } catch (e) {
      setIsLoading(false);
      throw e;
    }
    setIsLoading(false);
    return cards.map((card, i) => ({ ...card, id: String(i + 1) }));
  };

  return {
    create,
    isLoading,
  };
};

export default useCardsAi;
