
export type TransactionType = 'Income' | 'Expense' | 'Transfer';

export interface Transaction {
    id: string;
    amount: number;
    type: TransactionType;
    giverId: string; // "SELF" if Expense, PersonID if Income (or specific account)
    receiverId: string; // "SELF" if Income, PersonID if Expense (or specific account)
    date: string;
    category: string;
    description?: string;
    paymentMethod: string;
    attachments?: string[];
    isRecurring?: boolean;
    recurringFrequency?: 'weekly' | 'monthly' | 'yearly';
    updatedAt?: string;
}

export interface Person {
    id: string;
    name: string;
    mobile?: string;
    email?: string;
    address?: string;
    remarks?: string;
    isFavorite: boolean;
    runningBalance: number;
    createdAt: string;
    updatedAt?: string;
}

export interface UserSettings {
    ownerName: string;
    ownerMobile: string;
    ownerEmail: string;
    currencySymbol: string;
    dateFormat: string;
    categories: string[]; // List of available categories
}

export interface Account {
    id: string;
    name: string; // e.g. "HDFC Bank", "Cash Wallet"
    type: 'Bank' | 'Wallet' | 'CreditCard';
    balance: number;
}

export interface RecurringRule {
    id: string;
    frequency: 'weekly' | 'monthly' | 'yearly';
    nextDueDate: string;
    transactionDetails: Omit<Transaction, 'id' | 'date' | 'isRecurring' | 'recurringFrequency'>;
    lastProcessedDate?: string;
}
