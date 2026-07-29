import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Bruit de Perlin simplifié (2D)
function noise(x, y) {
  const X = Math.floor(x) & 255
  const Y = Math.floor(y) & 255
  x -= Math.floor(x)
  y -= Math.floor(y)
  const u = fade(x), v = fade(y)
  const a = p[X] + Y, b = p[X + 1] + Y
  return lerp(v,
    lerp(u, grad(p[a], x, y), grad(p[b], x - 1, y)),
    lerp(u, grad(p[a + 1], x, y - 1), grad(p[b + 1], x - 1, y - 1))
  )
}
function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10) }
function lerp(t, a, b) { return a + t * (b - a) }
function grad(hash, x, y) {
  const h = hash & 3
  const u = h < 2 ? x : y
  const v = h < 2 ? y : x
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v)
}
const p = (() => {
  const perm = []
  for (let i = 0; i < 256; i++) perm[i] = i
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]]
  }
  const arr = new Array(512)
  for (let i = 0; i < 512; i++) arr[i] = perm[i & 255]
  return arr
})()

function fbm(x, y, octaves = 5) {
  let val = 0, amp = 0.5, freq = 1, max = 0
  for (let i = 0; i < octaves; i++) {
    val += noise(x * freq, y * freq) * amp
    max += amp
    amp *= 0.5
    freq *= 2.1
  }
  return val / max
}

