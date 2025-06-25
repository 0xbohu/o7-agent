// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
}

export const models: Array<Model> = [
  // {
  //   id: 'gemini-2.0-flash-exp',
  //   label: 'Gemini 2.0 Flash Exp',
  //   apiIdentifier: 'gemini-2.0-flash-exp',
  //   description: 'For thinking, medium-high level tasks',
  // },

  {
    id: 'gemini-2.5-flash-preview-05-20',
    label: 'Gemini 2.5 Flash Preview 05-20',
    apiIdentifier: 'gemini-2.5-flash-preview-05-20',
    description: 'Model Provider: Google',
  },
  
  {
    id: 'gpt-4o-mini',
    label: 'GPT 4o mini',
    apiIdentifier: 'gpt-4o-mini',
    description: 'Small model for fast, lightweight tasks',
  },
  {
    id: 'gpt-4o',
    label: 'GPT 4o',
    apiIdentifier: 'gpt-4o',
    description: 'For complex, multi-step tasks',
  },
  {
    id: '	claude-3-7-sonnet-20250219',
    label: 'Claude 3.7 Sonnet',
    apiIdentifier: 'claude-3-7-sonnet-20250219',
    description: 'For complex, multi-step tasks',
  },
  {
    id: 'deepseek-chat',
    label: 'Deepseek Chat',
    apiIdentifier: 'deepseek-chat',
    description: 'For non-reasoning, low cost tasks',
  },
  // {
  //   id: 'deepseek-reasoner',
  //   label: 'Deepseek R1',
  //   apiIdentifier: 'deepseek-reasoner',
  //   description: 'For reasoning, medium cost tasks',
  // },
] as const;

export const DEFAULT_MODEL_NAME: string = 'gemini-2.5-flash-preview-05-20';
