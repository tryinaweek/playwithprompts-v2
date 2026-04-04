/**
 * Module structure for the Prompt Engineering Foundations course.
 *
 * Maps the existing day_number (1-14) from the database to modules and lessons.
 * This avoids any Supabase schema changes — we just layer structure on top.
 *
 * day_number 7 (Week 1 Recap) is skipped — its quiz content is folded into lesson 3.
 * day_number 13 (Future-Proofing) is replaced by the Capstone Project (new content).
 * day_number 14 is the Final Exam.
 */

export interface ModuleLesson {
  lessonNumber: number; // 1-12, user-facing
  dayNumber: number; // 1-14, maps to DB course_lessons.day_number
  title: string;
  description: string;
  estimatedMinutes: number;
}

export interface CourseModule {
  id: number;
  title: string;
  subtitle: string;
  lessons: ModuleLesson[];
}

export const COURSE_MODULES: CourseModule[] = [
  {
    id: 1,
    title: 'Foundations',
    subtitle: 'What makes a good prompt',
    lessons: [
      {
        lessonNumber: 1,
        dayNumber: 1,
        title: 'The C²S² Framework',
        description: 'Clarity, Context, Specificity, Structure — the four pillars of every good prompt.',
        estimatedMinutes: 5,
      },
      {
        lessonNumber: 2,
        dayNumber: 2,
        title: 'Context Is King',
        description: 'How to give AI the background it needs to stop guessing.',
        estimatedMinutes: 8,
      },
      {
        lessonNumber: 3,
        dayNumber: 3,
        title: 'Roles & Personas',
        description: 'Assign expertise to transform how AI thinks, judges, and communicates.',
        estimatedMinutes: 15,
      },
    ],
  },
  {
    id: 2,
    title: 'Techniques',
    subtitle: 'Level up your prompts',
    lessons: [
      {
        lessonNumber: 4,
        dayNumber: 4,
        title: 'Examples & Few-Shot',
        description: 'Show AI what good looks like and it will follow the pattern.',
        estimatedMinutes: 15,
      },
      {
        lessonNumber: 5,
        dayNumber: 5,
        title: 'Constraints & Formats',
        description: 'Use the SPACE framework to shape perfect, focused outputs.',
        estimatedMinutes: 15,
      },
      {
        lessonNumber: 6,
        dayNumber: 6,
        title: 'Debugging Bad Outputs',
        description: 'The FRAMES method and chain-of-thought for fixing what went wrong.',
        estimatedMinutes: 15,
      },
    ],
  },
  {
    id: 3,
    title: 'Advanced',
    subtitle: 'Think like a prompt engineer',
    lessons: [
      {
        lessonNumber: 7,
        dayNumber: 8,
        title: 'Prompt Patterns',
        description: 'Role switching, meta-prompting, and the MECE framework.',
        estimatedMinutes: 20,
      },
      {
        lessonNumber: 8,
        dayNumber: 9,
        title: 'Chain-of-Thought Reasoning',
        description: 'Four frameworks for step-by-step AI reasoning.',
        estimatedMinutes: 20,
      },
      {
        lessonNumber: 9,
        dayNumber: 10,
        title: 'Multi-Step Scaffolding',
        description: 'Sequential, iterative, and parallel patterns for complex tasks.',
        estimatedMinutes: 20,
      },
    ],
  },
  {
    id: 4,
    title: 'Mastery',
    subtitle: 'Put it all together',
    lessons: [
      {
        lessonNumber: 10,
        dayNumber: 11,
        title: 'Creative Prompting',
        description: 'Roleplay, SCAMPER, and using constraints to unlock creativity.',
        estimatedMinutes: 20,
      },
      {
        lessonNumber: 11,
        dayNumber: 12,
        title: 'Applied Productivity',
        description: '20+ ready-to-use templates for email, meetings, research, and more.',
        estimatedMinutes: 15,
      },
      {
        lessonNumber: 12,
        dayNumber: 13,
        title: 'Capstone Project',
        description: 'Build a complete prompt system for a real use case.',
        estimatedMinutes: 25,
      },
    ],
  },
];

export const TOTAL_LESSONS = 12;
export const EXAM_DAY_NUMBER = 14;

/** Map lesson number (1-12) to database day_number */
export function lessonToDayNumber(lessonNumber: number): number {
  for (const mod of COURSE_MODULES) {
    const lesson = mod.lessons.find((l) => l.lessonNumber === lessonNumber);
    if (lesson) return lesson.dayNumber;
  }
  return lessonNumber;
}

/** Map database day_number to lesson number (1-12) */
export function dayToLessonNumber(dayNumber: number): number | null {
  for (const mod of COURSE_MODULES) {
    const lesson = mod.lessons.find((l) => l.dayNumber === dayNumber);
    if (lesson) return lesson.lessonNumber;
  }
  return null;
}

/** Get the module a lesson belongs to */
export function getModuleForLesson(lessonNumber: number): CourseModule | null {
  return COURSE_MODULES.find((m) => m.lessons.some((l) => l.lessonNumber === lessonNumber)) || null;
}

/** Get lesson metadata by lesson number */
export function getLessonMeta(lessonNumber: number): ModuleLesson | null {
  for (const mod of COURSE_MODULES) {
    const lesson = mod.lessons.find((l) => l.lessonNumber === lessonNumber);
    if (lesson) return lesson;
  }
  return null;
}

/** Check if a module is complete (all its lessons completed) */
export function isModuleComplete(
  moduleId: number,
  completedDayNumbers: Set<number>
): boolean {
  const mod = COURSE_MODULES.find((m) => m.id === moduleId);
  if (!mod) return false;
  return mod.lessons.every((l) => completedDayNumbers.has(l.dayNumber));
}

/** Check if a module is unlocked (previous module complete, or it's module 1) */
export function isModuleUnlocked(
  moduleId: number,
  completedDayNumbers: Set<number>
): boolean {
  if (moduleId === 1) return true;
  return isModuleComplete(moduleId - 1, completedDayNumbers);
}
