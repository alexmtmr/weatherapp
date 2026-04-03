// The Observer — UI Rendering
(function () {
    'use strict';

    var Icons = window.WeatherApp.Icons;

    // ── Helpers ──────────────────────────────────────────

    function $(id) {
        return document.getElementById(id);
    }

    function formatTime(unix, timezoneOffset) {
        var d = new Date((unix + timezoneOffset) * 1000);
        var h = d.getUTCHours();
        var m = d.getUTCMinutes();
        var ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
    }

    function formatHour(dtTxt) {
        var parts = dtTxt.split(' ');
        var timeParts = parts[1].split(':');
        var h = parseInt(timeParts[0], 10);
        var ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return h + ' ' + ampm;
    }

    function getDayName(dtTxt, short) {
        var d = new Date(dtTxt.replace(' ', 'T') + 'Z');
        var days = short
            ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[d.getUTCDay()];
    }

    function formatDate(unix, timezoneOffset) {
        var d = new Date((unix + timezoneOffset) * 1000);
        var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        var months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return days[d.getUTCDay()] + ', ' + d.getUTCDate() + ' ' + months[d.getUTCMonth()];
    }

    function round(val) {
        return Math.round(val);
    }

    function calcDewPoint(temp, humidity) {
        // Magnus formula approximation
        var a = 17.27, b = 237.7;
        var alpha = (a * temp) / (b + temp) + Math.log(humidity / 100);
        return round((b * alpha) / (a - alpha));
    }

    var AQI_LABELS = [
        { label: 'Excellent', color: '#aeb4aa' },
        { label: 'Good', color: '#8ab87a' },
        { label: 'Moderate', color: '#d4a843' },
        { label: 'Poor', color: '#c47034' },
        { label: 'Very Poor', color: '#9e422c' }
    ];

    function groupForecastByDay(list) {
        var days = {};
        list.forEach(function (item) {
            var date = item.dt_txt.split(' ')[0];
            if (!days[date]) {
                days[date] = { items: [], date: date };
            }
            days[date].items.push(item);
        });

        var result = [];
        Object.keys(days).forEach(function (date) {
            var group = days[date];
            var maxTemp = -Infinity, minTemp = Infinity, icon = '03d';

            group.items.forEach(function (item) {
                if (item.main.temp_max > maxTemp) maxTemp = item.main.temp_max;
                if (item.main.temp_min < minTemp) minTemp = item.main.temp_min;
            });

            // Pick icon from the item closest to noon
            var noonItem = group.items.reduce(function (best, item) {
                var hour = parseInt(item.dt_txt.split(' ')[1].split(':')[0], 10);
                var bestHour = parseInt(best.dt_txt.split(' ')[1].split(':')[0], 10);
                return Math.abs(hour - 12) < Math.abs(bestHour - 12) ? item : best;
            });
            icon = noonItem.weather[0].icon;

            result.push({
                date: date,
                dt_txt: group.items[0].dt_txt,
                maxTemp: round(maxTemp),
                minTemp: round(minTemp),
                icon: icon
            });
        });

        return result;
    }

    // ── Render Functions ─────────────────────────────────

    var UI = {
        renderHero: function (current, cityInfo) {
            var tz = current.timezone;
            $('hero-city').textContent = cityInfo.name + ', ' + (cityInfo.country || current.sys.country);
            $('hero-date').textContent = formatDate(current.dt, tz);
            $('hero-temp').textContent = round(current.main.temp) + '°';
            $('hero-description').textContent = current.weather[0].description;
            $('hero-details').textContent = 'Feels like ' + round(current.main.feels_like) +
                '° \u2022 Wind: ' + round(current.wind.speed * 3.6) + ' km/h';

            $('hero-card').classList.add('fade-in');
        },

        renderHourly: function (forecastData) {
            var container = $('hourly-container');
            container.innerHTML = '';

            // Take first 8 forecast items (next 24h in 3h steps)
            var items = forecastData.list.slice(0, 8);

            items.forEach(function (item, i) {
                var div = document.createElement('div');
                var isFirst = i === 0;
                div.className = 'flex-shrink-0 flex flex-col items-center gap-3 w-14' +
                    (isFirst ? ' py-2 bg-surface-container-highest rounded-full' : '');

                div.innerHTML =
                    '<span class="font-body text-[10px] ' + (isFirst ? 'text-on-surface-variant' : 'text-outline-variant') + '">' +
                    formatHour(item.dt_txt) + '</span>' +
                    '<span class="material-symbols-outlined text-primary text-lg">' +
                    Icons.get(item.weather[0].icon) + '</span>' +
                    '<span class="font-headline text-sm font-bold">' +
                    round(item.main.temp) + '°</span>';

                container.appendChild(div);
            });

            container.classList.add('fade-in');
        },

        renderDaily: function (forecastData) {
            var container = $('daily-container');
            container.innerHTML = '';

            var days = groupForecastByDay(forecastData.list);
            // Skip the first partial day, show up to 7
            var startIdx = days.length > 5 ? 1 : 0;
            var displayDays = days.slice(startIdx, startIdx + 7);

            var today = new Date();
            var todayStr = today.getFullYear() + '-' +
                String(today.getMonth() + 1).padStart(2, '0') + '-' +
                String(today.getDate()).padStart(2, '0');

            displayDays.forEach(function (day) {
                var div = document.createElement('div');
                div.className = 'flex items-center justify-between';

                var dayName = getDayName(day.dt_txt, true);
                var isToday = day.date === todayStr;

                div.innerHTML =
                    '<span class="font-body text-sm w-12 text-on-surface-variant' +
                    (isToday ? ' font-bold' : '') + '">' + dayName + '</span>' +
                    '<div class="flex-1 flex justify-center">' +
                    '<span class="material-symbols-outlined text-primary">' +
                    Icons.get(day.icon) + '</span></div>' +
                    '<div class="w-16 text-right">' +
                    '<span class="font-headline text-sm font-bold">' + day.maxTemp + '°</span>' +
                    '<span class="font-headline text-sm text-outline-variant ml-2">' + day.minTemp + '°</span>' +
                    '</div>';

                container.appendChild(div);
            });

            container.classList.add('fade-in');
        },

        renderMetrics: function (current, airData) {
            // Humidity
            $('metric-humidity').textContent = current.main.humidity + '%';
            $('metric-dewpoint').textContent = 'Dew point: ' + calcDewPoint(current.main.temp, current.main.humidity) + '°';

            // Air Quality
            if (airData && airData.list && airData.list.length > 0) {
                var aqi = airData.list[0].main.aqi; // 1-5
                var aqiInfo = AQI_LABELS[aqi - 1] || AQI_LABELS[0];
                $('metric-aqi').textContent = aqi;
                $('metric-aqi-label').textContent = aqiInfo.label + ' Status';
                $('metric-aqi-dot').style.backgroundColor = aqiInfo.color;
            }

            // Visibility
            var visKm = (current.visibility / 1000).toFixed(0);
            $('metric-visibility').textContent = visKm + ' km';
            var visLabel = visKm >= 10 ? 'Clear horizon' : visKm >= 5 ? 'Moderate' : 'Low visibility';
            $('metric-visibility-label').textContent = visLabel;

            // UV Index — not available on free tier, show N/A
            $('metric-uv').textContent = 'N/A';
            $('metric-uv-label').textContent = 'Upgrade for UV data';
        },

        renderSunPosition: function (current) {
            var tz = current.timezone;
            var sunrise = current.sys.sunrise;
            var sunset = current.sys.sunset;

            $('sunrise-time').textContent = formatTime(sunrise, tz);
            $('sunset-time').textContent = formatTime(sunset, tz);

            // Calculate sun position on the arc
            var now = current.dt;
            var progress = (now - sunrise) / (sunset - sunrise);
            progress = Math.max(0, Math.min(1, progress));

            // Map progress to quadratic bezier path: M 15 85 Q 150 -10 285 85
            var t = progress;
            var x = (1 - t) * (1 - t) * 15 + 2 * (1 - t) * t * 150 + t * t * 285;
            var y = (1 - t) * (1 - t) * 85 + 2 * (1 - t) * t * (-10) + t * t * 85;

            var dot = $('sun-dot');
            if (dot) {
                dot.setAttribute('cx', x);
                dot.setAttribute('cy', y);
            }
        },

        renderPrecipMap: function (lat, lon, cityName) {
            var container = $('precip-map');
            var zoom = 7;
            var n = Math.pow(2, zoom);
            var centerX = Math.floor((lon + 180) / 360 * n);
            var latRad = lat * Math.PI / 180;
            var centerY = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);

            // Build a 3x3 tile grid with base map + precipitation overlay
            var gridSize = 3;
            var startX = centerX - 1;
            var startY = centerY - 1;
            var tileSize = 256;
            var apiKey = window.WeatherApp.Config.getApiKey();

            var html = '<div style="position:relative;width:' + (gridSize * tileSize) + 'px;height:' + (gridSize * tileSize) + 'px;' +
                'transform-origin:center center;overflow:hidden;">';

            for (var row = 0; row < gridSize; row++) {
                for (var col = 0; col < gridSize; col++) {
                    var tx = startX + col;
                    var ty = startY + row;
                    var left = col * tileSize;
                    var top = row * tileSize;
                    var baseStyle = 'position:absolute;left:' + left + 'px;top:' + top + 'px;width:' + tileSize + 'px;height:' + tileSize + 'px;';

                    // Base map tile (CartoDB Positron — light, minimal style, no referrer required)
                    html += '<img src="https://basemaps.cartocdn.com/light_all/' + zoom + '/' + tx + '/' + ty + '.png" ' +
                        'style="' + baseStyle + 'opacity:0.6;" alt="" />';

                    // Precipitation overlay
                    html += '<img src="https://tile.openweathermap.org/map/precipitation_new/' + zoom + '/' + tx + '/' + ty + '.png?appid=' + apiKey + '" ' +
                        'style="' + baseStyle + 'opacity:0.7;" alt="" onerror="this.style.display=\'none\'" />';
                }
            }

            html += '</div>';

            // Center the grid in the container
            container.innerHTML = '';
            container.style.overflow = 'hidden';
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.innerHTML = '<div style="overflow:hidden;width:100%;height:100%;display:flex;align-items:center;justify-content:center;">' + html + '</div>';

            $('map-location').textContent = cityName;
        },

        renderSearchResults: function (results) {
            var container = $('search-results');
            container.innerHTML = '';

            if (!results || results.length === 0) {
                container.classList.add('hidden');
                return;
            }

            results.forEach(function (item) {
                var div = document.createElement('div');
                div.className = 'search-result-item';
                div.textContent = item.name + (item.state ? ', ' + item.state : '') + ', ' + item.country;
                div.addEventListener('click', function () {
                    var city = { name: item.name, country: item.country, lat: item.lat, lon: item.lon };
                    window.WeatherApp.Config.setLastCity(city);
                    window.WeatherApp.State.set('selectedCity', city);
                    container.classList.add('hidden');
                    $('search-input').value = '';
                });
                container.appendChild(div);
            });

            container.classList.remove('hidden');
        },

        renderAll: function (data, cityInfo) {
            this.renderHero(data.current, cityInfo);
            this.renderHourly(data.forecast);
            this.renderDaily(data.forecast);
            this.renderMetrics(data.current, data.airPollution);
            this.renderSunPosition(data.current);
            this.renderPrecipMap(cityInfo.lat, cityInfo.lon, cityInfo.name);
        }
    };

    window.WeatherApp = window.WeatherApp || {};
    window.WeatherApp.UI = UI;
})();
