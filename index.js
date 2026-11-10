const API_KEY = '7bf3f09e01f4eabee9483d21e48df0ed';
const ENDPOINT = 'https://api.openweathermap.org/data/2.5/weather';

const cityInput = document.getElementById('city');
const searchBtn = document.getElementById('searchBtn');
const statusEl = document.getElementById('status');

const resultSection = document.getElementById('result');
const cityNameEl = document.getElementById('cityName');
const descEl = document.getElementById('desc');
const tempEl = document.getElementById('temp');
const iconEl = document.getElementById('icon');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const sunriseEl = document.getElementById('sunrise');
const sunsetEl = document.getElementById('sunset');
const localTimeEl = document.getElementById('localTime');

// Status message
function setStatus(msg, isError = false) {
    statusEl.textContent = msg;
    statusEl.style.color = isError ? '#fa0707d3' : '';
}

// Show result
function showResult() {
    resultSection.classList.remove('hidden');
}

// Hide result
function hideResult() {
    resultSection.classList.add('hidden');
}

// Format time
function formatTime(tsSeconds, tzOffsetSeconds) {
    const d = new Date((tsSeconds + tzOffsetSeconds) * 1000);

    return d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
    });
}

// City local time
function cityLocalTime(tzOffsetSeconds) {
    const nowUtcSec = Math.floor(Date.now() / 1000);
    return formatTime(nowUtcSec, tzOffsetSeconds);
}

// Weather icon
function iconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// CHANGE BACKGROUND BASED ON WEATHER
function setWeatherBackground(weather, iconCode) {

    document.body.classList.remove(
        'sunny',
        'rainy',
        'snowy',
        'cloudy',
        'foggy',
        'night'
    );

    const condition = weather.toLowerCase();

    // Night time
    if (iconCode && iconCode.endsWith('n')) {
        document.body.classList.add('night');
    }

    // Sunny
    else if (condition === 'clear') {
        document.body.classList.add('sunny');
    }

    // Rainy
    else if (
        condition.includes('rain') ||
        condition.includes('drizzle') ||
        condition.includes('thunder')
    ) {
        document.body.classList.add('rainy');
    }

    // Winter / Snow
    else if (
        condition.includes('snow') ||
        condition.includes('sleet')
    ) {
        document.body.classList.add('snowy');
    }

    // Foggy weather
    else if (
        condition.includes('mist') ||
        condition.includes('fog') ||
        condition.includes('haze') ||
        condition.includes('smoke')
    ) {
        document.body.classList.add('foggy');
    }

    // Cloudy
    else if (
        condition.includes('cloud') ||
        condition.includes('overcast')
    ) {
        document.body.classList.add('cloudy');
    }

    else {
        document.body.classList.add('cloudy');
    }
}

// Fetch weather
async function fetchWeather(city) {

    try {
        setStatus('Loading...');
        hideResult();

        const url = `${ENDPOINT}?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;

        const res = await fetch(url);

        if (!res.ok) {
            if (res.status === 404) {
                throw new Error('City not found');
            }

            throw new Error(`Network error ${res.status}`);
        }

        const data = await res.json();

        return data;

    } catch (err) {
        throw err;
    }
}

// Display weather
function renderWeather(data) {

    const {
        name,
        sys,
        weather,
        main,
        wind,
        timezone
    } = data;

    const w = weather && weather[0];

    cityNameEl.textContent =
        `${name}, ${sys && sys.country ? sys.country : ''}`;

    descEl.textContent = w
        ? (w.description || '').replace(/\b\w/g, s => s.toUpperCase())
        : '';

    tempEl.textContent = main
        ? Math.round(main.temp) + '°C'
        : '—';

    iconEl.src = w ? iconUrl(w.icon) : '';

    iconEl.alt = w ? w.description : 'weather';

    humidityEl.textContent = main ? main.humidity + '%' : '—';

    windEl.textContent = wind
        ? wind.speed + ' m/s'
        : '—';

    sunriseEl.textContent =
        sys && sys.sunrise
            ? formatTime(sys.sunrise, timezone)
            : '—';

    sunsetEl.textContent =
        sys && sys.sunset
            ? formatTime(sys.sunset, timezone)
            : '—';

    localTimeEl.textContent = cityLocalTime(timezone);

    // Set background automatically
    if (w) {
        setWeatherBackground(w.main, w.icon);
    }

    showResult();

    setStatus('Weather loaded.');
}

// Search weather
async function doSearch() {

    const q = cityInput.value.trim();

    if (!q) {
        setStatus('Please enter a city.', true);
        return;
    }

    try {

        const data = await fetchWeather(q);

        renderWeather(data);

    } catch (err) {

        console.error(err);

        setStatus(
            err.message || 'Failed to fetch weather.',
            true
        );
    }
}

// Search button
searchBtn.addEventListener('click', doSearch);

// Enter key
cityInput.addEventListener('keydown', (e) => {

    if (e.key === 'Enter') {
        doSearch();
    }

});