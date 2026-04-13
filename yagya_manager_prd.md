# Yagya Manager — Product Requirements Document (PRD)
**Version:** 1.0  
**Platform Target:** React Native + Expo (iOS & Android)  
**App Purpose:** A real-time mobile inventory management system for Havan/Yagya events. Manages the distribution and replenishment of Havan ritual items across seating rows, with dedicated interfaces for three roles: Line Distributor, Participant, and Admin.

---

## 1. Overview

### 1.1 Problem Statement
Large-scale Havan (fire ritual) events require continuous distribution of multiple ritual items (Havan Samagri, Ghee, Wood, etc.) to many rows of participants simultaneously. There is currently no efficient way for line distributors to track stock levels, request replenishments, or for Admins to monitor and fulfill those requests from a central warehouse.

### 1.2 Solution
Yagya Manager is a role-based mobile application connecting three stakeholders:
- **Line Distributors** — know which row they manage, can request item refills from the Admin.
- **Warehouse Admin** — oversees all incoming refill requests, approves/dispatches them, and can push supplementary items to distributors.
- **Participants** — event attendees who can view event information and details (dashboard placeholder; features to be defined).

---

## 2. User Roles & Access

| Role | Alias in App | What They Do |
|------|-------------|-------------|
| **Line Distributor** | `distributor` | Selects assigned row → Views replenishment screen → Requests item refills from admin |
| **Participant** | `participant` | Logs in to a personal dashboard (for event info, seat details, etc.) |
| **Admin** | `admin` | Manages all refill requests → Approves & dispatches → Pushes extra items to distributors |

---

## 3. Navigation Architecture

The app is entirely **stack-based** with no persistent bottom tab bar. All navigation is managed as sequential "scenes":

```
Scene 1: Splash Screen (auto-advances to Login after 2.5s)
    │
    ▼
Scene 2: Login Screen (role selection → sign in)
    │
    ├──[Distributor]──► Scene 3: Select Your Row
    │                        │
    │                        ▼
    │                   Scene 4: Replenishment Screen
    │                        │ (opens bottom sheet overlay)
    │                        └──► Refill Request Sheet (modal overlay)
    │
    ├──[Participant]──► Scene 8: Participant Dashboard
    │
    └──[Admin]────────► Scene 6: Warehouse Admin Dashboard
                             │ (opens bottom sheet overlay)
                             └──► Global Warehouse Items Sheet (modal overlay)
```

> [!NOTE]
> Scene numbering is not sequential in the current build. Scene 5 and 7 exist as unused/legacy stubs. In the React Native rebuild, use a proper stack navigator and screen names instead of numeric IDs.

---

## 4. Design System

### 4.1 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` / orange | `#FF6B00` | CTAs, active states, headers |
| `primary-dark` / orange gradient end | `#FF8C00` | Gradient backgrounds |
| `navy` | `#1A1A2E` | Body text, card text, buttons |
| `green` | `#2ECC71` | OK status, success toasts, fulfilled badges |
| `yellow` | `#F39C12` | Low status indicator |
| `red` | `#E74C3C` | Urgent status indicator |
| `bg` | `#F8F4F0` | Screen background (warm off-white) |
| `white` | `#FFFFFF` | Cards, sheets, inputs |
| `grey-text` | `#8E8E93` | Placeholder text, secondary labels |
| `grey-light` | `#F2F2F7` | Input backgrounds, dividers, row backgrounds |

### 4.2 Typography

- **Font Family:** `Inter` (Google Fonts)
- **Weights used:** 400 (regular), 600 (semibold), 700 (bold), 800 (extrabold)

| Element | Size | Weight |
|---------|------|--------|
| Screen title (h1) | 32sp | 800 |
| Section header (h2) | 24sp | 700 |
| Card title (h3) | 18sp | 700 |
| Subtitle | 16sp | 400 |
| Body text | 15sp | 400–600 |
| Small / label | 13sp | 600 |

### 4.3 Spacing & Radius

- **Standard card border radius:** 14dp
- **Button border radius:** 12dp (standard), 30dp (pill-style CTA)
- **Bottom sheet border radius (top corners):** 24dp
- **Screen padding:** 24dp horizontal

### 4.4 Gradient Backgrounds

Orange screens use: `linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%)`  
In React Native: `<LinearGradient colors={['#FF6B00', '#FF8C00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>`

### 4.5 Shadows

