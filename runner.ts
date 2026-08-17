import got from 'got';
import pLimit from 'p-limit';
import * as fs from 'fs';
import * as path from 'path';
import config from './config';
import { loadAndValidateTestCases, TestCase } from './dataLoader';

interface TestResult {
  isFailed: boolean;
  testId: string;
  url: string;
  payload: any;
  status: number | null;
  response?: any;
  error?: any;
  timestamp: string;
}

// 1. Make paths for passed and failed files
const PASSED_FILE = path.join(__dirname, 'passed_responses.json');
const FAILED_FILE = path.join(__dirname, 'failed_responses.json');

// Initialize/Reset files to empty arrays
fs.writeFileSync(PASSED_FILE, '[]', 'utf8');
fs.writeFileSync(FAILED_FILE, '[]', 'utf8');

// 2. Configure limit (default to 10 concurrent requests)
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '10', 10);
const limit = pLimit(CONCURRENCY);

// 3. Configure got with 3 retries
const client = got.extend({
  retry: {
    limit: 3,
    methods: ['POST'], // Explicitly enable retries for POST requests
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
    errorCodes: [
      'ETIMEDOUT',
      'ECONNRESET',
      'EADDRINUSE',
      'ECONNREFUSED',
      'EPIPE',
      'ENOTFOUND',
      'ENETUNREACH',
      'EAI_AGAIN'
    ],
  },
  // Don't throw errors on non-2xx status codes so we can capture status code and body
  throwHttpErrors: false,
  timeout: {
    request: 10000, // 10s request timeout
  }
});

// 4. Helper function to execute a single test case using got
async function executeTestCase(tc: TestCase): Promise<TestResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.authToken) {
    headers['Authorization'] = config.authToken.startsWith('Bearer ')
      ? config.authToken
      : `Bearer ${config.authToken}`;
  }

  const timestamp = new Date().toISOString();
  let statusCode: number | null = null;
  let responseBody: any = null;

  try {
    const response = await client.post(config.url, {
      headers,
      body: JSON.stringify(tc.payload),
    });

    statusCode = response.statusCode;

    try {
      responseBody = JSON.parse(response.body);
    } catch {
      responseBody = response.body;
    }

    // 1. Verify HTTP status is 2xx
    const isOk = statusCode >= 200 && statusCode < 300;
    if (!isOk) {
      throw new Error(`HTTP Error ${statusCode}: ${typeof responseBody === 'object' ? JSON.stringify(responseBody) : responseBody}`);
    }

    // 2. Verify GraphQL errors key (if GraphQL error returned inside 200 OK)
    if (responseBody && typeof responseBody === 'object' && Array.isArray(responseBody.errors) && responseBody.errors.length > 0) {
      throw new Error(`GraphQL Error: ${JSON.stringify(responseBody.errors, null, 2)}`);
    }

    return {
      isFailed: false,
      testId: tc.id,
      url: config.url,
      payload: tc.payload,
      status: statusCode,
      response: responseBody,
      timestamp,
    };
  } catch (error: any) {
    return {
      isFailed: true,
      testId: tc.id,
      url: config.url,
      payload: tc.payload,
      status: statusCode,
      error: responseBody?.errors || responseBody || error.message,
      timestamp,
    };
  }
}
async function run() {
  try {
    console.log('Loading and validating test cases...');
    const testcases = loadAndValidateTestCases(config.filePath);
    console.log(`Loaded ${testcases.length} test cases.`);

    const passedResults: TestResult[] = [];
    const failedResults: TestResult[] = [];

    // 5. Each callback returns the limit wrapper wrapping our async call
    const tasks = testcases.map((tc) => {
      return limit(async () => {
        // 6. Before api call, print starting message
        console.log(`[START] Executing test case: ${tc.id}`);

        const result = await executeTestCase(tc);

        // 6. Print passed/failed log & 7. Push directly to correct array (Approach A)
        if (result.isFailed) {
          console.log(`[FAILED] Test case: ${tc.id}`);
          failedResults.push(result);
        } else {
          console.log(`[PASSED] Test case: ${tc.id}`);
          passedResults.push(result);
        }

        return result;
      });
    });

    console.log(`Starting parallel execution with concurrency limit of ${CONCURRENCY}...`);

    // 8. Wait for all to settle and write
    await Promise.allSettled(tasks);

    fs.writeFileSync(PASSED_FILE, JSON.stringify(passedResults, null, 2), 'utf8');
    fs.writeFileSync(FAILED_FILE, JSON.stringify(failedResults, null, 2), 'utf8');

    console.log('\n======================================');
    console.log('Test execution completed!');
    console.log(`Total Cases: ${testcases.length}`);
    console.log(`Passed:      ${passedResults.length}`);
    console.log(`Failed:      ${failedResults.length}`);
    console.log('======================================');
  } catch (error) {
    console.error('Fatal execution error:', error);
  }
}

run();

