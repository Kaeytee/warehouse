import React from 'react';

/**
 * Interface for the request details shown in the modal.
 * Ensures strong typing and clear structure.
 */
export interface RequestDetails {
  id: string;
  client: string;
  date: string;
  address: string;
  time: string;
  type: string;
  description: string;
}

/**
 * Props for the RequestDetailsModal component.
 */
interface RequestDetailsModalProps {
  open: boolean; // Whether the modal is open
  onClose: () => void; // Handler to close the modal
  request: RequestDetails | null; // The request details to display
}

/**
 * RequestDetailsModal
 * Overlay/modal for viewing request details (Step 3 overlay)
 * Shows client and package information for a shipment request.
 * @component
 * @param {RequestDetailsModalProps} props
 * @returns {JSX.Element|null}
 */
const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({ open, onClose, request }) => {
  // If modal is not open or request is missing, render nothing
  if (!open || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 relative animate-fadeIn">
        {/* Close button for modal */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-2xl text-gray-400 hover:text-gray-600"
          aria-label="Close modal"
        >
          &times;
        </button>
        {/* Modal Title */}
        <h2 className="text-xl font-bold text-red-900 mb-1">Request Details - {request.id}</h2>
        <p className="text-gray-400 text-sm mb-8">Complete information for this shipment request</p>
        <div className="grid grid-cols-2 gap-6">
          {/* Client Info */}
          <div>
            <div className="font-medium mb-1">Client Information</div>
            <div className="text-sm text-gray-700 mb-1">Name: <span className="font-bold">{request.client}</span></div>
            <div className="text-sm text-gray-700 mb-1">Date: <span className="font-bold">{request.date}</span></div>
            <div className="text-sm text-gray-700 mb-1">Address: <span className="font-bold">{request.address}</span></div>
            <div className="text-sm text-gray-700 mb-1">Time: <span className="font-bold">{request.time}</span></div>
          </div>
          {/* Package Info */}
          <div>
            <div className="font-medium mb-1">Package Information</div>
            <div className="text-sm text-gray-700 mb-1">Package Type: <span className="font-bold">{request.type}</span></div>
            <div className="text-sm text-gray-700 mb-1">Description: <span className="font-bold">{request.description}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailsModal;
