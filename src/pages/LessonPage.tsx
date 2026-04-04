import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Clock, Lightbulb, BookOpen, PenTool, CheckCircle } from 'lucide-react';
import { Header } from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { parseLessonMarkdown, lessonToHtml } from '@/lib/lesson-parser';
import { getLessonMeta, getModuleForLesson, TOTAL_LESSONS } from '@/config/courseModules';

export function LessonPage() {
  const { lessonNumber: param } = useParams<{ lessonNumber: string }>();
  const navigate = useNavigate();
  const lessonNumber = parseInt(param || '1');
  const meta = getLessonMeta(lessonNumber);
  const dayNumber = meta ? meta.dayNumber : lessonNumber;
  const currentModule = getModuleForLesson(lessonNumber);
  const [activeSection, setActiveSection] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  const parsed = lesson?.content_md ? parseLessonMarkdown(lesson.content_md) : null;

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
    setQuizAnswers({});
    setQuizSubmitted(false);
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

  if (!lesson || !meta || !parsed) {
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

  const sectionIcon = (type: string) => {
    switch (type) {
      case 'example': return '→';
      case 'template': return '📋';
      case 'exercise': return '✏️';
      case 'quiz': return '✓';
      case 'tip': return '💡';
      default: return '•';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Lesson bar */}
      <div className="border-b bg-white/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/learn" className="text-gray-500 hover:text-gray-900 text-sm flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              {currentModule ? `Module ${currentModule.id}` : 'Course'}
            </Link>
            <span className="text-sm text-gray-400">Lesson {lessonNumber} of {TOTAL_LESSONS}</span>
          </div>
          <div className="flex items-center gap-2">
            {prevLesson && (
              <Link to={`/learn/${prevLesson}`} className="text-gray-400 hover:text-gray-700">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            )}
            {nextLesson && (
              <Link to={`/learn/${nextLesson}`} className="text-gray-400 hover:text-gray-700">
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-10">
          {/* TOC sidebar */}
          <aside className="hidden lg:block w-48 flex-shrink-0">
            <nav className="sticky top-20 space-y-0.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sections</p>
              {parsed.sections.map((s, i) => (
                <button
                  key={i}
                  onClick={() => scrollToSection(i)}
                  className={`flex items-center gap-2 w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    activeSection === i
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xs">{sectionIcon(s.type)}</span>
                  <span className="truncate">{s.title || 'Intro'}</span>
                </button>
              ))}
              {parsed.quiz && (
                <button
                  onClick={() => scrollToSection(parsed.sections.length)}
                  className={`flex items-center gap-2 w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    activeSection === parsed.sections.length
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xs">✓</span>
                  <span>Quick Quiz</span>
                </button>
              )}
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 max-w-2xl">
            {/* Hero */}
            <div className="mb-10">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <Clock className="w-4 h-4" />
                <span>~{meta.estimatedMinutes} min</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
              <p className="text-lg text-gray-500">{lesson.description || meta.description}</p>
            </div>

            {/* Sections */}
            <div className="space-y-12">
              {parsed.sections.map((section, i) => (
                <div key={i} ref={(el) => { sectionRefs.current[i] = el; }}>
                  {/* Section header */}
                  {section.title && (
                    <div className="flex items-center gap-2 mb-4">
                      {section.type === 'exercise' && <PenTool className="w-5 h-5 text-purple-600" />}
                      {section.type === 'tip' && <Lightbulb className="w-5 h-5 text-amber-500" />}
                      {section.type === 'example' && <BookOpen className="w-5 h-5 text-blue-600" />}
                      <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                    </div>
                  )}

                  {/* Section styling wrapper */}
                  {section.type === 'exercise' ? (
                    <div className="rounded-xl border-2 border-purple-200 bg-purple-50/50 p-6">
                      <div dangerouslySetInnerHTML={{ __html: lessonToHtml(section.content, section.type) }} />
                    </div>
                  ) : section.type === 'tip' ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                      <div dangerouslySetInnerHTML={{ __html: lessonToHtml(section.content, section.type) }} />
                    </div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: lessonToHtml(section.content, section.type) }} />
                  )}
                </div>
              ))}

              {/* Quiz */}
              {parsed.quiz && parsed.quiz.length > 0 && (
                <div ref={(el) => { sectionRefs.current[parsed.sections.length] = el; }}>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h2 className="text-xl font-bold text-gray-900">Quick Quiz</h2>
                  </div>
                  <div className="space-y-6">
                    {parsed.quiz.map((q) => (
                      <div key={q.id} className="rounded-xl border border-gray-200 p-5">
                        <p className="font-medium text-gray-900 mb-3">{q.q}</p>
                        <div className="space-y-2">
                          {q.choices.map((choice, ci) => {
                            const selected = quizAnswers[q.id] === ci;
                            const isCorrect = ci === q.answerIndex;
                            const showResult = quizSubmitted;

                            let style = 'border-gray-200 hover:border-purple-300 hover:bg-purple-50';
                            if (selected && !showResult) style = 'border-purple-500 bg-purple-50';
                            if (showResult && selected && isCorrect) style = 'border-green-500 bg-green-50';
                            if (showResult && selected && !isCorrect) style = 'border-red-400 bg-red-50';
                            if (showResult && !selected && isCorrect) style = 'border-green-300 bg-green-50/50';

                            return (
                              <button
                                key={ci}
                                onClick={() => {
                                  if (!quizSubmitted) {
                                    setQuizAnswers((prev) => ({ ...prev, [q.id]: ci }));
                                  }
                                }}
                                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${style}`}
                              >
                                {choice}
                                {showResult && isCorrect && <span className="ml-2 text-green-600">✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {!quizSubmitted ? (
                      <button
                        onClick={() => setQuizSubmitted(true)}
                        disabled={Object.keys(quizAnswers).length < (parsed.quiz?.length || 0)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-40"
                      >
                        Check Answers
                      </button>
                    ) : (
                      <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800">
                        {(() => {
                          const correct = parsed.quiz!.filter((q) => quizAnswers[q.id] === q.answerIndex).length;
                          return `You got ${correct} out of ${parsed.quiz!.length} correct!`;
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Next lesson CTA */}
            <div className="mt-16 mb-12 flex justify-between items-center">
              {prevLesson ? (
                <Link
                  to={`/learn/${prevLesson}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl px-5 py-3"
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
                  className="flex items-center gap-2 text-sm text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl px-5 py-3 font-medium hover:opacity-90"
                >
                  Next: Lesson {nextLesson}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  to="/learn"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl px-5 py-3"
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
