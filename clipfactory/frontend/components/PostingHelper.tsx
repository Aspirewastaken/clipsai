/**
 * Posting Helper - Phase 5
 * Upload screenshot → Generate title based on account type
 */
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiImage, FiCopy, FiCheck } from 'react-icons/fi';
import { motion } from 'framer-motion';
import axios from 'axios';

interface PostingHelperProps {
  accountType?: 'fan' | 'brand' | 'watermark';
}

export default function PostingHelper({ accountType = 'fan' }: PostingHelperProps) {
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedAccountType, setSelectedAccountType] = useState(accountType);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setScreenshot(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setScreenshotPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Auto-generate title
    generateTitle(file, selectedAccountType);
  }, [selectedAccountType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1,
  });

  const generateTitle = async (file: File, accType: string) => {
    setIsGenerating(true);

    const formData = new FormData();
    formData.append('screenshot', file);
    formData.append('account_type', accType);

    try {
      const response = await axios.post('/api/phase5/screenshot-to-title', formData);

      setGeneratedTitle(response.data.title);
    } catch (error) {
      console.error('Title generation failed:', error);
      setGeneratedTitle('Failed to generate title');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyTitle = () => {
    navigator.clipboard.writeText(generatedTitle);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAccountTypeChange = (type: 'fan' | 'brand' | 'watermark') => {
    setSelectedAccountType(type);
    if (screenshot) {
      generateTitle(screenshot, type);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Posting Helper</h2>
        <p className="text-gray-600 mt-2">Upload screenshot → Generate title</p>
      </div>

      {/* Account Type Selection */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Account Type</h3>

        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => handleAccountTypeChange('fan')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedAccountType === 'fan'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">Fan Account</div>
            <div className="text-sm text-gray-600 mt-1">
              Casual, excited, emojis
            </div>
            <div className="text-xs text-gray-500 mt-2 italic">
              "bro was STRUGGLING 💀"
            </div>
          </button>

          <button
            onClick={() => handleAccountTypeChange('brand')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedAccountType === 'brand'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">Brand Account</div>
            <div className="text-sm text-gray-600 mt-1">
              Professional, inspiring
            </div>
            <div className="text-xs text-gray-500 mt-2 italic">
              "Elite Training Techniques"
            </div>
          </button>

          <button
            onClick={() => handleAccountTypeChange('watermark')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedAccountType === 'watermark'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">Watermark Account</div>
            <div className="text-sm text-gray-600 mt-1">
              Fan commentary style
            </div>
            <div className="text-xs text-gray-500 mt-2 italic">
              "the way he crushed this tho 🔥"
            </div>
          </button>
        </div>
      </div>

      {/* Screenshot Upload */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Screenshot</h3>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />

          <FiImage className="w-16 h-16 mx-auto text-gray-400 mb-4" />

          {isDragActive ? (
            <p className="text-lg text-purple-600 font-semibold">Drop screenshot here...</p>
          ) : (
            <div>
              <p className="text-lg text-gray-700 font-semibold mb-2">
                Drop screenshot or click to browse
              </p>
              <p className="text-sm text-gray-500">
                PNG, JPG, JPEG
              </p>
            </div>
          )}
        </div>

        {/* Screenshot Preview */}
        {screenshotPreview && (
          <div className="mt-6">
            <img
              src={screenshotPreview}
              alt="Screenshot preview"
              className="w-full h-64 object-contain rounded-lg border border-gray-200"
            />
          </div>
        )}
      </div>

      {/* Generated Title */}
      {(generatedTitle || isGenerating) && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Generated Title</h3>

          {isGenerating ? (
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
              <span className="text-gray-600">Generating title...</span>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="relative p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
                <div className="text-xl font-semibold text-gray-900 mb-4">
                  {generatedTitle}
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={copyTitle}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors"
                  >
                    {isCopied ? (
                      <>
                        <FiCheck className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <FiCopy className="w-4 h-4" />
                        <span>Copy Title</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => screenshot && generateTitle(screenshot, selectedAccountType)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                <p><strong>Account Type:</strong> {selectedAccountType}</p>
                <p className="mt-1"><strong>Style:</strong> {
                  selectedAccountType === 'fan' ? 'Casual fan reaction' :
                  selectedAccountType === 'brand' ? 'Professional brand voice' :
                  'Fan commentary'
                }</p>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Quick Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Screenshot the variation you want to post</li>
          <li>• Select the account type you're posting to</li>
          <li>• Generated title matches account style automatically</li>
          <li>• Copy and paste into your posting queue</li>
        </ul>
      </div>
    </div>
  );
}
