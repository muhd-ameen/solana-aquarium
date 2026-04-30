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
  growth: number
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
const DEATH_THRESHOLD = 172_800

function ellipsify(str: string, len = 4) {
  return str.length > len * 2 + 2 ? str.slice(0, len) + '..' + str.slice(-len) : str
}

function drawFishBody(g: Graphics, species: number, s: number, color: number, alpha: number) {
  g.setFillStyle({ color, alpha })

  switch (species % 8) {
    case 0:
      g.ellipse(0, 0, 20 * s, 11 * s); g.fill()
      g.setFillStyle({ color: 0xffffff, alpha: alpha * 0.6 })
      g.rect(-3 * s, -11 * s, 3 * s, 22 * s); g.fill()
      g.rect(8 * s, -9 * s, 3 * s, 18 * s); g.fill()
      g.setFillStyle({ color, alpha })
      g.moveTo(17 * s, 0); g.lineTo(26 * s, -9 * s); g.lineTo(26 * s, 9 * s); g.closePath(); g.fill()
      break
    case 1:
      g.circle(0, 0, 14 * s); g.fill()
      g.setStrokeStyle({ width: 1, color, alpha: alpha * 0.5 })
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
        g.moveTo(Math.cos(a) * 13 * s, Math.sin(a) * 13 * s)
        g.lineTo(Math.cos(a) * 18 * s, Math.sin(a) * 18 * s)
        g.stroke()
      }
      break
    case 2:
      g.moveTo(-14 * s, 0); g.lineTo(0, -18 * s); g.lineTo(14 * s, 0); g.lineTo(0, 18 * s); g.closePath(); g.fill()
      g.setFillStyle({ color, alpha: alpha * 0.7 })
      g.moveTo(0, -18 * s); g.lineTo(-6 * s, -26 * s); g.lineTo(6 * s, -18 * s); g.closePath(); g.fill()
      g.moveTo(0, 18 * s); g.lineTo(-6 * s, 26 * s); g.lineTo(6 * s, 18 * s); g.closePath(); g.fill()
      break
    case 3:
      g.ellipse(0, 0, 22 * s, 8 * s); g.fill()
      g.moveTo(20 * s, 0); g.lineTo(34 * s, -2 * s); g.lineTo(34 * s, 7 * s); g.lineTo(22 * s, 3 * s); g.closePath(); g.fill()
      break
    case 4:
      g.ellipse(0, 0, 13 * s, 7 * s); g.fill()
      g.setFillStyle({ color, alpha: alpha * 0.8 })
      g.moveTo(11 * s, 0); g.lineTo(18 * s, -6 * s); g.lineTo(18 * s, 6 * s); g.closePath(); g.fill()
      g.moveTo(-2 * s, -7 * s); g.lineTo(4 * s, -13 * s); g.lineTo(8 * s, -7 * s); g.closePath(); g.fill()
      break
    case 5:
      g.ellipse(0, 0, 10 * s, 6 * s); g.fill()
      g.setFillStyle({ color, alpha: alpha * 0.9 })
      g.moveTo(8 * s, 0); g.lineTo(22 * s, -10 * s); g.lineTo(20 * s, 0); g.lineTo(22 * s, 10 * s); g.closePath(); g.fill()
      break
    case 6:
      g.ellipse(0, 0, 13 * s, 8 * s); g.fill()
      g.setFillStyle({ color, alpha: alpha * 0.6 })
      g.moveTo(8 * s, 0); g.lineTo(26 * s, -14 * s); g.lineTo(22 * s, 0); g.lineTo(26 * s, 14 * s); g.closePath(); g.fill()
      g.moveTo(0, -8 * s); g.lineTo(-8 * s, -18 * s); g.lineTo(8 * s, -8 * s); g.closePath(); g.fill()
      g.moveTo(0, 8 * s); g.lineTo(-8 * s, 18 * s); g.lineTo(8 * s, 8 * s); g.closePath(); g.fill()
      break
    case 7:
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
  glow: Graphics
  data: FishData
  isDead: boolean
  baseAlpha: number
}

