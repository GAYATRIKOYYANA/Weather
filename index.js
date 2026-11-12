const API_KEY = '186e1d226698f5e35cccf3c336444631';

// API Endpoints
const GEO_ENDPOINT =
    'https://api.openweathermap.org/geo/1.0/direct';

const WEATHER_ENDPOINT =
    'https://api.openweathermap.org/data/2.5/weather';

// HTML Elements
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

// Show weather result
function showResult() {
    resultSection.classList.remove('hidden');
}

// Hide weather result
function hideResult() {
    resultSection.classList.add('hidden');
}

// Format sunrise and sunset time
function formatTime(timestamp, timezone) {
    const date = new Date(
        (timestamp + timezone) * 1000
    );

    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'
    });
}

// Get city local time
function cityLocalTime(timezone) {
    const now = Math.floor(Date.now() / 1000);

    return formatTime(now, timezone);
}

// Weather icon URL
function iconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// Change background based on weather
function setWeatherBackground(weather, iconCode) {

    document.body.classList.remove(
        'default',
        'sunny',
        'rainy',
        'snowy',
        'cloudy',
        'foggy',
        'night'
    );

    const condition = weather.toLowerCase();

    // Night background
    if (iconCode && iconCode.endsWith('n')) {
        document.body.classList.add('night');
    }

    // Sunny background
    else if (condition === 'clear') {
        document.body.classList.add('sunny');
    }

    // Rainy background
    else if (
        condition.includes('rain') ||
        condition.includes('drizzle') ||
        condition.includes('thunder')
    ) {
        document.body.classList.add('rainy');
    }

    // Snowy background
    else if (
        condition.includes('snow') ||
        condition.includes('sleet')
    ) {
        document.body.classList.add('snowy');
    }

    // Foggy background
    else if (
        condition.includes('mist') ||
        condition.includes('fog') ||
        condition.includes('haze') ||
        condition.includes('smoke') ||
        condition.includes('dust') ||
        condition.includes('sand') ||
        condition.includes('ash')
    ) {
        document.body.classList.add('foggy');
    }

    // Cloudy background
    else if (
        condition.includes('cloud')
    ) {
        document.body.classList.add('cloudy');
    }

    else {
        document.body.classList.add('default');
    }
}

// Search location using Geocoding API
async function searchLocation(city) {

    const url =
        `${GEO_ENDPOINT}?q=${encodeURIComponent(city)}&limit=5&appid=${API_KEY}`;

    const response = await fetch(url);

    const locations = await response.json();

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error(
                'Invalid API key or API key not activated.'
            );
        }

        throw new Error(
            locations.message || 'Location search failed.'
        );
    }

    if (!locations || locations.length === 0) {
        throw new Error(
            'Location not found. Try village name with district and state.'
        );
    }

    // Prefer Indian locations
    const indianLocations = locations.filter(
        location => location.country === 'IN'
    );

    // Prefer Andhra Pradesh when matching results are available
    const andhraLocation = indianLocations.find(
        location =>
            location.state &&
            location.state.toLowerCase().includes('andhra')
    );

    const selectedLocation =
        andhraLocation ||
        indianLocations[0] ||
        locations[0];

    return selectedLocation;
}

// Fetch weather using latitude and longitude
async function fetchWeather(city) {

    setStatus('Searching location...');
    hideResult();

    // Step 1: Find village, town or city
    const location = await searchLocation(city);

    // Step 2: Get coordinates
    const latitude = location.lat;
    const longitude = location.lon;

    setStatus('Fetching weather information...');

    // Step 3: Fetch weather
    const url =
        `${WEATHER_ENDPOINT}?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`;

    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok) {

        if (response.status === 401) {
            throw new Error(
                'Invalid API key or API key not activated.'
            );
        }

        throw new Error(
            data.message || 'Unable to fetch weather.'
        );
    }

    // Keep searched location name
    data.searchedLocation = location;

    return data;
}

// Display weather information
function renderWeather(data) {

    const {
        name,
        sys,
        weather,
        main,
        wind,
        timezone
    } = data;

    const currentWeather = weather[0];

    // City name
    const location = data.searchedLocation;

    cityNameEl.textContent =
        `${location.name}, ${location.state ? location.state + ', ' : ''}${location.country}`;

    // Weather description
    descEl.textContent =
        currentWeather.description.replace(
            /\b\w/g,
            letter => letter.toUpperCase()
        );

    // Temperature
    tempEl.textContent =
        `${Math.round(main.temp)}°C`;

    // Weather icon
    iconEl.src = iconUrl(currentWeather.icon);

    iconEl.alt = currentWeather.description;

    // Humidity
    humidityEl.textContent =
        `${main.humidity}%`;

    // Wind speed
    windEl.textContent =
        `${wind.speed} m/s`;

    // Sunrise
    sunriseEl.textContent =
        formatTime(sys.sunrise, timezone);

    // Sunset
    sunsetEl.textContent =
        formatTime(sys.sunset, timezone);

    // Local time
    localTimeEl.textContent =
        cityLocalTime(timezone);

    // Dynamic background
    setWeatherBackground(
        currentWeather.main,
        currentWeather.icon
    );

    showResult();

    setStatus('Weather loaded successfully.');
}

// Search weather
async function doSearch() {

    const city = cityInput.value.trim();

    if (!city) {
        setStatus('Please enter a city, town or village name.', true);
        hideResult();
        return;
    }

    searchBtn.disabled = true;

    try {

        const data = await fetchWeather(city);

        renderWeather(data);

    } catch (error) {

        console.error('Weather Error:', error);

        setStatus(
            error.message || 'Failed to fetch weather.',
            true
        );

        hideResult();

    } finally {

        searchBtn.disabled = false;

    }
}

// Search button click
searchBtn.addEventListener('click', doSearch);

// Enter key search
cityInput.addEventListener('keydown', (event) => {

    if (event.key === 'Enter') {
        doSearch();
    }

});
