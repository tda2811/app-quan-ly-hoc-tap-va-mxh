import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { useAuth } from '../../src/context/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#B71C1C',
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
          title: 'EduFeed',
          headerTitle: 'Mạng Xã Hội Học Tập',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="lms"
        options={{
          title: user?.role === 'teacher' ? 'Dạy Học' : 'Học Tập',
          headerTitle: 'Lịch Học & Điểm Số',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Tin Nhắn',
          headerTitle: 'Trò Chuyện',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
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

      {/* Hidden Tabs */}
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          title: 'Thông báo',
          headerTitle: 'Thông Báo Của Bạn',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          title: 'Cá Nhân',
          headerTitle: 'Hồ Sơ Của Bạn',
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          href: null,
          title: 'Hội Nhóm',
          headerTitle: 'Hội Nhóm & Cộng Đồng',
        }}
      />
    </Tabs>
  );
}
