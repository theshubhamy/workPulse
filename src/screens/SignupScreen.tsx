import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { Colors } from '../utils/colors';
import Input from '../components/Input';
import Button from '../components/Button';
import { signUpWithEmail, signInWithGoogle } from '../firebase';
import { validate } from '../utils/validation';

type SignupNav = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

const SignupScreen = () => {
  const navigation = useNavigation<SignupNav>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const handleSignup = async () => {
    const nameErr = validate.name(name);
    const phoneErr = validate.phone(phone);
    const emailErr = validate.email(email);
    const passErr = validate.password(password);
    const confirmErr = password !== confirmPass ? 'Passwords do not match' : null;

    if (nameErr || phoneErr || emailErr || passErr || confirmErr) {
      setErrors({
        name: nameErr ?? undefined,
        phone: phoneErr ?? undefined,
        email: emailErr ?? undefined,
        password: passErr ?? undefined,
        confirmPass: confirmErr ?? undefined,
      });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await signUpWithEmail(email, password, name, phone);
      // Auth state listener in App.tsx handles navigation
    } catch (err: any) {
      let msg = 'Sign up failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered.';
      if (err.code === 'auth/invalid-email') msg = 'Invalid email address.';
      if (err.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
      Alert.alert('Sign Up Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Google Sign-In Failed', err.message ?? 'Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>⚡</Text>
          </View>
          <Text style={styles.brand}>WorkPulse</Text>
          <Text style={styles.subtitle}>Create Your Account</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Input
            label="Full Name"
            placeholder="John Smith"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
            error={errors.name}
          />
          <Input
            label="Phone Number"
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            error={errors.phone}
          />
          <Input
            label="Email Address"
            placeholder="you@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
          />
          <Input
            label="Password"
            placeholder="Minimum 8 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />
          <Input
            label="Confirm Password"
            placeholder="Re-enter your password"
            secureTextEntry
            value={confirmPass}
            onChangeText={setConfirmPass}
            error={errors.confirmPass}
          />

          <Button
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            style={styles.mainBtn}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="Continue with Google"
            onPress={handleGoogleSignIn}
            variant="ghost"
            loading={googleLoading}
            leftIcon={<Text style={styles.googleIcon}>G</Text>}
          />
        </View>

        {/* Switch to Login */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.switchLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dataNotice}>
          <Text style={styles.dataNoticeText}>
            🔒 Your name and phone are stored securely in our database and used only for your work profile.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  logoEmoji: { fontSize: 34 },
  brand: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  mainBtn: { marginTop: 8, marginBottom: 20 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginHorizontal: 12,
    fontWeight: '500',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.google,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  switchText: { color: Colors.textSecondary, fontSize: 14 },
  switchLink: {
    color: Colors.primaryLight,
    fontSize: 14,
    fontWeight: '700',
  },
  dataNotice: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  dataNoticeText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
});

export default SignupScreen;
