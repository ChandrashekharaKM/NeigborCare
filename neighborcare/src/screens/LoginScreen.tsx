import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [otpOrPassword, setOtpOrPassword] = useState('');
  const [useOtp, setUseOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { authContext } = useAuth();

  const handleRequestOTP = async () => {
    if (!phoneOrEmail.trim()) {
      Alert.alert('Error', 'Please enter your phone number or email');
      return;
    }
    setSendingOtp(true);
    try {
      await authContext.requestOTP(phoneOrEmail);
      setUseOtp(true);
      setOtpSent(true);
      Alert.alert('Success', 'OTP sent (Check backend console)');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleLogin = async () => {
    if (!phoneOrEmail.trim() || !otpOrPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (useOtp && otpSent) {
        if (otpOrPassword.length !== 6) {
          Alert.alert('Error', 'OTP must be 6 digits');
          setLoading(false);
          return;
        }
        await authContext.signIn(phoneOrEmail, otpOrPassword);
      } else {
        await authContext.signInWithPassword(phoneOrEmail, otpOrPassword);
      }
      // NOTE: No navigation.navigate here! RootNavigator handles it.
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <Text style={styles.appName}>🚑 NeighborCare</Text>
          <Text style={styles.tagline}>Community Emergency Response</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Login</Text>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Phone No / Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number or email"
              placeholderTextColor="#999"
              autoCapitalize="none"
              value={phoneOrEmail}
              onChangeText={(text) => {
                setPhoneOrEmail(text);
                if (otpSent) {
                  setOtpSent(false);
                  setUseOtp(false);
                  setOtpOrPassword('');
                }
              }}
              editable={!loading}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>{useOtp && otpSent ? 'OTP' : 'Password'}</Text>
            <View style={styles.otpPasswordContainer}>
              <TextInput
                style={styles.otpPasswordInput}
                placeholder={useOtp && otpSent ? 'Enter OTP' : 'Enter password'}
                placeholderTextColor="#999"
                keyboardType={useOtp && otpSent ? 'number-pad' : 'default'}
                secureTextEntry={!useOtp && !showPassword}
                value={otpOrPassword}
                onChangeText={setOtpOrPassword}
                maxLength={useOtp && otpSent ? 6 : undefined}
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.otpButton, sendingOtp && styles.otpButtonDisabled]}
                onPress={handleRequestOTP}
                disabled={sendingOtp || loading || !phoneOrEmail.trim()}
              >
                {sendingOtp ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.otpButtonText}>OTP</Text>
                )}
              </TouchableOpacity>
            </View>
            {!useOtp && (
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIconContainer}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.linkText}>Don't have an account? Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  contentContainer: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  appName: { fontSize: 36, fontWeight: 'bold', color: '#e74c3c', marginBottom: 8 },
  tagline: { fontSize: 14, color: '#666' },
  formContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 3 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 30, textAlign: 'center' },
  inputWrapper: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, color: '#333' },
  otpPasswordContainer: { flexDirection: 'row', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, overflow: 'hidden' },
  otpPasswordInput: { flex: 1, padding: 12, fontSize: 16, color: '#333' },
  otpButton: { backgroundColor: '#3498db', paddingHorizontal: 20, justifyContent: 'center' },
  otpButtonDisabled: { opacity: 0.6 },
  otpButtonText: { color: '#fff', fontWeight: '600' },
  eyeIconContainer: { position: 'absolute', right: 90, top: 40, padding: 5 },
  button: { backgroundColor: '#e74c3c', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 15 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkButton: { paddingVertical: 10 },
  linkText: { color: '#e74c3c', textAlign: 'center', fontWeight: '500' },
});