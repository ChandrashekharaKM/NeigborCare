import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import geolocationService from '../services/geolocation';
import { Exam, ExamQuestion, LocationData } from '../types';

interface ResponderExamScreenProps {
  navigation: any;
}

// --- REAL EXAM QUESTIONS ---
const SAMPLE_EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: '1',
    question: 'What is the universal compression-to-breath ratio for adult CPR?',
    options: ['15 compressions : 2 breaths', '30 compressions : 2 breaths', '5 compressions : 1 breath', 'Continuous compressions only'],
    correctAnswer: 1,
    points: 10,
  },
  {
    id: '2',
    question: 'You find an unresponsive victim. What is your very first action?',
    options: ['Start CPR immediately', 'Check for a pulse', 'Check the scene for safety', 'Call 911'],
    correctAnswer: 2,
    points: 10,
  },
  {
    id: '3',
    question: 'How do you check for responsiveness in an infant?',
    options: ['Shake them vigorously', 'Tap the bottom of their foot', 'Yell loudly', 'Pinch their cheek'],
    correctAnswer: 1,
    points: 10,
  },
  {
    id: '4',
    question: 'What is the recommended depth of chest compressions for an adult?',
    options: ['At least 2 inches (5 cm)', 'Exactly 1 inch', 'At least 3 inches', 'Depends on age'],
    correctAnswer: 0,
    points: 10,
  },
  {
    id: '5',
    question: 'How should you treat a severe nosebleed?',
    options: ['Tilt head back', 'Tilt head forward and pinch nostrils', 'Lie down flat', 'Pack the nose with cotton'],
    correctAnswer: 1,
    points: 10,
  },
  {
    id: '6',
    question: 'What is the universal sign for choking?',
    options: ['Coughing loudly', 'Hands clutched to the throat', 'Waving arms', 'Pointing to mouth'],
    correctAnswer: 1,
    points: 10,
  },
  {
    id: '7',
    question: 'You see a person collapse. The AED (Defibrillator) arrives. What is the first step?',
    options: ['Apply pads to chest', 'Turn it on', 'Clear the victim', 'Deliver a shock'],
    correctAnswer: 1,
    points: 10,
  },
  {
    id: '8',
    question: 'What does the acronym FAST stand for regarding strokes?',
    options: ['Face, Arms, Speech, Time', 'Feet, Arms, Stomach, Toes', 'Face, Airway, Speech, Tongue', 'Fast Action Saves Time'],
    correctAnswer: 0,
    points: 10,
  },
  {
    id: '9',
    question: 'How do you treat a minor thermal burn?',
    options: ['Apply ice immediately', 'Apply butter or oil', 'Cool with running water for 10+ mins', 'Pop any blisters formed'],
    correctAnswer: 2,
    points: 10,
  },
  {
    id: '10',
    question: 'When performing CPR, what is the correct rate of compressions?',
    options: ['60-80 per minute', '80-100 per minute', '100-120 per minute', '140+ per minute'],
    correctAnswer: 2,
    points: 10,
  },
];