export function AquariumCanvas({
  fishList,
  spotlightKey,
}: {
  fishList: FishData[]
  spotlightKey?: string | null
}) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const animFrameRef = useRef<number>(0)
  const spotlightRef = useRef<string | null>(null)

  useEffect(() => {
    spotlightRef.current = spotlightKey ?? null
  }, [spotlightKey])

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

    // Light rays
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

    // Seabed
    const seabed = new Graphics()
    seabed.setFillStyle({ color: 0xd4a574, alpha: 0.35 })
    seabed.moveTo(0, height)
    for (let x = 0; x <= width; x += 20) {
      seabed.lineTo(x, height - 18 - Math.sin(x * 0.05) * 8 - Math.random() * 4)
    }
    seabed.lineTo(width, height)
    seabed.closePath()
    seabed.fill()

    seabed.setFillStyle({ color: 0xb8956a, alpha: 0.4 })
    for (let i = 0; i < 15; i++) {
      const px = Math.random() * width
      const py = height - 6 - Math.random() * 10
      seabed.ellipse(px, py, 3 + Math.random() * 5, 2 + Math.random() * 3)
      seabed.fill()
    }

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

    // Bubbles
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

    // Fish
    const fishSprites: FishSprite[] = []

    for (const fish of fishList) {
      const now = Date.now() / 1000
      const elapsed = now - fish.lastFed
      const isStarving = elapsed > STARVATION_THRESHOLD
      const isFullyGrown = fish.growth >= 255
      const isDead = isFullyGrown && elapsed > DEATH_THRESHOLD

      const baseAlpha = isDead ? 0.2 : isStarving ? 0.35 : 1.0
      const baseScale = 0.6 + (fish.size / 255) * 0.8
      const growthBonus = (fish.growth / 255) * 0.4
      const scale = baseScale + growthBonus
      const fishColor = isDead ? 0x666666 : COLOR_PALETTE[fish.color % COLOR_PALETTE.length]

      const container = new Container()

      // Glow ring (for spotlight — hidden by default)
      const glow = new Graphics()
      glow.circle(0, 0, 28 * scale)
      glow.fill({ color: 0x4a9eff, alpha: 0.25 })
      glow.alpha = 0
      container.addChild(glow)

      // Body
      const body = new Graphics()
      drawFishBody(body, fish.species, scale, fishColor, baseAlpha)
      container.addChild(body)

      // Eye
      const eye = new Graphics()
      eye.circle(-6 * scale, -3 * scale, 2.8 * scale)
      eye.fill({ color: 0xffffff, alpha: isDead ? 0.3 : 0.95 })
      eye.circle(-5.2 * scale, -3 * scale, 1.4 * scale)
      eye.fill({ color: isDead ? 0x666666 : 0x111111 })
      if (!isDead) {
        eye.circle(-4.8 * scale, -3.5 * scale, 0.5 * scale)
        eye.fill({ color: 0xffffff, alpha: 0.8 })
      }
      container.addChild(eye)

      // Tooltip
      const tooltip = new Container()
      tooltip.alpha = 0

      const tooltipBg = new Graphics()
      tooltipBg.roundRect(-70, -32, 140, 38, 6)
      tooltipBg.fill({ color: 0x000000, alpha: 0.75 })
      tooltip.addChild(tooltipBg)

      const speciesName = SPECIES_NAMES[fish.species % SPECIES_NAMES.length]
      const statusText = isDead ? ' [DEAD]' : isFullyGrown ? ' [MAX]' : ''
      const tooltipText = new Text({
        text: `${speciesName} #${fish.nonce}${statusText}\n${ellipsify(fish.owner)}`,
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

      // Position
      if (isDead) {
        container.x = 60 + Math.random() * (width - 120)
        container.y = 20 + Math.random() * 40
        container.rotation = Math.PI
      } else {
        container.x = Math.random() * (width - 80) + 40
        container.y = 40 + Math.random() * (height - 120)
      }

      const speedFactor = 0.3 + (fish.speed / 255) * 1.2
      const angle = Math.random() * Math.PI * 2
      const vx = isDead ? 0 : Math.cos(angle) * speedFactor * (isStarving ? 0.3 : 1)
      const vy = isDead ? 0 : Math.sin(angle) * speedFactor * 0.35 * (isStarving ? 0.3 : 1)

      if (vx > 0 && !isDead) container.scale.x = -1

      container.eventMode = 'static'
      container.cursor = 'pointer'
      container.hitArea = {
        contains: (x: number, y: number) =>
          x * x / (25 * scale) ** 2 + y * y / (15 * scale) ** 2 <= 1,
      }
      container.on('pointerenter', () => { tooltip.alpha = 1 })
      container.on('pointerleave', () => { tooltip.alpha = 0 })

      app.stage.addChild(container)
      fishSprites.push({
        container,
        vx,
        vy,
        wobblePhase: Math.random() * Math.PI * 2,
        tooltip,
        glow,
        data: fish,
        isDead,
        baseAlpha,
      })
    }

    // Animation loop
    let t = 0
    const tick = () => {
      t += 0.016

      for (const b of bubbles) {
        b.gfx.y -= b.speed
        b.gfx.x = b.baseX + Math.sin(t * 1.5 + b.phase) * b.wobble * 15
        if (b.gfx.y < -10) {
          b.gfx.y = height + 10
          b.baseX = Math.random() * width
          b.gfx.x = b.baseX
        }
      }

      const currentSpotlight = spotlightRef.current
      const hasSpotlight = currentSpotlight !== null

      for (const sp of fishSprites) {
        const isSpotlit = currentSpotlight === sp.data.key

        // Spotlight glow
        if (isSpotlit) {
          sp.glow.alpha = 0.4 + Math.sin(t * 3) * 0.2
          sp.container.alpha = 1
        } else if (hasSpotlight) {
          sp.glow.alpha = 0
          sp.container.alpha = sp.isDead ? 0.1 : 0.2
        } else {
          sp.glow.alpha = 0
          sp.container.alpha = sp.baseAlpha
        }

        if (sp.isDead) {
          sp.container.y += Math.sin(t * 0.5 + sp.wobblePhase) * 0.05
          continue
        }

        sp.container.x += sp.vx
        sp.container.y += sp.vy + Math.sin(t * 2 + sp.wobblePhase) * 0.25

        if (sp.container.x < 30 || sp.container.x > width - 30) {
          sp.vx *= -1
          sp.container.scale.x *= -1
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
      className="w-full bg-gradient-to-b from-[#0c1929] via-[#0f2744] to-[#0a1628]"
      style={{ minHeight: 400 }}
    />
  )
}
