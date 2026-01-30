/*
  js/routes-data.js

  Defines a single global variable: RoutesDB

  Structure:
    RoutesDB = {
      routes: [
        { origin: 'City, ST', destination: 'City, ST', distanceKm: Number },
        ...
      ],

      getAllCities: function() { ... },
      findDistance: function(origin, destination) { ... }
    }

  - `routes` is an array of route objects. Each route represents a measured/approximate
    distance between two Brazilian cities (city name followed by state abbreviation).
  - `getAllCities()` returns a unique, sorted array of all city names found in `routes`.
  - `findDistance(origin, destination)` looks up the distance (in km) for a given
    origin/destination pair (searches both directions). Returns the distance as a number
    when a route is found, or `null` when no matching route exists.
*/

var RoutesDB = (function () {
  'use strict';

  var routes = [
    { origin: 'São Paulo, SP', destination: 'Rio de Janeiro, RJ', distanceKm: 430 },
    { origin: 'São Paulo, SP', destination: 'Brasília, DF', distanceKm: 1015 },
    { origin: 'Rio de Janeiro, RJ', destination: 'Brasília, DF', distanceKm: 1148 },
    { origin: 'São Paulo, SP', destination: 'Campinas, SP', distanceKm: 95 },
    { origin: 'Rio de Janeiro, RJ', destination: 'Niterói, RJ', distanceKm: 13 },
    { origin: 'Belo Horizonte, MG', destination: 'Ouro Preto, MG', distanceKm: 100 },
    { origin: 'São Paulo, SP', destination: 'Belo Horizonte, MG', distanceKm: 586 },
    { origin: 'Salvador, BA', destination: 'Feira de Santana, BA', distanceKm: 109 },
    { origin: 'Salvador, BA', destination: 'Brasília, DF', distanceKm: 1120 },
    { origin: 'Fortaleza, CE', destination: 'Natal, RN', distanceKm: 534 },
    { origin: 'Recife, PE', destination: 'João Pessoa, PB', distanceKm: 120 },
    { origin: 'Recife, PE', destination: 'Salvador, BA', distanceKm: 800 },
    { origin: 'Manaus, AM', destination: 'Porto Velho, RO', distanceKm: 880 },
    { origin: 'Belém, PA', destination: 'São Luís, MA', distanceKm: 980 },
    { origin: 'Curitiba, PR', destination: 'Florianópolis, SC', distanceKm: 300 },
    { origin: 'Porto Alegre, RS', destination: 'Florianópolis, SC', distanceKm: 470 },
    { origin: 'Curitiba, PR', destination: 'São Paulo, SP', distanceKm: 408 },
    { origin: 'Vitória, ES', destination: 'Rio de Janeiro, RJ', distanceKm: 520 },
    { origin: 'Goiânia, GO', destination: 'Brasília, DF', distanceKm: 205 },
    { origin: 'Cuiabá, MT', destination: 'Campo Grande, MS', distanceKm: 690 },
    { origin: 'Campo Grande, MS', destination: 'Goiânia, GO', distanceKm: 780 },
    { origin: 'Manaus, AM', destination: 'Belém, PA', distanceKm: 1040 },
    { origin: 'Teresina, PI', destination: 'Fortaleza, CE', distanceKm: 530 },
    { origin: 'João Pessoa, PB', destination: 'Natal, RN', distanceKm: 190 },
    { origin: 'Aracaju, SE', destination: 'Salvador, BA', distanceKm: 330 },
    { origin: 'Maceió, AL', destination: 'Recife, PE', distanceKm: 250 },
    { origin: 'São Paulo, SP', destination: 'Santos, SP', distanceKm: 72 },
    { origin: 'Rio de Janeiro, RJ', destination: 'Petrópolis, RJ', distanceKm: 68 },
    { origin: 'Belo Horizonte, MG', destination: 'Uberlândia, MG', distanceKm: 500 },
    { origin: 'Ribeirão Preto, SP', destination: 'São Paulo, SP', distanceKm: 318 },
    { origin: 'Campinas, SP', destination: 'São José dos Campos, SP', distanceKm: 100 },
    { origin: 'Porto Velho, RO', destination: 'Rio Branco, AC', distanceKm: 507 },
    { origin: 'Palmas, TO', destination: 'Goiânia, GO', distanceKm: 720 },
    { origin: 'Salvador, BA', destination: 'Ilhéus, BA', distanceKm: 275 },
    { origin: 'Curitiba, PR', destination: 'Porto Alegre, RS', distanceKm: 710 }
  ];

  /**
   * Return unique sorted array of all city names from routes.
   * Extracts both origin and destination, removes duplicates, and sorts alphabetically.
   * @returns {string[]} Array of city strings like "São Paulo, SP"
   */
  function getAllCities() {
    var set = new Set();
    routes.forEach(function (r) {
      if (r && r.origin) set.add(String(r.origin));
      if (r && r.destination) set.add(String(r.destination));
    });

    return Array.from(set).sort(function (a, b) {
      // Use localeCompare with pt-BR to handle accents correctly
      return a.localeCompare(b, 'pt-BR');
    });
  }

  /**
   * Find route distance between two cities.
   * Searches in both directions and normalizes inputs (trim, toLowerCase).
   * Returns distance in km (number) when found, otherwise null.
   * @param {string} origin
   * @param {string} destination
   * @returns {number|null}
   */
  function findDistance(origin, destination) {
    if (!origin || !destination) return null;

    var o = String(origin).trim().toLowerCase();
    var d = String(destination).trim().toLowerCase();

    for (var i = 0; i < routes.length; i++) {
      var r = routes[i];
      var rOrigin = String(r.origin).trim().toLowerCase();
      var rDest = String(r.destination).trim().toLowerCase();

      if ((rOrigin === o && rDest === d) || (rOrigin === d && rDest === o)) {
        return r.distanceKm;
      }
    }

    return null;
  }

  // Expose public API as a single global variable
  return {
    routes: routes,
    getAllCities: getAllCities,
    findDistance: findDistance
  };
})();
