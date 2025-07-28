// Availability Management page - Control time slot open status with real API integration
import React, { useState, useEffect } from 'react';
import {
  Card,
  Calendar,
  Button,
  Space,
  Select,
  message,
  Typography,
  Badge,
  List,
  Row,
  Col,
  Tag,
  Alert,
  Spin
} from 'antd';
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
  ApiOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import apiService, { LIBRARY_CODES } from '../services/apiService';

const { Title, Paragraph } = Typography;
const { Option } = Select;

/**
 * Availability Management page component
 * Used for managing room time slot availability with real API integration
 */
const AvailabilityPage = () => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedLibrary, setSelectedLibrary] = useState('par'); // Default to Pardee Library
  const [realTimeSlots, setRealTimeSlots] = useState([]);
  const [serverStatus, setServerStatus] = useState(null);

  // Load data when component mounts
  useEffect(() => {
    checkServerStatus();
  }, []);

  // When selected Date or Library changes, load real time slot data
  useEffect(() => {
    if (selectedLibrary && selectedDate) {
      loadRealTimeSlots();
    }
  }, [selectedDate, selectedLibrary]);

  // Check backend server status
  const checkServerStatus = async () => {
    const status = await apiService.checkServerStatus();
    setServerStatus(status);
    if (!status.online) {
      message.warning('Backend server not connected, showing mock data');
    }
  };

  // Load real time slots from backend API
  const loadRealTimeSlots = async () => {
    try {
      setLoading(true);
      
      const params = {
        library: selectedLibrary,
        start: selectedDate.format('YYYY-MM-DD'),
        end: selectedDate.format('YYYY-MM-DD'),
        start_time: '08:00',
        end_time: '22:00'
      };

      const result = await apiService.getAvailability(params);
      
      if (result.success) {
        const formattedSlots = apiService.formatSlots(result.data.slots || []);
        setRealTimeSlots(formattedSlots);
        
        if (result.isMockData) {
          message.info(`Loaded ${formattedSlots.length} mock time slots (backend server not connected)`);
        } else {
          message.success(`Successfully loaded ${formattedSlots.length} time slots`);
        }
      } else {
        message.error(`Loading failed: ${result.error}`);
        // If API fails, show mock data
        loadMockTimeSlots();
      }
    } catch (error) {
      message.error('Failed to load time slot data');
      console.error('Failed to load time slot data:', error);
      // If API fails, show mock data
      loadMockTimeSlots();
    } finally {
      setLoading(false);
    }
  };

  // Fallback mock data
  const loadMockTimeSlots = () => {
    const mockTimeSlots = [
      {
        id: 1,
        startTime: '2025-07-27 08:00:00',
        endTime: '2025-07-27 09:00:00',
        duration: 60,
        available: true,
        itemId: 168796,
      },
      {
        id: 2,
        startTime: '2025-07-27 09:00:00',
        endTime: '2025-07-27 10:00:00',
        duration: 60,
        available: true,
        itemId: 168797,
      },
      {
        id: 3,
        startTime: '2025-07-27 10:00:00',
        endTime: '2025-07-27 11:00:00',
        duration: 60,
        available: false,
        itemId: 168798,
      },
    ];
    setRealTimeSlots(mockTimeSlots);
  };

  // Get date display content (for calendar)
  const getCellRender = (current, info) => {
    const date = current.format('YYYY-MM-DD');
    const today = dayjs().format('YYYY-MM-DD');
    
    if (date === today) {
      return <Badge status="processing" text="Today" />;
    }
    
    return null;
  };

  return (
    <div>
      <Title level={2}>Availability Management</Title>
      <Paragraph>
        Manage library room time slot availability with real-time BU LibCal system data integration.
      </Paragraph>

      {/* Server Status Alert */}
      {serverStatus && (
        <Alert
          message={
            <Space>
              <ApiOutlined />
              {serverStatus.online ? 'Backend Server Connected' : 'Backend Server Disconnected'}
            </Space>
          }
          description={serverStatus.message}
          type={serverStatus.online ? 'success' : 'warning'}
          style={{ marginBottom: 16 }}
          action={
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={checkServerStatus}
            >
              Recheck
            </Button>
          }
        />
      )}

      <Row gutter={[16, 16]}>
        {/* Left Side: Calendar */}
        <Col xs={24} lg={14}>
          <Card title="Select Date">
            <Calendar
              value={selectedDate}
              onSelect={setSelectedDate}
              cellRender={getCellRender}
              headerRender={({ value, type, onChange, onTypeChange }) => (
                <div style={{ padding: 8 }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Title level={4}>
                        {value.format('YYYY/MM')}
                      </Title>
                    </Col>
                    <Col>
                      <Space>
                        <Button onClick={() => onChange(value.subtract(1, 'month'))}>
                          Previous Month
                        </Button>
                        <Button onClick={() => onChange(dayjs())}>
                          Today
                        </Button>
                        <Button onClick={() => onChange(value.add(1, 'month'))}>
                          Next Month
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                </div>
              )}
            />
          </Card>
        </Col>

        {/* Right：Library Selection and Time slot Management */}
        <Col xs={24} lg={10}>
          <Card
            title="Library and Time Slot Settings"
            extra={
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={loadRealTimeSlots}
                loading={loading}
              >
                Refresh Data
              </Button>
            }
          >
            {/* Library Selection */}
            <div style={{ marginBottom: 16 }}>
              <Select
                placeholder="Select Library"
                style={{ width: '100%' }}
                value={selectedLibrary}
                onChange={setSelectedLibrary}
              >
                {Object.entries(LIBRARY_CODES).map(([code, library]) => (
                  <Option key={code} value={code}>
                    <Space>
                      <EnvironmentOutlined />
                      {library.name}
                    </Space>
                  </Option>
                ))}
              </Select>
            </div>

            {/* Date and Library Info */}
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
              <div><strong>Selected Date:</strong> {selectedDate.format('YYYY-MM-DD')}</div>
              <div><strong>Selected Library:</strong> {LIBRARY_CODES[selectedLibrary]?.name}</div>
              <div><strong>Time Slots Count:</strong> {realTimeSlots.length}</div>
            </div>

            {/* Time Slots List */}
            <Spin spinning={loading}>
              <List
                dataSource={realTimeSlots}
                locale={{ emptyText: 'No available time slots' }}
                renderItem={(slot) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <ClockCircleOutlined />
                          <span>
                            {dayjs(slot.startTime).format('HH:mm')} - {dayjs(slot.endTime).format('HH:mm')}
                          </span>
                          <Tag color={slot.available ? 'green' : 'red'}>
                            {slot.available ? 'Available' : 'Unavailable'}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <div>Duration: {slot.duration} minutes</div>
                          <div>Item ID: {slot.itemId}</div>
                          {slot.checksum && (
                            <div style={{ fontSize: '12px', color: '#999' }}>
                              Checksum: {slot.checksum}
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AvailabilityPage;
