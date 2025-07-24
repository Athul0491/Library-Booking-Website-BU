// Availability Management页面 - 控制Time段的OpenStatus
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
 * Availability Management页面组件
 * 用于ManagementRoom的Time段Available性
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

  // 组件挂载时LoadData
  useEffect(() => {
    loadRooms();
  }, []);

  // 当选择的Date或Room变化时，LoadTime段Data
  useEffect(() => {
    if (selectedRoom) {
      loadTimeSlots();
    }
  }, [selectedDate, selectedRoom]);

  // LoadRoomList
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
      message.error('LoadRoomListFailed');
      console.error('LoadRoomListFailed:', error);
    }
  };

  // Load指定Date和Room的Time段Data
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
          reason: 'EquipmentMaintenance',
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
      message.error('LoadTime段DataFailed');
      console.error('LoadTime段DataFailed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取Date的显示内容（用于日历）
  const getCellRender = (current, info) => {
    // 这里可以Add逻辑来显示每天的Available性Status
    const date = current.format('YYYY-MM-DD');
    const today = dayjs().format('YYYY-MM-DD');
    
    if (date === today) {
      return <Badge status="processing" text="今天" />;
    }
    
    return null;
  };

  // 打开Add New/EditTime段弹窗
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

  // Close弹窗
  const closeModal = () => {
    setModalVisible(false);
    setEditingSlot(null);
    form.resetFields();
  };

  // SaveTime段Settings
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
        // 更新现有Time段
        console.log('更新Time段:', slotData);
        message.success('更新Time段Success');
      } else {
        // 创建新Time段
        console.log('创建Time段:', slotData);
        message.success('创建Time段Success');
      }

      closeModal();
      loadTimeSlots();
    } catch (error) {
      message.error('SaveTime段Failed');
      console.error('SaveTime段Failed:', error);
    }
  };

  // DeleteTime段
  const handleDelete = async (slotId) => {
    try {
      console.log('DeleteTime段:', slotId);
      message.success('DeleteTime段Success');
      loadTimeSlots();
    } catch (error) {
      message.error('DeleteTime段Failed');
      console.error('DeleteTime段Failed:', error);
    }
  };

  // 快速切换Available性Status
  const toggleAvailability = async (slotId, newStatus) => {
    try {
      console.log('切换Available性:', slotId, newStatus);
      message.success('更新Available性StatusSuccess');
      loadTimeSlots();
    } catch (error) {
      message.error('更新Available性StatusFailed');
      console.error('更新Available性StatusFailed:', error);
    }
  };

  return (
    <div>
      <Title level={2}>Availability Management</Title>
      <Paragraph>
        ManagementRoom的Time段Available性，可以Settings特定Date和Time的OpenStatus。
      </Paragraph>

      <Row gutter={[16, 16]}>
        {/* 左侧：日历 */}
        <Col xs={24} lg={14}>
          <Card title="选择Date">
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

        {/* 右侧：Room选择和Time段Management */}
        <Col xs={24} lg={10}>
          <Card 
            title="Room和Time段Settings"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
                disabled={!selectedRoom}
              >
                Add NewTime段
              </Button>
            }
          >
            {/* Room选择 */}
            <div style={{ marginBottom: 16 }}>
              <Select
                placeholder="选择Room"
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

            {/* 选中DateInformation */}
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
              <Space>
                <ClockCircleOutlined />
                <span>
                  {selectedDate.format('YYYY年MM月DD日')} 
                  ({selectedDate.format('dddd')})
                </span>
              </Space>
            </div>

            {/* Time段List */}
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
                      checkedChildren="Open"
                      unCheckedChildren="Close"
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
                          {slot.isAvailable ? 'Open' : 'Close'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div>Capacity: {slot.currentBookings}/{slot.maxCapacity}</div>
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

      {/* Add New/EditTime段弹窗 */}
      <Modal
        title={editingSlot ? 'EditTime段' : 'Add NewTime段'}
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
            label="Time范围"
            rules={[{ required: true, message: '请选择Time范围' }]}
          >
            <TimePicker.RangePicker
              format="HH:mm"
              minuteStep={30}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="maxCapacity"
            label="最大Capacity"
            rules={[{ required: true, message: '请输入最大Capacity' }]}
          >
            <Select placeholder="选择最大Capacity">
              <Option value={10}>10人</Option>
              <Option value={20}>20人</Option>
              <Option value={30}>30人</Option>
              <Option value={50}>50人</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="isAvailable"
            label="是否Open"
            valuePropName="checked"
          >
            <Switch checkedChildren="Open" unCheckedChildren="Close" />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Close原因"
            help="仅在Close时需要填写"
          >
            <Select placeholder="选择Close原因" allowClear>
              <Option value="EquipmentMaintenance">EquipmentMaintenance</Option>
              <Option value="清洁消毒">清洁消毒</Option>
              <Option value="特殊Activity">特殊Activity</Option>
              <Option value="其他">其他</Option>
            </Select>
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

export default AvailabilityPage;
