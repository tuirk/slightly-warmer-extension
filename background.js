// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'generateResponse',
    title: 'Generate Response with Slightly Warmer',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'generateResponse') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'generateResponse',
      text: info.selectionText
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateAIResponse') {
    generateResponse(request.text, request.settings)
      .then(response => sendResponse({ success: true, response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required for async response
  }
});

// Generate response using OpenAI API
async function generateResponse(text, settings) {
  // Get API key from storage
  const { apiKey } = await chrome.storage.local.get(['apiKey']);
  
  if (!apiKey) {
    throw new Error('API key not set. Please set your OpenAI API key in the extension settings.');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that generates personalized social media responses.
                     Writing style: ${settings.writingStyle || 'natural and friendly'}
                     Use emojis: ${settings.useEmojis ? 'yes' : 'no'}
                     Banned words: ${settings.bannedWords || 'none'}`
          },
          {
            role: 'user',
            content: `Generate a response to this social media post: "${text}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate response. Please check your API key and try again.');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
} 