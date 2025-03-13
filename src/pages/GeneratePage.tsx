import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Copy, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface GeneratePageProps {
  onSettings: () => void;
}

interface StyleAnalysis {
  timestamp: number;
  analysis: string;
  sourceFiles: string[];
}

interface Settings {
  toneMethod: string;
  writingStyle: string;
  enableEmoji: boolean;
  bannedWords: string;
  styleAnalysis?: StyleAnalysis;
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

const GeneratePage = ({ onSettings }: GeneratePageProps) => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasPersonalTone, setHasPersonalTone] = useState(false);

  // Check if personal tone is set
  useEffect(() => {
    const settingsStr = localStorage.getItem('settings');
    const settings: Settings = settingsStr ? JSON.parse(settingsStr) : {};
    
    // Check if either writingStyle or styleAnalysis exist
    const hasStyle = settings.writingStyle && settings.writingStyle.trim() !== '';
    const hasAnalysis = settings.styleAnalysis && settings.styleAnalysis.analysis;
    
    setHasPersonalTone(hasStyle || !!hasAnalysis);
  }, []);

  const constructPrompt = (content: string, settings: Settings): string => {
    const parts: string[] = [];

    // 1. Static Instructions
    parts.push(`
Generate a LinkedIn comment that sounds like a real person engaging authentically. Keep it conversational, concise, and natural—like something you'd actually type, not a corporate press release. Never summarize or restate what's in the original post. Instead, add a genuine thought, a light observation, or a relevant question to contribute to the discussion. Avoid overly formal, polished, or cliché phrases like 'fascinating insights' or 'exciting times ahead.' Prioritize clarity over fluff, and keep the tone warm and approachable. If the post is insightful, acknowledge it without excessive enthusiasm. If relevant, add a short personal perspective, question, or light humor to make it more engaging.
    `.trim());

    // 2. Personal Tone Instructions
    if (settings.toneMethod === 'upload' && settings.styleAnalysis?.analysis) {
      parts.push(`\nWrite in the following style: ${settings.styleAnalysis.analysis}`);
    } else if (settings.toneMethod === 'manual' && settings.writingStyle) {
      parts.push(`\nWrite in the following style: ${settings.writingStyle}`);
    }

    // 3. Banned Words
    if (settings.bannedWords?.trim()) {
      const bannedWordsList = settings.bannedWords
        .split(',')
        .map(word => word.trim())
        .filter(word => word.length > 0)
        .join(', ');
      parts.push(`\nDo not use these words: ${bannedWordsList}`);
    }

    // 4. Emoji Preference
    if (settings.enableEmoji) {
      parts.push('\nFeel free to include appropriate emojis in your response');
    } else {
      parts.push('\nDo not use any emojis in your response');
    }

    // 5. The actual content to respond to
    parts.push(`\nContent to respond to:\n"${content}"`);

    // 6. Final instruction
    parts.push('\nProvide a natural, engaging response to this content:');

    return parts.join('\n');
  };

  const generateResponse = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to generate a response",
        variant: "destructive",
      });
      return;
    }

    if (!hasPersonalTone) {
      toast({
        title: "Error",
        description: "Please set up your personal tone in Settings first",
        variant: "destructive",
      });
      onSettings();
      return;
    }

    setIsGenerating(true);
    
    try {
      // Get settings and API key from localStorage
      const settingsStr = localStorage.getItem('settings');
      const settings: Settings = settingsStr ? JSON.parse(settingsStr) : {};
      const apiKey = localStorage.getItem('apiKey');

      if (!apiKey) {
        toast({
          title: "Error",
          description: "API key not found. Please add your API key in settings",
          variant: "destructive",
        });
        onSettings();
        return;
      }
      
      // Construct the complete prompt
      const prompt = constructPrompt(inputText, settings);
      
      // Make the API call
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an AI assistant that helps write engaging social media responses."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 100 // Limit to ~75 words
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Invalid API Key",
            description: "Please check your API key in settings",
            variant: "destructive"
          });
          onSettings();
          return;
        }
        throw new Error('Failed to generate response');
      }

      const data: OpenAIResponse = await response.json();
      const generatedText = data.choices[0].message.content.trim();
      
      // Store the response
      setGeneratedResponse(generatedText);
      setOutputText(generatedText);
      
      toast({
        title: "Success",
        description: "Response generated successfully",
      });
    } catch (error) {
      console.error('Error generating response:', error);
      toast({
        title: "Error",
        description: "Failed to generate response. Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedResponse);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  return (
    <div className="w-[400px] h-[500px] p-6 bg-white overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-[#7E69AB] rounded-xl mr-3 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">SW</span>
          </div>
          <h1 className="text-xl font-bold text-[#7E69AB]">Slightly Warmer</h1>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onSettings}
          className="text-[#7E69AB] hover:bg-[#7E69AB]/10"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="mb-6">
        <label htmlFor="inputText" className="block mb-2 text-sm font-medium text-[#7E69AB]">
          Paste content from social media
        </label>
        <Textarea
          id="inputText"
          placeholder="Paste the content you want to respond to..."
          className="min-h-28 border-[#7E69AB]/30 focus-visible:ring-[#7E69AB]"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
      </div>
      
      <Button 
        className="w-full mb-6 bg-[#7E69AB] hover:bg-[#6E59A5]" 
        onClick={generateResponse}
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Generate Comment'}
      </Button>
      
      {outputText && (
        <div className="mt-6">
          <label htmlFor="outputText" className="block mb-2 text-sm font-medium text-[#7E69AB]">
            Generated Comment
          </label>
          <p className="text-sm text-[#7E69AB]/70 mb-2">Here's my response:</p>
          <Textarea
            id="outputText"
            className="min-h-28 mb-4 border-[#7E69AB]/30 focus-visible:ring-[#7E69AB]"
            value={outputText}
            readOnly
          />
          
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              onClick={generateResponse}
              disabled={isGenerating}
              className="flex-1 border-[#7E69AB]/30 text-[#7E69AB] hover:bg-[#7E69AB]/10 hover:text-[#7E69AB]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={copyToClipboard}
              className="flex-1 bg-[#7E69AB] hover:bg-[#6E59A5]"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratePage; 