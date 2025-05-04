// Background script runs persistently in the background
// It manages state and handles communication between content scripts and popup

import { Providers } from "./types";

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Mock Pilot extension installed');
    
    // Initialize default settings
    chrome.storage.sync.set({
      isEnabled: false,
      provider: '',
      model: '',
      apiKey: ''
    });
  });
  
  // Listen for messages from content scripts or popup
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'getSettings') {
      chrome.storage.sync.get(['apiKey', 'isEnabled', 'provider','model'], (result) => {
        sendResponse(result);
      });
      return true;
    }
    
    if (message.action === 'processFormFields') {
      const { formData } = message;
      
      // Get API key from storage
      chrome.storage.sync.get(['apiKey','provider','model'], async (result) => {
        try {
          if (!result.apiKey) {
            sendResponse({ success: false, error: 'Error:  API key not set' });
            return;
          }

          if (!result.provider || !result.model ) {
            sendResponse({ success: false, error: 'Error: Provider or model not set' });
            return;
          }
          
          // Process the form data with OpenAI API
           let fieldValues;
          if(result.provider === Providers.OPENAI){
            fieldValues = await processWithOpenAI(formData, result.apiKey, result.model);
          }else{
            sendResponse({ 
              success: false, 
              error: 'Error; Unsupported Provider' 
            });
          }
          sendResponse({ success: true, fieldValues });
        } catch (error) {
          console.error('Error processing form fields:', error);
          sendResponse({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      });
      
      return true; // Required for async sendResponse
    }
  });
  
  // Function to process form fields with OpenAI
  async function processWithOpenAI(formData: any, apiKey: string, model:string) {
    const url = 'https://api.openai.com/v1/chat/completions';

    const prompt = `
      I need realistic data for a form with the following fields. 
      For each field, analyze the field name, type, and any context clues to generate appropriate values.
      
      Form fields:
      ${JSON.stringify(formData, null, 2)}
      
      Please respond with a JSON object where the keys are the field IDs and the values are appropriate 
      realistic values for each field. Make sure the values match the expected format for each field type.
    `;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates realistic form data for testing purposes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      })
    });

    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error calling OpenAI API');
    }
    
    const result = await response.json();
    try {
      // Parse the content from the AI response
      return JSON.parse(result.choices[0].message.content);
    } catch (error) {
      throw new Error('Failed to parse AI response');
    }
  }