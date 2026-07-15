/* =========================================================================
   Tiny text splitters (no SplitText license needed).
   splitChars: wraps each character in .char (keeps spaces as nbsp)
   splitWords: wraps each word in .word — leaves non-text nodes (imgs) alone
   ========================================================================= */

export function splitChars(el) {
  const text = el.textContent
  el.textContent = ''
  const frag = document.createDocumentFragment()
  for (const ch of text) {
    const span = document.createElement('span')
    span.className = 'char'
    span.textContent = ch === ' ' ? ' ' : ch
    frag.appendChild(span)
  }
  el.appendChild(frag)
  return el.querySelectorAll('.char')
}

export function splitWords(el) {
  const nodes = Array.from(el.childNodes)
  el.textContent = ''
  const frag = document.createDocumentFragment()

  nodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const words = node.textContent.split(/\s+/).filter(Boolean)
      words.forEach((w) => {
        const span = document.createElement('span')
        span.className = 'word'
        span.textContent = w
        frag.appendChild(span)
        frag.appendChild(document.createTextNode(' '))
      })
    } else {
      frag.appendChild(node)
      frag.appendChild(document.createTextNode(' '))
    }
  })

  el.appendChild(frag)
  return el.querySelectorAll('.word')
}
