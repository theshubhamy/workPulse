import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { logout } from '../firebase';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to WorkPulse</Text>
      <Text>Your attendance and tasks will show here.</Text>
      <View style={styles.spacer} />
      <Button title="Logout" onPress={logout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  spacer: {
    height: 20,
  }
});

export default HomeScreen;
