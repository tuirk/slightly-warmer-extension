/// <reference types="chrome"/>

interface MessagePayload {
  type: 'success' | 'error';
  message: string;
  response?: string;
}

interface Message {
  action: 'showNotification' | 'showResponse';
  payload: MessagePayload;
}

function createResponseContainer() {
  const container = document.createElement('div');
  container.id = 'slightly-warmer-response';
  container.className = 'fixed bottom-4 right-4 bg-white rounded-lg shadow-lg max-w-md z-50';
  document.body.appendChild(container);
  return container;
}

let responseContainer = createResponseContainer();

// Handle messages from the background script
chrome.runtime.onMessage.addListener((message: Message) => {
  if (message.action === 'showNotification') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: message.payload.type === 'error' ? 'Error' : 'Success',
      message: message.payload.message
    });
  }

  if (message.action === 'showResponse' && message.payload.response) {
    responseContainer.innerHTML = `
      <div class="p-4">
        <div class="text-sm font-medium mb-2">Generated Response:</div>
        <div class="text-sm text-gray-600">${message.payload.response}</div>
        <div class="mt-4 flex justify-end">
          <button class="copy-btn px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">
            Copy
          </button>
        </div>
      </div>
    `;

    const copyBtn = responseContainer.querySelector('.copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        if (message.payload.response) {
          navigator.clipboard.writeText(message.payload.response).then(() => {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: chrome.runtime.getURL('icons/icon48.png'),
              title: 'Success',
              message: 'Response copied to clipboard!'
            });
          });
        }
      });
    }
  }

  return true;
}); 