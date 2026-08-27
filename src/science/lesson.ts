/**
 * The teaching content of a simulation, as data.
 *
 * One structure, two consumers: the Theory tab renders it, and the offline AI
 * tutor reasons over it — so the tutor can quote the same misconceptions, define
 * the same terms and set the same practice questions as the page, without a network
 * call and without inventing physics of its own. When the optional Claude API key
 * is present, this is also the context the request is grounded in.
 *
 * Writing a lesson is therefore the whole pedagogical contribution of a
 * simulation, kept separate from how it is drawn.
 */

export interface TheorySection {
  heading: string
  /** Paragraphs of prose. Plain text; MathText markup is allowed inline. */
  body: string[]
  /** Short points that read better as a list than as prose. */
  bullets?: string[]
}

export interface LessonFormula {
  /** What it is called, e.g. "Range". */
  name: string
  /** MathText markup, e.g. `R = {u² sin 2θ}/{g}`. */
  symbolic: string
  /** What each symbol is and when the formula holds. */
  meaning: string
  /** Conditions under which it stops being true. */
  validWhen?: string
}

export interface Misconception {
  /** The wrong belief, stated as a student would state it. */
  claim: string
  /** Why it is wrong, and what is true instead. */
  reality: string
  /** How to see the correction happen in this simulation. */
  seeItHere?: string
}

export interface QuizOption {
  text: string
  correct?: boolean
  /** Why this option is right or wrong. Shown after answering — every option needs one. */
  why: string
}

export interface QuizQuestion {
  id: string
  prompt: string
  options: QuizOption[]
  /** A nudge, not the answer. */
  hint?: string
  /** Roughly how demanding, for ordering and for the tutor's pacing. */
  level?: 'recall' | 'apply' | 'analyse'
}

export interface Experiment {
  /** An instruction the student can carry out with the controls on screen. */
  do: string
  /** What to watch, and what it means. */
  observe: string
}

export interface GlossaryEntry {
  term: string
  definition: string
}

export interface Lesson {
  /** Must match the simulation's id in the curriculum. */
  simulationId: string
  title: string
  /** Where this sits in the syllabus, e.g. "NCERT Class 11 Physics · Chapter 4". */
  syllabus: string
  /** The single sentence a student should leave with. */
  bigIdea: string
  sections: TheorySection[]
  formulas: LessonFormula[]
  misconceptions: Misconception[]
  /** Where this physics or chemistry shows up outside a classroom. */
  realWorld: string[]
  questions: QuizQuestion[]
  experiments?: Experiment[]
  glossary?: GlossaryEntry[]
}

/** A lesson with nothing in it, so a simulation without content still renders. */
export function emptyLesson(simulationId: string, title: string): Lesson {
  return {
    simulationId,
    title,
    syllabus: '',
    bigIdea: '',
    sections: [],
    formulas: [],
    misconceptions: [],
    realWorld: [],
    questions: []
  }
}
