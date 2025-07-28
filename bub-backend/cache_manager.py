"""
缓存管理器 - 为BU图书馆预订系统提供智能缓存
支持内存和Redis缓存，自动失效策略
"""

import json
import time
from typing import Any, Optional, Dict, Union
from datetime import datetime, timedelta
import hashlib

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

class CacheManager:
    """智能缓存管理器，支持多级缓存和自动失效"""
    
    def __init__(self, redis_url: Optional[str] = None, default_ttl: int = 300):
        """
        初始化缓存管理器
        
        Args:
            redis_url: Redis连接URL，如果为None则使用内存缓存
            default_ttl: 默认缓存时间（秒），默认5分钟
        """
        self.default_ttl = default_ttl
        self.memory_cache = {}  # 内存缓存后备
        
        # 尝试连接Redis
        self.redis_client = None
        if redis_url and REDIS_AVAILABLE:
            try:
                self.redis_client = redis.from_url(redis_url, decode_responses=True)
                self.redis_client.ping()
                print("✅ Redis缓存已连接")
            except Exception as e:
                print(f"⚠️ Redis连接失败，使用内存缓存: {e}")
                self.redis_client = None
        else:
            print("📝 使用内存缓存")
    
    def _generate_key(self, prefix: str, params: Dict) -> str:
        """生成缓存键"""
        # 对参数进行排序以确保一致性
        sorted_params = json.dumps(params, sort_keys=True)
        param_hash = hashlib.md5(sorted_params.encode()).hexdigest()[:8]
        return f"bulib:{prefix}:{param_hash}"
    
    def get(self, key: str) -> Optional[Any]:
        """获取缓存数据"""
        try:
            # 先尝试Redis
            if self.redis_client:
                data = self.redis_client.get(key)
                if data:
                    return json.loads(data)
            
            # 回退到内存缓存
            if key in self.memory_cache:
                entry = self.memory_cache[key]
                if entry['expires_at'] > time.time():
                    return entry['data']
                else:
                    # 过期删除
                    del self.memory_cache[key]
            
            return None
        except Exception as e:
            print(f"缓存读取错误: {e}")
            return None
    
    def set(self, key: str, data: Any, ttl: Optional[int] = None) -> bool:
        """设置缓存数据"""
        ttl = ttl or self.default_ttl
        
        try:
            serialized_data = json.dumps(data)
            
            # 设置Redis缓存
            if self.redis_client:
                self.redis_client.setex(key, ttl, serialized_data)
            
            # 设置内存缓存（备份）
            self.memory_cache[key] = {
                'data': data,
                'expires_at': time.time() + ttl
            }
            
            return True
        except Exception as e:
            print(f"缓存写入错误: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """删除缓存"""
        try:
            # 删除Redis缓存
            if self.redis_client:
                self.redis_client.delete(key)
            
            # 删除内存缓存
            if key in self.memory_cache:
                del self.memory_cache[key]
            
            return True
        except Exception as e:
            print(f"缓存删除错误: {e}")
            return False
    
    def clear_pattern(self, pattern: str) -> int:
        """清除匹配模式的缓存"""
        deleted_count = 0
        
        try:
            # 清除Redis中匹配的键
            if self.redis_client:
                keys = self.redis_client.keys(pattern)
                if keys:
                    deleted_count += self.redis_client.delete(*keys)
            
            # 清除内存缓存中匹配的键
            memory_keys_to_delete = [k for k in self.memory_cache.keys() if pattern.replace('*', '') in k]
            for key in memory_keys_to_delete:
                del self.memory_cache[key]
                deleted_count += 1
            
            return deleted_count
        except Exception as e:
            print(f"批量缓存清除错误: {e}")
            return 0
    
    def get_cached_buildings(self, filters: Dict = None) -> Optional[Dict]:
        """获取缓存的建筑物数据"""
        filters = filters or {}
        key = self._generate_key("buildings", filters)
        return self.get(key)
    
    def cache_buildings(self, data: Dict, filters: Dict = None, ttl: int = 600) -> bool:
        """缓存建筑物数据（10分钟TTL）"""
        filters = filters or {}
        key = self._generate_key("buildings", filters)
        return self.set(key, data, ttl)
    
    def get_cached_rooms(self, building_id: Union[str, int], filters: Dict = None) -> Optional[Dict]:
        """获取缓存的房间数据"""
        filters = filters or {}
        filters['building_id'] = str(building_id)
        key = self._generate_key("rooms", filters)
        return self.get(key)
    
    def cache_rooms(self, building_id: Union[str, int], data: Dict, filters: Dict = None, ttl: int = 300) -> bool:
        """缓存房间数据（5分钟TTL）"""
        filters = filters or {}
        filters['building_id'] = str(building_id)
        key = self._generate_key("rooms", filters)
        return self.set(key, data, ttl)
    
    def get_cached_bookings(self, filters: Dict = None) -> Optional[Dict]:
        """获取缓存的预订数据"""
        filters = filters or {}
        key = self._generate_key("bookings", filters)
        return self.get(key)
    
    def cache_bookings(self, data: Dict, filters: Dict = None, ttl: int = 60) -> bool:
        """缓存预订数据（1分钟TTL - 较短因为数据变化频繁）"""
        filters = filters or {}
        key = self._generate_key("bookings", filters)
        return self.set(key, data, ttl)
    
    def invalidate_bookings(self) -> int:
        """失效所有预订相关缓存"""
        return self.clear_pattern("bulib:bookings:*")
    
    def invalidate_rooms(self, building_id: Union[str, int] = None) -> int:
        """失效房间缓存"""
        if building_id:
            pattern = f"bulib:rooms:*building_id*{building_id}*"
        else:
            pattern = "bulib:rooms:*"
        return self.clear_pattern(pattern)
    
    def invalidate_buildings(self) -> int:
        """失效建筑物缓存"""
        return self.clear_pattern("bulib:buildings:*")
    
    def get_stats(self) -> Dict:
        """获取缓存统计信息"""
        stats = {
            "cache_type": "redis" if self.redis_client else "memory",
            "memory_cache_size": len(self.memory_cache),
            "timestamp": datetime.now().isoformat()
        }
        
        if self.redis_client:
            try:
                info = self.redis_client.info()
                stats.update({
                    "redis_connected": True,
                    "redis_keys": info.get('db0', {}).get('keys', 0),
                    "redis_memory": info.get('used_memory_human', 'N/A')
                })
            except Exception as e:
                stats["redis_error"] = str(e)
        
        return stats
    
    def cleanup_expired(self) -> int:
        """清理过期的内存缓存"""
        current_time = time.time()
        expired_keys = [
            key for key, entry in self.memory_cache.items()
            if entry['expires_at'] <= current_time
        ]
        
        for key in expired_keys:
            del self.memory_cache[key]
        
        return len(expired_keys)

# 全局缓存实例
cache_manager = None

def get_cache_manager() -> CacheManager:
    """获取全局缓存管理器实例"""
    global cache_manager
    if cache_manager is None:
        # 在开发环境中不使用Redis，生产环境可以配置Redis URL
        redis_url = None  # 可以从环境变量读取: os.getenv('REDIS_URL')
        cache_manager = CacheManager(redis_url=redis_url)
    return cache_manager
