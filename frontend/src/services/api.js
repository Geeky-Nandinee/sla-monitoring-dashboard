const API_BASE_URL = '/api';

/**
 * Upload CSV file to backend endpoint
 */
export async function uploadCsv(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to upload CSV file.');
  }

  return result;
}

/**
 * Fetch SLA metrics with optional date/service filters
 */
export async function fetchStats({ fromDate, toDate, service } = {}) {
  const params = new URLSearchParams();
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (service && service !== 'all') params.append('service', service);

  const response = await fetch(`${API_BASE_URL}/stats?${params.toString()}`);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch SLA statistics.');
  }

  return result.data;
}

/**
 * Fetch paginated monitoring logs with filters
 */
export async function fetchLogs({ fromDate, toDate, service, page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (service && service !== 'all') params.append('service', service);
  params.append('page', page);
  params.append('limit', limit);

  const response = await fetch(`${API_BASE_URL}/logs?${params.toString()}`);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch monitoring logs.');
  }

  return result;
}

/**
 * Fetch backend database health status
 */
export async function fetchHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return await response.json();
  } catch (err) {
    return { status: 'error', database: 'disconnected', error: err.message };
  }
}
