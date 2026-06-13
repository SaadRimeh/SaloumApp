import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ImageBackground, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSignIn, useAuth, useClerk } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { signIn, fetchStatus } = useSignIn();
  const { setActive } = useClerk();
  const { isSignedIn } = useAuth();
  const isLoaded = !!signIn;
  const router = useRouter();
  const isSubmitting = useRef(false);
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!isLoaded || !signIn) return;
    if (isSubmitting.current) return;
    if (isSignedIn) {
      router.replace('/(tabs)');
      return;
    }
    if (!identifier || !password) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    isSubmitting.current = true;
    setLoading(true);
    setError('');

    try {
      const res = await signIn.create({
        identifier,
        password,
      });

      if (signIn.status === 'complete') {
        if (setActive) {
          await setActive({ session: signIn.createdSessionId });
          router.replace('/(tabs)');
        } else {
          setError('حدث خطأ أثناء تفعيل الجلسة');
        }
      } else {
        console.warn('Unhandled sign in status:', signIn.status);
        setError('حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة لاحقاً');
      }
    } catch (err: any) {
      console.warn('Login error:', err);
      let errorMessage = 'فشل تسجيل الدخول. يرجى التحقق من البيانات';
      if (err.errors && err.errors[0]) {
        const code = err.errors[0].code;
        if (code === 'form_identifier_not_found') {
          errorMessage = 'الحساب غير موجود. يرجى التحقق من اسم المستخدم أو البريد الإلكتروني';
        } else if (code === 'form_password_incorrect') {
          errorMessage = 'كلمة المرور غير صحيحة';
        } else if (code === 'already_signed_in') {
          errorMessage = 'أنت مسجل الدخول بالفعل. يتم تحويلك...';
          setError(errorMessage);
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 1500);
          return;
        } else {
          errorMessage = err.errors[0].message || errorMessage;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/barbershop_bg.png')} 
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.headerContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="cut-outline" size={42} color="#C5A880" />
            </View>
            <Text style={styles.title}>صالون سلوم</Text>
            <Text style={styles.subtitle}>أهلاً بك في صالون سلوم</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>تسجيل الدخول</Text>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#FF5252" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email / Username Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>اسم المستخدم أو البريد الإلكتروني</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#C5A880" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="اسم المستخدم أو البريد"
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                  value={identifier}
                  onChangeText={setIdentifier}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>كلمة المرور</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#C5A880" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#666"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#888" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#121212" />
              ) : (
                <Text style={styles.loginButtonText}>دخول</Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>ليس لديك حساب؟ </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.registerLink}>سجل الآن</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 18, 18, 0.82)', // Dark elegant overlay
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(197, 168, 128, 0.1)',
    borderWidth: 1.5,
    borderColor: '#C5A880',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#C5A880',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#C5A880',
    marginTop: 6,
    textAlign: 'center',
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: 'rgba(30, 30, 30, 0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(197, 168, 128, 0.2)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'right',
  },
  errorContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 13,
    marginRight: 8,
    textAlign: 'right',
    flex: 1,
  },
  inputWrapper: {
    marginBottom: 18,
  },
  inputLabel: {
    color: '#A0A0A0',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: 'rgba(197, 168, 128, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'right',
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#C5A880',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#C5A880',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  loginButtonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  registerLink: {
    color: '#C5A880',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
