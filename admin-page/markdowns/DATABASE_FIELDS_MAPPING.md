# 🏗️ Buildings表字段映射

## 📊 实际数据库字段 (从CSV确认)

根据数据库导出的CSV文件，buildings表的实际字段为：

```csv
id,name,short_name,address,website,contacts,available,libcal_id,lid,created_at,updated_at,geocoding_status,geocoding_source,geocoding_accuracy,geocoded_at,latitude,longitude
```

## 🔄 字段映射说明

### ✅ **地理编码相关字段**

| 数据库字段 | 数据类型 | 说明 | 取值范围 |
|-----------|---------|------|---------|
| `latitude` | DECIMAL(10,8) | 纬度坐标 | 42.30 - 42.40 (波士顿地区) |
| `longitude` | DECIMAL(11,8) | 经度坐标 | -71.15 - -71.05 (波士顿地区) |
| `geocoded_at` | TIMESTAMP | 地理编码时间 | ISO 8601格式 |
| `geocoding_status` | VARCHAR(20) | 地理编码状态 | pending, success, failed, manual |
| `geocoding_source` | VARCHAR(50) | 地理编码来源 | nominatim, google, manual, fallback |
| `geocoding_accuracy` | VARCHAR(20) | 地理编码精度 | high, medium, low |

### ⚠️ **注意事项**

- ❌ **没有** `geocoding_confidence` 字段
- ✅ **有** `geocoding_accuracy` 字段
- 精度值基于Nominatim API的importance值动态设置：
  - confidence > 0.8 → accuracy = 'high'
  - confidence > 0.5 → accuracy = 'medium'  
  - confidence ≤ 0.5 → accuracy = 'low'

## 🔧 **已修复的问题**

1. **字段名错误**: `geocoding_confidence` → `geocoding_accuracy`
2. **动态精度设置**: 根据API confidence值设置accuracy
3. **完整字段覆盖**: 所有地理编码字段都会被正确更新

## 📋 **示例更新数据**

### 成功地理编码
```javascript
{
  latitude: 42.3352,
  longitude: -71.0997,
  geocoded_at: "2025-07-29T15:30:00.000Z",
  geocoding_status: "success",
  geocoding_source: "nominatim",
  geocoding_accuracy: "high"
}
```

### 失败地理编码 (使用fallback)
```javascript
{
  latitude: 42.35018,
  longitude: -71.10498,
  geocoded_at: "2025-07-29T15:30:00.000Z",
  geocoding_status: "failed",
  geocoding_source: "fallback",
  geocoding_accuracy: "low"
}
```

现在字段映射已经修正，地理编码应该能正常工作了！
