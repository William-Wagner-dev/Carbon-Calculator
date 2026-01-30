/*
  js/app.js

  Application initialization and event handling.
  - Initializes UI helpers from CONFIG
  - Attaches submit handler to the calculator form
  - Processes the calculation, renders results and handles errors
*/

(function () {
  'use strict';

  // Helper to safely query elements
  function getElement(selector) {
    return document.querySelector(selector);
  }

  // Initialization when DOM is ready
  function initialize() {
    // Populate datalist for city autocompletion and setup autofill behavior
    if (typeof CONFIG !== 'undefined') {
      CONFIG.populateDatalist();
      CONFIG.setupDistanceAutofill();
    }

    // Get the calculator form element
    var calculatorForm = document.getElementById('calculator-form');
    if (!calculatorForm) {
      console.error('Form with id "calculator-form" not found.');
      return;
    }

    // Attach submit handler
    calculatorForm.addEventListener('submit', onFormSubmit);

    console.log('✅ Calculadora inicializada!');
  }

  /**
   * Form submit handler
   * - Prevents default submission
   * - Validates inputs
   * - Shows loading state
   * - Simulates processing and renders results
   */
  function onFormSubmit(event) {
    event.preventDefault();

    // Get form values with descriptive variable names
    var originInput = document.getElementById('origin');
    var destinationInput = document.getElementById('destination');
    var distanceInput = document.getElementById('distance');
    var transportRadio = document.querySelector('input[name="transport"]:checked');
    var submitButton = event.target.querySelector('.calculator-form__submit');

    var origin = originInput ? originInput.value.trim() : '';
    var destination = destinationInput ? destinationInput.value.trim() : '';
    var distance = distanceInput ? parseFloat(distanceInput.value) : NaN;
    var selectedTransport = transportRadio ? transportRadio.value : null;

    // Basic validation
    if (!origin || !destination) {
      window.alert('Por favor, preencha origem e destino.');
      return;
    }

    if (Number.isNaN(distance) || distance <= 0) {
      window.alert('Por favor, informe uma distância válida maior que 0 km.');
      return;
    }

    if (!selectedTransport) {
      window.alert('Por favor, selecione um modo de transporte.');
      return;
    }

    // Show loading on the submit button
    if (submitButton && typeof UI !== 'undefined') {
      UI.showLoading(submitButton);
    }

    // Hide previous results
    if (typeof UI !== 'undefined') {
      UI.hideElement('results');
      UI.hideElement('comparison');
      UI.hideElement('carbon-credits');
    }

    // Simulate processing delay
    setTimeout(function () {
      try {
        // Calculate emission for selected mode
        var emission = (typeof Calculator !== 'undefined') ? Calculator.calculateEmission(distance, selectedTransport) : null;
        if (emission === null) throw new Error('Não foi possível calcular a emissão para o modo selecionado.');

        // Calculate baseline car emission
        var carEmission = (typeof Calculator !== 'undefined') ? Calculator.calculateEmission(distance, 'car') : null;

        // Calculate savings compared to car (if car emission available)
        var savings = null;
        if (carEmission !== null && typeof Calculator !== 'undefined') {
          savings = Calculator.calculateSavings(emission, carEmission);
        }

        // Calculate comparison across all modes
        var comparisonArray = (typeof Calculator !== 'undefined') ? Calculator.calculateAllModes(distance) : [];

        // Calculate carbon credits and price estimate
        var credits = (typeof Calculator !== 'undefined') ? Calculator.calculateCarbonCredits(emission) : null;
        var priceEstimate = (credits !== null && typeof Calculator !== 'undefined') ? Calculator.estimateCreditPrice(credits) : null;

        // Build data objects for rendering
        var resultsData = {
          origin: origin,
          destination: destination,
          distance: distance,
          emission: emission,
          mode: selectedTransport,
          savings: savings
        };

        var creditsData = {
          credits: credits || 0,
          price: priceEstimate || { min: 0, max: 0, average: 0 }
        };

        // Render HTML and set it into the DOM
        var resultsContainer = document.getElementById('results-content');
        var comparisonContainer = document.getElementById('comparison-content');
        var creditsContainer = document.getElementById('carbon-credits-content');

        if (resultsContainer && typeof UI !== 'undefined') {
          resultsContainer.innerHTML = UI.renderResults(resultsData);
        }

        if (comparisonContainer && typeof UI !== 'undefined') {
          comparisonContainer.innerHTML = UI.renderComparison(comparisonArray, selectedTransport);
        }

        if (creditsContainer && typeof UI !== 'undefined') {
          creditsContainer.innerHTML = UI.renderCarbonCredits(creditsData);
        }

        // Show result sections
        if (typeof UI !== 'undefined') {
          UI.showElement('results');
          UI.showElement('comparison');
          UI.showElement('carbon-credits');
          UI.scrollToElement('results');
        }

        // Restore button state
        if (submitButton && typeof UI !== 'undefined') {
          UI.hideLoading(submitButton);
        }
      } catch (err) {
        console.error('Erro durante o cálculo:', err);
        window.alert('Ocorreu um erro ao processar a solicitação. Tente novamente.');
        if (submitButton && typeof UI !== 'undefined') {
          UI.hideLoading(submitButton);
        }
      }
    }, 1500);
  }

  // Run initialization when DOM content is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
