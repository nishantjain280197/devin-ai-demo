# Testing Documentation

This document describes how to test the Insurance Weather Services application and includes the results from end-to-end testing.

## Table of Contents

- [Test Environment](#test-environment)
- [How to Run Tests](#how-to-run-tests)
- [Test Plan](#test-plan)
  - [Test 1: Page Load & Visit Counter](#test-1-page-load--visit-counter)
  - [Test 2: Address Search](#test-2-address-search)
  - [Test 3: City & State Search](#test-3-city--state-search)
  - [Test 4: ZIP Code Search](#test-4-zip-code-search)
  - [Test 5: Recent Searches Re-run](#test-5-recent-searches-re-run)
  - [Test 6: Input Validation](#test-6-input-validation)
- [Risk Assessment Verification](#risk-assessment-verification)
- [Test Results](#test-results)
- [Known Limitations](#known-limitations)

---

## Test Environment

- **Type**: Static web application — no build step, backend, or API keys required
- **Run locally**: Open `index.html` directly in a browser via `file://` protocol, or serve with any static server
- **Browser tested**: Chrome (latest)
- **APIs**: All external APIs (Open-Meteo, Nominatim) are free and public — no authentication needed

## How to Run Tests

All tests are manual and performed via browser interaction. There is no automated test framework since the app is a single-page static site with no build system.

### Pre-Test Setup

Before running tests, clear the app's stored data for a clean state:

1. Open `index.html` in Chrome
2. Open the browser console (F12 or Ctrl+Shift+J)
3. Run: `localStorage.clear(); location.reload();`
4. The page will reload with visit counter at 1 and no recent searches

### Running Through the Test Plan

Follow each test case below in order. Each test builds on the previous one (e.g., Test 5 requires searches from Tests 2-4 to exist in recent searches).

---

## Test Plan

### Test 1: Page Load & Visit Counter

**Objective**: Verify the page loads correctly and the visit counter increments on each page load.

**Steps**:
1. Clear localStorage (see Pre-Test Setup above)
2. Verify the page loads with all UI elements
3. Note the visit counter value (should be 1)
4. Refresh the page (F5)
5. Note the visit counter value again (should be 2)

**Pass Criteria**:
- Header displays "Insurance Weather Services" with tagline "Wind & Hail Risk Assessment for Any U.S. Location"
- Three badge indicators visible: "U.S. Coverage", "Historical Data", "Risk Analysis"
- Three search tabs visible: "Address" (active by default, blue), "City & State", "ZIP Code"
- Address input field shows placeholder text "e.g., 1600 Pennsylvania Ave, Washington, DC"
- Date input defaults to today's date
- Visit counter badge appears in the top-right corner showing current count
- After refresh, visit counter increments by exactly 1 (e.g., 1 becomes 2)
- "Recent Searches" section displays "No recent searches yet. Try searching for a location above!"
- Footer shows copyright and API attribution links (Open-Meteo, OpenStreetMap Nominatim, Leaflet)

---

### Test 2: Address Search

**Objective**: Verify searching by full address returns correct weather data, renders all result sections, and updates the map.

**Steps**:
1. In the "Address" tab, type a known U.S. city (e.g., "Chicago, Illinois")
2. Set the date to a past date (e.g., 10 days ago) to use the historical/archive API
3. Click "Check Weather Conditions"
4. Wait for results to load

**Pass Criteria**:
- A loading spinner/overlay appears while fetching data
- **Location header**: Displays a name containing "Chicago" and "Illinois" with "United States"
- **Coordinates**: Shows numeric latitude (~41.8°N) and longitude (~-87.6°W)
- **Date**: Displays the formatted date (e.g., "Sunday, May 10, 2026")
- **Wind Conditions card**:
  - Maximum wind speed in X.X mph format (numeric, not "--")
  - Gusts in X.X mph format
  - Direction as a degree value (0–360°)
  - Risk indicator bar with color fill
  - Risk label: one of "Low Risk", "Moderate Risk", "High Risk", or "Severe Risk"
- **Hail Conditions card**:
  - Total precipitation in X.XX in format
  - Snowfall in X.XX in format
  - Showers in X.XX in format
  - Risk indicator bar with appropriate label
- **Additional Details card**:
  - High temperature in °F (numeric, not "--")
  - Low temperature in °F
  - Humidity percentage
  - Weather description text (e.g., "Overcast", "Clear sky", "Moderate drizzle")
- **Hourly Wind Speed chart**: 24 bars (one per hour, labeled 0–23) with numeric values displayed above each bar
- **Map**: Google Maps embed loaded, centered on the searched location with a pin marker
- **Recent Searches**: A new entry appears with the location name, date, and wind speed

---

### Test 3: City & State Search

**Objective**: Verify the City & State tab works correctly with separate input fields.

**Steps**:
1. Click the "City & State" tab
2. Verify the UI changes to show separate City and State input fields
3. Type "Miami" in the City field and "Florida" in the State field
4. Click "Check Weather Conditions"

**Pass Criteria**:
- "City & State" tab button turns active (blue background), "Address" tab becomes inactive
- Address input is hidden; City and State inputs are visible with placeholder text
- Results load successfully with location containing "Miami" and "Florida"
- Coordinates show latitude ~25.7°N (southern Florida)
- Map updates to show the Miami area
- Recent Searches now shows 2 entries (Miami and Chicago from Test 2)

---

### Test 4: ZIP Code Search

**Objective**: Verify searching by ZIP code resolves to the correct location.

**Steps**:
1. Click the "ZIP Code" tab
2. Verify a single ZIP input field is visible
3. Type "90210"
4. Click "Check Weather Conditions"

**Pass Criteria**:
- "ZIP Code" tab button turns active
- Single input field with placeholder "e.g., 73301"
- Results show location containing "Los Angeles" or "Beverly Hills" in California
- Coordinates show latitude ~34.0°N, longitude ~-118.4°W
- Map updates to the Los Angeles area
- Recent Searches now shows 3 entries

---

### Test 5: Recent Searches Re-run

**Objective**: Verify that clicking a recent search entry re-runs that search with correct data.

**Steps**:
1. Scroll down to the "Recent Searches" section
2. Verify 3 entries are listed (from Tests 2, 3, 4) in reverse chronological order
3. Click on one of the entries (e.g., the Chicago entry)

**Pass Criteria**:
- Recent searches list shows entries in reverse chronological order (most recent first)
- Each entry displays: location name (truncated), date, and wind speed in mph
- Clicking an entry:
  - Switches to the "Address" tab
  - Populates the address input with the full location name
  - Sets the date to the date from the recent search
  - Triggers a new search and displays results matching the original search data
  - Map updates to the clicked location

---

### Test 6: Input Validation

**Objective**: Verify that the app shows appropriate validation errors for invalid input.

**Test Cases**:

| Input | Tab | Expected Alert Message |
|-------|-----|----------------------|
| Empty address field | Address | "Please enter an address." |
| Empty city field | City & State | "Please enter a city name." |
| Empty ZIP field | ZIP Code | "Please enter a ZIP code." |
| Invalid ZIP (e.g., "abc") | ZIP Code | "Please enter a valid US ZIP code." |
| Empty date field | Any | "Please select a date." |

**Steps**:
1. On the Address tab, clear the input field and click "Check Weather Conditions"
2. Verify an alert dialog appears with the message "Please enter an address."
3. Dismiss the alert and confirm no results are shown and no errors in the console

**Pass Criteria**:
- Alert dialog appears with the exact expected message for each case
- No JavaScript errors in the console
- Previous results (if any) remain unchanged
- The app remains functional after dismissing the alert

---

## Risk Assessment Verification

To verify risk level thresholds are correctly applied, you can search for locations and dates known to have specific weather conditions:

### Wind Risk Thresholds

| Risk Level | Wind Speed Range | CSS Class | Color |
|------------|-----------------|-----------|-------|
| Low | < 25 mph | `risk-low` | Green (#0d904f) |
| Moderate | 25 – 40 mph | `risk-moderate` | Yellow (#f9a825) |
| High | 40 – 58 mph | `risk-high` | Orange (#ff6d00) |
| Severe | 58+ mph | `risk-severe` | Red (#d93025) |

### Hail Risk Conditions

| Risk Level | Trigger Condition | Weather Code |
|------------|------------------|--------------|
| Severe | Heavy hail reported | 99 |
| High | Slight hail reported | 96 |
| Moderate | Thunderstorm + precipitation > 0.5 in | 95, 96, or 99 |
| Moderate | Precipitation > 1.0 in OR snowfall > 0.5 in | Any |
| Low | Precipitation 0.25 – 1.0 in | Any |
| Low (Minimal) | Precipitation ≤ 0.25 in | Any |

### Hourly Chart Color Coding

The hourly wind speed chart bars are color-coded using the same wind risk thresholds above. Each bar represents one hour (0:00 – 23:00) and the color reflects the risk level for that hour's wind speed.

---

## Test Results

**Date**: May 20, 2026
**Tester**: Devin (AI)
**Method**: Manual end-to-end testing in Chrome via `file://` protocol

### Summary

| # | Test | Result |
|---|------|--------|
| 1 | Page Load & Visit Counter | Passed |
| 2 | Address Search (Chicago, IL — May 10, 2026) | Passed |
| 3 | City & State Search (Miami, FL — May 10, 2026) | Passed |
| 4 | ZIP Code Search (90210 — May 10, 2026) | Passed |
| 5 | Recent Searches Re-run | Passed |
| 6 | Input Validation (empty address) | Passed |

### Detailed Results

**Test 1 — Page Load & Visit Counter**: Visit counter started at 1 after clearing localStorage. After page refresh, counter incremented to exactly 2. All UI elements (header, tabs, date input, footer) rendered correctly. "No recent searches yet" message displayed.

**Test 2 — Address Search (Chicago, IL)**:
- Location: "Chicago, South Chicago Township, Cook County, Illinois, United States"
- Coordinates: 41.8756°N, -87.6244°W
- Wind: 8.8 mph max, 24.6 mph gusts, 75° direction — "Low Risk"
- Hail: 0.00 in precipitation — "Low Risk - Minimal Precipitation"
- Temperature: 59°F high, 46°F low, 47% humidity — "Overcast"
- Hourly chart: 24 bars rendered (hours 0–23) with values ranging 1.5–8.8 mph
- Map: Centered on Chicago with marker and popup showing "Wind: 8.8 mph Precip: 0.00 in"

**Test 3 — City & State Search (Miami, FL)**:
- Location: "Miami, Miami-Dade County, Florida, United States"
- Coordinates: 25.7742°N, -80.1936°W
- Wind: 11.2 mph — "Low Risk"
- Precipitation: 0.07 in — "Low Risk - Minimal Precipitation"
- Temperature: 89°F high, 78°F low — "Moderate drizzle"
- Map updated to Miami area

**Test 4 — ZIP Code Search (90210)**:
- Location: "90210, Los Angeles, Los Angeles County, California, United States"
- Coordinates: 34.0939°N, -118.4113°W
- Wind: 5.7 mph — "Low Risk"
- Temperature: 80°F high, 55°F low — "Overcast"
- Map updated to LA area

**Test 5 — Recent Searches Re-run**: Clicked Chicago entry from recent searches. Results reloaded with matching data (8.8 mph wind, 59°F). Address input auto-populated with full location name. Tab switched to Address mode.

**Test 6 — Input Validation**: Cleared address input and clicked search. Alert dialog appeared with "Please enter an address." No crash, app remained functional.

---

## Known Limitations

- **Nominatim rate limiting**: The geocoding API may rate-limit requests if searches are performed too rapidly. Wait a few seconds between consecutive searches if you encounter "Location not found" errors.
- **Map tile loading**: OpenStreetMap tiles may load slowly on poor network connections. The map will appear gray until tiles finish loading.
- **localStorage dependency**: The visit counter and recent searches require localStorage to be available. Features won't work in some privacy/incognito modes that block localStorage.
- **Date range constraints**: The date picker is limited to 2 years in the past and 7 days in the future. The archive API handles historical dates; the forecast API handles future dates.
- **U.S. locations only**: The geocoding query appends "USA" and restricts results to the `us` country code. Non-U.S. locations are not supported.
- **Weather code coverage**: Hail detection relies on specific WMO weather codes (96, 99). If the weather service reports hail through a different code, it won't be detected as hail risk.
