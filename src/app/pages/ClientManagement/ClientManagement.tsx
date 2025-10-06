import React, { useState } from 'react';
import { FiUserPlus, FiEdit2, FiTrash2, FiMail, FiPhone, FiMapPin, FiSearch } from 'react-icons/fi';

/**
 * ClientManagement Component
 * 
 * This component provides an interface for managing clients in the cargo system.
 * It includes features for viewing, adding, editing, and deleting clients.
 * 
 * @returns {React.ReactElement} The ClientManagement component
 */
const ClientManagement: React.FC = () => {
  // State for search query
  const [searchQuery, setSearchQuery] = useState<string>('');
  // State for showing add/edit client modal
  const [showModal, setShowModal] = useState<boolean>(false);
  // State for tracking if we're editing an existing client
  const [isEditing, setIsEditing] = useState<boolean>(false);
  // State for current client being edited
  const [currentClient, setCurrentClient] = useState<any>(null);
  
  /**
   * Mock data for clients
   * In a real application, this would come from an API
   */
  const clients = [
    {
      id: 'CLT-1001',
      name: 'Acme Corporation',
      contactPerson: 'John Smith',
      email: 'john.smith@acme.com',
      phone: '+1 (555) 123-4567',
      address: '123 Business Ave, New York, NY 10001',
      status: 'active',
      joinDate: '2024-01-15'
    },
    {
      id: 'CLT-1002',
      name: 'Global Shipping Inc.',
      contactPerson: 'Sarah Johnson',
      email: 'sarah.j@globalshipping.com',
      phone: '+1 (555) 987-6543',
      address: '456 cargo Blvd, Chicago, IL 60007',
      status: 'active',
      joinDate: '2024-02-20'
    },
    {
      id: 'CLT-1003',
      name: 'Tech Solutions Ltd.',
      contactPerson: 'Michael Chen',
      email: 'mchen@techsolutions.com',
      phone: '+1 (555) 456-7890',
      address: '789 Innovation Way, San Francisco, CA 94103',
      status: 'inactive',
      joinDate: '2024-03-10'
    },
    {
      id: 'CLT-1004',
      name: 'Retail Partners Co.',
      contactPerson: 'Emily Wilson',
      email: 'emily@retailpartners.com',
      phone: '+1 (555) 234-5678',
      address: '321 Commerce St, Dallas, TX 75201',
      status: 'active',
      joinDate: '2024-04-05'
    },
    {
      id: 'CLT-1005',
      name: 'Manufacturing Experts',
      contactPerson: 'Robert Lee',
      email: 'robert.lee@manufacturing.com',
      phone: '+1 (555) 876-5432',
      address: '567 Factory Rd, Detroit, MI 48201',
      status: 'active',
      joinDate: '2024-05-12'
    }
  ];
  
  /**
   * Filter clients based on search query
   * 
   * @returns {Array} Filtered clients
   */
  const filteredClients = () => {
    if (!searchQuery) return clients;
    
    return clients.filter(client => 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  /**
   * Handle search input change
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  /**
   * Open modal to add a new client
   */
  const handleAddClient = () => {
    setIsEditing(false);
    setCurrentClient(null);
    setShowModal(true);
  };
  
  /**
   * Open modal to edit an existing client
   * 
   * @param {Object} client - Client to edit
   */
  const handleEditClient = (client: any) => {
    setIsEditing(true);
    setCurrentClient(client);
    setShowModal(true);
  };
  
  /**
   * Handle client deletion
   * 
   * @param {string} id - Client ID
   */
  const handleDeleteClient = (id: string) => {
    console.log(`Deleting client: ${id}`);
    // Implement delete functionality here
  };
  
  /**
   * Close the add/edit client modal
   */
  const closeModal = () => {
    setShowModal(false);
    setCurrentClient(null);
  };
  
  /**
   * Handle form submission for adding/editing client
   * 
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`${isEditing ? 'Updating' : 'Adding'} client`);
    // Implement add/edit functionality here
    closeModal();
  };

  return (
    <div className="py-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Client Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your client database and information
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={handleAddClient}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <FiUserPlus className="mr-2" />
            Add New Client
          </button>
        </div>
      </div>
      
      {/* Search bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm"
            placeholder="Search clients by name, contact, or ID"
          />
        </div>
      </div>
      
      {/* Clients table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact Information
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClients().map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-medium">
                        {client.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-500">{client.id}</div>
                      <div className="text-sm text-gray-500">Since {client.joinDate}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{client.contactPerson}</div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <FiMail className="mr-1" size={14} />
                    {client.email}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <FiPhone className="mr-1" size={14} />
                    {client.phone}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 flex items-start">
                    <FiMapPin className="mr-1 mt-1 flex-shrink-0" size={14} />
                    <span>{client.address}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditClient(client)}
                      className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Add/Edit Client Modal */}
      {showModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {isEditing ? 'Edit Client' : 'Add New Client'}
                      </h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Company Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            defaultValue={currentClient?.name || ''}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">
                            Contact Person
                          </label>
                          <input
                            type="text"
                            name="contactPerson"
                            id="contactPerson"
                            defaultValue={currentClient?.contactPerson || ''}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                              Email
                            </label>
                            <input
                              type="email"
                              name="email"
                              id="email"
                              defaultValue={currentClient?.email || ''}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                              Phone
                            </label>
                            <input
                              type="text"
                              name="phone"
                              id="phone"
                              defaultValue={currentClient?.phone || ''}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                            Address
                          </label>
                          <textarea
                            name="address"
                            id="address"
                            rows={3}
                            defaultValue={currentClient?.address || ''}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Status
                          </label>
                          <select
                            id="status"
                            name="status"
                            defaultValue={currentClient?.status || 'active'}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {isEditing ? 'Update' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
