import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

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
  <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }}></div>
    </div>

    {/* Header */}
    <div className="relative flex items-center justify-between mb-4">
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
        isActive ? 'bg-green-500' : 'bg-gray-500'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
      <div className="flex space-x-2">
        <button className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
          <Edit2 className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>

    {/* Device Image */}
    <div className="relative h-40 mb-4 flex items-center justify-center">
      <img 
        src={imageUrl} 
        alt={`${brand} ${model}`}
        className="h-full w-auto object-contain drop-shadow-2xl"
      />
    </div>

    {/* Device Info */}
    <div className="relative space-y-1">
      <div className="text-red-200 text-xs">{location}</div>
      <div className="text-xl font-bold">{brand}</div>
      <div className="text-sm text-red-100">Model: {model}</div>
      <div className="text-sm text-red-100">Owner: {owner}</div>
      <div className="text-xs text-red-300 mt-2">ID: {id}</div>
    </div>
  </div>
);

const DeviceGridDashboard: React.FC = () => {
  const devices = [
    {
      location: 'South-West Bolivia',
      brand: 'John Deere',
      model: '5052',
      owner: 'John Hawkins',
      id: '890758012384307',
      imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400',
      isActive: true
    },
    {
      location: 'South-West Bolivia',
      brand: 'John Deere',
      model: '3032',
      owner: 'John Hawkins',
      id: '890758012384307',
      imageUrl: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=400',
      isActive: true
    },
    {
      location: 'South-West Bolivia',
      brand: 'John Deere',
      model: '575 DI',
      owner: 'John Hawkins',
      id: '890758012384307',
      imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400',
      isActive: true
    },
    {
      location: 'South-West Bolivia',
      brand: 'John Deere',
      model: '5052',
      owner: 'John Hawkins',
      id: '890758012384307',
      imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400',
      isActive: true
    },
    {
      location: 'South-West Bolivia',
      brand: 'John Deere',
      model: '3032',
      owner: 'John Hawkins',
      id: '890758012384307',
      imageUrl: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=400',
      isActive: true
    },
    {
      location: 'South-West Bolivia',
      brand: 'John Deere',
      model: '575 DI',
      owner: 'John Hawkins',
      id: '890758012384307',
      imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400',
      isActive: true
    },
    {
      location: 'South-West Bolivia',
      brand: 'John Deere',
      model: '5052',
      owner: 'John Hawkins',
      id: '890758012384307',
      imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400',
      isActive: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      {/* Device Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device, index) => (
            <DeviceCard key={index} {...device} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeviceGridDashboard;