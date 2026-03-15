export type TopicCategory =
  | "fundamentals"
  | "keys"
  | "transactions"
  | "network"
  | "advanced";

export interface Topic {
  slug: string;
  title: string;
  description: string;
  icon: string;
  category: TopicCategory;
  order: number;
}

export interface VisualizationShellProps {
  title: string;
  description: string;
  topic: string;
  children: React.ReactNode;
}
