// Types for our application

// Form field structure
export interface FormField {
    id: string;
    name: string;
    type: string;
    label?: string;
    placeholder?: string;
    options?: string[];
    required?: boolean;
    pattern?: string;
    tooltip?: string;
    context?: string;
  }
  
  // OpenAI API response structure
  export interface OpenAIResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: {
      index: number;
      message: {
        role: string;
        content: string;
      };
      finish_reason: string;
    }[];
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }
  
  // Extension settings
  export interface ExtensionSettings {
    apiKey: string;
    isEnabled: boolean;
  }