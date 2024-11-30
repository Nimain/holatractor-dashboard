import { Farm } from '@/utils/Types/types'
import React from 'react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { MapContainer, Polygon, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from 'lucide-react';

const SeeFarm = ({ farm }: { farm: Farm }) => {

    const limeOptions = { color: 'lime' }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                        <MapPin size={14} />
                    </div>
                    <span>
                        Click to see farm Location
                    </span>
                </div>
            </DialogTrigger>
            <DialogContent>
                <MapContainer
                    center={farm.boundary.coordinates[0]}
                    zoom={16}
                    scrollWheelZoom={false}
                    style={{ width: "100%", height: "80vh", zIndex: 1 }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Polygon pathOptions={limeOptions} positions={farm.boundary.coordinates} />
                </MapContainer>
            </DialogContent>
        </Dialog>
    )
}

export default SeeFarm