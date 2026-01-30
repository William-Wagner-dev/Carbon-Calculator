/*
  js/config.js

  Defines a single global variable: CONFIG

  Structure:
    CONFIG = {
      EMISSION_FACTORS: { bicycle: 0, car: 0.12, ... },
      TRANSPORT_MODES: { bicycle: { label, icon, color }, ... },
      CARBON_CREDIT: { KG_PER_CREDIT, PRICE_MIN_BRL, PRICE_MAX_BRL },
      populateDatalist: function() { ... },
      setupDistanceAutofill: function() { ... }
    }

  The file automatically initializes UI helpers on DOMContentLoaded (safely
  checking for RoutesDB). All interactions assume the HTML structure present in
  index.html (inputs with ids: origin, destination, distance, manual-distance and
  a <datalist id="cities-list">).
*/

var CONFIG = (function () {
  'use strict';

  var EMISSION_FACTORS = {
    bicycle: 0,
    car: 0.12,
    bus: 0.089,
    boat: 0.96
  };

  var TRANSPORT_MODES = {
    bicycle: { label: 'Bicicleta', icon: '🚲', color: '#10b981' },
    car: { label: 'Carro', icon: '🚗', color: '#059669' },
    bus: { label: 'Ônibus', icon: '🚌', color: '#3b82f6' },
    boat: { label: 'Barco', icon: '⛵', color: '#ef4444' }
  };

  var CARBON_CREDIT = {
    KG_PER_CREDIT: 1000,
    PRICE_MIN_BRL: 50,
    PRICE_MAX_BRL: 150
  };

  /**
   * Populate the <datalist id="cities-list"> element with options from RoutesDB.getAllCities().
   */
  function populateDatalist() {
    if (typeof RoutesDB === 'undefined' || !RoutesDB.getAllCities) {
      console.warn('RoutesDB not available. Cannot populate datalist.');
      return;
    }

    var list = document.getElementById('cities-list');
    if (!list) return;

    // Clear existing options
    list.innerHTML = '';

    var cities = RoutesDB.getAllCities();
    cities.forEach(function (city) {
      var opt = document.createElement('option');
      opt.value = city;
      list.appendChild(opt);
    });
  }

  /**
   * Setup autofill behavior for distance based on RoutesDB.
   * - Adds `change` listeners to origin and destination inputs
   * - Adds `change` listener to manual-distance checkbox
   */
  function setupDistanceAutofill() {
    var originInput = document.getElementById('origin');
    var destinationInput = document.getElementById('destination');
    var distanceInput = document.getElementById('distance');
    var manualCheckbox = document.getElementById('manual-distance');

    if (!originInput || !destinationInput || !distanceInput || !manualCheckbox) {
      console.warn('Distance autofill elements not found. Skipping setupDistanceAutofill.');
      return;
    }

    var helper = null;
    var group = distanceInput.closest('.form-group');
    if (group) helper = group.querySelector('.form-group__helper');
    if (!helper) {
      // Fallback: try selector
      helper = document.querySelector('.form-group__helper');
    }

    function setHelper(message, color) {
      if (!helper) return;
      helper.textContent = message;
      if (color) helper.style.color = color; else helper.style.color = '';
    }

    function clearDistance() {
      distanceInput.value = '';
      distanceInput.readOnly = true;
    }

    function tryAutofill() {
      var originVal = originInput.value ? originInput.value.trim() : '';
      var destVal = destinationInput.value ? destinationInput.value.trim() : '';

      // If manual mode is active, do not autofill
      if (manualCheckbox.checked) return;

      if (!originVal || !destVal) {
        // Not enough info yet
        clearDistance();
        setHelper('A distância será preenchida automaticamente', '');
        return;
      }

      if (typeof RoutesDB === 'undefined' || !RoutesDB.findDistance) {
        clearDistance();
        setHelper('Base de rotas indisponível. Você pode inserir a distância manualmente.', 'var(--warning)');
        return;
      }

      var distance = RoutesDB.findDistance(originVal, destVal);
      if (distance !== null && distance !== undefined) {
        distanceInput.value = distance;
        distanceInput.readOnly = true;
        setHelper('Distância encontrada: ' + distance + ' km', 'var(--primary)');
      } else {
        clearDistance();
        setHelper('Rota não encontrada. Você pode inserir a distância manualmente.', 'var(--text-light)');
      }
    }

    // Event listeners for origin and destination change
    originInput.addEventListener('change', tryAutofill);
    destinationInput.addEventListener('change', tryAutofill);

    // Manual checkbox behavior
    manualCheckbox.addEventListener('change', function () {
      if (manualCheckbox.checked) {
        distanceInput.readOnly = false;
        setHelper('Modo manual ativado. Insira a distância em km.', 'var(--secondary)');
      } else {
        // Try to autofill again
        tryAutofill();
      }
    });

    // Try an initial autofill in case values are pre-filled
    tryAutofill();
  }

  // Expose public API
  var api = {
    EMISSION_FACTORS: EMISSION_FACTORS,
    TRANSPORT_MODES: TRANSPORT_MODES,
    CARBON_CREDIT: CARBON_CREDIT,
    populateDatalist: populateDatalist,
    setupDistanceAutofill: setupDistanceAutofill
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      populateDatalist();
      setupDistanceAutofill();
    });
  } else {
    // DOM already loaded
    populateDatalist();
    setupDistanceAutofill();
  }

  return api;
})();
