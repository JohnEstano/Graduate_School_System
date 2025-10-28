# Payment Rates Import/Export Guide

This guide explains how to use the import and export features for payment rates in the Graduate School System.

## Export Formats

### CSV Format

**File Structure:**
```csv
program_level,type,defense_type,amount
Masteral,"Adviser",Proposal,5000
Masteral,"Adviser",Pre-final,6000
Masteral,"Adviser",Final,7000
Masteral,"Panel Chair",Proposal,4000
Masteral,"Panel Chair",Pre-final,4500
Masteral,"Panel Chair",Final,5000
Doctorate,"Adviser",Proposal,7000
Doctorate,"Adviser",Pre-final,8000
Doctorate,"Adviser",Final,9000
```

**Field Descriptions:**
- `program_level`: Either "Masteral" or "Doctorate"
- `type`: The role type (e.g., "Adviser", "Panel Chair", "Panel Member 1", "REC Fee", "School Share")
- `defense_type`: Either "Proposal", "Pre-final", or "Final"
- `amount`: Numeric value (no currency symbols)

**Notes:**
- First row must be the header
- Type values are quoted to handle commas
- Amount should be numeric only (no ₱ symbol)
- All fields are required

### JSON Format

**File Structure:**
```json
{
  "metadata": {
    "exported_at": "2025-10-28T10:30:00.000Z",
    "version": "1.0",
    "format": "payment_rates",
    "description": "Payment rates export for Graduate School System"
  },
  "rates": [
    {
      "program_level": "Masteral",
      "type": "Adviser",
      "defense_type": "Proposal",
      "amount": 5000
    },
    {
      "program_level": "Masteral",
      "type": "Adviser",
      "defense_type": "Pre-final",
      "amount": 6000
    },
    {
      "program_level": "Masteral",
      "type": "Adviser",
      "defense_type": "Final",
      "amount": 7000
    }
  ]
}
```

**Field Descriptions:**
- `metadata`: Optional information about the export
  - `exported_at`: ISO 8601 timestamp
  - `version`: Format version
  - `format`: Always "payment_rates"
  - `description`: Human-readable description
- `rates`: Array of rate objects
  - `program_level`: Either "Masteral" or "Doctorate"
  - `type`: The role type
  - `defense_type`: Either "Proposal", "Pre-final", or "Final"
  - `amount`: Numeric value

**Notes:**
- JSON must be valid and properly formatted
- The `rates` array is required
- Metadata is optional but recommended for exports

## Import Instructions

### Step 1: Prepare Your File

Choose either CSV or JSON format and ensure it follows the correct structure shown above.

### Step 2: Import the File

1. Click the **Import** button in the Payment Rates page
2. Select your `.csv` or `.json` file
3. The system will validate the file format and data
4. If valid, all rates will be updated in the database

### Validation Rules

The import process validates:
- ✅ File format (.csv or .json)
- ✅ Required headers/fields present
- ✅ Valid program levels ("Masteral" or "Doctorate")
- ✅ Valid defense types ("Proposal", "Pre-final", or "Final")
- ✅ Numeric amount values
- ✅ No missing required fields

### Error Handling

If import fails, check:
- File extension is `.csv` or `.json`
- Headers match exactly (case-sensitive)
- No empty rows in CSV
- JSON is properly formatted
- All amounts are numeric
- All required fields are present

## Complete Examples

### Minimal CSV Example
```csv
program_level,type,defense_type,amount
Masteral,"Adviser",Proposal,5000
Masteral,"Panel Chair",Proposal,4000
Doctorate,"Adviser",Final,9000
```

### Minimal JSON Example
```json
{
  "rates": [
    {
      "program_level": "Masteral",
      "type": "Adviser",
      "defense_type": "Proposal",
      "amount": 5000
    }
  ]
}
```

### Full Data Example (CSV)
```csv
program_level,type,defense_type,amount
Masteral,"Adviser",Proposal,5000
Masteral,"Adviser",Pre-final,6000
Masteral,"Adviser",Final,7000
Masteral,"Panel Chair",Proposal,4000
Masteral,"Panel Chair",Pre-final,4500
Masteral,"Panel Chair",Final,5000
Masteral,"Panel Member 1",Proposal,3500
Masteral,"Panel Member 1",Pre-final,4000
Masteral,"Panel Member 1",Final,4500
Masteral,"Panel Member 2",Proposal,3500
Masteral,"Panel Member 2",Pre-final,4000
Masteral,"Panel Member 2",Final,4500
Masteral,"Panel Member 3",Proposal,3500
Masteral,"Panel Member 3",Pre-final,4000
Masteral,"Panel Member 3",Final,4500
Masteral,"Panel Member 4",Proposal,3500
Masteral,"Panel Member 4",Pre-final,4000
Masteral,"Panel Member 4",Final,4500
Masteral,"REC Fee",Proposal,2000
Masteral,"REC Fee",Pre-final,2000
Masteral,"REC Fee",Final,2000
Masteral,"School Share",Proposal,1500
Masteral,"School Share",Pre-final,1500
Masteral,"School Share",Final,1500
Doctorate,"Adviser",Proposal,7000
Doctorate,"Adviser",Pre-final,8000
Doctorate,"Adviser",Final,9000
Doctorate,"Panel Chair",Proposal,6000
Doctorate,"Panel Chair",Pre-final,6500
Doctorate,"Panel Chair",Final,7000
Doctorate,"Panel Member 1",Proposal,5000
Doctorate,"Panel Member 1",Pre-final,5500
Doctorate,"Panel Member 1",Final,6000
Doctorate,"Panel Member 2",Proposal,5000
Doctorate,"Panel Member 2",Pre-final,5500
Doctorate,"Panel Member 2",Final,6000
Doctorate,"Panel Member 3",Proposal,5000
Doctorate,"Panel Member 3",Pre-final,5500
Doctorate,"Panel Member 3",Final,6000
Doctorate,"Panel Member 4",Proposal,5000
Doctorate,"Panel Member 4",Pre-final,5500
Doctorate,"Panel Member 4",Final,6000
Doctorate,"REC Fee",Proposal,3000
Doctorate,"REC Fee",Pre-final,3000
Doctorate,"REC Fee",Final,3000
Doctorate,"School Share",Proposal,2000
Doctorate,"School Share",Pre-final,2000
Doctorate,"School Share",Final,2000
```

## Best Practices

1. **Always export before importing** to have a backup
2. **Test with a small subset** of data first
3. **Use JSON for complex data** with special characters
4. **Use CSV for simple edits** in spreadsheet programs
5. **Keep backups** of your rate files
6. **Verify amounts** after import by checking the tables
7. **Use consistent formatting** (e.g., no spaces in amounts)

## Troubleshooting

### Import fails with "Invalid CSV format"
- Check that the first line is: `program_level,type,defense_type,amount`
- Ensure no extra commas or spaces in headers

### Import fails with "Invalid JSON format"
- Validate your JSON using an online validator
- Ensure the `rates` array exists
- Check for missing commas or brackets

### Import succeeds but values are wrong
- Verify numeric values don't have currency symbols
- Check for decimal places (use 5000.00 or 5000)
- Ensure no extra spaces in data fields

### Some rates are missing after import
- Ensure all combinations of program_level, type, and defense_type are present
- Check that you included all 8 types for both Masteral and Doctorate
- Verify all 3 defense types (Proposal, Pre-final, Final) for each type

## Support

For issues or questions about import/export:
1. Check this guide for correct format
2. Validate your file structure
3. Review error messages carefully
4. Export current data to see the correct format
