import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar, 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import geolocationService from '../services/geolocation';
import { Exam, ExamQuestion, LocationData } from '../types';

interface ResponderExamScreenProps {
  navigation: any;
}

const SAMPLE_EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: '1',
    question: 'What is the universal compression-to-breath ratio for adult CPR?',
    options: ['15:2', '30:2', '5:1', 'Continuous'],
    correctAnswer: 1,
    points: 10,
  },
  // ... (You can add the rest back, keeping it short for copy/paste)
];

export const ResponderExamScreen: React.FC<ResponderExamScreenProps> = ({ navigation }) => {
  const { state: authState, authContext } = useAuth();
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
    try {
        const permitted = await geolocationService.requestLocationPermissions();
        if (permitted) {
          const loc = await geolocationService.getCurrentLocation();
          if (loc) setLocation(loc);
        }
    } catch (e) {
        console.log("Loc permission error", e);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out', 
      'Are you sure you want to quit the exam process and sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => authContext.signOut() 
        }
      ]
    );
  };

  const handleStartExam = () => setExamStarted(true);

  // --- FIXED BYPASS LOGIC ---
  const handleDevBypass = async () => {
    if (!authState.user) return;
    
    setSubmitting(true);
    try {
      await apiService.submitExam({
        userId: authState.user.id,
        examId: 'dev_bypass',
        score: 100,
        totalQuestions: 10,
        correctAnswers: 10,
        answers: [],
        passed: true,
        location: null,
      });
      
      Alert.alert("Success", "You are now a Responder. Please re-login to update your status.", [
        { text: "OK", onPress: () => authContext.signOut() }
      ]);

    } catch (error: any) {
      console.log("Bypass Error:", error);
      // Show specific error message from backend (e.g., "User not found")
      const msg = error.response?.data?.error || error.message || 'Bypass failed';
      Alert.alert('Error', msg);
    } finally {
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
        Alert.alert('🎉 Passed!', `You scored ${score}%. Please re-login to update dashboard.`, [
            { text: 'OK', onPress: () => authContext.signOut() }
        ]);
      } else {
        Alert.alert('Failed', `You scored ${score}%. Try again.`, [{ 
            text: 'Retry', 
            onPress: () => {
                setExamStarted(false);
                setSubmitting(false);
                setAnswers({});
                setCurrentQuestion(0);
            }
        }]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit');
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

  // --- INTRO SCREEN ---
  if (!examStarted) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        
        {/* LOGOUT BUTTON */}
        <View style={styles.topHeader}>
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
                <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
                <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
        </View>

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

        <TouchableOpacity style={styles.devButton} onPress={handleDevBypass} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#999" /> : <Text style={styles.devButtonText}>👨‍💻 Developer Bypass</Text>}
        </TouchableOpacity>

      </ScrollView>
    );
  }

  // --- EXAM SCREEN ---
  const question = exam.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / exam.questions.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
         <TouchableOpacity onPress={handleSignOut}>
            <Text style={{color:'#999', fontSize:12}}>Exit</Text>
         </TouchableOpacity>
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
  contentContainer: { padding: 20, paddingTop: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  topHeader: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  signOutText: { color: '#e74c3c', fontWeight: 'bold', marginLeft: 4 },

  header: { marginBottom: 30, marginTop: 10 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  description: { fontSize: 16, color: '#666', lineHeight: 24 },
  infoCard: { backgroundColor: '#f9f9f9', padding: 20, borderRadius: 10, marginBottom: 30 },
  infoRow: { fontSize: 16, marginBottom: 10, fontWeight: '500' },
  
  startButton: { backgroundColor: '#e74c3c', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  devButton: { padding: 15, alignItems: 'center', borderTopWidth: 1, borderColor: '#eee', marginTop: 10 },
  devButtonText: { color: '#999', fontSize: 14, textDecorationLine: 'underline' },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, paddingTop: 40, backgroundColor: '#f9f9f9' },
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