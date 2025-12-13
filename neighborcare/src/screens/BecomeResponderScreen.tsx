import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const BecomeResponderScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Become a Hero</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <Ionicons name="shield-checkmark" size={80} color="#DC2626" />
          <Text style={styles.title}>Join the Responder Network</Text>
          <Text style={styles.subtitle}>
            Help save lives in your community by becoming a verified First Responder.
          </Text>
        </View>

        <View style={styles.steps}>
          <Step num="1" title="Take the Quiz" desc="Complete a basic first aid knowledge test." />
          <Step num="2" title="Get Verified" desc="Your status will be updated instantly upon passing." />
          <Step num="3" title="Save Lives" desc="Receive alerts when neighbors need help nearby." />
        </View>

        <TouchableOpacity 
          style={styles.startBtn} 
          onPress={() => navigation.navigate('ResponderExam')}
        >
          <Text style={styles.btnText}>Start Certification Exam</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const Step = ({ num, title, desc }: any) => (
  <View style={styles.stepRow}>
    <View style={styles.circle}><Text style={styles.num}>{num}</Text></View>
    <View style={{ flex: 1 }}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDesc}>{desc}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#DC2626', padding: 20, paddingTop: 50, flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 15 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20, alignItems: 'center' },
  heroSection: { alignItems: 'center', marginVertical: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginTop: 15, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  steps: { width: '100%', marginVertical: 20 },
  stepRow: { flexDirection: 'row', marginBottom: 20 },
  circle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  num: { color: '#DC2626', fontWeight: 'bold', fontSize: 16 },
  stepTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  stepDesc: { fontSize: 13, color: '#666', marginTop: 2 },
  startBtn: { backgroundColor: '#DC2626', width: '100%', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});