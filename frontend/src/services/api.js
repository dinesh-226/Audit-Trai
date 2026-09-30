/**
 * MaritimeGuard Central API Client
 */

const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('auditflow_token');
  const demoRole = localStorage.getItem('auditflow_demo_role');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (demoRole) {
    headers['x-demo-role'] = demoRole;
  }
  return headers;
};

const handleResponse = async (res) => {
  if (!res.ok) {
    let errorMsg = 'API request failed';
    try {
      const errorJson = await res.json();
      errorMsg = errorJson.error || errorJson.message || errorMsg;
    } catch (e) {
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }
  return res.json();
};

/**
 * Clean Query String Builder: removes undefined, null, empty strings, and stringified 'undefined'/'null'
 */
const buildQueryString = (params = {}) => {
  const cleanParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      value !== 'undefined' &&
      value !== 'null'
    ) {
      cleanParams[key] = value;
    }
  }
  const qs = new URLSearchParams(cleanParams).toString();
  return qs ? `?${qs}` : '';
};

export const api = {
  // Authentication & Users
  auth: {
    login: async (email, password) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return handleResponse(res);
    },
    register: async (userData) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return handleResponse(res);
    },
    getProfile: async () => {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getDemoUsers: async () => {
      const res = await fetch(`${API_BASE}/auth/demo-users`);
      return handleResponse(res);
    },
    updateProfile: async (profileData) => {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(profileData)
      });
      return handleResponse(res);
    },
    updateUserRole: async (userId, role) => {
      const res = await fetch(`${API_BASE}/auth/users/${userId}/role`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ role })
      });
      return handleResponse(res);
    }
  },

  // Ships Fleet
  ships: {
    getAll: async (params = {}) => {
      const res = await fetch(`${API_BASE}/ships${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getById: async (shipId) => {
      const res = await fetch(`${API_BASE}/ships/${shipId}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    create: async (shipData) => {
      const res = await fetch(`${API_BASE}/ships`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(shipData)
      });
      return handleResponse(res);
    },
    update: async (shipId, updateData) => {
      const res = await fetch(`${API_BASE}/ships/${shipId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updateData)
      });
      return handleResponse(res);
    },
    updateStatus: async (shipId, status, currentLocation) => {
      const res = await fetch(`${API_BASE}/ships/${shipId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status, currentLocation })
      });
      return handleResponse(res);
    }
  },

  // Containers
  containers: {
    getAll: async (params = {}) => {
      const res = await fetch(`${API_BASE}/containers${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getById: async (containerId) => {
      const res = await fetch(`${API_BASE}/containers/${containerId}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getQrPass: async (containerId) => {
      const res = await fetch(`${API_BASE}/containers/${containerId}/qr-pass`);
      return handleResponse(res);
    },
    create: async (containerData) => {
      const res = await fetch(`${API_BASE}/containers`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(containerData)
      });
      return handleResponse(res);
    },
    updateStatus: async (containerId, statusData) => {
      const res = await fetch(`${API_BASE}/containers/${containerId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(statusData)
      });
      return handleResponse(res);
    },
    assignShip: async (containerId, shipId) => {
      const res = await fetch(`${API_BASE}/containers/${containerId}/assign-ship`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ shipId })
      });
      return handleResponse(res);
    }
  },

  // Cryptographic Audit Trail
  auditLogs: {
    getAll: async (params = {}) => {
      const res = await fetch(`${API_BASE}/audit-logs${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getStats: async () => {
      const res = await fetch(`${API_BASE}/audit-logs/stats/summary`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    verifyIntegrity: async () => {
      const res = await fetch(`${API_BASE}/audit-logs/verify-integrity`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    simulateTamper: async (tamperData = {}) => {
      const res = await fetch(`${API_BASE}/audit-logs/simulate-tamper`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(tamperData)
      });
      return handleResponse(res);
    },
    repairChain: async () => {
      const res = await fetch(`${API_BASE}/audit-logs/repair-chain`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getById: async (auditId) => {
      const res = await fetch(`${API_BASE}/audit-logs/${auditId}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // Inspections
  inspections: {
    getAll: async (params = {}) => {
      const res = await fetch(`${API_BASE}/inspections${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    create: async (inspectionData) => {
      const res = await fetch(`${API_BASE}/inspections`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(inspectionData)
      });
      return handleResponse(res);
    }
  },

  // Evidence
  evidence: {
    getAll: async (params = {}) => {
      const res = await fetch(`${API_BASE}/evidence${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    attach: async (evidenceData) => {
      const res = await fetch(`${API_BASE}/evidence`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(evidenceData)
      });
      return handleResponse(res);
    }
  },

  // Anomalies
  anomalies: {
    getAll: async (params = {}) => {
      const res = await fetch(`${API_BASE}/anomalies${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    resolve: async (anomalyId, resolutionNotes) => {
      const res = await fetch(`${API_BASE}/anomalies/${anomalyId}/resolve`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ resolutionNotes })
      });
      return handleResponse(res);
    }
  },

  // Alerts
  alerts: {
    getAll: async (params = {}) => {
      const res = await fetch(`${API_BASE}/alerts${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    markRead: async (alertId) => {
      const res = await fetch(`${API_BASE}/alerts/${alertId}/read`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    markAllRead: async () => {
      const res = await fetch(`${API_BASE}/alerts/mark-all-read`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // AI Assistant
  ai: {
    query: async (prompt) => {
      const res = await fetch(`${API_BASE}/ai/query`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ prompt })
      });
      return handleResponse(res);
    }
  },

  // Reports
  reports: {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/reports`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    generate: async (reportData) => {
      const res = await fetch(`${API_BASE}/reports/generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(reportData)
      });
      return handleResponse(res);
    },
    getHtmlExportUrl: (reportId) => `${API_BASE}/reports/${reportId}/export-html`,
    getCsvExportUrl: () => `${API_BASE}/reports/export/csv`
  },

  // AIS Live Map & Tracking
  tracking: {
    getLiveMap: async () => {
      const res = await fetch(`${API_BASE}/tracking/live-map`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    simulateStep: async () => {
      const res = await fetch(`${API_BASE}/tracking/simulate-step`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // System Diagnostics
  system: {
    getHealth: async () => {
      const res = await fetch(`${API_BASE}/health`);
      return handleResponse(res);
    },
    reseed: async () => {
      const res = await fetch(`${API_BASE}/system/reseed`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  }
};
