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
        name="classes"
        options={{
          title: 'Lớp Học',
          headerTitle: 'Danh Sách Lớp & Ngành',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet.indent" color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedules"
        options={{
          title: 'Lịch Học',
          headerTitle: 'Quản Lý Lịch Học',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: 'Lịch Thi',
          headerTitle: 'Quản Lý Lịch Thi',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name={"calendar.fill" as any} color={color} />,
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
        name="chat"
        options={{
          title: 'Tin Nhắn',
          headerTitle: 'Trò Chuyện Hệ Thống',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá Nhân',
          headerTitle: 'Hồ Sơ Admin',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
