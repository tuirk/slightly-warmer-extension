import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Upload, Settings, Smile, Save, Key, X, RefreshCw, AlertTriangle, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content?: string; // Added for file content
}

interface StyleAnalysis {
  timestamp: number;
  analysis: string;
  sourceFiles: string[];
}

interface SettingsPageProps {
  onBack: () => void;
  onComplete: () => void;
}

const SettingsPage = ({ onBack, onComplete }: SettingsPageProps) => {
  const [toneMethod, setToneMethod] = useState<string>('manual');
  const [writingStyle, setWritingStyle] = useState<string>('');
  const [enableEmoji, setEnableEmoji] = useState<boolean>(false);
  const [bannedWords, setBannedWords] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [styleAnalysis, setStyleAnalysis] = useState<StyleAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Load saved settings on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setToneMethod(settings.toneMethod || 'manual');
      setWritingStyle(settings.writingStyle || '');
      setEnableEmoji(settings.enableEmoji || false);
      setBannedWords(settings.bannedWords || '');
      setStyleAnalysis(settings.styleAnalysis || null);
      
      // Load uploaded files if they exist
      if (settings.uploadedFiles && settings.uploadedFiles.length > 0) {
        setUploadedFiles(settings.uploadedFiles);
      }
    }
  }, []);

  // Auto-save writing style as user types
  useEffect(() => {
    if (toneMethod === 'manual' && writingStyle.trim() !== '') {
      const currentSettings = localStorage.getItem('settings');
      const settings = currentSettings ? JSON.parse(currentSettings) : {};
      
      const updatedSettings = {
        ...settings,
        writingStyle,
        toneMethod
      };
      
      localStorage.setItem('settings', JSON.stringify(updatedSettings));
    }
  }, [writingStyle, toneMethod]);

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const analyzeFiles = async (files: File[]) => {
    setIsAnalyzing(true);
    try {
      // Read all files
      const fileContents = await Promise.all(files.map(readFileContent));
      const combinedContent = fileContents.join('\n\n');
      
      // Get API key
      const apiKey = localStorage.getItem('apiKey');
      if (!apiKey) {
        toast({
          title: "Error",
          description: "API key not found. Please add your API key first",
          variant: "destructive",
        });
        onBack();
        return;
      }

      // Make OpenAI API call
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
              content: "You are an expert in analyzing writing styles. Analyze the provided text and describe the writing style in a way that can be used as instructions to replicate it. Focus on tone, formality, sentence structure, word choice, and any unique characteristics."
            },
            {
              role: "user",
              content: `Analyze the writing style in the following text and provide a concise summary that captures the key characteristics:\n\n${combinedContent}`
            }
          ],
          temperature: 0.7,
          max_tokens: 200 // Limit analysis length
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Invalid API Key",
            description: "Please check your API key",
            variant: "destructive"
          });
          onBack();
          return;
        }
        throw new Error('Failed to analyze writing style');
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content.trim();
      
      const analysis: StyleAnalysis = {
        timestamp: Date.now(),
        analysis: analysisText,
        sourceFiles: files.map(f => f.name)
      };
      
      setStyleAnalysis(analysis);
      
      // Save to localStorage
      const currentSettings = localStorage.getItem('settings');
      const settings = currentSettings ? JSON.parse(currentSettings) : {};
      
      const updatedSettings = {
        ...settings,
        styleAnalysis: analysis
      };
      
      localStorage.setItem('settings', JSON.stringify(updatedSettings));
      
      toast({
        title: "Analysis Complete",
        description: "Writing style has been analyzed successfully",
      });
    } catch (error) {
      console.error('Error analyzing files:', error);
      toast({
        title: "Error",
        description: "Failed to analyze writing style",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: File[] = Array.from(e.target.files);
      const invalidFiles = newFiles.filter(
        file => file.size > 1048576 || 
        !['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        .includes(file.type)
      );

      if (invalidFiles.length > 0) {
        toast({
          title: "Error",
          description: "Some files exceeded size limit or were not in PDF/DOC/DOCX format",
          variant: "destructive",
        });
        return;
      }

      const newUploadedFiles: UploadedFile[] = newFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }));
      
      setUploadedFiles(newUploadedFiles);
      
      // Save files to localStorage
      const currentSettings = localStorage.getItem('settings');
      const settings = currentSettings ? JSON.parse(currentSettings) : {};
      
      const updatedSettings = {
        ...settings,
        uploadedFiles: newUploadedFiles,
        hasUploadedFile: true,
        toneMethod: 'upload'
      };
      
      localStorage.setItem('settings', JSON.stringify(updatedSettings));
      setToneMethod('upload');
      
      // Analyze the files
      await analyzeFiles(newFiles);
      
      toast({
        title: "Success",
        description: `${newFiles.length} file(s) uploaded`,
      });
    }
  };

  const handleDeleteFile = (index: number) => {
    const updatedFiles = [...uploadedFiles];
    updatedFiles.splice(index, 1);
    setUploadedFiles(updatedFiles);
    
    // Update localStorage
    const currentSettings = localStorage.getItem('settings');
    const settings = currentSettings ? JSON.parse(currentSettings) : {};
    
    const updatedSettings = {
      ...settings,
      uploadedFiles: updatedFiles,
      hasUploadedFile: updatedFiles.length > 0,
      styleAnalysis: updatedFiles.length > 0 ? settings.styleAnalysis : null
    };
    
    localStorage.setItem('settings', JSON.stringify(updatedSettings));
    
    if (updatedFiles.length === 0) {
      setStyleAnalysis(null);
    }
    
    toast({
      title: "File Removed",
      description: "File has been removed successfully",
    });
  };

  const handleToneMethodChange = (value: string) => {
    if (value) {
      setToneMethod(value);
      
      // Update settings when tone method changes
      const currentSettings = localStorage.getItem('settings');
      const settings = currentSettings ? JSON.parse(currentSettings) : {};
      
      const updatedSettings = {
        ...settings,
        toneMethod: value
      };
      
      localStorage.setItem('settings', JSON.stringify(updatedSettings));
    }
  };

  const handleSave = () => {
    // Validate that either a file is uploaded or writing style is provided
    if (toneMethod === 'upload' && uploadedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please upload a writing sample",
        variant: "destructive",
      });
      return;
    }

    if (toneMethod === 'manual' && !writingStyle.trim()) {
      toast({
        title: "Error",
        description: "Please describe your writing style",
        variant: "destructive",
      });
      return;
    }

    // Save settings to localStorage
    const settings = {
      toneMethod,
      writingStyle,
      enableEmoji,
      bannedWords,
      hasUploadedFile: uploadedFiles.length > 0,
      uploadedFiles
    };
    
    localStorage.setItem('settings', JSON.stringify(settings));
    
    toast({
      title: "Success",
      description: "Settings saved successfully",
    });
    
    onComplete();
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    // Clear all settings
    localStorage.removeItem('settings');
    localStorage.removeItem('apiKey');
    
    toast({
      title: "Reset Complete",
      description: "All settings have been reset",
    });
    
    onBack();
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  return (
    <div className="w-[400px] h-[500px] p-6 bg-white overflow-y-auto">
      {/* Top Banner with App Logo */}
      <div className="flex items-center justify-center mb-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-[#8E9196] rounded-xl mb-2 mx-auto flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xl">SW</span>
          </div>
          <h1 className="text-xl font-bold text-[#8E9196]">Slightly Warmer</h1>
        </div>
      </div>
      
      {showResetConfirm && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center text-red-600 mb-2">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <h3 className="font-semibold">Reset All Settings?</h3>
          </div>
          <p className="text-sm text-red-600 mb-4">
            This will reset all your settings, uploaded files, and API key. You will need to set up everything again.
          </p>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={cancelReset}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={confirmReset}
            >
              Reset Everything
            </Button>
          </div>
        </div>
      )}
      
      <div className="mb-8">
        <div className="flex items-center text-[#8E9196] mb-4">
          <Upload className="h-5 w-5 mr-2" />
          <h2 className="text-lg font-semibold">Personal Tone</h2>
        </div>
        
        <ToggleGroup 
          type="single" 
          value={toneMethod}
          onValueChange={handleToneMethodChange}
          className="grid grid-cols-2 gap-2 mb-4"
        >
          <ToggleGroupItem value="upload" className="bg-white text-[#8E9196] data-[state=on]:bg-[#8E9196]/10 data-[state=on]:text-[#7E69AB]">
            Upload Writing Samples
          </ToggleGroupItem>
          <ToggleGroupItem value="manual" className="bg-white text-[#8E9196] data-[state=on]:bg-[#8E9196]/10 data-[state=on]:text-[#7E69AB]">
            Define Manually
          </ToggleGroupItem>
        </ToggleGroup>
        
        {toneMethod === 'upload' ? (
          <div>
            <div className="relative border-2 border-dashed border-[#8E9196]/30 rounded-md p-6 text-center mb-4">
              <Upload className="h-6 w-6 mx-auto text-[#8E9196] mb-2" />
              <p className="font-medium text-gray-700">Upload writing samples</p>
              <p className="text-sm text-gray-500 mb-2">Drag & drop or click to browse</p>
              <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 1MB</p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isAnalyzing}
              />
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className="border rounded-md p-3 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Uploaded files:</p>
                <ul className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <li key={index} className="flex justify-between items-center text-sm">
                      <span className="truncate mr-2">{file.name}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteFile(index)}
                        className="h-6 w-6 p-0"
                        disabled={isAnalyzing}
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center p-4 border rounded-md mb-4">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-[#7E69AB] border-t-transparent rounded-full mb-2"></div>
                <p className="text-sm text-[#7E69AB]">Analyzing writing style...</p>
              </div>
            )}

            {styleAnalysis && (
              <div className="border rounded-md p-3 mb-4">
                <div className="flex items-center mb-2">
                  <FileText className="h-4 w-4 text-[#7E69AB] mr-2" />
                  <p className="text-sm font-medium text-gray-700">Writing Style Analysis</p>
                </div>
                <div className="bg-gray-50 rounded p-3 mb-2">
                  <p className="text-sm text-gray-600">{styleAnalysis.analysis}</p>
                </div>
                <p className="text-xs text-gray-500">
                  Analyzed {styleAnalysis.sourceFiles.length} file(s) • 
                  {new Date(styleAnalysis.timestamp).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        ) : (
          <Textarea
            placeholder="Describe your writing style in a few sentences. Consider aspects like tone, formality, sentence length, and word choice."
            className="h-32 border-[#8E9196]/30 focus-visible:ring-[#7E69AB]"
            value={writingStyle}
            onChange={(e) => setWritingStyle(e.target.value)}
          />
        )}
      </div>
      
      <div className="mb-8">
        <div className="flex items-center text-[#8E9196] mb-4">
          <Settings className="h-5 w-5 mr-2" />
          <h2 className="text-lg font-semibold">Preferences</h2>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Smile className="h-5 w-5 mr-2 text-gray-700" />
            <div>
              <p className="font-medium text-gray-700">Enable Emoji Suggestions</p>
              <p className="text-xs text-gray-500">Allow the extension to suggest emojis while generating comments</p>
            </div>
          </div>
          <Switch
            checked={enableEmoji}
            onCheckedChange={setEnableEmoji}
            className="data-[state=checked]:bg-[#7E69AB]"
          />
        </div>
      </div>
      
      <div className="mb-8">
        <p className="font-medium text-gray-700 mb-2">Banned Words</p>
        <Input
          placeholder="Enter words separated by commas"
          value={bannedWords}
          onChange={(e) => setBannedWords(e.target.value)}
          className="border-[#8E9196]/30 focus-visible:ring-[#7E69AB]"
        />
      </div>
      
      {/* Navigation and Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Button 
          variant="outline"
          className="border-[#8E9196]/30 text-[#8E9196] hover:bg-[#8E9196]/10 hover:text-[#7E69AB]"
          onClick={onBack}
        >
          <Key className="h-5 w-5 mr-2" />
          Manage API Key
        </Button>
        
        <Button 
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50"
          onClick={handleReset}
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          Reset All
        </Button>
      </div>
      
      <Button 
        className="w-full bg-[#7E69AB] hover:bg-[#6E59A5]" 
        onClick={handleSave}
      >
        <Save className="h-5 w-5 mr-2" />
        Save
      </Button>
    </div>
  );
};

export default SettingsPage; 