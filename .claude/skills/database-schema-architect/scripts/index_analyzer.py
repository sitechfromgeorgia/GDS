#!/usr/bin/env python3
"""
Index Analyzer
Analyzes SQL queries and suggests optimal indexes for performance improvement.
"""
import sys
import re
import json
from typing import List, Dict, Set, Tuple

class IndexAnalyzer:
    def __init__(self):
        self.recommendations = []
        self.existing_indexes = {}
        
    def extract_table_from_query(self, query: str) -> str:
        """Extract main table name from query"""
        query_upper = query.upper()
        
        # Handle FROM clause
        from_match = re.search(r'FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)', query_upper)
        if from_match:
            return from_match.group(1).lower()
        
        # Handle UPDATE
        update_match = re.search(r'UPDATE\s+([a-zA-Z_][a-zA-Z0-9_]*)', query_upper)
        if update_match:
            return update_match.group(1).lower()
        
        # Handle DELETE
        delete_match = re.search(r'DELETE\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)', query_upper)
        if delete_match:
            return delete_match.group(1).lower()
        
        return None
    
    def extract_where_columns(self, query: str, table_name: str) -> List[str]:
        """Extract columns used in WHERE clause"""
        where_match = re.search(r'WHERE\s+(.+?)(?:GROUP BY|ORDER BY|LIMIT|;|$)', query, re.IGNORECASE | re.DOTALL)
        if not where_match:
            return []
        
        where_clause = where_match.group(1)
        
        # Extract column names (simplified - handles basic cases)
        columns = []
        
        # Match patterns like: column_name =, column_name >, column_name IN, etc.
        pattern = r'([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|>|<|>=|<=|!=|<>|LIKE|IN|IS)'
        matches = re.findall(pattern, where_clause, re.IGNORECASE)
        
        for match in matches:
            col = match.lower()
            # Filter out SQL keywords
            if col not in ['and', 'or', 'not', 'null', 'true', 'false', 'select', 'from', 'where']:
                columns.append(col)
        
        return list(dict.fromkeys(columns))  # Remove duplicates while preserving order
    
    def extract_join_columns(self, query: str) -> List[Tuple[str, str]]:
        """Extract columns used in JOIN conditions"""
        joins = []
        
        # Match JOIN patterns
        join_pattern = r'JOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+.*?ON\s+([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)'
        matches = re.findall(join_pattern, query, re.IGNORECASE)
        
        for match in matches:
            table_name = match[0].lower()
            left_col = match[2].lower()
            right_col = match[4].lower()
            
            joins.append((table_name, left_col))
            joins.append((match[3].lower(), right_col))
        
        return joins
    
    def extract_order_by_columns(self, query: str, table_name: str) -> List[str]:
        """Extract columns used in ORDER BY clause"""
        order_match = re.search(r'ORDER BY\s+(.+?)(?:LIMIT|;|$)', query, re.IGNORECASE)
        if not order_match:
            return []
        
        order_clause = order_match.group(1)
        
        # Extract column names
        columns = []
        parts = order_clause.split(',')
        for part in parts:
            # Remove ASC/DESC and extract column name
            col_match = re.match(r'\s*([a-zA-Z_][a-zA-Z0-9_]*)', part.strip())
            if col_match:
                columns.append(col_match.group(1).lower())
        
        return columns
    
    def analyze_query(self, query: str, query_frequency: int = 1) -> Dict:
        """Analyze a single query and generate index recommendations"""
        table_name = self.extract_table_from_query(query)
        if not table_name:
            return {
                "error": "Could not identify main table in query",
                "query": query
            }
        
        where_columns = self.extract_where_columns(query, table_name)
        join_columns = self.extract_join_columns(query)
        order_by_columns = self.extract_order_by_columns(query, table_name)
        
        recommendations = []
        
        # Recommend indexes for WHERE clause columns
        if where_columns:
            if len(where_columns) == 1:
                idx_name = f"idx_{table_name}_{where_columns[0]}"
                recommendations.append({
                    "type": "single_column",
                    "table": table_name,
                    "columns": where_columns,
                    "index_name": idx_name,
                    "sql": f"CREATE INDEX {idx_name} ON {table_name}({where_columns[0]});",
                    "reason": f"Column '{where_columns[0]}' used in WHERE clause",
                    "priority": "high" if query_frequency > 100 else "medium"
                })
            else:
                # Composite index for multiple WHERE columns
                idx_name = f"idx_{table_name}_{'_'.join(where_columns[:3])}"  # Limit to 3 columns
                columns_str = ', '.join(where_columns[:3])
                recommendations.append({
                    "type": "composite",
                    "table": table_name,
                    "columns": where_columns[:3],
                    "index_name": idx_name,
                    "sql": f"CREATE INDEX {idx_name} ON {table_name}({columns_str});",
                    "reason": f"Multiple columns used together in WHERE clause",
                    "priority": "high" if query_frequency > 100 else "medium",
                    "note": "Column order matters! Most selective column should be first."
                })
        
        # Recommend indexes for JOIN columns
        for table, column in join_columns:
            idx_name = f"idx_{table}_{column}"
            existing_table_indexes = self.existing_indexes.get(table, set())
            
            if idx_name not in existing_table_indexes:
                recommendations.append({
                    "type": "foreign_key",
                    "table": table,
                    "columns": [column],
                    "index_name": idx_name,
                    "sql": f"CREATE INDEX {idx_name} ON {table}({column});",
                    "reason": f"Column '{column}' used in JOIN condition",
                    "priority": "critical"  # Foreign keys must always be indexed
                })
        
        # Recommend covering index if ORDER BY present with WHERE
        if where_columns and order_by_columns:
            covering_columns = where_columns + [col for col in order_by_columns if col not in where_columns]
            if len(covering_columns) <= 4:  # Don't create overly wide indexes
                idx_name = f"idx_{table_name}_{'_'.join(covering_columns[:4])}"
                columns_str = ', '.join(covering_columns[:4])
                recommendations.append({
                    "type": "covering",
                    "table": table_name,
                    "columns": covering_columns[:4],
                    "index_name": idx_name,
                    "sql": f"CREATE INDEX {idx_name} ON {table_name}({columns_str});",
                    "reason": "Covering index for WHERE + ORDER BY optimization",
                    "priority": "medium" if query_frequency > 50 else "low",
                    "note": "This index can satisfy both WHERE and ORDER BY without table access"
                })
        
        return {
            "table": table_name,
            "where_columns": where_columns,
            "join_columns": join_columns,
            "order_by_columns": order_by_columns,
            "recommendations": recommendations
        }
    
    def set_existing_indexes(self, indexes: Dict[str, List[str]]):
        """Set existing indexes to avoid duplicate recommendations"""
        self.existing_indexes = {table: set(idx_list) for table, idx_list in indexes.items()}
    
    def analyze_queries(self, queries: List[Dict]) -> Dict:
        """Analyze multiple queries and prioritize recommendations"""
        all_recommendations = []
        
        for query_info in queries:
            query = query_info.get('query')
            frequency = query_info.get('frequency', 1)
            
            analysis = self.analyze_query(query, frequency)
            if 'error' not in analysis:
                for rec in analysis.get('recommendations', []):
                    rec['query_frequency'] = frequency
                    all_recommendations.append(rec)
        
        # Group by table and index name to remove duplicates
        unique_recommendations = {}
        for rec in all_recommendations:
            key = f"{rec['table']}_{rec['index_name']}"
            if key not in unique_recommendations:
                unique_recommendations[key] = rec
            else:
                # Keep the one with higher priority
                existing = unique_recommendations[key]
                priority_order = {'critical': 3, 'high': 2, 'medium': 1, 'low': 0}
                if priority_order.get(rec['priority'], 0) > priority_order.get(existing['priority'], 0):
                    unique_recommendations[key] = rec
        
        # Sort by priority
        priority_order = {'critical': 3, 'high': 2, 'medium': 1, 'low': 0}
        sorted_recommendations = sorted(
            unique_recommendations.values(),
            key=lambda x: priority_order.get(x['priority'], 0),
            reverse=True
        )
        
        return {
            "total_queries_analyzed": len(queries),
            "total_recommendations": len(sorted_recommendations),
            "recommendations": sorted_recommendations
        }

