import { supabase } from './supabase';
import type { ProfessionalPrompt, PromptCategory } from '@/types/prompts';

export async function fetchPromptCategories(): Promise<PromptCategory[]> {
  const { data, error } = await supabase
    .from('prompt_categories')
    .select('id, name')
    .order('name');
  if (error) throw error;
  return (data ?? []) as PromptCategory[];
}

export async function fetchPrompts(): Promise<ProfessionalPrompt[]> {
  const { data, error } = await supabase
    .from('professional_prompts')
    .select('id, category_id, title, prompt_text, description, use_case, industry, difficulty_level, tags, order_index')
    .order('order_index', { nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as ProfessionalPrompt[];
}

/** Case-insensitive match across the fields a person would actually search. */
export function matchesQuery(prompt: ProfessionalPrompt, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [prompt.title, prompt.description, prompt.use_case, prompt.tags, prompt.industry]
    .filter(Boolean)
    .some((field) => (field as string).toLowerCase().includes(q));
}
