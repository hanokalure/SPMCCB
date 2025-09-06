import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../contexts/OfflineContext';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { settings } = useOffline();
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Theme colors
  const colors = {
    background: settings.theme === 'light' ? '#f8f9fa' : '#1a202c',
    cardBackground: settings.theme === 'light' ? '#ffffff' : '#2d3748',
    text: settings.theme === 'light' ? '#2d3748' : '#f7fafc',
    textSecondary: settings.theme === 'light' ? '#718096' : '#a0aec0',
    accent: settings.theme === 'light' ? '#3182ce' : '#63b3ed',
    border: settings.theme === 'light' ? '#e2e8f0' : '#4a5568',
    error: '#e53e3e',
    success: '#38a169',
  };

  // Validate email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Validate password
  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  // Handle login
  const handleLogin = async () => {
    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email.trim(), password);

      if (error) {
        // Show user-friendly error messages
        if (error.message?.includes('Invalid login credentials')) {
          Alert.alert('Login Failed', 'Invalid email or password. Please check your credentials and try again.');
        } else if (error.message?.includes('Email not confirmed')) {
          Alert.alert('Email Not Confirmed', 'Please check your email and click the confirmation link before signing in.');
        } else if (error.message?.includes('Too many requests')) {
          Alert.alert('Too Many Attempts', 'Too many login attempts. Please wait a few minutes and try again.');
        } else {
          Alert.alert('Login Failed', error.message || 'An error occurred during login. Please try again.');
        }
        return;
      }

      // Success! Navigation will be handled by AuthContext/StackNavigator
      console.log('✅ Login successful');

    } catch (error) {
      console.error('Unexpected login error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="musical-notes" size={64} color={colors.accent} />
              <Text style={[styles.appTitle, { color: colors.text, fontSize: Math.max(settings?.fontSize || 16, 24) + 8 }]}>
                SingHisWord
              </Text>
              <Text style={[styles.appSubtitle, { color: colors.textSecondary, fontSize: Math.max(settings?.fontSize || 16, 14) }]}>
                Your personal hymnal companion
              </Text>
            </View>
          </View>

          {/* Login Form */}
          <View style={[styles.formContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.formTitle, { color: colors.text, fontSize: Math.max(settings?.fontSize || 16, 16) + 4 }]}>
              Welcome Back
            </Text>
            <Text style={[styles.formSubtitle, { color: colors.textSecondary, fontSize: Math.max(settings?.fontSize || 16, 14) }]}>
              Sign in to access your favorite songs
            </Text>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text, fontSize: Math.max(settings?.fontSize || 16, 14) }]}>
                Email
              </Text>
              <View style={[styles.inputContainer, { borderColor: emailError ? colors.error : colors.border }]}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text, fontSize: Math.max(settings?.fontSize || 16, 16) }]}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) validateEmail(text);
                  }}
                  onBlur={() => validateEmail(email)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
              {emailError ? (
                <Text style={[styles.errorText, { fontSize: Math.max(settings?.fontSize || 16, 12) }]}>
                  {emailError}
                </Text>
              ) : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text, fontSize: Math.max(settings?.fontSize || 16, 14) }]}>
                Password
              </Text>
              <View style={[styles.inputContainer, { borderColor: passwordError ? colors.error : colors.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text, fontSize: Math.max(settings?.fontSize || 16, 16) }]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) validatePassword(text);
                  }}
                  onBlur={() => validatePassword(password)}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={[styles.errorText, { fontSize: Math.max(settings?.fontSize || 16, 12) }]}>
                  {passwordError}
                </Text>
              ) : null}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                { backgroundColor: colors.accent },
                isLoading && { opacity: 0.7 }
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#ffffff" />
                  <Text style={[styles.loginButtonText, { fontSize: Math.max(settings?.fontSize || 16, 16) }]}>
                    Sign In
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={[styles.signupText, { color: colors.textSecondary, fontSize: Math.max(settings?.fontSize || 16, 14) }]}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Signup')}
                disabled={isLoading}
              >
                <Text style={[styles.signupLink, { color: colors.accent, fontSize: Math.max(settings?.fontSize || 16, 14) }]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
  },
  appTitle: {
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  appSubtitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  formContainer: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  formTitle: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontWeight: '500',
  },
  showPasswordButton: {
    padding: 4,
  },
  errorText: {
    color: '#e53e3e',
    marginTop: 6,
    fontWeight: '500',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#3182ce',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signupText: {
    fontWeight: '500',
  },
  signupLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
