import { View, Text, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hồ Sơ Sinh Viên</Text>
      <Text style={styles.subtitle}>Đăng xuất, cài đặt thông báo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2D58E6' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 10 }
});
