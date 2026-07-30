export interface PromptCategory {
  id: string;
  name: string;
}

export interface ProfessionalPrompt {
  id: string;
  category_id: string | null;
  title: string;
  prompt_text: string;
  description: string | null;
  use_case: string | null;
  industry: string | null;
  difficulty_level: string | null;
  tags: string | null;
  order_index: number | null;
}