export default function HeroTerrain() {
  const mountRef = useRef(null)

  useEffect(() => {
    if (window.innerWidth < 768) return // pas de Three.js sur mobile

    const W = mountRef.current.clientWidth
    const H = mountRef.current.clientHeight

    // ── Scène ──────────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.fog   = new THREE.FogExp2(0x000000, 0.018)
    // Pas de scene.background → le dégradé CSS du hero est visible

    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000)
    camera.position.set(0, 30, 60)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mountRef.current.appendChild(renderer.domElement)

    // ── Terrain ────────────────────────────────────────────────────────────
    const SEG    = 120
    const SIZE   = 140
    const geo    = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG)
    geo.rotateX(-Math.PI / 2)

    const pos    = geo.attributes.position
    const colors = []
    const colorLow  = new THREE.Color(0x8B2FC9)
    const colorHigh = new THREE.Color(0xE8237A)
    const col       = new THREE.Color()

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) / SIZE
      const z = pos.getZ(i) / SIZE
      // relief principal + détails
      const h = fbm(x * 3.5 + 1.2, z * 3.5 + 0.8, 6) * 28
             + fbm(x * 7 + 2.1, z * 7 + 1.7, 3) * 6
      pos.setY(i, h)
      const t = THREE.MathUtils.clamp((h + 5) / 30, 0, 1)
      col.lerpColors(colorLow, colorHigh, t)
      colors.push(col.r, col.g, col.b)
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.computeVertexNormals()

    const mat = new THREE.MeshPhongMaterial({
      vertexColors: true,
      shininess: 18,
      wireframe: false,
    })
    const terrain = new THREE.Mesh(geo, mat)
    scene.add(terrain)

    // ── Lumières ───────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.35))
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.1)
    dirLight.position.set(40, 80, 40)
    scene.add(dirLight)
    const fillLight = new THREE.PointLight(0xE8237A, 0.6, 200)
    fillLight.position.set(-30, 20, -20)
    scene.add(fillLight)
    const topLight = new THREE.PointLight(0x8B2FC9, 0.5, 180)
    topLight.position.set(20, 50, 10)
    scene.add(topLight)

    // ── Particules ─────────────────────────────────────────────────────────
    const PART_COUNT = 200
    const partGeo    = new THREE.BufferGeometry()
    const partPos    = new Float32Array(PART_COUNT * 3)
    const partSpeeds = new Float32Array(PART_COUNT)
    for (let i = 0; i < PART_COUNT; i++) {
      partPos[i * 3]     = (Math.random() - 0.5) * SIZE
      partPos[i * 3 + 1] = Math.random() * 40
      partPos[i * 3 + 2] = (Math.random() - 0.5) * SIZE
      partSpeeds[i]      = 0.04 + Math.random() * 0.08
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3))
    const partMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.55 })
    const particles = new THREE.Points(partGeo, partMat)
    scene.add(particles)

    // ── Chemin lumineux ────────────────────────────────────────────────────
    const pathPoints = []
    const steps      = 60
    for (let i = 0; i < steps; i++) {
      const t  = i / (steps - 1)
      const px = Math.sin(t * Math.PI * 1.5) * 18
      const pz = (t - 0.5) * SIZE * 0.7
      // hauteur du terrain au point le plus proche
      const gridX = Math.round((px / SIZE + 0.5) * SEG)
      const gridZ = Math.round((pz / SIZE + 0.5) * SEG)
      const idx   = THREE.MathUtils.clamp(gridZ * (SEG + 1) + gridX, 0, pos.count - 1)
      const py    = pos.getY(idx) + 1.2
      pathPoints.push(new THREE.Vector3(px, py, pz))
    }
    const pathGeo  = new THREE.BufferGeometry().setFromPoints(pathPoints)
    const pathMat  = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })
    const pathLine = new THREE.Line(pathGeo, pathMat)
    scene.add(pathLine)

    // ── État souris / cible caméra ─────────────────────────────────────────
    let mouseX = 0, mouseY = 0
    let targetRotX = 0, targetRotY = 0

    const onMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth  - 0.5)
      mouseY = (e.clientY / window.innerHeight - 0.5)
    }
    window.addEventListener('mousemove', onMouseMove)

    // ── Scroll : effet 3D sur le texte hero ───────────────────────────────
    const heroContent = document.querySelector('.hero-content-3d')
    const onScroll = () => {
      if (!heroContent) return
      const progress = Math.min(window.scrollY / window.innerHeight, 1)
      const scale    = 1 - progress * 0.3
      const tz       = progress * -200
      const opacity  = Math.max(0, 1 - progress * 1.5)
      heroContent.style.transform  = `perspective(1000px) scale(${scale}) translateZ(${tz}px)`
      heroContent.style.opacity    = opacity
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // ── Resize ─────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = mountRef.current?.clientWidth  || window.innerWidth
      const h = mountRef.current?.clientHeight || window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // ── Animation ──────────────────────────────────────────────────────────
    let frameId
    let t = 0
    const animate = () => {
      frameId = requestAnimationFrame(animate)
      t += 0.01

      // Rotation lente terrain
      terrain.rotation.y  += 0.0003
      particles.rotation.y += 0.0003
      pathLine.rotation.y  += 0.0003

      // Réaction souris (lerp)
      targetRotX += (mouseY * 0.15 - targetRotX) * 0.05
      targetRotY += (mouseX * 0.15 - targetRotY) * 0.05
      terrain.rotation.x   = -0.3 + targetRotX
      terrain.rotation.z   = targetRotY * 0.5
      particles.rotation.x = targetRotX * 0.3
      pathLine.rotation.x  = -0.3 + targetRotX
      pathLine.rotation.z  = targetRotY * 0.5

      // Particules qui montent
      const pp = partGeo.attributes.position.array
      for (let i = 0; i < PART_COUNT; i++) {
        pp[i * 3 + 1] += partSpeeds[i]
        if (pp[i * 3 + 1] > 50) {
          pp[i * 3 + 1] = -5
          pp[i * 3]     = (Math.random() - 0.5) * SIZE
          pp[i * 3 + 2] = (Math.random() - 0.5) * SIZE
        }
      }
      partGeo.attributes.position.needsUpdate = true

      // Pulse chemin
      const pulse = 0.8 + Math.sin(t * 1.5) * 0.2
      pathMat.opacity = pulse * 0.7

      renderer.render(scene, camera)
    }
    animate()

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      geo.dispose()
      mat.dispose()
      partGeo.dispose()
      partMat.dispose()
      pathGeo.dispose()
      pathMat.dispose()
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none',
      }}
    />
  )
}
