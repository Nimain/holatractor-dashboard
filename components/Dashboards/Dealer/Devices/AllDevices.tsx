'use client'

import React, { useState } from 'react';
import { Edit2, Trash2, X } from 'lucide-react';

interface DeviceCardProps {
  location: string;
  brand: string;
  model: string;
  owner: string;
  id: string;
  imageUrl: string;
  isActive: boolean;
}

const DeviceCard: React.FC<DeviceCardProps> = ({
  location,
  brand,
  model,
  owner,
  id,
  imageUrl,
  isActive
}) => (
  <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
    <div className="absolute inset-0 opacity-5">
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
        backgroundSize: '30px 30px'
      }}></div>
    </div>

    <div className="relative flex items-start justify-between mb-4">
      <span className={`px-4 py-1 rounded-full text-sm font-bold shadow-lg ${
        isActive ? 'bg-green-500' : 'bg-gray-500'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
      <div className="flex space-x-2">
        <button className="w-8 h-8 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-md">
          <Edit2 className="w-4 h-4 text-gray-800" />
        </button>
        <button className="w-8 h-8 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-md">
          <Trash2 className="w-4 h-4 text-gray-800" />
        </button>
      </div>
    </div>

    <div className="relative flex items-center justify-between">
      <div className="space-y-1 z-10 flex-shrink-0">
        <div className="text-red-200 text-sm">{location}</div>
        <div className="text-3xl font-bold leading-tight">{brand}</div>
        <div className="text-base text-red-100">Model: {model}</div>
        <div className="text-base text-red-100">Owner: {owner}</div>
        <div className="text-sm text-red-200 mt-2">ID:{id}</div>
      </div>

      <div className="flex items-center justify-end flex-shrink-0">
        <img 
          src={imageUrl} 
          alt={`${brand} ${model}`}
          className="w-48 h-auto object-contain drop-shadow-2xl"
        />
      </div>
    </div>
  </div>
);

const DeviceGridDashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    location: '',
    brand: '',
    model: '',
    owner: '',
    id: '',
    imageUrl: '',
    isActive: true
  });

  const devices = [
    {
      location: 'South-West Bolivia',
      brand: 'John Deere',
      model: '5052',
      owner: 'John Hawkins',
      id: '890758012384307',
      imageUrl: 'https://images.unsplash.com/photo-1614977645540-7abd88ba8e56?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dHJhY3RvcnxlbnwwfHwwfHx8MA%3D%3D',
      isActive: true
    },
    {
      location: 'South-West Bolivia',
      brand: 'John Deere',
      model: '3032',
      owner: 'John Hawkins',
      id: '890758012384307',
      imageUrl: 'https://images.unsplash.com/photo-614977645540-7abd88ba8e56?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dHJhY3RvcnxlbnwwfHwwfHx8MA%3D%3D',
      isActive: true
    },
    {
      location: 'South-West Bolivia',
      brand: 'John Deere',
      model: '575 DI',
      owner: 'John Hawkins',
      id: '890758012384307',
      imageUrl: 'https://images.unsplash.com/photo-1614977645540-7abd88ba8e56?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dHJhY3RvcnxlbnwwfHwwfHx8MA%3D%3D',
      isActive: true
    },
    {
      location: 'South-West Bolivia',
      brand: 'John Deere',
      model: '5052',
      owner: 'John Hawkins',
      id: '890758012384307',
      imageUrl: 'https://images.unsplash.com/photo-1614977645540-7abd88ba8e56?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dHJhY3RvcnxlbnwwfHwwfHx8MA%3D%3D',
      isActive: true
    },
    {
      location: 'South-West Bolivia',
      brand: 'John Deere',
      model: '3032',
      owner: 'John Hawkins',
      id: '890758012384307',
      imageUrl: 'https://images.unsplash.com/photo-1614977645540-7abd88ba8e56?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dHJhY3RvcnxlbnwwfHwwfHx8MA%3D%3D',
      isActive: true
    },
    {
      location: 'South-West Bolivia',
      brand: 'John Deere',
      model: '575 DI',
      owner: 'John Hawkins',
      id: '890758012384307',
      imageUrl: 'https://images.unsplash.com/photo-1614977645540-7abd88ba8e56?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dHJhY3RvcnxlbnwwfHwwfHx8MA%3D%3D',
      isActive: true
    },
    {
      location: 'South-West Bolivia',
      brand: 'John Deere',
      model: '5052',
      owner: 'John Hawkins',
      id: '890758012384307',
      imageUrl: 'https://images.unsplash.com/photo-1614977645540-7abd88ba8e56?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dHJhY3RvcnxlbnwwfHwwfHx8MA%3D%3D',
      isActive: true
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // API integration placeholder
    console.log('Form data to be sent to API:', formData);
    
    // TODO: Replace with actual API call
    // try {
    //   const response = await fetch('YOUR_API_ENDPOINT', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(formData)
    //   });
    //   const data = await response.json();
    //   console.log('Success:', data);
    // } catch (error) {
    //   console.error('Error:', error);
    // }
    
    // Close modal and reset form
    setIsModalOpen(false);
    setFormData({
      location: '',
      brand: '',
      model: '',
      owner: '',
      id: '',
      imageUrl: '',
      isActive: true
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2 text-sm"></div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <span className="text-xl">+</span>
            <span>Add Device</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device, index) => (
            <DeviceCard key={index} {...device} />
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Add New Device</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter model"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner
                </label>
                <input
                  type="text"
                  name="owner"
                  value={formData.owner}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter owner name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device ID
                </label>
                <input
                  type="text"
                  name="id"
                  value={formData.id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter device ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter image URL"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Active Device
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
                >
                  Add Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceGridDashboard;