import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../src/services/authService';
import { Stack, useRouter } from 'expo-router';

export default function AdminDocumentsScreen() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/documents`);
      if (res.data.success) setDocuments(res.data.data);
    } catch (err) {
      console.error('Lỗi tải tài liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa tài liệu này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await axios.delete(`${API_URL}/admin/documents/${id}`);
            if (res.data.success) {
              Alert.alert('Thành công', 'Đã xóa tài liệu.');
              fetchDocuments();
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa tài liệu.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.typeBadge}>{item.file_type?.toUpperCase() || 'FILE'}</Text>
      </View>
      <Text style={styles.cardDesc}>Môn: {item.subject_name}</Text>
      <Text style={styles.cardDesc}>Người đăng: {item.uploader_email || 'N/A'}</Text>
      <View style={styles.actRow}>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteBtnText}>Xóa Trọng Tâm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Quản Lý File / Tài Liệu', headerBackTitle: 'Trở lại' }} />
      {loading ? (
        <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 20 }} />
      ) : documents.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có tài liệu nào.</Text>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888', fontSize: 16 },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
  typeBadge: {
    backgroundColor: '#E3F2FD',
    color: '#1976D2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardDesc: { color: '#666', fontSize: 13, marginBottom: 4 },
  actRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  deleteBtn: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteBtnText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 13 },
});
