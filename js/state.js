// The Observer — State Management (pub/sub)
(function () {
    'use strict';

    var _state = {};
    var _listeners = [];

    var State = {
        get: function (key) {
            return key ? _state[key] : Object.assign({}, _state);
        },

        set: function (key, value) {
            _state[key] = value;
            _listeners.forEach(function (fn) {
                try { fn(key, value); } catch (e) { console.error('State listener error:', e); }
            });
        },

        subscribe: function (fn) {
            _listeners.push(fn);
            return function unsubscribe() {
                _listeners = _listeners.filter(function (l) { return l !== fn; });
            };
        },

        clear: function () {
            _state = {};
        }
    };

    window.WeatherApp = window.WeatherApp || {};
    window.WeatherApp.State = State;
})();
