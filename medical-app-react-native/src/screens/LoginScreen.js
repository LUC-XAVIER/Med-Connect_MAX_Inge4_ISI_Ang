import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState('patient');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const selectRole = (role) => {
    setSelectedRole(role);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrorMessage('');
  };

  const handleSubmit = () => {
    if (isSignUp) {
      handleSignUp();
    } else {
      handleLogin();
    }
  };

  const handleLogin = () => {
    if (!email || !password) {
      setErrorMessage('Please enter email and password');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    // Simulate login (no API)
    setTimeout(() => {
      setLoading(false);
      
      // Mock user data
      const user = {
        email,
        role: selectedRole,
        full_name: selectedRole === 'patient' ? 'John Doe' : 'Dr. Smith',
      };

      // Navigate based on role
      if (selectedRole === 'doctor') {
        navigation.replace('DoctorHome', { user });
      } else {
        navigation.replace('PatientHome', { user });
      }
    }, 1000);
  };

  const handleSignUp = () => {
    if (!fullName || !email || !password) {
      setErrorMessage('Please fill all fields');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    // Simulate signup (no API)
    setTimeout(() => {
      setLoading(false);
      
      const user = {
        email,
        role: selectedRole,
        full_name: fullName,
      };

      if (selectedRole === 'doctor') {
        navigation.replace('DoctorHome', { user });
      } else {
        navigation.replace('PatientHome', { user });
      }
    }, 1000);
  };

  const demoLogin = (role) => {
    setSelectedRole(role);
    setEmail(role === 'patient' ? 'patient@demo.com' : 'doctor@demo.com');
    setPassword('demo123');
    setTimeout(() => handleLogin(), 100);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.loginContent}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>⚕️</Text>
          </View>
          <Text style={styles.appTitle}>MC-System</Text>
          <Text style={styles.appSubtitle}>Medical Care Platform</Text>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            {isSignUp ? 'Create Account' : 'Welcome Back!'}
          </Text>
          <Text style={styles.welcomeSubtitle}>
            {isSignUp
              ? 'Sign up to get started with your health journey'
              : 'Sign in to continue to your account'}
          </Text>
        </View>

        {/* Error Message */}
        {errorMessage ? (
          <View style={styles.errorMessage}>
            <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
          </View>
        ) : null}

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Full Name (Sign Up Only) */}
          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Full Name"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          )}

          {/* Role Selector */}
          <View style={styles.roleSelector}>
            <Text style={styles.roleLabel}>
              {isSignUp ? 'Select Role:' : 'Login as:'}
            </Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  selectedRole === 'patient' && styles.roleButtonActive,
                ]}
                onPress={() => selectRole('patient')}
              >
                <Text style={styles.roleIcon}>👤</Text>
                <Text
                  style={[
                    styles.roleButtonText,
                    selectedRole === 'patient' && styles.roleButtonTextActive,
                  ]}
                >
                  Patient
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  selectedRole === 'doctor' && styles.roleButtonActive,
                ]}
                onPress={() => selectRole('doctor')}
              >
                <Text style={styles.roleIcon}>⚕️</Text>
                <Text
                  style={[
                    styles.roleButtonText,
                    selectedRole === 'doctor' && styles.roleButtonTextActive,
                  ]}
                >
                  Doctor
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Email Address"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={togglePasswordVisibility}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          {!isSignUp && (
            <View style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.btnSubmit, loading && styles.btnSubmitDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.btnSubmitText}>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialButtons}>
            <TouchableOpacity style={[styles.socialButton, styles.googleButton]}>
              <Text style={styles.socialButtonText}>G</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialButtonText}>🍎</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialButton, styles.facebookButton]}>
              <Text style={styles.socialButtonText}>f</Text>
            </TouchableOpacity>
          </View>

          {/* Toggle Mode */}
          <View style={styles.toggleMode}>
            <Text style={styles.toggleModeText}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <TouchableOpacity onPress={toggleMode}>
              <Text style={styles.toggleModeLink}>
                {isSignUp ? ' Sign In' : ' Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Demo Buttons */}
          <TouchableOpacity
            style={[styles.btnDemo, styles.btnDemoPatient]}
            onPress={() => demoLogin('patient')}
          >
            <Text style={styles.btnDemoText}>Demo Patient Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnDemo, styles.btnDemoDoctor]}
            onPress={() => demoLogin('doctor')}
          >
            <Text style={styles.btnDemoText}>Demo Doctor Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F3',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loginContent: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 10,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 100,
    height: 100,
    backgroundColor: '#0D9488',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 50,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
  },
  errorMessage: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  formSection: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
    fontSize: 20,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  eyeButton: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 18,
  },
  roleSelector: {
    marginBottom: 8,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#0D9488',
    borderRadius: 12,
  },
  roleButtonActive: {
    backgroundColor: '#0D9488',
  },
  roleButtonText: {
    color: '#0D9488',
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: 'white',
  },
  roleIcon: {
    fontSize: 20,
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    color: '#0D9488',
    fontSize: 14,
    fontWeight: '600',
  },
  btnSubmit: {
    width: '100%',
    padding: 16,
    backgroundColor: '#0D9488',
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSubmitDisabled: {
    opacity: 0.6,
  },
  btnSubmitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9CA3AF',
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
  googleButton: {
    color: '#DB4437',
  },
  facebookButton: {
    color: '#4267B2',
  },
  toggleMode: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleModeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  toggleModeLink: {
    fontSize: 14,
    color: '#0D9488',
    fontWeight: '600',
  },
  btnDemo: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDemoPatient: {
    backgroundColor: '#FB923C',
  },
  btnDemoDoctor: {
    backgroundColor: '#3B82F6',
  },
  btnDemoText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
