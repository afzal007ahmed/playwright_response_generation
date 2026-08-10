# Rental Cars API Testing Framework (REST & GraphQL)

A data-driven API testing suite powered by Playwright. It allows you to execute REST or **GraphQL** payloads from **JSON**, **CSV**, or **Excel (`.xlsx`)** files and automatically records responses.

---

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the sample environment file:
```bash
cp .env.sample .env
```

Open `.env` and set your configuration:
```env
# Target API URL (e.g. your GraphQL endpoint http://localhost:3000/graphql or REST endpoint)
URL=http://localhost:3000/graphql

# Bearer / Auth Token (optional)
AUTH_TOKEN=your_auth_token_here

# Path to test cases file (.json, .csv, or .xlsx)
FILE_PATH=./sample_testcases.json
```

### 4. Run the Tests
You can run either command (both work identically):
```bash
npm test
```
*or*
```bash
npm run test
```

---

## 📁 Supported Test Data Formats (GraphQL & REST)

You can use any of the following formats by changing `FILE_PATH` in `.env`:

### 1. JSON (`.json`)
```json
[
  {
    "id": "TC_GQL_001",
    "payload": {
      "query": "query GetAllLocations { locations { id name city state } }"
    }
  },
  {
    "id": "TC_GQL_002",
    "payload": {
      "query": "query GetVehiclesByLocation($locationId: ID!, $startDate: String!, $toDate: String!) { vehiclesAtLocation(locationId: $locationId, startDate: $startDate, toDate: $toDate) { id model availableUnits } }",
      "variables": {
        "locationId": "loc-101",
        "startDate": "2026-09-01",
        "toDate": "2026-09-05"
      }
    }
  }
]
```

### 2. CSV (`.csv`)
```csv
id,payload
TC_GQL_001,"{""query"": ""query GetAllLocations { locations { id name city state } }""}"
TC_GQL_002,"{""query"": ""query GetVehiclesByLocation($locationId: ID!, $startDate: String!, $toDate: String!) { vehiclesAtLocation(locationId: $locationId, startDate: $startDate, toDate: $toDate) { id model availableUnits } }"", ""variables"": {""locationId"": ""loc-101"", ""startDate"": ""2026-09-01"", ""toDate"": ""2026-09-05""}}"
```

### 3. Excel (`.xlsx` / `.xls`)
A spreadsheet with headers `id` and `payload`:

| id | payload |
|---|---|
| `TC_GQL_001` | `{"query": "query GetAllLocations { locations { id name city state } }"}` |
| `TC_GQL_002` | `{"query": "query GetVehiclesByLocation($locationId: ID!) { vehiclesAtLocation(locationId: $locationId) { id model } }", "variables": {"locationId": "loc-101"}}` |

---

## 📊 Output

All test run outputs are automatically recorded in:
* `passed_responses.json`: Stores all successful API responses with test IDs and payloads.
* `failed_responses.json`: Stores all failed requests (HTTP errors, GraphQL errors, network errors) with test IDs, payloads, status codes, and error details.
