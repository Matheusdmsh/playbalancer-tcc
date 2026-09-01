"use client";

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
    iconUrl: markerIcon.src,
    iconRetinaUrl: markerIcon2x.src,
    shadowUrl: markerShadow.src,
});

// Componente para alterar a visualização do mapa programaticamente
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    map.setView(center, zoom);
    return null;
}

interface LocationMarkerProps {
    onLocationSelect: (latlng: { lat: number, lng: number }) => void;
}

function LocationMarker({ onLocationSelect }: LocationMarkerProps) {
    const [position, setPosition] = useState<L.LatLng | null>(null);

    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onLocationSelect(e.latlng);
        },
    });

    return position === null ? null : <Marker position={position} />;
}

interface MapPickerProps {
    onLocationSelect: (latlng: { lat: number, lng: number }) => void;
    center: [number, number];
    readOnly?: boolean;
}

export default function MapPicker({ onLocationSelect, center, readOnly = false }: MapPickerProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            {isClient ? (
                <MapContainer 
                    center={center} 
                    zoom={15}
                    style={{ height: '100%', width: '100%', filter: 'invert(1) hue-rotate(180deg) grayscale(1) contrast(1.1) brightness(0.9) ' }}
                    attributionControl={false}
                >
                    <ChangeView center={center} zoom={15} />
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {readOnly ? (
                        <Marker position={center} />
                    ) : (
                        <LocationMarker onLocationSelect={onLocationSelect} />
                    )}
                </MapContainer>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#333' }}>
                    Carregando mapa...
                </div>
            )}
        </div>
    );
}