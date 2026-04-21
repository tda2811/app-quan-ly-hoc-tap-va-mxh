import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, 
  ActivityIndicator, Modal, TextInput, Image, ScrollView,
  Keyboard, TouchableWithoutFeedback 
} from 'react-native';
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
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

interface Group {
  id: number;
  name: string;
  group_type: string;
}

export default function FeedScreen() {
  const { user } = useAuth();
  if (!user) return null;

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedFilterGroup, setSelectedFilterGroup] = useState<number | null>(null);

  // Post Creation States
  const [modalVisible, setModalVisible] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [pickedFile, setPickedFile] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [selectedPostGroup, setSelectedPostGroup] = useState<number | null>(null);
  const [groupSearch, setGroupSearch] = useState('');

  // Comment States
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchPosts();
  }, [selectedFilterGroup]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
    await fetchPosts();
    setRefreshing(false);
  };

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${API_URL}/student/my-groups?user_id=${user.id}`);
      if (res.data.success) setGroups(res.data.data);
    } catch (err) { console.error('Lỗi lấy nhóm:', err); }
  };

  const fetchPosts = async () => {
    try {
      if (!refreshing) setLoading(true);
      let url = `${API_URL}/student/posts`;
      if (selectedFilterGroup) url += `?group_id=${selectedFilterGroup}`;
      const res = await axios.get(url);
      if (res.data.success) setPosts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    Keyboard.dismiss();
    if (!newPostContent.trim() && !pickedFile) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung hoặc đính kèm tài liệu.');
      return;
    }

    try {
      setCreating(true);
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('content', newPostContent.trim());
      if (selectedPostGroup) formData.append('group_id', selectedPostGroup.toString());
      
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
        setSelectedPostGroup(null);
        setGroupSearch('');
        setModalVisible(false);
        fetchPosts();
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể đăng bài viết.');
    } finally {
      setCreating(false);
    }
  };

  const handleViewFile = async (fileUrl: string) => {
    try {
      const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${API_URL.replace('/api', '')}${fileUrl}`;
      await WebBrowser.openBrowserAsync(fullUrl);
    } catch (err) { Alert.alert('Lỗi', 'Không thể mở file.'); }
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
      <View style={styles.headerRow}>
        <Text style={styles.title}>EduFeed</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
           <IconSymbol name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Group Filter Bar */}
      <View style={styles.filterContainer}>
         <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 16}}>
            <TouchableOpacity 
               style={[styles.filterItem, selectedFilterGroup === null && styles.filterItemActive]}
               onPress={() => setSelectedFilterGroup(null)}
            >
               <Text style={[styles.filterText, selectedFilterGroup === null && styles.filterTextActive]}>Tất cả</Text>
            </TouchableOpacity>
            {groups.map(g => (
               <TouchableOpacity 
                  key={g.id} 
                  style={[styles.filterItem, selectedFilterGroup === g.id && styles.filterItemActive]}
                  onPress={() => setSelectedFilterGroup(g.id)}
               >
                  <Text style={[styles.filterText, selectedFilterGroup === g.id && styles.filterTextActive]}>{g.name}</Text>
               </TouchableOpacity>
            ))}
         </ScrollView>
      </View>

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
                      <TouchableOpacity onPress={() => handleViewFile(item.media_url || '')}>
                         <Text style={{color: '#1976D2', fontSize: 12, fontWeight: 'bold'}}>📄 XEM / TẢI FILE</Text>
                      </TouchableOpacity>
                   </View>
                )}
              </View>
            )}
            <View style={styles.cardFooter}>
               <TouchableOpacity style={styles.footerAction} onPress={() => handleLike(item.id)}>
                  <IconSymbol name="hand.thumbsup.fill" size={18} color="#666" />
                  <Text style={styles.footerText}>{item.likes_count} Thích</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.footerAction} onPress={() => openComments(item)}>
                  <IconSymbol name="bubble.left.fill" size={18} color="#666" />
                  <Text style={styles.footerText}>{item.comments_count} Bình luận</Text>
               </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={loading ? <ActivityIndicator size="large" color="#B71C1C" style={{marginTop: 40}} /> : <Text style={styles.emptyText}>Chưa có bài viết.</Text>}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      {/* Modal Create Post */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBackDrop}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Tạo Bài Viết Mới</Text>
                    
                    <Text style={styles.label}>Đăng tới:</Text>
                    <View style={{height: 90, marginBottom: 15}}>
                      <TextInput 
                        style={styles.dropdownSearch} 
                        placeholder="🔍 Tìm nhóm..." 
                        value={groupSearch}
                        onChangeText={setGroupSearch}
                      />
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop: 5}}>
                        <TouchableOpacity 
                          style={[styles.groupSelect, selectedPostGroup === null && styles.groupSelectActive]} 
                          onPress={() => setSelectedPostGroup(null)}
                        >
                          <Text style={{color: selectedPostGroup === null ? '#FFF' : '#666', fontSize: 12}}>Bảng tin chung</Text>
                        </TouchableOpacity>
                        {groups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase())).map(g => (
                          <TouchableOpacity 
                            key={g.id} 
                            style={[styles.groupSelect, selectedPostGroup === g.id && styles.groupSelectActive]} 
                            onPress={() => setSelectedPostGroup(g.id)}
                          >
                            <Text style={{color: selectedPostGroup === g.id ? '#FFF' : '#666', fontSize: 12}}>{g.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

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
                      <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#B71C1C'}]} onPress={handleCreatePost} disabled={creating}>
                          {creating ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.btnText}>Đăng Bài</Text>}
                      </TouchableOpacity>
                    </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
       </Modal>

       {/* Comment Modal */}
       <Modal visible={commentModalVisible} animationType="fade" transparent={true}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.commentModalBackDrop}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.commentModalContent}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentTitle}>Bình luận</Text>
                      <TouchableOpacity onPress={() => setCommentModalVisible(false)}><Text style={{color:'#666', fontWeight:'bold'}}>Đóng</Text></TouchableOpacity>
                    </View>
                    <FlatList 
                      data={comments} keyExtractor={(c)=>c.id.toString()} style={{maxHeight: 250}}
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
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
       </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#FFF', elevation: 2 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#B71C1C' },
  addBtn: { backgroundColor: '#B71C1C', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  filterContainer: { backgroundColor: '#FFF', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  filterItem: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 10, borderWidth: 1, borderColor: '#DDD' },
  filterItemActive: { backgroundColor: '#B71C1C', borderColor: '#B71C1C' },
  filterText: { fontSize: 13, color: '#666', fontWeight: '500' },
  filterTextActive: { color: '#FFF' },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginHorizontal: 16, marginTop: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  posterName: { fontWeight: 'bold', color: '#333' },
  posterEmail: { fontSize: 11, color: '#999' },
  groupBadge: { 
    backgroundColor: '#E8F5E9', 
    color: '#2E7D32', 
    fontSize: 10, 
    fontWeight: 'bold',
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 12, 
    alignSelf: 'flex-start',
    borderWidth: 0.5,
    borderColor: '#C8E6C9'
  },
  content: { fontSize: 14, color: '#444', marginBottom: 10 },
  mediaContainer: { marginBottom: 10, borderRadius: 6, overflow: 'hidden' },
  postImage: { width: '100%', height: 200 },
  fileAttachment: { flexDirection: 'row', padding: 10, backgroundColor: '#F0F7FF', borderRadius: 6, alignItems: 'center' },
  fileIcon: { fontSize: 20, marginRight: 8 },
  fileName: { flex: 1, fontSize: 12, fontWeight: 'bold' },
  cardFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10 },
  footerAction: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  footerText: { fontSize: 13, color: '#666', marginLeft: 5 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },
  modalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '90%', padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#B71C1C', textAlign: 'center', marginBottom: 15 },
  label: { fontSize: 12, color: '#666', marginBottom: 8 },
  groupSelect: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: '#F5F5F5', marginRight: 8, height: 30, justifyContent: 'center', borderWidth: 1, borderColor: '#EEE' },
  groupSelectActive: { backgroundColor: '#B71C1C', borderColor: '#B71C1C' },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, height: 80, padding: 10, textAlignVertical: 'top', marginBottom: 15 },
  pickFileBtn: { borderStyle: 'dashed', borderWidth: 1, borderColor: '#B71C1C', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 15 },
  pickFileText: { color: '#B71C1C', fontSize: 13, fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  commentModalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  commentModalContent: { backgroundColor: '#FFF', width: '90%', borderRadius: 12, padding: 15 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  commentTitle: { fontWeight: 'bold', color: '#B71C1C' },
  commentItem: { backgroundColor: '#F8F9FA', padding: 8, borderRadius: 6, marginBottom: 8 },
  commentUser: { fontWeight: 'bold', fontSize: 12 },
  commentText: { fontSize: 13, color: '#444' },
  commentInputRow: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  commentInput: { flex: 1, backgroundColor: '#F0F2F5', borderRadius: 20, paddingHorizontal: 12, height: 36 },
  sendCommentBtn: { backgroundColor: '#B71C1C', paddingHorizontal: 15, height: 36, borderRadius: 18, justifyContent: 'center', marginLeft: 8 },
  dropdownSearch: { backgroundColor: '#F9F9F9', borderRadius: 8, borderWidth: 1, borderColor: '#EEE', paddingHorizontal: 10, paddingVertical: 6, marginBottom: 5, fontSize: 13 }
});

