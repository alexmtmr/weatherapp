// The Observer — App Entry Point
(function () {
    'use strict';

    var Config = window.WeatherApp.Config;
    var State = window.WeatherApp.State;
    var API = window.WeatherApp.API;
    var UI = window.WeatherApp.UI;

    // ── Data Loading ─────────────────────────────────────

    var _loading = false;

    function loadWeatherData(city) {
        if (_loading) return;
        _loading = true;

        API.fetchAll(city.lat, city.lon)
            .then(function (data) {
                State.set('weatherData', data);
                State.set('currentCity', city);
                UI.renderAll(data, city);
            })
            .catch(function (err) {
                console.error('Failed to load weather data:', err);
            })
            .finally(function () {
                _loading = false;
            });
    }

    // ── Search ───────────────────────────────────────────

    var _searchTimeout = null;

    function setupSearch() {
        var input = document.getElementById('search-input');
        var results = document.getElementById('search-results');

        input.addEventListener('input', function () {
            var query = input.value.trim();
            clearTimeout(_searchTimeout);

            if (query.length < 2) {
                results.classList.add('hidden');
                return;
            }

            _searchTimeout = setTimeout(function () {
                API.geocode(query)
                    .then(function (data) {
                        UI.renderSearchResults(data);
                    })
                    .catch(function (err) {
                        console.error('Search error:', err);
                    });
            }, 300);
        });

        // Close search results when clicking outside
        document.addEventListener('click', function (e) {
            if (!input.contains(e.target) && !results.contains(e.target)) {
                results.classList.add('hidden');
            }
        });
    }

    // ── State Listeners ──────────────────────────────────

    function setupStateListeners() {
        State.subscribe(function (key, value) {
            if (key === 'selectedCity') {
                loadWeatherData(value);
            }
        });
    }

    // ── Refresh Button ───────────────────────────────────

    function setupRefresh() {
        var btn = document.getElementById('refresh-btn');
        var icon = btn.querySelector('.material-symbols-outlined');

        btn.addEventListener('click', function () {
            // Spin animation for feedback
            icon.style.transition = 'transform 0.6s ease';
            icon.style.transform = 'rotate(360deg)';
            setTimeout(function () {
                icon.style.transition = 'none';
                icon.style.transform = 'rotate(0deg)';
            }, 650);

            // Force fresh fetch
            API.clearCache();
            _loading = false; // Reset loading guard
            var city = State.get('currentCity') || Config.getLastCity();
            loadWeatherData(city);
        });
    }

    // ── Init ─────────────────────────────────────────────

    function init() {
        setupSearch();
        setupStateListeners();
        setupRefresh();

        var city = Config.getLastCity();
        loadWeatherData(city);
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
