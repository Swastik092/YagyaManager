import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Modal, TextInput, FlatList, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store/useAppStore';
import AdminRequestCard from '../components/AdminRequestCard';
import GlobalWarehouseSheet from '../components/GlobalWarehouseSheet';
import Toast from '../components/Toast';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Ionicons } from '@expo/vector-icons';
import ConfirmationModal from '../components/ConfirmationModal';
import { db } from '../utils/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import * as Contacts from 'expo-contacts';
import SurfaceCard from '../components/SurfaceCard';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AdminDashboard'>;
};

export default function AdminDashboardScreen({ navigation }: Props) {
  const { 
    adminRequests, openAddSheet, signOut, 
    addAuthorizedDistributor, removeAuthorizedDistributor, 
    authorizedPhoneNumbers, setAuthorizedNumbers, showToastMsg 
  } = useAppStore();

  const [showUserModal, setShowUserModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newRow, setNewRow] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Custom Delete Modal State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [phoneToDelete, setPhoneToDelete] = useState('');

  // Sync authorized numbers from Firestore
  useEffect(() => {
    const q = query(collection(db, 'authorizedDistributors'), orderBy('addedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const numbers = snapshot.docs.map(doc => ({
        phone: doc.id,
        assignedRow: doc.data().assignedRow || '01'
      }));
      setAuthorizedNumbers(numbers);
    });
    return () => unsubscribe();
  }, []);

  const handleAddPhone = async () => {
    // 1. Normalize: remove all non-digits
    const digitsOnly = newPhone.replace(/\D/g, '');
    
    if (digitsOnly.length < 10) {
      showToastMsg('Please enter a valid 10-digit number');
      return;
    }

    setIsAdding(true);
    // 2. Format to +91XXXXXXXXXX
    const cleanPhone = digitsOnly.slice(-10);
    const fullPhone = `+91${cleanPhone}`;
    
    await addAuthorizedDistributor(fullPhone, newRow || '01');
    setNewPhone('');
    setNewRow('');
    setIsAdding(false);
  };

  const handlePickContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        showToastMsg('Permission to access contacts was denied');
        return;
      }

      const contact = await Contacts.presentContactPickerAsync();
      
      if (contact && contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        // Take the first mobile number
        const rawPhone = contact.phoneNumbers[0].number || '';
        const digitsOnly = rawPhone.replace(/\D/g, '');
        
        if (digitsOnly.length < 10) {
          showToastMsg('Selected contact has an invalid phone number');
          return;
        }

        const cleanPhone = digitsOnly.slice(-10);
        const fullPhone = `+91${cleanPhone}`;
        
        setIsAdding(true);
        await addAuthorizedDistributor(fullPhone, newRow || '01');
        setIsAdding(false);
        setNewRow('');
      }
    } catch (error: any) {
      if (error.message !== 'User cancelled the contact picker') {
        showToastMsg(`Contact Error: ${error.message}`);
      }
    } finally {
      setIsAdding(false);
    }
  };

  const openDeleteModal = (phone: string) => {
    setPhoneToDelete(phone);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = () => {
    removeAuthorizedDistributor(phoneToDelete);
    setDeleteModalVisible(false);
  };

  const pendingCount = adminRequests.filter((r) => r.status === 'pending').length;
  const isAcknowledged = (r: any) => r.status === 'acknowledged';
  const ackCount = adminRequests.filter(isAcknowledged).length;

  const handleSignOut = () => {
    signOut();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      {/* Premium Dark Header */}
      <LinearGradient
        colors={[colors.navy, colors.navyLight]}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          {/* Row 1: App Identity & Auth */}
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.logoBadge}>
                <Ionicons name="flash" size={14} color={colors.white} />
              </View>
              <Text style={styles.headerTitle} numberOfLines={1}>Fulfillment Center</Text>
            </View>
            <Pressable 
              style={styles.signOutBtn} 
              onPress={() => {
                handleSignOut();
              }}
            >
              <Ionicons name="log-out-outline" size={14} color={colors.navy} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </View>

          {/* Row 2: Live Analytics Tiles */}
          <View style={styles.analyticsRow}>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{adminRequests.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statTile, styles.statTileActive]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={[styles.statValue, { color: colors.green }]}>{ackCount}</Text>
              <Text style={styles.statLabel}>In Transit</Text>
            </View>
          </View>

          {/* Row 3: Main Actions */}
          <View style={styles.headerActions}>
            <Pressable 
              style={styles.addItemBtn} 
              onPress={() => {
                setShowUserModal(true);
              }}
            >
              <Ionicons name="people" size={16} color={colors.white} />
              <Text style={styles.addItemText}>Manage Users</Text>
            </Pressable>
            <Pressable 
              style={styles.addItemBtn} 
              onPress={() => {
                openAddSheet();
              }}
            >
              <Ionicons name="cube" size={16} color={colors.white} />
              <Text style={styles.addItemText}>Stock Control</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Request List */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Refill Requests</Text>

        {adminRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No pending requests.</Text>
          </View>
        ) : (
          adminRequests.map((req, idx) => (
            <AdminRequestCard key={req.id} request={req} index={idx} />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <GlobalWarehouseSheet />
      <Toast />

      {/* Authorized Distributors Modal */}
      <Modal visible={showUserModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Grabber Handle for modern look */}
            <View style={styles.modalGrabber} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Manage Users</Text>
                <Text style={styles.modalSubtitle}>Authorize line distributors by phone</Text>
              </View>
              <Pressable 
                onPress={() => setShowUserModal(false)}
                style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
              >
                <Ionicons name="close" size={24} color={colors.navy} />
              </Pressable>
            </View>

            <View style={styles.addSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.prefixContainer}>
                    <Text style={styles.prefix}>+91</Text>
                  </View>
                  <TextInput
                    placeholder="Enter 10-digit number"
                    style={styles.modalInput}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={newPhone}
                    onChangeText={setNewPhone}
                    placeholderTextColor={colors.greyText}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Assigned Row</Text>
                <View style={styles.rowInputWrapperFull}>
                  <Ionicons name="grid-outline" size={18} color={colors.primary} style={{ marginRight: 10 }} />
                  <TextInput
                    placeholder="e.g. 07"
                    style={styles.rowInputFull}
                    keyboardType="numeric"
                    maxLength={2}
                    value={newRow}
                    onChangeText={setNewRow}
                    placeholderTextColor={colors.greyText}
                  />
                </View>
              </View>

              <View style={styles.actionRow}>
                <Pressable 
                  onPress={handlePickContact}
                  style={({ pressed }) => [
                    styles.contactPickerBtnFull,
                    pressed && { transform: [{ scale: 0.98 }], backgroundColor: colors.greyLight }
                  ]}
                  disabled={isAdding}
                >
                  <Ionicons name="journal-outline" size={20} color={colors.primary} />
                  <Text style={styles.contactPickerText}>Import from Contacts</Text>
                </Pressable>

                <Pressable 
                  onPress={handleAddPhone}
                  style={({ pressed }) => [
                    styles.fullAddBtn, 
                    (newPhone.length < 10 || isAdding) && { opacity: 0.5 },
                    pressed && { transform: [{ scale: 0.98 }] }
                  ]}
                  disabled={newPhone.length < 10 || isAdding}
                >
                  {isAdding ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={20} color="#fff" />
                      <Text style={styles.fullAddBtnText}>Authorize Access</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>

            <View style={styles.listHeader}>
              <Text style={styles.listLabel}>Active Distributors</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{authorizedPhoneNumbers.length}</Text>
              </View>
            </View>
            
            <FlatList
              data={authorizedPhoneNumbers}
              keyExtractor={item => item.phone}
              renderItem={({ item }) => (
                <View style={styles.userCard}>
                  <View style={styles.userCardLeft}>
                    <View style={styles.userIconCircle}>
                      <Ionicons name="person" size={18} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={styles.userPhone}>{item.phone}</Text>
                      <Text style={styles.userRowLabel}>Assigned to Row {item.assignedRow}</Text>
                    </View>
                  </View>
                  <Pressable 
                    onPress={() => openDeleteModal(item.phone)}
                    style={({ pressed }) => [styles.deleteBtn, pressed && { backgroundColor: 'rgba(255,0,0,0.1)' }]}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.red} />
                  </Pressable>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyListWrap}>
                  <View style={styles.emptyListIconBox}>
                    <Ionicons name="people-outline" size={40} color={colors.greyText} opacity={0.5} />
                  </View>
                  <Text style={styles.emptyListTitle}>No Authorized Users</Text>
                  <Text style={styles.emptyListSub}>Add a distributor's 10-digit number above to grant them access.</Text>
                </View>
              }
              style={styles.userList}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      <ConfirmationModal
        visible={deleteModalVisible}
        title="Remove Distributor"
        message={`Are you sure you want to remove ${phoneToDelete}? They will no longer be able to access the dashboard.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.h3,
    fontWeight: typography.bold,
    color: colors.white,
  },
  analyticsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  statTile: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  statTileActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statValue: {
    fontSize: typography.h2,
    fontWeight: typography.extrabold,
    color: colors.white,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  addItemBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    height: 44,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  addItemText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: typography.bold,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 4,
  },
  signOutText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: typography.bold,
  },
  body: { flex: 1 },
  bodyContent: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: typography.h3,
    fontWeight: typography.bold,
    color: colors.navy,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: typography.subtitle,
    color: colors.greyText,
    fontWeight: typography.semibold,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  modalGrabber: {
    width: 40,
    height: 5,
    backgroundColor: colors.greyLight,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: typography.extrabold,
    color: colors.navy,
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.greyText,
    marginTop: 2,
    fontWeight: typography.medium,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.greyLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: typography.bold,
    color: colors.navy,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.6,
  },
  addSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: typography.bold,
    color: colors.greyText,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingLeft: 4,
    height: 56,
    borderWidth: 1.5,
    borderColor: colors.greyLight,
  },
  prefixContainer: {
    backgroundColor: colors.greyLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    margin: 4,
  },
  prefix: {
    fontSize: 14,
    fontWeight: typography.bold,
    color: colors.navy,
  },
  rowInputWrapperFull: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.greyLight,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  rowInputFull: {
    flex: 1,
    fontSize: 16,
    fontWeight: typography.bold,
    color: colors.navy,
  },
  modalInput: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: colors.navy,
    fontWeight: typography.bold,
    paddingHorizontal: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  contactPickerBtnFull: {
    flex: 1,
    height: 56,
    backgroundColor: colors.white,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.greyLight,
  },
  contactPickerText: {
    fontSize: 14,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  fullAddBtn: {
    flex: 1.5,
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  fullAddBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: typography.bold,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.greyLight,
  },
  listLabel: {
    fontSize: 14,
    fontWeight: typography.bold,
    color: colors.navy,
  },
  countBadge: {
    backgroundColor: colors.navy,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: typography.bold,
  },
  userList: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.greyLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,107,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPhone: {
    fontSize: 15,
    fontWeight: typography.bold,
    color: colors.navy,
  },
  userRowLabel: {
    fontSize: 11,
    color: colors.greyText,
    marginTop: 1,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListWrap: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 32,
  },
  emptyListIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.greyLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyListTitle: {
    fontSize: 18,
    fontWeight: typography.bold,
    color: colors.navy,
    marginBottom: 8,
  },
  emptyListSub: {
    fontSize: 14,
    color: colors.greyText,
    textAlign: 'center',
    lineHeight: 20,
  },
});
