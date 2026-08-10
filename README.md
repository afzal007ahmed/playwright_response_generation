# Rental Cars Reservation API Testing Framework

A data-driven API testing suite powered by Playwright. It allows you to execute reservation payloads from **JSON**, **CSV**, or **Excel (`.xlsx`)** files and automatically records responses.

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
# Target API URL (e.g. your reservation endpoint)
URL=http://localhost:3000/reservations

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

## 📁 Supported Test Data Formats

You can use any of the following formats by changing `FILE_PATH` in `.env`:

### 1. JSON (`.json`)
```json
[
  {
    "id": "TC_RESERVATION_001",
    "payload": {
      "vehicleId": "v-101",
      "startDate": "2026-08-10",
      "endDate": "2026-08-15"
    }
  }
]
```

### 2. CSV (`.csv`)
```csv
id,payload
TC_RESERVATION_001,"{""vehicleId"": ""v-101"", ""startDate"": ""2026-08-10"", ""endDate"": ""2026-08-15""}"
```

### 3. Excel (`.xlsx` / `.xls`)
A spreadsheet with headers `id` and `payload`:

| id | payload |
|---|---|
| `TC_RESERVATION_001` | `{"vehicleId": "v-101", "startDate": "2026-08-10", "endDate": "2026-08-15"}` |

---

## 📊 Output

All successful responses are automatically formatted and stored in:
* `passed_responses.json`
