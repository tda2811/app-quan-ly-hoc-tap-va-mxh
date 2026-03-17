import { View, Text, StyleSheet } from 'react-native';

export default function FeedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>EduFeed</Text>
      <Text style={styles.subtitle}>Bảng tin Mạng xã hội của riêng Sinh Viên</Text>
      {/* Tính năng API Đăng bài và Lướt Feed sẽ được nhúng vào đây */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#B71C1C' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 10 }
});
