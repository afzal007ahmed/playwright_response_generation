import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import config from './config';
import { loadAndValidateTestCases } from './dataLoader';

try {
  const PASSED_RESPONSES_FILE = path.join(__dirname, 'passed_responses.json');

  // Initialize or empty the file at the start of the test run
  if (fs.existsSync(PASSED_RESPONSES_FILE)) {
    fs.unlinkSync(PASSED_RESPONSES_FILE);
  }

  // Load and validate test cases dynamically from the configured file path
  const testcases = loadAndValidateTestCases(config.filePath);

  for (const tc of testcases) {
    test.describe(tc.id, () => {
      test('Execute API request', async ({ request }) => {
        try {
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': config.authToken || '',
          };

          // Execute request using configured URL and the test case payload
          const response = await request.post(config.url, {
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
            url: config.url,
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
        } catch (error) {
          console.error(`Error executing test case ${tc.id}:`, error);
          throw error;
        }
      });
    });
  }
} catch (error) {
  console.error('Fatal error in main test setup:', error);
}
