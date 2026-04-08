import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, Image } from 'react-native';
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import { API_URL } from '../../src/services/authService';
import { useAuth } from '../../src/context/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface PostItem {
  id: number;
  user_id: string;
  full_name?: string;
  email: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  media_url?: string;
  media_type?: string;
  group_name?: string;
}

export default function FeedScreen() {
  const { user } = useAuth();
  if (!user) return null;
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Post Creation States
  const [modalVisible, setModalVisible] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [pickedFile, setPickedFile] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  // Comment States
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

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

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPickedFile(result.assets[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !pickedFile) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung hoặc đính kèm tài liệu.');
      return;
    }

    try {
      setCreating(true);
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('content', newPostContent.trim());
      
      if (pickedFile) {
        formData.append('file', {
          uri: pickedFile.uri,
          name: pickedFile.name,
          type: pickedFile.mimeType || 'application/octet-stream',
        } as any);
      }

      const res = await axios.post(`${API_URL}/student/posts`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        Alert.alert('Thành công', 'Đăng bài viết thành công!');
        setNewPostContent('');
        setPickedFile(null);
        setModalVisible(false);
        fetchPosts();
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể đăng bài viết.');
    } finally {
      setCreating(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const res = await axios.post(`${API_URL}/student/posts/like`, { user_id: user.id, post_id: postId });
      if (res.data.success) {
        setPosts(prev => prev.map(p => p.id === postId ? {
           ...p, 
           likes_count: res.data.message.includes('bỏ') ? Math.max(0, p.likes_count - 1) : p.likes_count + 1 
        } : p));
      }
    } catch (err) {
      console.error('Lỗi like:', err);
    }
  };

  const openComments = async (post: PostItem) => {
    setSelectedPost(post);
    setCommentModalVisible(true);
    setComments([]);
    setNewComment('');
    try {
      setLoadingComments(true);
      const res = await axios.get(`${API_URL}/student/posts/${post.id}/comments`);
      if (res.data.success) setComments(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !selectedPost) return;
    try {
      const res = await axios.post(`${API_URL}/student/posts/comment`, {
        user_id: user.id,
        post_id: selectedPost.id,
        content: newComment.trim()
      });
      if (res.data.success) {
        setNewComment('');
        // Refresh comments list
        const res2 = await axios.get(`${API_URL}/student/posts/${selectedPost.id}/comments`);
        if (res2.data.success) setComments(res2.data.data);
        // Update post comment count locally
        setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, comments_count: p.comments_count + 1 } : p));
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể gửi bình luận.');
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
      
      {item.media_url && (
        <View style={styles.mediaContainer}>
          {item.media_type === 'image' ? (
             <Image source={{ uri: `${API_URL.replace('/api', '')}${item.media_url}` }} style={styles.postImage} resizeMode="cover" />
          ) : (
             <View style={styles.fileAttachment}>
                <Text style={styles.fileIcon}>📄</Text>
                <Text style={styles.fileName}>Tài liệu đính kèm</Text>
                <TouchableOpacity onPress={() => Alert.alert('Thông báo', 'Vui lòng xem tài liệu trên bản Web hoặc tải về máy.')}>
                   <Text style={{color: '#1976D2', fontSize: 12, fontWeight: 'bold'}}>XEM FILE</Text>
                </TouchableOpacity>
             </View>
          )}
        </View>
      )}

      <View style={styles.cardFooter}>
         <TouchableOpacity style={styles.footerAction} onPress={() => handleLike(item.id)}>
            <Text style={styles.footerText}>👍 {item.likes_count} Thích</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.footerAction} onPress={() => openComments(item)}>
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

                <TouchableOpacity style={styles.pickFileBtn} onPress={pickDocument}>
                   <Text style={styles.pickFileText}>{pickedFile ? `📄 ${pickedFile.name}` : '📎 Ghim tài liệu / Ảnh'}</Text>
                </TouchableOpacity>
                
                <View style={styles.modalActions}>
                   <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#CCC'}]} onPress={() => { setModalVisible(false); setPickedFile(null); }} disabled={creating}>
                      <Text style={styles.btnText}>Hủy</Text>
                   </TouchableOpacity>
                   <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#B71C1C'}]} onPress={handleCreatePost} disabled={creating}>
                      {creating ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.btnText}>Đăng Tải</Text>}
                   </TouchableOpacity>
                </View>
             </View>
          </View>
       </Modal>

       {/* Modal Bình Luận */}
       <Modal visible={commentModalVisible} animationType="fade" transparent={true}>
          <View style={styles.commentModalBackDrop}>
             <View style={styles.commentModalContent}>
                <View style={styles.commentHeader}>
                   <Text style={styles.commentTitle}>Bình Luận</Text>
                   <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                      <Text style={{color: '#666', fontWeight: 'bold'}}>Đóng</Text>
                   </TouchableOpacity>
                </View>

                {loadingComments ? (
                   <ActivityIndicator color="#B71C1C" style={{ marginVertical: 20 }} />
                ) : comments.length === 0 ? (
                   <Text style={{ textAlign: 'center', color: '#999', marginVertical: 30 }}>Chưa có bình luận nào.</Text>
                ) : (
                   <FlatList 
                      data={comments}
                      keyExtractor={(c) => c.id.toString()}
                      renderItem={({ item }) => (
                         <View style={styles.commentItem}>
                            <Text style={styles.commentUser}>{item.full_name || item.email}</Text>
                            <Text style={styles.commentText}>{item.content}</Text>
                         </View>
                      )}
                      style={{ maxHeight: 300 }}
                   />
                )}

                <View style={styles.commentInputRow}>
                   <TextInput 
                      style={styles.commentInput} 
                      placeholder="Viết bình luận..." 
                      value={newComment} 
                      onChangeText={setNewComment} 
                   />
                   <TouchableOpacity style={styles.sendCommentBtn} onPress={handleSendComment}>
                      <IconSymbol name="plus" size={24} color="#FFF" />
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
  
  mediaContainer: { marginBottom: 15, borderRadius: 8, overflow: 'hidden', backgroundColor: '#F0F0F0' },
  postImage: { width: '100%', height: 200 },
  fileAttachment: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#E3F2FD' },
  fileIcon: { fontSize: 24, marginRight: 10 },
  fileName: { flex: 1, fontSize: 14, color: '#333', fontWeight: 'bold' },

  cardFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
  footerAction: { marginRight: 20 },
  footerText: { fontSize: 13, color: '#666' },

  modalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '90%', padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#B71C1C', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#DDD', padding: 12, borderRadius: 8, height: 100, fontSize: 15, textAlignVertical: 'top', marginBottom: 10 },
  pickFileBtn: { padding: 12, borderWidth: 1, borderColor: '#B71C1C', borderStyle: 'dotted', borderRadius: 8, marginBottom: 15, alignItems: 'center' },
  pickFileText: { color: '#B71C1C', fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  commentModalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  commentModalContent: { backgroundColor: '#FFF', width: '90%', borderRadius: 12, padding: 20 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 10 },
  commentTitle: { fontSize: 18, fontWeight: 'bold', color: '#B71C1C' },
  commentItem: { marginBottom: 12, backgroundColor: '#F8F9FA', padding: 10, borderRadius: 8 },
  commentUser: { fontWeight: 'bold', color: '#333', fontSize: 13, marginBottom: 2 },
  commentText: { fontSize: 14, color: '#555' },
  commentInputRow: { flexDirection: 'row', marginTop: 15, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 15 },
  commentInput: { flex: 1, backgroundColor: '#F0F2F5', borderRadius: 20, paddingHorizontal: 15, height: 40 },
  sendCommentBtn: { backgroundColor: '#B71C1C', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }
});
