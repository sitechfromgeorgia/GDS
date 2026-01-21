# Intelligent Debugger Skill

A comprehensive, systematic debugging agent for full-stack development.

## Overview

The Intelligent Debugger provides a methodical, scientific approach to debugging across the entire technology stack. It combines proven debugging methodologies with automated analysis tools to quickly identify root causes and implement reliable solutions.

## What It Does

- **Systematic Investigation**: 7-step debugging process from reproduction to documentation
- **Cross-Stack Analysis**: Tracks errors from frontend through backend to database
- **Automated Tools**: Scripts for log analysis, performance checking, and stack trace parsing
- **Pattern Recognition**: Identifies common bug patterns and suggests solutions
- **Communication Templates**: Professional debugging progress reports and postmortems

## When to Use

The skill activates automatically when you:
- Mention debugging, errors, bugs, or failures
- Share stack traces or error messages
- Ask about troubleshooting issues
- Need help investigating unexpected behavior
- Request log analysis or performance diagnostics

## Files Included

### Core
- `SKILL.md` - Main debugging instructions and workflows

### Scripts (`scripts/`)
- `log_analyzer.py` - Automated log file analysis
- `performance_check.py` - System and API performance metrics
- `stack_trace_parser.py` - Parse and explain stack traces

### References (`references/`)
- `DEBUGGING_PATTERNS.md` - Common bugs and solutions
- `ERROR_CODES.md` - HTTP and database error reference

## Quick Start

1. **ZIP this entire folder** (intelligent-debugger)
2. In Claude Desktop: Settings → Capabilities → Upload Skill
3. Select the ZIP file
4. Enable the skill

## Usage Examples

```
"I'm getting a TypeError: Cannot read property 'name' of undefined"
→ Skill analyzes error type, suggests null checks, provides solutions

"This API endpoint times out after 30 seconds"  
→ Skill investigates database queries, checks indexes, profiles performance

"Help me analyze these application logs"
→ Skill runs log_analyzer.py, identifies error patterns, suggests fixes

"My React component isn't re-rendering"
→ Skill checks state management, identifies mutation issues, fixes code
```

## 7-Step Process

1. **Reproduce**: Establish consistent reproduction
2. **Gather Information**: Collect logs, traces, environment details
3. **Understand System**: Build mental model of components
4. **Form Hypotheses**: Systematic hypothesis testing
5. **Implement Solution**: Fix root cause, not symptoms
6. **Test & Verify**: Comprehensive verification
7. **Document & Learn**: Create postmortem, prevent recurrence

## Features

### Debugging by Category
- Frontend (Browser DevTools, React/Vue issues)
- Backend (API debugging, logging strategies)
- Database (Query optimization, connection issues)
- Performance (Profiling, memory leaks)
- Integration (API authentication, CORS, timeouts)

### Automated Analysis
- Log pattern detection
- Error frequency analysis
- Performance metrics
- Stack trace explanation

### Best Practices
- Systematic over random debugging
- Root cause analysis
- Proper error handling
- Documentation and learning

## Requirements

**For Python Scripts:**
```bash
pip install psutil requests
```

## Script Usage

### Analyze Logs
```bash
python scripts/log_analyzer.py app.log
python scripts/log_analyzer.py app.log --errors-only
python scripts/log_analyzer.py app.log --last-hours 24
```

### Check Performance
```bash
python scripts/performance_check.py
python scripts/performance_check.py --url https://api.example.com
python scripts/performance_check.py --process "node"
```

### Parse Stack Trace
```bash
python scripts/stack_trace_parser.py error.txt
cat error.log | python scripts/stack_trace_parser.py
```

## Tips

- Let Claude guide you through the 7-step process
- Share complete error messages and stack traces
- Provide context about recent changes
- Use the automated scripts for faster analysis
- Ask for explanation of error codes or patterns

## Support

- Check references/ folder for detailed guides
- All scripts include --help for usage details
- DEBUGGING_PATTERNS.md has solutions for common issues
- ERROR_CODES.md explains all HTTP and DB errors

---

**Version**: 1.0  
**Language**: English  
**License**: MIT  
**Created**: November 2025
