import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import testcases from './rental_cars_backend_booking_testcases.json';

const PASSED_RESPONSES_FILE = path.join(__dirname, 'passed_responses.json');

// Initialize or empty the file at the start of the test run
if (fs.existsSync(PASSED_RESPONSES_FILE)) {
  fs.unlinkSync(PASSED_RESPONSES_FILE);
}

for (const tc of testcases) {
  test.describe(tc.id, () => {
    test('Execute API request', async ({ request }) => {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': tc.token || '',
      };

      // Execute request using only id, endpoint, and payload from the test case
      const response = await request.post(tc.endpoint, {
        headers,
        data: tc.payload,
      });

      // Check if response is OK (2xx status code)
      expect(response).toBeOK();

      // Extract the response body
      const responseBody = await response.json();

      // Store the passed response to passed_responses.json
      const passedRecord = {
        testId: tc.id,
        endpoint: tc.endpoint,
        payload: tc.payload,
        response: responseBody,
        timestamp: new Date().toISOString(),
      };

      // Read existing passed records or start a new array
      let passedData: any[] = [];
      if (fs.existsSync(PASSED_RESPONSES_FILE)) {
        try {
          passedData = JSON.parse(fs.readFileSync(PASSED_RESPONSES_FILE, 'utf8'));
        } catch (e) {
          passedData = [];
        }
      }
      
      passedData.push(passedRecord);
      fs.writeFileSync(PASSED_RESPONSES_FILE, JSON.stringify(passedData, null, 2), 'utf8');
    });
  });
}
