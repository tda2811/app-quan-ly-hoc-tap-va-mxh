import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../src/services/authService';
import { Stack, useRouter } from 'expo-router';

interface Post {
  id: number;
  user_id: number;
  content: string;
  created_at: string;
  group_id?: number;
  email: string;
  full_name?: string;
  group_name?: string;
  likes_count?: number;
  comments_count?: number;
}

export default function AdminPostsScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/posts`);
      if (res.data.success) setPosts(res.data.data);
    } catch (err) {
      console.error('Lỗi tải bài viết:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa bài viết này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await axios.delete(`${API_URL}/admin/posts/${id}`);
            if (res.data.success) {
              Alert.alert('Thành công', 'Đã xóa bài viết.');
              fetchPosts();
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa bài viết.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Post }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.authorName}>{item.full_name || item.email}</Text>
        <Text style={styles.timeText}>{new Date(item.created_at).toLocaleDateString('vi-VN')}</Text>
      </View>
      <Text style={styles.cardDesc}>Nhóm: {item.group_name || 'Tường Cá Nhân'}</Text>
      <Text style={styles.contentPreview} numberOfLines={3}>{item.content}</Text>
      <View style={{ flexDirection: 'row', marginTop: 10 }}>
        <Text style={styles.statsText}>👍 {item.likes_count}</Text>
        <Text style={[styles.statsText, { marginLeft: 16 }]}>💬 {item.comments_count}</Text>
      </View>
      <View style={styles.actRow}>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteBtnText}>Xóa Bài Viết</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Quản Lý Bài Viết', headerBackTitle: 'Trở lại' }} />
      {loading ? (
        <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 20 }} />
      ) : posts.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có bài viết nào.</Text>
      ) : (
        <FlatList
          data={posts}
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  authorName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  timeText: { fontSize: 12, color: '#888' },
  cardDesc: { color: '#00796B', fontSize: 13, marginBottom: 8, fontWeight: '500' },
  contentPreview: { fontSize: 14, color: '#444', lineHeight: 20 },
  statsText: { fontSize: 13, color: '#666', fontWeight: '500' },
  actRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  deleteBtn: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteBtnText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 13 },
});
