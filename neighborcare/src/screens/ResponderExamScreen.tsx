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
  route?: {
    params?: {
      examId?: string;
    };
  };
}

const SAMPLE_EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: '1',
    question: 'What is the correct compression rate for adult CPR?',
    options: ['60-80 per minute', '100-120 per minute', '140-160 per minute', '80-100 per minute'],
    correctAnswer: 1,
    points: 10,
  },
  {
    id: '2',
    question: 'How deep should chest compressions be for an adult?',
    options: ['1-2 inches', '2-3 inches', '3-4 inches', '4-5 inches'],
    correctAnswer: 1,
    points: 10,
  },
  {
    id: '3',
    question: 'What is the first step when you encounter an unresponsive person?',
    options: [
      'Start CPR immediately',
      'Check for breathing',
      'Call emergency services',
      'Check for responsiveness and call for help',
    ],
    correctAnswer: 3,
    points: 10,
  },
  {
    id: '4',
    question: 'How do you control severe bleeding?',
    options: [
      'Apply ice directly',
      'Apply direct pressure with clean cloth',
      'Elevate the limb only',
      'Use a tourniquet immediately',
    ],
    correctAnswer: 1,
    points: 10,
  },
  {
    id: '5',
    question: 'What is the recovery position used for?',
    options: [
      'CPR',
      'Unconscious breathing person',
      'Choking victim',
      'Heart attack victim',
    ],
    correctAnswer: 1,
    points: 10,
  },
];

export const ResponderExamScreen: React.FC<ResponderExamScreenProps> = ({ navigation, route }) => {
  const { state: authState } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds

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
      // In production, fetch exam from API
      // const examData = await apiService.getExam(route?.params?.examId);
      // For now, use sample exam
      const sampleExam: Exam = {
        id: 'exam1',
        title: 'Responder Certification Exam',
        description: 'Complete this exam to become a certified responder',
        questions: SAMPLE_EXAM_QUESTIONS,
        passingScore: 70,
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
        const currentLocation = await geolocationService.getCurrentLocation();
        if (currentLocation) {
          setLocation(currentLocation);
        }
      }
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const handleStartExam = () => {
    Alert.alert(
      'Start Exam',
      'Once you start, you will have 30 minutes to complete the exam. Your location will be tracked. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => {
            setExamStarted(true);
            // Start location tracking
            startLocationTracking();
          },
        },
      ]
    );
  };

  const startLocationTracking = () => {
    // Track location every 30 seconds during exam
    const locationInterval = setInterval(async () => {
      try {
        const currentLocation = await geolocationService.getCurrentLocation();
        if (currentLocation) {
          setLocation(currentLocation);
          // Send location to backend
          if (authState.user) {
            await apiService.updateResponderLocation(
              authState.user.id,
              currentLocation.latitude,
              currentLocation.longitude
            );
          }
        }
      } catch (error) {
        console.error('Location tracking error:', error);
      }
    }, 30000);

    // Clear interval when component unmounts or exam ends
    return () => clearInterval(locationInterval);
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const handleSubmitExam = async () => {
    if (!exam) return;

    const answeredQuestions = Object.keys(answers).length;
    if (answeredQuestions < exam.questions.length) {
      Alert.alert(
        'Incomplete Exam',
        `You have answered ${answeredQuestions} out of ${exam.questions.length} questions. Are you sure you want to submit?`,
        [
          { text: 'Continue Exam', style: 'cancel' },
          { text: 'Submit', onPress: () => submitExam() },
        ]
      );
    } else {
      submitExam();
    }
  };

  const submitExam = async () => {
    if (!exam || !authState.user) return;

    setSubmitting(true);
    try {
      // Calculate score
      let correctAnswers = 0;
      const answerArray = exam.questions.map((q) => {
        const userAnswer = answers[q.id];
        if (userAnswer === q.correctAnswer) {
          correctAnswers++;
        }
        return {
          questionId: q.id,
          selectedAnswer: userAnswer ?? -1,
        };
      });

      const score = (correctAnswers / exam.questions.length) * 100;
      const passed = score >= exam.passingScore;

      // Submit exam results with location
      const result = await apiService.submitExam({
        userId: authState.user.id,
        examId: exam.id,
        score,
        totalQuestions: exam.questions.length,
        correctAnswers,
        answers: answerArray,
        passed,
        location: location
          ? { latitude: location.latitude, longitude: location.longitude }
          : null,
      });

      if (passed) {
        Alert.alert('Congratulations!', `You passed with ${score.toFixed(1)}%!`, [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ]);
      } else {
        Alert.alert(
          'Exam Failed',
          `You scored ${score.toFixed(1)}%. You need ${exam.passingScore}% to pass.`,
          [
            {
              text: 'Retake',
              onPress: () => {
                setCurrentQuestion(0);
                setAnswers({});
                setExamStarted(false);
                setTimeRemaining(exam.duration * 60);
              },
            },
            {
              text: 'OK',
              onPress: () => navigation.navigate('Home'),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Loading exam...</Text>
      </View>
    );
  }

  if (!exam) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Exam not found</Text>
      </View>
    );
  }

  if (!examStarted) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{exam.title}</Text>
          <Text style={styles.description}>{exam.description}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Exam Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Questions:</Text>
            <Text style={styles.infoValue}>{exam.questions.length}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration:</Text>
            <Text style={styles.infoValue}>{exam.duration} minutes</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Passing Score:</Text>
            <Text style={styles.infoValue}>{exam.passingScore}%</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location Tracking:</Text>
            <Text style={styles.infoValue}>
              {location ? '✅ Enabled' : '⚠️ Please enable location'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.startButton, !location && styles.startButtonDisabled]}
          onPress={handleStartExam}
          disabled={!location}
        >
          <Text style={styles.startButtonText}>Start Exam</Text>
        </TouchableOpacity>

        {!location && (
          <Text style={styles.warningText}>
            Please enable location permissions to start the exam
          </Text>
        )}
      </ScrollView>
    );
  }

  const question = exam.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / exam.questions.length) * 100;

  return (
    <View style={styles.container}>
      {/* Timer and Progress */}
      <View style={styles.examHeader}>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>Time: {formatTime(timeRemaining)}</Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Question {currentQuestion + 1} of {exam.questions.length}
        </Text>
      </View>

      <ScrollView style={styles.questionContainer}>
        <Text style={styles.questionText}>{question.question}</Text>

        {question.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              answers[question.id] === index && styles.optionButtonSelected,
            ]}
            onPress={() => handleAnswerSelect(question.id, index)}
          >
            <Text
              style={[
                styles.optionText,
                answers[question.id] === index && styles.optionTextSelected,
              ]}
            >
              {String.fromCharCode(65 + index)}. {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, currentQuestion === 0 && styles.navButtonDisabled]}
          onPress={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
        >
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>

        {currentQuestion < exam.questions.length - 1 ? (
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setCurrentQuestion(currentQuestion + 1)}
          >
            <Text style={styles.navButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, styles.submitButton]}
            onPress={handleSubmitExam}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.navButtonText}>Submit Exam</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  startButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  startButtonDisabled: {
    backgroundColor: '#ccc',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  warningText: {
    color: '#e74c3c',
    textAlign: 'center',
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 50,
  },
  examHeader: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  timerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#e74c3c',
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  questionContainer: {
    flex: 1,
    padding: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  optionButtonSelected: {
    borderColor: '#e74c3c',
    backgroundColor: '#fff5f5',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    color: '#e74c3c',
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    flex: 1,
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  navButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButton: {
    backgroundColor: '#27ae60',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

