import { useState } from 'react';
import WelcomePage from './pages/WelcomePage';
import ConnectApiPage from './pages/ConnectApiPage';
import SettingsPage from './pages/SettingsPage';
import GeneratePage from './pages/GeneratePage';
import { Toaster } from './components/ui/toaster';

function App() {
  const [currentPage, setCurrentPage] = useState<'welcome' | 'connect' | 'settings' | 'generate'>('welcome');

  const handleComplete = () => {
    setCurrentPage('connect');
  };

  const handleBack = () => {
    setCurrentPage('welcome');
  };

  const handleApiKeyComplete = () => {
    // If the user already had settings, go to generate page
    // otherwise go to settings page to set up preferences
    const hasSettings = localStorage.getItem('settings');
    setCurrentPage(hasSettings ? 'generate' : 'settings');
  };

  const handleSettingsBack = () => {
    setCurrentPage('connect');
  };

  const handleSettingsComplete = () => {
    setCurrentPage('generate');
  };

  const handleGenerateSettings = () => {
    setCurrentPage('settings');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentPage === 'welcome' && (
        <WelcomePage
          onComplete={handleComplete}
        />
      )}
      {currentPage === 'connect' && (
        <ConnectApiPage
          onBack={handleBack}
          onComplete={handleApiKeyComplete}
        />
      )}
      {currentPage === 'settings' && (
        <SettingsPage
          onBack={handleSettingsBack}
          onComplete={handleSettingsComplete}
        />
      )}
      {currentPage === 'generate' && (
        <GeneratePage
          onSettings={handleGenerateSettings}
        />
      )}
      <Toaster />
    </div>
  );
}

export default App; 