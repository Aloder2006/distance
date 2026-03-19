const BASE = process.env.REACT_APP_API_URL || '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const api = {
  login: (password) => fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  }).then(async r => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Login failed');
    return data;
  }),

  getLocation: () => fetch(`${BASE}/location`).then(r => r.json()),
  updateLocation: (adminLat, adminLng) =>
    fetch(`${BASE}/location`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ adminLat, adminLng }),
    }).then(r => r.json()),

  logVisitor: (userAgent) =>
    fetch(`${BASE}/visitors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userAgent }),
    }).then(r => r.json()),
  getVisitors: () => fetch(`${BASE}/visitors`, { headers: getAuthHeaders() }).then(async r => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Error fetching visitors');
    return data;
  }),

  sendMessage: (data) =>
    fetch(`${BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),
  updateMessage: (id, payload) =>
    fetch(`${BASE}/messages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(r => r.json()),
  getMessages: () => fetch(`${BASE}/messages`, { headers: getAuthHeaders() }).then(async r => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Error fetching messages');
    return data;
  }),
};
