/*
  js/ui.js

  Defines a single global variable: UI

  UI contains utility helpers (formatting, DOM show/hide/scroll) and rendering
  functions that build HTML strings for results, comparisons and carbon credits.

  Notes on markup/conventions used:
    - Cards use `.results_card` for layout and BEM-style internal elements like
      `.results_card__title`, `.results_card__value`, etc.
    - Comparison items use `.comparison__item` and `.comparison__item--selected`.
    - Progress bars use `.comparison__progress` and an inner `.comparison__progress-bar`.
    - Values are formatted using `formatNumber()` and `formatCurrency()` for consistency.
*/

var UI = (function () {
  'use strict';

  /**
   * Format a number with `decimals` places using pt-BR locale and thousand separators.
   * @param {number} number
   * @param {number} decimals
   * @returns {string}
   */
  function formatNumber(number, decimals) {
    var n = Number(number);
    if (Number.isNaN(n)) return String(number);
    return n.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /**
   * Format a number as BRL currency (e.g., "R$ 1.234,56").
   * @param {number} value
   * @returns {string}
   */
  function formatCurrency(value) {
    var v = Number(value);
    if (Number.isNaN(v)) return String(value);
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  /**
   * Remove the `.hidden` class from an element by id.
   * @param {string} elementId
   */
  function showElement(elementId) {
    var el = document.getElementById(elementId);
    if (!el) return;
    el.classList.remove('hidden');
  }

  /**
   * Add the `.hidden` class to an element by id.
   * @param {string} elementId
   */
  function hideElement(elementId) {
    var el = document.getElementById(elementId);
    if (!el) return;
    el.classList.add('hidden');
  }

  /**
   * Smoothly scroll to an element by id.
   * @param {string} elementId
   */
  function scrollToElement(elementId) {
    var el = document.getElementById(elementId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* =====================
     RENDERING HELPERS
     ===================== */

  /**
   * Render the results area for a single calculation.
   * Expected `data` keys: origin, destination, distance, emission, mode, savings
   * Returns an HTML string using `.results_card` for each piece of info.
   * @param {Object} data
   * @returns {string}
   */
  function renderResults(data) {
    if (!data) return '';

    var origin = data.origin || '-';
    var destination = data.destination || '-';
    var distance = (typeof data.distance !== 'undefined') ? data.distance : null;
    var emission = (typeof data.emission !== 'undefined') ? data.emission : null;
    var mode = data.mode || 'car';
    var savings = data.savings || null; // { savedKg, percentage }

    var modeMeta = (typeof CONFIG !== 'undefined' && CONFIG.TRANSPORT_MODES && CONFIG.TRANSPORT_MODES[mode]) ? CONFIG.TRANSPORT_MODES[mode] : { label: mode, icon: '❓', color: '#ccc' };

    var distanceHtml = distance !== null ? formatNumber(distance, 1) + ' km' : '—';
    var emissionHtml = emission !== null ? formatNumber(emission, 2) + ' kg CO₂' : '—';

    // Route card
    var html = '';
    html += '<div class="results_card results_card--route">';
    html += '<div class="results_card__title">Rota</div>';
    html += '<div class="results_card__value">' + escapeHtml(origin) + ' → ' + escapeHtml(destination) + '</div>';
    html += '</div>';

    // Distance card
    html += '<div class="results_card results_card--distance">';
    html += '<div class="results_card__title">Distância</div>';
    html += '<div class="results_card__value">' + distanceHtml + '</div>';
    html += '</div>';

    // Emission card
    html += '<div class="results_card results_card--emission">';
    html += '<div class="results_card__title">Emissão</div>';
    html += '<div class="results_card__value">🌿 ' + emissionHtml + '</div>';
    html += '</div>';

    // Transport card
    html += '<div class="results_card results_card--transport">';
    html += '<div class="results_card__title">Transporte</div>';
    html += '<div class="results_card__value">' + (modeMeta.icon || '') + ' ' + escapeHtml(modeMeta.label) + '</div>';
    html += '</div>';

    // Savings card (only if mode not car and savings present)
    if (mode !== 'car' && savings && typeof savings.savedKg !== 'undefined') {
      html += '<div class="results_card results_card--savings">';
      html += '<div class="results_card__title">Economia</div>';
      html += '<div class="results_card__value">' + formatNumber(savings.savedKg, 2) + ' kg</div>';
      if (typeof savings.percentage !== 'undefined' && savings.percentage !== null) {
        html += '<div class="results_card__meta">(' + formatNumber(savings.percentage, 2) + '% comparado ao carro)</div>';
      }
      html += '</div>';
    }

    return html;
  }

  /**
   * Render comparison view for all modes.
   * modesArray: Array<{mode, emission, percentageVsCar}>
   * selectedMode: string (e.g., 'car')
   * Returns HTML string with `.comparison__item` elements and a tip box at the end.
   */
  function renderComparison(modesArray, selectedMode) {
    if (!Array.isArray(modesArray)) return '';

    // Determine max emission to use as 100% for progress bars (avoid 0)
    var maxEmission = modesArray.reduce(function (max, item) {
      if (item && typeof item.emission === 'number') return Math.max(max, item.emission);
      return max;
    }, 0);
    if (maxEmission === 0) maxEmission = 1; // avoid division by zero

    var html = '';

    modesArray.forEach(function (item) {
      var mode = item.mode;
      var emission = (typeof item.emission === 'number') ? item.emission : 0;
      var pctVsCar = (typeof item.percentageVsCar === 'number') ? item.percentageVsCar : null;

      var selected = (mode === selectedMode);
      var modeMeta = (typeof CONFIG !== 'undefined' && CONFIG.TRANSPORT_MODES && CONFIG.TRANSPORT_MODES[mode]) ? CONFIG.TRANSPORT_MODES[mode] : { label: mode, icon: '❓', color: '#ccc' };

      // Width relative to maxEmission
      var widthPct = Math.min(100, Math.round((emission / maxEmission) * 100));

      // Determine color
      var barColor = '#10b981'; // green
      if (widthPct > 100) barColor = '#ef4444';
      else if (widthPct > 75) barColor = '#f97316'; // orange
      else if (widthPct > 25) barColor = '#f59e0b'; // yellow

      html += '<div class="comparison__item' + (selected ? ' comparison__item--selected' : '') + '">';
      html += '<div class="comparison__header">';
      html += '<div class="comparison__icon">' + (modeMeta.icon || '') + '</div>';
      html += '<div class="comparison__label">' + escapeHtml(modeMeta.label || mode) + '</div>';
      if (selected) html += '<div class="comparison__badge">Selecionado</div>';
      html += '</div>'; // header

      html += '<div class="comparison__stats">';
      html += '<div class="comparison__emission">' + formatNumber(emission, 2) + ' kg CO₂</div>';
      html += '<div class="comparison__pct">' + (pctVsCar !== null ? formatNumber(pctVsCar, 2) + '% vs carro' : '—') + '</div>';
      html += '</div>';

      html += '<div class="comparison__progress">';
      html += '<div class="comparison__progress-bar" style="width: ' + widthPct + '%; background:' + barColor + ';"></div>';
      html += '</div>';

      html += '</div>'; // item
    });

    // Tip box
    html += '<div class="comparison__tip">';
    html += '<strong>Dica:</strong> Compare as emissões para escolher o modo mais eficiente. Quanto menor a barra, menor a emissão de CO₂.</div>';

    return html;
  }

  /**
   * Render carbon credits information.
   * creditsData: { credits: number, price: { min, max, average } }
   * Returns HTML string with 2 cards and an info box + action button.
   */
  function renderCarbonCredits(creditsData) {
    if (!creditsData) return '';

    var credits = (typeof creditsData.credits === 'number') ? creditsData.credits : 0;
    var price = creditsData.price || { min: 0, max: 0, average: 0 };

    var html = '';
    html += '<div class="carbon-credits__grid">';

    // Card 1: Credits needed
    html += '<div class="carbon-credits__card">';
    html += '<div class="carbon-credits__title">Créditos necessários</div>';
    html += '<div class="carbon-credits__value">' + formatNumber(credits, 4) + '</div>';
    html += '<div class="carbon-credits__helper">1 crédito = ' + formatNumber((CONFIG && CONFIG.CARBON_CREDIT ? CONFIG.CARBON_CREDIT.KG_PER_CREDIT : 1000), 0) + ' kg CO₂</div>';
    html += '</div>';

    // Card 2: Estimated price
    html += '<div class="carbon-credits__card">';
    html += '<div class="carbon-credits__title">Estimativa de preço</div>';
    html += '<div class="carbon-credits__value">' + formatCurrency(price.average || 0) + '</div>';
    html += '<div class="carbon-credits__helper">Faixa: ' + formatCurrency(price.min || 0) + ' — ' + formatCurrency(price.max || 0) + '</div>';
    html += '</div>';

    html += '</div>'; // grid

    html += '<div class="carbon-credits__info">Créditos de carbono são usados para compensar emissões investindo em projetos que reduzam ou capturem CO₂.</div>';

    html += '<div class="carbon-credits__action">';
    html += '<button class="calculator-form__submit" type="button">🛒 Compensar Emissões</button>';
    html += '</div>';

    return html;
  }

  /* =====================
     LOADING CONTROLS
     ===================== */

  /**
   * Show a loading spinner on a button and disable it.
   * Stores original text in `data-original-text`.
   * @param {HTMLElement} buttonElement
   */
  function showLoading(buttonElement) {
    if (!buttonElement) return;
    if (!buttonElement.dataset.originalText) buttonElement.dataset.originalText = buttonElement.innerHTML;
    buttonElement.disabled = true;
    buttonElement.innerHTML = '<span class="spinner"></span> Calculando...';
  }

  /**
   * Hide loading state and restore original button text.
   * @param {HTMLElement} buttonElement
   */
  function hideLoading(buttonElement) {
    if (!buttonElement) return;
    buttonElement.disabled = false;
    if (buttonElement.dataset.originalText) {
      buttonElement.innerHTML = buttonElement.dataset.originalText;
      delete buttonElement.dataset.originalText;
    }
  }

  /**
   * Simple HTML escaping for text content used in templates to avoid XSS.
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    if (str === null || typeof str === 'undefined') return '';
    return String(str).replace(/[&<>"'`]/g, function (s) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '`': '&#96;'
      })[s];
    });
  }

  // Expose public API
  return {
    formatNumber: formatNumber,
    formatCurrency: formatCurrency,
    showElement: showElement,
    hideElement: hideElement,
    scrollToElement: scrollToElement,
    renderResults: renderResults,
    renderComparison: renderComparison,
    renderCarbonCredits: renderCarbonCredits,
    showLoading: showLoading,
    hideLoading: hideLoading
  };
})();
