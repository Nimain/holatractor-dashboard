// import React from 'react';
// import { Edit2, Trash2 } from 'lucide-react';

// interface DeviceCardProps {
//   location: string;
//   brand: string;
//   model: string;
//   owner: string;
//   id: string;
//   imageUrl: string;
//   isActive: boolean;
// }

// const DeviceCard: React.FC<DeviceCardProps> = ({
//   location,
//   brand,
//   model,
//   owner,
//   id,
//   imageUrl,
//   isActive
// }) => (
//   <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
//     {/* Background Pattern */}
//     <div className="absolute inset-0 opacity-10">
//       <div className="absolute inset-0" style={{
//         backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
//         backgroundSize: '40px 40px'
//       }}></div>
//     </div>

//     {/* Header */}
//     <div className="relative flex items-center justify-between mb-4">
//       <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
//         isActive ? 'bg-green-500' : 'bg-gray-500'
//       }`}>
//         {isActive ? 'Active' : 'Inactive'}
//       </span>
//       <div className="flex space-x-2">
//         <button className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
//           <Edit2 className="w-4 h-4" />
//         </button>
//         <button className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
//           <Trash2 className="w-4 h-4" />
//         </button>
//       </div>
//     </div>

//     {/* Device Image */}
//     <div className="relative h-40 mb-4 flex items-center justify-center">
//       <img 
//         src={imageUrl} 
//         alt={`${brand} ${model}`}
//         className="h-full w-auto object-contain drop-shadow-2xl"
//       />
//     </div>

//     {/* Device Info */}
//     <div className="relative space-y-1">
//       <div className="text-red-200 text-xs">{location}</div>
//       <div className="text-xl font-bold">{brand}</div>
//       <div className="text-sm text-red-100">Model: {model}</div>
//       <div className="text-sm text-red-100">Owner: {owner}</div>
//       <div className="text-xs text-red-300 mt-2">ID: {id}</div>
//     </div>
//   </div>
// );

// const DeviceGridDashboard: React.FC = () => {
//   const devices = [
//     {
//       location: 'South-West Bolivia',
//       brand: 'John Deere',
//       model: '5052',
//       owner: 'John Hawkins',
//       id: '890758012384307',
//       imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400',
//       isActive: true
//     },
//     {
//       location: 'South-West Bolivia',
//       brand: 'John Deere',
//       model: '3032',
//       owner: 'John Hawkins',
//       id: '890758012384307',
//       imageUrl: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=400',
//       isActive: true
//     },
//     {
//       location: 'South-West Bolivia',
//       brand: 'John Deere',
//       model: '575 DI',
//       owner: 'John Hawkins',
//       id: '890758012384307',
//       imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400',
//       isActive: true
//     },
//     {
//       location: 'South-West Bolivia',
//       brand: 'John Deere',
//       model: '5052',
//       owner: 'John Hawkins',
//       id: '890758012384307',
//       imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400',
//       isActive: true
//     },
//     {
//       location: 'South-West Bolivia',
//       brand: 'John Deere',
//       model: '3032',
//       owner: 'John Hawkins',
//       id: '890758012384307',
//       imageUrl: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=400',
//       isActive: true
//     },
//     {
//       location: 'South-West Bolivia',
//       brand: 'John Deere',
//       model: '575 DI',
//       owner: 'John Hawkins',
//       id: '890758012384307',
//       imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400',
//       isActive: true
//     },
//     {
//       location: 'South-West Bolivia',
//       brand: 'John Deere',
//       model: '5052',
//       owner: 'John Hawkins',
//       id: '890758012384307',
//       imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400',
//       isActive: true
//     }
//   ];

//   return (
//     <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
//       {/* Device Grid */}
//       <div className="max-w-7xl mx-auto">
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//           {devices.map((device, index) => (
//             <DeviceCard key={index} {...device} />
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DeviceGridDashboard;

                  // New one (in trial)

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
  <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-5">
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
        backgroundSize: '30px 30px'
      }}></div>
    </div>

    {/* Header */}
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

    {/* Content - Image and Text Overlay */}
    <div className="relative flex items-center justify-between">
      {/* Left Side - Text */}
      <div className="space-y-1 z-10 flex-shrink-0">
        <div className="text-red-200 text-sm">{location}</div>
        <div className="text-3xl font-bold leading-tight">{brand}</div>
        <div className="text-base text-red-100">Model: {model}</div>
        <div className="text-base text-red-100">Owner: {owner}</div>
        <div className="text-sm text-red-200 mt-2">ID:{id}</div>
      </div>

      {/* Right Side - Large Image */}
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

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="w-full">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2 text-sm">
            
          </div>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <span className="text-xl">+</span>
            <span>Add Device</span>
          </button>
        </div>

        {/* Device Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device, index) => (
            <DeviceCard key={index} {...device} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeviceGridDashboard;