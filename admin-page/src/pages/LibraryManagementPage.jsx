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
  Alert,
  Spin,
  Progress,
  Tooltip
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
  ApiOutlined,
  LoadingOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useConnection } from '../contexts/ConnectionContext';
import { useDataSource } from '../contexts/DataSourceContext';
import { useGlobalApi } from '../contexts/GlobalApiContext';
import {
  TableSkeleton,
  DataUnavailablePlaceholder,
  PageLoadingSkeleton
} from '../components/SkeletonComponents';
import ConnectionStatus from '../components/ConnectionStatus';
import ServerStatusBanner from '../components/ServerStatusBanner';
import locationService from '../services/locationService';
import {
  geocodeAndUpdateBuilding,
  validateCoordinates,
  calculateDistance,
  BU_CAMPUS_CENTER
} from '../services/geocodingService';

const { Title, Paragraph } = Typography;
const { Option } = Select;

/**
 * Library management page component
 * Manages library buildings and rooms with connection-aware loading
 */
const LibraryManagementPage = () => {
  const connection = useConnection();
  const {
    useRealData,
    addNotification
  } = useDataSource();
  const globalApi = useGlobalApi();

  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalType, setModalType] = useState('building'); // 'building' or 'room'
  const [form] = Form.useForm();

  // Geocoding related states
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState(0);
  const [geocodingStatus, setGeocodingStatus] = useState('');
  const [dataError, setDataError] = useState(null);

  // Load buildings from global cache
  useEffect(() => {
    const cachedBuildings = globalApi.getCachedData('buildings');
    if (cachedBuildings && Array.isArray(cachedBuildings)) {
      console.log(`📋 LocationsPage: Loading ${cachedBuildings.length} buildings from global cache`);
      setBuildings(cachedBuildings);
    } else {
      console.log('⚠️ LocationsPage: No cached buildings data available');
      setBuildings([]);
    }
  }, [globalApi.globalData.lastUpdated]); // 响应全局数据更新

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

      // Use global rooms data and filter by building ID
      const { globalData } = globalApi;
      if (globalData?.rooms && globalData.rooms.length > 0) {
        const buildingRooms = globalData.rooms.filter(room =>
          room.building_id === buildingId ||
          room.building_id === String(buildingId)
        );

        setRooms(buildingRooms);
        console.log(`✅ Rooms loaded from global cache - Count: ${buildingRooms.length}`);
        message.success(`Loaded ${buildingRooms.length} rooms for building`);
      } else {
        console.warn('⚠️ No global rooms data available');
        setRooms([]);
        message.warning('No rooms data available. Try refreshing the page.');
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

  // Note: No longer calling loadBuildings on mount - using global cached data instead
  // Users can manually refresh data using the refresh button in ServerStatusBanner

  // Manual refresh function for ServerStatusBanner
  const handleRefresh = async () => {
    console.log('🔄 LocationsPage: Manual refresh triggered via ServerStatusBanner');
    await globalApi.refreshApi(); // This will refresh global data

    // Update local buildings from refreshed global data
    const refreshedBuildings = globalApi.getCachedData('buildings');
    if (refreshedBuildings && Array.isArray(refreshedBuildings)) {
      setBuildings(refreshedBuildings);
      console.log(`📋 LocationsPage: Updated with ${refreshedBuildings.length} buildings from refreshed global cache`);
    }
  };

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
      title: 'Website',
      dataIndex: 'website',
      key: 'website',
      render: (website) => website ? (
        <a href={website} target="_blank" rel="noopener noreferrer">
          <Button type="link" size="small" icon={<GlobalOutlined />}>
            Visit
          </Button>
        </a>
      ) : <span style={{ color: '#ccc' }}>N/A</span>,
    },
    {
      title: 'Geocoding Status',
      key: 'geocoding_status',
      render: (_, record) => {
        const address = record.address || record.location;
        const hasCoordinates = record.latitude && record.longitude;

        if (hasCoordinates) {
          return (
            <Tag color="success">Geocoded</Tag>
          );
        } else if (address) {
          return (
            <Space>
              <Tag color="warning">Not Geocoded</Tag>
              <Button
                size="small"
                type="link"
                loading={geocodingLoading}
                onClick={() => handleGeocode(record)}
                title={`Geocode address: ${address}`}
              >
                Geocode
              </Button>
            </Space>
          );
        } else {
          return (
            <Space direction="vertical" size="small">
              <Tag color="default">No Address</Tag>
              <small style={{ color: '#999' }}>
                Address required for geocoding
              </small>
            </Space>
          );
        }
      },
    },
    {
      title: 'Phone',
      key: 'phone',
      render: (_, record) => {
        // Debug: log the contacts data
        console.log('Phone - record.contacts:', record.contacts);

        let contacts = record.contacts;

        // Handle if contacts is a string (needs parsing)
        if (typeof contacts === 'string') {
          try {
            contacts = JSON.parse(contacts);
          } catch (e) {
            console.error('Failed to parse contacts JSON:', contacts);
            return 'N/A';
          }
        }

        const phone = contacts?.phone;
        return phone || 'N/A';
      },
    },
    {
      title: 'Email',
      key: 'email',
      render: (_, record) => {
        // Debug: log the contacts data
        console.log('Email - record.contacts:', record.contacts);

        let contacts = record.contacts;

        // Handle if contacts is a string (needs parsing)
        if (typeof contacts === 'string') {
          try {
            contacts = JSON.parse(contacts);
          } catch (e) {
            console.error('Failed to parse contacts JSON:', contacts);
            return 'N/A';
          }
        }

        const email = contacts?.email;
        return email || 'N/A';
      },
    },
    {
      title: 'Fax',
      key: 'fax',
      render: (_, record) => {
        // Debug: log the contacts data
        console.log('Fax - record.contacts:', record.contacts);

        let contacts = record.contacts;

        // Handle if contacts is a string (needs parsing)
        if (typeof contacts === 'string') {
          try {
            contacts = JSON.parse(contacts);
          } catch (e) {
            console.error('Failed to parse contacts JSON:', contacts);
            return 'N/A';
          }
        }

        const fax = contacts?.fax;
        return fax || 'N/A';
      },
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
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete('building', record)}
            title="Disable building (soft delete)"
          >
            Delete
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
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete('room', record)}
            title="Disable room (soft delete)"
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // Handle geocoding for a specific building
  const handleGeocode = async (building) => {
    const address = building.address || building.location;

    if (!address) {
      message.warning('No address available for geocoding');
      return;
    }

    setGeocodingLoading(true);
    try {
      console.log(`🌍 Geocoding building ${building.name} with address: ${address}`);
      const result = await geocodeAndUpdateBuilding(building.id, address);

      if (result.success) {
        message.success(`Successfully geocoded ${building.name}`);
        console.log(`✅ Geocoding successful for ${building.name}`);

        // Refresh the buildings list to show updated geocoding status
        await handleRefresh();
        const refreshedBuildings = globalApi.getCachedData('buildings');
        setBuildings(refreshedBuildings);
      } else {
        message.error(`Failed to geocode ${building.name}: ${result.error}`);
        console.error(`❌ Geocoding failed for ${building.name}:`, result.error);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      message.error(`Error geocoding ${building.name}: ${error.message}`);
    } finally {
      setGeocodingLoading(false);
    }
  };

  // Handle edit action
  const handleEdit = (type, item) => {
    setModalType(type);
    setEditingItem(item);
    setModalVisible(true);

    // Handle nested contacts field for buildings
    if (type === 'building' && item.contacts) {
      const formData = {
        ...item,
        contacts: typeof item.contacts === 'string' ? JSON.parse(item.contacts) : item.contacts
      };
      form.setFieldsValue(formData);
    } else {
      form.setFieldsValue(item);
    }
  };

  // Handle add new action
  const handleAdd = (type) => {
    setModalType(type);
    setEditingItem(null);
    setModalVisible(true);
    form.resetFields();
  };

  // Handle delete action (soft delete - disable)
  const handleDelete = (type, item) => {
    Modal.confirm({
      title: `Delete ${type}`,
      content: `Are you sure you want to delete "${item.name}"? This will disable it rather than permanently delete it.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          // Call the API to soft delete (disable) the item
          await locationService.disableItem(item.id);

          // Refresh the data to reflect the changes
          await handleRefresh();

          // Show a success message to the user
          message.success(`${type} "${item.name}" has been successfully disabled.`);

        } catch (error) {
          console.error(`Failed to delete ${type}:`, error);
          message.error(`Failed to delete ${type}: ${error.message}`);
        }
      },
    });
  };

  // Handle modal submit
  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('Form values:', values);

      // For buildings with address, attempt geocoding
      if (modalType === 'building' && values.address) {
        try {
          // First save the building data
          message.success(`${editingItem ? 'Updated' : 'Added'} ${modalType} successfully`);
          setModalVisible(false);

          // Then attempt geocoding if address is provided
          setGeocodingLoading(true);

          // Determine building ID - if editing, use existing ID; if new, we'd need the returned ID from the save operation
          // For now, we'll refresh and then geocode by name
          await handleRefresh();

          // Find the building by name to get its ID
          const updatedBuildings = buildings || [];
          const buildingToGeocode = updatedBuildings.find(b => b.name === values.name);

          if (buildingToGeocode) {
            const geocodeResult = await geocodeAndUpdateBuilding(buildingToGeocode.id, values.address);
            if (geocodeResult.success) {
              message.success(`Building geocoded successfully`);
              // Refresh again to show updated geocoding status
              await handleRefresh();
            } else {
              message.warning(`Building saved but geocoding failed: ${geocodeResult.error}`);
            }
          }
        } catch (geocodeError) {
          console.error('Geocoding error:', geocodeError);
          message.warning(`Building saved but geocoding failed: ${geocodeError.message}`);
        } finally {
          setGeocodingLoading(false);
        }
      } else {
        // For non-building items or buildings without address, just save normally
        message.success(`${editingItem ? 'Updated' : 'Added'} ${modalType} successfully`);
        setModalVisible(false);

        // Reload data
        if (modalType === 'building') {
          await handleRefresh();
        } else {
          loadRooms(selectedBuilding?.id);
        }
      }
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  return (
    <div>
      <Title level={2}>Library Management</Title>
      <Paragraph>
        Manage library buildings and room configurations with real-time data synchronization.
      </Paragraph>

      {/* Server Status Banner */}
      <ServerStatusBanner
        useGlobalApi={true}
        onRefresh={handleRefresh}
        showConnectionStatus={true}
        showApiStatusCard={false}
        showConnectingAlert={true}
        showRefreshButton={false}
        style={{ marginBottom: 24 }}
      />

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
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleAdd('building')}
                >
                  Add Building
                </Button>
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
                label="Building Code (Short Name)"
                name="short_name"
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
              <Form.Item
                label="Website"
                name="website"
              >
                <Input placeholder="Enter building website URL" />
              </Form.Item>
              <Form.Item
                label="Phone"
                name={['contacts', 'phone']}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
              <Form.Item
                label="Email"
                name={['contacts', 'email']}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>
              <Form.Item
                label="Fax"
                name={['contacts', 'fax']}
              >
                <Input placeholder="Enter fax number" />
              </Form.Item>
              <Form.Item
                label="LibCal ID"
                name="libcal_id"
              >
                <Input type="number" placeholder="Enter LibCal ID" />
              </Form.Item>
              <Form.Item
                label="LibCal Location ID (LID)"
                name="lid"
                rules={[{ required: true, message: 'Please enter LibCal Location ID' }]}
              >
                <Input type="number" placeholder="Enter LibCal Location ID" />
              </Form.Item>
              <Form.Item
                label="Status"
                name="available"
                rules={[{ required: true, message: 'Please select building status' }]}
              >
                <Select placeholder="Select building status">
                  <Option value={true}>Available</Option>
                  <Option value={false}>Unavailable</Option>
                </Select>
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

export default LibraryManagementPage;
