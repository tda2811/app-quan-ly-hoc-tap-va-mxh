import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, 
  ActivityIndicator, Modal, TextInput, Image, 
  Keyboard, TouchableWithoutFeedback, RefreshControl, ScrollView
} from 'react-native';
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { API_URL } from '../src/services/authService';
import { useAuth } from '../src/context/AuthContext';
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

export default function GroupDetailScreen() {
  const { id, name } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();

  if (!user || !id) return null;

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
  }, [id]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/student/posts?group_id=${id}`);
      if (res.data.success) setPosts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreatePost = async () => {
    Keyboard.dismiss();
    if (!newPostContent.trim() && !pickedFile) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung.');
      return;
    }

    try {
      setCreating(true);
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('content', newPostContent.trim());
      formData.append('group_id', id.toString());
      
      if (pickedFile) {
        formData.append('file', {
          uri: pickedFile.uri,
          name: pickedFile.name,
          type: pickedFile.mimeType || 'application/octet-stream',
        } as any);
      }

      await axios.post(`${API_URL}/student/posts`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setNewPostContent('');
      setPickedFile(null);
      setModalVisible(false);
      fetchPosts();
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
    } catch (err) { console.error('Lỗi like:', err); }
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
    } catch (err) { console.error(err); } finally { setLoadingComments(false); }
  };

  const handleSendComment = async () => {
    Keyboard.dismiss();
    if (!newComment.trim() || !selectedPost) return;
    try {
      const res = await axios.post(`${API_URL}/student/posts/comment`, {
        user_id: user.id, post_id: selectedPost.id, content: newComment.trim()
      });
      if (res.data.success) {
        setNewComment('');
        const res2 = await axios.get(`${API_URL}/student/posts/${selectedPost.id}/comments`);
        if (res2.data.success) setComments(res2.data.data);
        setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, comments_count: p.comments_count + 1 } : p));
      }
    } catch (err) { Alert.alert('Lỗi', 'Không thể gửi bình luận.'); }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: (name as string) || 'Chi tiết nhóm', headerBackTitle: 'Trở lại' }} />
      
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.posterName}>{item.full_name || item.email}</Text>
                <Text style={styles.posterEmail}>{item.email}</Text>
              </View>
            </View>
            <Text style={styles.content}>{item.content}</Text>
            {item.media_url && (
              <View style={styles.mediaContainer}>
                {item.media_type === 'image' ? (
                   <Image source={{ uri: `${API_URL.replace('/api', '')}${item.media_url}` }} style={styles.postImage} resizeMode="cover" />
                ) : (
                  <TouchableOpacity style={styles.fileAttachment} onPress={() => WebBrowser.openBrowserAsync(`${API_URL.replace('/api', '')}${item.media_url}`)}>
                      <Text style={styles.fileIcon}>📄</Text>
                      <Text style={styles.fileName}>Tài liệu đính kèm</Text>
                  </TouchableOpacity>
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
        )}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={loading ? <ActivityIndicator size="large" color="#1B5E20" /> : <Text style={styles.emptyText}>Chưa có bài viết nào trong nhóm.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPosts(); }} />}
      />

      {/* FAB to Add Post */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <IconSymbol name="plus" size={30} color="#FFF" />
      </TouchableOpacity>

      {/* Modal Create Post */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBackDrop}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Đăng bài vào {name}</Text>
                    <TextInput 
                      style={styles.input} placeholder="Bạn đang nghĩ gì?" multiline value={newPostContent} onChangeText={setNewPostContent}
                    />
                    <TouchableOpacity style={styles.pickFileBtn} onPress={() => DocumentPicker.getDocumentAsync({type:'*/*'}).then(r => !r.canceled && setPickedFile(r.assets[0]))}>
                      <Text style={styles.pickFileText}>{pickedFile ? `📄 ${pickedFile.name}` : '📎 Ảnh / Tài liệu'}</Text>
                    </TouchableOpacity>
                    <View style={styles.modalActions}>
                      <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#CCC'}]} onPress={() => setModalVisible(false)} disabled={creating}>
                          <Text style={styles.btnText}>Hủy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#1B5E20'}]} onPress={handleCreatePost} disabled={creating}>
                          {creating ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.btnText}>Đăng Bài</Text>}
                      </TouchableOpacity>
                    </View>
                </View>
            </View>
          </TouchableWithoutFeedback>
       </Modal>

       {/* Comment Modal */}
       <Modal visible={commentModalVisible} animationType="fade" transparent={true}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.commentModalBackDrop}>
                <View style={styles.commentModalContent}>
                    <View style={styles.commentHeader}>
                        <Text style={styles.commentTitle}>Bình luận</Text>
                        <TouchableOpacity onPress={() => setCommentModalVisible(false)}><Text style={{color:'#666', fontWeight:'bold'}}>Đóng</Text></TouchableOpacity>
                    </View>
                    <FlatList 
                      data={comments} keyExtractor={(c)=>c.id.toString()} style={{maxHeight: 300}}
                      renderItem={({item})=>(
                        <View style={styles.commentItem}>
                            <Text style={styles.commentUser}>{item.full_name || item.email}</Text>
                            <Text style={styles.commentText}>{item.content}</Text>
                        </View>
                      )}
                    />
                    <View style={styles.commentInputRow}>
                      <TextInput style={styles.commentInput} placeholder="Viết bình luận..." value={newComment} onChangeText={setNewComment} />
                      <TouchableOpacity style={styles.sendCommentBtn} onPress={handleSendComment}><Text style={{color:'#FFF', fontWeight:'bold'}}>Gửi</Text></TouchableOpacity>
                    </View>
                </View>
            </View>
          </TouchableWithoutFeedback>
       </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  cardHeader: { marginBottom: 10 },
  posterName: { fontWeight: 'bold', color: '#1a1a1a' },
  posterEmail: { fontSize: 11, color: '#888' },
  content: { fontSize: 15, color: '#333', marginBottom: 12 },
  mediaContainer: { marginBottom: 12, borderRadius: 8, overflow: 'hidden' },
  postImage: { width: '100%', height: 220 },
  fileAttachment: { flexDirection: 'row', padding: 12, backgroundColor: '#F0F7FF', borderRadius: 8, alignItems: 'center' },
  fileIcon: { fontSize: 22, marginRight: 10 },
  fileName: { flex: 1, fontSize: 13, fontWeight: 'bold', color: '#1976D2' },
  cardFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10 },
  footerAction: { marginRight: 25 },
  footerText: { fontSize: 13, color: '#666' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 50 },
  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#1B5E20', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  modalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '90%', padding: 20, borderRadius: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1B5E20', textAlign: 'center', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 10, height: 100, padding: 12, textAlignVertical: 'top', marginBottom: 15, fontSize: 15 },
  pickFileBtn: { borderStyle: 'dashed', borderWidth: 1, borderColor: '#1B5E20', borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 15 },
  pickFileText: { color: '#1B5E20', fontSize: 14, fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  commentModalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  commentModalContent: { backgroundColor: '#FFF', width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  commentTitle: { fontSize: 16, fontWeight: 'bold', color: '#1B5E20' },
  commentItem: { backgroundColor: '#F5F6F7', padding: 10, borderRadius: 10, marginBottom: 10 },
  commentUser: { fontWeight: 'bold', fontSize: 13, color: '#333' },
  commentText: { fontSize: 14, color: '#444' },
  commentInputRow: { flexDirection: 'row', marginTop: 15, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10 },
  commentInput: { flex: 1, backgroundColor: '#F0F2F5', borderRadius: 25, paddingHorizontal: 15, height: 45 },
  sendCommentBtn: { backgroundColor: '#1B5E20', paddingHorizontal: 20, height: 45, borderRadius: 25, justifyContent: 'center', marginLeft: 10 }
});
