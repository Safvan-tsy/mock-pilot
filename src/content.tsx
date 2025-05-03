// Content script runs in the context of web pages
// It analyzes and manipulates the DOM

import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Define interfaces for our form field analysis
interface FormField {
  id: string;
  name: string; // Name attribute or derived from label
  type: string; // Input type or element type (select, textarea)
  label?: string; // Text of associated label if found
  placeholder?: string; // Placeholder text if any
  options?: string[]; // For select elements
  required?: boolean;
  pattern?: string; // HTML5 pattern attribute
  tooltip?: string; // Title attribute or aria-description
  context?: string; // Nearby headings or section context
}

let isEnabled = false;

// Initialize when content script loads
initialize();

function initialize() {
  // Check if extension is enabled
  chrome.storage.sync.get(['isEnabled'], (result) => {
    isEnabled = result.isEnabled === true;
    
    if (isEnabled) {
      injectUI();
    }
  });
  
  // Listen for messages from popup or background script
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'toggleExtension') {
      isEnabled = message.isEnabled;
      
      if (isEnabled) {
        injectUI();
      } else {
        removeUI();
      }
      sendResponse({ success: true });
    }
    
    if (message.action === 'fillForm') {
      if (isEnabled) {
        fillCurrentForm()
          .then(result => sendResponse({ success: true, result }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Indicates async response
      } else {
        sendResponse({ success: false, error: 'Extension is disabled' });
      }
    }
    
    return true;
  });
}

// Create and inject UI elements
function injectUI() {
  // Remove existing UI if any
  removeUI();
  
  // Create floating action button
  const fabContainer = document.createElement('div');
  fabContainer.id = 'formfill-ai-fab';
  fabContainer.style.position = 'fixed';
  fabContainer.style.bottom = '20px';
  fabContainer.style.right = '20px';
  fabContainer.style.zIndex = '9999';
  
  document.body.appendChild(fabContainer);
  
  // Use React to render the button
  const root = createRoot(fabContainer);
  root.render(
    <React.StrictMode>
      <button 
        className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-purple-700"
        onClick={fillCurrentForm}
        title="Fill form with AI generated data"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </React.StrictMode>
  );
}

// Remove UI elements
function removeUI() {
  const fab = document.getElementById('formfill-ai-fab');
  if (fab) {
    fab.remove();
  }
}

// Function to fill the current form
async function fillCurrentForm(): Promise<string> {
  try {
    // Analyze the page to find form fields
    const formFields = analyzeFormFields();
    
    if (formFields.length === 0) {
      throw new Error('No form fields found on the page');
    }
    
    // Send the form fields to the background script for processing
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: 'processFormFields', formData: formFields },
        (response) => {
          if (response && response.success) {
            // Fill the form with the generated values
            fillFormWithValues(response.fieldValues);
            resolve('Form filled successfully');
          } else {
            reject(new Error(response?.error || 'Unknown error processing form'));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error filling form:', error);
    throw error;
  }
}

// Analyze the page to find form fields and their context
function analyzeFormFields(): FormField[] {
  const formFields: FormField[] = [];
  
  // Get all input, select, and textarea elements
  const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea');
  
  inputs.forEach((element) => {
    const input = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const field: FormField = {
      id: input.id || input.name || `field-${formFields.length}`,
      name: input.name || input.id || '',
      type: input instanceof HTMLInputElement ? input.type : input.tagName.toLowerCase(),
    };
    
    // Try to find associated label
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) {
        field.label = label.textContent?.trim() || '';
      }
    } else {
      // Look for a parent label
      const parentLabel = input.closest('label');
      if (parentLabel) {
        // Get the label text but exclude the input's own text content
        const clone = parentLabel.cloneNode(true) as HTMLElement;
        const inputs = clone.querySelectorAll('input, select, textarea');
        inputs.forEach(input => input.remove());
        field.label = clone.textContent?.trim() || '';
      }
    }
    
    // Get placeholder
    if ('placeholder' in input && input.placeholder) {
      field.placeholder = input.placeholder;
    }
    
    // Get tooltip/title
    if (input.title) {
      field.tooltip = input.title;
    } else if (input.getAttribute('aria-description')) {
      field.tooltip = input.getAttribute('aria-description') || '';
    }
    
    // Check if required
    field.required = input.required;
    
    // Get pattern for text inputs
    if (input instanceof HTMLInputElement && input.pattern) {
      field.pattern = input.pattern;
    }
    
    // Get options for select elements
    if (input instanceof HTMLSelectElement) {
      field.options = Array.from(input.options).map(option => option.textContent || '');
    }
    
    // Try to get context from nearby headings
    const headings = getNearbyHeadings(input);
    if (headings.length > 0) {
      field.context = headings.join(' > ');
    }
    
    formFields.push(field);
  });
  
  return formFields;
}

// Function to find nearby headings to provide context
function getNearbyHeadings(element: Element): string[] {
  const headings: string[] = [];
  let current = element.parentElement;
  
  // Traverse up the DOM to find section headings
  while (current && current !== document.body) {
    // Check for heading elements
    const heading = current.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading && heading.textContent) {
      headings.unshift(heading.textContent.trim());
    }
    
    // Check for elements with role="heading"
    if (current.getAttribute('role') === 'heading' && current.textContent) {
      headings.unshift(current.textContent.trim());
    }
    
    // Check for section titles in common UI patterns
    const legend = current.querySelector('legend');
    if (legend && legend.textContent) {
      headings.unshift(legend.textContent.trim());
    }
    
    current = current.parentElement;
  }
  
  return headings;
}

// Fill the form with generated values
function fillFormWithValues(fieldValues: Record<string, string>): void {
  // Loop through each field and set its value
  Object.entries(fieldValues).forEach(([fieldId, value]) => {
    // Try to find the element by ID, name, or our generated ID
    let element = document.getElementById(fieldId);
    
    if (!element) {
      element = document.querySelector(`[name="${fieldId}"]`);
    }
    
    if (!element) {
      // For our generated IDs (field-0, field-1, etc.)
      const match = fieldId.match(/field-(\d+)/);
      if (match) {
        const index = parseInt(match[1], 10);
        const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea');
        element = inputs[index] as HTMLElement;
      }
    }
    
    if (element) {
      // Set the value based on the element type
      if (element instanceof HTMLInputElement) {
        if (element.type === 'checkbox' || element.type === 'radio') {
          // For checkboxes and radios, check if the value is true/false or matches the input value
          if (typeof value === 'boolean' || value === 'true' || value === 'false') {
            element.checked = typeof value === 'boolean' ? value : value === 'true';
          } else {
            element.checked = element.value === value;
          }
        } else {
          element.value = value;
        }
      } else if (element instanceof HTMLSelectElement) {
        element.value = value;
      } else if (element instanceof HTMLTextAreaElement) {
        element.value = value;
      }
      
      // Trigger events to ensure the form recognizes the change
      const events = ['input', 'change'];
      events.forEach(eventType => {
        const event = new Event(eventType, { bubbles: true });
        element?.dispatchEvent(event);
      });
    }
  });
}