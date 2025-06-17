#!/bin/bash

# Script to validate coverage exclusions are working correctly
echo "🔍 Validating coverage exclusions..."

# Check if __tests__ directory files are in coverage report
if grep -q "__tests__" coverage/lcov.info 2>/dev/null; then
    echo "❌ ERROR: Test files found in coverage report!"
    echo "Files found:"
    grep "SF:.*__tests__" coverage/lcov.info || true
    exit 1
else
    echo "✅ No test files found in coverage report"
fi

# Check if test.ts/tsx files are in coverage report
if grep -q "\.test\." coverage/lcov.info 2>/dev/null; then
    echo "❌ ERROR: .test. files found in coverage report!"
    echo "Files found:"
    grep "SF:.*\.test\." coverage/lcov.info || true
    exit 1
else
    echo "✅ No .test. files found in coverage report"
fi

# Check if spec.ts/tsx files are in coverage report
if grep -q "\.spec\." coverage/lcov.info 2>/dev/null; then
    echo "❌ ERROR: .spec. files found in coverage report!"
    echo "Files found:"
    grep "SF:.*\.spec\." coverage/lcov.info || true
    exit 1
else
    echo "✅ No .spec. files found in coverage report"
fi

echo ""
echo "📊 Coverage report summary:"
echo "Source files included in coverage:"
grep "^SF:" coverage/lcov.info | sed 's/SF:/  - /' | head -10
if [ $(grep -c "^SF:" coverage/lcov.info) -gt 10 ]; then
    echo "  ... and $(( $(grep -c "^SF:" coverage/lcov.info) - 10 )) more files"
fi

echo ""
echo "✅ Coverage exclusions validation passed!"
