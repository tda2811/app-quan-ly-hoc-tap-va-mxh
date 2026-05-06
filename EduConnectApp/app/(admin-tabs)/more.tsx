import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '../../src/context/AuthContext';

export default function AdminMoreScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();

  const menuItems = [
    { title: 'Lớp Học & Ngành', icon: 'list.bullet.indent', route: '/(admin-tabs)/classes' as const, color: '#1976D2' },
    { title: 'Quản Lý Môn Học', icon: 'book.fill', route: '/(admin-tabs)/subjects' as const, color: '#1B5E20' },
    { title: 'Quản Lý Lịch Học', icon: 'calendar', route: '/(admin-tabs)/schedules' as const, color: '#4CAF50' },
    { title: 'Quản Lý Lịch Thi', icon: 'calendar.badge.clock', route: '/(admin-tabs)/exams' as const, color: '#D32F2F' },
    { title: 'Quản Lý Điểm Số', icon: 'list.number', route: '/(admin-tabs)/grades' as const, color: '#795548' },
    { title: 'Quản Lý Bài Viết', icon: 'doc.text.fill', route: '/admin/posts' as const, color: '#FF9800' },
    { title: 'Tin Nhắn Hệ Thống', icon: 'message.fill', route: '/(admin-tabs)/chat' as const, color: '#9C27B0' },
    { title: 'Thông Báo / Broadcast', icon: 'bell.fill', route: '/admin/notifications' as const, color: '#E91E63' },
    { title: 'Kho Tài Liệu / File', icon: 'folder.fill', route: '/admin/documents' as const, color: '#607D8B' },
    { title: 'Hồ Sơ Cá Nhân', icon: 'person.fill', route: '/(admin-tabs)/profile' as const, color: '#333' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
           <Text style={styles.avatarText}>{user?.email?.[0].toUpperCase() || 'A'}</Text>
        </View>
        <View style={{marginLeft: 15}}>
          <Text style={styles.userName}>Administrator</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.menuItem} 
            onPress={() => router.push(item.route)}
          >
            <View style={[styles.iconBox, {backgroundColor: item.color + '15'}]}>
               <IconSymbol name={item.icon as any} size={26} color={item.color} />
            </View>
            <Text style={styles.menuText}>{item.title}</Text>
            <IconSymbol name="chevron.right" size={16} color="#CCC" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
        <Text style={styles.logoutText}>Đăng Xuất</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Phiên bản 1.0.4 - EduConnect Admin</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, backgroundColor: '#FFF', padding: 15, borderRadius: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: {width: 0, height: 2} },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  userEmail: { fontSize: 13, color: '#666', marginTop: 2 },
  
  menuGrid: { backgroundColor: '#FFF', borderRadius: 15, paddingVertical: 5, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: {width: 0, height: 2} },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 15, fontWeight: '500', color: '#444' },
  
  logoutBtn: { marginTop: 25, backgroundColor: '#FFEAEA', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FFCDD2' },
  logoutText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 15 },
  versionText: { textAlign: 'center', color: '#BBB', fontSize: 12, marginTop: 30 }
});
