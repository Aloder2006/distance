import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { formatDistance } from '../utils/distance';

const TABS = {
  LOCATION: 'location',
  MESSAGES: 'messages',
};

export default function AdminPage() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [tab, setTab] = useState(TABS.LOCATION);
  const [messages, setMessages] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [locStatus, setLocStatus] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    api.getLocation()
      .then(d => d.adminLat && setCurrentLocation(d))
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (!token) return;
    if (tab === TABS.MESSAGES) {
      api.getMessages().then(setMessages).catch(handleApiError);
    }
  }, [tab, token]);

  const handleApiError = (err) => {
    if (err.message === 'Invalid Token' || err.message === 'Access Denied') {
      handleLogout();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await api.login(password);
      localStorage.setItem('adminToken', res.token);
      setToken(res.token);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
  };

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="glass-panel p-10 shadow-2xl w-full max-w-sm relative overflow-hidden rounded-3xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.15)] to-transparent opacity-50"></div>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-serif font-semibold text-[#fdf8f5] mb-2">Admin Dashboard</h1>
            <p className="text-sm font-light text-[#e5d3c8] opacity-80">Enter your password to access the portal</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password..."
              className="w-full rounded-xl px-4 py-3.5 text-sm font-light glass-input"
              required
            />
            {loginError && <p className="text-xs text-[#ffb0a0] text-center">{loginError}</p>}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full text-sm font-semibold tracking-wide uppercase rounded-xl py-3.5 px-6 glass-button-primary"
            >
              {isLoggingIn ? 'Verifying...' : 'Log In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleUpdateLocation = () => {
    setLoadingLoc(true);
    setLocStatus('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const result = await api.updateLocation(pos.coords.latitude, pos.coords.longitude);
          setCurrentLocation(result);
          setLocStatus('Location updated successfully');
        } catch {
          setLocStatus('Error updating location');
        } finally {
          setLoadingLoc(false);
        }
      },
      () => {
        setLocStatus('Unable to access location. Check browser settings.');
        setLoadingLoc(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="min-h-screen px-4 py-10 font-sans text-[#f5e6d3]">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="w-10 h-px bg-[rgba(245,230,211,0.5)] mb-4 shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
            <h1 className="text-3xl font-serif font-bold text-[#fdf8f5] tracking-tight">Dashboard</h1>
            <p className="text-xs font-light tracking-widest uppercase text-[#c8aa96] mt-2 opacity-80">Admin Portal</p>
          </div>
          <button 
            onClick={handleLogout} 
            className="text-xs font-medium tracking-wide uppercase glass-button-secondary px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-4">
          <p className="text-sm font-medium tracking-wide text-[#e5d3c8]">
            Total Visits: <span className="font-bold text-[#fdf8f5] ml-1">{messages.length}</span>
          </p>
        </div>
        <div className="flex gap-2 glass-panel p-1.5 mb-8 rounded-xl">
          {[
            { key: TABS.LOCATION, label: 'Location' },
            { key: TABS.MESSAGES, label: 'Messages & Visitors' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 text-sm font-medium py-2.5 rounded-lg transition-all ${
                tab === key
                  ? 'bg-[rgba(255,255,255,0.1)] text-[#fff] shadow-[0_2px_10px_rgba(0,0,0,0.2)]'
                  : 'text-[#e5d3c8] hover:bg-[rgba(255,255,255,0.05)] opacity-80 hover:opacity-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab: Location */}
        {tab === TABS.LOCATION && (
          <div className="animate-fadeInUp">
            <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.1)] to-transparent opacity-50"></div>
              
              {currentLocation && (
                <div className="mb-6 p-5 bg-[rgba(0,0,0,0.2)] rounded-2xl border border-[rgba(255,255,255,0.05)] shadow-inner">
                  <p className="text-xs tracking-widest uppercase font-semibold text-[#c8aa96] mb-2 opacity-80">Current Saved Location</p>
                  <p className="text-sm font-mono text-[#fdf8f5]">
                    {currentLocation.adminLat?.toFixed(5)}, {currentLocation.adminLng?.toFixed(5)}
                  </p>
                  {currentLocation.updatedAt && (
                    <p className="text-xs font-light text-[#e5d3c8] mt-2 opacity-60">
                      Last Updated: {new Date(currentLocation.updatedAt).toLocaleString('en-US')}
                    </p>
                  )}
                </div>
              )}
              <p className="text-sm font-light text-[#e5d3c8] mb-6 leading-relaxed opacity-90">
                Tap the button to update your geographic location. This will be used to calculate the distance with your visitors.
              </p>
              <button
                onClick={handleUpdateLocation}
                disabled={loadingLoc}
                className="w-full text-sm font-semibold tracking-wide uppercase rounded-xl py-3.5 px-6 glass-button-primary flex items-center justify-center gap-3"
              >
                {loadingLoc && (
                  <div className="w-4 h-4 border-2 border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-spin" />
                )}
                {loadingLoc ? 'Updating...' : 'Update My Location'}
              </button>
              {locStatus && (
                <p className="text-xs text-center mt-4 text-[#e5d3c8] font-light">{locStatus}</p>
              )}
            </div>
          </div>
        )}

        {/* Tab: Messages */}
        {tab === TABS.MESSAGES && (
          <div className="animate-fadeInUp space-y-4">
            {messages.length === 0 && (
              <EmptyState text="No messages yet" />
            )}
            {messages.map((msg) => (
              <div
                key={msg._id}
                className="glass-panel p-6 rounded-2xl relative overflow-hidden transition-all hover:bg-[rgba(42,26,18,0.45)]"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[rgba(220,180,140,0.8)] to-[rgba(166,112,65,0.3)] opacity-70"></div>
                
                <p className={`text-sm font-light leading-relaxed mb-5 px-3 ${msg.text ? 'text-[#fdf8f5]' : 'text-[#c8aa96] italic opacity-70'}`}>
                  {msg.text || 'No text message (Location shared only)'}
                </p>
                
                <div className="flex items-center justify-between flex-wrap gap-4 px-3">
                  <div className="flex gap-6">
                    <Stat label="Distance" value={msg.distanceInMeters != null ? formatDistance(msg.distanceInMeters) : 'Not Allowed'} />
                    <Stat label="Date" value={new Date(msg.createdAt).toLocaleDateString('en-US')} />
                    <Stat label="Location" value={msg.address || 'Unknown'} />
                  </div>
                  {msg.senderLat != null && msg.senderLng != null && (
                    <a
                      href={`http://maps.google.com/?q=${msg.senderLat},${msg.senderLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium tracking-wide uppercase glass-button-secondary px-3 py-1.5 rounded-lg"
                    >
                      Open Map
                    </a>
                  )}
                </div>

                {(msg.deviceInfo || msg.ipAddress) && (
                  <div className="mt-5 pt-4 border-t border-[rgba(255,255,255,0.06)] grid grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-6 px-3">
                    <Stat label="IP Address" value={msg.ipAddress || 'Unavailable'} />
                    <Stat label="Platform" value={msg.deviceInfo?.platform || 'Unknown'} />
                    <Stat label="Browser" value={parseUserAgent(msg.deviceInfo?.userAgent)} />
                    <Stat label="Timezone" value={msg.deviceInfo?.timeZone || 'Unknown'} />
                    <Stat label="Screen" value={msg.deviceInfo?.screenResolution || 'Unknown'} />
                    <Stat label="Language" value={msg.deviceInfo?.language || 'Unknown'} />
                    <Stat label="RAM" value={`${msg.deviceInfo?.memoryGB} GB` || 'Unknown'} />
                    <Stat label="CPU Cores" value={`${msg.deviceInfo?.cpuCores} Cores` || 'Unknown'} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] tracking-widest uppercase font-semibold text-[#c8aa96] opacity-70">{label}</p>
      <p className="text-sm font-medium text-[#fdf8f5]">{value}</p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="glass-panel p-12 text-center rounded-3xl">
      <p className="text-sm font-light tracking-wide text-[#a8998b]">{text}</p>
    </div>
  );
}

function parseUserAgent(ua = '') {
  if (!ua) return 'Unknown Visitor';
  if (/iPhone|iPad/.test(ua)) return 'iOS — ' + (ua.match(/CPU OS ([\d_]+)/) || ['', ''])[1].replace(/_/g, '.');
  if (/Android/.test(ua)) return 'Android — ' + (ua.match(/Android ([\d.]+)/) || ['', ''])[1];
  if (/Windows/.test(ua)) return 'Windows — ' + (ua.match(/Windows NT ([\d.]+)/) || ['', ''])[1];
  if (/Mac OS/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  return ua.slice(0, 60) + '...';
}
