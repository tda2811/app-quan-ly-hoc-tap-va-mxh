import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function EntryScreen() {
  return (
    <View style={styles.container}>
       <ActivityIndicator size="large" color="#B71C1C" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }
});
