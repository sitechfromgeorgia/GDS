# Feature Impact Analyzer - Claude Desktop Skill

Product prioritization using RICE, ICE, and Impact/Effort frameworks.

## What This Does

- **Prioritization Frameworks**: RICE, ICE, Impact/Effort matrices
- **KPI Connection**: Links features to retention, growth, revenue
- **Quick Wins**: Identifies high-impact, low-effort features
- **Automated Scoring**: Python scripts for batch processing

## Installation

1. **Zip this folder**: `feature-impact-analyzer.zip`
2. **Claude Desktop**: Settings > Capabilities > Upload ZIP
3. **Enable the skill**

## Quick Start

```
"Help me prioritize these features using RICE:
1. Dark mode
2. Referral program
3. Analytics dashboard"
```

## Using Scripts

### RICE Calculator
```bash
python scripts/calculate_rice.py --reach 5000 --impact 2.0 --confidence 80 --effort 3
python scripts/calculate_rice.py --csv features.csv --output results.csv
```

### ICE Calculator
```bash
python scripts/calculate_ice.py --impact 8 --confidence 7 --ease 6
python scripts/calculate_ice.py --csv features.csv --output results.csv
```

## Frameworks

**RICE**: (Reach × Impact × Confidence) / Effort  
**ICE**: (Impact + Confidence + Ease) / 3  
**Matrix**: 2x2 grid of Impact vs Effort

## CSV Format

**RICE**:
```csv
feature_name,reach,impact,confidence,effort
Referral,8000,2.5,70,4
```

**ICE**:
```csv
feature_name,impact,confidence,ease
Dark Mode,6,8,9
```

## Version
v1.0.0 | MIT License | Nov 2025
