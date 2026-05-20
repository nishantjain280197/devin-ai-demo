// === Insurance Weather Services - Main Application ===

let activeTab = 'address';
let autocompleteTimer = null;
let autocompleteController = null;

// === Visit Counter ===
function initVisitCounter() {
    let count = parseInt(localStorage.getItem('iws_visit_count') || '0', 10);
    count++;
    localStorage.setItem('iws_visit_count', count.toString());
    document.getElementById('visitCount').textContent = count.toLocaleString();
}

// === Tab Switching ===
function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tab}`);
    });
}

// === Set Default Date ===
function setDefaultDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('dateInput').value = `${yyyy}-${mm}-${dd}`;

    // Set max date to today (can't check future with historical API beyond forecast)
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    const maxYyyy = maxDate.getFullYear();
    const maxMm = String(maxDate.getMonth() + 1).padStart(2, '0');
    const maxDd = String(maxDate.getDate()).padStart(2, '0');
    document.getElementById('dateInput').setAttribute('max', `${maxYyyy}-${maxMm}-${maxDd}`);

    // Set min date to 2 years ago
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 2);
    const minYyyy = minDate.getFullYear();
    const minMm = String(minDate.getMonth() + 1).padStart(2, '0');
    const minDd = String(minDate.getDate()).padStart(2, '0');
    document.getElementById('dateInput').setAttribute('min', `${minYyyy}-${minMm}-${minDd}`);
}

// === Geocoding via Nominatim ===
async function geocodeLocation(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=1&addressdetails=1`;
    const response = await fetch(url, {
        headers: { 'User-Agent': 'InsuranceWeatherServices/1.0' }
    });
    const data = await response.json();
    if (!data || data.length === 0) {
        throw new Error('Location not found. Please check your input and try again.');
    }
    return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        displayName: data[0].display_name,
        address: data[0].address
    };
}

