import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../components/CustomAlert';
import { auth, db } from '../utils/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const { showToastMsg, setUser } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [] as any[],
  });

  const handleRegister = async () => {
    if (isLoading) return;

    if (!name) {
      setAlertConfig({ visible: true, title: "Missing Information", message: "Please enter your name", buttons: [{ text: "OK" }] });
      return;
    }
    if (!email) {
      setAlertConfig({ visible: true, title: "Missing Information", message: "Please enter your email", buttons: [{ text: "OK" }] });
      return;
    }
    if (password.length < 6) {
      setAlertConfig({ visible: true, title: "Weak Password", message: "Password must be at least 6 characters", buttons: [{ text: "OK" }] });
      return;
    }
    if (password !== confirmPassword) {
      setAlertConfig({ visible: true, title: "Mismatch", message: "Passwords do not match", buttons: [{ text: "OK" }] });
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      
      // Save user role as participant
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: name,
        email: email,
        role: 'participant',
        createdAt: new Date()
      });

      // Logout user immediately so they can log in via LoginScreen
      await auth.signOut();
      
      setSuccessMessage('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error: any) {
      setAlertConfig({
        visible: true,
        title: "Registration Error",
        message: error.message,
        buttons: [{ text: "Try Again" }]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canRegister = name.length > 0 && email.includes('@') && password.length >= 6 && confirmPassword.length >= 6;

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
          >
            {/* Header Section */}
            <View style={styles.header}>
              <Pressable 
                style={styles.backButton} 
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </Pressable>
              <Text style={styles.appName}>Register</Text>
              <Text style={styles.welcomeText}>Create a new participant account</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.cardTitle}>Sign Up</Text>
                <Text style={styles.cardSubtitle}>Enter details to register</Text>
              </View>

              <View style={styles.inputGroup}>
                <View style={[styles.inputContainer, name && name.length > 0 && styles.inputContainerActive]}>
                  <Ionicons name="person-outline" size={20} color={colors.greyText} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#A0ABC0"
                    autoCapitalize="words"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={{ marginTop: 20 }}>
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
                </View>

                <View style={{ marginTop: 20 }}>
                  <View style={[styles.inputContainer, confirmPassword && confirmPassword.length > 0 && styles.inputContainerActive]}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.greyText} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
                      placeholderTextColor="#A0ABC0"
                      secureTextEntry={!showPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.signInBtn, 
                  (!canRegister || isLoading) && styles.signInBtnDisabled,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                ]}
                onPress={handleRegister}
                disabled={!canRegister || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.signInBtnText}>Register</Text>
                )}
              </Pressable>

              {successMessage ? (
                <Text style={styles.successText}>{successMessage}</Text>
              ) : null}
            </View>

            {/* Footer Area */}
            <View style={styles.footerContainer}>
              <Text style={styles.footer}>
                Already have an account?{' '}
                <Text style={styles.footerLink} onPress={() => navigation.goBack()}>Sign In</Text>
              </Text>
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
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
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
    marginTop: 10,
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
  successText: {
    color: colors.green,
    fontSize: typography.body,
    fontWeight: typography.bold,
    textAlign: 'center',
    marginTop: 16,
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
