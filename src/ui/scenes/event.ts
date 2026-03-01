import type { EventDef } from '../../game/types'

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

  container.innerHTML = `
    <div class="scene-event">
      <div class="panel event-panel">
        <h2>❓ ${eventDef.title}</h2>
        <p class="event-desc">${eventDef.description}</p>
        <div class="event-options">${optionsHtml}</div>
      </div>
    </div>
  `

  container.querySelectorAll<HTMLElement>('.btn-event').forEach(el => {
    el.addEventListener('click', () => {
      const optionId = el.dataset.optionId as EventDef['options'][number]['id']
      onChoose(optionId)
    })
  })
}
