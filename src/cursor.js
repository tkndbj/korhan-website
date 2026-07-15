/* =========================================================================
   Custom cursor: gold dot (snappy) + ring (lagging), with hover and
   label states. Magnetic pull on [data-magnetic] elements.
   Only activates on fine pointers.
   ========================================================================= */

import gsap from 'gsap'

export function initCursor() {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  if (!fine) return

  const root = document.getElementById('cursor')
  if (!root) return
  const dot = root.querySelector('.cursor__dot')
  const ring = root.querySelector('.cursor__ring')
  const label = root.querySelector('.cursor__label')

  document.body.classList.add('has-cursor')

  const pos = { x: innerWidth / 2, y: innerHeight / 2 }
  const ringPos = { x: pos.x, y: pos.y }

  const setDotX = gsap.quickSetter(dot, 'x', 'px')
  const setDotY = gsap.quickSetter(dot, 'y', 'px')
  const setRingX = gsap.quickSetter(ring, 'x', 'px')
  const setRingY = gsap.quickSetter(ring, 'y', 'px')

  window.addEventListener('pointermove', (e) => {
    pos.x = e.clientX
    pos.y = e.clientY
  })

  gsap.ticker.add(() => {
    ringPos.x += (pos.x - ringPos.x) * 0.16
    ringPos.y += (pos.y - ringPos.y) * 0.16
    setDotX(pos.x)
    setDotY(pos.y)
    setRingX(ringPos.x)
    setRingY(ringPos.y)
  })

  // Hover + label states (event delegation so dynamic nodes work too)
  const HOVER_SEL = 'a, button, [data-magnetic], .service'
  document.addEventListener('pointerover', (e) => {
    const hit = e.target.closest(HOVER_SEL)
    if (!hit) return
    const text = hit.dataset.cursor
    if (text) {
      label.textContent = text
      root.classList.add('is-label')
    } else {
      root.classList.add('is-hover')
    }
  })
  document.addEventListener('pointerout', (e) => {
    if (e.target.closest(HOVER_SEL)) {
      root.classList.remove('is-hover', 'is-label')
    }
  })

  // Magnetic elements
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const strength = el.classList.contains('mega-cta') ? 0.35 : 0.25
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      gsap.to(el, { x: dx * strength, y: dy * strength, duration: 0.4, ease: 'power3.out' })
    })
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
    })
  })
}
