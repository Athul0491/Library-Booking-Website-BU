// Feature toggle configuration for controlling feature availability
export const FEATURE_FLAGS = {
  // 暂时禁用高消耗功能
  STATISTICS_PAGE: false,
  ADVANCED_ROOM_ANALYTICS: false,
  USER_ACTIVITY_TRACKING: false,
  EXPORT_FUNCTIONALITY: false,
  
  // 保留基础功能
  BASIC_DASHBOARD: true,
  ROOM_MANAGEMENT: true,
  BOOKING_MANAGEMENT: true
};

// 添加运行时检查
export const canUseFeature = (featureName) => {
  const isDevelopment = import.meta.env.MODE === 'development';
  const hasEnoughResources = import.meta.env.VITE_PREMIUM_MODE === 'true';
  
  // 开发环境全开（可以用于测试）
  if (isDevelopment && import.meta.env.VITE_ENABLE_ALL_FEATURES === 'true') {
    return true;
  }
  
  // 有资源时全开
  if (hasEnoughResources) {
    return true;
  }
  
  return FEATURE_FLAGS[featureName] || false;
};

export default FEATURE_FLAGS;
