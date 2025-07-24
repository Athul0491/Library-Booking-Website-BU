// 可用性管理页面 - 控制时间段的开放状态
import React, { useState, useEffect } from 'react';
import {
  Card,
  Calendar,
  Modal,
  Form,
  TimePicker,
  Switch,
  Button,
  Space,
  Select,
  message,
  Typography,
  Badge,
  List,
  Row,
  Col,
  Tag
} from 'antd';
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import locationService from '../services/locationService';
import bookingService from '../services/bookingService';

const { Title, Paragraph } = Typography;
const { Option } = Select;

/**
 * 可用性管理页面组件
 * 用于管理房间的时间段可用性
 */
const AvailabilityPage = () => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [form] = Form.useForm();

  // 组件挂载时加载数据
  useEffect(() => {
    loadRooms();
  }, []);

  // 当选择的日期或房间变化时，加载时间段数据
  useEffect(() => {
    if (selectedRoom) {
      loadTimeSlots();
    }
  }, [selectedDate, selectedRoom]);

  // 加载房间列表
  const loadRooms = async () => {
    try {
      // 模拟API调用
      const mockRooms = [
        { id: 1, name: '自习室A', type: 'study_room' },
        { id: 2, name: '会议室B', type: 'meeting_room' },
        { id: 3, name: '讨论室C', type: 'discussion_room' },
        { id: 4, name: '机房D', type: 'computer_lab' },
      ];
      setRooms(mockRooms);
      setSelectedRoom(mockRooms[0]);
    } catch (error) {
      message.error('加载房间列表失败');
      console.error('加载房间列表失败:', error);
    }
  };

  // 加载指定日期和房间的时间段数据
  const loadTimeSlots = async () => {
    try {
      setLoading(true);
      // 模拟API调用
      const mockTimeSlots = [
        {
          id: 1,
          startTime: '08:00',
          endTime: '10:00',
          isAvailable: true,
          maxCapacity: 20,
          currentBookings: 5,
        },
        {
          id: 2,
          startTime: '10:00',
          endTime: '12:00',
          isAvailable: true,
          maxCapacity: 20,
          currentBookings: 15,
        },
        {
          id: 3,
          startTime: '14:00',
          endTime: '16:00',
          isAvailable: false,
          maxCapacity: 20,
          currentBookings: 0,
          reason: '设备维护',
        },
        {
          id: 4,
          startTime: '16:00',
          endTime: '18:00',
          isAvailable: true,
          maxCapacity: 20,
          currentBookings: 8,
        },
      ];
      setTimeSlots(mockTimeSlots);
    } catch (error) {
      message.error('加载时间段数据失败');
      console.error('加载时间段数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取日期的显示内容（用于日历）
  const getCellRender = (current, info) => {
    // 这里可以添加逻辑来显示每天的可用性状态
    const date = current.format('YYYY-MM-DD');
    const today = dayjs().format('YYYY-MM-DD');
    
    if (date === today) {
      return <Badge status="processing" text="今天" />;
    }
    
    return null;
  };

  // 打开新增/编辑时间段弹窗
  const openModal = (slot = null) => {
    setEditingSlot(slot);
    setModalVisible(true);
    if (slot) {
      form.setFieldsValue({
        ...slot,
        timeRange: [dayjs(slot.startTime, 'HH:mm'), dayjs(slot.endTime, 'HH:mm')],
      });
    } else {
      form.resetFields();
    }
  };

  // 关闭弹窗
  const closeModal = () => {
    setModalVisible(false);
    setEditingSlot(null);
    form.resetFields();
  };

  // 保存时间段设置
  const handleSave = async (values) => {
    try {
      const [startTime, endTime] = values.timeRange;
      const slotData = {
        ...values,
        startTime: startTime.format('HH:mm'),
        endTime: endTime.format('HH:mm'),
        roomId: selectedRoom.id,
        date: selectedDate.format('YYYY-MM-DD'),
      };

      if (editingSlot) {
        // 更新现有时间段
        console.log('更新时间段:', slotData);
        message.success('更新时间段成功');
      } else {
        // 创建新时间段
        console.log('创建时间段:', slotData);
        message.success('创建时间段成功');
      }

      closeModal();
      loadTimeSlots();
    } catch (error) {
      message.error('保存时间段失败');
      console.error('保存时间段失败:', error);
    }
  };

  // 删除时间段
  const handleDelete = async (slotId) => {
    try {
      console.log('删除时间段:', slotId);
      message.success('删除时间段成功');
      loadTimeSlots();
    } catch (error) {
      message.error('删除时间段失败');
      console.error('删除时间段失败:', error);
    }
  };

  // 快速切换可用性状态
  const toggleAvailability = async (slotId, newStatus) => {
    try {
      console.log('切换可用性:', slotId, newStatus);
      message.success('更新可用性状态成功');
      loadTimeSlots();
    } catch (error) {
      message.error('更新可用性状态失败');
      console.error('更新可用性状态失败:', error);
    }
  };

  return (
    <div>
      <Title level={2}>可用性管理</Title>
      <Paragraph>
        管理房间的时间段可用性，可以设置特定日期和时间的开放状态。
      </Paragraph>

      <Row gutter={[16, 16]}>
        {/* 左侧：日历 */}
        <Col xs={24} lg={14}>
          <Card title="选择日期">
            <Calendar
              value={selectedDate}
              onSelect={setSelectedDate}
              cellRender={getCellRender}
              headerRender={({ value, type, onChange, onTypeChange }) => (
                <div style={{ padding: 8 }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Title level={4}>
                        {value.format('YYYY年MM月')}
                      </Title>
                    </Col>
                    <Col>
                      <Space>
                        <Button onClick={() => onChange(value.subtract(1, 'month'))}>
                          上月
                        </Button>
                        <Button onClick={() => onChange(dayjs())}>
                          今天
                        </Button>
                        <Button onClick={() => onChange(value.add(1, 'month'))}>
                          下月
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                </div>
              )}
            />
          </Card>
        </Col>

        {/* 右侧：房间选择和时间段管理 */}
        <Col xs={24} lg={10}>
          <Card 
            title="房间和时间段设置"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
                disabled={!selectedRoom}
              >
                新增时间段
              </Button>
            }
          >
            {/* 房间选择 */}
            <div style={{ marginBottom: 16 }}>
              <Select
                placeholder="选择房间"
                style={{ width: '100%' }}
                value={selectedRoom?.id}
                onChange={(roomId) => {
                  const room = rooms.find(r => r.id === roomId);
                  setSelectedRoom(room);
                }}
              >
                {rooms.map(room => (
                  <Option key={room.id} value={room.id}>
                    <Space>
                      <EnvironmentOutlined />
                      {room.name}
                    </Space>
                  </Option>
                ))}
              </Select>
            </div>

            {/* 选中日期信息 */}
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
              <Space>
                <ClockCircleOutlined />
                <span>
                  {selectedDate.format('YYYY年MM月DD日')} 
                  ({selectedDate.format('dddd')})
                </span>
              </Space>
            </div>

            {/* 时间段列表 */}
            <List
              loading={loading}
              dataSource={timeSlots}
              renderItem={(slot) => (
                <List.Item
                  actions={[
                    <Switch
                      key="switch"
                      checked={slot.isAvailable}
                      onChange={(checked) => toggleAvailability(slot.id, checked)}
                      checkedChildren="开放"
                      unCheckedChildren="关闭"
                    />,
                    <Button
                      key="edit"
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => openModal(slot)}
                    />,
                    <Button
                      key="delete"
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(slot.id)}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{slot.startTime} - {slot.endTime}</span>
                        <Tag color={slot.isAvailable ? 'green' : 'red'}>
                          {slot.isAvailable ? '开放' : '关闭'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div>容量: {slot.currentBookings}/{slot.maxCapacity}</div>
                        {!slot.isAvailable && slot.reason && (
                          <div style={{ color: '#ff4d4f' }}>原因: {slot.reason}</div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 新增/编辑时间段弹窗 */}
      <Modal
        title={editingSlot ? '编辑时间段' : '新增时间段'}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            isAvailable: true,
            maxCapacity: 20,
          }}
        >
          <Form.Item
            name="timeRange"
            label="时间范围"
            rules={[{ required: true, message: '请选择时间范围' }]}
          >
            <TimePicker.RangePicker
              format="HH:mm"
              minuteStep={30}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="maxCapacity"
            label="最大容量"
            rules={[{ required: true, message: '请输入最大容量' }]}
          >
            <Select placeholder="选择最大容量">
              <Option value={10}>10人</Option>
              <Option value={20}>20人</Option>
              <Option value={30}>30人</Option>
              <Option value={50}>50人</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="isAvailable"
            label="是否开放"
            valuePropName="checked"
          >
            <Switch checkedChildren="开放" unCheckedChildren="关闭" />
          </Form.Item>

          <Form.Item
            name="reason"
            label="关闭原因"
            help="仅在关闭时需要填写"
          >
            <Select placeholder="选择关闭原因" allowClear>
              <Option value="设备维护">设备维护</Option>
              <Option value="清洁消毒">清洁消毒</Option>
              <Option value="特殊活动">特殊活动</Option>
              <Option value="其他">其他</Option>
            </Select>
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

export default AvailabilityPage;
