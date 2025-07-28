// Location Management page - Manage library rooms and venue information
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
  Typography
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  UsergroupAddOutlined
} from '@ant-design/icons';
import locationService from '../services/locationService';

const { Title, Paragraph } = Typography;
const { Option } = Select;

/**
 * Location Management page component
 * In useManagement library Room and venue Information
 */
const LocationsPage = () => {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [form] = Form.useForm();

  // component handle Load Data
  useEffect(() => {
    loadLocations();
  }, []);

  // Load venue List
  const loadLocations = async () => {
    try {
      setLoading(true);
      const response = await locationService.getLocations();
      setLocations(response.data?.list || []);
    } catch (error) {
      message.error('Load venue list failed');
      console.error('Load venue list failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open Add New/Edit Popup
  const openModal = (location = null) => {
    setEditingLocation(location);
    setModalVisible(true);
    if (location) {
      form.setFieldsValue(location);
    } else {
      form.resetFields();
    }
  };

  // Close popups
  const closeModal = () => {
    setModalVisible(false);
    setEditingLocation(null);
    form.resetFields();
  };

  // Save venue information
  const handleSave = async (values) => {
    try {
      if (editingLocation) {
        await locationService.updateLocation(editingLocation.id, values);
        message.success('Update venue information success');
      } else {
        await locationService.createLocation(values);
        message.success('Create venue success');
      }
      closeModal();
      loadLocations();
    } catch (error) {
      message.error(editingLocation ? 'Update venue information failed' : 'Create venue failed');
      console.error('Save venue information failed:', error);
    }
  };

  // Delete venue
  const handleDelete = async (id) => {
    try {
      await locationService.deleteLocation(id);
      message.success('Delete venue success');
      loadLocations();
    } catch (error) {
      message.error('Delete venue failed');
      console.error('Delete venue failed:', error);
    }
  };

  // Table Column Configuration
  const columns = [
    {
      title: 'Venue Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <EnvironmentOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeColors = {
          study_room: 'blue',
          meeting_room: 'green',
          computer_lab: 'orange',
          reading_area: 'purple',
        };
        const typeNames = {
          study_room: 'Study Room',
          meeting_room: 'Meeting Room',
          computer_lab: 'Computer Lab',
          reading_area: 'Reading Area',
        };
        return (
          <Tag color={typeColors[type]}>
            {typeNames[type] || type}
          </Tag>
        );
      },
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity) => (
        <Space>
          <UsergroupAddOutlined />
          {capacity}
        </Space>
      ),
    },
    {
      title: 'Equipment',
      dataIndex: 'equipment',
      key: 'equipment',
      render: (equipment) => (
        <div>
          {equipment?.map((item, index) => (
            <Tag key={index}>{item}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          available: { color: 'green', text: 'Available' },
          maintenance: { color: 'orange', text: 'Maintenance' },
          disabled: { color: 'red', text: 'Disabled' },
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Sure you want to delete this location?"
            onConfirm={() => handleDelete(record.id)}
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
        Management library all venue and RoomInformation，include Capacity、Equipment and AvailableStatus。
      </Paragraph>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <Title level={4}>venueList</Title>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
          >
            Add Newvenue
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={locations}
          loading={loading}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => ` In total of ${total} venues`,
          }}
        />
      </Card>

      {/* Add New/Edit venue modal */}
      <Modal
        title={editingLocation ? 'Editvenue' : 'Add Newvenue'}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="name"
            label="venueName"
            rules={[{ required: true, message: 'Please enter venue name' }]}
          >
            <Input placeholder="Please enter venue name" />
          </Form.Item>

          <Form.Item
            name="type"
            label="venueType"
            rules={[{ required: true, message: 'Please select venue type' }]}
          >
            <Select placeholder="Please select venue type">
              <Option value="study_room">Study Room</Option>
              <Option value="meeting_room">Meeting Room</Option>
              <Option value="computer_lab">Computer Lab</Option>
              <Option value="reading_area">Reading Area</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="capacity"
            label="Capacity"
            rules={[{ required: true, message: 'Please enter venue capacity' }]}
          >
            <InputNumber
              min={1}
              max={200}
              placeholder="Please enter venue capacity"
              style={{ width: '100%' }}
              addonAfter="People"
            />
          </Form.Item>

          <Form.Item
            name="location"
            label="Location Description"
            rules={[{ required: true, message: 'Please enter location description' }]}
          >
            <Input placeholder="e.g., Second floor east side" />
          </Form.Item>

          <Form.Item
            name="equipment"
            label="EquipmentList"
          >
            <Select
              mode="tags"
              placeholder="Please enter equipment name and press enter to add"
              style={{ width: '100%' }}
            >
              <Option value="projector">Projector</Option>
              <Option value="whiteboard">Whiteboard</Option>
              <Option value="computer">Computer</Option>
              <Option value="air_conditioning">Air Conditioning</Option>
              <Option value="audio_system">Audio System</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select venue status' }]}
          >
            <Select placeholder="Please select venue status">
              <Option value="available">Available</Option>
              <Option value="maintenance">Maintenance</Option>
              <Option value="disabled">Disabled</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Notes"
          >
            <Input.TextArea rows={3} placeholder="Please enter notes information" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Save
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