def main():
    if len(sys.argv) < 2:
        print("Usage: index_analyzer.py <queries.json>")
        print("\nExpected JSON format:")
        print('''{
    "existing_indexes": {
        "customers": ["idx_customers_email"],
        "orders": ["idx_orders_customer_id"]
    },
    "queries": [
        {
            "query": "SELECT * FROM orders WHERE customer_id = ? AND status = ?",
            "frequency": 1000
        }
    ]
}''')
        sys.exit(1)
    
    queries_file = sys.argv[1]
    
    try:
        with open(queries_file, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File '{queries_file}' not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON - {e}")
        sys.exit(1)
    
    analyzer = IndexAnalyzer()
    
    # Set existing indexes if provided
    if 'existing_indexes' in data:
        analyzer.set_existing_indexes(data['existing_indexes'])
    
    queries = data.get('queries', [])
    if not queries:
        print("Error: No queries found in JSON")
        sys.exit(1)
    
    result = analyzer.analyze_queries(queries)
    
    print("\n" + "="*70)
    print("INDEX ANALYSIS REPORT")
    print("="*70 + "\n")
    
    print(f"Analyzed {result['total_queries_analyzed']} queries")
    print(f"Generated {result['total_recommendations']} index recommendations\n")
    
    if result['recommendations']:
        # Group by priority
        by_priority = {'critical': [], 'high': [], 'medium': [], 'low': []}
        for rec in result['recommendations']:
            priority = rec.get('priority', 'low')
            by_priority[priority].append(rec)
        
        for priority in ['critical', 'high', 'medium', 'low']:
            recs = by_priority[priority]
            if not recs:
                continue
            
            print(f"\n{priority.upper()} PRIORITY ({len(recs)}):")
            print("-" * 70)
            
            for rec in recs:
                print(f"\n  Table: {rec['table']}")
                print(f"  Index: {rec['index_name']}")
                print(f"  Columns: {', '.join(rec['columns'])}")
                print(f"  Reason: {rec['reason']}")
                print(f"  SQL: {rec['sql']}")
                if 'note' in rec:
                    print(f"  Note: {rec['note']}")
                if 'query_frequency' in rec:
                    print(f"  Query Frequency: {rec['query_frequency']} executions")
        
        print("\n" + "="*70)
        print("IMPLEMENTATION TIPS:")
        print("="*70)
        print("  • Critical: Foreign keys - implement immediately")
        print("  • High: Frequent WHERE clauses - high impact on performance")
        print("  • Medium: Composite indexes - test impact before deploying")
        print("  • Low: Nice-to-have optimizations")
        print("\n  • For PostgreSQL: Use 'CREATE INDEX CONCURRENTLY' to avoid locks")
        print("  • Test indexes on staging before production")
        print("  • Monitor query performance before and after")
        print()
    else:
        print("✅ No index recommendations - schema appears well-optimized!\n")
    
    sys.exit(0)

if __name__ == "__main__":
    main()
