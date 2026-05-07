import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, Animated,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import Constants from 'expo-constants';
import { useAppStore } from '../store/useAppStore';
import RoleToggle from '../components/RoleToggle';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../components/CustomAlert';
import { auth, db } from '../utils/firebase';
import { registerForPushNotifications, saveDistributorToken } from '../utils/notifications';
import { 
  signInWithEmailAndPassword, 
  signInAnonymously 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [] as any[],
  });

  


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
          
          // Verify role to ensure separation of Admin and Participant
          const userDocRef = doc(db, 'users', userCredential.user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          let actualRole = 'admin'; // Legacy users assume admin if no doc exists
          if (userDocSnap.exists()) {
            actualRole = userDocSnap.data().role;
          }

          if (isAdmin && actualRole !== 'admin') {
            setAlertConfig({
              visible: true,
              title: "Access Denied",
              message: "You are not an admin.",
              buttons: [{ text: "OK" }]
            });
            auth.signOut();
            setIsLoading(false);
            return;
          }

          if (isParticipant && actualRole === 'admin') {
            setAlertConfig({
              visible: true,
              title: "Access Denied",
              message: "Please use Admin login.",
              buttons: [{ text: "OK" }]
            });
            auth.signOut();
            setIsLoading(false);
            return;
          }

          setUser(userCredential.user);
          navigation.replace(isAdmin ? 'AdminDashboard' : 'SeatSelection');
        } catch (signInError: any) {
          if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
            setAlertConfig({
              visible: true,
              title: "Login Failed",
              message: "Invalid email or password. Please check your credentials.",
              buttons: [{ text: "Try Again" }]
            });
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
          setAlertConfig({
            visible: true,
            title: "Access Denied",
            message: "This phone number is not authorized. Please check the number or contact your Admin to get access.",
            buttons: [{ text: "Try Again" }]
          });
          setIsLoading(false);
          return;
        }

        // 3. Auto-Login & Route
        const assignedRow = docSnap.data()?.assignedRow || '01';
        
        const userCredential = await signInAnonymously(auth);
        setUser(userCredential.user);
        
        // Auto-set the assigned row
        setCurrentRow(assignedRow);

        const isExpoGo =
          Constants.appOwnership === 'expo' ||
          Constants.executionEnvironment === 'storeClient';
        // Register push token only outside Expo Go (SDK 53+ limitation).
        if (!isExpoGo) {
          const pushToken = await registerForPushNotifications();
          if (pushToken) {
            await saveDistributorToken(assignedRow, pushToken);
          }
        }

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
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
      <LinearGradient
        colors={[colors.primaryLight, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            automaticallyAdjustKeyboardInsets={true}
          >
            {/* Header Section */}
            <View style={styles.header}>
              <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseScale }] }]}>
                <View style={styles.iconBackground}>
                  <Ionicons name="flame" size={38} color={colors.primary} />
                </View>
              </Animated.View>
              <Text style={styles.appName}>Yagya Manager</Text>
              <Text style={styles.welcomeText}>Professional Inventory System</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.cardTitle}>Sign In</Text>
                <Text style={styles.cardSubtitle}>Choose your role to continue</Text>
              </View>

              <RoleToggle 
                activeRole={activeRole} 
                onSelect={(r) => { 
                  setRole(r); 
                  setPhone(''); 
                  setEmail('');
                  setPassword(''); 
                }} 
              />

              {isDistributor ? (
                <View style={styles.inputGroup}>
                  <View style={[styles.inputContainer, phone && phone.length > 0 && styles.inputContainerActive]}>
                    <Ionicons name="call-outline" size={20} color={colors.greyText} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Mobile Number"
                      placeholderTextColor="#A0ABC0"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={phone}
                      onChangeText={setPhone}
                    />
                    {phone.length === 10 && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.green} />
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.inputGroup}>
                  <View style={[styles.inputContainer, email && email.length > 0 && styles.inputContainerActive]}>
                    <Ionicons name="mail-outline" size={20} color={colors.greyText} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email Address"
                      placeholderTextColor="#A0ABC0"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>

                  <View style={{ marginTop: 20 }}>
                    <View style={[styles.inputContainer, password && password.length > 0 && styles.inputContainerActive]}>
                      <Ionicons name="lock-closed-outline" size={20} color={colors.greyText} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#A0ABC0"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                      />
                      <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                        <Ionicons 
                          name={showPassword ? "eye-outline" : "eye-off-outline"} 
                          size={20} 
                          color={colors.greyText} 
                        />
                      </Pressable>
                    </View>
                    <Pressable onPress={() => {}} style={{ alignSelf: 'flex-end', paddingVertical: 8 }}>
                      <Text style={styles.forgotPassword}>Forgot Password?</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.signInBtn, 
                  (!canSignIn || isLoading) && styles.signInBtnDisabled,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                ]}
                onPress={handleSignIn}
                disabled={!canSignIn || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.signInBtnText}>Sign In</Text>
                )}
              </Pressable>
            </View>

            {/* Footer Area */}
            <View style={styles.footerContainer}>
              {isParticipant ? (
                <Text style={styles.footer}>
                  Don't have an account?{' '}
                  <Text style={styles.footerLink} onPress={() => navigation.navigate('Register')}>Register</Text>
                </Text>
              ) : (
                <Text style={styles.footer}>
                  Don't have an account?{' '}
                  <Text style={styles.footerLink}>Contact Admin</Text>
                </Text>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: typography.extrabold,
    color: '#FFF',
    letterSpacing: -0.5,
  },
  welcomeText: {
    fontSize: typography.body,
    color: '#FFEEDD',
    marginTop: 6,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    paddingTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  formHeader: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: typography.h2,
    fontWeight: typography.bold,
    color: colors.navy,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: typography.body,
    color: colors.greyText,
  },
  inputGroup: {
    marginTop: 28,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 58,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputContainerActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF5F0',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.navy,
    fontWeight: typography.medium,
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPassword: {
    fontSize: typography.small,
    color: colors.primary,
    fontWeight: typography.bold,
  },
  signInBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  signInBtnDisabled: {
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  signInBtnText: {
    color: colors.white,
    fontSize: typography.h4,
    fontWeight: typography.bold,
  },
  footerContainer: {
    marginTop: 28,
    alignItems: 'center',
  },
  footer: {
    fontSize: typography.body,
    color: '#FFEEDD',     
  },
  footerLink: {
    color: '#FFFFFF',
    fontWeight: typography.bold,
  },
});
