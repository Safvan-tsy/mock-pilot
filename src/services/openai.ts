import { FormField } from "../types";


export interface OpenAIServiceOptions {
  apiKey: string;
  model?: string;
}

export class OpenAIService {
  private apiKey: string;
  private model: string;
  private baseUrl: string = 'https://api.openai.com/v1';

  constructor(options: OpenAIServiceOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model || 'gpt-3.5-turbo';
  }

  /**
   * Generate appropriate values for form fields
   * @param fields The form fields to generate values for
   * @returns A promise that resolves to a record of field IDs and their values
   */
  async generateFormValues(fields: FormField[]): Promise<Record<string, string>> {
    try {
      const url = `${this.baseUrl}/chat/completions`;
      
      const systemPrompt = `
        You are an AI assistant that generates realistic form data for testing purposes.
        For each form field, analyze its type, label, placeholder, and context to generate an appropriate value.
        The data should be realistic but not contain any actual personal information.
        Always return a valid JSON object where keys are field IDs and values are the generated data.
      `;
      
      const formFieldsDescription = fields.map(field => {
        let description = `Field ID: ${field.id}\n`;
        description += `Type: ${field.type}\n`;
        
        if (field.label) description += `Label: ${field.label}\n`;
        if (field.placeholder) description += `Placeholder: ${field.placeholder}\n`;
        if (field.required) description += `Required: Yes\n`;
        if (field.pattern) description += `Pattern: ${field.pattern}\n`;
        if (field.tooltip) description += `Tooltip: ${field.tooltip}\n`;
        if (field.context) description += `Context: ${field.context}\n`;
        
        if (field.options && field.options.length > 0) {
          description += `Options: ${field.options.join(', ')}\n`;
        }
        
        return description;
      }).join('\n---\n');
      
      const userPrompt = `
        Please generate realistic values for the following form fields:
        
        ${formFieldsDescription}
        
        Respond ONLY with a JSON object where keys are field IDs and values are appropriate 
        realistic values for each field. Each value should match the expected format for its field type.
      `;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      try {
        // Parse the content from the AI response
        return JSON.parse(data.choices[0].message.content);
      } catch (error) {
        console.error('Failed to parse AI response:', data.choices[0].message.content);
        throw new Error('Failed to parse AI response');
      }
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }
}