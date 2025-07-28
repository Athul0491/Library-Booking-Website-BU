// Location Management page - Manage library buildings and rooms
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Popconfirm,
  Typography,
  Collapse,
  Descriptions,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  TeamOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import locationService from '../services/locationService';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

/**
 * Location Management page component
 * Manages library buildings and rooms using bu-book/bub-backend data structure
 * - Buildings: id, Name, ShortName, Address, website, contacts, available, libcal_id, lid
 * - Rooms: id, building_id, eid, title, url, grouping, capacity, gtype, available
 */
const LocationsPage = () => {
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemType, setItemType] = useState('building'); // 'building' or 'room'
  const [form] = Form.useForm();

  // Load data when component mounts
  useEffect(() => {
    loadBuildings();
  }, []);

  // Load buildings with rooms from Supabase (same as bu-book)
  const loadBuildings = async () => {
    try {
      setLoading(true);
      const response = await locationService.getLocations();
      
      // Parse buildings and rooms from the response
      const buildingsData = response.data?.buildings || [];
      const roomsData = [];
      
      buildingsData.forEach(building => {
        if (building.Rooms) {
          roomsData.push(...building.Rooms.map(room => ({
            ...room,
            building_name: building.Name
          })));
        }
      });
      
      setBuildings(buildingsData);
      setRooms(roomsData);
    } catch (error) {
      message.error('Failed to load buildings data');
      console.error('Failed to load buildings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open Add New/Edit popup
  const openModal = (item = null, type = 'building') => {
    setEditingItem(item);
    setItemType(type);
    setModalVisible(true);
    if (item) {
      // Map the data fields correctly
      if (type === 'building') {
        form.setFieldsValue({
          Name: item.Name,
          ShortName: item.ShortName,
          Address: item.Address,
          website: item.website,
          contacts: item.contacts ? JSON.stringify(item.contacts) : '',
          libcal_id: item.libcal_id,
          lid: item.lid,
          available: item.available
        });
      } else {
        form.setFieldsValue({
          title: item.title,
          capacity: item.capacity,
          building_id: item.building_id,
          eid: item.eid,
          url: item.url,
          grouping: item.grouping,
          gtype: item.gtype,
          available: item.available
        });
      }
    } else {
      form.resetFields();
    }
  };

  // Close popup
  const closeModal = () => {
    setModalVisible(false);
    setEditingItem(null);
    setItemType('building');
    form.resetFields();
  };

  // Save building or room information
  const handleSave = async (values) => {
    try {
      if (itemType === 'building') {
        // Process building data
        const buildingData = {
          ...values,
          contacts: values.contacts ? JSON.parse(values.contacts) : {}
        };
        
        if (editingItem) {
          await locationService.updateBuilding(editingItem.id, buildingData);
          message.success('Building updated successfully');
        } else {
          await locationService.createBuilding(buildingData);
          message.success('Building created successfully');
        }
      } else {
        // Process room data
        if (editingItem) {
          await locationService.updateRoom(editingItem.id, values);
          message.success('Room updated successfully');
        } else {
          await locationService.createRoom(values);
          message.success('Room created successfully');
        }
      }
      closeModal();
      loadBuildings();
    } catch (error) {
      message.error(`Failed to save ${itemType}`);
      console.error(`Failed to save ${itemType}:`, error);
    }
  };

  // Delete building or room
  const handleDelete = async (id, type) => {
    try {
      if (type === 'building') {
        await locationService.deleteBuilding(id);
        message.success('Building deleted successfully');
      } else {
        await locationService.deleteRoom(id);
        message.success('Room deleted successfully');
      }
      loadBuildings();
    } catch (error) {
      message.error(`Failed to delete ${type}`);
      console.error(`Failed to delete ${type}:`, error);
    }
  };

  // Buildings Table Column Configuration (matches bu-book Building interface)
  const buildingColumns = [
    {
      title: 'Building Info',
      key: 'buildingInfo',
      render: (_, record) => (
        <div>
          <Space>
            <HomeOutlined />
            <div>
              <strong>{record.Name}</strong>
              {record.ShortName && (
                <div style={{ color: '#666', fontSize: '12px' }}>
                  {record.ShortName}
                </div>
              )}
            </div>
          </Space>
        </div>
      ),
    },
    {
      title: 'Address',
      dataIndex: 'Address',
      key: 'address',
      render: (address) => (
        <Space>
          <EnvironmentOutlined />
          {address || 'N/A'}
        </Space>
      )
    },
    {
      title: 'Rooms',
      dataIndex: 'Rooms',
      key: 'rooms',
      render: (rooms) => (
        <Space>
          <TeamOutlined />
          <span>{rooms ? rooms.length : 0} rooms</span>
        </Space>
      ),
    },
    {
      title: 'LibCal Info',
      key: 'libcalInfo',
      render: (_, record) => (
        <div>
          <div>ID: <span style={{ fontFamily: 'monospace' }}>{record.libcal_id}</span></div>
          <div>LID: <span style={{ fontFamily: 'monospace' }}>{record.lid}</span></div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'available',
      key: 'available',
      render: (available) => (
        <Tag 
          icon={available ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          color={available ? 'green' : 'red'}
        >
          {available ? 'Available' : 'Unavailable'}
        </Tag>
      ),
    },
    {
      title: 'Website',
      dataIndex: 'website',
      key: 'website',
      render: (website) => website ? (
        <Button 
          type="link" 
          icon={<LinkOutlined />}
          href={website} 
          target="_blank" 
          size="small"
        >
          Visit
        </Button>
      ) : 'N/A'
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openModal(record, 'building')}
          >
            Edit
          </Button>
          <Button
            type="link"
            onClick={() => openModal(null, 'room')}
          >
            Add Room
          </Button>
          <Popconfirm
            title="Sure you want to delete this building?"
            onConfirm={() => handleDelete(record.id, 'building')}
            okText="Confirm"
            cancelText="Cancel"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Rooms Table Column Configuration (matches bu-book Room interface)
  const roomColumns = [
    {
      title: 'Room Title',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <div>
          <Space>
            <TeamOutlined />
            <div>
              <strong>{title}</strong>
              <div style={{ color: '#666', fontSize: '12px' }}>
                Building: {record.building_name}
              </div>
            </div>
          </Space>
        </div>
      ),
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity) => (
        <span>{capacity} people</span>
      )
    },
    {
      title: 'Room Info',
      key: 'roomInfo',
      render: (_, record) => (
        <div>
          <div>EID: <span style={{ fontFamily: 'monospace' }}>{record.eid}</span></div>
          <div>Type: <span style={{ fontFamily: 'monospace' }}>{record.gtype}</span></div>
          {record.grouping && <div>Group: {record.grouping}</div>}
        </div>
      )
    },
    {
      title: 'Booking',
      dataIndex: 'gBookingSelectableTime',
      key: 'booking',
      render: (selectable) => (
        <Tag color={selectable ? 'blue' : 'default'}>
          {selectable ? 'Time Selectable' : 'Fixed Time'}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'available',
      key: 'available',
      render: (available) => (
        <Tag 
          icon={available ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          color={available ? 'green' : 'red'}
        >
          {available ? 'Available' : 'Unavailable'}
        </Tag>
      ),
    },
    {
      title: 'LibCal URL',
      dataIndex: 'url',
      key: 'url',
      render: (url) => url ? (
        <Button 
          type="link" 
          icon={<LinkOutlined />}
          href={url} 
          target="_blank" 
          size="small"
        >
          Book
        </Button>
      ) : 'N/A'
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openModal(record, 'room')}
          >
            Edit
          </Button>
          <Popconfirm
            title="Sure you want to delete this room?"
            onConfirm={() => handleDelete(record.id, 'room')}
            okText="Confirm"
            cancelText="Cancel"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Location Management</Title>
      <Paragraph>
        Manage library buildings and rooms, synchronized with bu-book and bub-backend data.
        Buildings are fetched from Supabase, LibCal availability from bub-backend API.
      </Paragraph>

      <Collapse defaultActiveKey={['1', '2']} ghost>
        <Panel 
          header={
            <Title level={4}>
              <HomeOutlined /> Buildings ({buildings.length})
            </Title>
          } 
          key="1"
        >
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <Paragraph>
                  Library buildings with LibCal integration. Data structure matches bu-book Building interface.
                </Paragraph>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal(null, 'building')}
              >
                Add New Building
              </Button>
            </div>

            <Table
              columns={buildingColumns}
              dataSource={buildings}
              loading={loading}
              rowKey="id"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total of ${total} buildings`,
              }}
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ margin: 0 }}>
                    <Descriptions title="Building Details" size="small" column={2}>
                      <Descriptions.Item label="LibCal ID">{record.libcal_id}</Descriptions.Item>
                      <Descriptions.Item label="Location ID (LID)">{record.lid}</Descriptions.Item>
                      <Descriptions.Item label="Contacts">
                        {record.contacts ? JSON.stringify(record.contacts) : 'None'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Rooms Count">
                        {record.Rooms ? record.Rooms.length : 0}
                      </Descriptions.Item>
                    </Descriptions>
                    {record.Rooms && record.Rooms.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <strong>Rooms in this building:</strong>
                        <div style={{ marginTop: 8 }}>
                          {record.Rooms.map(room => (
                            <Tag key={room.id} style={{ margin: '2px' }}>
                              {room.title} (Cap: {room.capacity})
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ),
                rowExpandable: (record) => record.Rooms && record.Rooms.length > 0,
              }}
            />
          </Card>
        </Panel>

        <Panel 
          header={
            <Title level={4}>
              <TeamOutlined /> Rooms ({rooms.length})
            </Title>
          } 
          key="2"
        >
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <Paragraph>
                  Individual rooms with booking capabilities. Data structure matches bu-book Room interface.
                </Paragraph>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal(null, 'room')}
              >
                Add New Room
              </Button>
            </div>

            <Table
              columns={roomColumns}
              dataSource={rooms}
              loading={loading}
              rowKey="id"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total of ${total} rooms`,
              }}
            />
          </Card>
        </Panel>
      </Collapse>

      {/* Dynamic Add New/Edit modal for Buildings and Rooms */}
      <Modal
        title={
          editingItem 
            ? `Edit ${itemType === 'building' ? 'Building' : 'Room'}` 
            : `Add New ${itemType === 'building' ? 'Building' : 'Room'}`
        }
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          {itemType === 'building' ? (
            // Building Form Fields (matching Building interface)
            <>
              <Form.Item
                name="Name"
                label="Building Name"
                rules={[{ required: true, message: 'Please enter building name' }]}
              >
                <Input placeholder="e.g., Mugar Memorial Library" />
              </Form.Item>

              <Form.Item
                name="ShortName"
                label="Short Name"
              >
                <Input placeholder="e.g., Mugar" />
              </Form.Item>

              <Form.Item
                name="Address"
                label="Address"
                rules={[{ required: true, message: 'Please enter building address' }]}
              >
                <Input placeholder="e.g., 771 Commonwealth Ave, Boston, MA 02215" />
              </Form.Item>

              <Form.Item
                name="website"
                label="Website URL"
              >
                <Input placeholder="https://www.bu.edu/library/" />
              </Form.Item>

              <Form.Item
                name="contacts"
                label="Contacts (JSON format)"
                tooltip="Enter contact information in JSON format, e.g., {'phone': '617-353-3732'}"
              >
                <Input.TextArea 
                  rows={3} 
                  placeholder='{"phone": "617-353-3732", "email": "library@bu.edu"}' 
                />
              </Form.Item>

              <Form.Item
                name="libcal_id"
                label="LibCal ID"
                rules={[{ required: true, message: 'Please enter LibCal ID' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  placeholder="e.g., 12345"
                />
              </Form.Item>

              <Form.Item
                name="lid"
                label="Location ID (LID)"
                rules={[{ required: true, message: 'Please enter Location ID' }]}
                tooltip="Location ID used by bub-backend API"
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  placeholder="e.g., 19336"
                />
              </Form.Item>

              <Form.Item
                name="available"
                label="Availability Status"
                rules={[{ required: true, message: 'Please select availability status' }]}
              >
                <Select placeholder="Select availability status">
                  <Option value={true}>Available</Option>
                  <Option value={false}>Unavailable</Option>
                </Select>
              </Form.Item>
            </>
          ) : (
            // Room Form Fields (matching Room interface)
            <>
              <Form.Item
                name="title"
                label="Room Title"
                rules={[{ required: true, message: 'Please enter room title' }]}
              >
                <Input placeholder="e.g., Study Room 201" />
              </Form.Item>

              <Form.Item
                name="building_id"
                label="Building"
                rules={[{ required: true, message: 'Please select building' }]}
              >
                <Select placeholder="Select building">
                  {buildings.map(building => (
                    <Option key={building.id} value={building.id}>
                      {building.Name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="capacity"
                label="Capacity"
                rules={[{ required: true, message: 'Please enter room capacity' }]}
              >
                <InputNumber
                  min={1}
                  max={50}
                  placeholder="e.g., 8"
                  style={{ width: '100%' }}
                  addonAfter="People"
                />
              </Form.Item>

              <Form.Item
                name="eid"
                label="Equipment ID (EID)"
                rules={[{ required: true, message: 'Please enter Equipment ID' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  placeholder="e.g., 54321"
                />
              </Form.Item>

              <Form.Item
                name="url"
                label="LibCal Booking URL"
              >
                <Input placeholder="https://bu.libcal.com/..." />
              </Form.Item>

              <Form.Item
                name="grouping"
                label="Room Grouping"
              >
                <Input placeholder="e.g., Study Rooms" />
              </Form.Item>

              <Form.Item
                name="gtype"
                label="Group Type"
                rules={[{ required: true, message: 'Please enter group type' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  placeholder="e.g., 1"
                />
              </Form.Item>

              <Form.Item
                name="available"
                label="Availability Status"
                rules={[{ required: true, message: 'Please select availability status' }]}
              >
                <Select placeholder="Select availability status">
                  <Option value={true}>Available</Option>
                  <Option value={false}>Unavailable</Option>
                </Select>
              </Form.Item>
            </>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Save {itemType === 'building' ? 'Building' : 'Room'}
              </Button>
              <Button onClick={closeModal}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LocationsPage;
