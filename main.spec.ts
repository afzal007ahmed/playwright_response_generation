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
  test.describe(tc.name, () => {
    test('Run and save response if successful', async ({ request }) => {
      let payload = { ...tc.payload };

      // 1. Dynamic checkout/lock acquisition if endpoint is bookings
      if (tc.endpoint === '/bookings') {
        const checkoutUrl = `/checkout/${tc.payload.locationId}/${tc.payload.vehicleId}`;
        const checkoutResponse = await request.get(checkoutUrl, {
          headers: tc.headers,
          params: {
            start_date: tc.payload.startDate,
            to_date: tc.payload.toDate,
            start_time: tc.payload.start_time,
            end_time: tc.payload.end_time,
          },
        });

        // Assert that the checkout request was successful
        expect(checkoutResponse).toBeOK();
        const checkoutData = await checkoutResponse.json();

        // Inject the dynamically acquired lock key
        payload.lock_key = checkoutData.lock_key;
      }

      // 2. Send request.post to finalize booking / GraphQL query
      const response = await request.post(tc.endpoint, {
        headers: tc.headers,
        data: payload,
      });

      // 3. Expect to check if response is OK (2xx status code)
      expect(response).toBeOK();

      // 4. Extract the response body
      const responseBody = await response.json();

      // 5. GraphQL Error handling:
      // Even if a GraphQL query fails, the server returns 200 OK.
      // We must explicitly assert that there are no "errors" in the response body.
      if (responseBody && responseBody.errors && responseBody.errors.length > 0) {
        throw new Error(`GraphQL Error: ${JSON.stringify(responseBody.errors, null, 2)}`);
      }

      // 6. Store the passed response to passed_responses.json
      const passedRecord = {
        testId: tc.id,
        testName: tc.name,
        endpoint: tc.endpoint,
        payload: payload,
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
