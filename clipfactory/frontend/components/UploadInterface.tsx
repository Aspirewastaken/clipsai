/**
 * Upload Interface for Phase 2
 * - Upload video for council
 * - Export to Premiere XML
 * - Re-upload edited clips
 */
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiDownload, FiCheck, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';
import axios from 'axios';

interface UploadInterfaceProps {
  onUploadComplete?: (videoId: string) => void;
}

export default function UploadInterface({ onUploadComplete }: UploadInterfaceProps) {
  const [uploadedVideo, setUploadedVideo] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [councilStatus, setCouncilStatus] = useState<'idle' | 'processing' | 'complete'>('idle');
  const [clipsFound, setClipsFound] = useState(0);

  // Dropzone for video upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await axios.post('/api/phase1/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });

      setUploadedVideo(response.data);
      setCouncilStatus('processing');

      // Poll for council status
      pollCouncilStatus(response.data.video_id);

      onUploadComplete?.(response.data.video_id);
    } catch (error) {
      console.error('Upload failed:', error);
      setIsUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.mkv', '.avi']
    },
    maxFiles: 1,
  });

  // Poll council deliberation status
  const pollCouncilStatus = async (videoId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/phase1/status/${videoId}`);
        const { status, clips_found, progress } = response.data;

        setClipsFound(clips_found);

        if (status === 'complete') {
          setCouncilStatus('complete');
          setIsUploading(false);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Status check failed:', error);
        clearInterval(interval);
      }
    }, 5000); // Check every 5 seconds
  };

  // Export to Premiere XML
  const exportToXML = async () => {
    if (!uploadedVideo) return;

    try {
      const response = await axios.post(
        `/api/phase2/export-xml/${uploadedVideo.video_id}`
      );

      // Download XML file
      const downloadUrl = response.data.download_url;
      window.location.href = downloadUrl;
    } catch (error) {
      console.error('XML export failed:', error);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Upload & Process</h2>
        <p className="text-gray-600 mt-2">Phase 1: Council Deliberation</p>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />

          <FiUpload className="w-16 h-16 mx-auto text-gray-400 mb-4" />

          {isDragActive ? (
            <p className="text-lg text-blue-600 font-semibold">Drop video here...</p>
          ) : (
            <div>
              <p className="text-lg text-gray-700 font-semibold mb-2">
                Drop video here or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports MP4, MOV, MKV, AVI • Max 2-3 hours
              </p>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Uploaded Video Info */}
        {uploadedVideo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200"
          >
            <div className="flex items-center space-x-3">
              <FiCheck className="w-6 h-6 text-green-600" />
              <div>
                <div className="font-semibold text-green-900">Upload Complete</div>
                <div className="text-sm text-green-700">{uploadedVideo.filename}</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Council Status */}
      {councilStatus !== 'idle' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Council Deliberation</h3>

          {councilStatus === 'processing' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                <div>
                  <div className="font-medium">AI Council is analyzing...</div>
                  <div className="text-sm text-gray-600">This may take 10-20 minutes</div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                Clips found so far: <span className="font-bold">{clipsFound}</span>
              </div>

              {/* Animated visualization */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                    className="h-2 bg-blue-500 rounded"
                  />
                ))}
              </div>
            </div>
          )}

          {councilStatus === 'complete' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <FiCheck className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-xl font-bold text-green-900">Council Complete!</div>
                  <div className="text-gray-600">{clipsFound} clips selected</div>
                </div>
              </div>

              <button
                onClick={exportToXML}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors"
              >
                <FiDownload className="w-5 h-5" />
                <span>Export to Premiere Pro XML</span>
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* Re-upload Section */}
      {councilStatus === 'complete' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Phase 2: Re-upload Edited Clips</h3>

          <p className="text-gray-600 mb-4">
            After editing in Premiere Pro, drag and drop your edited clips here.
          </p>

          <ReuploaInterface videoId={uploadedVideo.video_id} />
        </div>
      )}
    </div>
  );
}

// Re-upload Component
function ReuploadInterface({ videoId }: { videoId: string }) {
  const [uploadedClips, setUploadedClips] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedClips(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov']
    },
    multiple: true,
  });

  const handleReupload = async () => {
    const formData = new FormData();
    uploadedClips.forEach(file => {
      formData.append('clips', file);
    });

    try {
      const response = await axios.post(
        `/api/phase2/reupload?video_id=${videoId}`,
        formData
      );

      console.log('Reupload complete:', response.data);
      // Navigate to matrix processing
    } catch (error) {
      console.error('Reupload failed:', error);
    }
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer mb-4 ${
          isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-700">
          {isDragActive ? 'Drop edited clips here...' : 'Drag & drop edited clips (multiple files OK)'}
        </p>
      </div>

      {uploadedClips.length > 0 && (
        <div className="space-y-2 mb-4">
          {uploadedClips.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">{file.name}</span>
              <button
                onClick={() => setUploadedClips(prev => prev.filter((_, i) => i !== idx))}
                className="text-red-500 hover:text-red-700"
              >
                <FiX />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploadedClips.length > 0 && (
        <button
          onClick={handleReupload}
          className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg"
        >
          Upload {uploadedClips.length} Edited Clips
        </button>
      )}
    </div>
  );
}
