/*
  js/calculator.js

  Defines a single global variable: Calculator

  Contains helper methods to calculate emissions, savings, carbon credits and
  price estimates based on values in the global CONFIG object.
*/

var Calculator = (function () {
  'use strict';

  /**
   * Round a number to `decimals` places safely (returns Number)
   * @param {number} value
   * @param {number} decimals
   * @returns {number}
   */
  function _round(value, decimals) {
    var factor = Math.pow(10, decimals);
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  /**
   * Calculate emissions (kg CO2) for a given distance and transport mode.
   * - Uses CONFIG.EMISSION_FACTORS[transportMode] as kg CO2 per km.
   * - Calculation: emission = distanceKm * factor
   * - Result rounded to 2 decimal places.
   * @param {number} distanceKm
   * @param {string} transportMode
   * @returns {number|null} Emission in kg CO2 or null when data missing
   */
  function calculateEmission(distanceKm, transportMode) {
    if (typeof CONFIG === 'undefined' || !CONFIG.EMISSION_FACTORS) {
      console.warn('CONFIG.EMISSION_FACTORS is not available.');
      return null;
    }

    var distance = Number(distanceKm);
    if (Number.isNaN(distance) || distance < 0) {
      console.warn('Invalid distance:', distanceKm);
      return null;
    }

    var factor = CONFIG.EMISSION_FACTORS[transportMode];
    if (typeof factor === 'undefined' || factor === null) {
      console.warn('Unknown transport mode:', transportMode);
      return null;
    }

    var emission = distance * Number(factor);
    return _round(emission, 2);
  }

  /**
   * Calculate emissions for all transport modes defined in CONFIG.EMISSION_FACTORS.
   * For each mode it returns an object: { mode, emission, percentageVsCar }
   * - percentageVsCar: (emission / carEmission) * 100, rounded to 2 decimals
   * - If car emission is zero or unknown, percentageVsCar will be null to avoid division by zero.
   * The returned array is sorted by emission (lowest first).
   * @param {number} distanceKm
   * @returns {Array<{mode:string, emission:number, percentageVsCar:number|null}>}
   */
  function calculateAllModes(distanceKm) {
    if (typeof CONFIG === 'undefined' || !CONFIG.EMISSION_FACTORS) {
      console.warn('CONFIG.EMISSION_FACTORS is not available.');
      return [];
    }

    var modes = Object.keys(CONFIG.EMISSION_FACTORS || {});
    var results = [];

    var carEmission = null;
    if (modes.indexOf('car') !== -1) {
      carEmission = calculateEmission(distanceKm, 'car');
    }

    modes.forEach(function (mode) {
      var emission = calculateEmission(distanceKm, mode);
      var percentage = null;

      if (emission !== null && carEmission !== null && carEmission > 0) {
        percentage = _round((emission / carEmission) * 100, 2);
      }

      results.push({ mode: mode, emission: emission, percentageVsCar: percentage });
    });

    // Sort by emission asc (handle nulls by pushing them to the end)
    results.sort(function (a, b) {
      if (a.emission === null && b.emission === null) return 0;
      if (a.emission === null) return 1;
      if (b.emission === null) return -1;
      return a.emission - b.emission;
    });

    return results;
  }

  /**
   * Calculate savings between baselineEmission and emission.
   * - savedKg = baselineEmission - emission
   * - percentage = (savedKg / baselineEmission) * 100
   * - Both values rounded to 2 decimals
   * - If baselineEmission is 0 or invalid, percentage is null
   * @param {number} emission
   * @param {number} baselineEmission
   * @returns {{savedKg:number, percentage:number|null}|null}
   */
  function calculateSavings(emission, baselineEmission) {
    var e = Number(emission);
    var b = Number(baselineEmission);
    if (Number.isNaN(e) || Number.isNaN(b)) return null;

    var savedKg = _round(b - e, 2);
    var percentage = null;
    if (b > 0) {
      percentage = _round((savedKg / b) * 100, 2);
    }

    return { savedKg: savedKg, percentage: percentage };
  }

  /**
   * Calculate carbon credits equivalent for a given emission in kg.
   * - credits = emissionKg / CONFIG.CARBON_CREDIT.KG_PER_CREDIT
   * - Result rounded to 4 decimal places
   * @param {number} emissionKg
   * @returns {number|null}
   */
  function calculateCarbonCredits(emissionKg) {
    if (typeof CONFIG === 'undefined' || !CONFIG.CARBON_CREDIT) {
      console.warn('CONFIG.CARBON_CREDIT not available.');
      return null;
    }

    var kg = Number(emissionKg);
    if (Number.isNaN(kg) || kg < 0) return null;

    var credits = kg / Number(CONFIG.CARBON_CREDIT.KG_PER_CREDIT);
    // 4 decimal places as requested
    return _round(credits, 4);
  }

  /**
   * Estimate price range for a number of carbon credits.
   * - min = credits * PRICE_MIN_BRL
   * - max = credits * PRICE_MAX_BRL
   * - average = (min + max) / 2
   * - All returned rounded to 2 decimals
   * @param {number} credits
   * @returns {{min:number, max:number, average:number}|null}
   */
  function estimateCreditPrice(credits) {
    if (typeof CONFIG === 'undefined' || !CONFIG.CARBON_CREDIT) {
      console.warn('CONFIG.CARBON_CREDIT not available.');
      return null;
    }

    var c = Number(credits);
    if (Number.isNaN(c) || c < 0) return null;

    var min = c * Number(CONFIG.CARBON_CREDIT.PRICE_MIN_BRL);
    var max = c * Number(CONFIG.CARBON_CREDIT.PRICE_MAX_BRL);
    var avg = (min + max) / 2;

    return {
      min: _round(min, 2),
      max: _round(max, 2),
      average: _round(avg, 2)
    };
  }

  // Public API
  return {
    calculateEmission: calculateEmission,
    calculateAllModes: calculateAllModes,
    calculateSavings: calculateSavings,
    calculateCarbonCredits: calculateCarbonCredits,
    estimateCreditPrice: estimateCreditPrice
  };
})();
