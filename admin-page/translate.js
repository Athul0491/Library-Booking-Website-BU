#!/usr/bin/env node

// Batch translation script for Chinese to English UI text
import fs from 'fs';
import path from 'path';

// Translation mappings
const translations = {
  // Common UI terms
  '仪表板': 'Dashboard',
  '场地管理': 'Location Management',
  '预订管理': 'Booking Management',
  '可用性管理': 'Availability Management',
  '统计报表': 'Statistics & Reports',
  '添加': 'Add',
  '编辑': 'Edit',
  '删除': 'Delete',
  '搜索': 'Search',
  '筛选': 'Filter',
  '导出': 'Export',
  '保存': 'Save',
  '取消': 'Cancel',
  '确认': 'Confirm',
  '关闭': 'Close',
  '提交': 'Submit',
  '重置': 'Reset',
  '刷新': 'Refresh',
  '详情': 'Details',
  '查看': 'View',
  '操作': 'Actions',
  '状态': 'Status',
  '类型': 'Type',
  '名称': 'Name',
  '描述': 'Description',
  '时间': 'Time',
  '日期': 'Date',
  '房间': 'Room',
  '用户': 'User',
  '容量': 'Capacity',
  '可用': 'Available',
  '不可用': 'Unavailable',
  '已预订': 'Booked',
  '已确认': 'Confirmed',
  '待确认': 'Pending',
  '已取消': 'Cancelled',
  '已完成': 'Completed',
  '未到场': 'No Show',
  '总计': 'Total',
  '今日': 'Today',
  '本周': 'This Week',
  '本月': 'This Month',
  '加载中': 'Loading',
  '暂无数据': 'No Data',
  '操作成功': 'Operation Successful',
  '操作失败': 'Operation Failed',
  
  // Additional UI terms
  '加载': 'Load',
  '失败': 'Failed',
  '成功': 'Success',
  '数据': 'Data',
  '新增': 'Add New',
  '修改': 'Modify',
  '管理': 'Management',
  '系统': 'System',
  '设置': 'Settings',
  '配置': 'Configuration',
  '列表': 'List',
  '概览': 'Overview',
  '统计': 'Statistics',
  '报表': 'Report',
  '分析': 'Analysis',
  '热门': 'Popular',
  '最近': 'Recent',
  '活动': 'Activity',
  '活跃': 'Active',
  '增长': 'Growth',
  '率': 'Rate',
  '使用率': 'Usage Rate',
  '利用率': 'Utilization Rate',
  '预订量': 'Booking Volume',
  '收入': 'Revenue',
  '时长': 'Duration',
  '平均': 'Average',
  '总数': 'Total Count',
  '人数': 'Number of People',
  '次数': 'Times',
  '小时': 'Hours',
  '分钟': 'Minutes',
  '开始': 'Start',
  '结束': 'End',
  '开放': 'Open',
  '关闭': 'Closed',
  '维护': 'Maintenance',
  '楼层': 'Floor',
  '建筑': 'Building',
  '设备': 'Equipment',
  '价格': 'Price',
  '费用': 'Fee',
  '元': 'CNY',
  '联系': 'Contact',
  '邮箱': 'Email',
  '电话': 'Phone',
  '地址': 'Address',
  '备注': 'Notes',
  '评分': 'Rating',
  '评价': 'Review',
  '反馈': 'Feedback',
  '消息': 'Message',
  '通知': 'Notification',
  '提醒': 'Reminder',
  '警告': 'Warning',
  '错误': 'Error',
  '信息': 'Information',
  '帮助': 'Help',
  '支持': 'Support',
  
  // Status terms
  '待': 'Pending',
  '已': 'Completed',
  '未': 'Not',
  
  // Error messages and console logs
  '加载.*失败': 'Failed to load',
  '获取.*失败': 'Failed to fetch',
  '保存.*失败': 'Failed to save',
  '删除.*失败': 'Failed to delete',
  '更新.*失败': 'Failed to update',
  '创建.*失败': 'Failed to create',
};

// Function to apply translations to a file
function translateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const [chinese, english] of Object.entries(translations)) {
      const regex = new RegExp(chinese, 'g');
      if (content.includes(chinese)) {
        content = content.replace(regex, english);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Process all JSX files in src directory
const srcDir = './src';

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      translateFile(fullPath);
    }
  });
}

console.log('Starting batch translation...');
processDirectory(srcDir);
console.log('Translation complete!');
