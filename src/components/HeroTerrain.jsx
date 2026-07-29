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

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    const scene  = new THREE.Scene()
    scene.fog    = new THREE.FogExp2(0x000000, 0.010)

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 800)
    camera.position.set(0, 42, 110)
    camera.lookAt(0, 0, 0)

    // ── Terrain avec vertex colors dégradé violet → rose ─────────────────
    const SEG  = 110
    const SIZE = 180
    const geo  = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG)
    geo.rotateX(-Math.PI / 2)

    const pos     = geo.attributes.position
    const colArr  = []
    const heights = []

    const colorLow  = new THREE.Color(0x1a0030)   // fond sombre violet profond
    const colorMid  = new THREE.Color(0x8B2FC9)   // violet vif
    const colorHigh = new THREE.Color(0xFF2D78)   // rose vif

    const col = new THREE.Color()

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) / SIZE
      const z = pos.getZ(i) / SIZE
      const h = fbm(x * 3.2 + 1.1, z * 3.2 + 0.9, 6) * 34
             + fbm(x * 7.5 + 2.3, z * 7.5 + 1.8, 3) * 8
      pos.setY(i, h)
      heights.push(h)

      // Dégradé en 2 étapes : bas→violet, violet→rose
      const tNorm = THREE.MathUtils.clamp((h + 2) / 36, 0, 1)
      if (tNorm < 0.45) {
        col.lerpColors(colorLow, colorMid, tNorm / 0.45)
      } else {
        col.lerpColors(colorMid, colorHigh, (tNorm - 0.45) / 0.55)
      }
      colArr.push(col.r, col.g, col.b)
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colArr, 3))
    geo.computeVertexNormals()

    // Surface pleine avec vertex colors
    const terrainMat = new THREE.MeshPhongMaterial({
      vertexColors: true,
      shininess: 35,
      specular: new THREE.Color(0xffffff),
    })
    const terrain = new THREE.Mesh(geo, terrainMat)
    scene.add(terrain)

    // Wireframe par-dessus — blanc très léger pour accentuer les arêtes
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.04,
    })
    const wire = new THREE.Mesh(geo, wireMat)
    wire.position.y = 0.08
    scene.add(wire)

    // ── Lumières ──────────────────────────────────────────────────────────
    // Lumière principale depuis le haut
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4)
    keyLight.position.set(20, 90, 40)
    scene.add(keyLight)

    // Lumière rose latérale pour accentuer les reliefs
    const pinkLight = new THREE.PointLight(0xFF2D78, 2.5, 280)
    pinkLight.position.set(-60, 30, -40)
    scene.add(pinkLight)

    // Lumière violette de remplissage
    const purpleLight = new THREE.PointLight(0x8B2FC9, 2.0, 260)
    purpleLight.position.set(60, 40, 20)
    scene.add(purpleLight)

    // Lumière froide légère par dessous pour les vallées
    const bottomLight = new THREE.PointLight(0x220044, 1.0, 200)
    bottomLight.position.set(0, -20, 0)
    scene.add(bottomLight)

    scene.add(new THREE.AmbientLight(0x110022, 1.5))

    // ── Particules légères ────────────────────────────────────────────────
    const STARS = 140
    const stGeo = new THREE.BufferGeometry()
    const stPos = new Float32Array(STARS * 3)
    for (let i = 0; i < STARS; i++) {
      stPos[i*3]   = (Math.random() - 0.5) * SIZE * 1.5
      stPos[i*3+1] = 12 + Math.random() * 70
      stPos[i*3+2] = (Math.random() - 0.5) * SIZE * 1.5
    }
    stGeo.setAttribute('position', new THREE.BufferAttribute(stPos, 3))
    scene.add(new THREE.Points(stGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.55, transparent: true, opacity: 0.22, sizeAttenuation: true })
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
      t += 0.004

      // Rotation lente
      terrain.rotation.y += 0.0004
      wire.rotation.y     = terrain.rotation.y

      // Caméra suit souris
      camX += (mx * 10 - camX) * 0.028
      camY += (-my * 6  - camY) * 0.028
      camera.position.x = camX
      camera.position.y = 42 + camY
      camera.position.z = 110 - scrollY * 0.012
      camera.lookAt(camX * 0.05, camY * 0.05, 0)

      // Lumières tournent lentement autour du terrain
      pinkLight.position.x   = Math.cos(t * 0.35) * 70
      pinkLight.position.z   = Math.sin(t * 0.35) * 60
      purpleLight.position.x = Math.cos(t * 0.35 + Math.PI) * 70
      purpleLight.position.z = Math.sin(t * 0.35 + Math.PI) * 60

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
