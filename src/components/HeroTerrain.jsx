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

    // ── Scène / Caméra ────────────────────────────────────────────────────
    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 600)
    camera.position.set(0, 0, 100)

    // ── Grille de perspective (sol) ────────────────────────────────────────
    // Lignes horizontales + verticales qui convergent vers le bas
    const gridLines = []
    const GRID_COLS = 20
    const GRID_ROWS = 12
    const gW = 240, gD = 180
    const gridGroup = new THREE.Group()
    gridGroup.rotation.x = -Math.PI / 2.5
    gridGroup.position.y = -52

    // Verticales
    for (let c = 0; c <= GRID_COLS; c++) {
      const x = (c / GRID_COLS - 0.5) * gW
      const verts = new Float32Array([x, 0, 0, x, 0, -gD])
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
      const alpha = 1 - Math.abs(c / GRID_COLS - 0.5) * 2 + 0.15
      const mat = new THREE.LineBasicMaterial({ color: 0x8B2FC9, transparent: true, opacity: alpha * 0.18 })
      gridGroup.add(new THREE.Line(geo, mat))
      gridLines.push({ geo, mat })
    }

    // Horizontales
    for (let r = 0; r <= GRID_ROWS; r++) {
      const z = -(r / GRID_ROWS) * gD
      const verts = new Float32Array([-gW / 2, 0, z, gW / 2, 0, z])
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
      const alpha = (r / GRID_ROWS) * 0.22 + 0.04
      const mat = new THREE.LineBasicMaterial({ color: 0x8B2FC9, transparent: true, opacity: alpha })
      gridGroup.add(new THREE.Line(geo, mat))
      gridLines.push({ geo, mat })
    }
    scene.add(gridGroup)

    // ── Particules géométriques flottantes ────────────────────────────────
    const DOT_COUNT = 280
    const dotGeo    = new THREE.BufferGeometry()
    const dotPos    = new Float32Array(DOT_COUNT * 3)
    const dotBase   = new Float32Array(DOT_COUNT * 3) // positions repos
    const dotSpeed  = new Float32Array(DOT_COUNT)
    const dotPhase  = new Float32Array(DOT_COUNT)

    for (let i = 0; i < DOT_COUNT; i++) {
      const x = (Math.random() - 0.5) * 200
      const y = (Math.random() - 0.5) * 110
      const z = (Math.random() - 0.5) * 140 - 10
      dotBase[i*3]   = dotPos[i*3]   = x
      dotBase[i*3+1] = dotPos[i*3+1] = y
      dotBase[i*3+2] = dotPos[i*3+2] = z
      dotSpeed[i] = 0.2 + Math.random() * 0.5
      dotPhase[i] = Math.random() * Math.PI * 2
    }
    dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPos, 3))
    const dotMat = new THREE.PointsMaterial({
      color: 0xffffff, size: 1.4,
      transparent: true, opacity: 0.22,
      sizeAttenuation: true,
    })
    const dots = new THREE.Points(dotGeo, dotMat)
    scene.add(dots)

    // ── Quelques lignes entre particules proches ──────────────────────────
    const connVerts = []
    const CONN_THRESH = 32
    for (let i = 0; i < DOT_COUNT; i++) {
      for (let j = i + 1; j < DOT_COUNT; j++) {
        const dx = dotBase[i*3] - dotBase[j*3]
        const dy = dotBase[i*3+1] - dotBase[j*3+1]
        const dz = dotBase[i*3+2] - dotBase[j*3+2]
        if (Math.sqrt(dx*dx+dy*dy+dz*dz) < CONN_THRESH) {
          connVerts.push(
            dotBase[i*3], dotBase[i*3+1], dotBase[i*3+2],
            dotBase[j*3], dotBase[j*3+1], dotBase[j*3+2]
          )
        }
      }
    }
    const connGeo = new THREE.BufferGeometry()
    connGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(connVerts), 3))
    const connMat = new THREE.LineBasicMaterial({ color: 0xA040E0, transparent: true, opacity: 0.06 })
    const connLines = new THREE.LineSegments(connGeo, connMat)
    scene.add(connLines)

    // ── Orbes (glow lumineux) ─────────────────────────────────────────────
    const orbA = new THREE.PointLight(0x8B2FC9, 1.4, 200)
    orbA.position.set(-40, 20, -20)
    scene.add(orbA)
    const orbB = new THREE.PointLight(0xE8237A, 1.0, 160)
    orbB.position.set(40, -15, -30)
    scene.add(orbB)
    const orbC = new THREE.PointLight(0x4488ff, 0.5, 120)
    orbC.position.set(0, 30, 10)
    scene.add(orbC)
    scene.add(new THREE.AmbientLight(0x0a0a18, 1.2))

    // ── Glow central (sphère invisible juste pour la lumière) ─────────────
    // Deux sphères translucides pour simuler du glow ambiant
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x8B2FC9, transparent: true, opacity: 0.035 })
    const glowA = new THREE.Mesh(new THREE.SphereGeometry(28, 16, 16), glowMat)
    glowA.position.set(-30, 5, -30)
    scene.add(glowA)
    const glowMatB = new THREE.MeshBasicMaterial({ color: 0xE8237A, transparent: true, opacity: 0.025 })
    const glowB = new THREE.Mesh(new THREE.SphereGeometry(22, 16, 16), glowMatB)
    glowB.position.set(30, -5, -20)
    scene.add(glowB)

    // ── Souris ────────────────────────────────────────────────────────────
    let mx = 0, my = 0
    let camX = 0, camY = 0
    const onMouse = (e) => {
      mx = (e.clientX / window.innerWidth  - 0.5)
      my = (e.clientY / window.innerHeight - 0.5)
    }
    window.addEventListener('mousemove', onMouse)

    // ── Scroll ────────────────────────────────────────────────────────────
    let scrollY = 0
    const heroContent = document.querySelector('.hero-content-3d')
    const onScroll = () => {
      scrollY = window.scrollY
      // Texte hero s'enfonce avec scroll
      if (heroContent) {
        const p = Math.min(scrollY / window.innerHeight, 1)
        const scale   = 1 - p * 0.28
        const tz      = p * -180
        const opacity = Math.max(0, 1 - p * 1.8)
        heroContent.style.transform = `perspective(1200px) scale(${scale}) translateZ(${tz}px)`
        heroContent.style.opacity   = opacity
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // ── Resize ────────────────────────────────────────────────────────────
    const onResize = () => {
      W = el.clientWidth; H = el.clientHeight
      camera.aspect = W / H
      camera.updateProjectionMatrix()
      renderer.setSize(W, H)
    }
    window.addEventListener('resize', onResize)

    // ── Boucle animation ──────────────────────────────────────────────────
    let raf, t = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      t += 0.006

      // Caméra : réaction souris douce
      camX += (mx * 10 - camX) * 0.025
      camY += (-my * 6  - camY) * 0.025
      camera.position.x = camX
      camera.position.y = camY
      camera.position.z = 100 - scrollY * 0.012
      camera.lookAt(camX * 0.08, camY * 0.08, 0)

      // Particules : flottement organique
      const pp = dotGeo.attributes.position.array
      for (let i = 0; i < DOT_COUNT; i++) {
        pp[i*3]   = dotBase[i*3]   + Math.cos(t * dotSpeed[i]       + dotPhase[i]) * 2.2
        pp[i*3+1] = dotBase[i*3+1] + Math.sin(t * dotSpeed[i] * 0.8 + dotPhase[i]) * 1.8
        pp[i*3+2] = dotBase[i*3+2] + Math.sin(t * dotSpeed[i] * 0.5 + dotPhase[i] * 1.3) * 1.2
      }
      dotGeo.attributes.position.needsUpdate = true

      // Grille : légère rotation Y lente
      gridGroup.rotation.z = Math.sin(t * 0.12) * 0.012
      dots.rotation.y      = t * 0.006
      connLines.rotation.y = t * 0.006

      // Orbes pulsent
      orbA.intensity = 1.3 + Math.sin(t * 0.85) * 0.35
      orbB.intensity = 0.9 + Math.cos(t * 1.10) * 0.25
      orbC.intensity = 0.4 + Math.sin(t * 0.60) * 0.15

      // Glow pulse
      glowMat.opacity  = 0.03 + Math.sin(t * 0.7) * 0.012
      glowMatB.opacity = 0.022 + Math.cos(t * 0.9) * 0.01

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      dotGeo.dispose(); dotMat.dispose()
      connGeo.dispose(); connMat.dispose()
      glowMat.dispose(); glowMatB.dispose()
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