export const ResponderExamScreen: React.FC<ResponderExamScreenProps> = ({ navigation }) => {
  const { state: authState } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60);

  useEffect(() => {
    initializeExam();
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (examStarted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [examStarted, timeRemaining]);

  const initializeExam = async () => {
    try {
      setLoading(true);
      const sampleExam: Exam = {
        id: 'exam_cert_01',
        title: 'Community First Responder Certification',
        description: 'Pass this exam to become a verified responder in the NeighborCare network.',
        questions: SAMPLE_EXAM_QUESTIONS,
        passingScore: 80, 
        duration: 30,
      };
      setExam(sampleExam);
      setTimeRemaining(sampleExam.duration * 60);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load exam');
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    const permitted = await geolocationService.requestLocationPermissions();
    if (permitted) {
      const loc = await geolocationService.getCurrentLocation();
      if (loc) setLocation(loc);
    }
  };

  const handleStartExam = () => {
    setExamStarted(true);
  };

  // --- FIXED: Developer Bypass (No Stuck Alert) ---
  const handleDevBypass = async () => {
    if (!authState.user) return;
    
    setSubmitting(true);

    try {
      // We send a fake "Perfect Score" to the backend
      await apiService.submitExam({
        userId: authState.user.id,
        examId: 'dev_bypass',
        score: 100,
        totalQuestions: 10,
        correctAnswers: 10,
        answers: [],
        passed: true, // Force Pass
        location: null,
      });

      // Reset navigation stack so they can't go back to exam
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
      
    } catch (error) {
      // Keep standard alert here for errors, it has a default OK button
      Alert.alert('Error', 'Bypass failed'); 
      setSubmitting(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleSubmitExam = async () => {
    if (!exam) return;
    const answeredCount = Object.keys(answers).length;
    
    if (answeredCount < exam.questions.length) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting.');
      return;
    }
    submitExam();
  };

  const submitExam = async () => {
    if (!exam || !authState.user) return;
    setSubmitting(true);
    
    try {
      let correctAnswers = 0;
      const answerArray = exam.questions.map((q) => {
        const userAnswer = answers[q.id];
        if (userAnswer === q.correctAnswer) correctAnswers++;
        return { questionId: q.id, selectedAnswer: userAnswer ?? -1 };
      });

      const score = (correctAnswers / exam.questions.length) * 100;
      const passed = score >= exam.passingScore;

      await apiService.submitExam({
        userId: authState.user.id,
        examId: exam.id,
        score,
        totalQuestions: exam.questions.length,
        correctAnswers,
        answers: answerArray,
        passed,
        location: location ? { latitude: location.latitude, longitude: location.longitude } : null,
      });

      if (passed) {
        Alert.alert('🎉 Passed!', `You scored ${score}%. You are now a certified responder.`, [
           { text: 'Go to Dashboard', onPress: () => navigation.navigate('Home') }
        ]);
      } else {
        Alert.alert('Failed', `You scored ${score}%. You need ${exam.passingScore}% to pass.`, [
           { text: 'Try Again', onPress: () => {
             setAnswers({});
             setCurrentQuestion(0);
             setExamStarted(false);
             setTimeRemaining(exam.duration * 60);
             setSubmitting(false);
           }}
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to submit exam');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator color="#e74c3c" /></View>;
  if (!exam) return <View><Text>Error loading exam</Text></View>;

  if (!examStarted) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{exam.title}</Text>
          <Text style={styles.description}>{exam.description}</Text>
        </View>
        <View style={styles.infoCard}>
           <Text style={styles.infoRow}>📋 Questions: {exam.questions.length}</Text>
           <Text style={styles.infoRow}>⏱ Duration: {exam.duration} mins</Text>
           <Text style={styles.infoRow}>✅ Passing Score: {exam.passingScore}%</Text>
        </View>
        
        <TouchableOpacity style={styles.startButton} onPress={handleStartExam}>
          <Text style={styles.startButtonText}>Start Exam</Text>
        </TouchableOpacity>

        {/* --- DEVELOPER BYPASS BUTTON --- */}
        <TouchableOpacity style={styles.devButton} onPress={handleDevBypass} disabled={submitting}>
          {submitting ? (
             <ActivityIndicator color="#999" />
          ) : (
             <Text style={styles.devButtonText}>👨‍💻 Developer Bypass (Skip Exam)</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    );
  }

  const question = exam.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / exam.questions.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
         <Text style={styles.timer}>{formatTime(timeRemaining)}</Text>
         <Text style={styles.progress}>Q {currentQuestion + 1}/{exam.questions.length}</Text>
      </View>
      <View style={{ height: 4, backgroundColor: '#eee' }}>
         <View style={{ height: 4, backgroundColor: '#e74c3c', width: `${progress}%` }} />
      </View>

      <ScrollView style={styles.questionContainer}>
        <Text style={styles.questionText}>{question.question}</Text>
        {question.options.map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.option, answers[question.id] === idx && styles.optionSelected]}
            onPress={() => handleAnswerSelect(question.id, idx)}
          >
            <Text style={[styles.optionText, answers[question.id] === idx && styles.optionTextSelected]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.navBar}>
        <TouchableOpacity 
          disabled={currentQuestion === 0}
          onPress={() => setCurrentQuestion(curr => curr - 1)}
          style={[styles.navBtn, currentQuestion === 0 && styles.disabledBtn]}
        >
          <Text style={styles.navText}>Previous</Text>
        </TouchableOpacity>

        {currentQuestion === exam.questions.length - 1 ? (
           <TouchableOpacity onPress={handleSubmitExam} style={[styles.navBtn, styles.submitBtn]}>
             {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.navText}>Submit</Text>}
           </TouchableOpacity>
        ) : (
           <TouchableOpacity onPress={() => setCurrentQuestion(curr => curr + 1)} style={styles.navBtn}>
             <Text style={styles.navText}>Next</Text>
           </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  contentContainer: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 30, marginTop: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  description: { fontSize: 16, color: '#666', lineHeight: 24 },
  infoCard: { backgroundColor: '#f9f9f9', padding: 20, borderRadius: 10, marginBottom: 30 },
  infoRow: { fontSize: 16, marginBottom: 10, fontWeight: '500' },
  
  startButton: { backgroundColor: '#e74c3c', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Dev Button Style
  devButton: { padding: 15, alignItems: 'center', borderTopWidth: 1, borderColor: '#eee', marginTop: 10 },
  devButtonText: { color: '#999', fontSize: 14, textDecorationLine: 'underline' },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#f9f9f9' },
  timer: { fontWeight: 'bold', fontSize: 16, color: '#e74c3c' },
  progress: { fontWeight: 'bold', color: '#666' },
  questionContainer: { padding: 20, flex: 1 },
  questionText: { fontSize: 20, fontWeight: 'bold', marginBottom: 25, lineHeight: 28 },
  option: { padding: 16, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 12 },
  optionSelected: { borderColor: '#e74c3c', backgroundColor: '#fff5f5' },
  optionText: { fontSize: 16, color: '#333' },
  optionTextSelected: { color: '#e74c3c', fontWeight: 'bold' },
  navBar: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderColor: '#eee' },
  navBtn: { flex: 1, backgroundColor: '#333', padding: 15, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  submitBtn: { backgroundColor: '#27ae60' },
  disabledBtn: { backgroundColor: '#ccc' },
  navText: { color: '#fff', fontWeight: 'bold' },
});