#!/usr/bin/env node
import { mkdirSync, copyFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

const src = resolve(root, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')
const dst = resolve(root, 'public/fonts/inter-variable-latin.woff2')

if (!existsSync(src)) {
  console.warn('[fonts] Inter Variable source not found, skipping:', src)
  process.exit(0)
}

mkdirSync(dirname(dst), { recursive: true })
copyFileSync(src, dst)
console.log('[fonts] copied', dst)
