import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function HeroTerrain() {
  const mountRef = useRef(null)

  useEffect(() => {
    if (window.innerWidth < 768) return

    const el = mountRef.current
    let W = el.clientWidth
    let H = el.clientHeight

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 600)
    camera.position.set(0, 28, 90)
    camera.lookAt(0, 0, 0)

    // ── Anneaux concentriques (vortex en perspective) ─────────────────────
    const RING_COUNT = 28
    const rings = []

    for (let i = 0; i < RING_COUNT; i++) {
      const t      = i / RING_COUNT
      const radius = 4 + i * 5.5
      const seg    = Math.max(48, Math.floor(radius * 3.5))
      const geo    = new THREE.RingGeometry(radius, radius + 0.55, seg)
      const col    = new THREE.Color().lerpColors(new THREE.Color(0x8B2FC9), new THREE.Color(0xE8237A), t)
      const opacity = 0.06 + (1 - t) * 0.22
      const mat = new THREE.MeshBasicMaterial({
        color: col, transparent: true, opacity, side: THREE.DoubleSide,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.rotation.x = -Math.PI / 2.1
      mesh.position.z = -i * 3.2
      mesh.position.y = -i * 0.8
      scene.add(mesh)
      rings.push({ mesh, mat, baseOpacity: opacity })
    }

    // ── Lignes radiales ────────────────────────────────────────────────────
    const SPOKE_COUNT = 12
    for (let s = 0; s < SPOKE_COUNT; s++) {
      const angle = (s / SPOKE_COUNT) * Math.PI * 2
      const maxR  = 4 + (RING_COUNT - 1) * 5.5 + 0.6
      const verts = new Float32Array([
        Math.cos(angle) * 4,   Math.sin(angle) * 4,   0,
        Math.cos(angle) * maxR, Math.sin(angle) * maxR, 0,
      ])
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
      const mat  = new THREE.LineBasicMaterial({ color: 0x9940E0, transparent: true, opacity: 0.09 })
      const line = new THREE.Line(geo, mat)
      line.rotation.x = -Math.PI / 2.1
      scene.add(line)
    }

    // ── Étoiles lointaines ─────────────────────────────────────────────────
    const STAR_COUNT = 200
    const starGeo = new THREE.BufferGeometry()
    const starPos = new Float32Array(STAR_COUNT * 3)
    for (let i = 0; i < STAR_COUNT; i++) {
      starPos[i*3]   = (Math.random() - 0.5) * 340
      starPos[i*3+1] = (Math.random() - 0.5) * 220
      starPos[i*3+2] = (Math.random() - 0.5) * 280 - 40
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.85, transparent: true, opacity: 0.16, sizeAttenuation: true })
    scene.add(new THREE.Points(starGeo, starMat))

    // ── Orbe central ──────────────────────────────────────────────────────
    const coreGeo = new THREE.SphereGeometry(1.4, 16, 16)
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xC060FF, transparent: true, opacity: 0.9 })
    const core    = new THREE.Mesh(coreGeo, coreMat)
    scene.add(core)

    const haloGeo = new THREE.SphereGeometry(6, 16, 16)
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x8B2FC9, transparent: true, opacity: 0.055, side: THREE.BackSide })
    scene.add(new THREE.Mesh(haloGeo, haloMat))

    scene.add(new THREE.PointLight(0x8B2FC9, 2.5, 200))
    scene.add(new THREE.AmbientLight(0x080818, 1))

    // ── Scroll / Souris ────────────────────────────────────────────────────
    let scrollY = 0, mx = 0, my = 0, camX = 0, camY = 0

    const heroContent = document.querySelector('.hero-content-3d')
    const onScroll = () => {
      scrollY = window.scrollY
      if (heroContent) {
        const p = Math.min(scrollY / window.innerHeight, 1)
        heroContent.style.transform = `perspective(1200px) scale(${1 - p * 0.28}) translateZ(${p * -180}px)`
        heroContent.style.opacity   = Math.max(0, 1 - p * 1.8)
      }
    }
    const onMouse = (e) => {
      mx = (e.clientX / window.innerWidth  - 0.5)
      my = (e.clientY / window.innerHeight - 0.5)
    }
    const onResize = () => {
      W = el.clientWidth; H = el.clientHeight
      camera.aspect = W / H
      camera.updateProjectionMatrix()
      renderer.setSize(W, H)
    }
    window.addEventListener('scroll',   onScroll, { passive: true })
    window.addEventListener('mousemove', onMouse)
    window.addEventListener('resize',    onResize)

    // ── Boucle ────────────────────────────────────────────────────────────
    let raf, t = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      t += 0.006

      scene.rotation.z = t * 0.04

      camX += (mx * 12 - camX) * 0.028
      camY += (-my * 7  - camY) * 0.028
      camera.position.x = camX
      camera.position.y = 28 + camY
      camera.position.z = 90 - scrollY * 0.01
      camera.lookAt(camX * 0.05, camY * 0.05, 0)

      // Vague d'opacité sur les anneaux
      rings.forEach(({ mat, baseOpacity }, i) => {
        const wave = Math.sin(t * 1.2 - i * 0.35) * 0.5 + 0.5
        mat.opacity = baseOpacity * (0.55 + wave * 0.65)
      })

      // Pulse orbe central
      coreMat.opacity = (0.75 + Math.sin(t * 2.2) * 0.25) * 0.92
      core.scale.setScalar(0.9 + Math.sin(t * 1.8) * 0.2)

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll',   onScroll)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize',    onResize)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div ref={mountRef} style={{
      position: 'absolute', inset: 0,
      width: '100%', height: '100%',
      zIndex: 0, pointerEvents: 'none',
    }} />
  )
}
