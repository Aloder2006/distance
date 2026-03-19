const BASE = process.env.REACT_APP_API_URL || '/api';

export const api = {
  getLocation: () => fetch(`${BASE}/location`).then(r => r.json()),
  updateLocation: (adminLat, adminLng) =>
    fetch(`${BASE}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminLat, adminLng }),
    }).then(r => r.json()),

  logVisitor: (userAgent) =>
    fetch(`${BASE}/visitors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userAgent }),
    }).then(r => r.json()),
  getVisitors: () => fetch(`${BASE}/visitors`).then(r => r.json()),

  sendMessage: (data) =>
    fetch(`${BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),
  getMessages: () => fetch(`${BASE}/messages`).then(r => r.json()),
};
