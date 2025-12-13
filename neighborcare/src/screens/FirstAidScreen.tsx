import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const GUIDES = [
  {
    id: 1,
    title: 'CPR (Cardiopulmonary Resuscitation)',
    icon: 'heartbeat',
    color: '#EF4444',
    steps: [
      '1. Call 108 immediately.',
      '2. Place hands on center of chest.',
      '3. Push hard and fast (100-120 bpm).',
      '4. Allow chest to recoil completely.',
      '5. Continue until help arrives.'
    ]
  },
  {
    id: 2,
    title: 'Severe Bleeding',
    icon: 'tint',
    color: '#DC2626',
    steps: [
      '1. Apply direct pressure to the wound.',
      '2. Use a clean cloth or gauze.',
      '3. Keep pressure applied until bleeding stops.',
      '4. Do not remove the cloth if soaked; add more.',
      '5. Elevate the injury if possible.'
    ]
  },
  {
    id: 3,
    title: 'Choking',
    icon: 'hand-holding-medical',
    color: '#F59E0B',
    steps: [
      '1. Stand behind the person.',
      '2. Wrap arms around their waist.',
      '3. Make a fist above the navel.',
      '4. Thrust inward and upward.',
      '5. Repeat until object is dislodged.'
    ]
  },
  {
    id: 4,
    title: 'Burns',
    icon: 'fire',
    color: '#EA580C',
    steps: [
      '1. Cool the burn under cool running water for 10-20 mins.',
      '2. Do NOT use ice or butter.',
      '3. Cover loosely with sterile dressing.',
      '4. Take pain reliever if necessary.'
    ]
  }
];

export const FirstAidScreen = ({ navigation }: any) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#DC2626" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>First Aid Guides</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {GUIDES.map((guide) => (
          <TouchableOpacity 
            key={guide.id} 
            style={styles.card} 
            onPress={() => toggleExpand(guide.id)}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: `${guide.color}20` }]}>
                <FontAwesome5 name={guide.icon} size={20} color={guide.color} />
              </View>
              <Text style={styles.cardTitle}>{guide.title}</Text>
              <Ionicons 
                name={expandedId === guide.id ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#999" 
              />
            </View>
            
            {expandedId === guide.id && (
              <View style={styles.cardBody}>
                <View style={styles.divider} />
                {guide.steps.map((step, index) => (
                  <Text key={index} style={styles.stepText}>{step}</Text>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#DC2626', padding: 20, paddingTop: 50, flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 15 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  list: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, padding: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#333' },
  cardBody: { marginTop: 10 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 10 },
  stepText: { fontSize: 14, color: '#475569', marginBottom: 6, lineHeight: 22 },
});