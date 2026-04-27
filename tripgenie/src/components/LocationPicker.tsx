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
}

const MapEvents = ({ setPosition }: { setPosition: (pos: { lat: number; lng: number }) => void }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return null;
};

export const LocationPicker: React.FC<LocationPickerProps> = ({ position, setPosition }) => {
  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
      <MapContainer
        center={[20.5937, 78.9629]} // Default to India
        zoom={4}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position && <Marker position={position} />}
        <MapEvents setPosition={setPosition} />
      </MapContainer>
    </div>
  );
};
