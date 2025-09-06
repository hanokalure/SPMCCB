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

const SignupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { settings } = useOffline();
  const { signUp } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

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
    if (password.length > 128) {
      setPasswordError('Password must be less than 128 characters');
      return false;
    }
    
    // Check for at least one uppercase, lowercase, and number
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setPasswordError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  // Validate confirm password
  const validateConfirmPassword = (confirmPassword: string, originalPassword: string): boolean => {
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (confirmPassword !== originalPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  // Handle signup
  const handleSignup = async () => {
    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword, password);

    if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email.trim(), password);

      if (error) {
        console.error('Signup error:', error);
        
        // Show user-friendly error messages
        if (error.message?.includes('User already registered')) {
          Alert.alert('Account Exists', 'An account with this email already exists. Please try signing in instead.');
        } else if (error.message?.includes('Password should be at least')) {
          Alert.alert('Weak Password', 'Please choose a stronger password with at least 6 characters.');
        } else if (error.message?.includes('Invalid email')) {
          Alert.alert('Invalid Email', 'Please enter a valid email address.');
        } else if (error.message?.includes('Signup requires a valid password')) {
          Alert.alert('Invalid Password', 'Please enter a valid password.');
        } else {
          Alert.alert('Signup Failed', error.message || 'An error occurred during signup. Please try again.');
        }
        return;
      }

      // Success!
      console.log('✅ Signup successful');
      Alert.alert(
        'Account Created!',
        'Your account has been created successfully. Please check your email for a confirmation link before signing in.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );

    } catch (error) {
      console.error('Unexpected signup error:', error);
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

          {/* Signup Form */}
          <View style={[styles.formContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.formTitle, { color: colors.text, fontSize: Math.max(settings?.fontSize || 16, 16) + 4 }]}>
              Create Account
            </Text>
            <Text style={[styles.formSubtitle, { color: colors.textSecondary, fontSize: Math.max(settings?.fontSize || 16, 14) }]}>
              Join our community of music lovers
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
                  placeholder="Create a password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) validatePassword(text);
                    if (confirmPassword && confirmPasswordError) {
                      validateConfirmPassword(confirmPassword, text);
                    }
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

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text, fontSize: Math.max(settings?.fontSize || 16, 14) }]}>
                Confirm Password
              </Text>
              <View style={[styles.inputContainer, { borderColor: confirmPasswordError ? colors.error : colors.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text, fontSize: Math.max(settings?.fontSize || 16, 16) }]}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.textSecondary}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (confirmPasswordError) validateConfirmPassword(text, password);
                  }}
                  onBlur={() => validateConfirmPassword(confirmPassword, password)}
                  secureTextEntry={!showConfirmPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? (
                <Text style={[styles.errorText, { fontSize: Math.max(settings?.fontSize || 16, 12) }]}>
                  {confirmPasswordError}
                </Text>
              ) : null}
            </View>

            {/* Password Requirements */}
            <View style={styles.passwordRequirements}>
              <Text style={[styles.requirementsTitle, { color: colors.textSecondary, fontSize: Math.max(settings?.fontSize || 16, 12) }]}>
                Password Requirements:
              </Text>
              <Text style={[styles.requirementText, { color: colors.textSecondary, fontSize: Math.max(settings?.fontSize || 16, 12) }]}>
                • At least 6 characters
              </Text>
              <Text style={[styles.requirementText, { color: colors.textSecondary, fontSize: Math.max(settings?.fontSize || 16, 12) }]}>
                • One uppercase letter
              </Text>
              <Text style={[styles.requirementText, { color: colors.textSecondary, fontSize: Math.max(settings?.fontSize || 16, 12) }]}>
                • One lowercase letter
              </Text>
              <Text style={[styles.requirementText, { color: colors.textSecondary, fontSize: Math.max(settings?.fontSize || 16, 12) }]}>
                • One number
              </Text>
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              style={[
                styles.signupButton,
                { backgroundColor: colors.accent },
                isLoading && { opacity: 0.7 }
              ]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={20} color="#ffffff" />
                  <Text style={[styles.signupButtonText, { fontSize: Math.max(settings?.fontSize || 16, 16) }]}>
                    Create Account
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: colors.textSecondary, fontSize: Math.max(settings?.fontSize || 16, 14) }]}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                disabled={isLoading}
              >
                <Text style={[styles.loginLink, { color: colors.accent, fontSize: Math.max(settings?.fontSize || 16, 14) }]}>
                  Sign In
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
  passwordRequirements: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 8,
  },
  requirementsTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  requirementText: {
    fontWeight: '400',
    lineHeight: 18,
  },
  signupButton: {
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
  signupButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontWeight: '500',
  },
  loginLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default SignupScreen;
