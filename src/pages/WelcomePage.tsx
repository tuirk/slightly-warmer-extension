import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Info, Key } from 'lucide-react';

interface WelcomePageProps {
  onComplete: () => void;
}

const WelcomePage = ({ onComplete }: WelcomePageProps) => {
  const goToAbout = () => {
    window.open('https://github.com/tuirk/api-key-mingle', '_blank');
    toast({
      title: "About",
      description: "Opening project page in new tab",
    });
  };

  return (
    <div className="w-[400px] h-[500px] p-6 bg-white">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-[#8E9196] rounded-xl mb-4 flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-xl">SW</span>
        </div>
        <h1 className="text-2xl font-bold text-[#8E9196]">Slightly Warmer</h1>
        <p className="mt-2 text-gray-600 text-center">
          Welcome to Slightly Warmer, the tool that helps you craft slightly warmer responses on social media.
        </p>
      </div>
      
      <div className="space-y-4">
        <Button 
          onClick={goToAbout}
          className="w-full flex items-center justify-center bg-[#7E69AB] hover:bg-[#6E59A5]"
        >
          <Info className="h-5 w-5 mr-2" />
          About
        </Button>
        
        <Button 
          onClick={onComplete}
          variant="outline"
          className="w-full flex items-center justify-center border-[#8E9196]/30 text-[#8E9196] hover:bg-[#8E9196]/10 hover:text-[#7E69AB]"
        >
          <Key className="h-5 w-5 mr-2" />
          Connect API Key
        </Button>
      </div>
    </div>
  );
};

export default WelcomePage; 