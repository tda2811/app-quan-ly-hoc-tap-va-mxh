import React from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';

export default function GroupsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hội Nhóm & Cộng Đồng</Text>
      <Text style={styles.subtitle}>Nơi trao đổi kiến thức và tài liệu học tập cùng bạn bè.</Text>
      
      {/* Placeholder for groups list */}
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Chưa có nhóm nào được hiển thị</Text>
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
