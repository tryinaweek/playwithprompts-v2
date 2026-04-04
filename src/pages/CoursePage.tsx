import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Lock,
  CheckCircle,
  Play,
  ChevronDown,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { COURSE_MODULES, TOTAL_LESSONS } from '@/config/courseModules';

export function CoursePage() {
  const navigate = useNavigate();
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([1, 2, 3, 4]));

  // Fetch lessons from Supabase to verify they exist
  const { isLoading } = useQuery({
    queryKey: ['course-lessons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_lessons')
        .select('day_number, title')
        .eq('course_id', 'foundations')
        .order('day_number');
      if (error) throw error;
      return data || [];
    },
  });

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Course Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prompt Engineering Foundations</h1>
              <p className="text-sm text-gray-500">4 modules · {TOTAL_LESSONS} lessons · Free</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/learn/1')}
            className="mt-4 w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Start Learning
          </button>
        </div>

        {/* Modules */}
        <div className="space-y-3">
          {COURSE_MODULES.map((mod) => {
            const expanded = expandedModules.has(mod.id);
            const totalMinutes = mod.lessons.reduce((s, l) => s + l.estimatedMinutes, 0);

            return (
              <div key={mod.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-purple-300 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">
                        Module {mod.id}: {mod.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {mod.subtitle} · {mod.lessons.length} lessons · ~{totalMinutes} min
                      </div>
                    </div>
                  </div>
                  {expanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expanded && (
                  <div className="border-t border-gray-100">
                    {mod.lessons.map((lesson) => (
                      <button
                        key={lesson.lessonNumber}
                        onClick={() => navigate(`/learn/${lesson.lessonNumber}`)}
                        className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-purple-50 transition-colors"
                      >
                        <Play className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">
                            {lesson.lessonNumber}. {lesson.title}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          {lesson.estimatedMinutes} min
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
