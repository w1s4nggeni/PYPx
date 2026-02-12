
export enum InstrumentType {
  PIANO = 'PIANO',
  DRUMS = 'DRUMS',
  VIOLIN = 'VIOLIN',
  HARP = 'HARP',
  CHIMES = 'CHIMES'
}

export interface NoteEvent {
  note: string;
  timestamp: number;
  duration?: number;
}

export interface Recording {
  id: string;
  instrument: InstrumentType;
  notes: NoteEvent[];
  timestamp: number;
  aiReview?: string;
}

export interface TutorMessage {
  role: 'user' | 'ai';
  content: string;
}

export interface TutorialStep {
  note: string;
  label?: string;
}

export interface Tutorial {
  title: string;
  steps: TutorialStep[];
}
