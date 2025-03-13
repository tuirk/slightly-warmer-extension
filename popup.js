// DOM Elements
const apiKeyInput = document.getElementById('apiKey');
const saveApiKeyButton = document.getElementById('saveApiKey');
const writingStyleInput = document.getElementById('writingStyle');
const useEmojisCheckbox = document.getElementById('useEmojis');
const bannedWordsInput = document.getElementById('bannedWords');
const saveSettingsButton = document.getElementById('saveSettings');
const statusDiv = document.getElementById('status');

// Load saved settings
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['apiKey', 'writingStyle', 'useEmojis', 'bannedWords'], (result) => {
    if (result.apiKey) apiKeyInput.value = result.apiKey;
    if (result.writingStyle) writingStyleInput.value = result.writingStyle;
    if (result.useEmojis !== undefined) useEmojisCheckbox.checked = result.useEmojis;
    if (result.bannedWords) bannedWordsInput.value = result.bannedWords;
  });
});

// Save API Key
saveApiKeyButton.addEventListener('click', () => {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    showStatus('Please enter an API key', 'error');
    return;
  }

  chrome.storage.local.set({ apiKey }, () => {
    showStatus('API key saved successfully', 'success');
  });
});

// Save Settings
saveSettingsButton.addEventListener('click', () => {
  const settings = {
    writingStyle: writingStyleInput.value.trim(),
    useEmojis: useEmojisCheckbox.checked,
    bannedWords: bannedWordsInput.value.trim()
  };

  chrome.storage.local.set(settings, () => {
    showStatus('Settings saved successfully', 'success');
  });
});

// Helper function to show status messages
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  setTimeout(() => {
    statusDiv.className = 'status';
  }, 3000);
} 