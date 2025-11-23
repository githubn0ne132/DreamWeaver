
export interface StoryPage {
  pageNumber: number;
  text: string;
  imagePrompt: string;
  imageUrl?: string;
}

export interface StoryStructure {
  title: string;
  pages: StoryPage[];
}

export interface StoryParams {
  character: string;
  story: string;
  style: string;
  textModel: string;
  imageModel: string;
  pageCount: number;
  age: number;
}

export enum AppState {
  INPUT = 'INPUT',
  GENERATING_STORY = 'GENERATING_STORY',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  READING = 'READING',
  ERROR = 'ERROR',
}

export interface GenerationProgress {
  currentStep: string;
  completedImages: number;
  totalImages: number;
}
