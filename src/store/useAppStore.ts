import { create } from 'zustand';
import { InventoryItem, AdminRequest, CORE_ITEMS, INITIAL_REQUESTS, ExtraItem, EXTRA_ITEMS } from '../data/inventoryData';
import { formatTime } from '../utils/statusHelpers';
import { auth, db } from '../utils/firebase';
import { signOut as firebaseSignOut, User } from 'firebase/auth';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

type Role = 'distributor' | 'participant' | 'admin';

interface AppState {
  // Auth
  activeRole: Role;
  user: User | null; // Firebase user
  isSigningIn: boolean;
  currentRow: string | null;
  authorizedPhoneNumbers: Array<{ phone: string, assignedRow: string }>; // For Admin view list

  // Inventory
  items: InventoryItem[];

  // Admin
  adminRequests: AdminRequest[];

  // Refill sheet
  showWarehouseSheet: boolean;
  requestItems: number[];

  // Add item sheet
  showAddSheet: boolean;
  selectedExtraItems: number[];

  // UI
  btnPulse: boolean;
  showToast: boolean;
  toastMsg: string;

  // Actions
  setRole: (role: Role) => void;
  setSigningIn: (v: boolean) => void;
  setCurrentRow: (row: string) => void;
  signOut: () => void;

  openWarehouseSheet: () => void;
  closeWarehouseSheet: () => void;
  toggleRequestItem: (id: number) => void;
  submitRefillRequest: () => void;

  openAddSheet: () => void;
  closeAddSheet: () => void;
  toggleExtraItem: (id: number) => void;
  submitPushItems: () => void;

  acknowledgeRequest: (id: string) => void;
  dispatchRequest: (id: string) => void;
  approveRequest: (id: string) => void;

  showToastMsg: (msg: string) => void;

  // Firebase Auth additions
  setUser: (user: User | null) => void;
  addAuthorizedDistributor: (phone: string, assignedRow: string) => Promise<void>;
  removeAuthorizedDistributor: (phone: string) => Promise<void>;
  setAuthorizedNumbers: (numbers: Array<{ phone: string, assignedRow: string }>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeRole: 'distributor',
  user: null,
  isSigningIn: false,
  currentRow: null,
  authorizedPhoneNumbers: [],

  items: [...CORE_ITEMS],
  adminRequests: [],

  showWarehouseSheet: false,
  requestItems: [],

  showAddSheet: false,
  selectedExtraItems: [],

  btnPulse: false,
  showToast: false,
  toastMsg: '',

  setRole: (role) => set({ activeRole: role }),
  setUser: (user) => set({ user }),
  setSigningIn: (v) => set({ isSigningIn: v }),
  setCurrentRow: (row) => set({ currentRow: row }),
  setAuthorizedNumbers: (numbers) => set({ authorizedPhoneNumbers: numbers }),

  signOut: async () => {
    await firebaseSignOut(auth);
    set({ user: null, activeRole: 'distributor', currentRow: null, items: [...CORE_ITEMS] });
  },

  addAuthorizedDistributor: async (phone: string, assignedRow: string) => {
    try {
      await setDoc(doc(db, 'authorizedDistributors', phone), {
        phoneNumber: phone,
        assignedRow: assignedRow,
        addedAt: new Date().toISOString()
      });
      get().showToastMsg(`Authorized ${phone} for Row ${assignedRow}`);
    } catch (error: any) {
      get().showToastMsg(`Error: ${error.message}`);
    }
  },

  removeAuthorizedDistributor: async (phone: string) => {
    try {
      await deleteDoc(doc(db, 'authorizedDistributors', phone));
      get().showToastMsg(`Removed ${phone}`);
    } catch (error: any) {
      get().showToastMsg(`Error: ${error.message}`);
    }
  },

  // Refill sheet
  openWarehouseSheet: () => set({ showWarehouseSheet: true, requestItems: [] }),
  closeWarehouseSheet: () => set({ showWarehouseSheet: false, requestItems: [] }),
  toggleRequestItem: (id) => set((s) => ({
    requestItems: s.requestItems.includes(id)
      ? s.requestItems.filter(i => i !== id)
      : [...s.requestItems, id],
  })),
  submitRefillRequest: () => {
    const { requestItems, items, currentRow } = get();
    const selectedNames = items
      .filter(i => requestItems.includes(i.id))
      .map(i => i.name)
      .join(', ');
    const newReq: AdminRequest = {
      id: Date.now().toString(),
      row: currentRow ?? '01',
      time: formatTime(),
      items: selectedNames,
      status: 'pending',
    };
    set((s) => ({
      adminRequests: [newReq, ...s.adminRequests],
      showWarehouseSheet: false,
      requestItems: [],
      toastMsg: `Requested ${requestItems.length} item${requestItems.length !== 1 ? 's' : ''} from Admin`,
      showToast: true,
    }));
    setTimeout(() => set({ showToast: false }), 3000);
  },

  // Add item sheet
  openAddSheet: () => set({ showAddSheet: true, selectedExtraItems: [] }),
  closeAddSheet: () => set({ showAddSheet: false, selectedExtraItems: [] }),
  toggleExtraItem: (id) => set((s) => ({
    selectedExtraItems: s.selectedExtraItems.includes(id)
      ? s.selectedExtraItems.filter(i => i !== id)
      : [...s.selectedExtraItems, id],
  })),
  submitPushItems: () => {
    const { selectedExtraItems, items } = get();
    const existingIds = new Set(items.map(i => i.id));
    const toAdd: InventoryItem[] = EXTRA_ITEMS
      .filter((e: ExtraItem) => selectedExtraItems.includes(e.id) && !existingIds.has(e.id))
      .map((e: ExtraItem) => ({
        id: e.id,
        name: e.name,
        qty: `5 ${e.unit}`,
        rawQty: 5,
        status: 'OK' as const,
        icon: e.icon,
        unit: e.unit,
        step: e.step,
      }));
    const count = selectedExtraItems.length;
    set((s) => ({
      items: [...s.items, ...toAdd],
      showAddSheet: false,
      selectedExtraItems: [],
      toastMsg: `Pushed ${count} item${count !== 1 ? 's' : ''} to distributors`,
      showToast: true,
    }));
    setTimeout(() => set({ showToast: false }), 3000);
  },

  // Admin Actions (ACK / DISPATCH)
  acknowledgeRequest: (id) => {
    const req = get().adminRequests.find(r => r.id === id);
    set((s) => ({
      adminRequests: s.adminRequests.map(r =>
        r.id === id ? { ...r, status: 'acknowledged' } : r
      ),
      toastMsg: `Acknowledge: Row ${req?.row}'s request is seen!`,
      showToast: true,
    }));
    setTimeout(() => set({ showToast: false }), 3000);
  },

  dispatchRequest: (id) => {
    const req = get().adminRequests.find(r => r.id === id);
    set((s) => ({
      adminRequests: s.adminRequests.map(r =>
        r.id === id ? { ...r, status: 'dispatched' } : r
      ),
      toastMsg: `Dispatched stock to Row ${req?.row}!`,
      showToast: true,
    }));
    setTimeout(() => set({ showToast: false }), 3000);
  },

  approveRequest: (id) => get().dispatchRequest(id),

  showToastMsg: (msg) => {
    set({ toastMsg: msg, showToast: true });
    setTimeout(() => set({ showToast: false }), 3000);
  },
}));
