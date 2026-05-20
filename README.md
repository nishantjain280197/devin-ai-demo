# Insurance Weather Services

An interactive web application for checking **wind and hail weather conditions** at any U.S. location. Built for insurance professionals and anyone who needs quick, reliable weather risk assessments.

## Features

- **Multi-Mode Location Search** — Search by full address, city & state, or ZIP code
- **Wind Condition Reports** — Maximum wind speed, gusts, direction with risk assessment (Low / Moderate / High / Severe)
- **Hail & Precipitation Analysis** — Total precipitation, snowfall, showers with hail risk detection based on weather codes
- **Interactive Map** — Pins the searched location on an OpenStreetMap-powered map with a popup showing wind and precipitation summary
- **Hourly Wind Speed Chart** — Visual bar chart showing wind speed for each hour of the selected date, color-coded by risk level
- **Additional Weather Details** — High/low temperature, humidity, weather description
- **Page Visit Counter** — Tracks how many times a user has visited the page (persisted via localStorage)
- **Recent Searches** — Saves the last 10 searches with one-click re-run capability
- **Responsive Design** — Works on desktop and mobile browsers

## Quick Start

No build step, server, or API keys required. Just open the file in a browser:

```bash
# Clone the repository
git clone https://github.com/nishantjain280197/devin-ai-demo.git
cd devin-ai-demo

# Open in your default browser
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows
```

Or simply double-click `index.html` in your file manager.

You can also serve it with any static server:

```bash
# Python
python3 -m http.server 8080

# Node.js (npx)
npx serve .
```

Then visit `http://localhost:8080`.

## How to Use

1. **Select a search mode** — Click one of the three tabs: **Address**, **City & State**, or **ZIP Code**
2. **Enter a location** — Type an address, city/state combination, or 5-digit ZIP code
3. **Pick a date** — Select a date within the allowed range (up to 2 years in the past or 7 days in the future)
4. **Click "Check Weather Conditions"** — The app will geocode the location, fetch weather data, and display results
5. **Review the results** — Wind conditions, hail/precipitation data, additional details, hourly chart, and map will appear
6. **Use recent searches** — Previously searched locations appear at the bottom and can be re-run with a single click

## Project Structure

```
devin-ai-demo/
├── index.html          # Main HTML page
├── css/
│   └── styles.css      # Styling (responsive, animations, risk-level colors)
├── js/
│   └── app.js          # Application logic (geocoding, weather API, chart, map)
├── TESTING.md          # Testing documentation and test results
└── README.md           # This file
```

## APIs Used

All APIs are **free** and require **no API keys**:

| API | Purpose | Documentation |
|-----|---------|--------------|
| [Open-Meteo](https://open-meteo.com/) | Weather data (historical + forecast) | [Docs](https://open-meteo.com/en/docs) |
| [Nominatim (OpenStreetMap)](https://nominatim.openstreetmap.org/) | Geocoding (address/city/ZIP to coordinates) | [Docs](https://nominatim.org/release-docs/latest/) |
| [Leaflet.js](https://leafletjs.com/) + OpenStreetMap tiles | Interactive mapping | [Docs](https://leafletjs.com/reference.html) |

### API Details

- **Historical weather** (past dates and today): `archive-api.open-meteo.com/v1/archive`
- **Forecast weather** (up to 7 days ahead): `api.open-meteo.com/v1/forecast`
- Weather parameters fetched: daily (wind speed, gusts, direction, temperature, precipitation, snowfall, showers, weather code) and hourly (wind speed, gusts, precipitation, humidity)
- All measurements use U.S. units: mph for wind, inches for precipitation, Fahrenheit for temperature

## Risk Assessment

### Wind Risk Levels

| Risk Level | Wind Speed (mph) | Description |
|------------|------------------|-------------|
| Low | < 25 | Minimal wind risk |
| Moderate | 25 – 40 | Potential for minor damage |
| High | 40 – 58 | Significant wind damage possible |
| Severe | 58+ | Destructive winds, major damage likely |

### Hail Risk Levels

| Risk Level | Condition |
|------------|-----------|
| Severe | Weather code 99 (thunderstorm with heavy hail) |
| High | Weather code 96 (thunderstorm with slight hail) |
| Moderate | Thunderstorm (code 95/96/99) with precipitation > 0.5 in, OR precipitation > 1.0 in, OR snowfall > 0.5 in |
| Low | Precipitation > 0.25 in (light precipitation) |
| Low (Minimal) | Precipitation ≤ 0.25 in |

## Technologies

- **HTML5** — Semantic markup
- **CSS3** — Custom properties, CSS Grid, animations, responsive design
- **Vanilla JavaScript** — No frameworks, ES6+ syntax
- **Leaflet.js v1.9.4** — Interactive mapping library
- **Font Awesome 6.5.1** — Icons
- **Inter** — Google Font for typography

## Browser Support

Works in all modern browsers:
- Chrome 80+
- Firefox 80+
- Safari 14+
- Edge 80+

## Data Storage

The app uses browser `localStorage` to persist:

| Key | Purpose | Format |
|-----|---------|--------|
| `iws_visit_count` | Page visit counter | Number (string) |
| `iws_recent_searches` | Recent search history (max 10) | JSON array of search objects |

No data is sent to any server. All storage is local to your browser.

## License

This project is open source. Weather data provided by [Open-Meteo](https://open-meteo.com/). Geocoding by [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/). Maps by [Leaflet](https://leafletjs.com/).
