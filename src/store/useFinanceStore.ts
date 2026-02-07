import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Person, Transaction, UserSettings, Account, RecurringRule } from '@/types';
import { supabase } from '@/lib/supabase';

// Helper Mappers
const mapPersonToDb = (p: Person, userId: string) => ({
    id: p.id,
    user_id: userId,
    name: p.name,
    mobile: p.mobile,
    email: p.email,
    remarks: p.remarks,
    is_favorite: p.isFavorite,
    created_at: p.createdAt,
    updated_at: p.updatedAt // Now sending updatedAt
});

const mapDbToPerson = (db: any): Person => ({
    id: db.id,
    name: db.name,
    mobile: db.mobile,
    email: db.email,
    address: '',
    remarks: db.remarks,
    isFavorite: db.is_favorite,
    runningBalance: 0,
    createdAt: db.created_at,
    updatedAt: db.updated_at // Receiving updatedAt
});

const mapTransactionToDb = (t: Transaction, userId: string) => ({
    id: t.id,
    user_id: userId,
    amount: t.amount,
    type: t.type,
    giver_id: t.giverId,
    receiver_id: t.receiverId,
    date: t.date,
    category: t.category,
    description: t.description,
    payment_method: t.paymentMethod,
    is_recurring: t.isRecurring,
    recurring_frequency: t.recurringFrequency,
    updated_at: t.updatedAt
});

const mapDbToTransaction = (db: any): Transaction => ({
    id: db.id,
    amount: Number(db.amount),
    type: db.type,
    giverId: db.giver_id,
    receiverId: db.receiver_id,
    date: db.date,
    category: db.category,
    description: db.description,
    paymentMethod: db.payment_method,
    isRecurring: db.is_recurring,
    recurringFrequency: db.recurring_frequency,
    updatedAt: db.updated_at
});

interface FinanceState {
    people: Person[];
    transactions: Transaction[];
    settings: UserSettings;
    accounts: Account[];
    recurringRules: RecurringRule[];
    isSyncing: boolean; // UI State

    sync: () => Promise<void>;

    addPerson: (person: Person) => Promise<void>;
    updatePerson: (id: string, updates: Partial<Person>) => Promise<void>;
    deletePerson: (id: string) => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;

    addTransaction: (transaction: Transaction) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;

    addRecurringRule: (rule: RecurringRule) => void;
    deleteRecurringRule: (id: string) => void;
    updateRecurringRule: (id: string, updates: Partial<RecurringRule>) => void;
    processRecurringTransaction: (ruleId: string) => void;

    updateSettings: (settings: Partial<UserSettings>) => void;
    updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;

    getPersonBalance: (personId: string) => number;
}

