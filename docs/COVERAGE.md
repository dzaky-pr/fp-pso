# Coverage Configuration untuk SonarCloud

## Overview

Project ini telah dikonfigurasi untuk memberikan coverage report yang optimal untuk SonarCloud dengan menghilangkan file-file yang tidak perlu dianalisis seperti:

- Development files (`server.js`, `local-lambda.js`)
- Terraform infrastructure files
- Shared utilities yang tidak perlu ditest
- Config files
- Static assets

## Scripts Coverage

### 1. Local Development

```bash
npm run test:coverage
```

Generate coverage report lengkap untuk development

### 2. CI/CD Pipeline

```bash
npm run test:coverage:ci
```

Generate coverage report silent untuk CI/CD

### 3. SonarCloud Optimized

```bash
npm run test:coverage:sonar
```

Generate coverage report yang sudah dioptimasi untuk SonarCloud

## Coverage Thresholds

Thresholds yang ditetapkan realistis berdasarkan jenis file:

- **Global**: 30% branches, 35% functions, 40% lines, 40% statements
- **Components**: 40% branches, 50% functions, 50% lines, 50% statements
- **Actions**: 9% branches, 25% functions, 25% lines, 30% statements
- **App Pages**: 30% branches, 35% functions, 40% lines, 40% statements

## Files yang Dikecualikan dari Coverage

### Jest Configuration

- `/shared/**` - Utility functions yang digunakan di server
- `/terraform/**` - Infrastructure as Code files
- `server.js` - Development server
- `local-lambda.js` - Local development Lambda
- Config files (`*.config.js`, `*.config.ts`, dll)
- Static assets (`app/globals.css`, `app/favicon.ico`)

### SonarCloud Configuration

File yang sama dikecualikan di `sonar-project.properties` untuk konsistensi.

## Hasil Coverage

Dengan konfigurasi ini, coverage report akan fokus pada:

- ✅ React Components (`components/**`)
- ✅ Next.js Pages (`app/**`)
- ✅ Business Logic (`actions/**`)

Dan mengabaikan:

- ❌ Infrastructure files
- ❌ Development utilities
- ❌ Config files
- ❌ Test files itu sendiri

## SonarCloud Integration

Coverage report akan dikirim ke SonarCloud melalui:

- **LCOV Report**: `./coverage/lcov.info`
- **Exclusions**: Sesuai dengan Jest configuration
- **Quality Gate**: Akan menunggu hasil analisis

## Troubleshooting

Jika coverage terlalu rendah:

1. Tambah tests untuk file yang belum ditest
2. Sesuaikan threshold di `jest.config.js` jika perlu
3. Pastikan file yang dikecualikan sudah benar

Jika file tidak seharusnya masuk coverage:

1. Tambahkan pattern ke `collectCoverageFrom` di Jest
2. Tambahkan ke `sonar.coverage.exclusions` di SonarCloud
