import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const KeeperStorageList: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Keeper Storage List</Text>
      <Text style={styles.subtitle}>Storage management coming soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

export default KeeperStorageList;