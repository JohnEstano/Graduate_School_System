# Coordinator Program Service

A comprehensive service for managing UIC graduate program coordinator assignments with easy querying capabilities.

## Overview

The `CoordinatorProgramService` provides a centralized way to:
- Query programs assigned to specific coordinators
- Find coordinators for specific programs
- Search programs by keywords
- Generate program statistics and workload reports
- Export data for seeding or other uses

## Quick Usage Examples

### 1. Query Programs by Coordinator Email

```php
use App\Services\CoordinatorProgramService;

// Get all programs for a specific coordinator
$programs = CoordinatorProgramService::getProgramsByEmail('pacosta@uic.edu.ph');
// Returns: ['Doctor in Business Management', 'Master in Business Administration (with Thesis and Non-Thesis)', ...]

// Check if an email is a registered coordinator
$isCoordinator = CoordinatorProgramService::isCoordinator('pacosta@uic.edu.ph');
// Returns: true
```

### 2. Find Coordinator for a Program

```php
// Find who coordinates a specific program
$coordinator = CoordinatorProgramService::getCoordinatorByProgram('Master in Information Technology');
// Returns: 'hbeltran@uic.edu.ph'
```

### 3. Search Programs by Keyword

```php
// Search for programs containing 'Business'
$results = CoordinatorProgramService::searchPrograms('Business');
// Returns array of ['coordinator_email' => '...', 'program_name' => '...']
```

### 4. Get Statistics and Reports

```php
// Get coordinator workload statistics (sorted by program count)
$stats = CoordinatorProgramService::getCoordinatorStats();

// Group programs by degree level (Doctoral, Masters, Other)
$byLevel = CoordinatorProgramService::getProgramsByDegreeLevel();

// Print formatted report of all coordinators
echo CoordinatorProgramService::printAllCoordinators();
```

## Artisan Commands

Use the convenient artisan command for quick queries:

### Query specific coordinator
```bash
php artisan coordinator:programs --email=pacosta@uic.edu.ph
```

### Find coordinator for a program
```bash
php artisan coordinator:programs --program="Master in Information Technology"
```

### Search programs by keyword
```bash
php artisan coordinator:programs --search=Business
```

### Show workload statistics
```bash
php artisan coordinator:programs --stats
```

### List all coordinators and programs
```bash
php artisan coordinator:programs --list
```

### Export data for seeding
```bash
php artisan coordinator:programs --export
```

## Current Coordinator Data

The service includes 9 UIC graduate program coordinators with 34 total program assignments:

| Coordinator | Programs | Specialization |
|-------------|----------|----------------|
| **pacosta@uic.edu.ph** | 3 programs | Business Management & MBA |
| **gscoordinator_maed@uic.edu.ph** | 6 programs | Education, Counseling, Physical Education |
| **gscoordinator_pharmacy@uic.edu.ph** | 3 programs | Pharmacy & Medical Technology |
| **gscoordinator_phd@uic.edu.ph** | 5 programs | PhD Education Programs |
| **aalontaga@uic.edu.ph** | 1 program | Music Education |
| **vbadong@uic.edu.ph** | 4 programs | Chemistry, Physics, Engineering |
| **gbuelis@uic.edu.ph** | 1 program | Medical Technology |
| **hbeltran@uic.edu.ph** | 5 programs | Information Systems & Technology |
| **talderite@uic.edu.ph** | 6 programs | Mathematics, Sociology, Educational Management |

## Program Code Generation

The service automatically generates program codes:
- **DBM** - Doctor in Business Management
- **MBA** - Master in Business Administration
- **PhD** - Doctor of Philosophy programs
- **MAED** - Master of Arts in Education
- **MS** - Master of Science
- **MIT/MIS** - Master in Information Technology/Systems
- And more...

## Integration with Laravel Application

The service is already integrated with:
- **DashboardController** - Provides program data for Super Admin dashboard
- **Database Seeder** - Can export data for seeding coordinators
- **Artisan Commands** - Command-line interface for queries

## Testing

Run the test file to see all functionality in action:
```bash
php test_coordinator_service.php
```

## Files Created

- `app/Services/CoordinatorProgramService.php` - Main service class
- `app/Console/Commands/CoordinatorProgramsCommand.php` - Artisan command interface
- `test_coordinator_service.php` - Demonstration/test file

This service makes it easy to maintain and query the complex coordinator-program relationships in the UIC Graduate School System.