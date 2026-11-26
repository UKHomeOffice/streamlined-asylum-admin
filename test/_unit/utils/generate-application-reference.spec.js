'use strict';

const { execFileSync } = require('node:child_process');

describe('generateApplicationReference', () => {
  test('generates COC- references with ten uppercase alphanumeric characters without HOF', () => {
    const script = `
      const generateApplicationReference = require('./utils/generate-application-reference');
      (async () => {
        const references = await Promise.all(
          Array.from({ length: 50 }, () => generateApplicationReference())
        );
        process.stdout.write(JSON.stringify(references));
      })().catch(error => { console.error(error); process.exitCode = 1; });
    `;
    const references = JSON.parse(execFileSync(process.execPath, ['-e', script], {
      cwd: process.cwd(),
      encoding: 'utf8'
    }));

    expect(references).toHaveLength(50);
    references.forEach(reference => {
      expect(reference).toMatch(/^COC-[A-Z0-9]{10}$/);
    });
  });
});
