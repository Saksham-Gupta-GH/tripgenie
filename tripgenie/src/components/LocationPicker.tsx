import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon missing in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  position: { lat: number; lng: number } | null;
  setPosition: (pos: { lat: number; lng: number }) => void;
  onAddressFound?: (address: string) => void;
}

const MapEvents = ({ 
  setPosition, 
  onAddressFound 
}: { 
  setPosition: (pos: { lat: number; lng: number }) => void;
  onAddressFound?: (address: string) => void;
}) => {
  useMapEvents({
    async click(e) {
      setPosition(e.latlng);
      if (onAddressFound) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&accept-language=en`);
          const data = await res.json();
          if (data && data.display_name) {
            onAddressFound(data.display_name);
          }
        } catch (error) {
          console.error("Reverse geocoding failed", error);
        }
      }
    },
  });
  return null;
};

export const LocationPicker: React.FC<LocationPickerProps> = ({ position, setPosition, onAddressFound }) => {
  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
      <MapContainer
        center={[20.5937, 78.9629]} // Default to India
        zoom={4}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {position && <Marker position={position} />}
        <MapEvents setPosition={setPosition} onAddressFound={onAddressFound} />
      </MapContainer>
    </div>
  );
};