- **Cards:** `shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 3`
- **Header bar:** `shadowColor: 'rgba(255,107,0)', shadowOpacity: 0.2, shadowRadius: 20`
- **Buttons:** `shadowColor: 'rgba(255, 107, 0)', shadowOpacity: 0.3, shadowRadius: 20`
- **Toast:** `shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 30`

---

## 5. Data Models

### 5.1 Inventory Item

```typescript
type ItemStatus = 'OK' | 'Low' | 'Urgent';

interface InventoryItem {
  id: number;
  name: string;
  qty: string;       // display string, e.g. "850g" or "18 pcs"
  rawQty: number;    // numeric value for computation
  status: ItemStatus;
  icon: string;      // emoji icon
  unit: string;      // 'g' | 'L' | 'pcs' | 'pkts' | 'kg'
  step: number;      // increment/decrement unit
}
```

**Status Thresholds (derived from step):**
- `Urgent` if `rawQty <= step * 3`
- `Low` if `rawQty <= step * 6`
- `OK` otherwise

### 5.2 Core Inventory (Distributor's Active List)

| ID | Name | Default Qty | Unit | Step | Status |
|----|------|-------------|------|------|--------|
| 1 | Havan Samagri Mix | 850g | g | 50 | OK |
| 2 | Ghee | 1.2L | L | 0.1 | OK |
| 3 | Wood (Samidha) | 18 pcs | pcs | 1 | Low |
| 4 | Camphor (Kapoor) | 24 pcs | pcs | 1 | OK |
| 5 | Cow Dung Cakes | 6 pcs | pcs | 1 | Urgent |
| 6 | Rice (Akshat) | 400g | g | 50 | Low |
| 7 | Jaggery (Gud) | 300g | g | 50 | OK |
| 8 | Til (Sesame Seeds) | 180g | g | 50 | Urgent |
| 9 | Barley (Jau) | 220g | g | 50 | Low |

**Emoji icons in order:** 🌿, 🧈, 🪵, 🕯, 🟤, 🍚, 🍬, 🌾, 🌾

### 5.3 Extra / Supplementary Admin Items

These are the Admin's warehouse items that can be pushed to distributors on demand. They are NOT in the distributor's list by default.

| ID | Name | Unit | Step | Icon |
|----|------|------|------|------|
| 101 | Flowers & Garlands | pcs | 5 | 🌸 |
| 102 | Haldi & Kumkum | g | 50 | 🏵 |
| 103 | Chandan | g | 20 | 🪵 |
| 104 | Dhoop / Agarbatti | pkts | 1 | 💨 |
| 105 | Diya | pcs | 2 | 🪔 |
| 106 | Fruits & sweets | kg | 0.5 | 🍎 |
| 107 | Coconut (nariyal) | pcs | 1 | 🥥 |
| 108 | Betel leaves & supari | pcs | 10 | 🍃 |
| 109 | Dry fruits | kg | 0.1 | 🥜 |
| 110 | Honey | g | 50 | 🍯 |
| 111 | Milk / curd | L | 0.5 | 🥛 |

### 5.4 Admin Request

```typescript
type RequestStatus = 'pending' | 'fulfilled';

interface AdminRequest {
  id: string;          // Date.now().toString()
  row: string;         // e.g. '07', '12'
  time: string;        // e.g. '10:42 AM' (locale time string)
  items: string;       // comma-separated item names
  status: RequestStatus;
}
```

**Pre-seeded demo requests:**
```
{ id: '1', row: '07', time: '10:42 AM', items: 'Ghee', status: 'pending' }
{ id: '2', row: '12', time: '10:15 AM', items: 'Wood (Samidha), Camphor (Kapoor)', status: 'pending' }
{ id: '3', row: '14', time: '09:30 AM', items: 'Havan Samagri Mix', status: 'fulfilled' }
{ id: '4', row: '02', time: '09:12 AM', items: 'Til (Sesame Seeds), Barley (Jau)', status: 'fulfilled' }
```

### 5.5 Row Data

- Total rows: **15** (ROW 01 through ROW 15)
- Each row has a color border based on column group:

| Color | Row Numbers |
|-------|-------------|
| Green (`#2ECC71`) | 1, 4, 7, 10, 13 |
| Yellow (`#F39C12`) | 2, 5, 8, 11, 14 |
| Red (`#E74C3C`) | 3, 6, 9, 12, 15 |

---

## 6. Screen Specifications

