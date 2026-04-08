import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageIcon, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function ImageGen() {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1K');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: size,
          }
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          const imageUrl = `data:image/png;base64,${base64EncodeString}`;
          setGeneratedImage(imageUrl);
          toast.success('Image generated successfully!');
          break;
        }
      }
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `proscanner-img-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <h2 className="text-3xl font-bold mb-6">Product Image Generator</h2>
      <p className="text-gray-600 mb-8 max-w-2xl">
        Generate high-quality product images, promotional banners, or marketing materials for your store using AI.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Generation Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="prompt">Image Description</Label>
                <Input 
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. A professional photo of a modern coffee cup on a wooden table" 
                  className="h-20 items-start pt-2"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Resolution Size</Label>
                <div className="flex gap-2">
                  {['1K', '2K', '4K'].map((s) => (
                    <Button
                      key={s}
                      type="button"
                      variant={size === s ? 'default' : 'outline'}
                      className={size === s ? 'bg-indigo-600' : ''}
                      onClick={() => setSize(s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Aspect Ratio</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['1:1', '4:3', '16:9', '3:4', '9:16'].map((ratio) => (
                    <Button
                      key={ratio}
                      type="button"
                      variant={aspectRatio === ratio ? 'default' : 'outline'}
                      className={aspectRatio === ratio ? 'bg-indigo-600' : ''}
                      onClick={() => setAspectRatio(ratio)}
                    >
                      {ratio}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg"
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          <CardHeader className="border-b bg-gray-50 flex flex-row items-center justify-between py-4">
            <CardTitle>Preview</CardTitle>
            {generatedImage && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1 p-6 flex items-center justify-center bg-gray-100 min-h-[400px]">
            {isGenerating ? (
              <div className="flex flex-col items-center text-gray-500">
                <Loader2 className="w-12 h-12 animate-spin mb-4 text-indigo-600" />
                <p>Creating your image... This may take a few moments.</p>
              </div>
            ) : generatedImage ? (
              <img 
                src={generatedImage} 
                alt="Generated" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-md"
              />
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                <p>Your generated image will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
