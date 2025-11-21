import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

interface BecomeResponderScreenProps {
  navigation: any;
}

export const BecomeResponderScreen: React.FC<BecomeResponderScreenProps> = ({
  navigation,
}) => {
  const { state: authState } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [currentModule, setCurrentModule] = useState(0);

  // Check if user needs to take exam first
  useEffect(() => {
    if (authState.user?.is_responder && !(authState.user as any).exam_passed) {
      // Redirect to exam screen if responder but hasn't passed exam
      navigation.navigate('ResponderExam');
    }
  }, [authState.user]);

  const trainingModules = [
    {
      id: 1,
      title: 'CPR Basics',
      description: 'Learn the fundamentals of Cardiopulmonary Resuscitation',
      duration: '5 min',
    },
    {
      id: 2,
      title: 'Bleeding Control',
      description: 'How to stop and manage severe bleeding',
      duration: '4 min',
    },
    {
      id: 3,
      title: 'Choking Relief',
      description: 'Heimlich maneuver and airway clearance',
      duration: '3 min',
    },
    {
      id: 4,
      title: 'Shock Management',
      description: 'Recognizing and treating shock',
      duration: '4 min',
    },
    {
      id: 5,
      title: 'Recovery Position',
      description: 'Safe positioning for unconscious victims',
      duration: '3 min',
    },
  ];

  const handleBecomeResponder = async () => {
    if (!authState.user) return;

    setLoading(true);
    try {
      await apiService.becomeResponder(authState.user.id);
      Alert.alert(
        'Success',
        'You are now registered as a responder! Complete the basic training to get certified.'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to become responder');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTraining = () => {
    // For responders, they must take exam first
    if (authState.user?.is_responder) {
      navigation.navigate('ResponderExam');
      return;
    }
    setShowTrainingModal(true);
  };

  const handleTakeExam = () => {
    navigation.navigate('ResponderExam');
  };

  const handleCompleteModule = async () => {
    const nextModule = currentModule + 1;
    if (nextModule < trainingModules.length) {
      setTrainingProgress(Math.round(((nextModule + 1) / trainingModules.length) * 100));
      setCurrentModule(nextModule);
    } else {
      // All modules completed
      await completeTraining();
    }
  };

  const completeTraining = async () => {
    if (!authState.user) return;

    setLoading(true);
    try {
      await apiService.completeBaiscTraining(authState.user.id);
      Alert.alert(
        'Congratulations! 🎉',
        'You have completed the Basic Training and are now certified!',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowTrainingModal(false);
              setCurrentModule(0);
              setTrainingProgress(0);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete training');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Become a Responder</Text>
        <Text style={styles.subtitle}>
          Help save lives in your community during emergencies
        </Text>
      </View>

      <View style={styles.benefitsCard}>
        <Text style={styles.cardTitle}>Why Become a Responder?</Text>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitEmoji}>⏱️</Text>
          <Text style={styles.benefitText}>Response in minutes, not hours</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitEmoji}>🤝</Text>
          <Text style={styles.benefitText}>Help your community</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitEmoji}>🏆</Text>
          <Text style={styles.benefitText}>Earn badges and recognition</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitEmoji}>📱</Text>
          <Text style={styles.benefitText}>Real-time emergency alerts</Text>
        </View>
      </View>

      <View style={styles.requirementsCard}>
        <Text style={styles.cardTitle}>Requirements</Text>
        <View style={styles.requirementItem}>
          <Text style={styles.checkmark}>✓</Text>
          <Text style={styles.requirementText}>18 years or older</Text>
        </View>
        <View style={styles.requirementItem}>
          <Text style={styles.checkmark}>✓</Text>
          <Text style={styles.requirementText}>Pass background check</Text>
        </View>
        <View style={styles.requirementItem}>
          <Text style={styles.checkmark}>✓</Text>
          <Text style={styles.requirementText}>Have a valid certification OR complete Basic Training</Text>
        </View>
        <View style={styles.requirementItem}>
          <Text style={styles.checkmark}>✓</Text>
          <Text style={styles.requirementText}>Enable location sharing</Text>
        </View>
      </View>

      <View style={styles.certificationCard}>
        <Text style={styles.cardTitle}>Get Certified</Text>
        <Text style={styles.certificationSubtext}>
          Choose one of two options to get certified:
        </Text>

        <View style={styles.optionContainer}>
          <Text style={styles.optionTitle}>Option 1: Upload Certification</Text>
          <Text style={styles.optionDescription}>
            If you already have a medical or first aid certification
          </Text>
          <TouchableOpacity style={styles.optionButton} onPress={() => {}}>
            <Text style={styles.optionButtonText}>Upload Certificate</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.optionContainer}>
          <Text style={styles.optionTitle}>
            {authState.user?.is_responder ? 'Option 2: Take Certification Exam' : 'Option 2: Basic Training'}
          </Text>
          <Text style={styles.optionDescription}>
            {authState.user?.is_responder
              ? 'Complete the responder certification exam with location tracking'
              : 'Watch videos and take a quiz (~20 minutes)'}
          </Text>
          <TouchableOpacity
            style={[styles.optionButton, styles.primaryButton]}
            onPress={authState.user?.is_responder ? handleTakeExam : handleStartTraining}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {authState.user?.is_responder ? 'Take Exam' : 'Start Training'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Training Modal */}
      <Modal visible={showTrainingModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Basic Training Module</Text>
              <Text style={styles.progressText}>{trainingProgress}%</Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${trainingProgress}%` }]}
              />
            </View>

            <View style={styles.moduleContainer}>
              <Text style={styles.moduleNumber}>
                Module {currentModule + 1} of {trainingModules.length}
              </Text>
              <Text style={styles.moduleTitle}>
                {trainingModules[currentModule].title}
              </Text>
              <Text style={styles.moduleDescription}>
                {trainingModules[currentModule].description}
              </Text>
              <Text style={styles.moduleDuration}>
                Duration: {trainingModules[currentModule].duration}
              </Text>
            </View>

            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>▶️ Video Training</Text>
              <Text style={styles.videoPlaceholderSubtext}>
                In production app, this would show actual video content
              </Text>
            </View>

            <View style={styles.quizContainer}>
              <Text style={styles.quizTitle}>Quick Quiz</Text>
              <Text style={styles.quizQuestion}>
                What is the correct compression rate for CPR?
              </Text>
              <TouchableOpacity style={styles.quizOption}>
                <Text style={styles.quizOptionText}>A) 60-80 compressions/min</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quizOption}>
                <Text style={styles.quizOptionText}>B) 100-120 compressions/min</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quizOption}>
                <Text style={styles.quizOptionText}>C) 140-160 compressions/min</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.nextButton, loading && styles.disabledButton]}
              onPress={handleCompleteModule}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : currentModule === trainingModules.length - 1 ? (
                <Text style={styles.nextButtonText}>Finish & Get Certified</Text>
              ) : (
                <Text style={styles.nextButtonText}>Next Module</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowTrainingModal(false);
                setCurrentModule(0);
                setTrainingProgress(0);
              }}
              disabled={loading}
            >
              <Text style={styles.closeModalText}>Cancel Training</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  backButton: {
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  benefitsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  requirementsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  certificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 30,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 8,
  },
  benefitEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  benefitText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 8,
  },
  checkmark: {
    fontSize: 18,
    color: '#4caf50',
    marginRight: 12,
    fontWeight: 'bold',
  },
  requirementText: {
    fontSize: 13,
    color: '#666',
  },
  certificationSubtext: {
    fontSize: 13,
    color: '#999',
    marginBottom: 15,
  },
  optionContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  optionButton: {
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  optionButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: '#e74c3c',
  },
  primaryButtonText: {
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 15,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e74c3c',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e74c3c',
  },
  moduleContainer: {
    marginBottom: 20,
  },
  moduleNumber: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
  },
  moduleDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  moduleDuration: {
    fontSize: 12,
    color: '#999',
  },
  videoPlaceholder: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 40,
    alignItems: 'center',
    marginBottom: 15,
  },
  videoPlaceholderText: {
    fontSize: 32,
    marginBottom: 8,
  },
  videoPlaceholderSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  quizContainer: {
    marginBottom: 15,
  },
  quizTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  quizQuestion: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginBottom: 10,
  },
  quizOption: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  quizOptionText: {
    fontSize: 12,
    color: '#333',
  },
  nextButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  closeModalText: {
    color: '#999',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 10,
  },
});
