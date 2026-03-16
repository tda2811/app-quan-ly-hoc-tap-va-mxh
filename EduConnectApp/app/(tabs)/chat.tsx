import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tin Nhắn</Text>
      <Text style={styles.subtitle}>Giữ liên lạc với giảng viên và bạn học.</Text>
      
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Danh sách trò chuyện trống</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#999',
  }
});
