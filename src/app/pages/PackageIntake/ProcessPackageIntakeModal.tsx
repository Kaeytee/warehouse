import React, { useState, useRef, useCallback } from 'react';
import { postAccountingRecord } from './accounting';
import type { AccountingRecord } from './accounting';

// Type definition for modal props
interface ProcessPackageIntakeModalProps {
  open: boolean;
  onClose: () => void;
  onMarkReceived: (data: {
    weight: string;
    packageType: string;
    currency: string;
    amountPaid: string;
    dimensions: string;
    notes: string;
    barcode: string;
    packageId: string;
    packageImages: string[];
    [key: string]: unknown;
  }) => void;
  request: {
    id: string;
    client: string;
    weight?: number | string;
    phoneNumber?: string;
    [key: string]: unknown;
  };
}

// Validation error type
interface ValidationErrors {
  weight?: string;
  packageType?: string;
  amountPaid?: string;
  dimensions?: string;
}

// Camera component using HTML5 API
const CameraCapture: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  maxImages: number;
  currentCount: number;
}> = ({ isOpen, onClose, onCapture, maxImages, currentCount }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Moved stopCamera inside useCallback to fix dependency issues
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      // Add slight delay to ensure video element is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Handle iOS playback requirements
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        await videoRef.current.play();
        setStream(mediaStream);
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  }, [stopCamera]); // Added stopCamera to dependencies

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageData);
        stopCamera();
        onClose();
      }
    }
  }, [onCapture, onClose, stopCamera]);

  React.useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    // Ensure the camera stops only when the component unmounts
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      <div className="relative w-full h-full">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 p-4">
          <div className="flex justify-between items-center text-white">
            <h3 className="text-lg font-medium">
              Take Photo ({currentCount + 1}/{maxImages})
            </h3>
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="text-white hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Camera Preview */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        
        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-6">
          <div className="flex justify-center">
            <button
              onClick={capturePhoto}
              disabled={!isStreaming}
              className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <div className="w-12 h-12 bg-white rounded-full"></div>
            </button>
          </div>
          {error && (
            <div className="mt-4 text-center text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// WhatsApp sender component
const WhatsAppSender: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  packageId: string;
  clientName: string;
}> = ({ isOpen, onClose, phoneNumber, packageId, clientName }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [message, setMessage] = useState(`Package ${packageId} has been received and processed.`);

  const sendToWhatsApp = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Send to WhatsApp</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Sending to: {clientName}</p>
                <p className="text-sm text-gray-600 mb-4">{phoneNumber}</p>
              </div>

              {capturedImage && (
                <div className="border rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Captured Image:</p>
                  <img src={capturedImage} alt="Package" className="w-full h-32 object-cover rounded" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message:</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCamera(true)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium"
                >
                  Take Photo
                </button>
                <button
                  onClick={sendToWhatsApp}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CameraCapture
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={(imageData) => setCapturedImage(imageData)}
        maxImages={1}
        currentCount={0}
      />
    </>
  );
};

// Supported currencies
const currencyOptions = [
  { label: 'GHS', symbol: 'GHS', regex: /^GHS\d+(\.\d{1,2})?$/ },
  { label: 'USD', symbol: 'USD', regex: /^USD\d+(\.\d{1,2})?$/ },
];

const ProcessPackageIntakeModal: React.FC<ProcessPackageIntakeModalProps> = ({ 
  open, 
  onClose, 
  onMarkReceived, 
  request 
}) => {
  // Form state
  const [weight, setWeight] = useState<string>(
    request?.weight ? String(request.weight).replace(/[^\d.]/g, '') : ''
  );
  const [packageType, setPackageType] = useState<string>('');
  const [currency, setCurrency] = useState<string>('GHS');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [dimensions, setDimensions] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{[k:string]:boolean}>({});
  const [hasError, setHasError] = useState<boolean>(false);
  const [showWhatsAppSender, setShowWhatsAppSender] = useState<boolean>(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [showImageCapture, setShowImageCapture] = useState<boolean>(false);

  // Validate individual field
  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'weight':
        if (!value || isNaN(Number(value)) || Number(value) <= 0) {
          return 'Enter a valid weight (kg)';
        }
        break;
      case 'packageType':
        if (!value) {
          return 'Select a package type';
        }
        break;
      case 'amountPaid': {
        if (!value) {
          return 'Enter an amount';
        }
        const numericValue = value.replace(/^(GHS|USD)/i, '');
        if (!/^\d+(\.\d{1,2})?$/.test(numericValue) || Number(numericValue) <= 0) {
          return 'Enter a valid amount (e.g. 100 or 100.50)';
        }
        break;
      }
      case 'dimensions':
        if (!value || !/^\d+x\d+x\d+$/.test(value)) {
          return 'Format: Length x Breadth x Height (e.g. 30x22x2)';
        }
        break;
    }
    return undefined;
  };

  const validateAll = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    
    const weightError = validateField('weight', weight);
    if (weightError) newErrors.weight = weightError;
    
    const packageTypeError = validateField('packageType', packageType);
    if (packageTypeError) newErrors.packageType = packageTypeError;
    
    const amountPaidError = validateField('amountPaid', amountPaid);
    if (amountPaidError) newErrors.amountPaid = amountPaidError;
    
    const dimensionsError = validateField('dimensions', dimensions);
    if (dimensionsError) newErrors.dimensions = dimensionsError;
    
    return newErrors;
  };

  const handleChange = (field: string, value: string) => {
    switch (field) {
      case 'weight': setWeight(value); break;
      case 'packageType': setPackageType(value); break;
      case 'currency': 
        setCurrency(value);
        if (touched.amountPaid) {
          const amountError = validateField('amountPaid', amountPaid);
          setErrors(prev => ({ ...prev, amountPaid: amountError }));
        }
        return;
      case 'amountPaid': setAmountPaid(value); break;
      case 'dimensions': setDimensions(value); break;
      case 'notes': setNotes(value); break;
      default: break;
    }

    if (touched[field]) {
      const fieldError = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: fieldError }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    let currentValue = '';
    switch (field) {
      case 'weight': currentValue = weight; break;
      case 'packageType': currentValue = packageType; break;
      case 'amountPaid': currentValue = amountPaid; break;
      case 'dimensions': currentValue = dimensions; break;
    }
    
    const fieldError = validateField(field, currentValue);
    setErrors(prev => ({ ...prev, [field]: fieldError }));
  };

  const generateBarcode = () => 'BAR' + Math.floor(100000000 + Math.random()*900000000);
  const generatePackageId = () => 'PKG' + Date.now();

  const handleSubmit = () => {
    try {
      const validation = validateAll();
      setErrors(validation);
      setTouched({ weight: true, packageType: true, amountPaid: true, dimensions: true });
      
      if (Object.keys(validation).length > 0) return;
      
      const barcode = generateBarcode();
      const packageId = generatePackageId();
      const numericAmount = Number(amountPaid.replace(/[^\d.]/g, ''));
      
      const accountingRecord: AccountingRecord = {
        id: `${packageId}-${Date.now()}`,
        amount: numericAmount,
        currency,
        requestId: request.id,
        packageId,
        client: request.client,
        date: new Date().toISOString(),
      };
      
      postAccountingRecord(accountingRecord);
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { weight: _requestWeight, ...restRequest } = request;
      onMarkReceived({
        weight: String(weight ?? ''),
        packageType,
        currency,
        amountPaid,
        dimensions,
        notes,
        barcode,
        packageId,
        packageImages: capturedImages,
        ...restRequest,
      });
    } catch {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4">
        <div className="bg-white p-6 rounded-xl shadow-xl text-red-600 max-w-sm">
          Something went wrong. Please close and try again.
        </div>
      </div>
    );
  }

  if (!open || !request) return null;
  
  const validationErrors = validateAll();
  const isValid = Object.keys(validationErrors).length === 0;
  
  return (
    <>
      {/* Responsive Modal */}
      <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-end sm:items-center justify-center">
        <div className="bg-white w-full sm:max-w-md sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-xl animate-fadeIn max-h-[95vh] flex flex-col">
          
          {/* Header - Fixed */}
          <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Process Incoming Request</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Request {request.id} from {request.client}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 ml-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            
            {/* Package Weight */}
            <div>
              <label className="block font-medium text-gray-700 mb-1 text-sm">Package Weight(kg)</label>
              <input
                type="number"
                className={`w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-900 text-sm ${
                  errors.weight && touched.weight ? 'border-red-400' : ''
                }`}
                placeholder="Enter weight in kg"
                value={weight}
                onChange={e => handleChange('weight', e.target.value)}
                onBlur={() => handleBlur('weight')}
                min={0.01}
                step={0.01}
              />
              {errors.weight && touched.weight && (
                <div className="text-red-500 text-xs mt-1">{errors.weight}</div>
              )}
            </div>

            {/* Package Type */}
            <div>
              <label className="block font-medium text-gray-700 mb-1 text-sm">Package Type</label>
              <select
                className={`w-full px-3 py-2 border rounded-lg bg-white text-gray-900 text-sm ${
                  errors.packageType && touched.packageType ? 'border-red-400' : ''
                }`}
                value={packageType}
                onChange={e => handleChange('packageType', e.target.value)}
                onBlur={() => handleBlur('packageType')}
              >
                <option value="">Choose the package type</option>
                <option value="parcel">Parcel</option>
                <option value="envelope">Envelope</option>
              </select>
              {errors.packageType && touched.packageType && (
                <div className="text-red-500 text-xs mt-1">{errors.packageType}</div>
              )}
            </div>
            
            {/* Amount Paid with Currency */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="block font-medium text-gray-700 text-sm flex-1">Amount Paid</label>
                <select
                  className="border rounded-lg px-2 py-1 text-gray-900 bg-white text-sm"
                  value={currency}
                  onChange={e => handleChange('currency', e.target.value)}
                >
                  {currencyOptions.map(opt => (
                    <option key={opt.symbol} value={opt.symbol}>{opt.symbol}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-900 text-sm ${
                  errors.amountPaid && touched.amountPaid ? 'border-red-400' : ''
                }`}
                placeholder="Enter amount (e.g. 100.50)"
                value={amountPaid}
                onChange={e => handleChange('amountPaid', e.target.value)}
                onBlur={() => handleBlur('amountPaid')}
              />
              {errors.amountPaid && touched.amountPaid && (
                <div className="text-red-500 text-xs mt-1">{errors.amountPaid}</div>
              )}
            </div>
            
            {/* Dimensions */}
            <div>
              <label className="block font-medium text-gray-700 mb-1 text-sm">Dimension(cm)</label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-900 text-sm ${
                  errors.dimensions && touched.dimensions ? 'border-red-400' : ''
                }`}
                placeholder="Length x Breadth x Height"
                value={dimensions}
                onChange={e => handleChange('dimensions', e.target.value)}
                onBlur={() => handleBlur('dimensions')}
              />
              {errors.dimensions && touched.dimensions && (
                <div className="text-red-500 text-xs mt-1">{errors.dimensions}</div>
              )}
            </div>
            
            {/* Notes */}
            <div>
              <label className="block font-medium text-gray-700 mb-1 text-sm">Notes(optional)</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-900 text-sm"
                placeholder="Add any special handling instructions or notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            {/* Package Images Section */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-medium text-red-800 mb-2 text-sm">📷 Package Images</h3>
              <p className="text-red-600 text-xs mb-3">
                Take up to 3 photos of the package
              </p>
              
              {capturedImages.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {capturedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Package image ${index + 1}`}
                          className="w-full h-16 object-cover rounded border"
                        />
                        <button
                          onClick={() => {
                            const newImages = capturedImages.filter((_, i) => i !== index);
                            setCapturedImages(newImages);
                          }}
                          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowImageCapture(true)}
                      disabled={capturedImages.length >= 3}
                      className={`px-3 py-2 rounded-lg font-medium text-xs ${
                        capturedImages.length >= 3 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {capturedImages.length >= 3 ? 'Max reached' : `Add More (${capturedImages.length}/3)`}
                    </button>
                    <button
                      onClick={() => setCapturedImages([])}
                      className="px-3 py-2 rounded-lg font-medium text-xs border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowImageCapture(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium text-xs flex items-center gap-2"
                >
                  📷 Take Package Photos
                </button>
              )}
            </div>
            
            {/* WhatsApp Section */}
            {request.phoneNumber && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2 text-sm">📱 Send via WhatsApp</h3>
                <p className="text-green-600 text-xs mb-3">
                  Send package info to {request.client} at {request.phoneNumber}
                </p>
                <button
                  onClick={() => setShowWhatsAppSender(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium text-xs flex items-center gap-2"
                >
                  📷 Take & Send Photo
                </button>
              </div>
            )}
          </div>

          {/* Footer - Fixed */}
          <div className="p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
            <div className="flex gap-3">
              <button 
                onClick={onClose} 
                className="flex-1 border border-gray-300 py-2 px-4 rounded-lg text-gray-700 font-medium bg-white hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className={`flex-1 bg-red-900 hover:bg-red-800 text-white py-2 px-4 rounded-lg font-semibold shadow text-sm ${
                  !isValid ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                disabled={!isValid}
              >
                Mark as Received
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Camera Modal */}
      <CameraCapture
        isOpen={showImageCapture}
        onClose={() => setShowImageCapture(false)}
        onCapture={(imageData) => {
          setCapturedImages(prev => [...prev, imageData]);
        }}
        maxImages={3}
        currentCount={capturedImages.length}
      />
      
      {/* WhatsApp Sender Modal */}
      {request.phoneNumber && (
        <WhatsAppSender
          isOpen={showWhatsAppSender}
          onClose={() => setShowWhatsAppSender(false)}
          phoneNumber={request.phoneNumber}
          packageId={request.id}
          clientName={request.client}
        />
      )}
    </>
  );
};

export default ProcessPackageIntakeModal;