// === Address Autocomplete ===
async function fetchAutocompleteSuggestions(query) {
    if (autocompleteController) autocompleteController.abort();
    autocompleteController = new AbortController();

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=5&addressdetails=1`;
    const response = await fetch(url, {
        headers: { 'User-Agent': 'InsuranceWeatherServices/1.0' },
        signal: autocompleteController.signal
    });
    return await response.json();
}

function setupAutocomplete() {
    const input = document.getElementById('addressInput');
    const dropdown = document.getElementById('autocompleteDropdown');
    let selectedIndex = -1;

    input.addEventListener('input', () => {
        const query = input.value.trim();
        clearTimeout(autocompleteTimer);
        selectedIndex = -1;

        if (query.length < 3) {
            dropdown.classList.remove('active');
            dropdown.innerHTML = '';
            return;
        }

        dropdown.innerHTML = '<div class="autocomplete-loading"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
        dropdown.classList.add('active');

        autocompleteTimer = setTimeout(async () => {
            try {
                const results = await fetchAutocompleteSuggestions(query);
                if (results.length === 0) {
                    dropdown.innerHTML = '<div class="autocomplete-loading">No results found</div>';
                    return;
                }
                dropdown.innerHTML = results.map((r, i) => `
                    <div class="autocomplete-item" data-index="${i}" data-display="${r.display_name}">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${r.display_name}</span>
                    </div>
                `).join('');

                dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
                    item.addEventListener('click', () => {
                        input.value = item.dataset.display;
                        dropdown.classList.remove('active');
                        dropdown.innerHTML = '';
                    });
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    dropdown.innerHTML = '<div class="autocomplete-loading">Error fetching suggestions</div>';
                }
            }
        }, 350);
    });

    input.addEventListener('keydown', (e) => {
        const items = dropdown.querySelectorAll('.autocomplete-item');
        if (!items.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            items.forEach((el, i) => el.classList.toggle('active', i === selectedIndex));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            items.forEach((el, i) => el.classList.toggle('active', i === selectedIndex));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            input.value = items[selectedIndex].dataset.display;
            dropdown.classList.remove('active');
            dropdown.innerHTML = '';
        } else if (e.key === 'Escape') {
            dropdown.classList.remove('active');
            dropdown.innerHTML = '';
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.autocomplete-wrapper')) {
            dropdown.classList.remove('active');
            dropdown.innerHTML = '';
        }
    });
}

// === Build Search Query ===
function buildSearchQuery() {
    switch (activeTab) {
        case 'address': {
            const val = document.getElementById('addressInput').value.trim();
            if (!val) throw new Error('Please enter an address.');
            return val;
        }
        case 'city': {
            const city = document.getElementById('cityInput').value.trim();
            const state = document.getElementById('stateInput').value.trim();
            if (!city) throw new Error('Please enter a city name.');
            return state ? `${city}, ${state}, USA` : `${city}, USA`;
        }
        case 'zipcode': {
            const zip = document.getElementById('zipcodeInput').value.trim();
            if (!zip) throw new Error('Please enter a ZIP code.');
            if (!/^\d{5}(-\d{4})?$/.test(zip)) throw new Error('Please enter a valid US ZIP code.');
            return `${zip}, USA`;
        }
        default:
            throw new Error('Invalid search type.');
    }
}

// === Fetch Weather Data from Open-Meteo ===
async function fetchWeatherData(lat, lon, date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const searchDate = new Date(date + 'T00:00:00');
    const diffDays = Math.floor((searchDate - today) / (1000 * 60 * 60 * 24));

    let url;
    if (diffDays > 0) {
        // Future date - use forecast API
        url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,` +
            `showers_sum,windspeed_10m_max,windgusts_10m_max,winddirection_10m_dominant,weathercode` +
            `&hourly=windspeed_10m,windgusts_10m,precipitation,relative_humidity_2m` +
            `&start_date=${date}&end_date=${date}` +
            `&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&timezone=America/New_York`;
    } else {
        // Past or today - use historical/archive API
        url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
            `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,` +
            `showers_sum,windspeed_10m_max,windgusts_10m_max,winddirection_10m_dominant,weathercode` +
            `&hourly=windspeed_10m,windgusts_10m,precipitation,relative_humidity_2m` +
            `&start_date=${date}&end_date=${date}` +
            `&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&timezone=America/New_York`;
    }

    const response = await fetch(url);
    if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.reason || `Weather API error: ${response.status}`);
    }
    return await response.json();
}

// === Weather Code Descriptions ===
function getWeatherDescription(code) {
    const descriptions = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        56: 'Light freezing drizzle',
        57: 'Dense freezing drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        66: 'Light freezing rain',
        67: 'Heavy freezing rain',
        71: 'Slight snowfall',
        73: 'Moderate snowfall',
        75: 'Heavy snowfall',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail'
    };
    return descriptions[code] || `Weather code: ${code}`;
}

// === Wind Risk Assessment ===
function getWindRisk(speed) {
    if (speed < 25) return { level: 'low', label: 'Low Risk', percentage: Math.max(10, (speed / 25) * 33), icon: 'fa-check-circle' };
    if (speed < 40) return { level: 'moderate', label: 'Moderate Risk', percentage: 33 + ((speed - 25) / 15) * 33, icon: 'fa-exclamation-triangle' };
    if (speed < 58) return { level: 'high', label: 'High Risk', percentage: 66 + ((speed - 40) / 18) * 20, icon: 'fa-exclamation-circle' };
    return { level: 'severe', label: 'Severe Risk', percentage: Math.min(100, 86 + ((speed - 58) / 20) * 14), icon: 'fa-times-circle' };
}