### 6.1 Scene 1 — Splash Screen

**Purpose:** App launch branding screen. Auto-advances to Login after 2,500ms.

**Layout:**
- Full screen with orange gradient background
- Centered vertically and horizontally
- 🔥 icon inside a 100×100 circular container (white border 2px, `rgba(255,255,255,0.1)` fill)
- App name `"Yagya Manager"` (h1 style, white, letterSpacing: -1)
- Subtitle `"Havan Inventory System"` below the title (white, opacity 0.9)

**Animations (React Native Reanimated / Animated):**
1. Icon: spring scale from 0 → 1 (delay: 200ms, bounce)
2. Title: fade+slide up from y+20 → 0 (delay: 1000ms)
3. Subtitle: fade in (delay: 1500ms)
4. Auto-navigate after 2500ms

---

### 6.2 Scene 2 — Login Screen

**Purpose:** Role selection and sign-in entry point.

**Layout:**
- **Top 45% of screen:** Orange gradient banner
  - Pulsing 🔥 icon (scale + glow animation, loops infinitely with 2s duration)
  - App name `"Yagya Manager"` (h1)
  - Subtitle `"Welcome Back"`
- **Bottom 55%:** White card panel (rounded top corners: 36dp, overlaps orange area by ~40dp, z-index above header)

**Card Content:**
1. **Role Toggle Pill** — 3-option animated pill selector:
   - Options: `Distributor` | `Participant` | `Admin`
   - Active option: white background pill slides with spring animation, orange text
   - Inactive: grey text, transparent
   - Background: `#F2F2F7` (grey-light), padding: 6dp, border-radius: 36dp

2. **Email Input:**
   - Mail icon on the left (inside input, not outside)
   - `readOnly` / prefilled based on active role:
     - Distributor: `distributer3@yagya.app`
     - Participant: `user@yagya.app`
     - Admin: `admin@yagya.app`
   - Style: grey-light background, no border, 12dp border-radius

3. **Password Input:**
   - Lock icon on the left
   - Pre-filled: `••••••••`
   - `"Forgot Password?"` text link right-aligned below (orange, 13sp)

4. **Sign In Button:**
   - Full-width, orange, pill-rounded (18dp padding)
   - Loading state: spinning circle replaces text (white border, transparent top)
   - Simulated 1000ms delay before navigation

5. **Footer text:** `"Don't have an account? Contact Admin"` — "Contact Admin" is orange and tappable

---

### 6.3 Scene 3 — Select Your Row (Distributor only)

**Purpose:** Distributor selects their assigned row to begin session.

**Layout:**
- **Header:** Orange bar (paddingTop: 60dp for status bar safe area)
  - Title: `"Select Your Row"` (h1 style)
  - Subtitle: `"Anand • Line Distributer"` (in production: logged-in user name + role)
  - `"Sign Out"` pill button in top-right corner (navigates back to Login)
- **Body:** Scrollable area with instructions and grid

**Row Grid:**
- 3-column grid, 16dp gap
- Each row card: 90dp height, white background, 14dp border-radius
- Bottom border: 4dp solid in row's color group (green / yellow / red)
- Text: `"ROW 01"` through `"ROW 15"` (formatted with leading zero: `num.padStart(2, '0')`)
- **On tap:**
  1. Card scales down to 0.95 (spring animation, 400ms)
  2. Bottom toast appears: `"Row {N} Selected!"`
  3. Navigation to Scene 4 (Replenishment)

---

### 6.4 Scene 4 — Replenishment Screen (Distributor only)

**Purpose:** Central hub for the distributor to request stock refills.

**Layout:**
- **Header:** Orange bar with rounded bottom corners (borderBottomLeftRadius: 32, borderBottomRightRadius: 32, shadow)
  - Back arrow (←) navigates to Scene 3
  - Title: `"Replenishment"`
- **Body:** Centered content (flex: 1, centered)
  - Large circular icon area (120×120, orange tint background, `rgba(255,107,0,0.1)`)
    - Contains: 📦+ (PackagePlus icon, 48dp, orange)
    - Entrance animation: spring scale from 0.8 → 1 (delay: 200ms)
  - Subtext: `"want to replenish the stock?"` (grey, 16sp, 500 weight)
    - Entrance: fade+slide up (delay: 400ms)
  - **"Request refill" Button:**
    - Full width, pill-shape (30dp radius), orange with strong shadow
    - Icon: 📦+ (24dp) on the left
    - Font: 18sp, bold 700
    - Entrance: fade+slide up (delay: 500ms)
    - On tap: Opens **Refill Request Bottom Sheet**

