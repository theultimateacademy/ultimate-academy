const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  health:             ()       => request('/health'),
  createCheckout:     (body)   => request('/api/stripe/create-checkout',      { method: 'POST', body }),
  freeActivate:       (body)   => request('/api/stripe/free-activate',        { method: 'POST', body }),
  cancelSubscription: (body)   => request('/api/stripe/cancel-subscription',  { method: 'POST', body }),
  generatePlan:       (body)   => request('/api/plans/generate',              { method: 'POST', body }),
  generateAnalysis:   (body)   => request('/api/analyses/generate',           { method: 'POST', body }),
  fatigueAdapt:       (body)   => request('/api/plans/fatigue-adapt',          { method: 'POST', body }),
  generateResponse:   (body)   => request('/api/messages/generate-response',  { method: 'POST', body }),
  periodAlert:        (body)   => request('/api/admin/period-alert',          { method: 'POST', body }),
  weeklyFeedback:     (body)   => request('/api/admin/weekly-feedback',        { method: 'POST', body }),
  adminUpdateProfile: (id, patch) => request(`/api/admin/profile/${id}`,      { method: 'PATCH', body: patch }),
  revenue:            ()       => request('/api/stripe/revenue'),
  runWeekly:          ()       => request('/api/analyses/run-weekly',           { method: 'POST', body: {} }),
  stravaConnect:      (userId) => `${API_URL}/auth/strava?userId=${userId}`,
  stravaImport:       (body)   => request('/api/strava/import',               { method: 'POST', body }),
  stravaDisconnect:   (body)   => request('/api/strava/disconnect',           { method: 'POST', body }),
  suuntoConnect:        (userId) => `${API_URL}/auth/suunto?userId=${userId}`,
  suuntoDisconnect:     (body)   => request('/api/suunto/disconnect',           { method: 'POST', body }),
  suuntoSendWorkout:    (body)   => request('/api/suunto/send-workout',         { method: 'POST', body }),
  garminConnect:        (userId) => `${API_URL}/auth/garmin?userId=${userId}`,
  garminDisconnect:     (body)   => request('/api/garmin/disconnect',           { method: 'POST', body }),
  garminSendWorkout:    (body)   => request('/api/garmin/send-workout',         { method: 'POST', body }),
  garminFetchActivity:  (body)   => request('/api/garmin/fetch-activity',       { method: 'POST', body }),
  getPreRaceAnalysis:      (userId) => request(`/api/analyses/pre-race/${userId}`),
  generatePreRaceAnalysis: (body)   => request('/api/analyses/pre-race/generate',  { method: 'POST', body }),
  submitRaceResult:        (body)   => request('/api/races/submit-result',          { method: 'POST', body }),
  generatePostRaceAnalysis:(body)   => request('/api/analyses/post-race/generate', { method: 'POST', body }),
  getPostRaceAnalysis:     (userId) => request(`/api/analyses/post-race/${userId}`),
  recalculateVma:          (body)   => request('/api/plans/recalculate-vma',          { method: 'POST', body }),
  adjustHeat:              (body)   => request('/api/plans/adjust-heat',               { method: 'POST', body }),
  adaptInjury:             (body)   => request('/api/plans/adapt-injury',              { method: 'POST', body }),
  restoreWeek:             (body)   => request('/api/plans/restore-week',              { method: 'POST', body }),
  rescheduleSession:       (body)   => request('/api/plans/reschedule-session',        { method: 'POST', body }),
  scheduleRegen:           (body)   => request('/api/plans/schedule-regen',            { method: 'POST', body }),
  getProfile:              (userId) => request(`/api/profile/${userId}`),
  updateProfile:           (body)   => request('/api/profile/update',                  { method: 'POST', body }),
}
