#!/bin/bash

# Script untuk generate coverage report yang optimized untuk SonarCloud
# Hanya test file yang memang ada testnya

echo "🧪 Running tests with coverage for SonarCloud..."

# Clean previous coverage
rm -rf coverage

# Run tests dengan coverage hanya untuk file yang ada testnya
npm test -- --coverage --watchAll=false --silent --collectCoverageFrom='["<rootDir>/components/**/*.{ts,tsx}","<rootDir>/app/**/*.{ts,tsx}","<rootDir>/actions/**/*.{ts,tsx}","!**/*.d.ts","!**/*.test.{ts,tsx}","!**/__tests__/**","!<rootDir>/app/layout.tsx","!<rootDir>/app/globals.css","!<rootDir>/app/favicon.ico"]'

if [ $? -eq 0 ]; then
    echo "✅ Coverage report generated successfully!"
    echo "📊 Coverage files:"
    ls -la coverage/
    echo ""
    echo "📝 LCOV report path: ./coverage/lcov.info"
    echo "🌐 HTML report: ./coverage/lcov-report/index.html"
else
    echo "❌ Coverage generation failed!"
    exit 1
fi
