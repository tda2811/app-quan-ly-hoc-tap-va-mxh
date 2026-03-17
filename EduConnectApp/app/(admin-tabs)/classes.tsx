import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../src/services/authService';

export default function AdminClassesScreen() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/classes`);
      if (res.data && res.data.success) {
        setClasses(res.data.data);
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể kết nối Backend để lấy danh sách Lớp.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.cardName}>{item.name}</Text>
      <Text style={styles.cardSub}>Khóa học (Cohort): <Text style={{fontWeight: 'bold'}}>{item.cohort}</Text></Text>
      <Text style={styles.cardSub}>Major ID: {item.major_id || 'Chưa gán'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Danh Sách Lớp Học</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#D32F2F" />
      ) : (
        <FlatList
          data={classes}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888' }}>Chưa có lớp nào</Text>}
        />
      )}
      <TouchableOpacity style={styles.fab}>
         <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', padding: 16, backgroundColor: '#FEF1F1', color: '#B71C1C' },
  card: {
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  cardName: { fontSize: 17, fontWeight: 'bold', color: '#D32F2F' },
  cardSub: { fontSize: 14, color: '#555', marginTop: 4 },
  fab: {
    position: 'absolute', right: 20, bottom: 20,
    backgroundColor: '#D32F2F', paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 24, elevation: 3, shadowOpacity: 0.2
  },
  fabText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' }
});
