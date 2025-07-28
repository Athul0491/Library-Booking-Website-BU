// Building and Room Management page with skeleton loading support
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Row,
  Col,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ApiOutlined
} from '@ant-design/icons';
import { useConnection } from '../contexts/ConnectionContext';
import { useDataSource } from '../contexts/DataSourceContext';
import { 
  TableSkeleton, 
  DataUnavailablePlaceholder,
  PageLoadingSkeleton 
} from '../components/SkeletonComponents';
import ConnectionStatus from '../components/ConnectionStatus';
import locationService from '../services/locationService';

const { Title, Paragraph } = Typography;
const { Option } = Select;

/**
 * Locations management page component
 * Manages buildings and rooms with connection-aware loading
 */
const LocationsPage = () => {
  const connection = useConnection();
  const { 
    useRealData, 
    addNotification 
  } = useDataSource();
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalType, setModalType] = useState('building'); // 'building' or 'room'
  const [form] = Form.useForm();
  const [dataError, setDataError] = useState(null);

  // Connection and API status states (similar to DashboardPage)
  const [isConnecting, setIsConnecting] = useState(false);
  const [apiStatus, setApiStatus] = useState('disconnected'); // 'connecting', 'connected', 'disconnected', 'error'
  const [connectionDetails, setConnectionDetails] = useState({
    backend: 'unknown',
    database: 'unknown',
    lastUpdated: null,
    responseTime: null
  });

  // Load buildings data with unified loading pattern
  const loadBuildings = async () => {
    const startTime = Date.now();
    
    try {
      setLoading(true);
      setDataError(null);
      setIsConnecting(true);
      setApiStatus('connecting');
      
      console.log('🏢 Loading buildings data...');
      
      // Always try to load real data first, fall back to mock if needed
      const result = await locationService.getAllBuildings();
      
      const responseTime = Date.now() - startTime;
      
      if (result.success) {
        // Handle different response structures: result.data, result.buildings, or result itself
        const buildingsData = result.data?.buildings || result.buildings || result.data || [];
        setBuildings(buildingsData);
        
        // Update connection status - SUCCESS
        setApiStatus('connected');
        setConnectionDetails({
          backend: 'healthy',
          database: 'connected',
          lastUpdated: new Date().toISOString(),
          responseTime: responseTime
        });
        
        // Log connection status instead of detailed data
        console.log(`✅ Buildings loaded - Status: SUCCESS, Count: ${buildingsData.length}`);
        console.log(`⏱️ Response time: ${responseTime}ms`);
        console.log('Buildings data structure:', buildingsData);
        
        if (result.isMockData || result.source === 'mock-data') {
          message.info('Using demo data - backend connection unavailable');
          // Add notification
          addNotification({
            type: 'info',
            title: 'Using Demo Data',
            message: 'Backend connection unavailable, displaying demo buildings data',
            timestamp: new Date().toISOString()
          });
        } else {
          message.success(`Loaded ${buildingsData.length} buildings`);
          // Add success notification
          addNotification({
            type: 'success',
            title: 'Buildings Data Loaded',
            message: `Successfully loaded ${buildingsData.length} buildings from backend`,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        throw new Error(result.error || 'Failed to load buildings');
      }
    } catch (error) {
      console.error('❌ Error loading buildings:', error);
      
      // Update connection status - ERROR
      setApiStatus('error');
      setConnectionDetails({
        backend: 'unhealthy',
        database: 'error',
        lastUpdated: new Date().toISOString(),
        responseTime: Date.now() - startTime
      });
      
      setDataError(error.message);
      message.error('Failed to load buildings data');
      setBuildings([]);
      
      // Add error notification
      addNotification({
        type: 'error',
        title: 'Buildings Loading Failed',
        message: `Failed to load buildings: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
      setIsConnecting(false);
    }
  };

  // Load rooms for selected building with unified loading pattern
  const loadRooms = async (buildingId) => {
    if (!buildingId) {
      console.log('⚠️ No building selected, skipping rooms load');
      return;
    }

    try {
      setLoading(true);
      setDataError(null);
      
      console.log(`🏠 Loading rooms for building ${buildingId}...`);
      
      // Always try to load real data first, fall back to mock if needed
      const result = await locationService.getRoomsByBuilding(buildingId);
      
      if (result.success) {
        setRooms(result.data?.rooms || []);
        
        // Log connection status instead of detailed data
        console.log(`✅ Rooms loaded - Count: ${result.data?.rooms?.length || 0}`);
        
        if (result.isMockData) {
          message.info('Using demo data - backend connection unavailable');
        } else {
          message.success(`Loaded ${result.data?.rooms?.length || 0} rooms for building`);
        }
      } else {
        throw new Error(result.error || 'Failed to load rooms');
      }
    } catch (error) {
      console.error('❌ Error loading rooms:', error);
      setDataError(error.message);
      message.error('Failed to load rooms data');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load when component mounts
  useEffect(() => {
    loadBuildings();
  }, []);

  // Note: Removed automatic reload when connection becomes available to reduce API calls
  // Users can manually refresh data using the refresh button if needed

  // Load rooms when building is selected
  useEffect(() => {
    if (selectedBuilding) {
      loadRooms(selectedBuilding.id);
    } else {
      setRooms([]);
    }
  }, [selectedBuilding]);

  // Building table columns (updated to match actual backend API response)
  const buildingColumns = [
    {
      title: 'Building Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <EnvironmentOutlined />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: 'Short Name',
      dataIndex: 'short_name',
      key: 'short_name',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (address) => address || 'N/A',
    },
    {
      title: 'Phone',
      dataIndex: ['contacts', 'phone'],
      key: 'phone',
      render: (phone) => phone || 'N/A',
    },
    {
      title: 'Email',
      dataIndex: ['contacts', 'email'],
      key: 'email',
      render: (email) => email || 'N/A',
    },
    {
      title: 'LibCal ID',
      dataIndex: 'libcal_id',
      key: 'libcal_id',
      render: (id) => id ? <Tag color="cyan">{id}</Tag> : <span style={{ color: '#ccc' }}>N/A</span>,
    },
    {
      title: 'Status',
      dataIndex: 'available',
      key: 'available',
      render: (available) => (
        <Tag color={available ? 'success' : 'default'}>
          {available ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small"
            onClick={() => setSelectedBuilding(record)}
          >
            View Rooms
          </Button>
          <Button 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEdit('building', record)}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  // Room table columns (updated for new database schema)
  const roomColumns = [
    {
      title: 'Room Name',
      dataIndex: 'room_name',
      key: 'room_name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Room Number',
      dataIndex: 'room_number',
      key: 'room_number',
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity) => <Tag color="blue">{capacity} people</Tag>,
    },
    {
      title: 'Equipment',
      dataIndex: 'equipment',
      key: 'equipment',
      render: (equipment) => {
        if (!equipment) return <span style={{ color: '#ccc' }}>None</span>;
        // Handle equipment as array or JSON string
        const equipmentArray = Array.isArray(equipment) ? equipment : 
                              typeof equipment === 'string' ? JSON.parse(equipment) : [];
        return (
          <Space wrap>
            {equipmentArray.map((item, index) => (
              <Tag key={index} color="purple">{item}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'available',
      key: 'available',
      render: (available) => (
        <Tag color={available ? 'green' : 'red'}>
          {available ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEdit('room', record)}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  // Handle edit action
  const handleEdit = (type, item) => {
    setModalType(type);
    setEditingItem(item);
    setModalVisible(true);
    form.setFieldsValue(item);
  };

  // Handle add new action
  const handleAdd = (type) => {
    setModalType(type);
    setEditingItem(null);
    setModalVisible(true);
    form.resetFields();
  };

  // Handle modal submit
  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('Form values:', values);
      message.success(`${editingItem ? 'Updated' : 'Added'} ${modalType} successfully`);
      setModalVisible(false);
      
      // Reload data
      if (modalType === 'building') {
        loadBuildings();
      } else {
        loadRooms(selectedBuilding?.id);
      }
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  return (
    <div>
      <Title level={2}>Building & Room Management</Title>
      <Paragraph>
        Manage library buildings and room configurations with real-time data synchronization.
      </Paragraph>

      {/* Connection Status */}
      <ConnectionStatus 
        showDetails={true} 
        compact={false} 
        style={{ marginBottom: 24 }}
        customStatus={{
          apiStatus: apiStatus,
          connectionDetails: connectionDetails,
          isConnecting: isConnecting
        }}
      />

      {/* API Connection Status Indicator */}
      {isConnecting && (
        <Alert
          message="Connecting to Location Service"
          description="Establishing connection to buildings and rooms data service..."
          type="info"
          showIcon
          icon={<ClockCircleOutlined spin />}
          style={{ marginBottom: 16 }}
        />
      )}
      
      {/* Real-time API Status */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Space>
              <Tag 
                color={
                  apiStatus === 'connected' ? 'success' : 
                  apiStatus === 'connecting' ? 'processing' : 
                  apiStatus === 'error' ? 'error' : 'default'
                }
                icon={
                  apiStatus === 'connected' ? <CheckCircleOutlined /> :
                  apiStatus === 'connecting' ? <ClockCircleOutlined spin /> :
                  apiStatus === 'error' ? <CloseCircleOutlined /> :
                  <ApiOutlined />
                }
              >
                {apiStatus === 'connected' ? 'API Connected' :
                 apiStatus === 'connecting' ? 'Connecting...' :
                 apiStatus === 'error' ? 'API Error' :
                 'Disconnected'}
              </Tag>
              <Tag color={connectionDetails.backend === 'healthy' ? 'success' : 'error'}>
                Backend: {connectionDetails.backend}
              </Tag>
              <Tag color={connectionDetails.database === 'connected' ? 'success' : 'error'}>
                Database: {connectionDetails.database}
              </Tag>
            </Space>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {connectionDetails.responseTime && `${connectionDetails.responseTime}ms`}
            {connectionDetails.lastUpdated && (
              <span style={{ marginLeft: 8 }}>
                Updated: {new Date(connectionDetails.lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {connection.loading && <PageLoadingSkeleton />}

      {/* Main Content - Always show, let services handle data availability */}
      {!connection.loading && (
        <Row gutter={[16, 16]}>
          {/* Buildings Section */}
          <Col span={24}>
            <Card
              title="Buildings"
              extra={
                <Space>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleAdd('building')}
                  >
                    Add Building
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={loadBuildings}
                    loading={loading}
                  >
                    Refresh
                  </Button>
                </Space>
              }
            >
              {loading ? (
                <TableSkeleton rows={5} columns={5} />
              ) : (
                <Table
                  dataSource={buildings}
                  columns={buildingColumns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  locale={{ emptyText: 'No buildings found' }}
                  onRow={(record) => ({
                    onClick: () => setSelectedBuilding(record),
                    style: { 
                      cursor: 'pointer',
                      backgroundColor: selectedBuilding?.id === record.id ? '#f0f7ff' : undefined
                    }
                  })}
                />
              )}
            </Card>
          </Col>

          {/* Rooms Section */}
          {selectedBuilding && (
            <Col span={24}>
              <Card
                title={`Rooms in ${selectedBuilding.name}`}
                extra={
                  <Space>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => handleAdd('room')}
                    >
                      Add Room
                    </Button>
                    <Button
                      onClick={() => setSelectedBuilding(null)}
                    >
                      Clear Selection
                    </Button>
                  </Space>
                }
              >
                {loading ? (
                  <TableSkeleton rows={5} columns={6} />
                ) : (
                  <Table
                    dataSource={rooms}
                    columns={roomColumns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: 'No rooms found in this building' }}
                  />
                )}
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* Edit/Add Modal */}
      <Modal
        title={`${editingItem ? 'Edit' : 'Add'} ${modalType === 'building' ? 'Building' : 'Room'}`}
        open={modalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          name={`${modalType}_form`}
        >
          {modalType === 'building' ? (
            <>
              <Form.Item
                label="Building Name"
                name="name"
                rules={[{ required: true, message: 'Please enter building name' }]}
              >
                <Input placeholder="Enter building name" />
              </Form.Item>
              <Form.Item
                label="Building Code"
                name="code"
                rules={[{ required: true, message: 'Please enter building code' }]}
              >
                <Input placeholder="Enter building code (e.g., MUG, PAR)" />
              </Form.Item>
              <Form.Item
                label="Address"
                name="address"
                rules={[{ required: true, message: 'Please enter building address' }]}
              >
                <Input.TextArea placeholder="Enter building address" />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                label="Room Name"
                name="name"
                rules={[{ required: true, message: 'Please enter room name' }]}
              >
                <Input placeholder="Enter room name" />
              </Form.Item>
              <Form.Item
                label="Room Number"
                name="roomNumber"
                rules={[{ required: true, message: 'Please enter room number' }]}
              >
                <Input placeholder="Enter room number" />
              </Form.Item>
              <Form.Item
                label="Capacity"
                name="capacity"
                rules={[{ required: true, message: 'Please enter room capacity' }]}
              >
                <Input type="number" placeholder="Enter room capacity" />
              </Form.Item>
              <Form.Item
                label="Status"
                name="available"
                rules={[{ required: true, message: 'Please select room status' }]}
              >
                <Select placeholder="Select room status">
                  <Option value={true}>Available</Option>
                  <Option value={false}>Unavailable</Option>
                </Select>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default LocationsPage;
