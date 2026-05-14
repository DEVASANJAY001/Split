import { create } from "zustand";
import { persist } from "zustand/middleware";
import { auth, db, storage } from "./firebase";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  collectionGroup,
  runTransaction,
} from "firebase/firestore";
import { ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";

export type GroupType =
  | "Trip"
  | "Roommates"
  | "Couple"
  | "Friends"
  | "Office"
  | "Other";
export type Category = string;
export type SplitMode = "equal" | "unequal" | "percent" | "shares";
export type RecurringInterval = "Daily" | "Weekly" | "Monthly" | "Yearly";

export type Person = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  upiId?: string;
};

export type SavingsGoal = {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category: Category;
  createdAt: number;
  streak: number;
  lastContributionDate?: string;
};

export type ShoppingListItem = {
  id: string;
  groupId: string;
  text: string;
  isCompleted: boolean;
  addedBy: string;
  createdAt: number;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  type: GroupType;
  memberIds: string[];
  ownerId: string;
  currency: string;
  createdAt: number;
};

export type Expense = {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  date: string;
  paidBy: string;
  shares: Record<string, number>; // uid -> amount
  splitMode: SplitMode;
  category: Category;
  attachments?: string[];
  createdAt: number;
};

export type Settlement = {
  id: string;
  groupId: string;
  from: string;
  to: string;
  amount: number;
  date: string;
  method?: string;
  createdAt: number;
};

export type PersonalExpense = {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: Category;
  notes?: string;
  attachmentUrl?: string;
  originalAmount?: number;
  originalCurrency?: string;
};

export type Message = {
  id: string;
  groupId: string;
  senderId: string;
  text: string;
  createdAt: number;
};

export type RecurringTemplate = {
  id: string;
  userId: string;
  isPersonal: boolean;
  interval: RecurringInterval;
  nextDate: string; // ISO date string
  lastGenerated?: string;
  data: any; // Copy of Expense or PersonalExpense (sans ID)
  isActive: boolean;
};

export type FriendRequest = {
  id: string;
  fromUsername: string; // who sent it
  fromName: string;
  fromAvatar?: string;
  fromUid?: string;
  createdAt: number;
};

export type Profile = {
  displayName: string;
  username: string;
  email: string;
  avatar: string;
  currency: string;
  budget?: number;
  salary?: number;
  upiId?: string;
  isVerified?: boolean;
  completedSetup?: boolean;
};

type AppMode = "group" | "personal";

