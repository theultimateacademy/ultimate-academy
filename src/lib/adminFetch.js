// Helper d'appel API authentifié coach
// Envoie le JWT Supabase de la session active — le backend vérifie que role = 'coach'
import { supabase } from './supabase'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function adminFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || ''
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// Pour les PDFs : fetch blob authentifié (window.open ne peut pas envoyer de headers)
export async function openAdminPdf(path) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || ''
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) { alert('PDF introuvable'); return }
  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
