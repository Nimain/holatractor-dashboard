'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Locate, ZoomIn, ZoomOut, X } from 'lucide-react';

interface Device {
  id: number;
  lat: number;
  lng: number;
  name: string;
  location: string;
  imei: string;
  region: string;
  owner: string;
  lastVisit: string;
  imageUrl: string;
}

const TrackingMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All Data');

  const devices: Device[] = [
    { 
      id: 1, 
      lat: -17.8, 
      lng: -63.2, 
      name: 'John Deere 5052', 
      location: 'South-West Bolivia',
      imei: '0897654321234',
      region: 'South West Negative (Co- Ords)',
      owner: 'John Hawkins',
      lastVisit: '86 days ago',
      imageUrl: 'data:image/jpeg;base64,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'
    },
    { 
      id: 2, 
      lat: -16.5, 
      lng: -68.15, 
      name: 'Tractor 3032', 
      location: 'La Paz',
      imei: '0897654321235',
      region: 'La Paz Region',
      owner: 'Maria Silva',
      lastVisit: '12 days ago',
      imageUrl: 'data:image/jpeg;base64,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'
    },
    { 
      id: 3, 
      lat: -19.03, 
      lng: -65.26, 
      name: 'Tractor 575 DI', 
      location: 'Sucre',
      imei: '0897654321236',
      region: 'Sucre Region',
      owner: 'Carlos Rodriguez',
      lastVisit: '5 days ago',
      imageUrl: 'data:image/jpeg;base64,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'
    },
    { 
      id: 4, 
      lat: -17.4, 
      lng: -66.15, 
      name: 'Tractor 3032', 
      location: 'Cochabamba',
      imei: '0897654321237',
      region: 'Cochabamba Region',
      owner: 'Pedro Martinez',
      lastVisit: '2 days ago',
      imageUrl: 'data:image/jpeg;base64,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'
    }
  ];

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    
    script.onload = () => {
      if (mapRef.current && !mapInstanceRef.current && (window as any).L) {
        const L = (window as any).L;
        
        const map = L.map(mapRef.current).setView([-17.0, -65.0], 6);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);

        const tractorIcon = L.divIcon({
          className: 'custom-tractor-icon',
          html: `<div style="font-size: 32px; filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));">🚜</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20]
        });

        devices.forEach(device => {
          const marker = L.marker([device.lat, device.lng], { icon: tractorIcon }).addTo(map);
          
          marker.on('click', () => {
            setSelectedDevice(device);
            map.setView([device.lat, device.lng], 12);
          });
        });

        mapInstanceRef.current = map;
      }
    };
    
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleZoomIn = (): void => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = (): void => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleRecenter = (): void => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([-17.0, -65.0], 6);
    }
  };

  const filters = ['All Data', 'Today', 'Yesterday', 'Last 7 Days', 'Last 15 Days', 'Last 30 Days', 'Custom'];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Map Container - Full Screen */}
      <div className="relative h-screen">
        {/* Leaflet Map */}
        <div ref={mapRef} className="absolute inset-0 z-0"></div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
          <button 
            onClick={handleZoomIn}
            className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-5 h-5 text-gray-700" />
          </button>
          <button 
            onClick={handleZoomOut}
            className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-5 h-5 text-gray-700" />
          </button>
          <button 
            onClick={handleRecenter}
            className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
            aria-label="Center location"
          >
            <Locate className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Right Side Panel - Slides in when device selected */}
        <div className={`absolute top-0 right-0 h-full w-full sm:w-96 bg-gradient-to-br from-red-900 to-red-800 shadow-2xl z-[1001] transform transition-transform duration-300 ease-in-out ${
          selectedDevice ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {selectedDevice && (
            <div className="h-full flex flex-col text-white">
              {/* Close Button */}
              <div className="flex justify-end p-4">
                <button
                  onClick={() => setSelectedDevice(null)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Close panel"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Filter Buttons - Inside Right Panel */}
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        activeFilter === filter
                          ? 'bg-white text-red-900'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Device Image */}
              <div className="px-6 pb-6">
                <div className="flex items-center justify-center mb-6">
                  <img 
                    src={selectedDevice.imageUrl}
                    alt={selectedDevice.name}
                    className="w-72 h-56 object-contain drop-shadow-2xl"
                  />
                </div>
                <h2 className="text-3xl font-bold text-white text-center">{selectedDevice.name}</h2>
                <p className="text-red-200 text-center text-base mt-2">{selectedDevice.location}</p>
              </div>

              {/* Device Details */}
              <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
                <div className="border-b border-white/20 pb-4">
                  <div className="text-sm text-red-200 mb-2">ID:</div>
                  <div className="text-base font-semibold text-white">8907580123864307</div>
                </div>

                <div className="border-b border-white/20 pb-4">
                  <div className="text-sm text-red-200 mb-2">IMEI:</div>
                  <div className="text-base font-semibold text-white">{selectedDevice.imei}</div>
                </div>

                <div className="border-b border-white/20 pb-4">
                  <div className="text-sm text-red-200 mb-2">Region:</div>
                  <div className="text-base font-semibold text-white">{selectedDevice.region}</div>
                </div>

                <div className="border-b border-white/20 pb-4">
                  <div className="text-sm text-red-200 mb-2">Owner:</div>
                  <div className="text-base font-semibold text-white">{selectedDevice.owner}</div>
                </div>

                <div className="border-b border-white/20 pb-4">
                  <div className="text-sm text-red-200 mb-2">Last Visit:</div>
                  <div className="text-base font-semibold text-white">{selectedDevice.lastVisit}</div>
                </div>

                {/* Status Badge */}
                <div className="pt-2">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-500 text-white">
                    <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingMap;