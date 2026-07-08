import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const BASE = 'https://theultimateacademy.fr'

export default function CanonicalTag() {
  const { pathname } = useLocation()

  useEffect(() => {
    let link = document.querySelector('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = BASE + pathname
  }, [pathname])

  return null
}