interface AppState {
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
  personal: PersonalExpense[];
  people: Person[];
  friendIds: string[];
  requests: FriendRequest[];
  outgoing: {
    username: string;
    displayName: string;
    avatar?: string;
    createdAt: number;
    requestId: string;
    targetUid?: string;
  }[];
  lastSeenRequests: number;
  messages: Record<string, Message[]>; // groupId -> messages
  recurringTemplates: RecurringTemplate[];
  savingsGoals: SavingsGoal[];
  shoppingLists: Record<string, ShoppingListItem[]>; // groupId -> items
  mode: AppMode;
  profile: Profile | null;
  userId: string | null;
  loading: boolean;
  setMode: (m: AppMode) => void;
  initialize: () => void;
  addGroup: (g: Omit<Group, "id" | "ownerId">) => Promise<string>;
  addExpense: (e: Omit<Expense, "id">) => Promise<string>;
  addSettlement: (s: Omit<Settlement, "id">) => Promise<string>;
  addPersonalExpense: (e: Omit<PersonalExpense, "id">) => Promise<string>;
  updatePersonalExpense: (id: string, e: Partial<PersonalExpense>) => Promise<void>;
  updateExpense: (id: string, e: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string, isPersonal?: boolean) => Promise<void>;
  addFriend: (id: string) => Promise<string>;
  acceptRequest: (id: string) => Promise<void>;
  declineRequest: (id: string) => Promise<void>;
  sendRequest: (
    username: string,
    extra?: { displayName: string; avatar?: string },
  ) => Promise<void>;
  withdrawRequest: (username: string) => Promise<void>;
  removeFriend: (id: string) => Promise<void>;
  updateProfile: (p: Partial<Profile>) => Promise<void>;
  uploadAvatar: (file: Blob) => Promise<string>;
  isUsernameAvailable: (username: string) => Promise<boolean>;
  searchUsers: (
    query: string,
  ) => Promise<
    { username: string; displayName: string; avatar: string; uid: string }[]
  >;
  markRequestsAsSeen: () => void;
  deleteAccount: () => Promise<void>;
  updateGroupMembers: (groupId: string, memberIds: string[]) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  sendMessage: (groupId: string, text: string) => Promise<void>;
  addRecurringTemplate: (t: Omit<RecurringTemplate, "id" | "userId">) => Promise<string>;
  deleteRecurringTemplate: (id: string) => Promise<void>;
  // Savings Goals
  addSavingsGoal: (g: Omit<SavingsGoal, "id" | "userId" | "createdAt">) => Promise<void>;
  updateSavingsGoal: (id: string, data: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  // Shopping Lists
  addShoppingItem: (groupId: string, text: string) => Promise<void>;
  toggleShoppingItem: (id: string, completed: boolean) => Promise<void>;
  deleteShoppingItem: (id: string) => Promise<void>;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export type SettleMethod = "Cash" | "UPI" | "Bank Transfer" | "Other";

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      groups: [],
      expenses: [],
      settlements: [],
      personal: [],
      people: [],
      friendIds: [],
      requests: [],
      outgoing: [],
      lastSeenRequests: 0,
      messages: {},
      recurringTemplates: [],
      savingsGoals: [],
      shoppingLists: {},
      mode: "group",
      profile: null,
      userId: null,
      loading: true,
      isModalOpen: false,
      modalCount: 0,
      openModal: () => set((state: any) => ({ 
        modalCount: state.modalCount + 1,
        isModalOpen: true 
      })),
      closeModal: () => set((state: any) => {
        const newCount = Math.max(0, state.modalCount - 1);
        return { 
          modalCount: newCount,
          isModalOpen: newCount > 0 
        };
      }),
      unsubs: [] as (() => void)[],
      setMode: (m) => set({ mode: m }),
      initialize: () => {
        onAuthStateChanged(auth, async (user) => {
          // Unsubscribe from all existing listeners
          get().unsubs.forEach((unsub) => unsub());
          const newUnsubs: (() => void)[] = [];

          if (user) {
            const uid = user.uid;
            set({ userId: uid });

            // 1. Profile subscription
            const userRef = doc(db, "users", uid);
            newUnsubs.push(onSnapshot(userRef, async (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data() as Profile;
                set({ profile: data, loading: false });

                // Sync global people registry
                const personRef = doc(db, "people", uid);
                await setDoc(
                  personRef,
                  {
                    id: uid,
                    name: data.displayName || data.username || "User",
                    email: data.email || (data.username ? data.username + "@split.app" : "user@split.app"),
                    avatar: data.avatar || "",
                    initials: (data.displayName || data.username || "U").slice(0, 2).toUpperCase(),
                  },
                  { merge: true },
                );

                if (data.username) {
                  const handle = data.username.replace("@", "").toLowerCase();
                  await setDoc(doc(db, "usernames", handle), { uid });
                }
              } else {
                set({ profile: null, loading: false });
              }
            }, (error) => {
              console.error("Profile fetch error:", error);
              set({ loading: false });
            }));

            // 2. Groups subscription
            const groupsQuery = query(
              collection(db, "groups"),
              where("memberIds", "array-contains", uid),
            );
            newUnsubs.push(onSnapshot(groupsQuery, (snapshot) => {
              const groupsList = snapshot.docs.map(
                (d) => ({ ...d.data(), id: d.id }) as Group,
              );
              set({ groups: groupsList });

              // 3. Dependent subscriptions (Expenses/Settlements)
              if (groupsList.length > 0) {
                const groupIds = groupsList.map((g) => g.id);
                const expensesQuery = query(
                  collection(db, "expenses"),
                  where("groupId", "in", groupIds.slice(0, 30)),
                );
                newUnsubs.push(onSnapshot(expensesQuery, (expSnap) => {
                  set({
                    expenses: expSnap.docs.map(
                      (d) => ({ ...d.data(), id: d.id }) as Expense,
                    ),
                  });
                }));

                const settlementsQuery = query(
                  collection(db, "settlements"),
                  where("groupId", "in", groupIds.slice(0, 30)),
                );
                newUnsubs.push(onSnapshot(settlementsQuery, (setSnap) => {
                  set({
                    settlements: setSnap.docs.map(
                      (d) => ({ ...d.data(), id: d.id }) as Settlement,
                    ),
                  });
                }));
              } else {
                set({ expenses: [], settlements: [] });
              }
            }));

            // 4. People registry
            newUnsubs.push(onSnapshot(collection(db, "people"), (s) => {
              set({
                people: s.docs.map(
                  (d) => ({ ...d.data(), id: d.id }) as Person,
                ),
              });
            }));

            // 5. Personal Expenses
            newUnsubs.push(onSnapshot(
              collection(db, "users", uid, "personal_expenses"),
              (s) => {
                set({
                  personal: s.docs.map(
                    (d) => ({ ...d.data(), id: d.id }) as PersonalExpense,
                  ),
                });
              },
            ));

            // 6. Friend Requests
            newUnsubs.push(onSnapshot(collection(db, "users", uid, "friend_requests"), (s) => {
              set({
                requests: s.docs.map(
                  (d) => ({ ...d.data(), id: d.id }) as FriendRequest,
                ),
              });
            }));

            // 7. Friends list (with legacy migration)
            const friendsRef = doc(db, "users", uid, "private", "friends");
            newUnsubs.push(onSnapshot(friendsRef, async (s) => {
              if (s.exists()) {
                const friendIds = s.data().ids || [];
                set((state) => ({
                  friendIds,
                  outgoing: (state.outgoing || []).filter(
                    (o) => !o.targetUid || !friendIds.includes(o.targetUid),
                  ),
                }));
              } else {
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                  const data = userSnap.data();
                  const legacyIds = data.friendIds || data.friends || [];
                  if (Array.isArray(legacyIds) && legacyIds.length > 0) {
                    await setDoc(friendsRef, { ids: legacyIds }, { merge: true });
                  }
                }
              }
            }));

            // 8. Messages
            newUnsubs.push(onSnapshot(collection(db, "messages"), (s) => {
              const all = s.docs.map(d => ({ ...d.data(), id: d.id }) as Message);
              const grouped: Record<string, Message[]> = {};
              all.forEach(m => {
                if (!grouped[m.groupId]) grouped[m.groupId] = [];
                grouped[m.groupId].push(m);
              });
              Object.keys(grouped).forEach(gid => grouped[gid].sort((a, b) => a.createdAt - b.createdAt));
              set({ messages: grouped });
            }));

            // 8.5 Recurring Templates
            newUnsubs.push(onSnapshot(collection(db, "users", uid, "recurring_templates"), (s) => {
              const templates = s.docs.map(d => ({ ...d.data(), id: d.id }) as RecurringTemplate);
              set({ recurringTemplates: templates });
              
              // 8.6 Check and Generate Due Expenses
              const now = new Date().toISOString().slice(0, 10);
              templates.forEach(async (t) => {
                if (t.isActive && t.nextDate <= now) {
                  const data = { ...t.data, date: t.nextDate, createdAt: Date.now() };
                  if (t.isPersonal) {
                    await get().addPersonalExpense(data);
                  } else {
                    await get().addExpense(data);
                  }

                  // Update next date
                  const next = new Date(t.nextDate);
                  if (t.interval === "Daily") next.setDate(next.getDate() + 1);
                  else if (t.interval === "Weekly") next.setDate(next.getDate() + 7);
                  else if (t.interval === "Monthly") next.setMonth(next.getMonth() + 1);
                  else if (t.interval === "Yearly") next.setFullYear(next.getFullYear() + 1);

                  await updateDoc(doc(db, "users", uid, "recurring_templates", t.id), {
                    nextDate: next.toISOString().slice(0, 10),
                    lastGenerated: t.nextDate
                  });
                }
              });
            }));

            // 8.7 Savings Goals
            newUnsubs.push(onSnapshot(collection(db, "users", uid, "savings_goals"), (s) => {
              set({ savingsGoals: s.docs.map(d => ({ ...d.data(), id: d.id }) as SavingsGoal) });
            }));

            // 8.8 Shopping Lists
            newUnsubs.push(onSnapshot(collection(db, "shopping_items"), (s) => {
              const items = s.docs.map(d => ({ ...d.data(), id: d.id }) as ShoppingListItem);
              const grouped: Record<string, ShoppingListItem[]> = {};
              items.forEach(i => {
                if (!grouped[i.groupId]) grouped[i.groupId] = [];
                grouped[i.groupId].push(i);
              });
              set({ shoppingLists: grouped });
            }));
 
            // 9. Migration & Finalize
            const currentOutgoing = get().outgoing;
            const cleanedOutgoing = (currentOutgoing || []).map(o => {
              if (typeof o === 'string') return { username: o, displayName: o, requestId: "legacy", createdAt: Date.now() };
              return o;
            }).filter(o => o && o.username);
            set({ outgoing: cleanedOutgoing, unsubs: newUnsubs });
          } else {
            set({
              profile: null,
              userId: null,
              loading: false,
              groups: [],
              expenses: [],
              settlements: [],
              requests: [],
              friendIds: [],
              people: [],
              unsubs: [],
            });
          }
        });
      },
      addGroup: async (g) => {
        const docRef = await addDoc(collection(db, "groups"), {
          ...g,
          ownerId: auth.currentUser?.uid,
          createdAt: Date.now(),
        });
        return docRef.id;
      },
      addExpense: async (e) => {
        const docRef = await addDoc(collection(db, "expenses"), {
          ...e,
          createdAt: Date.now(),
        });
        return docRef.id;
      },
      addSettlement: async (s) => {
        const docRef = await addDoc(collection(db, "settlements"), {
          ...s,
          createdAt: Date.now(),
        });
        return docRef.id;
      },
      addPersonalExpense: async (e) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error("Not authenticated");
        const docRef = await addDoc(
          collection(db, "users", userId, "personal_expenses"),
          { ...e },
        );
        return docRef.id;
      },
      updatePersonalExpense: async (id, e) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error("Not authenticated");
        await updateDoc(doc(db, "users", userId, "personal_expenses", id), e);
      },
      updateExpense: async (id, e) => {
        await updateDoc(doc(db, "expenses", id), e);
      },
      deleteExpense: async (id, isPersonal) => {
        const userId = auth.currentUser?.uid;
        if (isPersonal && userId) {
          await deleteDoc(doc(db, "users", userId, "personal_expenses", id));
        } else {
          await deleteDoc(doc(db, "expenses", id));
        }
      },
      addFriend: async (id) => {
        const userId = auth.currentUser?.uid;
        if (userId) {
          const currentFriends = get().friendIds;
          await setDoc(
            doc(db, "users", userId, "private", "friends"),
            { ids: [...currentFriends, id] },
            { merge: true },
          );
        }
        return id;
      },
      acceptRequest: async (id) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        const req = get().requests.find((r) => r.id === id);
        if (!req) return;

        let senderUid = req.fromUid;
        if (!senderUid) {
          const handle = req.fromUsername.replace("@", "").toLowerCase();
          const snap = await getDoc(doc(db, "usernames", handle));
          if (!snap.exists()) return;
          senderUid = snap.data().uid;
        }

        if (!senderUid) return;

        // 4. Get reciprocal request if exists (Read before transaction writes)
        const reciprocalRef = query(
          collection(db, "users", senderUid, "friend_requests"),
          where("fromUid", "==", userId),
        );
        const reciprocalSnap = await getDocs(reciprocalRef);
        const reciprocalDocRefs = reciprocalSnap.docs.map((d) => d.ref);

        await runTransaction(db, async (transaction) => {
          const receiverFriendsRef = doc(db, "users", userId, "private", "friends");
          const senderFriendsRef = doc(db, "users", senderUid, "private", "friends");

          // READS FIRST
          const recSnap = await transaction.get(receiverFriendsRef);
          const senSnap = await transaction.get(senderFriendsRef);

          const recFriends = recSnap.exists() ? recSnap.data().ids || [] : [];
          const senFriends = senSnap.exists() ? senSnap.data().ids || [] : [];

          // WRITES SECOND
          if (!recFriends.includes(senderUid)) {
            transaction.set(
              receiverFriendsRef,
              { ids: [...recFriends, senderUid] },
              { merge: true },
            );
          }

          if (!senFriends.includes(userId)) {
            transaction.set(
              senderFriendsRef,
              { ids: [...senFriends, userId] },
              { merge: true },
            );
          }

          // Delete current request
          transaction.delete(doc(db, "users", userId, "friend_requests", id));

          // Delete reciprocal requests
          reciprocalDocRefs.forEach((ref) => transaction.delete(ref));
        });
      },
      declineRequest: async (id) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        await deleteDoc(doc(db, "users", userId, "friend_requests", id));
      },
      sendRequest: async (username, extra) => {
        const handle = username.replace("@", "").toLowerCase();
        const userId = auth.currentUser?.uid;
        const profile = get().profile;
        if (!userId || !profile) return;

        try {
          const snap = await getDoc(doc(db, "usernames", handle));
          if (!snap.exists()) {
            toast.error("User not found");
            return;
          }
          const targetUid = snap.data().uid;
          if (targetUid === userId) {
            toast.error("You cannot add yourself");
            return;
          }

          // 1. Check if already friends
          if (get().friendIds.includes(targetUid)) {
            toast.error("You are already friends!");
            return;
          }
 
          // 2. Check if there is already an incoming request from this user
          const incomingReq = get().requests.find(r => r.fromUid === targetUid);
          if (incomingReq) {
            // If they already sent us a request, just accept it!
            await get().acceptRequest(incomingReq.id);
            toast.success(`You are now friends with ${extra?.displayName || username}!`);
            return;
          }
 
          const reqRef = collection(db, "users", targetUid, "friend_requests");
          const newDoc = await addDoc(reqRef, {
            fromUsername: profile.username,
            fromName: profile.displayName,
            fromAvatar: profile.avatar || "",
            fromUid: userId,
            createdAt: Date.now(),
          });

          set((s) => ({
            outgoing: [
              ...s.outgoing.filter((o) => o.username !== username),
              {
                username,
                displayName: extra?.displayName || username,
                avatar: extra?.avatar,
                createdAt: Date.now(),
                requestId: newDoc.id,
                targetUid,
              },
            ],
          }));

          // Removed success toast
        } catch (error) {
          console.error("Send request error", error);
          toast.error("Failed to send request.");
        }
      },
      withdrawRequest: async (username) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const out = get().outgoing.find((o) => o.username === username);
        if (!out) return;

        try {
          const handle = username.replace("@", "").toLowerCase();
          const snap = await getDoc(doc(db, "usernames", handle));
          if (snap.exists()) {
            const targetUid = snap.data().uid;
            await deleteDoc(
              doc(db, "users", targetUid, "friend_requests", out.requestId),
            );
          }
        } catch (e) {
          console.error("Withdrawal error", e);
        }

        set((s) => ({
          outgoing: s.outgoing.filter((o) => o.username !== username),
        }));
      },
      removeFriend: async (id) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        await runTransaction(db, async (transaction) => {
          const userFriendsRef = doc(db, "users", userId, "private", "friends");
          const otherFriendsRef = doc(db, "users", id, "private", "friends");

          // READS FIRST
          const userSnap = await transaction.get(userFriendsRef);
          const otherSnap = await transaction.get(otherFriendsRef);

          // WRITES SECOND
          if (userSnap.exists()) {
            transaction.update(userFriendsRef, {
              ids: (userSnap.data().ids || []).filter((x: string) => x !== id),
            });
          }

          if (otherSnap.exists()) {
            transaction.update(otherFriendsRef, {
              ids: (otherSnap.data().ids || []).filter(
                (x: string) => x !== userId,
              ),
            });
          }
        });
      },
      updateProfile: async (p) => {
        const userId = auth.currentUser?.uid;
        if (userId) {
          await setDoc(doc(db, "users", userId), p, { merge: true });
          if (p.username) {
            const handle = p.username.replace("@", "").toLowerCase();
            await setDoc(doc(db, "usernames", handle), { uid: userId });
          }
        }
      },
      uploadAvatar: async (file) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error("Not authenticated");

        // Helper for Base64 fallback
        const getBase64 = (f: Blob): Promise<string> => new Promise((res, rej) => {
          const reader = new FileReader();
          reader.readAsDataURL(f);
          reader.onload = () => res(reader.result as string);
          reader.onerror = error => rej(error);
        });

        try {
          const fileRef = sRef(storage, `avatars/${userId}`);
 
          const uploadTask = async () => {
            await uploadBytes(fileRef, file);
            return getDownloadURL(fileRef);
          };
 
          const timeout = new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error("Storage upload timed out. Ensure Firebase Storage is enabled and CORS is configured if on localhost.")), 15000)
          );
 
          return await Promise.race([uploadTask(), timeout]);
        } catch (err: any) {
          console.warn("Cloud upload failed (possibly CORS or timeout). Falling back to Base64.", err);
          if (file.size > 500 * 1024) {
            toast.error("Image too large for fallback. Try a smaller image.");
            throw err;
          }
          return await getBase64(file);
        }
      },
      isUsernameAvailable: async (username) => {
        const handle = username.replace("@", "").toLowerCase();
        const snap = await getDoc(doc(db, "usernames", handle));
        return !snap.exists();
      },
      searchUsers: async (queryText) => {
        const handle = queryText.replace("@", "").toLowerCase();
        const snap = await getDocs(collection(db, "usernames"));
        const all: Record<string, string> = {};
        snap.docs.forEach((d) => {
          all[d.id] = d.data().uid;
        });
        const matches = Object.keys(all).filter((h) => h.includes(handle));

        const results = await Promise.all(
          matches.map(async (h) => {
            const uid = all[h];
            const userSnap = await getDoc(doc(db, "users", uid));
            if (userSnap.exists()) {
              const u = userSnap.data();
              return {
                username: "@" + h,
                displayName: u.displayName,
                avatar: u.avatar,
                uid,
              };
            }
            return null;
          }),
        );

        return results.filter(
          (
            r,
          ): r is {
            username: string;
            displayName: string;
            avatar: string;
            uid: string;
          } => r !== null,
        );
      },
      markRequestsAsSeen: () => {
        set({ lastSeenRequests: Date.now() });
      },
      deleteAccount: async () => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const profile = get().profile;
        if (profile) {
          const handle = profile.username.replace("@", "").toLowerCase();
          await deleteDoc(doc(db, "usernames", handle));
        }
        await deleteDoc(doc(db, "users", userId));
        await deleteDoc(doc(db, "people", userId));
        // Note: personal_expenses are in a subcollection, so they need recursive delete if needed,
        // but for now deleteDoc on top-level is what was there.
        await auth.currentUser?.delete();
        set({ userId: null, profile: null });
      },
      updateGroupMembers: async (groupId, memberIds) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        await updateDoc(doc(db, "groups", groupId), { memberIds });
      },
      deleteGroup: async (groupId) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        await runTransaction(db, async (transaction) => {
          // Delete expenses in group
          const expSnap = await getDocs(
            query(collection(db, "expenses"), where("groupId", "==", groupId)),
          );
          expSnap.forEach((d) => transaction.delete(d.ref));

          // Delete settlements in group
          const setSnap = await getDocs(
            query(
              collection(db, "settlements"),
              where("groupId", "==", groupId),
            ),
          );
          setSnap.forEach((d) => transaction.delete(d.ref));

          // Delete group
          transaction.delete(doc(db, "groups", groupId));
        });
      },
      sendMessage: async (groupId, text) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        await addDoc(collection(db, "messages"), {
          groupId,
          senderId: userId,
          text,
          createdAt: Date.now(),
        });
      },
      addRecurringTemplate: async (t) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error("Not authenticated");
        const docRef = await addDoc(collection(db, "users", userId, "recurring_templates"), {
          ...t,
          userId,
        });
        return docRef.id;
      },
      deleteRecurringTemplate: async (id) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        await deleteDoc(doc(db, "users", userId, "recurring_templates", id));
      },
      addSavingsGoal: async (g) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        await addDoc(collection(db, "users", userId, "savings_goals"), { 
          ...g, 
          userId, 
          createdAt: Date.now(),
          streak: 0,
          lastContributionDate: null
        });
      },
      updateSavingsGoal: async (id, data) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        const goals = get().savingsGoals;
        const goal = goals.find(g => g.id === id);
        
        if (goal && data.currentAmount && data.currentAmount > goal.currentAmount) {
          const today = new Date().toISOString().slice(0, 10);
          const lastDate = goal.lastContributionDate;
          let newStreak = goal.streak;
          
          if (!lastDate) {
            newStreak = 1;
          } else {
            const last = new Date(lastDate);
            const now = new Date(today);
            const diff = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
            
            if (diff === 1) newStreak += 1;
            else if (diff > 1) newStreak = 1;
          }
          
          await updateDoc(doc(db, "users", userId, "savings_goals", id), {
            ...data,
            streak: newStreak,
            lastContributionDate: today
          });
        } else {
          await updateDoc(doc(db, "users", userId, "savings_goals", id), data);
        }
      },
      deleteSavingsGoal: async (id) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        await deleteDoc(doc(db, "users", userId, "savings_goals", id));
      },
      addShoppingItem: async (groupId, text) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        await addDoc(collection(db, "shopping_items"), { groupId, text, isCompleted: false, addedBy: userId, createdAt: Date.now() });
      },
      toggleShoppingItem: async (id, completed) => {
        await updateDoc(doc(db, "shopping_items", id), { isCompleted: completed });
      },
      deleteShoppingItem: async (id) => {
        await deleteDoc(doc(db, "shopping_items", id));
      }
    }),
    {
      name: "split-storage",
      partialize: (state) => ({
        outgoing: state.outgoing,
        lastSeenRequests: state.lastSeenRequests,
        mode: state.mode,
      }),
    },
  ),
);

