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

    // Check if it's a phone number (contains only digits)
    const isPhone = /^\d+$/.test(phoneOrEmail.replace(/[\s\-\(\)]/g, ''));
    
    if (isPhone && phoneOrEmail.replace(/[\s\-\(\)]/g, '').length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setSendingOtp(true);
    try {
      // If it's an email, we might need a different endpoint, but for now use phone
      const phoneNumber = isPhone ? phoneOrEmail : phoneOrEmail; // In production, handle email differently
      await authContext.requestOTP(phoneNumber);
      setUseOtp(true);
      setOtpSent(true);
      Alert.alert('Success', 'OTP has been sent. Check the backend console for the OTP code.');
    } catch (error: any) {
      console.error('OTP Request Error:', error);
      const errorMessage = error?.message || 'Failed to send OTP. Please check your connection and try again.';
      Alert.alert('Error', errorMessage);
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
        // OTP login
        if (otpOrPassword.length !== 6) {
          Alert.alert('Error', 'OTP must be 6 digits');
          setLoading(false);
          return;
        }
        await authContext.signIn(phoneOrEmail, otpOrPassword);
      } else {
        // Password login
        await authContext.signInWithPassword(phoneOrEmail, otpOrPassword);
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Failed to login');
      setOtpOrPassword('');
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

          {/* Phone/Email Field */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Phone No / Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number or email"
              placeholderTextColor="#999"
              keyboardType="default"
              autoCapitalize="none"
              value={phoneOrEmail}
              onChangeText={(text) => {
                setPhoneOrEmail(text);
                // Reset OTP mode if user changes phone/email
                if (otpSent) {
                  setOtpSent(false);
                  setUseOtp(false);
                  setOtpOrPassword('');
                }
              }}
              editable={!loading}
            />
          </View>

          {/* OTP/Password Field with OTP Button */}
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
            {useOtp && otpSent && (
              <TouchableOpacity
                onPress={handleRequestOTP}
                disabled={sendingOtp}
                style={styles.resendOtpButton}
              >
                <Text style={styles.resendOtpText}>
                  {sendingOtp ? 'Sending...' : "Didn't receive? Resend OTP"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Sign In Button */}
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

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.linkText}>Don't have an account? Register</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Why NeighborCare?</Text>
          <Text style={styles.infoText}>
            ✓ Get help in minutes, not hours{'\n'}
            ✓ Trained community responders{'\n'}
            ✓ Real-time location tracking{'\n'}
            ✓ Peace of mind for you and your family
          </Text>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#666',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  otpPasswordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  otpPasswordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  otpButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  otpButtonDisabled: {
    opacity: 0.6,
  },
  otpButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  eyeIconContainer: {
    position: 'absolute',
    right: 90,
    top: 40,
    padding: 5,
  },
  resendOtpButton: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  resendOtpText: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#e74c3c',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 12,
  },
  linkButton: {
    paddingVertical: 10,
  },
  linkText: {
    color: '#e74c3c',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  infoContainer: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
});
