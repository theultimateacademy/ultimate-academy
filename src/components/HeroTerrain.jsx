import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Bruit de Perlin 2D
function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10) }
function lerpN(t, a, b) { return a + t * (b - a) }
function grad(hash, x, y) {
  const h = hash & 3
  return ((h & 1) ? -x : x) + ((h & 2) ? -y : y)
}
const PERM = (() => {
  const p = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]]
  }
  return [...p, ...p]
})()
function noise(x, y) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255
  x -= Math.floor(x); y -= Math.floor(y)
  const u = fade(x), v = fade(y)
  const a = PERM[X] + Y, b = PERM[X + 1] + Y
  return lerpN(v,
    lerpN(u, grad(PERM[a], x, y), grad(PERM[b], x - 1, y)),
    lerpN(u, grad(PERM[a + 1], x, y - 1), grad(PERM[b + 1], x - 1, y - 1))
  )
}
function fbm(x, y, oct = 5) {
  let val = 0, amp = 0.5, freq = 1, max = 0
  for (let i = 0; i < oct; i++) {
    val += noise(x * freq, y * freq) * amp
    max += amp; amp *= 0.5; freq *= 2.1
  }
  return val / max
}

export default function HeroTerrain() {
  const mountRef = useRef(null)

  useEffect(() => {
    if (window.innerWidth < 768) return

    const el = mountRef.current
    let W = el.clientWidth, H = el.clientHeight

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    const scene  = new THREE.Scene()
    scene.fog    = new THREE.FogExp2(0x000000, 0.014)

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 800)
    camera.position.set(0, 38, 100)
    camera.lookAt(0, 0, 0)

    // ── Terrain fil-de-fer monochrome ─────────────────────────────────────
    const SEG  = 100
    const SIZE = 160
    const geo  = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG)
    geo.rotateX(-Math.PI / 2)

    const pos = geo.attributes.position
    const heights = []

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) / SIZE
      const z = pos.getZ(i) / SIZE
      const h = fbm(x * 3.2 + 1.1, z * 3.2 + 0.9, 6) * 32
             + fbm(x * 7.5 + 2.3, z * 7.5 + 1.8, 3) * 7
      pos.setY(i, h)
      heights.push(h)
    }
    geo.computeVertexNormals()

    // Matériau wireframe blanc très transparent
    const terrainMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.07,
    })
    const terrain = new THREE.Mesh(geo, terrainMat)
    scene.add(terrain)

    // ── Même terrain, surface pleine sombre pour effet de profondeur ───────
    const solidMat = new THREE.MeshPhongMaterial({
      color: 0x0a0a12,
      shininess: 0,
      side: THREE.FrontSide,
    })
    const solid = new THREE.Mesh(geo, solidMat)
    solid.position.y = -0.1
    scene.add(solid)

    // ── Lignes de niveau (isolignes) style topo ────────────────────────────
    // On trace des lignes horizontales pour chaque seuil d'altitude
    const LEVELS = [2, 6, 10, 14, 18, 22, 26]
    const isoGroup = new THREE.Group()

    LEVELS.forEach((level, li) => {
      const t     = li / (LEVELS.length - 1)
      const color = new THREE.Color().lerpColors(
        new THREE.Color(0x5522aa),
        new THREE.Color(0xdd2277),
        t
      )
      const verts = []
      // Parcourir chaque quad du terrain
      for (let row = 0; row < SEG; row++) {
        for (let col = 0; col < SEG; col++) {
          const idx = (v, r, c) => {
            const ii = (r * (SEG + 1) + c)
            return {
              x: pos.getX(ii), y: pos.getY(ii), z: pos.getZ(ii), h: heights[ii],
            }
          }
          const a = idx(0, row,   col),   b = idx(0, row,   col+1)
          const c2 = idx(0, row+1, col), d = idx(0, row+1, col+1)
          const edges = [
            [a, b], [b, d], [d, c2], [c2, a],
          ]
          edges.forEach(([p1, p2]) => {
            if ((p1.h - level) * (p2.h - level) < 0) {
              const frac = (level - p1.h) / (p2.h - p1.h)
              verts.push(
                p1.x + frac * (p2.x - p1.x),
                level + 0.15,
                p1.z + frac * (p2.z - p1.z)
              )
            }
          })
        }
      }
      if (verts.length === 0) return
      const isoGeo = new THREE.BufferGeometry()
      isoGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3))
      const isoMat = new THREE.LineBasicMaterial({
        color, transparent: true,
        opacity: 0.28 + t * 0.18,
      })
      isoGroup.add(new THREE.LineSegments(isoGeo, isoMat))
    })
    scene.add(isoGroup)

    // ── Lumières ──────────────────────────────────────────────────────────
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9)
    keyLight.position.set(30, 80, 40)
    scene.add(keyLight)
    scene.add(new THREE.PointLight(0x8B2FC9, 1.2, 250))
    const fillLight = new THREE.PointLight(0xE8237A, 0.5, 180)
    fillLight.position.set(-40, 20, -20)
    scene.add(fillLight)
    scene.add(new THREE.AmbientLight(0x0a0818, 1.2))

    // ── Particules très légères ────────────────────────────────────────────
    const STARS = 160
    const stGeo = new THREE.BufferGeometry()
    const stPos = new Float32Array(STARS * 3)
    for (let i = 0; i < STARS; i++) {
      stPos[i*3]   = (Math.random() - 0.5) * SIZE * 1.4
      stPos[i*3+1] = 10 + Math.random() * 60
      stPos[i*3+2] = (Math.random() - 0.5) * SIZE * 1.4
    }
    stGeo.setAttribute('position', new THREE.BufferAttribute(stPos, 3))
    scene.add(new THREE.Points(stGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true, opacity: 0.18, sizeAttenuation: true })
    ))

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
    window.addEventListener('scroll',    onScroll, { passive: true })
    window.addEventListener('mousemove', onMouse)
    window.addEventListener('resize',    onResize)

    // ── Animation ─────────────────────────────────────────────────────────
    let raf, t = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      t += 0.005

      // Rotation lente du terrain
      terrain.rotation.y += 0.0005
      solid.rotation.y    = terrain.rotation.y
      isoGroup.rotation.y = terrain.rotation.y

      // Caméra : réaction souris douce
      camX += (mx * 10 - camX) * 0.03
      camY += (-my * 6  - camY) * 0.03
      camera.position.x = camX
      camera.position.y = 38 + camY
      camera.position.z = 100 - scrollY * 0.012
      camera.lookAt(camX * 0.06, camY * 0.06, 0)

      // Lumière fill qui tourne
      fillLight.position.x = Math.cos(t * 0.4) * 50
      fillLight.position.z = Math.sin(t * 0.4) * 50

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll',    onScroll)
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