export const useFinanceStore = create<FinanceState>()(
    persist(
        (set, get) => ({
            people: [],
            transactions: [],
            accounts: [],
            recurringRules: [],
            isSyncing: false,
            settings: {
                ownerName: 'My Name',
                ownerMobile: '',
                ownerEmail: '',
                currencySymbol: '₹',
                dateFormat: 'DD-MMM-YYYY',
                categories: ['Food', 'Transport', 'Rent', 'Bills', 'Shopping', 'Salary', 'Investment', 'Other'],
            },

            sync: async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;
                const userId = session.user.id;

                set({ isSyncing: true });
                console.log("Starting Sync...");

                // 1. Sync People
                const { data: dbPeople } = await supabase.from('people').select('*');
                if (dbPeople) {
                    const localPeople = get().people;
                    const dbPeopleMap = new Map(dbPeople.map(p => [p.id, p]));
                    const mergedPeople: Person[] = [];

                    // Process Local Items
                    for (const localPerson of localPeople) {
                        const dbPerson = dbPeopleMap.get(localPerson.id);

                        if (!dbPerson) {
                            // Local item (New) -> Upload to DB
                            // Note: In a real conflict scenario where it was deleted on server, we might re-upload. 
                            // Ideally handled by soft-deletes, but for MVP re-upload is safer than data loss.
                            await supabase.from('people').upsert(mapPersonToDb(localPerson, userId));
                            mergedPeople.push(localPerson);
                        } else {
                            // Conflict Resolution: Compare timestamps
                            const localTime = new Date(localPerson.updatedAt || localPerson.createdAt).getTime();
                            const dbTime = new Date(dbPerson.updated_at).getTime();

                            if (localTime > dbTime) {
                                // Local is newer -> Upload to DB
                                await supabase.from('people').upsert(mapPersonToDb(localPerson, userId));
                                mergedPeople.push(localPerson);
                            } else {
                                // Server is newer or equal -> Use Server
                                mergedPeople.push(mapDbToPerson(dbPerson));
                            }
                            dbPeopleMap.delete(localPerson.id); // Mark handled
                        }
                    }

                    // Process remaining DB Items (New on Server)
                    Array.from(dbPeopleMap.values()).forEach(dbPerson => {
                        mergedPeople.push(mapDbToPerson(dbPerson));
                    });

                    set({ people: mergedPeople });
                }

                // 2. Sync Transactions
                const { data: dbTransactions } = await supabase.from('transactions').select('*');
                if (dbTransactions) {
                    const localTx = get().transactions;
                    const dbTxMap = new Map(dbTransactions.map(t => [t.id, t]));
                    const mergedTx: Transaction[] = [];

                    // Process Local Items
                    for (const localT of localTx) {
                        const dbT = dbTxMap.get(localT.id);

                        if (!dbT) {
                            // New Local -> Upload
                            await supabase.from('transactions').upsert(mapTransactionToDb(localT, userId));
                            mergedTx.push(localT);
                        } else {
                            // Conflict
                            const localTime = new Date(localT.updatedAt || localT.date).getTime(); // Fallback to date if no updated_at
                            const dbTime = new Date(dbT.updated_at).getTime();

                            if (localTime > dbTime) {
                                // Local Newer -> Upload
                                await supabase.from('transactions').upsert(mapTransactionToDb(localT, userId));
                                mergedTx.push(localT);
                            } else {
                                // Server Newer -> Use Server
                                mergedTx.push(mapDbToTransaction(dbT));
                            }
                            dbTxMap.delete(localT.id);
                        }
                    }

                    // Process remaining Server Items
                    Array.from(dbTxMap.values()).forEach(dbT => {
                        mergedTx.push(mapDbToTransaction(dbT));
                    });

                    set({ transactions: mergedTx });
                }

                set({ isSyncing: false });
                console.log("Sync Complete");
            },

            addPerson: async (person) => {
                const newPerson = { ...person, updatedAt: new Date().toISOString() };
                set((state) => ({ people: [...state.people, newPerson] }));

                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    await supabase.from('people').insert(mapPersonToDb(newPerson, session.user.id));
                }
            },

            updatePerson: async (id, updates) => {
                const timestamp = new Date().toISOString();
                set((state) => ({
                    people: state.people.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: timestamp } : p)),
                }));
                const state = get();
                const updatedPerson = state.people.find(p => p.id === id);
                const { data: { session } } = await supabase.auth.getSession();
                if (session && updatedPerson) {
                    await supabase.from('people').update(mapPersonToDb(updatedPerson, session.user.id)).eq('id', id);
                }
            },

            deletePerson: async (id) => {
                set((state) => ({
                    people: state.people.filter((p) => p.id !== id),
                }));
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    await supabase.from('people').delete().eq('id', id);
                }
            },

            toggleFavorite: async (id) => {
                const timestamp = new Date().toISOString();
                set((state) => ({
                    people: state.people.map((p) => p.id === id ? { ...p, isFavorite: !p.isFavorite, updatedAt: timestamp } : p)
                }));
                const state = get();
                const updatedPerson = state.people.find(p => p.id === id);
                const { data: { session } } = await supabase.auth.getSession();
                if (session && updatedPerson) {
                    await supabase.from('people').update({ is_favorite: updatedPerson.isFavorite, updated_at: timestamp }).eq('id', id);
                }
            },

            addTransaction: async (transaction) => {
                const newTx = { ...transaction, updatedAt: new Date().toISOString() };
                set((state) => ({ transactions: [...state.transactions, newTx] }));
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    await supabase.from('transactions').insert(mapTransactionToDb(newTx, session.user.id));
                }
            },

            deleteTransaction: async (id) => {
                set((state) => ({
                    transactions: state.transactions.filter((t) => t.id !== id),
                }));
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    await supabase.from('transactions').delete().eq('id', id);
                }
            },

            updateSettings: (newSettings) => set((state) => ({
                settings: { ...state.settings, ...newSettings },
            })),

            updateTransaction: async (id, updates) => {
                const timestamp = new Date().toISOString();
                set((state) => ({
                    transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: timestamp } : t)),
                }));
                const state = get();
                const updatedTx = state.transactions.find(t => t.id === id);
                const { data: { session } } = await supabase.auth.getSession();
                if (session && updatedTx) {
                    await supabase.from('transactions').update(mapTransactionToDb(updatedTx, session.user.id)).eq('id', id);
                }
            },

            addRecurringRule: (rule) => set((state) => ({
                recurringRules: [...state.recurringRules, rule]
            })),

            deleteRecurringRule: (id) => set((state) => ({
                recurringRules: state.recurringRules.filter((r) => r.id !== id)
            })),

            updateRecurringRule: (id, updates) => set((state) => ({
                recurringRules: state.recurringRules.map((r) => r.id === id ? { ...r, ...updates } : r)
            })),

            processRecurringTransaction: (ruleId) => set((state) => {
                const rule = state.recurringRules.find(r => r.id === ruleId);
                if (!rule) return {};

                // Create new transaction
                const newTransaction: Transaction = {
                    ...rule.transactionDetails,
                    id: crypto.randomUUID(),
                    date: rule.nextDueDate,
                    isRecurring: true,
                    recurringFrequency: rule.frequency,
                    updatedAt: new Date().toISOString()
                };

                // Calculate next due date
                const currentDueDate = new Date(rule.nextDueDate);
                let nextDate = new Date(currentDueDate);

                if (rule.frequency === 'weekly') {
                    nextDate.setDate(currentDueDate.getDate() + 7);
                } else if (rule.frequency === 'monthly') {
                    nextDate.setMonth(currentDueDate.getMonth() + 1);
                } else if (rule.frequency === 'yearly') {
                    nextDate.setFullYear(currentDueDate.getFullYear() + 1);
                }

                const nextDueDateStr = nextDate.toISOString().split('T')[0];

                return {
                    transactions: [...state.transactions, newTransaction],
                    recurringRules: state.recurringRules.map(r =>
                        r.id === ruleId
                            ? { ...r, nextDueDate: nextDueDateStr, lastProcessedDate: new Date().toISOString() }
                            : r
                    )
                };
            }),

            getPersonBalance: (personId) => {
                const state = get();
                let balance = 0;
                state.transactions.forEach((t) => {
                    if (t.receiverId === personId) {
                        balance += t.amount;
                    } else if (t.giverId === personId) {
                        balance -= t.amount;
                    }
                });
                return balance;
            }
        }),
        {
            name: 'finance-storage',
            version: 1,
            migrate: (persistedState: any, version: number) => {
                if (version === 0) {
                    persistedState.settings = {
                        ...persistedState.settings,
                        categories: ['Food', 'Transport', 'Rent', 'Bills', 'Shopping', 'Salary', 'Investment', 'Other'],
                    };
                }
                return persistedState as FinanceState;
            },
        }
    )
);
