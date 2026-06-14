# Test Backend

This document describes the test suite for the backend application.

## Overview

The backend test suite includes:

- **Unit Tests**: Test individual components in isolation (models, services, utilities)
- **Integration Tests**: Test API endpoints and component interactions
- **Coverage Reports**: Track code coverage metrics

## Test Structure

```
src/tests/
├── setup.ts                           # Test configuration and setup
├── unit/                              # Unit tests
│   ├── User.model.test.ts            # User model tests
│   ├── User.service.test.ts          # User service tests
│   ├── Video.model.test.ts           # Video model tests
│   ├── Video.service.test.ts         # Video service tests
│   ├── QueryBuilder.test.ts          # Query builder tests
│   └── utils.test.ts                 # Utility function tests
└── integration/                       # Integration tests
    ├── User.controller.test.ts       # User API tests
    ├── Video.api.test.ts             # Video API tests
    └── app.test.ts                   # App-level tests (JWT, CORS, etc.)
```

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Run only unit tests

```bash
npm run test:unit
```

### Run only integration tests

```bash
npm run test:integration
```

### Run tests with coverage

```bash
npm test -- --coverage
```

## Test Categories

### Unit Tests

#### User Model Tests (`User.model.test.ts`)

- User creation with validation
- Password hashing
- Default values (role, totalPdf)
- Duplicate email prevention
- Query operations (find, findById)
- Update and delete operations

#### Video Model Tests (`Video.model.test.ts`)

- Video creation with all fields
- Status validation (processing, completed, failed)
- Telegram chat ID storage
- User reference handling
- Query and update operations

#### Service Tests (`User.service.test.ts`, `Video.service.test.ts`)

- CRUD operations with mocked database
- Error handling
- Query parameter handling
- Data transformation

#### Utility Tests (`utils.test.ts`, `QueryBuilder.test.ts`)

- catchAsync error handling
- Query builder operations (search, filter, sort, paginate)
- Method chaining

### Integration Tests

#### API Tests (`User.controller.test.ts`, `Video.api.test.ts`)

- HTTP endpoint testing
- Request/response validation
- Authentication flow
- Error response handling
- Status code verification

#### App Tests (`app.test.ts`)

- JWT token generation
- Logout functionality
- CORS configuration
- 404 handling
- Global error handling

## Test Database

The tests use an in-memory MongoDB instance or a test database to avoid affecting production data.

Set the test database URL:

```bash
export TEST_DATABASE_URL="mongodb://localhost:27017/test-db"
```

## Mocking

The test suite uses Jest mocks for:

- Database models (mongoose models)
- External services (MinIO, prediction service)
- Authentication middleware
- File system operations

## Coverage Goals

Target coverage metrics:

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

View coverage report:

```bash
npm test -- --coverage
# Then open: coverage/lcov-report/index.html
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `afterEach` to clean test data
3. **Descriptive Names**: Use clear test descriptions
4. **Arrange-Act-Assert**: Follow AAA pattern
5. **Mock External Dependencies**: Don't rely on external services

## Adding New Tests

When adding new features:

1. Create unit tests for models and services
2. Create integration tests for API endpoints
3. Update this README with new test coverage
4. Ensure tests pass before committing

## Troubleshooting

### Tests timing out

Increase timeout in `jest.config.js`:

```javascript
testTimeout: 30000;
```

### Database connection issues

Check MongoDB is running or TEST_DATABASE_URL is set correctly

### Mock not working

Clear mocks in `afterEach`:

```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

## Continuous Integration

Tests should run automatically on:

- Pull requests
- Commits to main branch
- Before deployment

Add to CI/CD pipeline:

```yaml
- run: npm test
- run: npm run test:coverage
```
