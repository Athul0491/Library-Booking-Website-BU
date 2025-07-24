// 场地管理页面 - 管理图书馆房间和场地信息
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
 * 场地管理页面组件
 * 用于管理图书馆的房间和场地信息
 */
const LocationsPage = () => {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [form] = Form.useForm();

  // 组件挂载时加载数据
  useEffect(() => {
    loadLocations();
  }, []);

  // 加载场地列表
  const loadLocations = async () => {
    try {
      setLoading(true);
      const response = await locationService.getLocations();
      setLocations(response.data?.list || []);
    } catch (error) {
      message.error('加载场地列表失败');
      console.error('加载场地列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 打开新增/编辑弹窗
  const openModal = (location = null) => {
    setEditingLocation(location);
    setModalVisible(true);
    if (location) {
      form.setFieldsValue(location);
    } else {
      form.resetFields();
    }
  };

  // 关闭弹窗
  const closeModal = () => {
    setModalVisible(false);
    setEditingLocation(null);
    form.resetFields();
  };

  // 保存场地信息
  const handleSave = async (values) => {
    try {
      if (editingLocation) {
        await locationService.updateLocation(editingLocation.id, values);
        message.success('更新场地信息成功');
      } else {
        await locationService.createLocation(values);
        message.success('创建场地成功');
      }
      closeModal();
      loadLocations();
    } catch (error) {
      message.error(editingLocation ? '更新场地信息失败' : '创建场地失败');
      console.error('保存场地信息失败:', error);
    }
  };

  // 删除场地
  const handleDelete = async (id) => {
    try {
      await locationService.deleteLocation(id);
      message.success('删除场地成功');
      loadLocations();
    } catch (error) {
      message.error('删除场地失败');
      console.error('删除场地失败:', error);
    }
  };

  // 表格列配置
  const columns = [
    {
      title: '场地名称',
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
      title: '类型',
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
      title: '容量',
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
      title: '设备',
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          available: { color: 'green', text: '可用' },
          maintenance: { color: 'orange', text: '维护中' },
          disabled: { color: 'red', text: '停用' },
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个场地吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>场地管理</Title>
      <Paragraph>
        管理图书馆的所有场地和房间信息，包括容量、设备和可用状态。
      </Paragraph>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <Title level={4}>场地列表</Title>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
          >
            新增场地
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

      {/* 新增/编辑场地弹窗 */}
      <Modal
        title={editingLocation ? '编辑场地' : '新增场地'}
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
            label="场地名称"
            rules={[{ required: true, message: '请输入场地名称' }]}
          >
            <Input placeholder="请输入场地名称" />
          </Form.Item>

          <Form.Item
            name="type"
            label="场地类型"
            rules={[{ required: true, message: '请选择场地类型' }]}
          >
            <Select placeholder="请选择场地类型">
              <Option value="study_room">自习室</Option>
              <Option value="meeting_room">会议室</Option>
              <Option value="computer_lab">机房</Option>
              <Option value="reading_area">阅读区</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="capacity"
            label="容量"
            rules={[{ required: true, message: '请输入场地容量' }]}
          >
            <InputNumber
              min={1}
              max={200}
              placeholder="请输入场地容量"
              style={{ width: '100%' }}
              addonAfter="人"
            />
          </Form.Item>

          <Form.Item
            name="location"
            label="位置描述"
            rules={[{ required: true, message: '请输入位置描述' }]}
          >
            <Input placeholder="例如：二楼东侧" />
          </Form.Item>

          <Form.Item
            name="equipment"
            label="设备列表"
          >
            <Select
              mode="tags"
              placeholder="输入设备名称后按回车添加"
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
            label="状态"
            rules={[{ required: true, message: '请选择场地状态' }]}
          >
            <Select placeholder="请选择场地状态">
              <Option value="available">可用</Option>
              <Option value="maintenance">维护中</Option>
              <Option value="disabled">停用</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="备注"
          >
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={closeModal}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LocationsPage;
