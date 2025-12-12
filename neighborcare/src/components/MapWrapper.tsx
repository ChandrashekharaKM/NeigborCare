import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const Marker = (props: any) => null;
export const Polyline = (props: any) => null;
export const PROVIDER_DEFAULT = null;

const MapView = (props: any) => {
  return (
    <View style={[styles.container, props.style]}>
      <Text style={styles.text}>Map not supported on Web</Text>
      <Text style={styles.subtext}>Please use an Android/iOS Simulator</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  subtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  }
});

export default MapView;