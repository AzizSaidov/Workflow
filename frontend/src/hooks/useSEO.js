import { useEffect } from 'react'

function setMeta(name, content) {
  if (!content) return
  let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(name.startsWith('og:') ? 'property' : 'name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function useSEO({ title, description, image } = {}) {
  useEffect(() => {
    document.title = title ? `${title} | Workflow` : 'Workflow — Фриланс-платформа'
    setMeta('description', description || 'Найди лучших фрилансеров или интересные проекты на Workflow')
    setMeta('og:title', title || 'Workflow — Фриланс-платформа')
    setMeta('og:description', description || 'Найди лучших фрилансеров или интересные проекты на Workflow')
    if (image) setMeta('og:image', image)
  }, [title, description, image])
}
