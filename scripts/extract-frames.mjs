#!/usr/bin/env node
/* =========================================================================
   Frame extractor for Taner Yolcu Aluminium Works.

   - Finds the first video file in the project root (any common extension)
   - Probes real duration + fps with ffprobe (no hardcoded assumptions)
   - Chooses an fps that lands the frame count in the target window
   - Extracts a desktop (1920px) and mobile (1280px) WebP sequence
   - Prints the exact FRAME_CONFIG values to paste into src/config.js

   Usage:  npm run extract-frames
           npm run extract-frames -- "path/to/video.mp4"

   Requires ffmpeg + ffprobe on PATH.
   ========================================================================= */

import { execFileSync } from 'node:child_process'
import { readdirSync, rmSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve, extname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// --- Tunables --------------------------------------------------------------
const TARGET_MIN = 240
const TARGET_MAX = 300
const DESKTOP_WIDTH = 1920
const MOBILE_WIDTH = 1280
const VIDEO_EXTS = ['.mp4', '.mov', '.webm', '.mkv', '.avi', '.m4v', '.mpg', '.mpeg']

function sh(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8' }).trim()
}

function findVideo() {
  if (process.argv[2]) return resolve(process.argv[2])
  const match = readdirSync(ROOT).find((f) => VIDEO_EXTS.includes(extname(f).toLowerCase()))
  if (!match) {
    console.error('No video file found in project root. Pass a path: npm run extract-frames -- video.mp4')
    process.exit(1)
  }
  return join(ROOT, match)
}

function probe(video) {
  const out = sh('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=r_frame_rate,width,height',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=0',
    video,
  ])
  const get = (k) => (out.match(new RegExp(`${k}=([^\\n]+)`)) || [])[1]
  const [num, den] = (get('r_frame_rate') || '30/1').split('/').map(Number)
  return {
    fps: den ? num / den : 30,
    width: Number(get('width')),
    height: Number(get('height')),
    duration: Number(get('duration')),
  }
}

/** Pick an extraction fps that lands frame count within [MIN, MAX]. */
function chooseFps(duration) {
  const target = (TARGET_MIN + TARGET_MAX) / 2 // ~270
  let fps = target / duration
  // Clamp to sane bounds; short clips get higher fps, long clips sampled down.
  fps = Math.max(1, Math.min(60, fps))
  const frames = Math.round(duration * fps)
  return { fps: Math.round(fps * 1000) / 1000, frames }
}

function extract(video, outDir, width, fps) {
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })
  console.log(`  → ${outDir}  (max ${width}px @ ${fps}fps)`)
  execFileSync('ffmpeg', [
    '-y',
    '-i', video,
    // Cap the LONGEST side at `width` without ever upscaling a smaller source.
    // Works for both landscape and portrait footage; -2 keeps dimensions even.
    '-vf', `fps=${fps},scale='if(gte(iw,ih),min(${width},iw),-2)':'if(gte(iw,ih),-2,min(${width},ih))'`,
    '-c:v', 'libwebp',
    '-quality', '82',
    '-compression_level', '6',
    '-preset', 'picture',
    join(outDir, 'frame_%04d.webp'),
  ], { stdio: ['ignore', 'ignore', 'inherit'] })
}

// --- Run -------------------------------------------------------------------
const video = findVideo()
console.log(`Video:    ${video}`)
const info = probe(video)
console.log(`Probe:    ${info.width}x${info.height}, ${info.fps.toFixed(3)} fps, ${info.duration.toFixed(2)}s`)

const { fps, frames } = chooseFps(info.duration)
console.log(`Plan:     ${fps} fps -> ~${frames} frames (target ${TARGET_MIN}-${TARGET_MAX})`)

const desktopDir = join(ROOT, 'public', 'frames', 'desktop')
const mobileDir = join(ROOT, 'public', 'frames', 'mobile')

console.log('Extracting…')
extract(video, desktopDir, DESKTOP_WIDTH, fps)
extract(video, mobileDir, MOBILE_WIDTH, fps)

const actual = readdirSync(desktopDir).filter((f) => f.endsWith('.webp')).length
console.log(`\nDone. ${actual} frames per set.\n`)
console.log('Update src/config.js -> FRAME_CONFIG.frameCount:')
console.log(`    frameCount: ${actual},\n`)
