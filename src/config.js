/* =========================================================================
   Frame-sequence configuration.
   Keep this in sync with the frames in /public/frames when you re-extract.
   The extractor script (scripts/extract-frames.mjs) prints the exact values
   to paste here after it runs.
   ========================================================================= */

export const FRAME_CONFIG = {
  // Total number of frames extracted per set (frame_0001 … frame_NNNN).
  frameCount: 269,

  // Zero-padding width used in the filenames (frame_0001 -> 4).
  pad: 4,

  // Filename pattern; {n} is replaced with the padded frame index.
  pattern: 'frame_{n}.webp',

  // Frame set directories (served from /public).
  desktopDir: '/frames/desktop',
  mobileDir: '/frames/mobile',

  // Viewport width at/below which the lighter mobile set is used.
  mobileBreakpoint: 760,
}

/** Build the ordered list of frame URLs for the active device. */
export function buildFrameUrls(isMobile) {
  const { frameCount, pad, pattern, desktopDir, mobileDir } = FRAME_CONFIG
  const dir = isMobile ? mobileDir : desktopDir
  const urls = []
  for (let i = 1; i <= frameCount; i++) {
    const n = String(i).padStart(pad, '0')
    urls.push(`${dir}/${pattern.replace('{n}', n)}`)
  }
  return urls
}
