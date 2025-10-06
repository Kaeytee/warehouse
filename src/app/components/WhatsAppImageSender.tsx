import React, { useState, useRef, useEffect } from 'react';
import { ImageUploadService } from '../core/services/ImageUploadService';
import { WhatsAppService } from '../core/services/WhatsAppService';

interface WhatsAppImageSenderProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  packageId: string;
  clientName: string;
}

/**
 * Component for capturing an image and sending it via WhatsApp
 */
const WhatsAppImageSender: React.FC<WhatsAppImageSenderProps> = ({
  isOpen,
  onClose,
  phoneNumber,
  packageId,
  clientName
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const imageUploadService = ImageUploadService.getInstance();
  const whatsAppService = WhatsAppService.getInstance();

  // Start camera when component mounts and is open
  useEffect(() => {
    if (isOpen && !cameraActive && !imageData) {
      startCamera();
    }
    
    // Cleanup camera when component unmounts
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
   * Stops the camera stream
   */
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
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

    // Convert canvas to data URL
    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
    setImageData(dataURL);
    
    // Stop camera after capture
    stopCamera();
  };

  /**
   * Retakes the image by restarting the camera
   */
  const retakeImage = () => {
    setImageData(null);
    setError(null);
    startCamera();
  };

  /**
   * Uploads the image and sends via WhatsApp
   */
  const sendImage = async () => {
    if (!imageData) return;

    try {
      setUploading(true);
      setError(null);

      // Convert data URL to blob
      const imageBlob = imageUploadService.dataURLtoBlob(imageData);
      
      // Upload image
      const imageUrl = await imageUploadService.uploadImage(imageBlob, `package-${packageId}-${Date.now()}.jpg`);
      
      // Generate WhatsApp message
      const message = whatsAppService.generatePackageMessage(packageId, clientName, imageUrl);
      
      // Open WhatsApp
      whatsAppService.openWhatsApp(phoneNumber, message);
      
      // Close modal
      onClose();
    } catch (err) {
      console.error('Error sending image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  /**
   * Closes the modal and cleans up
   */
  const handleClose = () => {
    stopCamera();
    setImageData(null);
    setError(null);
    onClose();
  };

  // Validate phone number
  const isValidPhone = whatsAppService.validatePhoneNumber(phoneNumber);

  if (!isOpen) return null;

  if (!isValidPhone) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Invalid Phone Number</h2>
          <p className="text-gray-600 mb-6">
            The phone number "{phoneNumber}" is not valid. Please ensure it's in international format (e.g., +1234567890).
          </p>
          <button
            onClick={handleClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Send Package Image</h2>
              <p className="text-gray-600 text-sm">
                Package: {packageId} | Client: {clientName}
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

          <div className="flex flex-col items-center">
            {/* Camera View */}
            {cameraActive && (
              <div className="relative mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-w-lg rounded-lg shadow-lg"
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <button
                    onClick={captureImage}
                    className="bg-white hover:bg-gray-100 text-gray-800 px-6 py-3 rounded-full shadow-lg border-2 border-gray-300 font-medium"
                  >
                    📷 Capture
                  </button>
                </div>
              </div>
            )}

            {/* Image Preview */}
            {imageData && (
              <div className="mb-4">
                <img
                  src={imageData}
                  alt="Captured package"
                  className="w-full max-w-lg rounded-lg shadow-lg"
                />
              </div>
            )}

            {/* Hidden canvas for image capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              {imageData ? (
                <>
                  <button
                    onClick={retakeImage}
                    disabled={uploading}
                    className="border border-gray-300 px-6 py-2 rounded-lg text-gray-700 font-medium bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    📷 Retake
                  </button>
                  <button
                    onClick={sendImage}
                    disabled={uploading}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        📱 Send via WhatsApp
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleClose}
                  className="border border-gray-300 px-6 py-2 rounded-lg text-gray-700 font-medium bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Phone number info */}
            <p className="text-gray-500 text-sm mt-4">
              Image will be sent to: {phoneNumber}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppImageSender;
