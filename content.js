// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateResponse') {
    handleResponseGeneration(request.text);
  }
});

// Handle response generation
async function handleResponseGeneration(selectedText) {
  try {
    // Get settings from storage
    const settings = await new Promise((resolve) => {
      chrome.storage.local.get(['writingStyle', 'useEmojis', 'bannedWords'], resolve);
    });

    // Request response from background script
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: 'generateAIResponse',
          text: selectedText,
          settings
        },
        (response) => {
          if (response.success) {
            resolve(response.response);
          } else {
            reject(new Error(response.error));
          }
        }
      );
    });

    // Show response in floating box
    showResponseBox(response, selectedText);
  } catch (error) {
    showError(error.message);
  }
}

// Create and show response box
function showResponseBox(response, originalText) {
  // Remove existing box if present
  const existingBox = document.getElementById('slightly-warmer-response');
  if (existingBox) {
    existingBox.remove();
  }

  // Create response box
  const box = document.createElement('div');
  box.id = 'slightly-warmer-response';
  box.innerHTML = `
    <div class="sw-header">
      <span>Slightly Warmer Response</span>
      <button class="sw-close">×</button>
    </div>
    <div class="sw-content">
      <div class="sw-original">
        <strong>Original:</strong>
        <p>${originalText}</p>
      </div>
      <div class="sw-response">
        <strong>Generated Response:</strong>
        <p>${response}</p>
      </div>
      <button class="sw-copy">Copy Response</button>
    </div>
  `;

  // Add styles
  const styles = document.createElement('style');
  styles.textContent = `
    #slightly-warmer-response {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 300px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .sw-header {
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px 8px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e9ecef;
    }

    .sw-close {
      border: none;
      background: none;
      font-size: 20px;
      cursor: pointer;
      color: #495057;
    }

    .sw-content {
      padding: 12px;
    }

    .sw-original, .sw-response {
      margin-bottom: 12px;
    }

    .sw-copy {
      width: 100%;
      padding: 8px;
      background: #228be6;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .sw-copy:hover {
      background: #1c7ed6;
    }

    @media (prefers-color-scheme: dark) {
      #slightly-warmer-response {
        background: #2d3436;
        color: #f8f9fa;
      }

      .sw-header {
        background: #343a40;
        border-bottom-color: #495057;
      }

      .sw-close {
        color: #dee2e6;
      }

      .sw-copy {
        background: #339af0;
      }

      .sw-copy:hover {
        background: #228be6;
      }
    }
  `;

  // Add event listeners
  box.querySelector('.sw-close').addEventListener('click', () => box.remove());
  box.querySelector('.sw-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(response);
    const button = box.querySelector('.sw-copy');
    button.textContent = 'Copied!';
    setTimeout(() => {
      button.textContent = 'Copy Response';
    }, 2000);
  });

  // Add to page
  document.body.appendChild(styles);
  document.body.appendChild(box);
}

// Show error messages
function showError(message) {
  const error = document.createElement('div');
  error.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff6b6b;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 10000;
  `;
  error.textContent = message;
  document.body.appendChild(error);
  setTimeout(() => error.remove(), 3000);
} 