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
  const [modalGeocodingLoading, setModalGeocodingLoading] = useState(false);

  // Load buildings from global cache
  useEffect(() => {
    const cachedBuildings = globalApi.getCachedData('buildings');
    if (cachedBuildings && Array.isArray(cachedBuildings)) {
      setBuildings(cachedBuildings);
    } else {
      setBuildings([]);
    }
  }, [globalApi.globalData.lastUpdated]); // 响应全局数据更新

  // Load rooms for selected building with unified loading pattern
  const loadRooms = async (buildingId) => {
    if (!buildingId) {
      return;
    }

    try {
      setLoading(true);
      setDataError(null);

      // Use global rooms data and filter by building ID
      const { globalData } = globalApi;
      if (globalData?.rooms && globalData.rooms.length > 0) {
        const buildingRooms = globalData.rooms.filter(room =>
          room.building_id === buildingId ||
          room.building_id === String(buildingId)
        );

        setRooms(buildingRooms);
        message.success(`Loaded ${buildingRooms.length} rooms for building`);
      } else {
        setRooms([]);
        message.warning('No rooms data available. Try refreshing the page.');
      }
    } catch (error) {
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
    await globalApi.refreshApi(); // This will refresh global data

    // Update local buildings from refreshed global data
    const refreshedBuildings = globalApi.getCachedData('buildings');
    if (refreshedBuildings && Array.isArray(refreshedBuildings)) {
      setBuildings(refreshedBuildings);
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
        let contacts = record.contacts;

        // Handle if contacts is a string (needs parsing)
        if (typeof contacts === 'string') {
          try {
            contacts = JSON.parse(contacts);
          } catch (e) {
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
        let contacts = record.contacts;

        // Handle if contacts is a string (needs parsing)
        if (typeof contacts === 'string') {
          try {
            contacts = JSON.parse(contacts);
          } catch (e) {
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
        let contacts = record.contacts;

        // Handle if contacts is a string (needs parsing)
        if (typeof contacts === 'string') {
          try {
            contacts = JSON.parse(contacts);
          } catch (e) {
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

    console.log('🎯 [UI] Geocode button clicked:', {
      building: {
        id: building.id,
        name: building.name,
        address: address
      },
      timestamp: new Date().toISOString()
    });

    if (!address) {
      console.warn('⚠️ [UI] No address available for geocoding');
      message.warning('No address available for geocoding');
      return;
    }

    setGeocodingLoading(true);
    try {
      console.log('🚀 [UI] Starting geocoding process...');
      const result = await geocodeAndUpdateBuilding(building.id, address);

      console.log('🎉 [UI] Geocoding process completed:', result);

      if (result.success) {
        message.success(`Successfully geocoded ${building.name}`);
        console.log('✅ [UI] Success message shown, starting refresh...');

        // Wait a moment for database update to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Refresh the buildings list to show updated geocoding status
        console.log('🔄 [UI] Refreshing data...');
        await handleRefresh();
        console.log('✅ [UI] Data refresh completed');
      } else {
        console.error('❌ [UI] Geocoding failed:', result.error);
        message.error(`Failed to geocode ${building.name}: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('💥 [UI] Geocoding exception:', error);
      message.error(`Error geocoding ${building.name}: ${error.message}`);
    } finally {
      console.log('🏁 [UI] Geocoding process finished, clearing loading state');
      setGeocodingLoading(false);
    }
  };

  // Handle geocoding in modal form (fetch coordinates and update form fields)
  const handleModalGeocode = async () => {
    try {
      const addressValue = form.getFieldValue('address');

      if (!addressValue) {
        message.warning('Please enter an address first');
        return;
      }

      setModalGeocodingLoading(true);
      console.log('🎯 [MODAL] Starting OpenStreetMap geocoding for address:', addressValue);

      // Import geocoding service directly for coordinate fetching
      const { geocodeAddress } = await import('../services/geocodingService');

      const result = await geocodeAddress(addressValue);

      if (result && result.lat && result.lng) {
        // Calculate accuracy based on confidence and campus location
        let accuracy = 'low';
        if (result.is_campus_location && result.confidence > 0.7) {
          accuracy = 'high';
        } else if (result.confidence > 0.8) {
          accuracy = 'high';
        } else if (result.confidence > 0.5) {
          accuracy = 'medium';
        }

        // Update form fields with coordinates
        form.setFieldsValue({
          latitude: result.lat,
          longitude: result.lng,
          geocoding_status: 'success',
          geocoded_at: new Date().toISOString(),
          geocoding_source: 'nominatim',
          geocoding_accuracy: accuracy
        });

        // Enhanced success message with location info
        const locationInfo = result.is_campus_location ? ' (BU Campus)' : '';
        message.success(
          `📍 Coordinates found: ${result.lat}, ${result.lng}${locationInfo}`,
          4 // Show for 4 seconds
        );

        console.log('✅ [MODAL] OpenStreetMap geocoding successful:', {
          coordinates: { lat: result.lat, lng: result.lng },
          display_name: result.display_name,
          is_campus_location: result.is_campus_location,
          confidence: result.confidence,
          accuracy: accuracy
        });
      } else {
        message.error(`🔍 Geocoding failed: Unable to find coordinates for this address using OpenStreetMap`);
        console.error('❌ [MODAL] OpenStreetMap geocoding failed:', result);
      }
    } catch (error) {
      message.error(`🌐 OpenStreetMap geocoding error: ${error.message}`);
      console.error('💥 [MODAL] OpenStreetMap geocoding exception:', error);
    } finally {
      setModalGeocodingLoading(false);
    }
  };  // Handle edit action
  const handleEdit = (type, item) => {
    setModalType(type);
    setEditingItem(item);
    setModalVisible(true);

    // Handle nested contacts field for buildings
    if (type === 'building' && item.contacts) {
      const formData = {
        ...item,
        contacts: typeof item.contacts === 'string' ? JSON.parse(item.contacts) : item.contacts,
        // Ensure geocoding fields are included
        latitude: item.latitude,
        longitude: item.longitude,
        geocoding_status: item.geocoding_status || 'pending',
        geocoding_source: item.geocoding_source || 'nominatim',
        geocoding_accuracy: item.geocoding_accuracy || 'medium',
        geocoded_at: item.geocoded_at
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
          message.error(`Failed to delete ${type}: ${error.message}`);
        }
      },
    });
  };

  // Handle modal submit with confirmation
  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Show confirmation dialog
      Modal.confirm({
        title: `Confirm ${editingItem ? 'Update' : 'Add'} ${modalType === 'building' ? 'Building' : 'Room'}`,
        content: `Are you sure you want to ${editingItem ? 'update' : 'add'} this ${modalType}?`,
        okText: 'Yes, Confirm',
        cancelText: 'Cancel',
        onOk: async () => {
          await executeModalSubmit(values);
        }
      });
    } catch (error) {
      // Form validation failed
    }
  };

  // Execute the actual modal submit logic
  const executeModalSubmit = async (values) => {
    try {
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
      message.error(`Failed to ${editingItem ? 'update' : 'add'} ${modalType}: ${error.message}`);
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
        width={800}
        destroyOnHidden={true}
        okText="Confirm Changes"
        cancelText="Cancel"
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

              {/* Geocoding Section */}
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <div style={{
                    background: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <strong style={{ color: '#495057' }}>🗺️ Geographic Coordinates (OpenStreetMap)</strong>
                      <Button
                        type="primary"
                        size="small"
                        icon={<EnvironmentOutlined />}
                        loading={modalGeocodingLoading}
                        onClick={handleModalGeocode}
                        style={{ fontSize: '12px' }}
                      >
                        Fetch from OSM
                      </Button>
                    </div>                    <Row gutter={12}>
                      <Col span={12}>
                        <Form.Item
                          label="Latitude"
                          name="latitude"
                          style={{ marginBottom: '0' }}
                        >
                          <Input
                            placeholder="Latitude (auto-filled)"
                            size="small"
                            disabled={modalGeocodingLoading}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label="Longitude"
                          name="longitude"
                          style={{ marginBottom: '0' }}
                        >
                          <Input
                            placeholder="Longitude (auto-filled)"
                            size="small"
                            disabled={modalGeocodingLoading}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* Hidden fields for geocoding metadata */}
                    <div style={{ display: 'none' }}>
                      <Form.Item name="geocoding_status">
                        <Input />
                      </Form.Item>
                      <Form.Item name="geocoding_source">
                        <Input />
                      </Form.Item>
                      <Form.Item name="geocoding_accuracy">
                        <Input />
                      </Form.Item>
                      <Form.Item name="geocoded_at">
                        <Input />
                      </Form.Item>
                    </div>
                  </div>
                </Col>
              </Row>
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
