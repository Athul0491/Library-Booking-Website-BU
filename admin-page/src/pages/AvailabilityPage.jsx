// Room Availability Management page - Control time slot open status with real API integration
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
import { useConnection } from '../contexts/ConnectionContext';
import { useDataSource } from '../contexts/DataSourceContext';
import bookingService from '../services/bookingService';
import { 
  ConnectionStatus, 
  TableSkeleton, 
  DataUnavailablePlaceholder,
  PageLoadingSkeleton 
} from '../components/SkeletonComponents';

const { Title, Paragraph } = Typography;
const { Option } = Select;

/**
 * Room Availability Management page component
 * Used for managing room time slot availability with real API integration
 */
const AvailabilityPage = () => {
  const connection = useConnection();
  const { useRealData } = useDataSource();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedLibrary, setSelectedLibrary] = useState('par'); // Default to Pardee Library
  const [realTimeSlots, setRealTimeSlots] = useState([]);

  // Library codes
  const LIBRARY_CODES = {
    'mug': { name: 'Mugar Memorial Library', code: 'mug' },
    'par': { name: 'Pardee Library', code: 'par' },
    'pic': { name: 'Pickering Educational Resources Library', code: 'pic' },
    'sci': { name: 'Science & Engineering Library', code: 'sci' }
  };

  // Load real time slots data
  const loadRealTimeSlots = async () => {
    // Check if we should use mock data or if real data is unavailable
    if (!useRealData || !connection.isDataAvailable) {
      loadMockTimeSlots();
      return;
    }

    try {
      setLoading(true);
      
      // Use the new booking service to get room availability
      const dateString = selectedDate.format('YYYY-MM-DD');
      const result = await bookingService.getRoomAvailability(selectedLibrary, dateString);
      
      if (result.success) {
        // Transform the data for display
        const slots = result.data.slots || [];
        const transformedSlots = slots.map((slot, index) => ({
          id: slot.itemId || `slot_${index}`,
          time: `${slot.start || '09:00'} - ${slot.end || '10:00'}`,
          room: `Room ${slot.itemId || index}`,
          status: slot.available ? 'available' : 'booked',
          capacity: 4 + Math.floor(Math.random() * 5), // Mock capacity
          itemId: slot.itemId,
          checksum: slot.checksum
        }));
        
        setRealTimeSlots(transformedSlots);
        
        if (result.isMockData) {
          message.info('Using demo data - backend connection unavailable');
        } else {
          message.success(`Loaded ${transformedSlots.length} time slots for ${LIBRARY_CODES[selectedLibrary].name}`);
        }
      } else {
        message.error(result.error || 'Failed to load availability data');
        setRealTimeSlots([]);
      }
    } catch (error) {
      console.error('Failed to load time slot data:', error);
      message.error('Failed to load time slot data');
      setRealTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // Load mock time slots data
  const loadMockTimeSlots = () => {
    setLoading(true);
    
    // Simulate loading delay
    setTimeout(() => {
      const mockSlots = [
        { id: 'mock_1', time: '08:00 - 09:00', room: 'Room A101', status: 'available', capacity: 6 },
        { id: 'mock_2', time: '09:00 - 10:00', room: 'Room A102', status: 'booked', capacity: 4 },
        { id: 'mock_3', time: '10:00 - 11:00', room: 'Room A103', status: 'available', capacity: 8 },
        { id: 'mock_4', time: '11:00 - 12:00', room: 'Room A104', status: 'available', capacity: 5 },
        { id: 'mock_5', time: '12:00 - 13:00', room: 'Room A105', status: 'booked', capacity: 6 },
        { id: 'mock_6', time: '13:00 - 14:00', room: 'Room A106', status: 'available', capacity: 4 },
        { id: 'mock_7', time: '14:00 - 15:00', room: 'Room A107', status: 'booked', capacity: 7 },
        { id: 'mock_8', time: '15:00 - 16:00', room: 'Room A108', status: 'available', capacity: 5 }
      ];
      
      setRealTimeSlots(mockSlots);
      message.info(`Using mock demo data for ${LIBRARY_CODES[selectedLibrary].name}`);
      setLoading(false);
    }, 800);
  };

  // Load data when connection is available and params change
  useEffect(() => {
    if (selectedLibrary && selectedDate) {
      loadRealTimeSlots();
    }
  }, [selectedDate, selectedLibrary, connection.isDataAvailable, useRealData]);

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
      <Title level={2}>Room Availability Management</Title>
      <Paragraph>
        Manage library room time slot availability with real-time BU LibCal system data integration.
      </Paragraph>

      {/* Connection Status */}
      <ConnectionStatus connection={connection} style={{ marginBottom: 24 }} />

      {/* Loading State */}
      {connection.loading && <PageLoadingSkeleton />}

      {/* No Connection State */}
      {!connection.loading && !connection.isDataAvailable && (
        <DataUnavailablePlaceholder 
          title="Availability Data Unavailable"
          description="Cannot connect to the availability service. Please check your connection and try again."
          onRetry={() => connection.refreshConnections()}
        />
      )}

      {/* Normal Data Display */}
      {!connection.loading && connection.isDataAvailable && (
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
      )}
    </div>
  );
};

export default AvailabilityPage;
