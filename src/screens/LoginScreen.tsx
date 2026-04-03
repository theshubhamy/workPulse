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
  Linking,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../utils/colors';
import Input from '../components/Input';
import Button from '../components/Button';
import { signInWithEmail, signInWithGoogle } from '../firebase';
import { toast } from '../utils/toast';
import { validate } from '../utils/validation';
import { AuthStackParamList } from '../navigation/AuthNavigator';

type LoginNav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen = () => {
  const navigation = useNavigation<LoginNav>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    const emailErr = validate.email(email);
    const passErr = validate.password(password);
    if (emailErr || passErr) {
      setErrors({ email: emailErr ?? undefined, password: passErr ?? undefined });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      let msg = 'Login failed. Please check your credentials.';
      if (err.code === 'auth/user-not-found') msg = 'No account found with this email.';
      if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
      if (err.code === 'auth/invalid-email') msg = 'Invalid email address.';
      if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
      if (err.code === 'auth/invalid-credential') msg = 'Incorrect email or password.';
      toast.error('Login Failed', msg);
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
        toast.error('Google Sign-In Failed', err.message ?? 'Please try again.');
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
          <Text style={styles.tagline}>Track. Attend. Perform.</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSub}>Sign in to your account</Text>

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
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />

          <TouchableOpacity style={styles.forgotRow}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
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

        {/* Switch to Signup */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.switchLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.link} onPress={() => Linking.openURL('https://workpulse.app/terms')}>
            Terms
          </Text>{' '}
          &{' '}
          <Text style={styles.link} onPress={() => Linking.openURL('https://workpulse.app/privacy')}>
            Privacy Policy
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
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
  tagline: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSub: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 24,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -8,
  },
  forgotText: {
    color: Colors.primaryLight,
    fontSize: 13,
    fontWeight: '600',
  },
  mainBtn: {
    marginTop: 8,
    marginBottom: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
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
  },
  switchText: { color: Colors.textSecondary, fontSize: 14 },
  switchLink: {
    color: Colors.primaryLight,
    fontSize: 14,
    fontWeight: '700',
  },
  terms: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: Colors.primaryLight,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
