export interface LessonSection {
  type: 'content' | 'example' | 'template' | 'exercise' | 'quiz' | 'tip';
  title: string;
  content: string;
}

export interface QuizQuestion {
  id: number;
  q: string;
  choices: string[];
  answerIndex: number;
}

export interface ParsedLesson {
  sections: LessonSection[];
  quiz: QuizQuestion[] | null;
}

export function parseLessonMarkdown(md: string): ParsedLesson {
  // Extract and remove quiz JSON blocks
  let quiz: QuizQuestion[] | null = null;
  let clean = md;

  // Remove rubric blocks entirely (raw JSON not useful for display)
  clean = clean.replace(/~~~rubric[\s\S]*?~~~/g, '');
  clean = clean.replace(/```rubric[\s\S]*?```/g, '');

  // Extract quiz data
  const quizMatch = clean.match(/~~~quiz\n([\s\S]*?)\n~~~/);
  if (!quizMatch) {
    const quizMatch2 = clean.match(/```quiz\n([\s\S]*?)\n```/);
    if (quizMatch2) {
      try {
        const parsed = JSON.parse(quizMatch2[1]);
        quiz = parsed.questions || null;
      } catch { /* ignore */ }
    }
  } else {
    try {
      const parsed = JSON.parse(quizMatch[1]);
      quiz = parsed.questions || null;
    } catch { /* ignore */ }
  }

  // Remove quiz blocks from content
  clean = clean.replace(/~~~quiz[\s\S]*?~~~/g, '');
  clean = clean.replace(/```quiz[\s\S]*?```/g, '');

  // Remove self-check rubric text (the scoring criteria shown as raw text)
  clean = clean.replace(/\*\*Self-check rubric:\*\*[\s\S]*?(?=\n---|\n###|$)/g, '');

  // Split into sections by ### headers
  const lines = clean.split('\n');
  const sections: LessonSection[] = [];
  let current: LessonSection = { type: 'content', title: '', content: '' };
  let foundFirst = false;

  for (const line of lines) {
    if (line.startsWith('### ')) {
      if (foundFirst && current.content.trim()) {
        sections.push(current);
      }
      foundFirst = true;
      const title = line.replace('### ', '').trim();
      current = {
        type: classifySection(title),
        title,
        content: '',
      };
    } else {
      current.content += line + '\n';
    }
  }
  if (current.content.trim()) sections.push(current);

  return { sections, quiz };
}

function classifySection(title: string): LessonSection['type'] {
  const t = title.toLowerCase();
  if (t.includes('before') || t.includes('after') || t.includes('action') || t.includes('example')) return 'example';
  if (t.includes('template') || t.includes('reusable')) return 'template';
  if (t.includes('exercise') || t.includes('try this') || t.includes('practice')) return 'exercise';
  if (t.includes('quiz') || t.includes('check')) return 'quiz';
  if (t.includes('pro tip') || t.includes('tip')) return 'tip';
  return 'content';
}

/** Convert lesson markdown to styled HTML */
export function lessonToHtml(md: string, sectionType: LessonSection['type']): string {
  let html = md;

  // Convert ~~~md / ``` code blocks into styled prompt cards
  html = html.replace(/~~~md\n([\s\S]*?)~~~/g, (_match, code: string) => {
    return makePromptCard(code.trim());
  });

  html = html.replace(/```\w*\n([\s\S]*?)```/g, (_match, code: string) => {
    return makePromptCard(code.trim());
  });

  // Before/After pattern detection
  html = html.replace(
    /\*\*Before[^*]*\*\*[:\s]*\n?"([^"]+)"/g,
    '<div class="rounded-xl border border-red-200 bg-red-50 p-4 my-3"><p class="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Before (weak)</p><p class="text-gray-800 italic">"$1"</p></div>'
  );

  html = html.replace(
    /\*\*After[^*]*\*\*[:\s]*\n?"([\s\S]*?)"/g,
    (_match, content: string) => {
      return `<div class="rounded-xl border border-green-200 bg-green-50 p-4 my-3"><p class="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">After (strong)</p><p class="text-gray-800">"${content.trim()}"</p></div>`;
    }
  );

  // Blockquotes as callout cards
  html = html.replace(
    /^> (.+)$/gm,
    '<div class="border-l-4 border-purple-400 bg-purple-50 pl-4 pr-4 py-3 rounded-r-lg my-4 text-sm text-gray-700">$1</div>'
  );

  // Headers
  html = html.replace(/^#### (.+)$/gm, '<h4 class="text-base font-bold text-gray-900 mt-6 mb-2">$1</h4>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-900 font-semibold">$1</strong>');

  // Italic
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-purple-700 px-1.5 py-0.5 rounded text-sm">$1</code>');

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li class="text-gray-700 leading-relaxed">$1</li>');
  html = html.replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul class="list-disc pl-6 space-y-2 my-4">$1</ul>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '');

  // Completion criteria line (remove — it's internal)
  html = html.replace(/\*\*Completion Criteria:\*\*.*$/gm, '');

  // Paragraphs
  html = html.replace(/^(?!<[a-z<])((?!\s*$).+)$/gm, '<p class="text-gray-700 leading-relaxed my-3">$1</p>');

  // Clean up
  html = html.replace(/<p[^>]*>\s*<\/p>/g, '');

  return html;
}

function makePromptCard(code: string): string {
  const escaped = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `
    <div class="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-5 my-4">
      <p class="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-2">Prompt Template</p>
      <pre class="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">${escaped}</pre>
    </div>
  `;
}
