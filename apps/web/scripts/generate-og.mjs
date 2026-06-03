#!/usr/bin/env node
// Generate 1200×630 OG images for static routes.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { unzipSync } from 'fflate'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const outDir = resolve(root, 'public/og')
const fontCache = resolve(root, 'node_modules/.cache/og-fonts')
const fontPath = resolve(fontCache, 'Inter-Bold.ttf')

mkdirSync(fontCache, { recursive: true })
mkdirSync(outDir, { recursive: true })

if (!existsSync(fontPath)) {
  console.log('[og] downloading Inter v4.0 release ...')
  const res = await fetch('https://github.com/rsms/inter/releases/download/v4.0/Inter-4.0.zip')
  if (!res.ok) throw new Error(`Failed to fetch font zip: ${res.status}`)
  const zip = unzipSync(new Uint8Array(await res.arrayBuffer()), {
    filter: (f) => f.name === 'extras/ttf/Inter-Bold.ttf',
  })
  const file = zip['extras/ttf/Inter-Bold.ttf']
  if (!file) throw new Error('Inter-Bold.ttf not found in archive')
  writeFileSync(fontPath, file)
}

const fontData = readFileSync(fontPath)

const pages = [
  { slug: 'home', title: 'Kostech', subtitle: 'Servicii IT și mentenanță PC în Chișinău' },
  { slug: 'servicii', title: 'Servicii IT', subtitle: 'Mentenanță, rețele, securitate, servere' },
  { slug: 'contact', title: 'Contact', subtitle: 'Hai să discutăm despre proiectul tău' },
  { slug: 'booking', title: 'Programare', subtitle: 'Rezervă o vizită — răspundem rapid' },
  { slug: 'mentenanta-pc', title: 'Mentenanță PC', subtitle: 'Diagnostic, curățare, optimizare' },
  { slug: 'administrare-servere', title: 'Administrare servere', subtitle: 'Linux & Windows, 24/7' },
  { slug: 'proiectare-retele', title: 'Proiectare rețele', subtitle: 'LAN, Wi-Fi, VPN' },
  { slug: 'securitate-it', title: 'Securitate IT', subtitle: 'Audit, firewall, backup' },
]

const tree = ({ title, subtitle }) => ({
  type: 'div',
  props: {
    style: {
      width: 1200, height: 630, display: 'flex', flexDirection: 'column',
      padding: 64, background: 'linear-gradient(135deg, #635BFF 0%, #4F46E5 100%)',
      color: '#fff', fontFamily: 'Inter',
    },
    children: [
      { type: 'div', props: { style: { fontSize: 32, fontWeight: 700, letterSpacing: 2, opacity: 0.9 }, children: 'KOSTECH' } },
      { type: 'div', props: {
        style: { marginTop: 'auto', display: 'flex', flexDirection: 'column' },
        children: [
          { type: 'div', props: { style: { fontSize: 88, fontWeight: 700, lineHeight: 1.05 }, children: title } },
          { type: 'div', props: { style: { fontSize: 36, opacity: 0.85, marginTop: 16 }, children: subtitle } },
        ],
      } },
      { type: 'div', props: { style: { marginTop: 32, fontSize: 24, opacity: 0.7 }, children: 'kostech.md' } },
    ],
  },
})

for (const page of pages) {
  const svg = await satori(tree(page), {
    width: 1200, height: 630,
    fonts: [{ name: 'Inter', data: fontData, weight: 700, style: 'normal' }],
  })
  const png = new Resvg(svg).render().asPng()
  const dst = resolve(outDir, `${page.slug}.png`)
  writeFileSync(dst, png)
  console.log('[og]', dst)
}
