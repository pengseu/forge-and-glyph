import type { EventDef } from '../../game/types'
import { toWebpAsset } from '../../assets'

export function buildEventNameHint(title: string): string {
  return `当前随机事件：${title}`
}

export type EventTextureKind = 'warm' | 'cool' | 'dark'

export function resolveEventTextureKind(eventId: string): EventTextureKind {
  const darkIds = new Set(['shadow_altar', 'cursed_chest', 'abyss_rift', 'ancient_guardian'])
  const coolIds = new Set(['forge_spirit', 'wandering_smith', 'ancient_library', 'trial_choice', 'sanctum_choice'])
  if (darkIds.has(eventId)) return 'dark'
  if (coolIds.has(eventId)) return 'cool'
  return 'warm'
}

function resolveEventArtPath(eventId: string): string {
  return toWebpAsset(`/assets/scenes/events/${eventId}.png`)
}

export function renderEvent(
  container: HTMLElement,
  eventDef: EventDef,
  onChoose: (optionId: EventDef['options'][number]['id']) => void,
): void {
  const optionsHtml = eventDef.options.map(opt => `
    <button class="btn btn-event" data-option-id="${opt.id}">
      <div class="event-option-title">${opt.label}</div>
      <div class="event-option-desc">${opt.description}</div>
    </button>
  `).join('')

  const textureKind = resolveEventTextureKind(eventDef.id)

  container.innerHTML = `
    <div class="scene-event scene-event-v3 scene-event--${textureKind}">
      <section class="panel event-panel-v3">
        <div class="event-art" data-event-title="${eventDef.title}">
          <img src="${resolveEventArtPath(eventDef.id)}" alt="${eventDef.title}" loading="lazy" />
        </div>
        <h2 class="event-title">${eventDef.title}</h2>
        <div class="event-divider"></div>
        <div class="event-name-hint">${buildEventNameHint(eventDef.title)}</div>
        <p class="event-desc">${eventDef.description}</p>
        <div class="event-options">${optionsHtml}</div>
      </section>
    </div>
  `

  container.querySelectorAll<HTMLElement>('.btn-event').forEach(el => {
    el.addEventListener('click', () => {
      container.querySelectorAll('.btn-event').forEach((btn) => btn.classList.remove('is-selected'))
      el.classList.add('is-selected')
      const optionId = el.dataset.optionId as EventDef['options'][number]['id']
      onChoose(optionId)
    })
  })

  container.querySelectorAll<HTMLImageElement>('.event-art img').forEach((imgEl) => {
    const wrapper = imgEl.closest<HTMLElement>('.event-art')
    if (!wrapper) return
    const eventTitle = wrapper.dataset.eventTitle ?? imgEl.alt ?? '事件插画'
    const renderFallback = () => {
      const fallback = document.createElement('div')
      fallback.className = 'event-art-fallback'
      fallback.textContent = eventTitle
      wrapper.replaceChildren(fallback)
    }
    imgEl.addEventListener('error', renderFallback, { once: true })
    if (imgEl.complete && imgEl.naturalWidth === 0) renderFallback()
  })
}
