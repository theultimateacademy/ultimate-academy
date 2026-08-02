import { useEffect } from 'react'

function upsertMeta(attr, key, content) {
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  const created = !el
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  const prev = el.content
  el.content = content
  return { el, prev, created }
}

// Sets title/description/keywords/canonical/OG tags for the current page, and injects a
// schema.org JSON-LD script. Restores everything on unmount — same pattern already used
// ad-hoc in the calculator pages (document.title + meta[name="description"]), generalized.
export function useSEO({ title, description, keywords, canonical, schema }) {
  useEffect(() => {
    const prevTitle = document.title
    if (title) document.title = title

    const restorers = []
    if (description) {
      const { el, prev, created } = upsertMeta('name', 'description', description)
      restorers.push(() => { created ? el.remove() : (el.content = prev) })
    }
    if (keywords) {
      const { el, prev, created } = upsertMeta('name', 'keywords', keywords)
      restorers.push(() => { created ? el.remove() : (el.content = prev) })
    }
    if (title) {
      const { el, prev, created } = upsertMeta('property', 'og:title', title)
      restorers.push(() => { created ? el.remove() : (el.content = prev) })
    }
    if (description) {
      const { el, prev, created } = upsertMeta('property', 'og:description', description)
      restorers.push(() => { created ? el.remove() : (el.content = prev) })
    }

    let canonicalEl, prevCanonicalHref, canonicalCreated
    if (canonical) {
      canonicalEl = document.querySelector('link[rel="canonical"]')
      canonicalCreated = !canonicalEl
      if (!canonicalEl) {
        canonicalEl = document.createElement('link')
        canonicalEl.setAttribute('rel', 'canonical')
        document.head.appendChild(canonicalEl)
      }
      prevCanonicalHref = canonicalEl.href
      canonicalEl.href = canonical
    }

    let schemaEl
    if (schema) {
      schemaEl = document.createElement('script')
      schemaEl.type = 'application/ld+json'
      schemaEl.textContent = JSON.stringify(schema)
      schemaEl.dataset.pageSchema = 'true'
      document.head.appendChild(schemaEl)
    }

    return () => {
      document.title = prevTitle
      restorers.forEach(fn => fn())
      if (canonicalEl) {
        if (canonicalCreated) canonicalEl.remove()
        else canonicalEl.href = prevCanonicalHref
      }
      if (schemaEl) schemaEl.remove()
    }
  }, [title, description, keywords, canonical, JSON.stringify(schema)])
}
