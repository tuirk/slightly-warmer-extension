import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

interface ConnectApiPageProps {
  onBack: () => void;
  onComplete: () => void;
}

const ConnectApiPage = ({ onBack, onComplete }: ConnectApiPageProps) => {
  const [key, setKey] = useState(() => localStorage.getItem('apiKey') || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      toast({
        title: "Error",
        description: "Please enter your API key",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Store the API key
      localStorage.setItem('apiKey', key);
      
      toast({
        title: "Success",
        description: "API key saved successfully",
      });
      
      onComplete(); // Navigate to next page
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-[400px] h-[500px] p-6 bg-white">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          className="mr-2 text-[#8E9196] hover:bg-[#8E9196]/10"
          title="Go Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-[#8E9196]">Manage API Key</h1>
      </div>
      
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-[#8E9196] rounded-xl mb-4 flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-lg">SW</span>
        </div>
        <p className="mt-2 text-gray-600 text-center">
          To use Slightly Warmer, please connect your OpenAI API key
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
            OpenAI API Key
          </label>
          <Input
            id="apiKey"
            type="password"
            placeholder="sk-..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full border-[#8E9196]/30 focus-visible:ring-[#7E69AB]"
          />
          <p className="text-xs text-gray-500">
            Your API key is stored locally and never sent to our servers.
          </p>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-[#7E69AB] hover:bg-[#6E59A5]" 
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save API Key'}
        </Button>
      </form>
    </div>
  );
};

export default ConnectApiPage; 