import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, ScrollView } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../src/services/authService';
import { Stack, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../src/context/AuthContext';

interface Document {
  id: number;
  title: string;
  file_type?: string;
  subject_name: string;
  uploader_email?: string;
}

export default function AdminDocumentsScreen() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Upload States
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [pickedFile, setPickedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/subjects`);
      if (res.data.success) setSubjects(res.data.data);
    } catch (err) {
      console.error('Lỗi tải môn học:', err);
    }
  };

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

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
         setPickedFile(result.assets[0]);
      }
    } catch (err) {
      console.error('Lỗi chọn file:', err);
    }
  };

  const handleUpload = async () => {
    if (!title.trim() || !selectedSubjectId || !pickedFile) {
        Alert.alert('Thông báo', 'Vui lòng nhập tiêu đề, chọn môn học và chọn file.');
        return;
    }

    try {
        setUploading(true);
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('subject_id', selectedSubjectId.toString());
        formData.append('uploader_id', user.id.toString());
        
        formData.append('file', {
            uri: pickedFile.uri,
            name: pickedFile.name,
            type: pickedFile.mimeType || 'application/octet-stream',
        } as any);

        const res = await axios.post(`${API_URL}/admin/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.data.success) {
            Alert.alert('Thành công', 'Tải tài liệu lên thành công.');
            setTitle('');
            setSelectedSubjectId(null);
            setPickedFile(null);
            setUploadModalVisible(false);
            fetchDocuments();
        }
    } catch (error) {
         Alert.alert('Lỗi', 'Không thể tải tài liệu lên.');
    } finally {
         setUploading(false);
    }
  };

  const handleDelete = (id: number) => {
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

  const renderItem = ({ item }: { item: Document }) => (
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

      {/* FAB: Upload Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setUploadModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Upload Modal */}
      <Modal visible={uploadModalVisible} animationType="slide" transparent={true}>
         <View style={styles.modalBackDrop}>
            <View style={styles.modalContent}>
               <Text style={styles.modalTitle}>Tải Tài Liệu Lên</Text>
               <ScrollView style={{width: '100%'}}>
                  <Text style={styles.label}>Tiêu Đề:</Text>
                  <TextInput style={styles.input} placeholder="Vd: Slide chương 1 - Hệ điều hành" value={title} onChangeText={setTitle} />
                  
                  <Text style={styles.label}>Môn Học:</Text>
                  <View style={{maxHeight: 150, borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 8, marginBottom: 15}}>
                     <ScrollView nestedScrollEnabled={true}>
                        {subjects.map((sub) => (
                           <TouchableOpacity key={sub.id} style={[styles.subItem, selectedSubjectId === sub.id && styles.subItemActive]} onPress={() => setSelectedSubjectId(sub.id)}>
                              <Text style={{color: selectedSubjectId === sub.id ? '#FFF' : '#333'}}>{sub.name}</Text>
                           </TouchableOpacity>
                        ))}
                     </ScrollView>
                  </View>

                  <Text style={styles.label}>File:</Text>
                  <TouchableOpacity style={styles.pickBtn} onPress={pickDocument}>
                     <Text style={{color: '#1976D2', fontWeight: 'bold'}}>{pickedFile ? `📄 ${pickedFile.name}` : '➕ Chọn file từ máy...'}</Text>
                  </TouchableOpacity>

                  <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, width: '100%'}}>
                     <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#CCC'}]} onPress={() => setUploadModalVisible(false)} disabled={uploading}>
                        <Text style={styles.btnText}>Hủy</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#D32F2F'}]} onPress={handleUpload} disabled={uploading}>
                        {uploading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.btnText}>Tải Lên</Text>}
                     </TouchableOpacity>
                  </View>
               </ScrollView>
            </View>
         </View>
      </Modal>
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

  // styles cho Upload
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#D32F2F', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  label: { fontSize: 13, color: '#555', marginBottom: 4, fontWeight: 'bold' },
  input: { width: '100%', height: 44, borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, marginBottom: 12 },
  modalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#D32F2F', textAlign: 'center' },
  subItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  subItemActive: { backgroundColor: '#D32F2F' },
  pickBtn: { borderWidth: 1, borderColor: '#1976D2', borderStyle: 'dashed', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 8 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
});
