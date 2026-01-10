'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface Signal {
  id: string;
  reporter: string;
  signal_type: number;
  lat: number;
  lon: number;
  timestamp: string;
  confidence: number;
}

interface Props {
  signals: Signal[];
  userLocation: { lat: number; lon: number } | null;
  onSignalClick: (signal: Signal) => void;
  onMapLoad?: () => void;
}

const SIGNAL_EMOJIS: Record<number, string> = {
  0: '🚔',
  1: '🔊',
  2: '⚠️',
  3: '🚗',
};

export function MapContainer({
  signals,
  userLocation,
  onSignalClick,
  onMapLoad,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const userMarker = useRef<mapboxgl.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      console.error('Mapbox access token not found');
      return;
    }

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: process.env.NEXT_PUBLIC_MAPBOX_STYLE || 'mapbox://styles/mapbox/dark-v11',
      center: userLocation ? [userLocation.lon, userLocation.lat] : [-122.4194, 37.7749],
      zoom: 13,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

  
    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
    });
    map.current.addControl(geolocateControl, 'bottom-right');

    map.current.on('load', () => {
      onMapLoad?.();
    });

    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current.clear();
      if (userMarker.current) {
        userMarker.current.remove();
        userMarker.current = null;
      }
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    const locationMap = new Map<string, Signal[]>();
    signals.forEach((signal) => {
      const key = `${signal.lat.toFixed(6)}_${signal.lon.toFixed(6)}`;
      if (!locationMap.has(key)) {
        locationMap.set(key, []);
      }
      locationMap.get(key)!.push(signal);
    });

    markers.current.forEach((marker, id) => {
      if (!signals.find((s) => String(s.id) === String(id))) {
        marker.remove();
        markers.current.delete(id);
      }
    });

    signals.forEach((signal) => {
      const signalId = String(signal.id);
      if (!markers.current.has(signalId)) {
        const locationKey = `${signal.lat.toFixed(6)}_${signal.lon.toFixed(6)}`;
        const signalsAtLocation = locationMap.get(locationKey) || [];
        const indexInLocation = signalsAtLocation.findIndex((s) => String(s.id) === signalId);
        
        const offsetDistance = 0.0001;
        const angle = (indexInLocation / signalsAtLocation.length) * Math.PI * 2;
        const offsetLat = signal.lat + Math.cos(angle) * offsetDistance;
        const offsetLon = signal.lon + Math.sin(angle) * offsetDistance;

        const el = document.createElement('div');
        el.className = 'signal-marker';
        el.innerHTML = SIGNAL_EMOJIS[signal.signal_type] || '📍';
        el.style.fontSize = '32px';
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => onSignalClick(signal));

        const marker = new mapboxgl.Marker(el)
          .setLngLat([offsetLon, offsetLat])
          .addTo(map.current!);

        markers.current.set(signalId, marker);
      }
    });
  }, [signals, onSignalClick]);

  // Update user location marker
  useEffect(() => {
    if (!map.current || !userLocation) return;

    // Remove old user marker if exists
    if (userMarker.current) {
      userMarker.current.remove();
    }

    // Create/update user marker
    const el = document.createElement('div');
    el.className = 'user-marker';
    el.innerHTML = '📍';
    el.style.fontSize = '40px';

    // CRITICAL: Mapbox uses [longitude, latitude] order
    userMarker.current = new mapboxgl.Marker(el)
      .setLngLat([userLocation.lon, userLocation.lat])
      .addTo(map.current);

    // Center map on user location (only on first location)
    if (signals.length === 0) {
      map.current.flyTo({
        center: [userLocation.lon, userLocation.lat],
        zoom: 14,
        duration: 1000,
      });
    }

    return () => {
      if (userMarker.current) {
        userMarker.current.remove();
        userMarker.current = null;
      }
    };
  }, [userLocation, signals.length]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
}
