import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { formatDistance } from '../utils/distance';

const TABS = {
  LOCATION: 'location',
  MESSAGES: 'messages',
  VISITORS: 'visitors',
};

export default function AdminPage() {
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
    if (tab === TABS.MESSAGES) {
      api.getMessages().then(setMessages).catch(() => { });
    }
    if (tab === TABS.VISITORS) {
      api.getVisitors().then(setVisitors).catch(() => { });
    }
  }, [tab]);

  const handleUpdateLocation = () => {
    setLoadingLoc(true);
    setLocStatus('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const result = await api.updateLocation(pos.coords.latitude, pos.coords.longitude);
          setCurrentLocation(result);
          setLocStatus('تم تحديث الموقع بنجاح');
        } catch {
          setLocStatus('حدث خطأ أثناء التحديث');
        } finally {
          setLoadingLoc(false);
        }
      },
      () => {
        setLocStatus('تعذّر الوصول للموقع. تحقق من صلاحيات المتصفح.');
        setLoadingLoc(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="w-8 h-px bg-zinc-900 mb-4" />
          <h1 className="text-xl font-semibold text-zinc-900">لوحة التحكم</h1>
          <p className="text-xs text-zinc-400 mt-1">عبدالرحمن</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-100 rounded-xl p-1 mb-6">
          {[
            { key: TABS.LOCATION, label: 'موقعي' },
            { key: TABS.MESSAGES, label: 'الرسائل' },
            { key: TABS.VISITORS, label: 'الزوار' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all ${tab === key
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab: Location */}
        {tab === TABS.LOCATION && (
          <div className="animate-fadeInUp">
            <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm">
              {currentLocation && (
                <div className="mb-5 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-xs text-zinc-400 mb-1">الموقع الحالي المحفوظ</p>
                  <p className="text-sm text-zinc-700 font-mono">
                    {currentLocation.adminLat?.toFixed(5)}, {currentLocation.adminLng?.toFixed(5)}
                  </p>
                  {currentLocation.updatedAt && (
                    <p className="text-xs text-zinc-300 mt-1">
                      آخر تحديث: {new Date(currentLocation.updatedAt).toLocaleString('ar-EG')}
                    </p>
                  )}
                </div>
              )}
              <p className="text-sm text-zinc-500 mb-5 leading-relaxed">
                اضغط الزر لتحديث موقعك الجغرافي تلقائياً. سيتم استخدام هذا الموقع لحساب المسافة مع الزوار.
              </p>
              <button
                onClick={handleUpdateLocation}
                disabled={loadingLoc}
                className="w-full bg-zinc-900 text-white text-sm font-medium rounded-xl py-3 px-6 transition-all hover:bg-zinc-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingLoc && (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                تحديث موقعي التلقائي
              </button>
              {locStatus && (
                <p className="text-xs text-center mt-3 text-zinc-400">{locStatus}</p>
              )}
            </div>
          </div>
        )}

        {/* Tab: Messages */}
        {tab === TABS.MESSAGES && (
          <div className="animate-fadeInUp space-y-3">
            {messages.length === 0 && (
              <EmptyState text="لا توجد رسائل بعد" />
            )}
            {messages.map((msg) => (
              <div
                key={msg._id}
                className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm"
              >
                <p className="text-sm text-zinc-800 leading-relaxed mb-4">{msg.text}</p>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex gap-4">
                    <Stat label="المسافة" value={formatDistance(msg.distanceInMeters)} />
                    <Stat
                      label="التاريخ"
                      value={new Date(msg.createdAt).toLocaleDateString('ar-EG')}
                    />
                  </div>
                  <a
                    href={`http://maps.google.com/?q=${msg.senderLat},${msg.senderLng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs border border-zinc-200 text-zinc-600 rounded-lg px-3 py-1.5 hover:border-zinc-400 hover:text-zinc-800 transition-all"
                  >
                    فتح موقع المرسل
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Visitors */}
        {tab === TABS.VISITORS && (
          <div className="animate-fadeInUp">
            {visitors.length === 0 && <EmptyState text="لا توجد زيارات بعد" />}
            {visitors.length > 0 && (
              <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-50">
                  <p className="text-sm font-medium text-zinc-700">
                    إجمالي الزيارات:{' '}
                    <span className="font-semibold text-zinc-900">{visitors.length}</span>
                  </p>
                </div>
                <div className="divide-y divide-zinc-50">
                  {visitors.map((v) => (
                    <div key={v._id} className="px-5 py-3">
                      <p className="text-xs text-zinc-500 mb-1 truncate max-w-full">
                        {parseUserAgent(v.userAgent)}
                      </p>
                      <p className="text-xs text-zinc-300">
                        {v.visitDate} — {v.visitTime}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="text-sm font-medium text-zinc-700">{value}</p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="bg-white border border-zinc-100 rounded-2xl p-10 shadow-sm text-center">
      <p className="text-sm text-zinc-300">{text}</p>
    </div>
  );
}

function parseUserAgent(ua = '') {
  if (!ua) return 'زائر غير معروف';
  if (/iPhone|iPad/.test(ua)) return 'iOS — ' + (ua.match(/CPU OS ([\d_]+)/) || ['', ''])[1].replace(/_/g, '.');
  if (/Android/.test(ua)) return 'Android — ' + (ua.match(/Android ([\d.]+)/) || ['', ''])[1];
  if (/Windows/.test(ua)) return 'Windows — ' + (ua.match(/Windows NT ([\d.]+)/) || ['', ''])[1];
  if (/Mac OS/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  return ua.slice(0, 60) + '...';
}
