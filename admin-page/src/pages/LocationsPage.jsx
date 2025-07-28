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
  Col
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useConnection } from '../contexts/ConnectionContext';
import { useDataSource } from '../contexts/DataSourceContext';
import { 
  ConnectionStatus, 
  TableSkeleton, 
  DataUnavailablePlaceholder,
  PageLoadingSkeleton 
} from '../components/SkeletonComponents';
import locationService from '../services/locationService';

const { Title, Paragraph } = Typography;
const { Option } = Select;

/**
 * Locations management page component
 * Manages buildings and rooms with connection-aware loading
 */
const LocationsPage = () => {
  const connection = useConnection();
  const { useRealData } = useDataSource();
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalType, setModalType] = useState('building'); // 'building' or 'room'
  const [form] = Form.useForm();
  const [dataError, setDataError] = useState(null);

  // Load buildings data with proper data source handling
  const loadBuildings = async () => {
    try {
      setLoading(true);
      setDataError(null);
      
      // Use real data or mock data based on DataSource context
      const options = { forceUseMockData: !useRealData };
      const result = await locationService.getAllBuildings(options);
      
      if (result.success) {
        setBuildings(result.data?.buildings || []);
        message.success(`Loaded ${result.data?.buildings?.length || 0} buildings`);
      } else if (useRealData) {
        throw new Error(`Failed to load buildings: ${result.error}`);
      }
    } catch (error) {
      console.error('Error loading buildings:', error);
      if (useRealData) {
        setDataError(error.message);
        message.error('Failed to load buildings data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load rooms for selected building with proper data source handling
  const loadRooms = async (buildingId) => {
    if (!buildingId) {
      console.log('⚠️ No building selected, skipping rooms load');
      return;
    }

    try {
      setLoading(true);
      setDataError(null);
      
      // Use real data or mock data based on DataSource context
      const options = { forceUseMockData: !useRealData };
      const result = await locationService.getRoomsByBuilding(buildingId, options);
      
      if (result.success) {
        setRooms(result.data?.rooms || []);
        message.success(`Loaded ${result.data?.rooms?.length || 0} rooms for building`);
      } else if (useRealData) {
        throw new Error(`Failed to load rooms: ${result.error}`);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      if (useRealData) {
        setDataError(error.message);
        message.error('Failed to load rooms data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load data when connection is available
  useEffect(() => {
    if (connection.isDataAvailable) {
      loadBuildings();
    }
  }, [connection.isDataAvailable, useRealData]);

  // Load rooms when building is selected
  useEffect(() => {
    if (selectedBuilding) {
      loadRooms(selectedBuilding.id);
    } else {
      setRooms([]);
    }
  }, [selectedBuilding]);

  // Building table columns (updated for new database schema)
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
      title: 'Location/Address',
      dataIndex: 'address',
      key: 'address',
      render: (address) => address || 'N/A',
    },
    {
      title: 'Total Rooms',
      dataIndex: 'room_count',
      key: 'room_count',
      render: (count) => <Tag color="green">{count || 0} rooms</Tag>,
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
      <ConnectionStatus connection={connection} style={{ marginBottom: 24 }} />

      {/* Loading State */}
      {connection.loading && <PageLoadingSkeleton />}

      {/* No Connection State */}
      {!connection.loading && !connection.isDataAvailable && (
        <DataUnavailablePlaceholder 
          title="Location Data Unavailable"
          description="Cannot connect to the location service. Please check your connection and try again."
          onRetry={() => connection.refreshConnections()}
        />
      )}

      {/* Normal Data Display */}
      {!connection.loading && connection.isDataAvailable && (
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
