import { Reporter, FullConfig, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

export default class CustomReporter implements Reporter {
  private passedFile = path.join(__dirname, 'passed_responses.json');
  private failedFile = path.join(__dirname, 'failed_responses.json');

  onBegin(config: FullConfig, suite: Suite) {
    console.log('Custom Reporter: Test suite execution started.');

    // 1. Delete the files if they already exist
    if (fs.existsSync(this.passedFile)) {
      fs.unlinkSync(this.passedFile);
    }
    if (fs.existsSync(this.failedFile)) {
      fs.unlinkSync(this.failedFile);
    }

    // 2. Create the new clean files with empty JSON arrays
    fs.writeFileSync(this.passedFile, '[]', 'utf8');
    fs.writeFileSync(this.failedFile, '[]', 'utf8');
  }

  onTestBegin(test: TestCase) {
    console.log(`Test case started: ${test.title}`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const attachment = result.attachments.find(a => a.name === 'testResult');
    if (attachment && attachment.body) {
      try {
        const record = JSON.parse(attachment.body.toString());
        const targetFile = record.isFailed ? this.failedFile : this.passedFile;

        // Read, parse, push, and write back synchronously
        const existingData = fs.readFileSync(targetFile, 'utf8');
        const list = JSON.parse(existingData);
        list.push(record);
        fs.writeFileSync(targetFile, JSON.stringify(list, null, 2), 'utf8');

        console.log(`Recorded result for: ${test.parent?.title || test.title}`);
      } catch (e) {
        console.error(`Error writing test result for ${test.title}:`, e);
      }
    }
  }

  onEnd() {
    console.log('Custom Reporter: Test suite execution finished. All results have been written.');
  }
}
