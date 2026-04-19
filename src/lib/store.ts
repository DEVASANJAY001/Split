import { create } from "zustand";
import { persist } from "zustand/middleware";
import { auth, db, storage } from "./firebase";
import { ref, onValue, set as dbSet, push, remove, update, get as dbGet } from "firebase/database";
import { ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";

export type GroupType = "Trip" | "Roommates" | "Couple" | "Friends" | "Office" | "Other";
export type Category = "Food" | "Travel" | "Rent" | "Utilities" | "Shopping" | "Entertainment" | "Fuel" | "Bills" | "Other";
export type SplitMode = "equal" | "unequal" | "percent" | "shares";

export type Person = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  type: GroupType;
  memberIds: string[];
  ownerId: string;
  currency: string;
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
  outgoing: { username: string; displayName: string; avatar?: string; createdAt: number; requestId: string; targetUid?: string }[];
  lastSeenRequests: number;
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
  deleteExpense: (id: string, isPersonal?: boolean) => Promise<void>;
  addFriend: (id: string) => Promise<string>;
  acceptRequest: (id: string) => Promise<void>;
  declineRequest: (id: string) => Promise<void>;
  sendRequest: (username: string, extra?: { displayName: string, avatar?: string }) => Promise<void>;
  withdrawRequest: (username: string) => Promise<void>;
  removeFriend: (id: string) => Promise<void>;
  updateProfile: (p: Partial<Profile>) => Promise<void>;
  uploadAvatar: (file: Blob) => Promise<string>;
  isUsernameAvailable: (username: string) => Promise<boolean>;
  searchUsers: (query: string) => Promise<{ username: string; displayName: string; avatar: string; uid: string }[]>;
  markRequestsAsSeen: () => void;
  deleteAccount: () => Promise<void>;
  updateGroupMembers: (groupId: string, memberIds: string[]) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
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
      mode: "group",
      profile: null,
      userId: null,
      loading: true,
      setMode: (m) => set({ mode: m }),
      initialize: () => {
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            const uid = user.uid;
            set({ userId: uid });

            // 1. First-pass profile check to avoid redirect flashes
            try {
              const profSnap = await dbGet(ref(db, `users/${uid}`));
              if (profSnap.exists()) {
                set({ profile: profSnap.val() });
              }
            } catch (e) {
              console.error("Initial profile fetch error", e);
            }

            // 2. Subscribe to profile for future updates
            onValue(ref(db, `users/${uid}`), async (snapshot) => {
              const data = snapshot.val();
              if (data) {
                set({ profile: data });

                // Auto-sync global people registry so friends share exactly one UID
                const pRef = ref(db, `people/${uid}`);
                const pSnap = await dbGet(pRef);
                if (!pSnap.exists() || pSnap.val().avatar !== data.avatar || pSnap.val().name !== data.displayName) {
                  await dbSet(pRef, {
                    id: uid,
                    name: data.displayName || data.username || "User",
                    email: data.email || `${data.username || "user"}@smartsplit.app`,
                    avatar: data.avatar || "",
                    initials: (data.displayName || data.username || "U").split(" ").map((x: string) => x[0]).join("").slice(0, 2).toUpperCase()
                  });
                }

                if (data.username) {
                  const handle = data.username.replace("@", "").toLowerCase();
                  await dbSet(ref(db, `usernames/${handle}`), uid);
                }
              }
            });

            // 2. Subscribe to Group IDs & Groups
            // Note: We subscribe to EVERY group but filter locally for responsiveness and simplified schema
            onValue(ref(db, "groups"), (s) => {
              const raw = s.val() ? Object.values(s.val()) as Group[] : [];
              const all = raw.map(g => ({
                ...g,
                memberIds: Array.isArray(g.memberIds) ? g.memberIds : (Object.values(g.memberIds || {}) as string[])
              }));
              const myGroups = all.filter(g => g.memberIds.includes(uid));
              set({ groups: myGroups });
            });

            // 3. Independent observers — derive membership from groups snapshot, not stale state
            onValue(ref(db, "expenses"), (s) => {
              const all = s.val() ? Object.values(s.val()) as Expense[] : [];
              const myGroupIds = get().groups.map(g => g.id);
              set({ expenses: all.filter(e => myGroupIds.includes(e.groupId)) });
            });

            onValue(ref(db, "settlements"), (s) => {
              const all = s.val() ? Object.values(s.val()) as Settlement[] : [];
              const myGroupIds = get().groups.map(g => g.id);
              set({ settlements: all.filter(st => myGroupIds.includes(st.groupId)) });
            });

            onValue(ref(db, "people"), (s) => {
              const all = s.val() ? Object.values(s.val()) as Person[] : [];
              set({ people: all });
            });

            onValue(ref(db, "personal_expenses/" + uid), (s) => set({ personal: s.val() ? Object.values(s.val()) : [] }));
            onValue(ref(db, "friend_requests/" + uid), (s) => set({ requests: s.val() ? Object.values(s.val()) : [] }));
            onValue(ref(db, "friends/" + uid), (s) => {
              const friendIds = s.val() ? (Object.values(s.val()) as string[]) : [];
              set((state) => ({
                friendIds,
                outgoing: (state.outgoing || []).filter(o => !o.targetUid || !friendIds.includes(o.targetUid))
              }));
            });

            // 4. Migration & Finalize
            const currentOutgoing = get().outgoing;
            const cleanedOutgoing = (currentOutgoing || []).map(o => {
              if (typeof o === 'string') return { username: o, displayName: o, requestId: "legacy", createdAt: Date.now() };
              return o;
            }).filter(o => o && o.username);
            set({ outgoing: cleanedOutgoing, loading: false });
          } else {
            set({ profile: null, userId: null, loading: false, groups: [], expenses: [], settlements: [], requests: [], friendIds: [], people: [] });
          }
        });
      },
      addGroup: async (g) => {
        const newRef = push(ref(db, "groups"));
        const id = newRef.key!;
        await dbSet(newRef, { ...g, id, ownerId: auth.currentUser?.uid });
        return id;
      },
      addExpense: async (e) => {
        const newRef = push(ref(db, "expenses"));
        const id = newRef.key!;
        await dbSet(newRef, { ...e, id, createdAt: Date.now() });
        return id;
      },
      addSettlement: async (s) => {
        const newRef = push(ref(db, "settlements"));
        const id = newRef.key!;
        await dbSet(newRef, { ...s, id, createdAt: Date.now() });
        return id;
      },
      addPersonalExpense: async (e) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error("Not authenticated");
        const newRef = push(ref(db, "personal_expenses/" + userId));
        const id = newRef.key!;
        await dbSet(newRef, { ...e, id });
        return id;
      },
      deleteExpense: async (id, isPersonal) => {
        const userId = auth.currentUser?.uid;
        const path = isPersonal ? `personal_expenses/${userId}/${id}` : `expenses/${id}`;
        await remove(ref(db, path));
      },
      addFriend: async (id) => {
        const userId = auth.currentUser?.uid;
        if (userId) {
          const friendsRef = ref(db, `friends/${userId}`);
          const currentFriends = get().friendIds;
          await dbSet(friendsRef, [...currentFriends, id]);
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
          const senderHandle = req.fromUsername.replace("@", "").toLowerCase();
          const senderUidSnap = await dbGet(ref(db, `usernames/${senderHandle}`));
          if (!senderUidSnap.exists()) return;
          senderUid = senderUidSnap.val();
        }

        if (!senderUid) return;

        // 1. Add senderUid to receiver's friendIds
        await dbSet(ref(db, `friends/${userId}`), [...get().friendIds, senderUid]);

        // 2. Add userId to sender's friendIds
        const senderFriendsSnap = await dbGet(ref(db, `friends/${senderUid}`));
        const senderFriends = senderFriendsSnap.val() || [];
        await dbSet(ref(db, `friends/${senderUid}`), [...senderFriends, userId]);

        // 3. Remove request
        await remove(ref(db, `friend_requests/${userId}/${id}`));
      },
      declineRequest: async (id) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        await remove(ref(db, `friend_requests/${userId}/${id}`));
      },
      sendRequest: async (username, extra) => {
        const handle = username.replace("@", "").toLowerCase();
        const userId = auth.currentUser?.uid;
        const profile = get().profile;
        if (!userId || !profile) return;

        try {
          const snapshot = await dbGet(ref(db, `usernames/${handle}`));
          if (!snapshot.exists()) {
            toast.error("User not found");
            return;
          }
          const targetUid = snapshot.val();
          if (targetUid === userId) {
            toast.error("You cannot add yourself");
            return;
          }

          const reqRef = push(ref(db, `friend_requests/${targetUid}`));
          const requestId = reqRef.key!;
          const request: FriendRequest = {
            id: requestId,
            fromUsername: profile.username,
            fromName: profile.displayName,
            fromAvatar: profile.avatar || "",
            fromUid: userId,
            createdAt: Date.now()
          };
          await dbSet(reqRef, request);

          set((s) => ({
            outgoing: [
              ...s.outgoing.filter(o => (typeof o === 'string' ? o : o.username) !== username),
              {
                username,
                displayName: extra?.displayName || username,
                avatar: extra?.avatar,
                createdAt: Date.now(),
                requestId,
                targetUid
              }
            ]
          }));

          toast.success("Friend request sent to " + username);
        } catch (error) {
          console.error("Send request error", error);
          toast.error("Failed to send request.");
        }
      },
      withdrawRequest: async (username) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const out = get().outgoing.find(o => (typeof o === 'string' ? o : o.username) === username);
        if (!out) return;

        try {
          const handle = username.replace("@", "").toLowerCase();
          const snapshot = await dbGet(ref(db, `usernames/${handle}`));
          if (snapshot.exists()) {
            const targetUid = snapshot.val();
            await remove(ref(db, `friend_requests/${targetUid}/${out.requestId}`));
          }
        } catch (e) {
          console.error("Withdrawal error", e);
        }

        set((s) => ({
          outgoing: s.outgoing.filter(o => (typeof o === 'string' ? o : o.username) !== username)
        }));
      },
      removeFriend: async (id) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        // Remove from current user's list
        const friendsRef = ref(db, `friends/${userId}`);
        await dbSet(friendsRef, get().friendIds.filter((x) => x !== id));
        // Also remove current user from the other person's list (bilateral)
        try {
          const otherFriendsSnap = await dbGet(ref(db, `friends/${id}`));
          const otherFriends = otherFriendsSnap.val() || [];
          await dbSet(ref(db, `friends/${id}`), (otherFriends as string[]).filter((x) => x !== userId));
        } catch (e) {
          console.error("Failed to remove bilateral friend", e);
        }
      },
      updateProfile: async (p) => {
        const userId = auth.currentUser?.uid;
        if (userId) {
          await update(ref(db, `users/${userId}`), p);
          if (p.username) {
            const handle = p.username.replace("@", "").toLowerCase();
            await dbSet(ref(db, `usernames/${handle}`), userId);
          }
        }
      },
      uploadAvatar: async (file) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error("Not authenticated");
        const fileRef = sRef(storage, `avatars/${userId}`);

        const uploadTask = async () => {
          await uploadBytes(fileRef, file);
          return getDownloadURL(fileRef);
        };

        const timeout = new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error("Storage upload timed out. Ensure Firebase Storage is enabled and rules allow writes.")), 7000)
        );

        return Promise.race([uploadTask(), timeout]);
      },
      isUsernameAvailable: async (username) => {
        const handle = username.replace("@", "").toLowerCase();
        const snapshot = await dbGet(ref(db, `usernames/${handle}`));
        return !snapshot.exists();
      },
      searchUsers: async (query) => {
        const handle = query.replace("@", "").toLowerCase();
        const snapshot = await dbGet(ref(db, "usernames"));
        if (!snapshot.exists()) return [];

        const all = snapshot.val();
        const matches = Object.keys(all).filter(h => h.includes(handle));

        const results = await Promise.all(matches.map(async (h) => {
          const uid = all[h];
          const userSnap = await dbGet(ref(db, `users/${uid}`));
          if (userSnap.exists()) {
            const u = userSnap.val();
            return {
              username: "@" + h,
              displayName: u.displayName,
              avatar: u.avatar,
              uid
            };
          }
          return null;
        }));

        return results.filter((r): r is { username: string; displayName: string; avatar: string; uid: string } => r !== null);
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
          await remove(ref(db, `usernames/${handle}`));
        }
        await remove(ref(db, `users/${userId}`));
        await remove(ref(db, `people/${userId}`));
        await remove(ref(db, `friends/${userId}`));
        await remove(ref(db, `personal_expenses/${userId}`));
        await auth.currentUser?.delete();
        set({ userId: null, profile: null });
      },
      updateGroupMembers: async (groupId, memberIds) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        await update(ref(db, `groups/${groupId}`), { memberIds });
      },
      deleteGroup: async (groupId) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        const expenses = get().expenses.filter(e => e.groupId === groupId);
        for (const e of expenses) {
          await remove(ref(db, `expenses/${e.id}`));
        }
        const settlements = get().settlements.filter(s => s.groupId === groupId);
        for (const s of settlements) {
          await remove(ref(db, `settlements/${s.id}`));
        }
        await remove(ref(db, `groups/${groupId}`));
      }
    }),
    {
      name: "smart-split-storage",
      partialize: (state) => ({
        outgoing: state.outgoing,
        lastSeenRequests: state.lastSeenRequests,
        mode: state.mode
      }),
    }
  )
);

