const CARD_TYPE = 'ha-segmented-button-card';

class HASegmentedButtonCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement(`${CARD_TYPE}-editor`);
  }

  static getStubConfig() {
    return {
      entity: '',
      segments: [],
    };
  }

  constructor() {
    super();
    this._config = null;
    this._hass = null;
    this._lastRenderKey = '';
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config) {
      throw new Error('Invalid configuration');
    }

    if (config.entity && !config.entity.startsWith('input_select.')) {
      throw new Error('This card is intended for input_select helpers');
    }

    this._config = {
      entity: config.entity,
      segments: Array.isArray(config.segments) ? config.segments : [],
    };

    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._config && this._shouldRender()) {
      this._render();
    }
  }

  getCardSize() {
    return 1;
  }

  _getEntityState() {
    if (!this._hass || !this._config) {
      return null;
    }

    return this._hass.states[this._config.entity] || null;
  }

  _getSegments() {
    const entityState = this._getEntityState();
    const availableOptions = entityState?.attributes?.options || [];
    const configuredSegments = this._config?.segments || [];

    if (!configuredSegments.length) {
      return availableOptions.map((option) => ({
        value: option,
        text: option,
        icon: '',
      }));
    }

    return configuredSegments
      .map((segment) => {
        if (typeof segment === 'string') {
          return {
            value: segment,
            text: segment,
            icon: '',
          };
        }

        if (!segment || typeof segment !== 'object' || !segment.value) {
          return null;
        }

        return {
          value: segment.value,
          text: segment.text || segment.label || segment.value,
          icon: segment.icon || '',
        };
      })
      .filter(Boolean)
      .filter((segment) => availableOptions.length === 0 || availableOptions.includes(segment.value));
  }

  _getRenderKey() {
    const entityState = this._getEntityState();
    const options = entityState?.attributes?.options || [];
    return JSON.stringify([
      this._config?.entity || '',
      this._config?.segments || [],
      entityState?.state ?? '',
      options,
    ]);
  }

  _shouldRender() {
    const nextKey = this._getRenderKey();
    if (nextKey === this._lastRenderKey) {
      return false;
    }

    this._lastRenderKey = nextKey;
    return true;
  }

  _selectOption(value) {
    if (!this._hass || !this._config) {
      return;
    }

    const entityState = this._getEntityState();
    const availableOptions = entityState?.attributes?.options || [];

    if (availableOptions.length && !availableOptions.includes(value)) {
      return;
    }

    this._hass.callService('input_select', 'select_option', {
      entity_id: this._config.entity,
      option: value,
    });
  }

  _escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  _render() {
    if (!this.shadowRoot || !this._config) {
      return;
    }

    const entityState = this._getEntityState();
    const segments = this._getSegments();
    const hasEntity = Boolean(this._config.entity);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          --segment-bg: var(--card-background-color, var(--ha-card-background, var(--surface-color, #fff)));
          --segment-border: var(--divider-color, rgba(0, 0, 0, 0.12));
          --segment-surface: color-mix(in srgb, var(--primary-color) 12%, transparent);
          --segment-selected: var(--primary-color);
          --segment-selected-text: var(--text-primary-color, #fff);
          --segment-text: var(--primary-text-color);
          --segment-muted: var(--secondary-text-color);
        }

        ha-card {
          display: block;
          padding: 16px;
          border-radius: 16px;
          box-sizing: border-box;
        }

        .segments {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(0, 1fr);
          gap: 0;
          border: 1px solid var(--segment-border);
          border-radius: 999px;
          overflow: hidden;
          background: var(--segment-bg);
        }

        .segment {
          appearance: none;
          border: 0;
          background: transparent;
          color: var(--segment-text);
          min-height: 40px;
          padding: 10px 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font: inherit;
          cursor: pointer;
          transition: background-color 160ms ease, color 160ms ease, box-shadow 160ms ease;
          position: relative;
        }

        .segment:not(:first-child)::before {
          content: '';
          position: absolute;
          left: 0;
          top: 10px;
          bottom: 10px;
          width: 1px;
          background: var(--segment-border);
        }

        .segment:hover {
          background: var(--segment-surface);
        }

        .segment[aria-pressed='true'] {
          background: var(--segment-selected);
          color: var(--segment-selected-text);
          box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--segment-selected) 85%, black);
        }

        .segment[aria-pressed='true']::before {
          opacity: 0;
        }

        .segment-text {
          font-size: 13px;
          font-weight: 500;
          line-height: 1.05;
          white-space: nowrap;
        }

        .segment-icon {
          display: block;
          width: 18px;
          height: 18px;
          flex: 0 0 auto;
          line-height: 0;
          transform: translateY(-3px);
        }

        .empty {
          padding: 16px 0 4px;
          color: var(--segment-muted);
          font-size: 13px;
        }

        .hidden {
          display: none;
        }

        @media (max-width: 420px) {
          ha-card {
            padding: 12px;
          }

          .segment {
            min-height: 44px;
            padding: 10px 8px;
          }
        }
      </style>

      <ha-card>
        <div class="${segments.length ? 'segments' : 'empty'}">
          ${!hasEntity
            ? '<div>Choose an input_select helper to preview the card.</div>'
            : segments.length
            ? segments
                .map((segment) => {
                  const selected = segment.value === (entityState?.state ?? '');
                  const icon = segment.icon
                    ? `<ha-icon class="segment-icon" icon="${this._escapeHtml(segment.icon)}"></ha-icon>`
                    : '';

                  return `
                    <button
                      class="segment"
                      type="button"
                      data-value="${this._escapeHtml(segment.value)}"
                      aria-pressed="${selected ? 'true' : 'false'}"
                      title="${this._escapeHtml(segment.text)}"
                    >
                      ${icon}
                      <span class="segment-text">${this._escapeHtml(segment.text)}</span>
                    </button>
                  `;
                })
                .join('')
            : '<div>No segments configured</div>'}
        </div>
      </ha-card>
    `;

    this.shadowRoot.querySelectorAll('.segment').forEach((button) => {
      button.addEventListener('click', () => {
        const value = button.getAttribute('data-value');
        if (value) {
          this._selectOption(value);
        }
      });
    });

    this._lastRenderKey = this._getRenderKey();
  }
}

class HASegmentedButtonCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = null;
    this._hass = null;
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    this._config = {
      entity: config?.entity || '',
      segments: Array.isArray(config?.segments)
        ? config.segments.map((segment) => {
            if (typeof segment === 'string') {
              return { value: segment, text: segment, icon: '' };
            }

            return {
              value: segment?.value || '',
              text: segment?.text || segment?.label || segment?.value || '',
              icon: segment?.icon || '',
            };
          })
        : [],
    };

    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const entityPicker = this.shadowRoot?.querySelector('ha-entity-picker');
    if (entityPicker) {
      entityPicker.hass = hass;
    }

    if (this._config?.entity && !(this._config?.segments || []).length) {
      this._syncFromHelper(this._config.entity, false);
    }
  }

  _escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  _emitConfig(config) {
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _currentConfig() {
    return {
      type: `custom:${CARD_TYPE}`,
      entity: this._config?.entity || '',
      segments: (this._config?.segments || []).map((segment) => ({
        value: segment.value || '',
        text: segment.text || '',
        icon: segment.icon || '',
      })),
    };
  }

  _updateConfig(changes, shouldRender = false) {
    this._config = {
      ...this._config,
      ...changes,
    };

    this._emitConfig(this._currentConfig());

    if (shouldRender) {
      this._render();
    }
  }

  _updateSegment(index, field, value) {
    const segments = [...(this._config?.segments || [])];
    segments[index] = {
      ...segments[index],
      [field]: value,
    };

    this._updateConfig({ segments }, false);
  }

  _syncFromHelper(entityId = this._config?.entity, shouldRender = true) {
    const entityState = entityId && this._hass ? this._hass.states[entityId] : null;
    const options = entityState?.attributes?.options || [];

    if (!options.length) {
      return;
    }

    this._updateConfig({
      entity: entityId || '',
      segments: options.map((option) => ({
        value: option,
        text: option,
        icon: '',
      })),
    }, shouldRender);
  }

  _entityOptions() {
    if (!this._hass) {
      return [];
    }

    return Object.keys(this._hass.states || {})
      .filter((entityId) => entityId.startsWith('input_select.'))
      .sort();
  }

  _render() {
    if (!this.shadowRoot || !this._config) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          box-sizing: border-box;
          color: var(--primary-text-color);
        }

        .card {
          display: grid;
          gap: 16px;
          padding: 16px;
        }

        .section {
          display: grid;
          gap: 10px;
        }

        .section-title {
          font-size: 13px;
          font-weight: 600;
        }

        .helper-text {
          font-size: 12px;
          color: var(--secondary-text-color);
          line-height: 1.4;
        }

        .row {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .row.single {
          grid-template-columns: 1fr;
        }

        .segments {
          display: grid;
          gap: 12px;
        }

        .segment {
          display: grid;
          gap: 12px;
          grid-template-columns: 1.2fr 1fr 0.9fr auto;
          align-items: end;
          padding: 12px;
          border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
          border-radius: 16px;
          background: var(--card-background-color, var(--ha-card-background, #fff));
        }

        .field {
          display: grid;
          gap: 6px;
        }

        .field-label {
          font-size: 12px;
          color: var(--secondary-text-color);
        }

        .field-input {
          appearance: none;
          width: 100%;
          min-height: 40px;
          box-sizing: border-box;
          border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
          border-radius: 12px;
          padding: 0 12px;
          background: var(--card-background-color, var(--ha-card-background, #fff));
          color: var(--primary-text-color);
          font: inherit;
          outline: none;
        }

        .field-input:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 1px var(--primary-color);
        }

        .icon-field {
          width: 100%;
          min-width: 0;
        }

        .segment-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .button {
          appearance: none;
          border: 0;
          border-radius: 999px;
          min-height: 36px;
          padding: 0 14px;
          background: var(--primary-color);
          color: var(--text-primary-color, #fff);
          font: inherit;
          cursor: pointer;
        }

        .button.secondary {
          background: color-mix(in srgb, var(--primary-color) 12%, transparent);
          color: var(--primary-text-color);
        }

        .button.danger {
          background: color-mix(in srgb, var(--error-color, #d32f2f) 12%, transparent);
          color: var(--error-color, #d32f2f);
        }

        .button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 720px) {
          .row,
          .segment {
            grid-template-columns: 1fr;
          }
        }
      </style>

      <div class="card">
        <div class="section">
          <div class="section-title">Control</div>
          <div class="row single">
            <ha-entity-picker
              label="Input Select"
              data-role="entity-picker"
              value="${this._config.entity}"
            ></ha-entity-picker>
          </div>
          <div class="helper-text">
            Choose an input_select helper to create one row per option, then edit each option's displayed label and icon, or remove any row you do not want shown.
          </div>
        </div>

        <div class="section">
          <div class="segments">
            ${this._config.segments.length
              ? this._config.segments
                  .map(
                    (segment, index) => `
                      <div class="segment">
                        <label class="field">
                          <span class="field-label">Value</span>
                          <input class="field-input" type="text" value="${this._escapeHtml(segment.value || '')}" data-index="${index}" data-field="value" />
                        </label>
                        <label class="field">
                          <span class="field-label">Text</span>
                          <input class="field-input" type="text" value="${this._escapeHtml(segment.text || '')}" data-index="${index}" data-field="text" />
                        </label>
                        <label class="field">
                          <span class="field-label">Icon</span>
                          <ha-icon-picker class="icon-field" value="${this._escapeHtml(segment.icon || '')}" data-index="${index}" data-field="icon"></ha-icon-picker>
                        </label>
                        <div class="segment-actions">
                          <button class="button danger" type="button" data-action="remove-segment" data-index="${index}">Remove</button>
                        </div>
                      </div>
                    `
                  )
                  .join('')
              : '<div class="helper-text">No custom segments configured yet.</div>'}
          </div>
        </div>
      </div>
    `;

    const entityPicker = this.shadowRoot.querySelector('ha-entity-picker');
    if (entityPicker) {
      entityPicker.hass = this._hass;
      entityPicker.includeDomains = ['input_select'];
      entityPicker.addEventListener('value-changed', (event) => {
        this._syncFromHelper(event.detail.value || '', true);
      });
    }

    this.shadowRoot.querySelectorAll('input[data-index]').forEach((field) => {
      field.addEventListener('change', (event) => {
        const index = Number(field.getAttribute('data-index'));
        const segmentField = field.getAttribute('data-field');
        this._updateSegment(index, segmentField, event.target.value || '');
      });
    });

    this.shadowRoot.querySelectorAll('ha-icon-picker[data-index]').forEach((field) => {
      field.addEventListener('value-changed', (event) => {
        const index = Number(field.getAttribute('data-index'));
        const segmentField = field.getAttribute('data-field');
        this._updateSegment(index, segmentField, event.detail.value || '');
      });
    });

    this.shadowRoot.querySelectorAll('button[data-action="remove-segment"]').forEach((button) => {
      button.addEventListener('click', () => {
        const index = Number(button.getAttribute('data-index'));
        const segments = [...(this._config?.segments || [])];
        segments.splice(index, 1);
        this._updateConfig({ segments }, true);
      });
    });

    requestAnimationFrame(() => {
      if (!this.isConnected || !this.shadowRoot) {
        return;
      }

      if (entityPicker) {
        entityPicker.value = this._config.entity;
      }

      this.shadowRoot.querySelectorAll('input[data-index]').forEach((field) => {
        const fieldIndex = Number(field.getAttribute('data-index'));
        const fieldName = field.getAttribute('data-field');
        field.value = this._config.segments[fieldIndex]?.[fieldName] || '';
      });

      this.shadowRoot.querySelectorAll('ha-icon-picker[data-index]').forEach((field) => {
        const fieldIndex = Number(field.getAttribute('data-index'));
        const fieldName = field.getAttribute('data-field');
        field.value = this._config.segments[fieldIndex]?.[fieldName] || '';
      });
    });
  }

}

if (!customElements.get(CARD_TYPE)) {
  customElements.define(CARD_TYPE, HASegmentedButtonCard);
}

if (!customElements.get(`${CARD_TYPE}-editor`)) {
  customElements.define(`${CARD_TYPE}-editor`, HASegmentedButtonCardEditor);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === CARD_TYPE)) {
  window.customCards.push({
    type: CARD_TYPE,
    name: 'Segmented Button Card',
    description: 'Material Design 3 segmented button control for input_select helpers.',
  });
}