**Refill Request Bottom Sheet (Modal Overlay):**
- Animated slide up from bottom, dark scrim behind
- Height: 75% of screen, scrollable
- Pull-to-dismiss bar (40×4dp, grey, centered at top)
- Title: `"Refill Request"`
- Subtitle: `"Select items that need to be restocked."`
- **Item Checklist:**
  - Lists all current distributor items
  - Each row: icon + item name (no quantity or status shown)
  - Tap to toggle selection: checkbox icon (CheckSquare / Square) on right
  - Selected: orange border + light orange background + orange checkbox
  - Unselected: grey border + white background + grey square
  - Opening the sheet: **all items start unchecked** (no pre-selection)
- **"Refill from admin (N items)" Button:**
  - Disabled until at least 1 item is selected
  - On submit → 800ms delay → sheet closes → request added to Admin's queue → toast: `"Requested N items from Admin"`
  - Button animates to green + `"Sending..."` text during delay
- **"Cancel" button** below (ghost style, grey text)

---

### 6.5 Scene 6 — Warehouse Admin Dashboard

**Purpose:** Admin's central hub to see all incoming refill requests and manage them.

**Layout:**
- **Header:** Orange bar (no rounded bottom)
  - Left: 🏚 (Warehouse icon) + `"Warehouse Admin"` title
  - Right: `"+ Add Item"` pill button (opens Global Items Sheet) and `"Sign Out"` pill
  - Subtitle below: `"Overview of requests & stock"`
- **Body:** Scrollable list of all admin requests (paddingBottom: 100dp to avoid being hidden behind any fixed UI)

**Request Card:**
Each request is displayed as a white card with a colored left border:
- **Pending:** Orange left border (`#FF6B00`)
- **Fulfilled:** Green left border (`#2ECC71`)

Card content:
- Row number: `"ROW 07"` (bold, large, navy)
- Timestamp: `"10:42 AM"` (small, grey)
- `"Fulfilled"` badge (top-right, appears only when fulfilled): green background, green text
- Item box: grey-light background, label `"Requested Items:"`, then item names in bold navy
- **"Approve & Dispatch" button** (only on pending cards):
  - Full width, navy background, white text, check icon
  - On tap: changes request status to `fulfilled` → toast: `"Dispatched stock to Row {N}!"`

**Empty state:** centered grey text `"No pending requests."`  
**New requests** animate in from below when added (fade + slide up).

---

### 6.6 Global Warehouse Items Sheet (Admin only)

Opened via `"+ Add Item"` button on Admin dashboard header.

- Full modal bottom sheet, 75% height, scrollable, spring animation
- Title: `"Global Warehouse Items"`
- Subtitle: `"Select additional supplementary items to push to all active Line Distributors."`
- Lists all **extra admin items** (ids 101–111)
- Each item row shows: emoji icon + item name only (no quantity shown)
- **Item states:**
  - If item already in distributor list: greyed out (opacity 0.6, `cursor: not-allowed`, shows `"Active"` pill badge on right)
  - If not active: can be selected (orange border + tint + checkbox when selected)
- **"Push to Distributors (N)" Button:**
  - Disabled until ≥1 item selected
  - On submit: 800ms delay → pushes selected items into distributor's active item list (deduplication check) → clears selection → sheet closes → toast: `"Pushed N items to distributors"`
  - Animates to green + `"Pushing..."` text during delay
- **"Cancel" button** below

---

### 6.7 Scene 8 — Participant Dashboard

**Purpose:** Entry point for event attendees. Currently a placeholder.

**Layout:**
- **Header:** Orange bar with rounded bottom corners (same style as Scene 4)
  - Title: `"Participant Dashboard"`
  - `"Sign Out"` pill in top-right (returns to Login)
- **Body:** Centered content
  - 120×120 circular icon with orange tint fill containing 🙏 (48sp emoji)
  - Text: `"Welcome to the Yagya details."` (grey, 16sp, 500 weight)
  - Sub-text: `"(Participant features arriving soon)"` (lighter grey, 14sp)
  - Fade + slide-up entrance animations (delays: 200ms, 400ms, 500ms)

> **Future scope for Participant screen:** Event schedule, row/seat information, live updates on Havan progress, help request button, announcements.

---

