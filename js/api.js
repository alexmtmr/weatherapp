// The Observer — API Layer with caching
(function () {
    'use strict';

    var Config = window.WeatherApp.Config;
    var _cache = new Map();

    function cacheKey(url) {
        return url;
    }

    function getCached(url) {
        var entry = _cache.get(cacheKey(url));
        if (entry && (Date.now() - entry.ts < Config.CACHE_TTL)) {
            return entry.data;
        }
        _cache.delete(cacheKey(url));
        return null;
    }

    function setCache(url, data) {
        _cache.set(cacheKey(url), { data: data, ts: Date.now() });
    }

    function fetchJSON(url) {
        var cached = getCached(url);
        if (cached) return Promise.resolve(cached);

        return fetch(url)
            .then(function (res) {
                if (!res.ok) {
                    if (res.status === 401) throw new Error('Invalid API key');
                    if (res.status === 429) throw new Error('Rate limit exceeded. Please wait a moment.');
                    throw new Error('API error: ' + res.status);
                }
                return res.json();
            })
            .then(function (data) {
                setCache(url, data);
                return data;
            });
    }

    var API = {
        /**
         * Search for cities by name
         */
        geocode: function (query) {
            var url = Config.API_BASE + '/geo/1.0/direct?q=' +
                encodeURIComponent(query) + '&limit=5&appid=' + Config.getApiKey();
            return fetchJSON(url);
        },

        /**
         * Get current weather for coordinates
         */
        currentWeather: function (lat, lon) {
            var url = Config.API_BASE + '/data/2.5/weather?lat=' + lat + '&lon=' + lon +
                '&units=' + Config.UNITS + '&appid=' + Config.getApiKey();
            return fetchJSON(url);
        },

        /**
         * Get 5-day / 3-hour forecast
         */
        forecast: function (lat, lon) {
            var url = Config.API_BASE + '/data/2.5/forecast?lat=' + lat + '&lon=' + lon +
                '&units=' + Config.UNITS + '&appid=' + Config.getApiKey();
            return fetchJSON(url);
        },

        /**
         * Get air pollution data
         */
        airPollution: function (lat, lon) {
            var url = Config.API_BASE + '/data/2.5/air_pollution?lat=' + lat + '&lon=' + lon +
                '&appid=' + Config.getApiKey();
            return fetchJSON(url);
        },

        /**
         * Fetch all weather data in parallel
         */
        fetchAll: function (lat, lon) {
            return Promise.all([
                this.currentWeather(lat, lon),
                this.forecast(lat, lon),
                this.airPollution(lat, lon)
            ]).then(function (results) {
                return {
                    current: results[0],
                    forecast: results[1],
                    airPollution: results[2]
                };
            });
        },

        /**
         * Get precipitation map tile URL
         */
        precipTileUrl: function (z, x, y) {
            return Config.TILE_BASE + '/precipitation_new/' + z + '/' + x + '/' + y +
                '.png?appid=' + Config.getApiKey();
        },

        /**
         * Clear the cache (for manual refresh)
         */
        clearCache: function () {
            _cache.clear();
        }
    };

    window.WeatherApp = window.WeatherApp || {};
    window.WeatherApp.API = API;
})();
