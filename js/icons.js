// The Observer — OWM Icon Code to Material Symbols mapping
(function () {
    'use strict';

    // OWM icon codes: https://openweathermap.org/weather-conditions
    // Format: {code}{d|n} where d=day, n=night
    var ICON_MAP = {
        '01d': 'sunny',
        '01n': 'nights_stay',
        '02d': 'partly_cloudy_day',
        '02n': 'partly_cloudy_night',
        '03d': 'cloud',
        '03n': 'cloud',
        '04d': 'cloud_queue',
        '04n': 'cloud_queue',
        '09d': 'rainy',
        '09n': 'rainy',
        '10d': 'rainy',
        '10n': 'rainy',
        '11d': 'thunderstorm',
        '11n': 'thunderstorm',
        '13d': 'weather_snowy',
        '13n': 'weather_snowy',
        '50d': 'foggy',
        '50n': 'foggy'
    };

    var Icons = {
        get: function (owmCode) {
            return ICON_MAP[owmCode] || 'cloud';
        }
    };

    window.WeatherApp = window.WeatherApp || {};
    window.WeatherApp.Icons = Icons;
})();
