'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Application, Graphics, Text, TextStyle, Container } from 'pixi.js'

export interface FishData {
  key: string
  owner: string
  species: number
  color: number
  speed: number
  size: number
  nonce: number
  lastFed: number
}

const SPECIES_NAMES = ['Clownfish', 'Pufferfish', 'Angelfish', 'Swordtail', 'Tetra', 'Guppy', 'Betta', 'Goldfish']

const COLOR_PALETTE = [
  0xff6b4a, // Coral
  0x4a9eff, // Ocean
  0xff9f43, // Sunset
  0x2ed573, // Emerald
  0xa55eea, // Violet
  0xffd700, // Gold
  0xc0c0c0, // Silver
  0xdc143c, // Crimson
]

const STARVATION_THRESHOLD = 24 * 60 * 60

function ellipsify(str: string, len = 4) {
  return str.length > len * 2 + 2 ? str.slice(0, len) + '..' + str.slice(-len) : str
}

function drawFishBody(g: Graphics, species: number, s: number, color: number, alpha: number) {
  g.setFillStyle({ color, alpha })

  switch (species % 8) {
    case 0: // Clownfish
      g.ellipse(0, 0, 20 * s, 11 * s); g.fill()
      g.setFillStyle({ color: 0xffffff, alpha: alpha * 0.6 })
      g.rect(-3 * s, -11 * s, 3 * s, 22 * s); g.fill()
      g.rect(8 * s, -9 * s, 3 * s, 18 * s); g.fill()
      g.setFillStyle({ color, alpha })
      g.moveTo(17 * s, 0); g.lineTo(26 * s, -9 * s); g.lineTo(26 * s, 9 * s); g.closePath(); g.fill()
      break
    case 1: // Pufferfish
      g.circle(0, 0, 14 * s); g.fill()
      // Spines
      g.setStrokeStyle({ width: 1, color, alpha: alpha * 0.5 })
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
        g.moveTo(Math.cos(a) * 13 * s, Math.sin(a) * 13 * s)
        g.lineTo(Math.cos(a) * 18 * s, Math.sin(a) * 18 * s)
        g.stroke()
      }
      break
    case 2: // Angelfish — tall with flowing fins
      g.moveTo(-14 * s, 0); g.lineTo(0, -18 * s); g.lineTo(14 * s, 0); g.lineTo(0, 18 * s); g.closePath(); g.fill()
      g.setFillStyle({ color, alpha: alpha * 0.7 })
      g.moveTo(0, -18 * s); g.lineTo(-6 * s, -26 * s); g.lineTo(6 * s, -18 * s); g.closePath(); g.fill()
      g.moveTo(0, 18 * s); g.lineTo(-6 * s, 26 * s); g.lineTo(6 * s, 18 * s); g.closePath(); g.fill()
      break
    case 3: // Swordtail
      g.ellipse(0, 0, 22 * s, 8 * s); g.fill()
      g.moveTo(20 * s, 0); g.lineTo(34 * s, -2 * s); g.lineTo(34 * s, 7 * s); g.lineTo(22 * s, 3 * s); g.closePath(); g.fill()
      break
    case 4: // Tetra
      g.ellipse(0, 0, 13 * s, 7 * s); g.fill()
      g.setFillStyle({ color, alpha: alpha * 0.8 })
      g.moveTo(11 * s, 0); g.lineTo(18 * s, -6 * s); g.lineTo(18 * s, 6 * s); g.closePath(); g.fill()
      // Dorsal fin
      g.moveTo(-2 * s, -7 * s); g.lineTo(4 * s, -13 * s); g.lineTo(8 * s, -7 * s); g.closePath(); g.fill()
      break
    case 5: // Guppy — big colorful tail
      g.ellipse(0, 0, 10 * s, 6 * s); g.fill()
      g.setFillStyle({ color, alpha: alpha * 0.9 })
      g.moveTo(8 * s, 0); g.lineTo(22 * s, -10 * s); g.lineTo(20 * s, 0); g.lineTo(22 * s, 10 * s); g.closePath(); g.fill()
      break
    case 6: // Betta — elaborate fins
      g.ellipse(0, 0, 13 * s, 8 * s); g.fill()
      g.setFillStyle({ color, alpha: alpha * 0.6 })
      g.moveTo(8 * s, 0); g.lineTo(26 * s, -14 * s); g.lineTo(22 * s, 0); g.lineTo(26 * s, 14 * s); g.closePath(); g.fill()
      g.moveTo(0, -8 * s); g.lineTo(-8 * s, -18 * s); g.lineTo(8 * s, -8 * s); g.closePath(); g.fill()
      g.moveTo(0, 8 * s); g.lineTo(-8 * s, 18 * s); g.lineTo(8 * s, 8 * s); g.closePath(); g.fill()
      break
    case 7: // Goldfish
      g.ellipse(0, 0, 16 * s, 11 * s); g.fill()
      g.setFillStyle({ color, alpha: alpha * 0.8 })
      g.moveTo(14 * s, 0); g.lineTo(24 * s, -9 * s); g.lineTo(22 * s, 0); g.lineTo(24 * s, 9 * s); g.closePath(); g.fill()
      break
  }
}

