import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, Animated,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store/useAppStore';
import RoleToggle from '../components/RoleToggle';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Ionicons } from '@expo/vector-icons';
import SurfaceCard from '../components/SurfaceCard';
import { auth, db } from '../utils/firebase';
import { 
  signInWithEmailAndPassword, 
  signInAnonymously 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

type Role = 'distributor' | 'participant' | 'admin';



export default function LoginScreen({ navigation }: Props) {
  const { activeRole, setRole, showToastMsg, setUser, setCurrentRow } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  


  // Hardcoded for participant as per user request (prefilled)
  const isParticipant = activeRole === 'participant';
  const isAdmin = activeRole === 'admin';
  const isDistributor = activeRole === 'distributor';

  // Pulse animation for 🔥
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (isAdmin || isParticipant) {
        // ── Email/Password Login ──
        if (!email) {
          showToastMsg('Please enter your email');
          setIsLoading(false);
          return;
        }
        const pass = password || 'admin123';
        
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, pass);
          setUser(userCredential.user);
          navigation.replace(isAdmin ? 'AdminDashboard' : 'ParticipantDashboard');
        } catch (signInError: any) {
          if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
            showToastMsg('Invalid email or password. Please contact the administrator.');
          } else {
            throw signInError;
          }
        }
      } 
      else if (isDistributor) {
        // ── Distributor Login (Phone) ──
        // 1. Normalize: remove all non-digits
        const digitsOnly = phone.replace(/\D/g, '');
        const cleanPhone = digitsOnly.slice(-10);
        const fullPhone = `+91${cleanPhone}`;
        


        if (cleanPhone.length < 10) {
          showToastMsg('Please enter a valid 10-digit number');
          setIsLoading(false);
          return;
        }

        // 2. Check Firestore Authorization
        const docRef = doc(db, 'authorizedDistributors', fullPhone);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          Alert.alert(
            "Access Denied",
            "This phone number is not authorized. Please check the number or contact your Admin to get access.",
            [{ text: "Try Again" }]
          );
          setIsLoading(false);
          return;
        }


        // 3. Auto-Login & Route
        const assignedRow = docSnap.data()?.assignedRow || '01';
        
        const userCredential = await signInAnonymously(auth);
        setUser(userCredential.user);
        
        // Auto-set the assigned row and go direct
        setCurrentRow(assignedRow);
        showToastMsg(`Welcome back! Managing Row ${assignedRow}`);
        navigation.replace('Replenishment');
      } 
    } catch (error: any) {
      showToastMsg(`Login Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };



  const canSignIn = (isAdmin || isParticipant) 
    ? (email.includes('@') && password.length > 5) 
    : (isDistributor ? phone.replace(/\D/g, '').length >= 10 : true);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.headerBackground}
      >
        <SafeAreaView style={styles.headerInner}>
          <Animated.View style={[styles.fireContainer, { transform: [{ scale: pulseScale }] }]}>
            <Text style={styles.fireEmoji}>🔥</Text>
          </Animated.View>
          <Text style={styles.appName}>Yagya Manager</Text>
          <Text style={styles.welcomeText}>Professional Inventory System</Text>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SurfaceCard style={styles.loginBox}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSubtitle}>Choose your role to continue</Text>

            <RoleToggle activeRole={activeRole} onSelect={(r) => { 
              setRole(r); 
              setPhone(''); 
              setEmail('');
              setPassword(''); 
            }} />

            {isDistributor ? (
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Mobile Number</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={18} color={colors.greyText} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="10-digit mobile number"
                    placeholderTextColor={colors.greyText}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                  />
                  {phone.length === 10 && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.green} />
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Account Details</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={18} color={colors.greyText} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor={colors.greyText}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View style={[styles.inputContainer, { marginTop: 12 }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.greyText} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Account password"
                    placeholderTextColor={colors.greyText}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                    <Ionicons 
                      name={showPassword ? "eye" : "eye-off"} 
                      size={18} 
                      color={colors.greyText} 
                    />
                  </Pressable>
                </View>
                <Pressable onPress={() => {}}>
                  <Text style={styles.forgotPassword}>Forgot Password?</Text>
                </Pressable>
              </View>
            )}

            <Pressable
              style={[styles.signInBtn, (!canSignIn || isLoading) && styles.signInBtnDisabled]}
              onPress={handleSignIn}
              disabled={!canSignIn || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.signInBtnText}>Sign In</Text>
              )}
            </Pressable>

            <Text style={styles.footer}>
              Don't have an account?{' '}
              <Text style={styles.footerLink}>Contact Admin</Text>
            </Text>
          </SurfaceCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerBackground: {
    height: 280,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInner: {
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    marginTop: -40,
    paddingBottom: 40,
  },
  fireContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 12,
  },
  fireEmoji: {
    fontSize: 40,
  },
  appName: {
    fontSize: typography.h1,
    fontWeight: typography.bold,
    color: colors.white,
    letterSpacing: -0.5,
  },
  welcomeText: {
    fontSize: typography.subtitle,
    color: colors.white,
    opacity: 0.9,
    marginTop: 4,
  },
  loginBox: {
    marginHorizontal: 24,
    padding: 24,
    gap: 20,
  },
  cardTitle: {
    fontSize: typography.h2,
    fontWeight: typography.bold,
    color: colors.navy,
  },
  cardSubtitle: {
    fontSize: typography.body,
    color: colors.greyText,
    marginTop: -16,
  },
  inputGroup: {
    gap: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: typography.bold,
    color: colors.greyText,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.navy,
    fontWeight: typography.semibold,
  },
  forgotPassword: {
    textAlign: 'right',
    fontSize: typography.small,
    color: colors.primary,
    fontWeight: typography.semibold,
    marginTop: 4,
  },
  signInBtn: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  signInBtnDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  signInBtnText: {
    color: colors.white,
    fontSize: typography.h4,
    fontWeight: typography.bold,
    letterSpacing: 0.5,
  },
  footer: {
    textAlign: 'center',
    fontSize: typography.small,
    color: colors.greyText,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: typography.bold,
  },
});
