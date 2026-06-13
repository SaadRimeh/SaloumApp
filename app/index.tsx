import React from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/barbershop_bg.jpg')}
        style={StyleSheet.absoluteFillObject}
        blurRadius={5}
      />
      <View style={styles.overlay} />
      <ActivityIndicator size="large" color="#C5A880" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
});