## 7. Global UX Components

### 7.1 Toast Notification

A floating toast appears above the bottom edge of the screen for all confirmations.

- **Position:** Absolute, 40dp from bottom, 20dp horizontal margin
- **Style:** Navy background, white text, green `✓` icon, 12dp border-radius
- **Animation:** Spring slide up from y+100 → 0 (in), reverse on exit
- **Duration:** Auto-dismiss after 3,000ms
- **Appears on:**
  - Row selection: `"Row N Selected!"`
  - Refill request sent: `"Requested N items from Admin"`
  - Admin dispatch: `"Dispatched stock to Row N!"`
  - Items pushed: `"Pushed N items to distributors"`

### 7.2 Screen Transition Animations

| Transition Type | Used for |
|----------------|----------|
| **Slide in from right** (`x: 50 → 0`) | Login → Row Select, Replenishment, Admin Dashboard, Participant Dashboard |
| **Fade** (`opacity: 0 → 1`) | Splash → Login, any splash-type screen |

All transitions use AnimatePresence / `useAnimatedStyle` in React Native with 500ms duration.

### 7.3 Bottom Sheet Overlay Pattern

Used in both the Refill Request (Scene 4) and Global Warehouse Items (Scene 6).

```
Structure:
- Dark scrim: absolute, full screen, rgba(0,0,0,0.4), tappable to dismiss
- Sheet: absolute, bottom: 0, left-right: 0, white, rounded top corners (24dp)
- Drag handle: 40×4dp grey bar centered at the top of sheet
- Content: scrollable, 32dp padding
- Action button at bottom of content
- Cancel (ghost) button below action button
```

---

## 8. State Management

In the prototype, all state lives in a single React component. For the React Native rebuild, use **Zustand** or **Redux Toolkit** with the following state slices:

| State | Type | Description |
|-------|------|-------------|
| `scene` / Navigation | Stack Navigator | Current screen |
| `activeRole` | `'distributor' \| 'participant' \| 'admin'` | Logged-in role |
| `isSigningIn` | boolean | Login loading state |
| `items` | `InventoryItem[]` | Active distributor inventory |
| `adminRequests` | `AdminRequest[]` | All incoming refill requests |
| `showWarehouseSheet` | boolean | Refill Request sheet visibility |
| `requestItems` | `number[]` | Selected item IDs for refill request |
| `showAddSheet` | boolean | Global Warehouse Items sheet visibility |
| `selectedExtraItems` | `number[]` | Admin-selected extra items to push |
| `btnPulse` | boolean | Loading/success animation on buttons |
| `showToast` | boolean | Toast visibility |
| `toastMsg` | string | Toast message content |
| `pressedRow` | `number \| null` | Currently pressed row card |

---

## 9. Business Logic

### 9.1 Inventory Status Calculation

```typescript
function calculateStatus(rawQty: number, step: number): ItemStatus {
  if (rawQty <= step * 3) return 'Urgent';
  if (rawQty <= step * 6) return 'Low';
  return 'OK';
}
```

### 9.2 Distributor Submits Refill Request

```
1. Distributor opens Refill Request sheet (items all unchecked)
2. Selects 1 or more items
3. Taps "Refill from admin (N items)"
4. 800ms delay (simulates network)
5. New AdminRequest created:
   - id: Date.now().toString()
   - row: distributor's current row (hardcoded '03' in prototype; make dynamic in RN)
   - time: current time formatted as "HH:MM AM/PM"
   - items: comma-separated names of selected items
   - status: 'pending'
6. Added to front of adminRequests array
7. Toast shown: "Requested N items from Admin"
```

### 9.3 Admin Approves Request

```
1. Admin taps "Approve & Dispatch" on a pending request card
2. Request status changes to 'fulfilled' (immutable update)
3. Card left-border changes orange → green
4. "Fulfilled" badge appears
5. "Approve & Dispatch" button disappears
6. Toast: "Dispatched stock to Row N!"
```

### 9.4 Admin Pushes Supplementary Items

```
1. Admin opens Global Warehouse Items sheet
2. Selects items not already in distributor list
3. Items already active show an "Active" badge and cannot be selected
4. Admin taps "Push to Distributors (N)"
5. 800ms delay
6. Selected extra items are merged into the `items` array (deduplication by id)
7. Those items now appear in the Distributor's Refill Request checklist
8. Toast: "Pushed N items to distributors"
```

---

