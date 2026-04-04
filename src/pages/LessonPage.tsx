import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Clock, BookOpen } from 'lucide-react';
import { Header } from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { getLessonMeta, getModuleForLesson, lessonToDayNumber, TOTAL_LESSONS } from '@/config/courseModules';

export function LessonPage() {
  const { lessonNumber: param } = useParams<{ lessonNumber: string }>();
  const navigate = useNavigate();
  const lessonNumber = parseInt(param || '1');
  const meta = getLessonMeta(lessonNumber);
  const dayNumber = meta ? meta.dayNumber : lessonNumber;
  const currentModule = getModuleForLesson(lessonNumber);
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Fetch lesson content from Supabase
  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', dayNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('course_id', 'foundations')
        .eq('day_number', dayNumber)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Parse markdown into sections
  const sections = lesson?.content_md ? parseIntoSections(lesson.content_md) : [];

  // Section titles for TOC
  const sectionTitles = sections.map((s) => s.title || s.type);

  // Scroll spy
  const handleScroll = useCallback(() => {
    for (let i = sectionRefs.current.length - 1; i >= 0; i--) {
      const ref = sectionRefs.current[i];
      if (ref && ref.getBoundingClientRect().top <= 160) {
        setActiveSection(i);
        return;
      }
    }
    setActiveSection(0);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveSection(0);
  }, [lessonNumber]);

  const scrollToSection = (index: number) => {
    const ref = sectionRefs.current[index];
    if (ref) {
      const top = ref.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const prevLesson = lessonNumber > 1 ? lessonNumber - 1 : null;
  const nextLesson = lessonNumber < TOTAL_LESSONS ? lessonNumber + 1 : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      </div>
    );
  }

  if (!lesson || !meta) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <h2 className="text-2xl font-bold">Lesson not found</h2>
          <Link to="/learn" className="text-purple-600 hover:underline">Back to Course</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Lesson bar */}
      <div className="border-b bg-white sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/learn" className="text-gray-500 hover:text-gray-900 text-sm flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              {currentModule ? `Module ${currentModule.id}` : 'Course'}
            </Link>
            <span className="text-sm text-gray-400">
              Lesson {lessonNumber} of {TOTAL_LESSONS}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* TOC sidebar */}
          <aside className="hidden lg:block w-44 flex-shrink-0">
            <nav className="sticky top-20 space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sections</p>
              {sectionTitles.map((title, i) => (
                <button
                  key={i}
                  onClick={() => scrollToSection(i)}
                  className={`block w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors truncate ${
                    activeSection === i
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {title}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 max-w-[65ch] mx-auto lg:mx-0">
            {/* Hero */}
            <div className="mb-10">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <Clock className="w-4 h-4" />
                <span>~{meta.estimatedMinutes} min</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
              <p className="text-lg text-gray-600">{lesson.description || meta.description}</p>
            </div>

            {/* All sections rendered inline */}
            <div className="space-y-10">
              {sections.map((section, i) => (
                <div key={i} ref={(el) => { sectionRefs.current[i] = el; }}>
                  {section.title && (
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h2>
                  )}
                  <div
                    className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700 prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-purple-700 prose-code:text-sm"
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(section.content) }}
                  />
                </div>
              ))}
            </div>

            {/* Next lesson */}
            <div className="mt-12 flex justify-between pb-12">
              {prevLesson ? (
                <Link
                  to={`/learn/${prevLesson}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-4 py-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Lesson {prevLesson}
                </Link>
              ) : (
                <div />
              )}
              {nextLesson ? (
                <Link
                  to={`/learn/${nextLesson}`}
                  className="flex items-center gap-2 text-sm text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg px-4 py-2 hover:opacity-90"
                >
                  Lesson {nextLesson}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  to="/learn"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-4 py-2"
                >
                  Back to Course
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple markdown section parser
interface Section {
  type: string;
  title: string;
  content: string;
}

function parseIntoSections(md: string): Section[] {
  const lines = md.split('\n');
  const sections: Section[] = [];
  let current: Section = { type: 'Lesson', title: 'Lesson', content: '' };

  for (const line of lines) {
    if (line.startsWith('### ')) {
      if (current.content.trim()) sections.push(current);
      const title = line.replace('### ', '').trim();
      current = { type: title, title, content: '' };
    } else {
      current.content += line + '\n';
    }
  }
  if (current.content.trim()) sections.push(current);

  return sections;
}

// Minimal markdown to HTML converter
function markdownToHtml(md: string): string {
  return md
    // Headers
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Code blocks
    .replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```\w*\n?/, '').replace(/\n?```$/, '');
      return `<pre class="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm my-4"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
    })
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul class="list-disc pl-6 space-y-1">$1</ul>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-purple-300 pl-4 italic text-gray-600 my-4">$1</blockquote>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-8 border-gray-200" />')
    // Paragraphs (lines with content that aren't already wrapped)
    .replace(/^(?!<[a-z])((?!\s*$).+)$/gm, '<p>$1</p>')
    // Clean up empty paragraphs
    .replace(/<p>\s*<\/p>/g, '');
}
