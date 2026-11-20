import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Custom modern SVG icons for Farmers and Processors
const processorIcon = L.divIcon({
  className: 'custom-processor-pin',
  html: `
    <div style="background-color: #166534; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(22,101,52,0.4); border: 2.5px solid #FFFFFF;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20]
});

const farmerIcon = (rank?: number, isAllocated?: boolean) => L.divIcon({
  className: 'custom-farmer-pin',
  html: `
    <div style="background-color: ${isAllocated ? '#10B981' : '#F59E0B'}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; box-shadow: 0 4px 10px rgba(0,0,0,0.25); border: 2px solid #FFFFFF;">
      ${rank ? `#${rank}` : '🌱'}
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18]
});

export interface MapSupplier {
  id: string;
  farmer_name: string;
  farm_name: string;
  village: string;
  district: string;
  crop_name: string;
  quality_grade: string;
  available_quantity_kg: number;
  allocated_quantity_kg?: number;
  expected_harvest_date?: string;
  distance_km: number;
  match_score?: number;
  rank?: number;
  latitude: number;
  longitude: number;
}

interface AgroMapProps {
  processorLocation?: {
    name: string;
    latitude: number;
    longitude: number;
    maxRadiusKm?: number;
  };
  suppliers?: MapSupplier[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export const AgroMap: React.FC<AgroMapProps> = ({
  processorLocation = {
    name: "Sahyadri Agro Processing Plant",
    latitude: 19.9975,
    longitude: 73.7898,
    maxRadiusKm: 150
  },
  suppliers = [],
  center = [20.0, 74.0],
  zoom = 9,
  className = "h-[450px] w-full rounded-2xl shadow-premium border border-emerald-100"
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Processor Plant Marker */}
        {processorLocation && (
          <>
            <Marker
              position={[processorLocation.latitude, processorLocation.longitude]}
              icon={processorIcon}
            >
              <Popup>
                <div className="p-1 min-w-[190px]">
                  <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-forest text-white mb-1.5">
                    Food Processor
                  </span>
                  <h4 className="font-bold text-gray-900 text-sm">{processorLocation.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Central Aggregation & Processing Hub
                  </p>
                  <p className="text-xs text-emerald-800 font-medium mt-1">
                    Procurement Radius: {processorLocation.maxRadiusKm || 150} km
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* Procurement Radius Circle */}
            {processorLocation.maxRadiusKm && (
              <Circle
                center={[processorLocation.latitude, processorLocation.longitude]}
                radius={(processorLocation.maxRadiusKm || 150) * 1000}
                pathOptions={{
                  color: '#166534',
                  fillColor: '#10B981',
                  fillOpacity: 0.08,
                  weight: 1.5,
                  dashArray: '4, 4'
                }}
              />
            )}
          </>
        )}

        {/* Suppliers Markers */}
        {suppliers.map((supplier) => (
          <React.Fragment key={supplier.id || supplier.farm_name}>
            <Marker
              position={[supplier.latitude, supplier.longitude]}
              icon={farmerIcon(supplier.rank, (supplier.allocated_quantity_kg || 0) > 0)}
            >
              <Popup>
                <div className="p-1 min-w-[210px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-forest">
                      {supplier.rank ? `Rank #${supplier.rank}` : 'Eligible Farm'}
                    </span>
                    {supplier.match_score && (
                      <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-2 py-0.5 rounded-full">
                        {supplier.match_score}% Match
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">{supplier.farmer_name}</h4>
                  <p className="text-xs text-gray-600">{supplier.farm_name}</p>
                  <p className="text-xs text-gray-500">{supplier.village}, {supplier.district}</p>

                  <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-2 gap-1 text-xs">
                    <div>
                      <span className="text-gray-400 block">Crop:</span>
                      <span className="font-semibold text-gray-800">{supplier.crop_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Grade:</span>
                      <span className="font-semibold text-gray-800">{supplier.quality_grade}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Available:</span>
                      <span className="font-semibold text-emerald-700">{supplier.available_quantity_kg?.toLocaleString()} kg</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Distance:</span>
                      <span className="font-semibold text-gray-800">{supplier.distance_km} km</span>
                    </div>
                  </div>

                  {(supplier.allocated_quantity_kg || 0) > 0 && (
                    <div className="mt-2 bg-emerald-50 text-emerald-800 text-xs px-2 py-1 rounded font-medium text-center">
                      AI Allocated: {supplier.allocated_quantity_kg?.toLocaleString()} kg
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>

            {/* Connecting transit line to processor */}
            {processorLocation && (
              <Polyline
                positions={[
                  [processorLocation.latitude, processorLocation.longitude],
                  [supplier.latitude, supplier.longitude]
                ]}
                pathOptions={{
                  color: (supplier.allocated_quantity_kg || 0) > 0 ? '#10B981' : '#CBD5E1',
                  weight: (supplier.allocated_quantity_kg || 0) > 0 ? 2 : 1,
                  dashArray: (supplier.allocated_quantity_kg || 0) > 0 ? '5, 5' : '2, 6',
                  opacity: 0.7
                }}
              />
            )}
          </React.Fragment>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl border border-gray-200 text-xs shadow-md space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-forest border border-white"></div>
          <span className="text-gray-700 font-medium">Processor Plant (Nashik)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald border border-white"></div>
          <span className="text-gray-700 font-medium">Allocated Supplier</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-amber border border-white"></div>
          <span className="text-gray-700 font-medium">Standby / Backup Grower</span>
        </div>
      </div>
    </div>
  );
};
