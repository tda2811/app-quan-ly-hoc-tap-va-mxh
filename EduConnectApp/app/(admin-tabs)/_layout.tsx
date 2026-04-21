import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

import { useAuth } from '../../src/context/AuthContext';

export default function AdminLayout() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#D32F2F',
        headerShown: true,
        tabBarButton: HapticTab,
        tabBarStyle: Platform.select({
          ios: { position: 'absolute' },
          default: {
            height: 60,
            paddingBottom: 10,
            paddingTop: 8,
            backgroundColor: '#FFF',
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tổng Quan',
          headerTitle: 'Thông Tin Quản Trị',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Người Dùng',
          headerTitle: 'Danh Sách Tài Khoản',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Hội Nhóm',
          headerTitle: 'Quản Lý Hội Nhóm',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bubbles.and.sparkles.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Xem Thêm',
          headerTitle: 'Menu Chức Năng',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="line.3.horizontal" color={color} />,
        }}
      />

      {/* Hidden Tabs (Href null keeps the route but hides the bottom icon) */}
      <Tabs.Screen
        name="classes"
        options={{
          href: null,
          title: 'Lớp Học',
          headerTitle: 'Danh Sách Lớp & Ngành',
        }}
      />
      <Tabs.Screen
        name="schedules"
        options={{
          href: null,
          title: 'Lịch Học',
          headerTitle: 'Quản Lý Lịch Học',
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          href: null,
          title: 'Lịch Thi',
          headerTitle: 'Quản Lý Lịch Thi',
        }}
      />
      <Tabs.Screen
        name="grades"
        options={{
          href: null,
          title: 'Quản Lý Điểm',
          headerTitle: 'Quản Lý Điểm Sinh Viên',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: null,
          title: 'Tin Nhắn',
          headerTitle: 'Trò Chuyện Hệ Thống',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          title: 'Cá Nhân',
          headerTitle: 'Hồ Sơ Admin',
        }}
      />
    </Tabs>
  );
}