interface Bubble {
  gfx: Graphics
  speed: number
  wobble: number
  phase: number
  baseX: number
}

interface FishSprite {
  container: Container
  vx: number
  vy: number
  wobblePhase: number
  tooltip: Container
  data: FishData
}

export function AquariumCanvas({ fishList }: { fishList: FishData[] }) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const animFrameRef = useRef<number>(0)

  const buildScene = useCallback(async () => {
    if (!canvasRef.current) return

    cancelAnimationFrame(animFrameRef.current)
    if (appRef.current) {
      appRef.current.destroy(true, { children: true })
      appRef.current = null
    }

    const app = new Application()
    const width = canvasRef.current.clientWidth
    const height = Math.max(400, Math.min(600, window.innerHeight * 0.5))

    await app.init({
      width,
      height,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })

    canvasRef.current.innerHTML = ''
    canvasRef.current.appendChild(app.canvas as HTMLCanvasElement)
    appRef.current = app

    // --- Light rays ---
    const rays = new Graphics()
    rays.setFillStyle({ color: 0xffffff, alpha: 0.03 })
    for (let i = 0; i < 5; i++) {
      const x = width * 0.15 + i * width * 0.18
      rays.moveTo(x, 0)
      rays.lineTo(x - 40, height)
      rays.lineTo(x + 60, height)
      rays.closePath()
      rays.fill()
    }
    app.stage.addChild(rays)

    // --- Seabed ---
    const seabed = new Graphics()
    seabed.setFillStyle({ color: 0xd4a574, alpha: 0.35 })
    seabed.moveTo(0, height)
    for (let x = 0; x <= width; x += 20) {
      seabed.lineTo(x, height - 18 - Math.sin(x * 0.05) * 8 - Math.random() * 4)
    }
    seabed.lineTo(width, height)
    seabed.closePath()
    seabed.fill()

    // Pebbles
    seabed.setFillStyle({ color: 0xb8956a, alpha: 0.4 })
    for (let i = 0; i < 15; i++) {
      const px = Math.random() * width
      const py = height - 6 - Math.random() * 10
      seabed.ellipse(px, py, 3 + Math.random() * 5, 2 + Math.random() * 3)
      seabed.fill()
    }

    // Seaweed
    const seaweedColors = [0x2d8a4e, 0x3ca55c, 0x1e6b3a]
    for (let i = 0; i < 6; i++) {
      const sw = new Graphics()
      const sx = 40 + Math.random() * (width - 80)
      const sColor = seaweedColors[i % seaweedColors.length]
      sw.setFillStyle({ color: sColor, alpha: 0.5 })
      const swHeight = 40 + Math.random() * 60
      sw.ellipse(sx, height - 15 - swHeight / 2, 4 + Math.random() * 3, swHeight / 2)
      sw.fill()
      app.stage.addChild(sw)
    }

    app.stage.addChild(seabed)

    // --- Animated bubbles ---
    const bubbles: Bubble[] = []
    for (let i = 0; i < 20; i++) {
      const bub = new Graphics()
      const r = 1.5 + Math.random() * 4
      bub.circle(0, 0, r)
      bub.fill({ color: 0xffffff, alpha: 0.08 + Math.random() * 0.12 })
      bub.circle(0, 0, r * 0.85)
      bub.stroke({ width: 0.5, color: 0xffffff, alpha: 0.15 })
      const baseX = Math.random() * width
      bub.x = baseX
      bub.y = height + Math.random() * height
      app.stage.addChild(bub)
      bubbles.push({
        gfx: bub,
        speed: 0.2 + Math.random() * 0.6,
        wobble: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        baseX,
      })
    }

    // --- Fish ---
    const fishSprites: FishSprite[] = []

    for (const fish of fishList) {
      const now = Date.now() / 1000
      const elapsed = now - fish.lastFed
      const isStarving = elapsed > STARVATION_THRESHOLD
      const alpha = isStarving ? 0.35 : 1.0
      const scale = 0.6 + (fish.size / 255) * 0.8
      const baseColor = COLOR_PALETTE[fish.color % COLOR_PALETTE.length]

      const container = new Container()

      // Body
      const body = new Graphics()
      drawFishBody(body, fish.species, scale, baseColor, alpha)
      container.addChild(body)

      // Eye
      const eye = new Graphics()
      eye.circle(-6 * scale, -3 * scale, 2.8 * scale)
      eye.fill({ color: 0xffffff, alpha: 0.95 })
      eye.circle(-5.2 * scale, -3 * scale, 1.4 * scale)
      eye.fill({ color: 0x111111 })
      eye.circle(-4.8 * scale, -3.5 * scale, 0.5 * scale)
      eye.fill({ color: 0xffffff, alpha: 0.8 })
      container.addChild(eye)

      // Tooltip (hidden by default)
      const tooltip = new Container()
      tooltip.alpha = 0

      const tooltipBg = new Graphics()
      tooltipBg.roundRect(-70, -32, 140, 38, 6)
      tooltipBg.fill({ color: 0x000000, alpha: 0.75 })
      tooltip.addChild(tooltipBg)

      const speciesName = SPECIES_NAMES[fish.species % SPECIES_NAMES.length]
      const tooltipText = new Text({
        text: `${speciesName} #${fish.nonce}\n${ellipsify(fish.owner)}`,
        style: new TextStyle({
          fontSize: 10,
          fill: 0xffffff,
          fontFamily: 'monospace',
          align: 'center',
          lineHeight: 14,
        }),
      })
      tooltipText.anchor.set(0.5)
      tooltipText.y = -13
      tooltip.addChild(tooltipText)
      tooltip.y = -22 * scale
      container.addChild(tooltip)

      container.x = Math.random() * (width - 80) + 40
      container.y = 40 + Math.random() * (height - 120)

      const speedFactor = 0.3 + (fish.speed / 255) * 1.2
      const angle = Math.random() * Math.PI * 2
      const vx = Math.cos(angle) * speedFactor * (isStarving ? 0.3 : 1)
      const vy = Math.sin(angle) * speedFactor * 0.35 * (isStarving ? 0.3 : 1)

      if (vx > 0) container.scale.x = -1

      container.eventMode = 'static'
      container.cursor = 'pointer'
      container.hitArea = { contains: (x: number, y: number) => x * x / (25 * scale) ** 2 + y * y / (15 * scale) ** 2 <= 1 }
      container.on('pointerenter', () => { tooltip.alpha = 1 })
      container.on('pointerleave', () => { tooltip.alpha = 0 })

      app.stage.addChild(container)
      fishSprites.push({ container, vx, vy, wobblePhase: Math.random() * Math.PI * 2, tooltip, data: fish })
    }

    // --- Animation loop ---
    let t = 0
    const tick = () => {
      t += 0.016

      // Bubbles rise
      for (const b of bubbles) {
        b.gfx.y -= b.speed
        b.gfx.x = b.baseX + Math.sin(t * 1.5 + b.phase) * b.wobble * 15
        if (b.gfx.y < -10) {
          b.gfx.y = height + 10
          b.baseX = Math.random() * width
          b.gfx.x = b.baseX
        }
      }

      // Fish swim
      for (const sp of fishSprites) {
        sp.container.x += sp.vx
        sp.container.y += sp.vy + Math.sin(t * 2 + sp.wobblePhase) * 0.25

        if (sp.container.x < 30 || sp.container.x > width - 30) {
          sp.vx *= -1
          sp.container.scale.x *= -1
          // Keep tooltip readable when fish flips
          sp.tooltip.scale.x = sp.container.scale.x < 0 ? -1 : 1
        }
        if (sp.container.y < 30 || sp.container.y > height - 50) {
          sp.vy *= -1
        }

        sp.container.x = Math.max(30, Math.min(width - 30, sp.container.x))
        sp.container.y = Math.max(30, Math.min(height - 50, sp.container.y))
      }

      animFrameRef.current = requestAnimationFrame(tick)
    }
    animFrameRef.current = requestAnimationFrame(tick)
  }, [fishList])

  useEffect(() => {
    buildScene()
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      if (appRef.current) {
        appRef.current.destroy(true, { children: true })
        appRef.current = null
      }
    }
  }, [buildScene])

  return (
    <div
      ref={canvasRef}
      className="w-full rounded-xl overflow-hidden border-2 border-blue-300/30 dark:border-blue-700/30 bg-gradient-to-b from-sky-200 via-blue-300 to-blue-500 dark:from-sky-950 dark:via-blue-900 dark:to-blue-950 shadow-lg"
      style={{ minHeight: 400 }}
    />
  )
}
