const fs = require('fs');

// 读取文件
const filePath = './src/services/locationService.js';
let content = fs.readFileSync(filePath, 'utf8');

// 批量替换中文
const replacements = [
  ['自习室A', 'Study Room A'],
  ['library主楼', 'Library Main Building'],
  ['安静自习环境，配备个人座位 and 台灯', 'Quiet study environment with individual seats and desk lamps'],
  ['空调', 'Air Conditioning'],
  ['插座', 'Power Outlets'],
  ['台灯', 'Desk Lamps'],
  ['会议室B', 'Meeting Room B'],
  ['library附楼', 'Library Annex'],
  ['配备投影仪 and 会议桌，适合小团队Meeting and 讨论', 'Equipped with projector and conference table, suitable for small team meetings and discussions'],
  ['投影仪', 'Projector'],
  ['会议桌', 'Conference Table'],
  ['白板', 'Whiteboard'],
  ['讨论室C', 'Discussion Room C'],
  ['library三楼', 'Library Third Floor'],
  ['开放式讨论space，鼓励团队合作 and brainstorming', 'Open discussion space encouraging teamwork and brainstorming'],
  ['移动白板', 'Mobile Whiteboard'],
  ['机房D', 'Computer Lab D'],
  ['technology楼', 'Technology Building'],
  ['配备高性能电脑 and 专业软件，用于编程 and 设计work', 'Equipped with high-performance computers and professional software for programming and design work'],
  ['高性能电脑', 'High-Performance Computers'],
  ['专业软件', 'Professional Software'],
  ['音响设备', 'Audio Equipment'],
  ['阅读区E', 'Reading Area E'],
  ['library一楼', 'Library First Floor'],
  ['舒适阅读environment，提供安静reading space', 'Comfortable reading environment providing quiet reading space'],
  ['舒适座椅', 'Comfortable Chairs'],
  ['阅读灯', 'Reading Lights'],
  ['小组室F', 'Group Room F'],
  ['library二楼', 'Library Second Floor'],
  ['适合小组学习 and project合作', 'Suitable for group study and project collaboration'],
  ['可移动桌椅', 'Movable Desks and Chairs'],
  ['演示屏幕', 'Presentation Screen'],
  // 其他可能的中文
  ['获取所有Room', 'Get all rooms'],
  ['模拟', 'Mock'],
  ['数据', 'data'],
  ['延迟', 'delay'],
  ['真实', 'real'],
  ['调用', 'call'],
  ['时间', 'time'],
  // 注释中的中文
  ['// 获取', '// Get'],
  ['// 创建', '// Create'],
  ['// 更新', '// Update'],
  ['// 删除', '// Delete'],
  ['// 通过', '// By'],
  ['获取Room', 'get room'],
  ['创建Room', 'create room'],
  ['更新Room', 'update room'],
  ['删除Room', 'delete room'],
  ['通过ID', 'by ID'],
  ['检查Room', 'check room'],
  ['是否存在', 'exists'],
  ['Room不存在', 'Room not found'],
  ['Room创建成功', 'Room created successfully'],
  ['Room更新成功', 'Room updated successfully'],
  ['Room删除成功', 'Room deleted successfully']
];

// 执行替换
replacements.forEach(([from, to]) => {
  content = content.replace(new RegExp(from, 'g'), to);
});

// 写回文件
fs.writeFileSync(filePath, content, 'utf8');
console.log('locationService.js has been updated with English translations');
