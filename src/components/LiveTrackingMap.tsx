import React, { useEffect, useRef } from 'react';
import L from 'leaflet';


interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LiveTrackingMapProps {
  restaurantCoordinates: Coordinates;
  deliveryCoordinates: Coordinates;
  riderCoordinates?: Coordinates;
  riderName?: string;
}

const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  restaurantCoordinates,
  deliveryCoordinates,
  riderCoordinates,
  riderName = 'Delivery Partner',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  // Marker references to update dynamically instead of re-creating the map
  const restaurantMarkerRef = useRef<L.Marker | null>(null);
  const deliveryMarkerRef = useRef<L.Marker | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Custom DivIcon creator using Lucide icons inside Tailwind CSS styling
  const createCustomIcon = (htmlContent: string, bgClass: string) => {
    return L.divIcon({
      html: `<div class="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-fade-in ${bgClass}">${htmlContent}</div>`,
      className: 'custom-leaflet-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([restaurantCoordinates.latitude, restaurantCoordinates.longitude], 14);

    mapRef.current = map;

    // Load OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Create Restaurant Icon (Orange)
    const restaurantHtml = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white">
        <path d="m12 3-1.912 5.886a1 1 0 0 1-.95.686H2.949l4.896 3.56a1 1 0 0 1 .364 1.117L6.297 20.13a1 1 0 0 0 1.543 1.118l4.897-3.56a1 1 0 0 1 1.18 0l4.898 3.56a1 1 0 0 0 1.543-1.118l-1.908-5.88a1 1 0 0 1 .364-1.118l4.896-3.56h-6.189a1 1 0 0 1-.95-.686L12 3z"/>
      </svg>`;
    const restaurantIcon = createCustomIcon(restaurantHtml, 'bg-gradient-to-tr from-orange-500 to-amber-500');
    
    const restaurantMarker = L.marker(
      [restaurantCoordinates.latitude, restaurantCoordinates.longitude],
      { icon: restaurantIcon }
    )
      .addTo(map)
      .bindPopup('<b class="text-slate-900">Gourmet Express Kitchen</b><br/><span class="text-[10px] text-slate-600">2-61, Nallaballe(V), AP</span>');
    restaurantMarkerRef.current = restaurantMarker;

    // Create Delivery Icon (Blue)
    const deliveryHtml = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>`;
    const deliveryIcon = createCustomIcon(deliveryHtml, 'bg-gradient-to-tr from-blue-500 to-cyan-500');
    
    const deliveryMarker = L.marker(
      [deliveryCoordinates.latitude, deliveryCoordinates.longitude],
      { icon: deliveryIcon }
    )
      .addTo(map)
      .bindPopup('<b class="text-slate-900">Your Delivery Address</b>');
    deliveryMarkerRef.current = deliveryMarker;

    // Adjust map to fit restaurant and delivery address bounds
    const bounds = L.latLngBounds([
      [restaurantCoordinates.latitude, restaurantCoordinates.longitude],
      [deliveryCoordinates.latitude, deliveryCoordinates.longitude],
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Rider position dynamically when coordinates shift
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (riderCoordinates) {
      const riderLatLng: L.LatLngExpression = [riderCoordinates.latitude, riderCoordinates.longitude];

      // Update or create Rider marker
      if (riderMarkerRef.current) {
        riderMarkerRef.current.setLatLng(riderLatLng);
      } else {
        const riderHtml = `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-10 h-10 bg-emerald-500 rounded-full animate-pulse-ring opacity-75"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white relative z-10">
              <rect x="1" y="3" width="15" height="13" rx="2" ry="2"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>`;
        const riderIcon = createCustomIcon(riderHtml, 'bg-gradient-to-tr from-emerald-500 to-green-500');
        
        riderMarkerRef.current = L.marker(riderLatLng, { icon: riderIcon })
          .addTo(map)
          .bindPopup(`<b class="text-slate-900">${riderName} (Live GPS)</b>`)
          .openPopup();
      }

      // Draw or update route lines (Restaurant -> Rider -> Delivery)
      const routePoints: L.LatLngExpression[] = [
        [restaurantCoordinates.latitude, restaurantCoordinates.longitude],
        riderLatLng,
        [deliveryCoordinates.latitude, deliveryCoordinates.longitude],
      ];

      if (routeLineRef.current) {
        routeLineRef.current.setLatLngs(routePoints);
      } else {
        routeLineRef.current = L.polyline(routePoints, {
          color: '#f97316',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8',
        }).addTo(map);
      }

      // Pan to center rider
      map.panTo(riderLatLng);
    } else {
      // Remove rider marker and lines if rider coordinates are empty
      if (riderMarkerRef.current) {
        map.removeLayer(riderMarkerRef.current);
        riderMarkerRef.current = null;
      }
      if (routeLineRef.current) {
        map.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
    }
  }, [riderCoordinates, riderName, restaurantCoordinates, deliveryCoordinates]);

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '100%' }} />
      
      {/* HUD Info bar */}
      <div className="absolute bottom-4 left-4 right-4 z-[400] glass p-3.5 rounded-xl border border-slate-700/60 shadow-lg flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="font-semibold text-slate-200">
            {riderCoordinates ? 'GPS Connection Active' : 'Waiting for Rider Pickup'}
          </span>
        </div>
        <div className="text-slate-400 text-right">
          {riderCoordinates ? (
            <span className="text-orange-400 font-bold">Rider is en route</span>
          ) : (
            <span>Preparing order at kitchen</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingMap;
