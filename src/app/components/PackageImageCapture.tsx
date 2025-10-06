import React, { useState, useRef, useEffect } from 'react';

interface PackageImageCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onImagesCapture: (images: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

/**
 * Component for capturing up to 3 package images with size restrictions
 */
const PackageImageCapture: React.FC<PackageImageCaptureProps> = ({
  isOpen,
  onClose,
  onImagesCapture,
  maxImages = 3,
  maxSizeMB = 10
}) => {
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopCamera = React.useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  }, [stream]);

  // Start camera when component opens
  useEffect(() => {
    if (isOpen && !cameraActive && capturedImages.length < maxImages) {
      startCamera();
    }
    
    // Cleanup camera when component unmounts
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImages.length, maxImages, cameraActive, stopCamera]); // Add cameraActive to dependencies

  /**
   * Starts the camera stream
   */
  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera on mobile if available
        }
      });
      
      setStream(mediaStream);
      setCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  /**
   * Converts data URL to blob and checks file size
   */
  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  };

  /**
   * Checks if image size is within limits
   */
  const validateImageSize = (dataURL: string): boolean => {
    const blob = dataURLtoBlob(dataURL);
    const sizeMB = blob.size / (1024 * 1024);
    return sizeMB <= maxSizeMB;
  };

  /**
   * Captures an image from the video stream
   */
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to data URL with compression
    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
    
    // Validate image size
    if (!validateImageSize(dataURL)) {
      setError(`Image size exceeds ${maxSizeMB}MB limit. Please try again.`);
      return;
    }

    // Add to captured images
    const newImages = [...capturedImages, dataURL];
    setCapturedImages(newImages);
    setError(null);

    // Stop camera if we've reached the maximum number of images
    if (newImages.length >= maxImages) {
      stopCamera();
    }
  };

  /**
   * Removes an image from the captured list
   */
  const removeImage = (index: number) => {
    const newImages = capturedImages.filter((_, i) => i !== index);
    setCapturedImages(newImages);
    
    // Restart camera if we have less than max images and camera is not active
    if (newImages.length < maxImages && !cameraActive) {
      startCamera();
    }
  };

  /**
   * Saves images and closes the modal
   */
  const saveImages = () => {
    onImagesCapture(capturedImages);
    handleClose();
  };

  /**
   * Closes the modal and cleans up
   */
  const handleClose = () => {
    stopCamera();
    setCapturedImages([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const canCaptureMore = capturedImages.length < maxImages;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Capture Package Images</h2>
              <p className="text-gray-600 text-sm">
                Take up to {maxImages} photos (max {maxSizeMB}MB each) • {capturedImages.length}/{maxImages} captured
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Camera Section */}
            {canCaptureMore && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-800">Camera</h3>
                {cameraActive ? (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full rounded-lg shadow-lg bg-gray-200"
                    />
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <button
                        onClick={captureImage}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full shadow-lg font-medium flex items-center gap-2"
                      >
                        📷 Capture Image ({capturedImages.length + 1}/{maxImages})
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <p className="text-gray-500 mb-4">Camera not active</p>
                    <button
                      onClick={startCamera}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Start Camera
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Captured Images Section */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-800">Captured Images</h3>
              {capturedImages.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                  No images captured yet
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                  {capturedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Package image ${index + 1}`}
                        className="w-full rounded-lg shadow-md"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        Image {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Hidden canvas for image capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <div className="text-sm text-gray-500">
              {capturedImages.length > 0 && (
                <span>✓ {capturedImages.length} image(s) ready</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="border border-gray-300 px-6 py-2 rounded-lg text-gray-700 font-medium bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              {capturedImages.length > 0 && (
                <button
                  onClick={saveImages}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Save Images ({capturedImages.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageImageCapture;
