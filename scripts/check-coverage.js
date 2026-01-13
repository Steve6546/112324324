#!/usr/bin/env node

/**
 * Coverage Check Script
 * Ensures test coverage meets minimum thresholds
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COVERAGE_FILE = 'coverage/coverage-summary.json';
const THRESHOLDS = {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
  hooks: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
  components: {
    branches: 75,
    functions: 75,
    lines: 75,
    statements: 75,
  },
  lib: {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85,
  },
};

function loadCoverage() {
  try {
    const coveragePath = path.join(process.cwd(), COVERAGE_FILE);
    const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    return coverageData;
  } catch (error) {
    console.error('❌ Failed to load coverage data:', error.message);
    process.exit(1);
  }
}

function checkThresholds(coverage, thresholds, label) {
  const { branches, functions, lines, statements } = coverage.total;
  let passed = true;

  console.log(`\n📊 ${label} Coverage:`);
  console.log(`   Branches: ${branches.pct}% (required: ${thresholds.branches}%)`);
  console.log(`   Functions: ${functions.pct}% (required: ${thresholds.functions}%)`);
  console.log(`   Lines: ${lines.pct}% (required: ${thresholds.lines}%)`);
  console.log(`   Statements: ${statements.pct}% (required: ${thresholds.statements}%)`);

  if (branches.pct < thresholds.branches) {
    console.log(`❌ Branches coverage too low: ${branches.pct}% < ${thresholds.branches}%`);
    passed = false;
  }
  if (functions.pct < thresholds.functions) {
    console.log(`❌ Functions coverage too low: ${functions.pct}% < ${thresholds.functions}%`);
    passed = false;
  }
  if (lines.pct < thresholds.lines) {
    console.log(`❌ Lines coverage too low: ${lines.pct}% < ${thresholds.lines}%`);
    passed = false;
  }
  if (statements.pct < thresholds.statements) {
    console.log(`❌ Statements coverage too low: ${statements.pct}% < ${thresholds.statements}%`);
    passed = false;
  }

  if (passed) {
    console.log(`✅ ${label} coverage requirements met!`);
  }

  return passed;
}

function checkFileCoverage(coverage) {
  console.log('\n📁 Files with low coverage (< 50%):');

  Object.entries(coverage).forEach(([filePath, fileCoverage]) => {
    const { branches, functions, lines, statements } = fileCoverage;

    const avgCoverage = (branches.pct + functions.pct + lines.pct + statements.pct) / 4;

    if (avgCoverage < 50) {
      console.log(`   ⚠️  ${filePath}: ${avgCoverage.toFixed(1)}% average`);
    }
  });
}

function main() {
  console.log('🔍 Checking test coverage...\n');

  const coverage = loadCoverage();

  let allPassed = true;

  // Check global thresholds
  allPassed &= checkThresholds(coverage, THRESHOLDS.global, 'Global');

  // Check specific directory thresholds
  const hooksCoverage = {};
  const componentsCoverage = {};
  const libCoverage = {};

  Object.entries(coverage).forEach(([filePath, fileCoverage]) => {
    if (filePath.includes('/hooks/')) {
      Object.assign(hooksCoverage, { [filePath]: fileCoverage });
    } else if (filePath.includes('/components/')) {
      Object.assign(componentsCoverage, { [filePath]: fileCoverage });
    } else if (filePath.includes('/lib/')) {
      Object.assign(libCoverage, { [filePath]: fileCoverage });
    }
  });

  // Calculate directory totals (simplified)
  if (Object.keys(hooksCoverage).length > 0) {
    allPassed &= checkThresholds(
      { total: calculateDirectoryTotal(hooksCoverage) },
      THRESHOLDS.hooks,
      'Hooks'
    );
  }

  if (Object.keys(componentsCoverage).length > 0) {
    allPassed &= checkThresholds(
      { total: calculateDirectoryTotal(componentsCoverage) },
      THRESHOLDS.components,
      'Components'
    );
  }

  if (Object.keys(libCoverage).length > 0) {
    allPassed &= checkThresholds(
      { total: calculateDirectoryTotal(libCoverage) },
      THRESHOLDS.lib,
      'Library'
    );
  }

  // Check for files with low coverage
  checkFileCoverage(coverage);

  if (allPassed) {
    console.log('\n🎉 All coverage requirements met!');
    process.exit(0);
  } else {
    console.log('\n💥 Coverage requirements not met!');
    console.log('💡 Run "npm run test:coverage" to see detailed coverage report');
    process.exit(1);
  }
}

function calculateDirectoryTotal(fileCoverages) {
  const totals = {
    branches: { covered: 0, total: 0, pct: 0 },
    functions: { covered: 0, total: 0, pct: 0 },
    lines: { covered: 0, total: 0, pct: 0 },
    statements: { covered: 0, total: 0, pct: 0 },
  };

  Object.values(fileCoverages).forEach((fileCoverage) => {
    ['branches', 'functions', 'lines', 'statements'].forEach((metric) => {
      totals[metric].covered += fileCoverage[metric].covered;
      totals[metric].total += fileCoverage[metric].total;
    });
  });

  Object.keys(totals).forEach((metric) => {
    const { covered, total } = totals[metric];
    totals[metric].pct = total > 0 ? (covered / total) * 100 : 0;
  });

  return totals;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}