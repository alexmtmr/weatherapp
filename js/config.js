// The Observer — Configuration
(function () {
    'use strict';

    const CONFIG = {
        API_BASE: 'https://api.openweathermap.org',
        TILE_BASE: 'https://tile.openweathermap.org/map',
        UNITS: 'metric',
        DEFAULT_CITY: { name: 'Copenhagen', country: 'DK', lat: 55.6761, lon: 12.5683 },
        CACHE_TTL: 10 * 60 * 1000, // 10 minutes

        getApiKey: function () {
            return window.__OWM_API_KEY__ || '';
        },

        hasApiKey: function () {
            return !!window.__OWM_API_KEY__;
        },

        getLastCity: function () {
            const stored = localStorage.getItem('owm_last_city');
            if (stored) {
                try { return JSON.parse(stored); } catch (e) { /* ignore */ }
            }
            return this.DEFAULT_CITY;
        },

        setLastCity: function (city) {
            localStorage.setItem('owm_last_city', JSON.stringify(city));
        }
    };

    window.WeatherApp = window.WeatherApp || {};
    window.WeatherApp.Config = CONFIG;
})();
