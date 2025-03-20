/// <reference types="vite/client" />

interface ImportMeta {
    env: {
      VITE_DEEPSEEK_API_BASE?: string;
      VITE_DEEPSEEK_API_KEY?: string;
      VITE_DEEPSEEK_MODEL?: string;
      [key: string]: string | undefined;
    };
  }

// Additional types for @ant-design/x components
// These may need to be adjusted based on the actual API
declare module '@ant-design/x' {
  import { ReactNode } from 'react';

  export type ThoughtStepStatus = 'wait' | 'processing' | 'finish' | 'error';
  
  export interface ThoughtStep {
    title: string;
    description: string;
    status: ThoughtStepStatus;
    icon?: ReactNode;
  }

  export interface ThoughtChainProps {
    steps?: ThoughtStep[];
    style?: React.CSSProperties;
    size?: 'small' | 'medium' | 'large';
  }

  export interface SuggestionItem {
    label: string;
    value: string;
    description?: string;
    severity?: 'success' | 'warning' | 'error' | string;
  }

  export interface SuggestionProps {
    items: SuggestionItem[];
    style?: React.CSSProperties;
  }

  export interface BubbleProps {
    content: string;
    type?: 'user' | 'assistant' | string;
    style?: React.CSSProperties;
  }

  export const ThoughtChain: React.FC<ThoughtChainProps>;
  export const Suggestion: React.FC<SuggestionProps>;
  export const Bubble: React.FC<BubbleProps>;
}