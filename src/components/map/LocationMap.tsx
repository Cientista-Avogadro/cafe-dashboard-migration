import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationMapProps {
  latitude: number;
  longitude: number;
  title: string;
  height?: string;
  className?: string;
}

// Ícone personalizado para o marcador
const icon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export function LocationMap({ latitude, longitude, title, height = "400px", className }: LocationMapProps) {
  // Garantir que o Leaflet seja carregado apenas no cliente
  useEffect(() => {
    // Forçar o Leaflet a recarregar seus ícones
    delete (Icon.Default.prototype as any)._getIconUrl;
    Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);

  if (!latitude || !longitude) {
    return (
      <div className="h-[400px] rounded-lg border flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">Localização não definida</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden border ${className || ''}`} style={{ height}}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={[latitude, longitude]}
          icon={icon}
        >
          <Popup>
            {title}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
} 