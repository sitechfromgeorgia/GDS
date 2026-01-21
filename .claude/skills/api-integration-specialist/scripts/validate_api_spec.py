#!/usr/bin/env python3
"""
Validate OpenAPI/Swagger specifications for completeness and best practices
"""
import sys
import json
import yaml
from pathlib import Path

def validate_openapi_spec(spec_path):
    """
    Validate OpenAPI specification file
    """
    print(f"Validating: {spec_path}\n")
    
    # Read spec file
    try:
        with open(spec_path) as f:
            if spec_path.endswith('.json'):
                spec = json.load(f)
            else:
                spec = yaml.safe_load(f)
    except Exception as e:
        return False, [f"Failed to parse file: {e}"]
    
    errors = []
    warnings = []
    
    # Check OpenAPI version
    if 'openapi' not in spec:
        errors.append("Missing 'openapi' version field")
    elif not spec['openapi'].startswith('3.'):
        warnings.append(f"Using OpenAPI version {spec['openapi']}, consider upgrading to 3.x")
    
    # Check info section
    if 'info' not in spec:
        errors.append("Missing 'info' section")
    else:
        info = spec['info']
        if 'title' not in info:
            errors.append("Missing API title in info section")
        if 'version' not in info:
            errors.append("Missing API version in info section")
        if 'description' not in info:
            warnings.append("Missing API description in info section")
    
    # Check paths
    if 'paths' not in spec or not spec['paths']:
        errors.append("No paths defined in specification")
    else:
        validate_paths(spec['paths'], errors, warnings)
    
    # Check components
    if 'components' in spec:
        validate_components(spec['components'], errors, warnings)
    
    # Check security
    if 'security' not in spec:
        warnings.append("No global security requirements defined")
    
    # Print results
    print("=" * 60)
    if errors:
        print(f"\n❌ ERRORS ({len(errors)}):")
        for error in errors:
            print(f"  • {error}")
    
    if warnings:
        print(f"\n⚠️  WARNINGS ({len(warnings)}):")
        for warning in warnings:
            print(f"  • {warning}")
    
    if not errors and not warnings:
        print("\n✅ Specification is valid with no issues!")
    elif not errors:
        print("\n✅ Specification is valid with some warnings.")
    else:
        print("\n❌ Specification has errors that must be fixed.")
    
    print("=" * 60)
    
    return len(errors) == 0, errors

def validate_paths(paths, errors, warnings):
    """Validate API paths"""
    for path, methods in paths.items():
        if not path.startswith('/'):
            errors.append(f"Path '{path}' must start with '/'")
        
        for method, operation in methods.items():
            if method not in ['get', 'post', 'put', 'patch', 'delete', 'options', 'head']:
                continue
            
            # Check operation ID
            if 'operationId' not in operation:
                warnings.append(f"{method.upper()} {path}: Missing operationId")
            
            # Check description
            if 'description' not in operation and 'summary' not in operation:
                warnings.append(f"{method.upper()} {path}: Missing description/summary")
            
            # Check responses
            if 'responses' not in operation:
                errors.append(f"{method.upper()} {path}: Missing responses")
            else:
                validate_responses(operation['responses'], path, method, warnings)
            
            # Check request body for POST/PUT/PATCH
            if method in ['post', 'put', 'patch']:
                if 'requestBody' not in operation:
                    warnings.append(f"{method.upper()} {path}: Missing requestBody")

def validate_responses(responses, path, method, warnings):
    """Validate response definitions"""
    if '200' not in responses and '201' not in responses:
        warnings.append(f"{method.upper()} {path}: No success response (200/201) defined")
    
    if '400' not in responses and method in ['post', 'put', 'patch']:
        warnings.append(f"{method.upper()} {path}: No 400 Bad Request response defined")
    
    if '401' not in responses:
        warnings.append(f"{method.upper()} {path}: No 401 Unauthorized response defined")

def validate_components(components, errors, warnings):
    """Validate component definitions"""
    if 'schemas' in components:
        for schema_name, schema in components['schemas'].items():
            if 'type' not in schema and '$ref' not in schema:
                warnings.append(f"Schema '{schema_name}': Missing type definition")
    
    if 'securitySchemes' not in components:
        warnings.append("No security schemes defined in components")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: validate_api_spec.py <openapi.yaml|openapi.json>")
        print("\nExample:")
        print("  python validate_api_spec.py openapi.yaml")
        sys.exit(1)
    
    spec_file = sys.argv[1]
    
    if not Path(spec_file).exists():
        print(f"Error: File '{spec_file}' not found")
        sys.exit(1)
    
    is_valid, errors = validate_openapi_spec(spec_file)
    
    sys.exit(0 if is_valid else 1)
