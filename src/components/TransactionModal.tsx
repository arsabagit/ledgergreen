"use client";

import { useState, useEffect } from "react";
import { useFinanceStore } from "@/store/useFinanceStore";
import { X, Check, ArrowUpCircle, ArrowDownCircle, Repeat } from "lucide-react";
import { Transaction, TransactionType } from "@/types";

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    editTransaction?: Transaction | null;
}

export function TransactionModal({ isOpen, onClose, editTransaction }: TransactionModalProps) {
    const { addTransaction, updateTransaction, people, settings } = useFinanceStore();

    // Form State
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState(settings.categories[0] || "Food");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [type, setType] = useState<TransactionType>('Expense');
    const [selectedPersonId, setSelectedPersonId] = useState("OTHER");

    // Recurring State
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringFrequency, setRecurringFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

    // Load data if editing
    useEffect(() => {
        if (editTransaction) {
            setAmount(editTransaction.amount.toString());
            setDescription(editTransaction.description || "");
            setCategory(editTransaction.category);
            setDate(editTransaction.date);
            setType(editTransaction.type);

            // Determine selectedPersonId based on type and giver/receiver
            if (editTransaction.type === 'Expense') {
                setSelectedPersonId(editTransaction.receiverId);
            } else {
                setSelectedPersonId(editTransaction.giverId);
            }
        } else {
            // Reset to defaults if opening new
            setAmount("");
            setDescription("");
            setCategory(settings.categories[0] || "Food");
            setDate(new Date().toISOString().split("T")[0]);
            setType('Expense');
            setSelectedPersonId("OTHER");
            setIsRecurring(false);
            setRecurringFrequency('monthly');
        }
    }, [editTransaction, isOpen, settings.categories]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let giverId = "SELF";
        let receiverId = "SELF";

        if (type === 'Expense') {
            giverId = "SELF";
            receiverId = selectedPersonId; // 'OTHER' or PersonID
        } else if (type === 'Income') {
            receiverId = "SELF";
            giverId = selectedPersonId; // 'OTHER' or PersonID
        }

        const transactionData: Transaction = {
            id: editTransaction ? editTransaction.id : crypto.randomUUID(),
            amount: parseFloat(amount),
            type,
            giverId,
            receiverId,
            date,
            category,
            description,
            paymentMethod: "Cash", // Defaulting for now
        };

        if (editTransaction) {
            updateTransaction(editTransaction.id, transactionData);
        } else {
            addTransaction(transactionData);

            // If it's a new transaction AND recurring, creating the rule for FUTURE.
            // The Logic: The user just added the FIRST instance (e.g. today).
            // We create a rule that starts NEXT frequency.
            if (isRecurring) {
                const ruleId = crypto.randomUUID();

                // Calculate next due date based on the transaction date
                const transactionDate = new Date(date);
                let nextDate = new Date(transactionDate);

                if (recurringFrequency === 'weekly') {
                    nextDate.setDate(transactionDate.getDate() + 7);
                } else if (recurringFrequency === 'monthly') {
                    nextDate.setMonth(transactionDate.getMonth() + 1);
                } else if (recurringFrequency === 'yearly') {
                    nextDate.setFullYear(transactionDate.getFullYear() + 1);
                }

                const nextDueDateStr = nextDate.toISOString().split('T')[0];

                const { id, isRecurring: _isRecurring, recurringFrequency: _freq, ...details } = transactionData;

                useFinanceStore.getState().addRecurringRule({
                    id: ruleId,
                    frequency: recurringFrequency,
                    nextDueDate: nextDueDateStr,
                    transactionDetails: details,
                });
            }
        }

        handleClose();
    };

    const handleClose = () => {
        setAmount("");
        setDescription("");
        setType('Expense');
        setSelectedPersonId("OTHER");
        setIsRecurring(false);
        setRecurringFrequency('monthly');
        onClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {editTransaction ? "Edit Transaction" : "New Transaction"}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Income / Expense Toggle */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setType('Expense')}
                            className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${type === 'Expense'
                                ? 'bg-white text-red-600 shadow-sm dark:bg-zinc-700 dark:text-red-400'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                }`}
                        >
                            <ArrowUpCircle className="w-4 h-4" />
                            Expense
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('Income')}
                            className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${type === 'Income'
                                ? 'bg-white text-green-600 shadow-sm dark:bg-zinc-700 dark:text-green-400'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                }`}
                        >
                            <ArrowDownCircle className="w-4 h-4" />
                            Income
                        </button>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Amount
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500 font-semibold">
                                {settings.currencySymbol}
                            </span>
                            <input
                                type="number"
                                required
                                step="0.01"
                                className="pl-8 w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-800 dark:border-zinc-700 font-mono text-lg"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Date
                            </label>
                            <input
                                type="date"
                                required
                                className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-800 dark:border-zinc-700"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Category
                            </label>
                            <select
                                className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-800 dark:border-zinc-700"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {settings.categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Person / Party Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {type === 'Expense' ? 'Paid To' : 'Received From'}
                        </label>
                        <select
                            className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-800 dark:border-zinc-700"
                            value={selectedPersonId}
                            onChange={(e) => setSelectedPersonId(e.target.value)}
                        >
                            <option value="OTHER">{type === 'Expense' ? 'General / Merchant' : 'General / Source'}</option>
                            <optgroup label="People">
                                {people.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </optgroup>
                        </select>
                        {people.length === 0 && (
                            <p className="text-xs text-gray-500 mt-1">Add people in settings to track debts.</p>
                        )}
                    </div>

                    {/* Recurring Option - Only for new transactions for now */}
                    {!editTransaction && (
                        <div className="bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-gray-100 dark:border-zinc-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={isRecurring}
                                        onChange={(e) => setIsRecurring(e.target.checked)}
                                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500 border-gray-300 dark:bg-zinc-700 dark:border-zinc-600"
                                    />
                                    <span className="flex items-center gap-1">
                                        <Repeat className="w-3.5 h-3.5" />
                                        Make Recurring
                                    </span>
                                </label>
                            </div>

                            {isRecurring && (
                                <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        Frequency
                                    </label>
                                    <select
                                        className="w-full text-sm rounded-md border border-gray-300 py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-800 dark:border-zinc-700"
                                        value={recurringFrequency}
                                        onChange={(e) => setRecurringFrequency(e.target.value as any)}
                                    >
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Next occurrence will be automatically scheduled.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Note <span className="text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <textarea
                            className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-800 dark:border-zinc-700"
                            rows={2}
                            placeholder="What was this for?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-2 ${type === 'Expense'
                                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                }`}
                        >
                            <Check className="w-4 h-4" />
                            {editTransaction ? "Update" : `Save ${type}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
