/**
 * FlyRank Embeddable Lead-Capture Widget
 * Version: 1.0.0
 * Lightweight, zero-dependency, cross-origin embed script
 */
(function () {
  'use strict';

  // 1. Locate current script and extract widgetId
  const currentScript =
    document.currentScript ||
    document.querySelector('script[src*="widget.js"]');

  if (!currentScript) {
    console.error('[FlyRank Widget] Could not locate widget script tag.');
    return;
  }

  const scriptUrl = new URL(currentScript.src, window.location.href);
  const widgetId = scriptUrl.searchParams.get('id');

  if (!widgetId) {
    console.error('[FlyRank Widget] Missing required "?id=<widget_id>" query parameter.');
    return;
  }

  const apiOrigin = scriptUrl.origin;

  // 2. Fetch widget configuration
  fetch(`${apiOrigin}/widgets/${encodeURIComponent(widgetId)}/config`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    mode: 'cors',
  })
    .then((res) => {
      if (!res.ok) throw new Error(`Widget not found (${res.status})`);
      return res.json();
    })
    .then((config) => {
      renderWidget(config, apiOrigin);
    })
    .catch((err) => {
      console.warn('[FlyRank Widget] Failed to load configuration:', err.message);
    });

  // 3. Render widget DOM
  function renderWidget(config, apiOrigin) {
    const targetContainerId = `flyrank-widget-${config.id}`;
    let mountNode = document.getElementById(targetContainerId);

    const isFloating = config.displayOptions?.position === 'bottom-right' || config.displayOptions?.position === 'bottom-left';

    if (!mountNode) {
      mountNode = document.createElement('div');
      mountNode.id = targetContainerId;
      if (isFloating) {
        mountNode.className = `flyrank-floating ${config.displayOptions.position}`;
      }
      document.body.appendChild(mountNode);
    }

    const themeColor = config.displayOptions?.themeColor || '#4f46e5';

    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
      #${targetContainerId} {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        box-sizing: border-box;
      }
      #${targetContainerId} * {
        box-sizing: border-box;
      }
      #${targetContainerId} .flyrank-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        max-width: 420px;
        width: 100%;
        margin: 10px 0;
      }
      #${targetContainerId}.flyrank-floating {
        position: fixed;
        bottom: 24px;
        z-index: 999999;
      }
      #${targetContainerId}.bottom-right { right: 24px; }
      #${targetContainerId}.bottom-left { left: 24px; }
      #${targetContainerId} .flyrank-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #111827;
        margin: 0 0 6px 0;
      }
      #${targetContainerId} .flyrank-desc {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0 0 16px 0;
        line-height: 1.4;
      }
      #${targetContainerId} .flyrank-group {
        margin-bottom: 12px;
      }
      #${targetContainerId} label {
        display: block;
        font-size: 0.8125rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 4px;
      }
      #${targetContainerId} input, #${targetContainerId} textarea {
        width: 100%;
        padding: 8px 12px;
        font-size: 0.875rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        outline: none;
        transition: border-color 0.15s ease;
      }
      #${targetContainerId} input:focus, #${targetContainerId} textarea:focus {
        border-color: ${themeColor};
        box-shadow: 0 0 0 2px ${themeColor}22;
      }
      #${targetContainerId} .flyrank-btn {
        width: 100%;
        background-color: ${themeColor};
        color: #ffffff;
        font-weight: 600;
        font-size: 0.875rem;
        padding: 10px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: opacity 0.2s ease;
        margin-top: 8px;
      }
      #${targetContainerId} .flyrank-btn:hover {
        opacity: 0.9;
      }
      #${targetContainerId} .flyrank-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      #${targetContainerId} .flyrank-alert {
        padding: 10px 12px;
        border-radius: 6px;
        font-size: 0.875rem;
        margin-top: 12px;
        display: none;
      }
      #${targetContainerId} .flyrank-alert.success {
        display: block;
        background: #ecfdf5;
        color: #065f46;
        border: 1px solid #a7f3d0;
      }
      #${targetContainerId} .flyrank-alert.error {
        display: block;
        background: #fef2f2;
        color: #991b1b;
        border: 1px solid #fecaca;
      }
    `;
    document.head.appendChild(style);

    // Build Form HTML
    const fieldsHtml = (config.fields || [])
      .map((field) => {
        const inputType = field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text';
        const requiredAttr = field.required ? 'required' : '';
        const placeholderAttr = field.placeholder ? `placeholder="${field.placeholder}"` : '';

        if (field.type === 'textarea') {
          return `
            <div class="flyrank-group">
              <label for="fr-${field.name}">${field.label}</label>
              <textarea id="fr-${field.name}" name="${field.name}" rows="3" ${placeholderAttr} ${requiredAttr}></textarea>
            </div>
          `;
        }

        return `
          <div class="flyrank-group">
            <label for="fr-${field.name}">${field.label}</label>
            <input type="${inputType}" id="fr-${field.name}" name="${field.name}" ${placeholderAttr} ${requiredAttr} />
          </div>
        `;
      })
      .join('');

    mountNode.innerHTML = `
      <div class="flyrank-card">
        <h3 class="flyrank-title">${config.title || 'Get in Touch'}</h3>
        ${config.description ? `<p class="flyrank-desc">${config.description}</p>` : ''}
        <form class="flyrank-form">
          <!-- Honeypot field (hidden from human users, filled by bots) -->
          <input type="text" name="_hp" style="display:none !important; visibility:hidden !important; position:absolute; left:-9999px;" tabindex="-1" autocomplete="off" />
          ${fieldsHtml}
          <button type="submit" class="flyrank-btn">${config.buttonText || 'Submit'}</button>
        </form>
        <div class="flyrank-alert"></div>
      </div>
    `;

    // Handle Form Submit
    const form = mountNode.querySelector('.flyrank-form');
    const submitBtn = mountNode.querySelector('.flyrank-btn');
    const alertBox = mountNode.querySelector('.flyrank-alert');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      alertBox.className = 'flyrank-alert';
      alertBox.textContent = '';

      const formData = new FormData(form);
      const submissionData = {};
      let honeypotValue = '';

      formData.forEach((value, key) => {
        if (key === '_hp') {
          honeypotValue = value;
        } else {
          submissionData[key] = value;
        }
      });

      const payload = {
        widgetId: config.id,
        data: submissionData,
        _hp: honeypotValue,
      };

      fetch(config.submitUrl || `${apiOrigin}/api/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'cors',
      })
        .then(async (res) => {
          const json = await res.json();
          if (!res.ok) {
            throw new Error(json.error || `Server error (${res.status})`);
          }
          return json;
        })
        .then(() => {
          form.reset();
          alertBox.className = 'flyrank-alert success';
          alertBox.textContent = 'Thank you! Your submission has been received.';
        })
        .catch((err) => {
          alertBox.className = 'flyrank-alert error';
          alertBox.textContent = err.message || 'Something went wrong. Please try again.';
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = config.buttonText || 'Submit';
        });
    });
  }
})();
