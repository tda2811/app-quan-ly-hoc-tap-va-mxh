import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Đăng Xuất',
      'Bạn có chắc chắn muốn đăng xuất giao diện Sinh Viên?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/');
          } 
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hồ Sơ Của Bạn</Text>
      <Text style={styles.subtitle}>{user?.full_name || user?.email || 'Sinh Viên Template'}</Text>
      
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Đăng Xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#B71C1C' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 10, marginBottom: 30 },
  logoutBtn: { backgroundColor: '#FEEEEE', borderWidth: 1, borderColor: '#B71C1C', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  logoutText: { color: '#B71C1C', fontWeight: 'bold' }
});