export const personById = (people: any[], id: string, profile?: any) => {
  if (id === profile?.id || id === auth.currentUser?.uid) return profile || { id, name: "You", initials: "Y" };
  return people?.find((p: any) => p.id === id) || { id, name: "Unknown", initials: "?" };
};

export function netBalances(
  group: Group,
  allExpenses: Expense[],
  allSettlements: Settlement[],
) {
  const net: Record<string, number> = Object.fromEntries(
    group.memberIds.map((id) => [id, 0]),
  );
  const groupExpenses = allExpenses.filter((e) => e.groupId === group.id);
  const groupSettlements = allSettlements.filter((s) => s.groupId === group.id);

  for (const e of groupExpenses) {
    net[e.paidBy] = (net[e.paidBy] ?? 0) + e.amount;
    for (const [uid, share] of Object.entries(e.shares)) {
      net[uid] = (net[uid] ?? 0) - share;
    }
  }

  for (const s of groupSettlements) {
    net[s.from] = (net[s.from] ?? 0) + s.amount;
    net[s.to] = (net[s.to] ?? 0) - s.amount;
  }

  for (const k of Object.keys(net)) net[k] = Math.round(net[k] * 100) / 100;
  return net;
}

export function simplifyDebts(net: Record<string, number>) {
  const debtors: { id: string; v: number }[] = [];
  const creditors: { id: string; v: number }[] = [];
  for (const [id, v] of Object.entries(net)) {
    if (v < -0.01) debtors.push({ id, v: -v });
    else if (v > 0.01) creditors.push({ id, v });
  }
  debtors.sort((a, b) => b.v - a.v);
  creditors.sort((a, b) => b.v - a.v);
  const out: { from: string; to: string; amount: number }[] = [];
  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].v, creditors[j].v);
    out.push({
      from: debtors[i].id,
      to: creditors[j].id,
      amount: Math.round(pay * 100) / 100,
    });
    debtors[i].v -= pay;
    creditors[j].v -= pay;
    if (debtors[i].v < 0.01) i++;
    if (creditors[j].v < 0.01) j++;
  }
  return out;
}

export function computeShares(
  total: number,
  participants: string[],
  mode: SplitMode,
  values: Record<string, number> = {},
): Record<string, number> {
  if (participants.length === 0) return {};
  if (mode === "equal") {
    const share = total / participants.length;
    return Object.fromEntries(
      participants.map((p) => [p, Math.round(share * 100) / 100]),
    );
  }
  if (mode === "percent") {
    return Object.fromEntries(
      participants.map((p) => [
        p,
        Math.round(((total * (values[p] ?? 0)) / 100) * 100) / 100,
      ]),
    );
  }
  if (mode === "shares") {
    const totalShares =
      Object.values(values).reduce((a, b) => a + (b || 0), 0) ||
      participants.length;
    const perShare = total / totalShares;
    return Object.fromEntries(
      participants.map((p) => [
        p,
        Math.round(perShare * (values[p] ?? 1) * 100) / 100,
      ]),
    );
  }
  // unequal / custom
  return Object.fromEntries(
    participants.map((p) => [p, Math.round((values[p] ?? 0) * 100) / 100]),
  );
}
