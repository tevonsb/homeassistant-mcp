# 🚀 Enhanced Tools Documentation

## Overview

This document provides comprehensive documentation for the 7 new enhanced tools that transform the Home Assistant MCP server into an enterprise-grade smart home automation platform.

## Table of Contents

- [Energy Management Tool](#energy-management-tool)
- [Weather Integration Tool](#weather-integration-tool)
- [Network Monitoring Tool](#network-monitoring-tool)
- [Backup Management Tool](#backup-management-tool)
- [Error Recovery Tool](#error-recovery-tool)
- [System Health Tool](#system-health-tool)
- [System Validation Tool](#system-validation-tool)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## ⚡ Energy Management Tool

### Description
Comprehensive energy monitoring and management for Home Assistant, providing insights into solar production, grid usage, battery management, and optimization suggestions.

### Parameters
```typescript
{
  action: 'list_sources' | 'get_dashboard' | 'get_device_consumption' | 'get_statistics' | 'get_optimization_suggestions',
  source_type?: 'grid' | 'solar' | 'battery' | 'gas',
  entity_id?: string,
  period?: 'hour' | 'day' | 'week' | 'month' | 'year',
  start_time?: string,
  end_time?: string
}
```

### Actions

#### `list_sources`
Lists all available energy sources in your Home Assistant instance.

**Example Response:**
```json
{
  "success": true,
  "sources": [
    {
      "type": "solar",
      "entity_id": "sensor.solar_production",
      "name": "Solar Panels",
      "current_power": 2500,
      "unit": "W"
    },
    {
      "type": "grid",
      "entity_id": "sensor.grid_consumption",
      "name": "Grid Power",
      "current_power": -500,
      "unit": "W"
    }
  ]
}
```

#### `get_dashboard`
Provides a comprehensive energy dashboard with current status and trends.

**Example Response:**
```json
{
  "success": true,
  "dashboard": {
    "current_power": {
      "solar": 2500,
      "grid": -500,
      "battery": 200,
      "total": 2200
    },
    "today_energy": {
      "solar": 15.2,
      "grid_import": 2.1,
      "grid_export": 8.5,
      "battery_charge": 3.2
    },
    "efficiency": 85.7
  }
}
```

#### `get_optimization_suggestions`
AI-powered suggestions for optimizing energy usage and reducing costs.

**Example Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "type": "timing",
      "priority": "high",
      "description": "Shift high-power device usage to peak solar hours (10 AM - 2 PM)",
      "potential_savings": "15-20% on grid consumption",
      "devices": ["dishwasher", "washing_machine", "electric_vehicle"]
    },
    {
      "type": "automation",
      "priority": "medium",
      "description": "Automatically adjust HVAC based on solar production",
      "potential_savings": "10-15% on heating/cooling costs"
    }
  ]
}
```

---

## 🌤️ Weather Integration Tool

### Description
Advanced weather monitoring and automation suggestions for smart home optimization based on weather conditions.

### Parameters
```typescript
{
  action: 'current' | 'forecast' | 'alerts' | 'history' | 'air_quality' | 'automation_suggestions',
  entity_id?: string,
  days?: number, // 1-14
  hours?: number, // 1-48
  start_time?: string,
  end_time?: string,
  location?: {
    latitude: number,
    longitude: number
  }
}
```

### Actions

#### `current`
Get current weather conditions and air quality.

**Example Response:**
```json
{
  "success": true,
  "current": {
    "temperature": 22.5,
    "humidity": 65,
    "pressure": 1013.25,
    "wind_speed": 12.5,
    "condition": "partly_cloudy",
    "air_quality": {
      "aqi": 45,
      "category": "good",
      "pm25": 12.3,
      "pm10": 25.1
    }
  }
}
```

#### `automation_suggestions`
Get weather-based automation suggestions for your smart home.

**Example Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "weather_condition": "rain",
      "automation": "Close windows and adjust HVAC",
      "priority": "high",
      "entities": ["cover.window_living_room", "climate.living_room"]
    },
    {
      "weather_condition": "high_wind",
      "automation": "Secure outdoor furniture and close garage",
      "priority": "medium",
      "entities": ["cover.garage_door", "switch.outdoor_lights"]
    }
  ]
}
```

---

## 🌐 Network Monitoring Tool

### Description
Network device monitoring and security management for comprehensive network oversight.

### Parameters
```typescript
{
  action: 'list_devices' | 'device_info' | 'speed_test' | 'network_health' | 'data_usage' | 'security_scan',
  device_mac?: string,
  entity_id?: string,
  period?: 'hour' | 'day' | 'week' | 'month',
  include_offline?: boolean
}
```

### Actions

#### `network_health`
Assess overall network health and performance.

**Example Response:**
```json
{
  "success": true,
  "network_health": {
    "overall_score": 87,
    "status": "good",
    "metrics": {
      "bandwidth_utilization": 45,
      "latency": 12,
      "packet_loss": 0.1,
      "device_count": 23,
      "security_score": 92
    },
    "recommendations": [
      "Consider upgrading router firmware for better security",
      "Monitor device '192.168.1.45' for unusual activity"
    ]
  }
}
```

#### `security_scan`
Scan network for security vulnerabilities and unknown devices.

**Example Response:**
```json
{
  "success": true,
  "security_scan": {
    "unknown_devices": [
      {
        "mac": "00:11:22:33:44:55",
        "ip": "192.168.1.100",
        "first_seen": "2024-01-15T10:30:00Z",
        "risk_level": "medium"
      }
    ],
    "vulnerabilities": [
      {
        "device": "192.168.1.1",
        "type": "outdated_firmware",
        "severity": "high",
        "recommendation": "Update router firmware to latest version"
      }
    ],
    "overall_security_score": 85
  }
}
```

---

## 💾 Backup Management Tool

### Description
Comprehensive backup and restore management with automated scheduling and cloud storage support.

### Parameters
```typescript
{
  action: 'create' | 'list' | 'restore' | 'delete' | 'download' | 'upload' | 'schedule' | 'statistics',
  backup_id?: string,
  config?: {
    name: string,
    password?: string,
    compressed?: boolean,
    location?: 'local' | 'cloud',
    addons?: string[],
    folders?: string[]
  },
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly',
    time?: string, // HH:MM:SS
    retention_days?: number,
    auto_cleanup?: boolean
  }
}
```

### Actions

#### `schedule`
Set up automated backup scheduling.

**Example Response:**
```json
{
  "success": true,
  "schedule": {
    "frequency": "daily",
    "time": "02:00:00",
    "retention_days": 30,
    "auto_cleanup": true,
    "next_backup": "2024-01-16T02:00:00Z",
    "status": "active"
  }
}
```

#### `statistics`
Get comprehensive backup statistics and history.

**Example Response:**
```json
{
  "success": true,
  "statistics": {
    "total_backups": 45,
    "total_size": "2.3 GB",
    "success_rate": 98.2,
    "last_backup": "2024-01-15T02:00:00Z",
    "next_scheduled": "2024-01-16T02:00:00Z",
    "storage_usage": {
      "local": "1.8 GB",
      "cloud": "500 MB"
    }
  }
}
```

---

## 🔄 Error Recovery Tool

### Description
Advanced error recovery and system health management with intelligent error detection and automated recovery strategies.

### Parameters
```typescript
{
  action: 'get_statistics' | 'clear_history' | 'reset_attempts' | 'test_recovery',
  operation?: string,
  strategy_id?: string
}
```

### Actions

#### `get_statistics`
Get comprehensive error recovery statistics and history.

**Example Response:**
```json
{
  "success": true,
  "statistics": {
    "total_errors": 23,
    "recovered_errors": 21,
    "recovery_rate": 91.3,
    "average_recovery_time": "2.3s",
    "active_strategies": 5,
    "error_history": [
      {
        "operation": "energy_management",
        "error_type": "connection_timeout",
        "occurrences": 3,
        "last_occurrence": "2024-01-15T14:30:00Z",
        "recovery_successful": true
      }
    ]
  }
}
```

---

## 📊 System Health Tool

### Description
Comprehensive system health monitoring and diagnostics with proactive recommendations.

### Parameters
```typescript
{
  action: 'overall_health' | 'performance_metrics' | 'integration_status' | 'recommendations',
  include_details?: boolean
}
```

### Actions

#### `overall_health`
Get comprehensive system health assessment with scoring.

**Example Response:**
```json
{
  "success": true,
  "overall_health": {
    "score": 87,
    "status": "good",
    "components": {
      "network": "operational",
      "energy": "operational",
      "weather": "operational",
      "backups": "operational",
      "error_recovery": "operational"
    },
    "last_check": "2024-01-15T15:00:00Z",
    "trends": {
      "score_change": "+2",
      "trend": "improving"
    }
  }
}
```

#### `recommendations`
Get proactive optimization recommendations.

**Example Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "priority": "high",
      "category": "performance",
      "description": "Database query optimization needed",
      "impact": "Improve response times by 15-20%",
      "action": "Review and optimize database queries in energy management"
    },
    {
      "priority": "medium",
      "category": "security",
      "description": "Update authentication tokens",
      "impact": "Enhance security posture",
      "action": "Rotate API tokens every 90 days"
    }
  ]
}
```

---

## ✅ System Validation Tool

### Description
Validate Home Assistant MCP system functionality and connectivity.

### Parameters
```typescript
{
  action: 'validate_connection' | 'check_tools' | 'system_status'
}
```

### Actions

#### `check_tools`
Verify all enhanced tools are working correctly.

**Example Response:**
```json
{
  "success": true,
  "enhanced_tools": [
    'energy_management',
    'weather_integration',
    'network_monitoring',
    'backup_management',
    'error_recovery',
    'system_health',
    'system_validation'
  ],
  "total_enhanced_tools": 7,
  "status": "All enhanced tools loaded successfully",
  "tool_status": {
    "energy_management": "operational",
    "weather_integration": "operational",
    "network_monitoring": "operational",
    "backup_management": "operational",
    "error_recovery": "operational",
    "system_health": "operational",
    "system_validation": "operational"
  }
}
```

---

## 🔐 Authentication

All enhanced tools require proper authentication using Home Assistant long-lived access tokens.

### Headers
```http
Authorization: Bearer YOUR_LONG_LIVED_ACCESS_TOKEN
Content-Type: application/json
```

### Token Requirements
- Must have appropriate permissions for the entities being accessed
- Should be a long-lived access token (not session tokens)
- Must be valid and not expired

---

## ⚠️ Error Handling

All enhanced tools return consistent error responses:

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "additional_info": "Extra context"
    }
  }
}
```

### Common Error Codes
- `AUTHENTICATION_FAILED`: Invalid or expired token
- `PERMISSION_DENIED`: Insufficient permissions
- `ENTITY_NOT_FOUND`: Requested entity doesn't exist
- `SERVICE_UNAVAILABLE`: Home Assistant service unavailable
- `VALIDATION_ERROR`: Invalid parameters provided
- `RATE_LIMIT_EXCEEDED`: Too many requests

---

## 📝 Examples

### Complete Workflow Example

#### 1. Check System Health
```bash
curl -X POST http://localhost:3000/api/system_health \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action": "overall_health"}'
```

#### 2. Get Energy Optimization Suggestions
```bash
curl -X POST http://localhost:3000/api/energy_management \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action": "get_optimization_suggestions"}'
```

#### 3. Schedule Daily Backups
```bash
curl -X POST http://localhost:3000/api/backup_management \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "action": "schedule",
    "schedule": {
      "frequency": "daily",
      "time": "02:00:00",
      "retention_days": 30,
      "auto_cleanup": true
    }
  }'
```

#### 4. Monitor Network Security
```bash
curl -X POST http://localhost:3000/api/network_monitoring \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action": "security_scan"}'
```

---

## 🚀 Getting Started

1. **Ensure Home Assistant is running** and accessible
2. **Generate a long-lived access token** in Home Assistant
3. **Test basic connectivity** using the `system_validation` tool
4. **Explore enhanced tools** through the interactive API documentation at `/api-docs`
5. **Monitor system health** regularly using the `system_health` tool

## 📚 Additional Resources

- [Home Assistant REST API Documentation](https://developers.home-assistant.io/docs/api/rest)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [Interactive API Documentation](http://localhost:3000/api-docs) (when server is running)

---

*This enhanced MCP server transforms your Home Assistant instance into a comprehensive, enterprise-grade smart home automation platform.* 🏠✨
