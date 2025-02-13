export interface Card {
  id: string;
  title: string;
  description: string;
}

export interface CardPack {
  id: string;
  title: string;
  description: string;
  cards: Card[];
  timestamp: number;
  cost: number;
  theme: "default" | "gradient";
  gradient_color?: string;
  ai_model?: string;
}
