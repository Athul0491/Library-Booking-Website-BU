// Location Management页面 - Management图书馆Room和场地Information
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
 * Location Management页面组件
 * 用于Management图书馆的Room和场地Information
 */
const LocationsPage = () => {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [form] = Form.useForm();

  // 组件挂载时LoadData
  useEffect(() => {
    loadLocations();
  }, []);

  // Load场地List
  const loadLocations = async () => {
    try {
      setLoading(true);
      const response = await locationService.getLocations();
      setLocations(response.data?.list || []);
    } catch (error) {
      message.error('Load场地ListFailed');
      console.error('Load场地ListFailed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 打开Add New/Edit弹窗
  const openModal = (location = null) => {
    setEditingLocation(location);
    setModalVisible(true);
    if (location) {
      form.setFieldsValue(location);
    } else {
      form.resetFields();
    }
  };

  // Close弹窗
  const closeModal = () => {
    setModalVisible(false);
    setEditingLocation(null);
    form.resetFields();
  };

  // Save场地Information
  const handleSave = async (values) => {
    try {
      if (editingLocation) {
        await locationService.updateLocation(editingLocation.id, values);
        message.success('更新场地InformationSuccess');
      } else {
        await locationService.createLocation(values);
        message.success('创建场地Success');
      }
      closeModal();
      loadLocations();
    } catch (error) {
      message.error(editingLocation ? '更新场地InformationFailed' : '创建场地Failed');
      console.error('Save场地InformationFailed:', error);
    }
  };

  // Delete场地
  const handleDelete = async (id) => {
    try {
      await locationService.deleteLocation(id);
      message.success('Delete场地Success');
      loadLocations();
    } catch (error) {
      message.error('Delete场地Failed');
      console.error('Delete场地Failed:', error);
    }
  };

  // 表格列Configuration
  const columns = [
    {
      title: '场地Name',
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
          study_room: '自习室',
          meeting_room: '会议室',
          computer_lab: '机房',
          reading_area: '阅读区',
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
          {capacity} 人
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
          maintenance: { color: 'orange', text: 'Maintenance中' },
          disabled: { color: 'red', text: '停用' },
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
            title="确定要Delete这个场地吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
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
        Management图书馆的所有场地和RoomInformation，包括Capacity、Equipment和AvailableStatus。
      </Paragraph>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <Title level={4}>场地List</Title>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
          >
            Add New场地
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
            showTotal: (total) => `共 ${total} 个场地`,
          }}
        />
      </Card>

      {/* Add New/Edit场地弹窗 */}
      <Modal
        title={editingLocation ? 'Edit场地' : 'Add New场地'}
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
            label="场地Name"
            rules={[{ required: true, message: '请输入场地Name' }]}
          >
            <Input placeholder="请输入场地Name" />
          </Form.Item>

          <Form.Item
            name="type"
            label="场地Type"
            rules={[{ required: true, message: '请选择场地Type' }]}
          >
            <Select placeholder="请选择场地Type">
              <Option value="study_room">自习室</Option>
              <Option value="meeting_room">会议室</Option>
              <Option value="computer_lab">机房</Option>
              <Option value="reading_area">阅读区</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="capacity"
            label="Capacity"
            rules={[{ required: true, message: '请输入场地Capacity' }]}
          >
            <InputNumber
              min={1}
              max={200}
              placeholder="请输入场地Capacity"
              style={{ width: '100%' }}
              addonAfter="人"
            />
          </Form.Item>

          <Form.Item
            name="location"
            label="位置Description"
            rules={[{ required: true, message: '请输入位置Description' }]}
          >
            <Input placeholder="例如：二楼东侧" />
          </Form.Item>

          <Form.Item
            name="equipment"
            label="EquipmentList"
          >
            <Select
              mode="tags"
              placeholder="输入EquipmentName后按回车Add"
              style={{ width: '100%' }}
            >
              <Option value="投影仪">投影仪</Option>
              <Option value="白板">白板</Option>
              <Option value="电脑">电脑</Option>
              <Option value="空调">空调</Option>
              <Option value="音响">音响</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: '请选择场地Status' }]}
          >
            <Select placeholder="请选择场地Status">
              <Option value="available">Available</Option>
              <Option value="maintenance">Maintenance中</Option>
              <Option value="disabled">停用</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Notes"
          >
            <Input.TextArea rows={3} placeholder="请输入NotesInformation" />
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