// === Hail Risk Assessment ===
function getHailRisk(precip, snowfall, weatherCode) {
    const isHailCode = [96, 99].includes(weatherCode);
    const isThunderstorm = [95, 96, 99].includes(weatherCode);

    if (isHailCode) {
        return weatherCode === 99
            ? { level: 'severe', label: 'Severe Risk - Heavy Hail Reported', percentage: 95, icon: 'fa-times-circle' }
            : { level: 'high', label: 'High Risk - Hail Reported', percentage: 75, icon: 'fa-exclamation-circle' };
    }
    if (isThunderstorm && precip > 0.5) {
        return { level: 'moderate', label: 'Moderate Risk - Thunderstorm Activity', percentage: 50, icon: 'fa-exclamation-triangle' };
    }
    if (precip > 1.0 || snowfall > 0.5) {
        return { level: 'moderate', label: 'Moderate Risk - Significant Precipitation', percentage: 40, icon: 'fa-exclamation-triangle' };
    }
    if (precip > 0.25) {
        return { level: 'low', label: 'Low Risk - Light Precipitation', percentage: 20, icon: 'fa-check-circle' };
    }
    return { level: 'low', label: 'Low Risk - Minimal Precipitation', percentage: 8, icon: 'fa-check-circle' };
}

// === Display Results ===
function displayResults(location, weatherData, date) {
    const daily = weatherData.daily;
    const hourly = weatherData.hourly;

    // Location info
    document.getElementById('locationName').textContent = location.displayName;
    document.getElementById('coordinates').textContent = `${location.lat.toFixed(4)}°N, ${location.lon.toFixed(4)}°W`;
    document.getElementById('searchDate').textContent = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Wind data
    const windSpeed = daily.windspeed_10m_max?.[0] ?? 0;
    const windGusts = daily.windgusts_10m_max?.[0] ?? 0;
    const windDir = daily.winddirection_10m_dominant?.[0] ?? 0;
    document.getElementById('windSpeed').textContent = windSpeed.toFixed(1);
    document.getElementById('windGusts').textContent = windGusts.toFixed(1);
    document.getElementById('windDirection').textContent = Math.round(windDir);

    const windRisk = getWindRisk(windSpeed);
    const windRiskFill = document.getElementById('windRiskFill');
    const windRiskLabel = document.getElementById('windRiskLabel');
    windRiskFill.className = `risk-fill risk-${windRisk.level}`;
    setTimeout(() => { windRiskFill.style.width = `${windRisk.percentage}%`; }, 100);
    windRiskLabel.className = `risk-label risk-${windRisk.level}`;
    windRiskLabel.innerHTML = `<i class="fas ${windRisk.icon}"></i> ${windRisk.label}`;

    // Hail / precipitation data
    const precip = daily.precipitation_sum?.[0] ?? 0;
    const snowfall = daily.snowfall_sum?.[0] ?? 0;
    const showers = daily.showers_sum?.[0] ?? 0;
    const weatherCode = daily.weathercode?.[0] ?? 0;
    document.getElementById('hailPrecip').textContent = precip.toFixed(2);
    document.getElementById('snowfall').textContent = snowfall.toFixed(2);
    document.getElementById('showers').textContent = showers.toFixed(2);

    const hailRisk = getHailRisk(precip, snowfall, weatherCode);
    const hailRiskFill = document.getElementById('hailRiskFill');
    const hailRiskLabel = document.getElementById('hailRiskLabel');
    hailRiskFill.className = `risk-fill risk-${hailRisk.level}`;
    setTimeout(() => { hailRiskFill.style.width = `${hailRisk.percentage}%`; }, 200);
    hailRiskLabel.className = `risk-label risk-${hailRisk.level}`;
    hailRiskLabel.innerHTML = `<i class="fas ${hailRisk.icon}"></i> ${hailRisk.label}`;

    // Temperature & additional info
    const tempMax = daily.temperature_2m_max?.[0] ?? 0;
    const tempMin = daily.temperature_2m_min?.[0] ?? 0;
    document.getElementById('tempMax').textContent = Math.round(tempMax);
    document.getElementById('tempMin').textContent = Math.round(tempMin);

    // Average humidity from hourly data
    const humidityArr = hourly?.relative_humidity_2m || [];
    const avgHumidity = humidityArr.length > 0
        ? Math.round(humidityArr.reduce((a, b) => a + b, 0) / humidityArr.length)
        : 0;
    document.getElementById('humidity').textContent = avgHumidity;

    document.getElementById('weatherDescription').textContent = getWeatherDescription(weatherCode);

    // Hourly wind chart
    renderHourlyChart(hourly);

    // Map
    updateMap(location.lat, location.lon, location.displayName, windSpeed, precip);

    // Show results
    document.getElementById('resultsSection').style.display = 'block';
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// === Hourly Wind Chart ===
function renderHourlyChart(hourly) {
    const container = document.getElementById('hourlyChart');
    container.innerHTML = '';

    if (!hourly || !hourly.windspeed_10m) return;

    const speeds = hourly.windspeed_10m;
    const times = hourly.time;
    const maxSpeed = Math.max(...speeds, 1);

    speeds.forEach((speed, i) => {
        const hour = new Date(times[i]).getHours();
        const heightPct = (speed / maxSpeed) * 100;
        const risk = getWindRisk(speed);

        const wrapper = document.createElement('div');
        wrapper.className = 'chart-bar-wrapper';

        const valueEl = document.createElement('span');
        valueEl.className = 'chart-bar-value';
        valueEl.textContent = speed.toFixed(0);

        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = '0%';
        bar.title = `${hour}:00 - ${speed.toFixed(1)} mph`;

        const colorMap = { low: '#0d904f', moderate: '#f9a825', high: '#ff6d00', severe: '#d93025' };
        bar.style.background = colorMap[risk.level];

        const label = document.createElement('span');
        label.className = 'chart-bar-label';
        label.textContent = `${hour}`;

        wrapper.appendChild(valueEl);
        wrapper.appendChild(bar);
        wrapper.appendChild(label);
        container.appendChild(wrapper);

        // Animate bars
        setTimeout(() => { bar.style.height = `${Math.max(heightPct, 3)}%`; }, 50 + i * 30);
    });
}

// === Historical Comparison ===
function getLastYearDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setFullYear(d.getFullYear() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function displayHistoricalComparison(currentData, lastYearData, currentDate, lastYearDate) {
    const section = document.getElementById('historicalSection');

    if (!lastYearData || !lastYearData.daily) {
        section.style.display = 'none';
        return;
    }

    const curDaily = currentData.daily;
    const prevDaily = lastYearData.daily;

    const curWind = curDaily.windspeed_10m_max?.[0] ?? 0;
    const prevWind = prevDaily.windspeed_10m_max?.[0] ?? 0;
    const curPrecip = curDaily.precipitation_sum?.[0] ?? 0;
    const prevPrecip = prevDaily.precipitation_sum?.[0] ?? 0;
    const curTemp = curDaily.temperature_2m_max?.[0] ?? 0;
    const prevTemp = prevDaily.temperature_2m_max?.[0] ?? 0;

    document.getElementById('currentWind').textContent = curWind.toFixed(1);
    document.getElementById('prevWind').textContent = prevWind.toFixed(1);
    document.getElementById('currentPrecip').textContent = curPrecip.toFixed(2);
    document.getElementById('prevPrecip').textContent = prevPrecip.toFixed(2);
    document.getElementById('currentTemp').textContent = Math.round(curTemp);
    document.getElementById('prevTemp').textContent = Math.round(prevTemp);

    const lastYearFormatted = new Date(lastYearDate + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
    document.getElementById('historicalDateLabel').textContent = `(vs. ${lastYearFormatted})`;

    setChangeIndicator('windChange', curWind, prevWind, 'mph');
    setChangeIndicator('precipChange', curPrecip, prevPrecip, 'in');
    setChangeIndicator('tempChange', curTemp, prevTemp, '°F');

    section.style.display = 'block';
}

function setChangeIndicator(elementId, current, previous, unit) {
    const el = document.getElementById(elementId);
    const diff = current - previous;
    const absDiff = Math.abs(diff);

    if (absDiff < 0.1) {
        el.className = 'comparison-change same';
        el.innerHTML = '<i class="fas fa-equals"></i> Similar to last year';
    } else if (diff > 0) {
        el.className = 'comparison-change increase';
        el.innerHTML = `<i class="fas fa-arrow-up"></i> +${absDiff.toFixed(1)} ${unit} vs last year`;
    } else {
        el.className = 'comparison-change decrease';
        el.innerHTML = `<i class="fas fa-arrow-down"></i> -${absDiff.toFixed(1)} ${unit} vs last year`;
    }
}

// === Map ===
function updateMap(lat, lon, name, windSpeed, precip) {
    const iframe = document.getElementById('googleMap');
    const query = encodeURIComponent(name.split(',').slice(0, 3).join(','));
    iframe.src = `https://www.google.com/maps?q=${lat},${lon}&z=13&output=embed`;
}

// === Recent Searches ===
function saveRecentSearch(location, date, windSpeed) {
    const searches = JSON.parse(localStorage.getItem('iws_recent_searches') || '[]');
    searches.unshift({
        name: location.displayName,
        lat: location.lat,
        lon: location.lon,
        date: date,
        windSpeed: windSpeed,
        timestamp: Date.now()
    });
    // Keep last 10
    if (searches.length > 10) searches.pop();
    localStorage.setItem('iws_recent_searches', JSON.stringify(searches));
    renderRecentSearches();
}

function renderRecentSearches() {
    const searches = JSON.parse(localStorage.getItem('iws_recent_searches') || '[]');
    const container = document.getElementById('recentList');

    if (searches.length === 0) {
        container.innerHTML = '<p class="no-searches">No recent searches yet. Try searching for a location above!</p>';
        return;
    }

    container.innerHTML = searches.map((s, i) => `
        <div class="recent-item" onclick="rerunSearch(${i})">
            <div class="recent-item-info">
                <i class="fas fa-map-marker-alt"></i>
                <div>
                    <div class="recent-item-name">${s.name.split(',').slice(0, 3).join(',')}</div>
                    <div class="recent-item-date">${new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </div>
            </div>
            <div class="recent-item-wind">
                <i class="fas fa-wind"></i> ${s.windSpeed.toFixed(1)} mph
            </div>
        </div>
    `).join('');
}

async function rerunSearch(index) {
    const searches = JSON.parse(localStorage.getItem('iws_recent_searches') || '[]');
    if (index >= searches.length) return;

    const s = searches[index];
    document.getElementById('dateInput').value = s.date;
    switchTab('address');
    document.getElementById('addressInput').value = s.name;

    await performSearch();
}

// === Main Search Function ===
async function performSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const loading = document.getElementById('loadingOverlay');

    try {
        const query = buildSearchQuery();
        const date = document.getElementById('dateInput').value;
        if (!date) throw new Error('Please select a date.');

        // Show loading
        searchBtn.disabled = true;
        loading.classList.add('active');
        document.getElementById('resultsSection').style.display = 'none';

        // Geocode
        const location = await geocodeLocation(query);

        // Fetch weather
        const weatherData = await fetchWeatherData(location.lat, location.lon, date);

        // Fetch last year's data for comparison
        const lastYearDate = getLastYearDate(date);
        let lastYearData = null;
        try {
            lastYearData = await fetchWeatherData(location.lat, location.lon, lastYearDate);
        } catch (err) {
            console.warn('Could not fetch last year data:', err);
        }

        // Display
        displayResults(location, weatherData, date);

        // Display historical comparison
        displayHistoricalComparison(weatherData, lastYearData, date, lastYearDate);

        // Save to recent
        const windSpeed = weatherData.daily.windspeed_10m_max?.[0] ?? 0;
        saveRecentSearch(location, date, windSpeed);

    } catch (error) {
        alert(error.message || 'An error occurred. Please try again.');
        console.error('Search error:', error);
    } finally {
        searchBtn.disabled = false;
        loading.classList.remove('active');
    }
}

// === Enter key support ===
function setupKeyboardShortcuts() {
    const inputs = ['addressInput', 'cityInput', 'stateInput', 'zipcodeInput', 'dateInput', 'timeInput'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') performSearch();
            });
        }
    });
}

// === Initialize ===
document.addEventListener('DOMContentLoaded', () => {
    initVisitCounter();
    setDefaultDate();
    setupKeyboardShortcuts();
    setupAutocomplete();
    renderRecentSearches();
});
