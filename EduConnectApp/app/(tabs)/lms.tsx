import { View, Text, StyleSheet } from 'react-native';

export default function LMSScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lịch Học & Điểm Thi</Text>
      <Text style={styles.subtitle}>Quét QR điểm danh mạng lan ở màn hình này</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2D58E6' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 10 }
});