export const personById = (people: Person[], id: string) => people.find((p) => p.id === id);

export function netBalances(group: Group, allExpenses: Expense[], allSettlements: Settlement[]) {
  const net: Record<string, number> = Object.fromEntries(group.memberIds.map((id) => [id, 0]));
  const groupExpenses = allExpenses.filter(e => e.groupId === group.id);
  const groupSettlements = allSettlements.filter(s => s.groupId === group.id);

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
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].v, creditors[j].v);
    out.push({ from: debtors[i].id, to: creditors[j].id, amount: Math.round(pay * 100) / 100 });
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
    return Object.fromEntries(participants.map((p) => [p, Math.round(share * 100) / 100]));
  }
  if (mode === "percent") {
    return Object.fromEntries(
      participants.map((p) => [p, Math.round((total * (values[p] ?? 0) / 100) * 100) / 100]),
    );
  }
  if (mode === "shares") {
    const totalShares = Object.values(values).reduce((a, b) => a + (b || 0), 0) || participants.length;
    const perShare = total / totalShares;
    return Object.fromEntries(
      participants.map((p) => [p, Math.round((perShare * (values[p] ?? 1)) * 100) / 100]),
    );
  }
  // unequal / custom
  return Object.fromEntries(participants.map((p) => [p, Math.round((values[p] ?? 0) * 100) / 100]));
}