## 10. React Native Implementation Guide

### 10.1 Recommended Libraries

| Purpose | Library |
|---------|---------|
| Navigation | `@react-navigation/native` + `@react-navigation/native-stack` |
| Animations | `react-native-reanimated` + `react-native-gesture-handler` |
| Gradients | `expo-linear-gradient` |
| Icons | `@expo/vector-icons` (MaterialCommunityIcons / Ionicons) |
| Bottom Sheets | `@gorhom/bottom-sheet` |
| State Management | `zustand` |
| Fonts | `expo-font` + `@expo-google-fonts/inter` |
| Safe Area | `react-native-safe-area-context` |
| Status Bar | `expo-status-bar` |

### 10.2 Project Structure (Recommended)

```
/src
  /screens
    SplashScreen.tsx
    LoginScreen.tsx
    SelectRowScreen.tsx       (Distributor)
    ReplenishmentScreen.tsx   (Distributor)
    AdminDashboardScreen.tsx  (Admin)
    ParticipantDashboard.tsx  (Participant)
  /components
    RoleToggle.tsx
    InventoryItem.tsx
    AdminRequestCard.tsx
    RefillRequestSheet.tsx
    GlobalWarehouseSheet.tsx
    Toast.tsx
  /store
    useAppStore.ts            (Zustand store)
  /data
    inventoryData.ts          (item lists, row config)
  /theme
    colors.ts
    typography.ts
    spacing.ts
  /utils
    statusHelpers.ts
```

### 10.3 Navigation Setup

```typescript
// App.tsx
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SelectRow" component={SelectRowScreen} />
        <Stack.Screen name="Replenishment" component={ReplenishmentScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="ParticipantDashboard" component={ParticipantDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### 10.4 Color Theme File (colors.ts)

```typescript
export const colors = {
  primary: '#FF6B00',
  primaryLight: '#FF8C00',
  navy: '#1A1A2E',
  green: '#2ECC71',
  yellow: '#F39C12',
  red: '#E74C3C',
  bg: '#F8F4F0',
  white: '#FFFFFF',
  greyText: '#8E8E93',
  greyLight: '#F2F2F7',
};
```

### 10.5 Splash to Login Auto-navigate

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    navigation.replace('Login');
  }, 2500);
  return () => clearTimeout(timer);
}, []);
```

### 10.6 Header Pattern (Orange Header Bar)

```tsx
// Used on: SelectRow, Replenishment, AdminDashboard, ParticipantDashboard
<LinearGradient
  colors={['#FF6B00', '#FF8C00']}
  style={styles.header}
>
  <SafeAreaView edges={['top']}>
    {/* Header content */}
  </SafeAreaView>
</LinearGradient>
```

---

## 11. Key Interaction Details

| Interaction | Behavior |
|------------|---------|
| Tap Row Card | Scale press animation (0.95), 400ms delay, toast + navigate |
| Tap item in checklist | Toggle selection, visual border/bg change |
| Tap "Request refill" | Open bottom sheet (all unchecked) |
| Tap "Refill from admin" | 800ms loading anim → close sheet → add to admin queue → toast |
| Tap "Approve & Dispatch" | Instant status update, toast |
| Tap "+ Add Item" | Open global warehouse sheet |
| Tap "Push to Distributors" | 800ms anim → merge items → toast |
| Tap scrim (dark backdrop) | Dismiss bottom sheet |
| Tap drag handle | Dismiss bottom sheet |
| Pull to dismiss sheet | Standard `@gorhom/bottom-sheet` gesture |

---

## 12. Out of Scope (V1)

- Real authentication / backend API
- Push notifications
- Offline sync
- Multi-event support
- Real-time updates (WebSockets)
- Participant dashboard features (screen is a placeholder in V1)
- Admin ability to edit/remove items from the distributor's list
- Row-specific inventory tracking (all rows share the same item list in V1)

---

## 13. Future Enhancements (Backlog)

- [ ] Real user auth with Firebase or Supabase
- [ ] Real-time request updates (Firestore listeners)
- [ ] Participant screen: event schedule, row/seat info, help button
- [ ] Per-row inventory tracking (each row has its own stock level)
- [ ] Push notifications to Admin when new request arrives
- [ ] Distributor can see which of their requests have been fulfilled
- [ ] Admin can reject a request with a note
- [ ] Analytics dashboard for Admin (total requests, most requested items)
- [ ] Multi-language support (Hindi)
