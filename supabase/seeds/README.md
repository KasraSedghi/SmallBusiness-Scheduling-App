# Red Bean Scheduler: Seed Data & Fixtures

This directory contains seed data and test fixtures for local development and testing.

## Files

### 1. `seed_local_development.sql`
SQL migration file for seeding the database with realistic test data.

**Contains:**
- 4 test employees + 2 admins
- 5 availability records across 2 weeks
- 3 time-off requests with different statuses
- 2 weeks of capacity settings

**Test Coverage:**
- ✅ Approved + pending availabilities
- ✅ Edge case: employee with insufficient shifts (validation test)
- ✅ Time-off requests in all states (pending, approved, denied)
- ✅ Multiple weeks of scheduling data

**How to Apply:**

```bash
# Option 1: Via Supabase CLI
supabase seed run

# Option 2: Direct SQL execution in Supabase dashboard
# Copy/paste the contents into SQL Editor and run
```

### 2. `fixtures.ts`
TypeScript fixtures for unit tests, integration tests, and programmatic test setup.

**Export Groups:**

#### Profile Fixtures
```typescript
import { profileFixtures } from '@/supabase/seeds/fixtures';

profileFixtures.employee_john;
profileFixtures.employee_sarah;
profileFixtures.admin_alice;
// ... etc
```

#### Shift Data Fixtures
```typescript
import { shiftDataFixtures } from '@/supabase/seeds/fixtures';

shiftDataFixtures.heavy_availability;      // 6+ shifts
shiftDataFixtures.moderate_availability;   // Meets minimum
shiftDataFixtures.minimal_availability;    // Exactly 2 shifts
shiftDataFixtures.insufficient_availability; // Only 1 shift (violation)
shiftDataFixtures.empty_availability;      // No shifts
shiftDataFixtures.weekend_only;            // Edge case
```

#### Mock Builders
```typescript
import { 
  createMockProfile, 
  createMockAvailability, 
  createMockTimeOffRequest 
} from '@/supabase/seeds/fixtures';

const profile = createMockProfile({ 
  email: 'custom@test.local' 
});

const availability = createMockAvailability({ 
  status: 'approved',
  shift_data: shiftDataFixtures.heavy_availability
});
```

## Usage in Tests

### Unit Test Example
```typescript
import { describe, it, expect } from 'vitest';
import { availabilityFixtures } from '@/supabase/seeds/fixtures';

describe('availability validation', () => {
  it('should reject insufficient shifts', () => {
    const result = validateMinimumShifts(
      availabilityFixtures.emma_week_of_june22_pending_violation.shift_data
    );
    expect(result.isValid).toBe(false);
  });
});
```

### Integration Test Example
```typescript
import { supabase } from '@/utils/supabase/server';
import { profileFixtures, availabilityFixtures } from '@/supabase/seeds/fixtures';

describe('availability queries', () => {
  it('should fetch pending availabilities for admins', async () => {
    const { data } = await supabase
      .from('availabilities')
      .select('*')
      .eq('status', 'pending');
    
    expect(data).toContainEqual(
      expect.objectContaining({
        profile_id: profileFixtures.employee_sarah.id
      })
    );
  });
});
```

## Profile UUIDs Reference

For connecting test data across fixtures:

| Name | UUID |
|------|------|
| John Doe (employee) | `550e8400-e29b-41d4-a716-446655440001` |
| Sarah Smith (employee) | `550e8400-e29b-41d4-a716-446655440002` |
| Mike Johnson (employee) | `550e8400-e29b-41d4-a716-446655440003` |
| Emma Williams (employee) | `550e8400-e29b-41d4-a716-446655440004` |
| Alice Manager (admin) | `550e8400-e29b-41d4-a716-446655440101` |
| Bob Admin (admin) | `550e8400-e29b-41d4-a716-446655440102` |

## Updating Fixtures

When you modify the database schema or add new test scenarios:

1. **SQL Seeds**: Edit `seed_local_development.sql` directly
2. **TypeScript Fixtures**: Update `fixtures.ts` with new exports or helper functions
3. **Keep in sync**: Ensure both files represent the same conceptual test data

## Notes

- All timestamps in fixtures use ISO 8601 format
- All dates are in YYYY-MM-DD format (America/New_York timezone, hardcoded)
- UUIDs follow PostgreSQL standards (v4 random)
- Profile IDs match Supabase `auth.users` pattern
