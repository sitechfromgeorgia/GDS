#!/usr/bin/env python3
"""
Database Schema Validator
Validates database schemas against best practices and common pitfalls.
"""
import sys
import re
import json
from typing import List, Dict, Any, Tuple

class SchemaValidator:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.suggestions = []
        
    def validate_naming_convention(self, table_name: str, column_names: List[str]) -> None:
        """Validate naming conventions for tables and columns"""
        # Check table name (should be lowercase, plural)
        if not table_name.islower():
            self.errors.append(f"Table '{table_name}': Use lowercase names")
        
        if table_name.endswith('s') or table_name.endswith('es'):
            pass  # Good: plural
        else:
            self.warnings.append(f"Table '{table_name}': Consider using plural form")
        
        # Check for spaces or special characters
        if ' ' in table_name or not re.match(r'^[a-z_][a-z0-9_]*$', table_name):
            self.errors.append(f"Table '{table_name}': Use only lowercase letters, numbers, and underscores")
        
        # Check column names
        for col in column_names:
            if not col.islower():
                self.errors.append(f"Column '{col}' in '{table_name}': Use lowercase names")
            
            if not re.match(r'^[a-z_][a-z0-9_]*$', col):
                self.errors.append(f"Column '{col}' in '{table_name}': Use only lowercase, numbers, and underscores")
    
    def validate_primary_key(self, table_name: str, pk_column: str = None) -> None:
        """Validate primary key presence and naming"""
        if not pk_column:
            self.errors.append(f"Table '{table_name}': Missing primary key")
            return
        
        expected_pk = f"{table_name.rstrip('s')}_id"
        if pk_column != expected_pk and pk_column != 'id':
            self.warnings.append(
                f"Table '{table_name}': PK is '{pk_column}', consider '{expected_pk}' for consistency"
            )
    
    def validate_foreign_keys(self, table_name: str, foreign_keys: List[Dict]) -> None:
        """Validate foreign key naming and indexing"""
        for fk in foreign_keys:
            fk_name = fk.get('name')
            fk_column = fk.get('column')
            ref_table = fk.get('ref_table')
            is_indexed = fk.get('indexed', False)
            
            # Check naming convention
            expected_fk = f"fk_{table_name}_{fk_column}"
            if fk_name and fk_name != expected_fk:
                self.warnings.append(
                    f"FK '{fk_name}': Consider naming as '{expected_fk}'"
                )
            
            # Check if foreign key column is indexed
            if not is_indexed:
                self.errors.append(
                    f"Table '{table_name}': Foreign key '{fk_column}' must be indexed"
                )
            
            # Check column naming
            if ref_table and not fk_column.endswith('_id'):
                self.warnings.append(
                    f"FK column '{fk_column}' in '{table_name}': Consider ending with '_id'"
                )
    
    def validate_data_types(self, table_name: str, columns: List[Dict]) -> None:
        """Validate appropriate data type selection"""
        for col in columns:
            col_name = col.get('name')
            data_type = col.get('type', '').upper()
            
            # Check for money stored as FLOAT
            if 'price' in col_name or 'amount' in col_name or 'cost' in col_name:
                if 'FLOAT' in data_type or 'REAL' in data_type or 'DOUBLE' in data_type:
                    self.errors.append(
                        f"Column '{col_name}' in '{table_name}': Never use FLOAT/DOUBLE for money. Use DECIMAL(10,2)"
                    )
            
            # Check for boolean stored as integer
            if col_name.startswith('is_') or col_name.startswith('has_'):
                if 'INT' in data_type and 'BIGINT' not in data_type:
                    self.warnings.append(
                        f"Column '{col_name}' in '{table_name}': Consider BOOLEAN instead of INTEGER"
                    )
            
            # Check for oversized VARCHAR
            if 'VARCHAR' in data_type:
                match = re.search(r'VARCHAR\((\d+)\)', data_type)
                if match:
                    size = int(match.group(1))
                    if size > 255 and 'description' not in col_name and 'comment' not in col_name:
                        self.warnings.append(
                            f"Column '{col_name}' in '{table_name}': VARCHAR({size}) may be oversized"
                        )
                    if size == 255 and 'email' not in col_name and 'url' not in col_name:
                        self.suggestions.append(
                            f"Column '{col_name}' in '{table_name}': Review if VARCHAR(255) is needed or if smaller size works"
                        )
    
    def validate_indexes(self, table_name: str, indexes: List[Dict]) -> None:
        """Validate index naming and usage"""
        if len(indexes) > 7:
            self.warnings.append(
                f"Table '{table_name}': Has {len(indexes)} indexes. Too many indexes can slow writes."
            )
        
        for idx in indexes:
            idx_name = idx.get('name')
            columns = idx.get('columns', [])
            
            if not idx_name.startswith('idx_'):
                self.warnings.append(
                    f"Index '{idx_name}' in '{table_name}': Should start with 'idx_'"
                )
            
            # Check composite index naming
            if len(columns) > 1:
                expected_name = f"idx_{table_name}_{'_'.join(columns)}"
                if idx_name != expected_name:
                    self.suggestions.append(
                        f"Composite index '{idx_name}': Consider '{expected_name}' for clarity"
                    )
    
    def validate_constraints(self, table_name: str, constraints: List[Dict]) -> None:
        """Validate constraint usage"""
        has_not_null = False
        has_check = False
        has_unique = False
        
        for con in constraints:
            con_type = con.get('type')
            if con_type == 'NOT NULL':
                has_not_null = True
            elif con_type == 'CHECK':
                has_check = True
            elif con_type == 'UNIQUE':
                has_unique = True
        
        if not has_not_null:
            self.suggestions.append(
                f"Table '{table_name}': Consider NOT NULL constraints for required fields"
            )
        
        # Check for numeric columns without CHECK constraints
        for con in constraints:
            if 'price' in table_name or 'amount' in table_name:
                if not has_check:
                    self.suggestions.append(
                        f"Table '{table_name}': Consider CHECK constraint for positive values"
                    )
                    break
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate validation report"""
        return {
            "valid": len(self.errors) == 0,
            "total_issues": len(self.errors) + len(self.warnings) + len(self.suggestions),
            "errors": self.errors,
            "warnings": self.warnings,
            "suggestions": self.suggestions
        }

def validate_schema_json(schema_json: Dict) -> Dict[str, Any]:
    """
    Validate schema from JSON format
    
    Expected JSON structure:
    {
        "tables": [
            {
                "name": "customers",
                "primary_key": "customer_id",
                "columns": [
                    {"name": "customer_id", "type": "SERIAL"},
                    {"name": "email", "type": "VARCHAR(255)"}
                ],
                "foreign_keys": [
                    {"name": "fk_orders_customer", "column": "customer_id", "ref_table": "customers", "indexed": true}
                ],
                "indexes": [
                    {"name": "idx_customers_email", "columns": ["email"]}
                ],
                "constraints": [
                    {"type": "NOT NULL", "column": "email"},
                    {"type": "CHECK", "expression": "price >= 0"}
                ]
            }
        ]
    }
    """
    validator = SchemaValidator()
    
    tables = schema_json.get('tables', [])
    if not tables:
        validator.errors.append("No tables defined in schema")
        return validator.generate_report()
    
    for table in tables:
        table_name = table.get('name')
        if not table_name:
            validator.errors.append("Table missing name")
            continue
        
        # Validate naming
        columns = table.get('columns', [])
        column_names = [col.get('name') for col in columns]
        validator.validate_naming_convention(table_name, column_names)
        
        # Validate primary key
        validator.validate_primary_key(table_name, table.get('primary_key'))
        
        # Validate foreign keys
        foreign_keys = table.get('foreign_keys', [])
        validator.validate_foreign_keys(table_name, foreign_keys)
        
        # Validate data types
        validator.validate_data_types(table_name, columns)
        
        # Validate indexes
        indexes = table.get('indexes', [])
        validator.validate_indexes(table_name, indexes)
        
        # Validate constraints
        constraints = table.get('constraints', [])
        validator.validate_constraints(table_name, constraints)
    
    return validator.generate_report()

def main():
    if len(sys.argv) < 2:
        print("Usage: schema_validator.py <schema.json>")
        print("\nExpects JSON file with schema definition")
        print("See script header for JSON format specification")
        sys.exit(1)
    
    schema_file = sys.argv[1]
    
    try:
        with open(schema_file, 'r') as f:
            schema = json.load(f)
    except FileNotFoundError:
        print(f"Error: File '{schema_file}' not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON - {e}")
        sys.exit(1)
    
    report = validate_schema_json(schema)
    
    print("\n" + "="*60)
    print("DATABASE SCHEMA VALIDATION REPORT")
    print("="*60 + "\n")
    
    if report['errors']:
        print(f"ERRORS ({len(report['errors'])}) - Must fix:")
        print("-" * 60)
        for error in report['errors']:
            print(f"  ❌ {error}")
        print()
    
    if report['warnings']:
        print(f"WARNINGS ({len(report['warnings'])}) - Should fix:")
        print("-" * 60)
        for warning in report['warnings']:
            print(f"  ⚠️  {warning}")
        print()
    
    if report['suggestions']:
        print(f"SUGGESTIONS ({len(report['suggestions'])}) - Consider:")
        print("-" * 60)
        for suggestion in report['suggestions']:
            print(f"  💡 {suggestion}")
        print()
    
    if report['valid'] and not report['warnings'] and not report['suggestions']:
        print("✅ Schema validation passed with no issues!\n")
    elif report['valid']:
        print(f"✅ Schema validation passed with {len(report['warnings']) + len(report['suggestions'])} recommendations\n")
    else:
        print(f"❌ Schema validation failed with {len(report['errors'])} errors\n")
    
    sys.exit(0 if report['valid'] else 1)

if __name__ == "__main__":
    main()
