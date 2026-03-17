import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#D32F2F', // Màu đỏ cho Admin dễ phân biệt
        headerShown: true,
        tabBarButton: HapticTab,
        tabBarStyle: Platform.select({
          ios: { position: 'absolute' },
          default: {},
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
