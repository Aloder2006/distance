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

// Custom minimal circular markers
const makeIcon = (color) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:14px;height:14px;
      background:${color};
      border-radius:50%;
      border:2.5px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.25);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

const adminIcon = makeIcon('#18181b');  // zinc-900
const visitorIcon = makeIcon('#71717a'); // zinc-500

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
      api.logVisitor(navigator.userAgent).catch(() => { });
    }
  }, []);

  const requestLocation = async () => {
    setPhase(PHASE.LOADING);
    setError('');
    try {
      const loc = await api.getLocation();
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
    } catch (err) {
      if (err.code === 1) {
        setPhase(PHASE.DENIED);
      } else {
        setError('حدث خطأ ما. يرجى المحاولة مرة أخرى.');
        setPhase(PHASE.ASK);
      }
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await api.sendMessage({
        text: message.trim(),
        distanceInMeters: distance,
        senderLat: visitorCoords.lat,
        senderLng: visitorCoords.lng,
      });
      setPhase(PHASE.SENT);
    } catch {
      setError('تعذّر إرسال الرسالة. حاول مرة أخرى.');
    } finally {
      setSending(false);
    }
  };

  const positions = visitorCoords && adminLocation
    ? [[visitorCoords.lat, visitorCoords.lng], [adminLocation.lat, adminLocation.lng]]
    : [];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Ask phase */}
      {phase === PHASE.ASK && (
        <div className="animate-fadeInUp w-full max-w-sm">
          <Card>
            <div className="mb-8">
              <div className="w-10 h-px bg-zinc-900 mb-6" />
              <h1 className="text-2xl font-semibold text-zinc-900 leading-snug mb-3">
                المسافة بيننا
              </h1>
              <p className="text-sm text-zinc-500 leading-relaxed">
                أريد أن أعرف كم تبعد عني الآن.
                <br />
                لن يتم حفظ موقعك بشكل دائم.
              </p>
            </div>
            {error && <p className="text-xs text-zinc-400 mb-4 text-center">{error}</p>}
            <PrimaryButton onClick={requestLocation}>
              احسب المسافة
            </PrimaryButton>
          </Card>
          <p className="text-center text-xs text-zinc-300 mt-6">عبدالرحمن</p>
        </div>
      )}

      {/* Loading phase */}
      {phase === PHASE.LOADING && (
        <div className="animate-fadeInUp w-full max-w-sm">
          <Card>
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-800 rounded-full animate-spin" />
              <p className="text-sm text-zinc-400 animate-pulse-soft">جارٍ تحديد موقعك...</p>
            </div>
          </Card>
        </div>
      )}

      {/* Denied phase */}
      {phase === PHASE.DENIED && (
        <div className="animate-fadeInUp w-full max-w-sm">
          <Card>
            <div className="mb-6">
              <div className="w-10 h-px bg-zinc-200 mb-6" />
              <p className="text-sm text-zinc-500 leading-relaxed mb-6">
                لم أتمكن من الوصول لموقعك. يمكنك السماح بالوصول من إعدادات المتصفح والمحاولة مرة أخرى.
              </p>
            </div>
            <SecondaryButton onClick={() => setPhase(PHASE.ASK)}>
              حاول مرة أخرى
            </SecondaryButton>
          </Card>
        </div>
      )}

      {/* Reveal phase */}
      {phase === PHASE.REVEAL && visitorCoords && adminLocation && (
        <div className="animate-fadeInUp w-full max-w-lg space-y-4">
          {/* Map */}
          <div className="rounded-2xl overflow-hidden border border-zinc-200 shadow-sm" style={{ height: 320 }}>
            <MapContainer
              center={[visitorCoords.lat, visitorCoords.lng]}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution=""
              />
              <Marker position={[adminLocation.lat, adminLocation.lng]} icon={adminIcon} />
              <Marker position={[visitorCoords.lat, visitorCoords.lng]} icon={visitorIcon} />
              <Polyline
                positions={positions}
                pathOptions={{
                  color: '#18181b',
                  weight: 1.5,
                  opacity: 0.6,
                  dashArray: '6, 8',
                }}
              />
              <FitBounds positions={positions} />
            </MapContainer>
          </div>

          {/* Distance display */}
          <Card>
            <div className="text-center mb-6">
              <p className="text-xs text-zinc-400 mb-1">المسافة المباشرة بيننا الآن</p>
              <p className="text-3xl font-bold text-zinc-900 tracking-tight">
                {formatDistance(distance)}
              </p>
              <p className="text-xs text-zinc-300 mt-1">
                ({distance.toLocaleString('ar-EG')} متر تقريباً)
              </p>
            </div>

            <div className="w-full h-px bg-zinc-100 mb-6" />

            <p className="text-sm text-zinc-500 mb-3">اترك لي رسالة</p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="اكتب ما يخطر ببالك..."
              rows={3}
              className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 placeholder-zinc-300 outline-none focus:border-zinc-400 focus:bg-white transition-all leading-relaxed"
            />
            {error && <p className="text-xs text-zinc-400 mt-2">{error}</p>}
            <div className="mt-3">
              <PrimaryButton onClick={handleSend} disabled={sending || !message.trim()}>
                {sending ? 'جارٍ الإرسال...' : 'أرسل'}
              </PrimaryButton>
            </div>
          </Card>
        </div>
      )}

      {/* Sent phase */}
      {phase === PHASE.SENT && (
        <div className="animate-fadeInUp w-full max-w-sm">
          <Card>
            <div className="text-center py-4">
              <div className="w-10 h-px bg-zinc-900 mx-auto mb-6" />
              <p className="text-lg font-medium text-zinc-800 mb-2">وصلت رسالتك</p>
              <p className="text-sm text-zinc-400">شكراً لك على المشاركة.</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// Shared UI components
function Card({ children }) {
  return (
    <div className="bg-white border border-zinc-100 rounded-2xl p-7 shadow-sm">
      {children}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-zinc-900 text-white text-sm font-medium rounded-xl py-3 px-6 transition-all hover:bg-zinc-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full border border-zinc-200 text-zinc-600 text-sm font-medium rounded-xl py-3 px-6 transition-all hover:border-zinc-400 hover:text-zinc-800 active:scale-95"
    >
      {children}
    </button>
  );
}
