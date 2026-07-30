import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, ChevronDown, ChevronRight, Copy, Search } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { fetchPromptCategories, fetchPrompts, matchesQuery } from '@/lib/prompts';
import type { ProfessionalPrompt } from '@/types/prompts';

function PromptCard({ prompt, categoryName }: { prompt: ProfessionalPrompt; categoryName?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.prompt_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Prompt copied — paste it into ChatGPT, Claude, or Gemini');
    } catch {
      toast.error('Could not copy — select the text and copy manually');
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-start justify-between gap-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="min-w-0">
          <div className="font-semibold text-gray-900">{prompt.title}</div>
          {prompt.description && (
            <p className="text-sm text-gray-600 mt-0.5">{prompt.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {categoryName && (
              <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                {categoryName}
              </span>
            )}
            {prompt.difficulty_level && (
              <span className="text-xs text-gray-500">{prompt.difficulty_level}</span>
            )}
          </div>
        </div>
        {open ? (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
        )}
      </button>

      {open && (
        <div className="border-t border-gray-100 p-5 space-y-4">
          {prompt.use_case && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                When to use it
              </p>
              <p className="text-sm text-gray-700">{prompt.use_case}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              The prompt
            </p>
            <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-5">
              <pre className="font-mono text-sm text-gray-800 whitespace-pre-wrap break-words">
                {prompt.prompt_text}
              </pre>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Replace anything in [BRACKETS] with your own details before sending.
            </p>
          </div>

          <button
            onClick={copy}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy prompt'}
          </button>
        </div>
      )}
    </div>
  );
}

export function PromptsPage() {
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['prompt-categories'],
    queryFn: fetchPromptCategories,
  });
  const { data: prompts, isLoading, isError } = useQuery({
    queryKey: ['prompts'],
    queryFn: fetchPrompts,
  });

  const categoryName = useMemo(() => {
    const map = new Map((categories ?? []).map((c) => [c.id, c.name]));
    return (id: string | null) => (id ? map.get(id) : undefined);
  }, [categories]);

  const visible = useMemo(() => {
    return (prompts ?? [])
      .filter((p) => (categoryId ? p.category_id === categoryId : true))
      .filter((p) => matchesQuery(p, query));
  }, [prompts, categoryId, query]);

  /** Only offer categories that actually have prompts behind them. */
  const usableCategories = useMemo(() => {
    const used = new Set((prompts ?? []).map((p) => p.category_id));
    return (categories ?? []).filter((c) => used.has(c.id));
  }, [categories, prompts]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Prompt library</h1>
        <p className="text-lg text-gray-500 mb-8">
          Ready-to-use prompts for real work. Copy one, swap in your details, paste it into any AI.
        </p>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search prompts…"
            className="w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-purple-400"
          />
        </div>

        {/* Category filter */}
        {usableCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setCategoryId(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                categoryId === null
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            {usableCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id === categoryId ? null : c.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  categoryId === c.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-900 font-medium">Couldn't load the library</p>
            <p className="text-sm text-gray-500 mt-1">Please refresh and try again.</p>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <p className="text-sm text-gray-500 mb-3">
              {visible.length} {visible.length === 1 ? 'prompt' : 'prompts'}
            </p>
            {visible.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                <p className="text-gray-900 font-medium">Nothing matches that search</p>
                <p className="text-sm text-gray-500 mt-1">Try a different word, or clear the filters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visible.map((p) => (
                  <PromptCard key={p.id} prompt={p} categoryName={categoryName(p.category_id)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
