import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '../../src/context/AuthContext';

export default function MoreScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();

  const menuItems = [
    { title: 'Thông Báo', icon: 'bell.fill', route: '/(tabs)/notifications' as const, color: '#B71C1C' },
    { title: 'Hội Nhóm & Cộng Đồng', icon: 'bubbles.and.sparkles.fill', route: '/(tabs)/groups' as const, color: '#2E7D32' },
    { title: 'Hồ Sơ Cá Nhân', icon: 'person.fill', route: '/(tabs)/profile' as const, color: '#1976D2' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
           <Text style={styles.avatarText}>{user?.full_name ? user.full_name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'U')}</Text>
        </View>
        <View style={{marginLeft: 15}}>
          <Text style={styles.userName}>{user?.full_name || 'Người Dùng'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
             <Text style={styles.roleText}>{user?.role === 'teacher' ? 'GIẢNG VIÊN' : 'SINH VIÊN'}</Text>
          </View>
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
               <IconSymbol name={item.icon as any} size={24} color={item.color} />
            </View>
            <Text style={styles.menuText}>{item.title}</Text>
            <IconSymbol name="chevron.right" size={16} color="#CCC" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
        <Text style={styles.logoutText}>Đăng Xuất</Text>
      </TouchableOpacity>
      
      <Text style={styles.versionText}>EduConnect v1.0.4</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, backgroundColor: '#FFF', padding: 15, borderRadius: 15, elevation: 1 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#B71C1C', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  userEmail: { fontSize: 12, color: '#666', marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 5 },
  roleText: { fontSize: 10, fontWeight: 'bold', color: '#666' },
  
  menuGrid: { backgroundColor: '#FFF', borderRadius: 15, paddingVertical: 5, elevation: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 15, fontWeight: '500', color: '#444' },
  
  logoutBtn: { marginTop: 30, backgroundColor: '#FFF', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#B71C1C' },
  logoutText: { color: '#B71C1C', fontWeight: 'bold', fontSize: 15 },
  versionText: { textAlign: 'center', color: '#CCC', fontSize: 12, marginTop: 30 }
});
