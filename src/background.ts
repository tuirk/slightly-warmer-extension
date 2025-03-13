/// <reference types="chrome"/>

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'slightly-warmer',
    title: 'Generate Response with Slightly Warmer',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener(async (
  info: chrome.contextMenus.OnClickData,
  tab: chrome.tabs.Tab | undefined
) => {
  if (info.menuItemId === 'slightly-warmer' && info.selectionText) {
    const apiKey = await chrome.storage.local.get('apiKey');
    
    if (!apiKey.apiKey) {
      // Send message to content script to show a notification
      chrome.tabs.sendMessage(tab?.id || 0, {
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'error',
          title: 'API Key Missing',
          message: 'Please set up your OpenAI API key in the extension settings.'
        }
      } as ChromeMessage);
      return;
    }

    try {
      // Send message to content script to show loading state
      chrome.tabs.sendMessage(tab?.id || 0, {
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'loading',
          title: 'Generating Response',
          message: 'Please wait while we generate your response...'
        }
      } as ChromeMessage);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that generates warm, friendly, and engaging social media responses.'
            },
            {
              role: 'user',
              content: `Generate a warm and friendly response to this social media post: "${info.selectionText}"`
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      const data = await response.json();
      const generatedResponse = data.choices[0].message.content;

      // Send the generated response to the content script
      chrome.tabs.sendMessage(tab?.id || 0, {
        type: 'SHOW_RESPONSE',
        payload: {
          response: generatedResponse
        }
      } as ChromeMessage);
    } catch (error) {
      // Send error message to content script
      chrome.tabs.sendMessage(tab?.id || 0, {
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'error',
          title: 'Error',
          message: 'Failed to generate response. Please try again.'
        }
      } as ChromeMessage);
    }
  }
}); 