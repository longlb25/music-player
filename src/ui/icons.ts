import iconSpriteMarkup from '../assets/icons.svg?raw'

export { iconSpriteMarkup }

export type IconName =
  | 'close'
  | 'files'
  | 'folder'
  | 'next'
  | 'pause'
  | 'play'
  | 'previous'
  | 'repeat'
  | 'shuffle'
  | 'trash'
  | 'volume'
  | 'volume-off'

export function iconMarkup(name: IconName, className = 'button-icon'): string {
  return `<svg class="${className}" aria-hidden="true"><use href="#icon-${name}"></use></svg>`
}

export function createIcon(name: IconName, className = 'button-icon'): SVGSVGElement {
  const namespace = 'http://www.w3.org/2000/svg'
  const icon = document.createElementNS(namespace, 'svg')
  const use = document.createElementNS(namespace, 'use')

  icon.classList.add(className)
  icon.setAttribute('aria-hidden', 'true')
  use.setAttribute('href', `#icon-${name}`)
  icon.append(use)

  return icon
}
