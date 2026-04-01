import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../src/services/authService';
import { useAuth } from '../../src/context/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface PostItem {
  id: number;
  user_id: string;
  content: string;
  full_name?: string;
  email?: string;
  group_name?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export default function FeedScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/student/posts`);
      if (res.data.success) setPosts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      Alert.alert('Tham khảo', 'Vui lòng nhập nội dung bài viết.');
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/student/posts`, {
        user_id: user.id,
        content: newPostContent
      });

      if (res.data.success) {
        Alert.alert('Thành công', 'Đăng bài viết thành công!');
        setNewPostContent('');
        setModalVisible(false);
        fetchPosts();
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể đăng bài viết.');
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const res = await axios.post(`${API_URL}/student/posts/like`, { user_id: user.id, post_id: postId });
      if (res.data.success) fetchPosts();
    } catch (err) {
      console.error('Lỗi like:', err);
    }
  };

  const renderItem = ({ item }: { item: PostItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.posterName}>{item.full_name || 'Người dùng ẩn danh'}</Text>
          <Text style={styles.posterEmail}>{item.email}</Text>
        </View>
        {item.group_name && <Text style={styles.groupBadge}>{item.group_name}</Text>}
      </View>
      <Text style={styles.content}>{item.content}</Text>
      <View style={styles.cardFooter}>
         <TouchableOpacity style={styles.footerAction} onPress={() => handleLike(item.id)}>
            <Text style={styles.footerText}>👍 {item.likes_count} Thích</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.footerAction}>
            <Text style={styles.footerText}>💬 {item.comments_count} Bình luận</Text>
         </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>EduFeed</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
           <IconSymbol name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#B71C1C" style={{ marginTop: 20 }} />
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

      {/* Modal Đăng Bài */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
         <View style={styles.modalBackDrop}>
            <View style={styles.modalContent}>
               <Text style={styles.modalTitle}>Tạo Bài Viết Mới</Text>
               <TextInput 
                  style={styles.input} 
                  placeholder="Hôm nay bạn thấy thế nào?" 
                  multiline 
                  numberOfLines={4} 
                  value={newPostContent}
                  onChangeText={setNewPostContent}
               />
               
               <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#CCC'}]} onPress={() => setModalVisible(false)}>
                     <Text style={styles.btnText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#B71C1C'}]} onPress={handleCreatePost}>
                     <Text style={styles.btnText}>Đăng Tải</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFF', elevation: 2 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#B71C1C' },
  addBtn: { backgroundColor: '#B71C1C', padding: 10, borderRadius: 50, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888', fontSize: 16 },

  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  posterName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  posterEmail: { fontSize: 12, color: '#666' },
  groupBadge: { backgroundColor: '#FFEBEE', color: '#D32F2F', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 11, fontWeight: 'bold' },
  content: { fontSize: 15, color: '#444', marginBottom: 15, lineHeight: 22 },
  cardFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
  footerAction: { marginRight: 20 },
  footerText: { fontSize: 13, color: '#666' },

  modalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '90%', padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#B71C1C', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#DDD', padding: 12, borderRadius: 8, height: 100, fontSize: 15, textAlignVertical: 'top', marginBottom: 15 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});
