import '../assets/styles/mapSkeleton.css';

export default function MapSkeleton() {
    return (
        <div className="map-skeleton">
            <div className="map-skeleton-header">
                <div className="skeleton-title"></div>
                <div className="skeleton-subtitle"></div>
            </div>

            <div className="map-skeleton-container">
                {/* 地图区域骨架 */}
                <div className="skeleton-map-area">
                    <div className="skeleton-loading-text">
                        <div className="skeleton-spinner"></div>
                        <span>Loading library locations...</span>
                    </div>                    {/* 模拟地图瓦片网格 */}
                    <div className="skeleton-grid">
                        {Array.from({ length: 12 }).map((_, index) => (
                            <div key={index} className="skeleton-tile"></div>
                        ))}
                    </div>

                    {/* 不显示模拟标记，等待真实数据 */}
                </div>

                {/* 右下角控制按钮骨架 */}
                <div className="skeleton-controls">
                    <div className="skeleton-zoom-btn"></div>
                    <div className="skeleton-zoom-btn"></div>
                </div>
            </div>

            <div className="map-skeleton-footer">
                <div className="skeleton-status">
                    <div className="skeleton-dot"></div>
                    <div className="skeleton-status-text"></div>
                </div>
            </div>
        </div>
    );
}
