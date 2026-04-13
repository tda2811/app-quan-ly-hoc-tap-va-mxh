import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, 
  ActivityIndicator, Modal, Image, ScrollView, Platform, TextInput,
  Keyboard, TouchableWithoutFeedback
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import { API_URL } from '../../src/services/authService';
import { useAuth } from '../../src/context/AuthContext';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface Schedule {
  id: number;
  subject_id: number;
  subject_name: string;
  room_name: string;
  schedule_type: 'theory' | 'practice' | 'exam';
  schedule_date: string;
  start_time: string;
  end_time: string;
  teacher_email?: string;
}

interface GradeItem {
  id: number;
  subject_name: string;
  attendance_score: number | null;
  midterm_score: number | null;
  final_score: number | null;
  overall_score: number | null;
}

interface DocumentItem {
  id: number;
  title: string;
  subject_name: string;
  file_url: string;
  file_type: string;
  uploader_email?: string;
}

export default function LMSScreen() {
  const { user } = useAuth();
  if (!user) return null;

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'study' | 'exam' | 'grades' | 'documents' | 'attendance'>('study');
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loadingAttendances, setLoadingAttendances] = useState(false);

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [pickedFile, setPickedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [showScanner, setShowScanner] = useState(false);
  const [scanned, setScanned] = useState(false);
  const isScanningRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [subFilter, setSubFilter] = useState('');

  // Teacher Create Schedule states
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [schDate, setSchDate] = useState(new Date());
  const [sTime, setSTime] = useState(new Date());
  const [eTime, setETime] = useState(new Date());
  const [schType, setSchType] = useState<'theory' | 'practice'>('theory');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEditId, setSelectedEditId] = useState<number | null>(null);
  const [subjectDropdownVisible, setSubjectDropdownVisible] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSTimePicker, setShowSTimePicker] = useState(false);
  const [showETimePicker, setShowETimePicker] = useState(false);

  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  useEffect(() => {
    fetchSchedules();
    if (user.role === 'teacher') fetchSubjects();
  }, [user]);

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/subjects`);
      if (res.data.success) setSubjectsList(res.data.data);
    } catch (e) { console.log(e); }
  };

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const url = user.role === 'teacher' 
        ? `${API_URL}/attendance/schedules?teacher_id=${user.id}`
        : `${API_URL}/student/schedules?student_id=${user.id}`;
      const res = await axios.get(url);
      if (res.data.success) setSchedules(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      setLoadingGrades(true);
      const res = await axios.get(`${API_URL}/student/grades?student_id=${user.id}`);
      if (res.data.success) setGrades(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGrades(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true);
      const url = user.role === 'teacher' 
        ? `${API_URL}/admin/documents` 
        : `${API_URL}/student/documents?student_id=${user.id}`;
      const res = await axios.get(url);
      if (res.data.success) {
        if (user.role === 'teacher') {
          setDocuments(res.data.data.filter((d: any) => d.uploader_id === user.id));
        } else {
          setDocuments(res.data.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const fetchAttendances = async () => {
    try {
      setLoadingAttendances(true);
      const res = await axios.get(`${API_URL}/student/attendances?student_id=${user.id}`);
      if (res.data.success) setAttendances(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAttendances(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPickedFile(result.assets[0]);
      }
    } catch (err) { console.error(err); }
  };

  const handleUpload = async () => {
    Keyboard.dismiss();
    if (!docTitle.trim() || !selectedSubId || !pickedFile) {
        Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề, chọn môn học và chọn file.');
        return;
    }
    try {
        setUploading(true);
        const formData = new FormData();
        formData.append('title', docTitle.trim());
        formData.append('subject_id', selectedSubId.toString());
        formData.append('uploader_id', user.id);
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
            setDocTitle(''); setPickedFile(null); setSelectedSubId(null);
            setUploadModalVisible(false);
            fetchDocuments();
        }
    } catch (error) {
         Alert.alert('Lỗi', 'Không thể tải tài liệu lên.');
     } finally {
          setUploading(false);
     }
  };

  const handleAddSchedule = async () => {
    Keyboard.dismiss();
    if (!selectedSubId || !roomName || !schDate) {
      Alert.alert('Lỗi', 'Vui lòng điền đủ thông tin (Môn học, Phòng, Ngày).');
      return;
    }
    try {
      const payload = {
        teacher_id: user.id,
        subject_id: selectedSubId,
        room_name: roomName,
        schedule_date: schDate.toISOString().split('T')[0],
        start_time: sTime.toTimeString().split(' ')[0].substring(0, 5),
        end_time: eTime.toTimeString().split(' ')[0].substring(0, 5),
        schedule_type: schType
      };

      if (isEditing && selectedEditId) {
        await axios.put(`${API_URL}/attendance/schedules/${selectedEditId}`, payload);
        Alert.alert('Thành công', 'Đã cập nhật lịch dạy.');
      } else {
        await axios.post(`${API_URL}/attendance/schedules`, payload);
        Alert.alert('Thành công', 'Đã thêm lịch dạy mới.');
      }
      setAddModalVisible(false);
      resetAddModal();
      fetchSchedules();
    } catch (e) { Alert.alert('Lỗi', 'Không thể lưu lịch dạy.'); }
  };

  const handleDeleteSchedule = (id: number) => {
    Alert.alert('Xác Nhận', 'Bạn có muốn xóa lịch dạy này?', [
      { text: 'Hủy' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
          try {
            await axios.delete(`${API_URL}/attendance/schedules/${id}?teacher_id=${user.id}`);
            fetchSchedules();
          } catch (e) { Alert.alert('Lỗi', 'Xóa thất bại.'); }
      }}
    ]);
  };

  const openEditModal = (item: Schedule) => {
    setIsEditing(true);
    setSelectedEditId(item.id);
    setSelectedSubId(item.subject_id);
    setRoomName(item.room_name);
    setSchDate(new Date(item.schedule_date));
    
    const [stH, stM] = item.start_time.split(':');
    const startD = new Date(); startD.setHours(parseInt(stH), parseInt(stM));
    setSTime(startD);

    const [etH, etM] = item.end_time.split(':');
    const endD = new Date(); endD.setHours(parseInt(etH), parseInt(etM));
    setETime(endD);

    setSchType(item.schedule_type as any);
    setAddModalVisible(true);
  };

  const resetAddModal = () => {
    setIsEditing(false);
    setSelectedEditId(null);
    setSelectedSubId(null);
    setRoomName('');
    setSchDate(new Date());
    setSTime(new Date());
    setETime(new Date());
    setSchType('theory');
    setSubFilter('');
    setSubjectDropdownVisible(false);
  };

  const handleViewFile = async (fileUrl: string) => {
    try {
      if (!fileUrl) {
          Alert.alert('Lỗi', 'Đường dẫn file không tồn tại.');
          return;
      }
      const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${API_URL.replace('/api', '')}${fileUrl}`;
      await WebBrowser.openBrowserAsync(fullUrl);
    } catch (error) {
       Alert.alert('Lỗi', 'Không thể mở file.');
    }
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;
    setScanned(true);
    setShowScanner(false);
    try {
      const scheduleId = parseInt(data);
      const res = await axios.post(`${API_URL}/attendance/check-in`, {
        schedule_id: scheduleId,
        student_id: user.id
      });
      if (res.data.success) {
        Alert.alert('Thành công', 'Điểm danh thành công!');
      }
    } catch (error: any) {
        Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra.');
    }
  };

  const renderItem = ({ item }: { item: Schedule }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => user.role === 'teacher' && setSelectedSchedule(item)}
      onLongPress={() => user.role === 'teacher' && openEditModal(item)}
    >
      <View style={styles.cardHeader}>
         <Text style={styles.subjName}>{item.subject_name}</Text>
         <TouchableOpacity 
           onPress={() => user.role === 'teacher' && handleDeleteSchedule(item.id)}
           style={{padding: 4}}
         >
           {user.role === 'teacher' && <Text style={{color: '#999', fontSize: 10}}>Xóa</Text>}
         </TouchableOpacity>
         <Text style={[styles.roomBadge, item.schedule_type === 'exam' && { backgroundColor: '#FFEBEE', color: '#D32F2F' }]}>
            {item.schedule_type === 'exam' ? 'P. THI ' : 'P. HỌC '} {item.room_name}
         </Text>
      </View>
      <Text style={styles.cardText}>📅 Ngày: {new Date(item.schedule_date).toLocaleDateString('vi-VN')}</Text>
      <Text style={styles.cardText}>⏰ Giờ: {item.start_time} - {item.end_time}</Text>
      {item.teacher_email && <Text style={styles.cardText}>👨‍🏫 {item.teacher_email}</Text>}
      {user.role === 'teacher' && <Text style={{fontSize: 10, color: '#1B5E20', marginTop: 4, fontStyle: 'italic'}}>Nhấn giữ để sửa</Text>}
    </TouchableOpacity>
  );

  const renderDocItem = ({ item }: { item: DocumentItem }) => (
    <View style={styles.docCard}>
       <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <Text style={styles.docTitle}>📄 {item.title}</Text>
          <Text style={styles.docTypeBadge}>{item.file_type.toUpperCase()}</Text>
       </View>
       <Text style={styles.docDesc}>Môn: {item.subject_name}</Text>
       <TouchableOpacity style={styles.viewDocBtn} onPress={() => handleViewFile(item.file_url)}>
          <Text style={styles.viewDocText}>📄 Xem / Tải Xuống Tài Liệu</Text>
       </TouchableOpacity>
    </View>
  );

  const filteredSchedules = schedules.filter(s => 
    s.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.schedule_date.includes(searchQuery)
  );
  const studySchedules = filteredSchedules.filter(s => s.schedule_type !== 'exam');
  const examSchedules = filteredSchedules.filter(s => s.schedule_type === 'exam');

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>{user.role === 'teacher' ? '📜 Quản Lý Giảng Dạy' : '📅 Quản Lý Học Tập'}</Text>
        
        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tabItem, viewMode === 'study' && styles.tabItemActive]} onPress={() => setViewMode('study')}>
              <Text style={[styles.tabText, viewMode === 'study' && styles.tabTextActive]}>Lịch Học</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabItem, viewMode === 'exam' && styles.tabItemActive]} onPress={() => setViewMode('exam')}>
              <Text style={[styles.tabText, viewMode === 'exam' && styles.tabTextActive]}>Lịch Thi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabItem, viewMode === 'documents' && styles.tabItemActive]} onPress={() => { setViewMode('documents'); fetchDocuments(); }}>
              <Text style={[styles.tabText, viewMode === 'documents' && styles.tabTextActive]}>Tài Liệu</Text>
          </TouchableOpacity>
          {user.role === 'student' && (
              <>
                <TouchableOpacity style={[styles.tabItem, viewMode === 'attendance' && styles.tabItemActive]} onPress={() => { setViewMode('attendance'); fetchAttendances(); }}>
                  <Text style={[styles.tabText, viewMode === 'attendance' && styles.tabTextActive]}>Lịch Sử</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabItem, viewMode === 'grades' && styles.tabItemActive]} onPress={() => { setViewMode('grades'); fetchGrades(); }}>
                  <Text style={[styles.tabText, viewMode === 'grades' && styles.tabTextActive]}>Bảng Điểm</Text>
                </TouchableOpacity>
              </>
          )}
        </View>

        {user.role === 'student' && viewMode === 'study' && (
          <TouchableOpacity 
            style={styles.scanBtn} 
            onPress={() => {
              setScanned(false);
              isScanningRef.current = false;
              setShowScanner(true);
            }}
          >
              <Text style={styles.scanBtnText}>📷 QUÉT QR ĐIỂM DANH</Text>
          </TouchableOpacity>
        )}

        {(viewMode === 'study' || viewMode === 'exam') && (
          <View style={styles.searchContainer}>
            <TextInput 
              style={styles.searchInput} 
              placeholder="🔍 Tìm theo môn hoặc ngày (YYYY-MM-DD)..." 
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}

        {viewMode === 'study' ? (
          <FlatList data={studySchedules} keyExtractor={s => s.id.toString()} renderItem={renderItem} contentContainerStyle={{padding: 16}} />
        ) : viewMode === 'exam' ? (
          <FlatList data={examSchedules} keyExtractor={s => s.id.toString()} renderItem={renderItem} contentContainerStyle={{padding: 16}} />
        ) : viewMode === 'documents' ? (
          <FlatList data={documents} keyExtractor={d => d.id.toString()} renderItem={renderDocItem} contentContainerStyle={{padding: 16}} />
        ) : viewMode === 'attendance' ? (
          <FlatList data={attendances} keyExtractor={a => a.id.toString()} renderItem={({item}) => (
            <View style={styles.attendanceCard}>
               <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                  <Text style={styles.subjName}>{item.subject_name}</Text>
                  <Text style={[styles.statusBadge, {color: item.status === 'present' ? '#2E7D32' : '#D32F2F'}]}>
                    {item.status === 'present' ? '✓ CÓ MẶT' : '✕ VẮNG'}
                  </Text>
               </View>
               <Text style={styles.cardText}>📅 Ngày: {new Date(item.schedule_date).toLocaleDateString('vi-VN')}</Text>
               <Text style={styles.cardText}>⏰ Thời gian: {new Date(item.scanned_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}</Text>
               <Text style={styles.cardText}>📍 IP: {item.network_ip || 'N/A'}</Text>
            </View>
          )} contentContainerStyle={{padding: 16}} />
        ) : (
          <FlatList data={grades} keyExtractor={g => g.id.toString()} renderItem={({item}) => (
            <View style={styles.gradeCard}>
              <Text style={styles.gradeSubject}>{item.subject_name}</Text>
              <View style={styles.gradeGrid}>
                <View style={styles.gradeCol}><Text style={styles.gradeLabel}>Điểm danh</Text><Text style={styles.gradeValue}>{item.attendance_score || '-'}</Text></View>
                <View style={styles.gradeCol}><Text style={styles.gradeLabel}>Giữa kỳ</Text><Text style={styles.gradeValue}>{item.midterm_score || '-'}</Text></View>
                <View style={styles.gradeCol}><Text style={styles.gradeLabel}>Cuối kỳ</Text><Text style={styles.gradeValue}>{item.final_score || '-'}</Text></View>
                <View style={styles.gradeCol}><Text style={styles.gradeLabel}>Tổng kết</Text><Text style={[styles.gradeValue, {color: '#B71C1C'}]}>{item.overall_score || '-'}</Text></View>
              </View>
            </View>
          )} contentContainerStyle={{padding: 16}} />
        )}

        <Modal visible={showScanner} animationType="slide">
          <View style={styles.cameraBackdrop}>
              <CameraView style={styles.cameraView} onBarcodeScanned={scanned ? undefined : handleBarcodeScanned} />
              <TouchableOpacity style={styles.closeCamBtn} onPress={() => setShowScanner(false)}><Text style={{color: '#FFF'}}>Đóng</Text></TouchableOpacity>
          </View>
        </Modal>

        {/* QR Code Modal for Teacher */}
        <Modal visible={!!selectedSchedule} animationType="fade" transparent={true}>
           <View style={styles.modalBackDrop}>
              <View style={[styles.modalContent, {alignItems: 'center'}]}>
                  <Text style={{fontWeight: 'bold', fontSize: 16, marginBottom: 10}}>{selectedSchedule?.subject_name}</Text>
                  <Text style={{fontSize: 12, color: '#666', marginBottom: 20}}>Sinh viên quét mã bên dưới để điểm danh</Text>
                  
                  {selectedSchedule && (
                    <Image 
                      source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${selectedSchedule.id}` }} 
                      style={{ width: 220, height: 220 }}
                    />
                  )}

                  <TouchableOpacity 
                    style={[styles.scanBtn, {backgroundColor: '#B71C1C', marginTop: 30, width: '100%'}]} 
                    onPress={() => setSelectedSchedule(null)}
                  >
                    <Text style={{color: '#FFF', fontWeight: 'bold'}}>ĐÓNG</Text>
                  </TouchableOpacity>
              </View>
           </View>
        </Modal>

        {/* Add Schedule Modal for Teacher */}
        <Modal visible={addModalVisible} animationType="slide" transparent={true}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBackDrop}>
              <View style={styles.modalContent}>
                <Text style={styles.label}>Môn Học (*):</Text>
                <TouchableOpacity style={styles.inputPicker} onPress={() => setSubjectDropdownVisible(!subjectDropdownVisible)}>
                  <Text style={{color: selectedSubId ? '#000' : '#888'}}>
                    {selectedSubId ? subjectsList.find(s => s.id === selectedSubId)?.name || 'Môn học' : 'Chọn Môn học'}
                  </Text>
                </TouchableOpacity>

                {subjectDropdownVisible && (
                  <View style={styles.dropdownOverlay}>
                    <TextInput 
                      style={styles.dropdownSearchInside} 
                      placeholder="Tìm môn học..." 
                      value={subFilter}
                      onChangeText={setSubFilter}
                    />
                    <ScrollView 
                      nestedScrollEnabled 
                      style={{maxHeight: 120}}
                    >
                      {subjectsList.filter((s: any) => s.name.toLowerCase().includes(subFilter.toLowerCase())).map((item: any) => (
                        <TouchableOpacity key={item.id} style={styles.dropdownItem} onPress={() => { setSelectedSubId(item.id); setSubjectDropdownVisible(false); }}>
                          <Text style={{fontSize: 14}}>{item.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <TextInput style={styles.inputNarrow} placeholder="Phòng học (VD: A1.101)" value={roomName} onChangeText={setRoomName} />
                
                {/* Date Selection */}
                <Text style={styles.label}>Ngày giảng dạy:</Text>
                {Platform.OS === 'web' ? (
                  <TextInput 
                    style={styles.inputNarrow} 
                    {...({ type: 'date' } as any)}
                    value={schDate.toISOString().split('T')[0]} 
                    onChangeText={(v: any) => setSchDate(new Date(v))} 
                  />
                ) : (
                  <TouchableOpacity style={styles.inputNarrow} onPress={() => setShowDatePicker(true)}>
                    <Text>📅 {schDate.toLocaleDateString('vi-VN')}</Text>
                  </TouchableOpacity>
                )}

                {showDatePicker && Platform.OS !== 'web' && (
                  <DateTimePicker 
                    value={schDate} mode="date" display="default" 
                    onChange={(e, d) => { setShowDatePicker(false); if (d) setSchDate(d); }} 
                  />
                )}

                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                   <View style={{flex: 0.48}}>
                      <Text style={styles.label}>Bắt đầu:</Text>
                      {Platform.OS === 'web' ? (
                        <TextInput style={styles.inputNarrow} {...({ type: 'time' } as any)} value={sTime.toTimeString().substring(0, 5)} onChangeText={(v: any) => { const nd = new Date(); const [h,m] = v.split(':'); nd.setHours(parseInt(h),parseInt(m)); setSTime(nd); }} />
                      ) : (
                        <TouchableOpacity style={styles.inputNarrow} onPress={() => setShowSTimePicker(true)}>
                          <Text>⏰ {sTime.toTimeString().substring(0, 5)}</Text>
                        </TouchableOpacity>
                      )}
                      {showSTimePicker && Platform.OS !== 'web' && (
                        <DateTimePicker value={sTime} mode="time" display="default" onChange={(e, d) => { setShowSTimePicker(false); if (d) setSTime(d); }} />
                      )}
                   </View>
                   <View style={{flex: 0.48}}>
                      <Text style={styles.label}>Kết thúc:</Text>
                      {Platform.OS === 'web' ? (
                        <TextInput style={styles.inputNarrow} {...({ type: 'time' } as any)} value={eTime.toTimeString().substring(0, 5)} onChangeText={(v: any) => { const nd = new Date(); const [h,m] = v.split(':'); nd.setHours(parseInt(h),parseInt(m)); setETime(nd); }} />
                      ) : (
                        <TouchableOpacity style={styles.inputNarrow} onPress={() => setShowETimePicker(true)}>
                          <Text>⏰ {eTime.toTimeString().substring(0, 5)}</Text>
                        </TouchableOpacity>
                      )}
                      {showETimePicker && Platform.OS !== 'web' && (
                        <DateTimePicker value={eTime} mode="time" display="default" onChange={(e, d) => { setShowETimePicker(false); if (d) setETime(d); }} />
                      )}
                   </View>
                </View>

                <View style={{flexDirection: 'row', marginBottom: 20}}>
                   <TouchableOpacity style={[styles.miniBtn, schType === 'theory' && styles.miniBtnActive]} onPress={() => setSchType('theory')}>
                      <Text style={[styles.miniBtnText, schType === 'theory' && {color:'#FFF'}]}>Lý Thuyết</Text>
                   </TouchableOpacity>
                   <TouchableOpacity style={[styles.miniBtn, schType === 'practice' && styles.miniBtnActive]} onPress={() => setSchType('practice')}>
                      <Text style={[styles.miniBtnText, schType === 'practice' && {color:'#FFF'}]}>Thực Hành</Text>
                   </TouchableOpacity>
                </View>

                 <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                    <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#CCC'}]} onPress={() => { setAddModalVisible(false); resetAddModal(); }}><Text style={{color:'#333'}}>Hủy</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#1B5E20'}]} onPress={handleAddSchedule}><Text style={{color:'#FFF', fontWeight:'bold'}}>{isEditing ? 'Cập Nhật' : 'Lưu Lịch'}</Text></TouchableOpacity>
                 </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {user.role === 'teacher' && (viewMode === 'study' || viewMode === 'exam') && (
          <TouchableOpacity 
            style={styles.fab} 
            onPress={() => {
              resetAddModal();
              if (viewMode === 'exam') setSchType('exam' as any);
              setAddModalVisible(true);
            }}
          >
             <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#B71C1C', textAlign: 'center', marginVertical: 10 },
  tabBar: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#DDD' },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabItemActive: { backgroundColor: '#B71C1C' },
  tabText: { fontWeight: 'bold', color: '#666' },
  tabTextActive: { color: '#FFF' },
  scanBtn: { backgroundColor: '#1B5E20', margin: 16, padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 5 },
  scanBtnText: { color: '#FFF', fontWeight: 'bold' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  searchInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 8, fontSize: 13 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 10, marginHorizontal: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  subjName: { fontWeight: 'bold', flex: 1 },
  roomBadge: { fontSize: 10, fontWeight: 'bold', padding: 4, borderRadius: 4 },
  cardText: { fontSize: 12, color: '#666', marginTop: 2 },
  docCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#1976D2' },
  docTitle: { fontWeight: 'bold', color: '#1B5E20' },
  docTypeBadge: { fontSize: 10, backgroundColor: '#E3F2FD', padding: 2 },
  docDesc: { fontSize: 11, color: '#888' },
  viewDocBtn: { backgroundColor: '#F0F7FF', padding: 8, borderRadius: 4, marginTop: 10, alignItems: 'center' },
  viewDocText: { color: '#1976D2', fontWeight: 'bold' },
  gradeCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1 },
  gradeSubject: { fontWeight: 'bold', marginBottom: 10 },
  gradeGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  gradeCol: { alignItems: 'center' },
  gradeLabel: { fontSize: 10, color: '#999' },
  gradeValue: { fontWeight: 'bold' },
  cameraBackdrop: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  cameraView: { width: '80%', aspectRatio: 1 },
  closeCamBtn: { backgroundColor: '#D32F2F', padding: 10, marginTop: 20 },
  modalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', padding: 20, borderRadius: 10 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#444', marginBottom: 5 },
  inputNarrow: { borderWidth: 1, borderColor: '#DDD', padding: 8, borderRadius: 6, marginBottom: 12, fontSize: 13 },
  miniBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, backgroundColor: '#F0F0F0', marginRight: 8, height: 32, justifyContent: 'center' },
  miniBtnActive: { backgroundColor: '#B71C1C' },
  miniBtnText: { fontSize: 11, color: '#666' },
  modalBtn: { padding: 12, borderRadius: 6, flex: 0.48, alignItems: 'center' },
  fab: { position: 'absolute', bottom: 90, right: 20, backgroundColor: '#B71C1C', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  attendanceCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#2E7D32', elevation: 1 },
  statusBadge: { fontSize: 11, fontWeight: 'bold' },
  dropdownSearch: { backgroundColor: '#F9F9F9', borderRadius: 8, borderWidth: 1, borderColor: '#EEE', paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10, fontSize: 13 },
  inputPicker: { borderWidth: 1, borderColor: '#DDD', padding: 12, borderRadius: 8, marginBottom: 12, backgroundColor: '#F9F9F9', justifyContent: 'center' },
  dropdownOverlay: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, backgroundColor: '#FFF', marginBottom: 12, overflow: 'hidden' },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  dropdownSearchInside: { backgroundColor: '#F9F9F9', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 }
});
