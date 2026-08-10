import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import config from './config';
import { loadAndValidateTestCases } from './dataLoader';

try {
  const PASSED_RESPONSES_FILE = path.join(__dirname, 'passed_responses.json');
  const FAILED_RESPONSES_FILE = path.join(__dirname, 'failed_responses.json');

  // Helper to record a result to a file
  function recordResult(filePath: string, record: any) {
    let list: any[] = [];
    if (fs.existsSync(filePath)) {
      try {
        list = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        list = [];
      }
    }
    list.push(record);
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf8');
  }

  // Initialize or empty the files at the start of the test run
  if (fs.existsSync(PASSED_RESPONSES_FILE)) {
    fs.unlinkSync(PASSED_RESPONSES_FILE);
  }
  if (fs.existsSync(FAILED_RESPONSES_FILE)) {
    fs.unlinkSync(FAILED_RESPONSES_FILE);
  }

  // Load and validate test cases dynamically from the configured file path
  const testcases = loadAndValidateTestCases(config.filePath);

  for (const tc of testcases) {
    test.describe(tc.id, () => {
      test('Execute API request', async ({ request }) => {
        let responseBody: any = null;
        let statusCode: number | null = null;

        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          if (config.authToken) {
            headers['Authorization'] = config.authToken.startsWith('Bearer ')
              ? config.authToken
              : `Bearer ${config.authToken}`;
          }

          // Execute request using configured URL and the test case payload
          const response = await request.post(config.url, {
            headers,
            data: tc.payload,
          });

          statusCode = response.status();

          // Extract response body (JSON or text)
          try {
            responseBody = await response.json();
          } catch {
            responseBody = await response.text();
          }

          // 1. Verify HTTP status is 2xx
          if (!response.ok()) {
            throw new Error(`HTTP Error ${statusCode}: ${typeof responseBody === 'object' ? JSON.stringify(responseBody) : responseBody}`);
          }

          // 2. Verify GraphQL errors key (if GraphQL error returned inside 200 OK)
          if (responseBody && typeof responseBody === 'object' && Array.isArray(responseBody.errors) && responseBody.errors.length > 0) {
            throw new Error(`GraphQL Error: ${JSON.stringify(responseBody.errors, null, 2)}`);
          }

          // Store passed response to passed_responses.json
          recordResult(PASSED_RESPONSES_FILE, {
            testId: tc.id,
            url: config.url,
            payload: tc.payload,
            status: statusCode,
            response: responseBody,
            timestamp: new Date().toISOString(),
          });
        } catch (error: any) {
          // Store failed error response and payload to failed_responses.json
          recordResult(FAILED_RESPONSES_FILE, {
            testId: tc.id,
            url: config.url,
            payload: tc.payload,
            status: statusCode,
            error: responseBody?.errors || responseBody || error.message,
            timestamp: new Date().toISOString(),
          });

          console.error(`Error executing test case ${tc.id}:`, error.message || error);
          throw error;
        }
      });
    });
  }
} catch (error) {
  console.error('Fatal error in main test setup:', error);
}
