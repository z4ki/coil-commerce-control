import { builder } from '@builder.io/react';

// Initialize the Builder instance with your public API key
export const initBuilder = (apiKey: string) => {
  builder.init(apiKey);
};

// Fetch a template by ID
export const getTemplate = async (templateId: string) => {
  try {
    const template = await builder.get('invoice-template', {
      query: {
        id: templateId
      }
    }).promise();

    return template;
  } catch (error) {
    console.error('Error fetching Builder.io template:', error);
    return null;
  }
};

// Register custom components
export const registerComponents = () => {
  builder.registerComponent(
    // Your existing InvoiceTemplate component registration here
    // This will be needed if you want to use your components in the Builder.io editor
  );
}; 