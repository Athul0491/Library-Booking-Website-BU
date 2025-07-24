// Availability Management page - Control time slot open status
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
 * Availability Management page component
 * Used for managing room time slot availability
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

  // Load data when component mounts
  useEffect(() => {
    loadRooms();
  }, []);

  // When selected Date or Room changes, load Time slot Data
  useEffect(() => {
    if (selectedRoom) {
      loadTimeSlots();
    }
  }, [selectedDate, selectedRoom]);

  // Load Room List
  const loadRooms = async () => {
    try {
      // Mock API call
      const mockRooms = [
        { id: 1, name: 'Study Room A', type: 'study_room' },
        { id: 2, name: 'Meeting Room B', type: 'meeting_room' },
        { id: 3, name: 'Discussion Room C', type: 'discussion_room' },
        { id: 4, name: 'Computer Lab D', type: 'computer_lab' },
      ];
      setRooms(mockRooms);
      setSelectedRoom(mockRooms[0]);
    } catch (error) {
      message.error('Failed to load room list');
      console.error('Failed to load room list:', error);
    }
  };

  // Load specific date and room time slot data
  const loadTimeSlots = async () => {
    try {
      setLoading(true);
      // Mock API call
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
          reason: 'Equipment Maintenance',
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
      message.error('Load Time slot Data Failed');
      console.error('Load Time slot Data Failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get date display content (for calendar)
  const getCellRender = (current, info) => {
    // Here you can add logic to display daily availability status
    const date = current.format('YYYY-MM-DD');
    const today = dayjs().format('YYYY-MM-DD');
    
    if (date === today) {
      return <Badge status="processing" text="Today" />;
    }
    
    return null;
  };

  // Open add new/edit time slot modal
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

  // Close modal
  const closeModal = () => {
    setModalVisible(false);
    setEditingSlot(null);
    form.resetFields();
  };

  // SaveTime slotSettings
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
        // Update Current Time slot
        console.log('Update Time slot:', slotData);
        message.success('Update Time slot Success');
      } else {
        // Create New Time slot
        console.log('Create Time slot:', slotData);
        message.success('Create Time slot Success');
      }

      closeModal();
      loadTimeSlots();
    } catch (error) {
      message.error('SaveTime slotFailed');
      console.error('SaveTime slotFailed:', error);
    }
  };

  // DeleteTime slot
  const handleDelete = async (slotId) => {
    try {
      console.log('DeleteTime slot:', slotId);
      message.success('DeleteTime slotSuccess');
      loadTimeSlots();
    } catch (error) {
      message.error('DeleteTime slotFailed');
      console.error('DeleteTime slotFailed:', error);
    }
  };

  // 快速切换Available性Status
  const toggleAvailability = async (slotId, newStatus) => {
    try {
      console.log('Toggle Availability:', slotId, newStatus);
      message.success('Update Availability Status Success');
      loadTimeSlots();
    } catch (error) {
      message.error('Update Availability Status Failed');
      console.error('Update Availability Status Failed:', error);
    }
  };

  return (
    <div>
      <Title level={2}>Availability Management</Title>
      <Paragraph>
        Management Room Time slot Availability, can Settings specific Date and Time Open Status.
      </Paragraph>

      <Row gutter={[16, 16]}>
        {/* Left Side: Calendar */}
        <Col xs={24} lg={14}>
          <Card title="Select Date">
            <Calendar
              value={selectedDate}
              onSelect={setSelectedDate}
              cellRender={getCellRender}
              headerRender={({ value, type, onChange, onTypeChange }) => (
                <div style={{ padding: 8 }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Title level={4}>
                        {value.format('YYYY/MM')}
                      </Title>
                    </Col>
                    <Col>
                      <Space>
                        <Button onClick={() => onChange(value.subtract(1, 'month'))}>
                          Last Month
                        </Button>
                        <Button onClick={() => onChange(dayjs())}>
                          Today
                        </Button>
                        <Button onClick={() => onChange(value.add(1, 'month'))}>
                          Next Month
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                </div>
              )}
            />
          </Card>
        </Col>

        {/* Right：Room Selection and Time slot Management */}
        <Col xs={24} lg={10}>
          <Card
            title="Room and Time slot Settings"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
                disabled={!selectedRoom}
              >
                Add NewTime slot
              </Button>
            }
          >
            {/* Room Selection */}
            <div style={{ marginBottom: 16 }}>
              <Select
                placeholder="Select Room"
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
                  {selectedDate.format('MM/DD/YYYY')} 
                  ({selectedDate.format('dddd')})
                </span>
              </Space>
            </div>

            {/* Time slotList */}
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
                          <div style={{ color: '#ff4d4f' }}>Reason: {slot.reason}</div>
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

      {/* Add New/Edit Time slot Popup */}
      <Modal
        title={editingSlot ? 'Edit Time slot' : 'Add New Time slot'}
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
            label="Time Range"
            rules={[{ required: true, message: 'Please select Time Range' }]}
          >
            <TimePicker.RangePicker
              format="HH:mm"
              minuteStep={30}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="maxCapacity"
            label="Max Capacity"
            rules={[{ required: true, message: 'Please enter Max Capacity' }]}
          >
            <Select placeholder="Select Max Capacity">
              <Option value={10}>10</Option>
              <Option value={20}>20</Option>
              <Option value={30}>30</Option>
              <Option value={50}>50</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="isAvailable"
            label="Is Open"
            valuePropName="checked"
          >
            <Switch checkedChildren="Open" unCheckedChildren="Close" />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Close Reason"
            help="Only required when Closed"
          >
            <Select placeholder="Select Close Reason" allowClear>
              <Option value="Equipment Maintenance">Equipment Maintenance</Option>
              <Option value="Cleaning and Disinfection">Cleaning and Disinfection</Option>
              <Option value="Special Activity">Special Activity</Option>
              <Option value="Other">Other</Option>
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
