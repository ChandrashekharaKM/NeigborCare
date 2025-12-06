import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  StatusBar,
  LayoutAnimation,
  UIManager
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_DATA = [
  {
    id: 1,
    question: "How do I trigger an SOS?",
    answer: "On the Home screen, simply press and hold the large Red SOS button. This will alert nearby responders and your emergency contacts immediately."
  },
  {
    id: 2,
    question: "Who sees my location?",
    answer: "Your location is only shared when you trigger an emergency. It is visible to Responders who accept your alert and your designated Emergency Contacts."
  },
  {
    id: 3,
    question: "How do I become a Responder?",
    answer: "Go to your Profile or Home screen and click 'Volunteer'. You will need to pass a basic First Aid certification exam to become verified."
  },
  {
    id: 4,
    question: "Can I cancel an alert?",
    answer: "Yes. If you triggered an alert by mistake, you can cancel it from the Tracking Screen by entering your unique PIN or holding the Cancel button."
  },
];

export const HelpSupportScreen = ({ navigation }: any) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@neighborcare.com?subject=App Support Request');
  };

  const handleWebsite = () => {
    Linking.openURL('https://neighborcare.com/guide');
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* ================= HEADER ================= */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={{ width: 24 }} /> 
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Contact Support Card */}
        <View style={styles.supportCard}>
          <Text style={styles.cardTitle}>Still need help?</Text>
          <Text style={styles.cardSub}>Our team is available 24/7 for technical issues.</Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.contactBtn} onPress={handleEmailSupport}>
              <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="mail" size={20} color="#0284C7" />
              </View>
              <Text style={styles.btnText}>Email Us</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactBtn} onPress={handleWebsite}>
              <View style={[styles.iconCircle, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="book" size={20} color="#9333EA" />
              </View>
              <Text style={styles.btnText}>User Guide</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <Text style={styles.sectionHeader}>Frequently Asked Questions</Text>
        
        <View style={styles.faqContainer}>
          {FAQ_DATA.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.faqItem, isExpanded && styles.faqItemActive]}
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.9}
              >
                <View style={styles.questionRow}>
                  <Text style={[styles.questionText, isExpanded && styles.questionTextActive]}>
                    {item.question}
                  </Text>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={isExpanded ? "#DC2626" : "#94A3B8"} 
                  />
                </View>
                {isExpanded && (
                  <View style={styles.answerBox}>
                    <Text style={styles.answerText}>{item.answer}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* App Info */}
        <View style={styles.infoFooter}>
          <MaterialCommunityIcons name="shield-check-outline" size={40} color="#CBD5E1" />
          <Text style={styles.infoFooterText}>NeighborCare Safety Network</Text>
          <Text style={styles.versionText}>Version 1.0.2 (Build 2024)</Text>
        </View>

      </ScrollView>

      {/* ================= FOOTER ================= */}
      <View style={[styles.footer, { backgroundColor: '#DC2626' }]}>
        <TouchableOpacity onPress={() => Linking.openURL('tel:108')}>
          <Text style={styles.footerLink}>Call Ambulance (108)</Text>
        </TouchableOpacity>
        <Text style={styles.footerDivider}>|</Text>
        <TouchableOpacity onPress={() => Linking.openURL('tel:100')}>
          <Text style={styles.footerLink}>Police (100)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },

  // HEADER
  headerContainer: {
    backgroundColor: '#DC2626',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 50,
    paddingBottom: 20, paddingHorizontal: 20,
    elevation: 4, zIndex: 10
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  backButton: { padding: 4 },

  scrollContent: { padding: 20, paddingBottom: 80 },

  // SUPPORT CARD
  supportCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 30,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5,
    alignItems: 'center'
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  cardSub: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 20 },
  buttonRow: { flexDirection: 'row', width: '100%', gap: 15 },
  contactBtn: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9'
  },
  iconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  btnText: { fontSize: 14, fontWeight: '600', color: '#334155' },

  // FAQ
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 15, marginLeft: 5 },
  faqContainer: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', elevation: 2 },
  faqItem: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  faqItemActive: { backgroundColor: '#FEF2F2' }, // Light red tint when open
  questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  questionText: { fontSize: 15, fontWeight: '500', color: '#1E293B', flex: 1, marginRight: 10 },
  questionTextActive: { color: '#DC2626', fontWeight: '700' },
  answerBox: { paddingHorizontal: 18, paddingBottom: 18, paddingTop: 0 },
  answerText: { fontSize: 14, color: '#64748B', lineHeight: 20 },

  // INFO FOOTER
  infoFooter: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  infoFooterText: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginTop: 10 },
  versionText: { fontSize: 12, color: '#CBD5E1', marginTop: 4 },

  // FOOTER
  footer: { 
    paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', 
    position: 'absolute', bottom: 0, left: 0, right: 0 
  },
  footerLink: { color: '#fff', fontSize: 12, fontWeight: '700', paddingHorizontal: 12 },
  footerDivider: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});