import React from 'react';
import { Result, Button, Typography, Space, Card, Row, Col } from 'antd';
import { BarChartOutlined, RocketOutlined, CheckCircleOutlined, DashboardOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const FeatureComingSoon = ({ 
  featureName = "Advanced Statistics", 
  description = "This feature is currently being optimized for better performance and will be available in a future update."
}) => {
  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div style={{ padding: '50px 24px', maxWidth: '800px', margin: '0 auto' }}>
      <Result
        icon={<BarChartOutlined style={{ color: '#1890ff' }} />}
        title={`${featureName} Coming Soon`}
        subTitle={description}
        extra={[
          <Button type="primary" key="dashboard" icon={<DashboardOutlined />} onClick={handleGoToDashboard}>
            Go to Dashboard
          </Button>,
          <Button key="back" onClick={handleGoBack}>
            Go Back
          </Button>
        ]}
      />
      
      <Row gutter={[16, 16]} style={{ marginTop: 32 }}>
        <Col span={24}>
          <Card>
            <Title level={4}>
              <RocketOutlined style={{ marginRight: 8, color: '#52c41a' }} />
              What's Coming in Statistics & Reports?
            </Title>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <span><strong>Comprehensive Booking Analytics:</strong> Detailed reports on room bookings, peak usage times, and booking patterns</span>
              </div>
              <div>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <span><strong>Room Utilization Statistics:</strong> Track room usage rates, identify popular rooms, and optimize space allocation</span>
              </div>
              <div>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <span><strong>User Activity Monitoring:</strong> Insights into user behavior, frequent users, and usage trends</span>
              </div>
              <div>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <span><strong>Export & Reporting:</strong> Generate PDF and Excel reports for administrative purposes</span>
              </div>
              <div>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <span><strong>Interactive Charts:</strong> Visual data representation with charts and graphs for better insights</span>
              </div>
            </Space>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card>
            <Title level={4}>Why is this feature temporarily unavailable?</Title>
            <Paragraph>
              We're optimizing the Statistics & Reports feature for better performance and resource efficiency. 
              This feature involves complex database queries and data processing that could impact system performance 
              on free hosting tiers.
            </Paragraph>
            <Paragraph>
              By temporarily disabling this feature, we ensure:
            </Paragraph>
            <ul>
              <li>Smooth performance for core booking functionality</li>
              <li>Efficient resource usage within free hosting limits</li>
              <li>System stability for all users</li>
              <li>Better user experience overall</li>
            </ul>
            <Paragraph>
              <strong>The feature will be re-enabled when we have optimized performance or upgraded to higher resource tiers.</strong>
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FeatureComingSoon;
