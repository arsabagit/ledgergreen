"use client";

import { useFinanceStore } from "@/store/useFinanceStore";
import { Transaction } from "@/types";

import { Search, Edit2, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { formatDate } from "@/utils/formatDate";

interface LedgerTableProps {
    personId?: string;
    startDate?: string;
    endDate?: string;
    filterCategory?: string;
    filterType?: string;
    onEdit?: (transaction: Transaction) => void;
    onDelete?: (id: string) => void;
}

export function LedgerTable({ personId, startDate, endDate, filterCategory, filterType, onEdit, onDelete }: LedgerTableProps) {
    const { transactions, people, settings } = useFinanceStore();
    const [searchTerm, setSearchTerm] = useState("");

    // 1. Calculate Opening Balance (Before startDate)
    const openingBalance = useMemo(() => {
        if (!personId || !startDate) return 0;

        let obData = transactions.filter(t => (t.giverId === personId || t.receiverId === personId) && t.date < startDate);

        if (filterCategory && filterCategory !== 'All') {
            obData = obData.filter(t => t.category === filterCategory);
        }

        if (filterType && filterType !== 'All') {
            obData = obData.filter(t => t.type === filterType);
        }

        return obData.reduce((acc, t) => {
            if (t.type === 'Expense') {
                // Expense: Money Out -> Person. Person Owes Us (+)
                return acc + t.amount;
            } else {
                // Income: Money In <- Person. We Owe Person / Debt Reduces (-)
                return acc - t.amount;
            }
        }, 0);
    }, [transactions, personId, startDate, filterCategory, filterType]);

    // 2. Filter Transactions (by Person, Date Range, Search, Category, Type)
    const filteredTransactions = useMemo(() => {
        let data = transactions;

        if (personId) {
            data = data.filter(t => t.giverId === personId || t.receiverId === personId);
        }

        if (startDate) {
            data = data.filter(t => t.date >= startDate);
        }

        if (endDate) {
            data = data.filter(t => t.date <= endDate);
        }

        if (filterCategory && filterCategory !== 'All') {
            data = data.filter(t => t.category === filterCategory);
        }

        if (filterType && filterType !== 'All') {
            data = data.filter(t => t.type === filterType);
        }

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            data = data.filter((t) =>
                t.description?.toLowerCase().includes(lowerTerm) ||
                t.category.toLowerCase().includes(lowerTerm) ||
                t.amount.toString().includes(lowerTerm)
            );
        }

        return data;
    }, [transactions, personId, startDate, endDate, searchTerm, filterCategory, filterType]);

    // 3. Calculate Running Balances & Prepare Row Data
    const { rows, closingBalance } = useMemo(() => {
        // Sort Oldest -> Newest to calculate running balance correctly
        const sortedData = [...filteredTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (!personId) {
            // Logic for All Transactions (Day Book)
            // We need to track running balances for ALL people involved.
            const personBalances: Record<string, number> = {};

            const rowsWithBalance = sortedData.map(t => {
                const otherPersonId = t.type === 'Income' ? t.giverId : t.receiverId;
                const person = people.find(p => p.id === otherPersonId);
                const personName = person?.name || (otherPersonId === 'OTHER' ? 'General' : 'Unknown');

                let currentBal = personBalances[otherPersonId] || 0;

                // Calculate impact
                if (t.type === 'Expense') {
                    currentBal += t.amount;
                } else {
                    currentBal -= t.amount;
                }

                personBalances[otherPersonId] = currentBal;

                return { ...t, personName, runningBalance: currentBal };
            });

            return { rows: rowsWithBalance.reverse(), closingBalance: 0 };
        }

        let currentRunningBalance = openingBalance;

        const dataWithBalance = sortedData.map(t => {
            const amount = t.amount;

            // Calculate impact on THIS person's balance
            if (t.type === 'Expense') {
                currentRunningBalance += amount;
            } else {
                currentRunningBalance -= amount;
            }

            return {
                ...t,
                personName: people.find(p => p.id === personId)?.name || "Unknown",
                runningBalance: currentRunningBalance
            };
        });

        // Reverse to show Newest First for display
        return {
            rows: dataWithBalance.reverse(),
            closingBalance: currentRunningBalance
        };

    }, [filteredTransactions, people, personId, openingBalance]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {personId ? "Transaction History" : "Day Book"}
                </h3>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-gray-400 font-medium">
                        <tr>
                            <th className="px-6 py-3 whitespace-nowrap">Date</th>
                            <th className="px-6 py-3">Details</th>
                            <th className="px-6 py-3 text-right">Debit (Out)</th>
                            <th className="px-6 py-3 text-right">Credit (In)</th>
                            <th className="px-6 py-3 text-right">Balance</th>
                            {(onEdit || onDelete) && <th className="px-6 py-3 text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">

                        {personId && startDate && (
                            <tr className="bg-green-50/50 dark:bg-green-900/10 font-semibold border-b border-green-100 dark:border-green-900/30">
                                <td className="px-6 py-3" colSpan={4}>Closing Balance</td>
                                <td className="px-6 py-3 text-right text-gray-800 dark:text-white">
                                    {settings.currencySymbol}{Math.abs(closingBalance).toLocaleString()}
                                    <span className={`text-xs ml-1 ${closingBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {closingBalance >= 0 ? "Dr" : "Cr"}
                                    </span>
                                </td>
                                <td></td>
                            </tr>
                        )}

                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No transactions found in this period.
                                </td>
                            </tr>
                        ) : (
                            rows.map((t) => {
                                const isExpense = t.type === 'Expense';
                                const isIncome = t.type === 'Income';

                                return (
                                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors group">
                                        <td className="px-6 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap align-top">
                                            {formatDate(t.date, settings.dateFormat)}
                                        </td>
                                        <td className="px-6 py-3 align-top">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    {t.personName}
                                                </span>
                                                <span className="text-gray-500 text-xs">
                                                    {t.category}
                                                    {t.description && ` • ${t.description}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right align-top font-medium text-red-600">
                                            {isExpense ? `${settings.currencySymbol}${t.amount.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-6 py-3 text-right align-top font-medium text-green-600">
                                            {isIncome ? `${settings.currencySymbol}${t.amount.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-6 py-3 text-right align-top font-medium text-gray-700 dark:text-gray-300">
                                            {settings.currencySymbol}{Math.abs(t.runningBalance).toLocaleString()}
                                            <span className={`text-xs ml-1 ${t.runningBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {t.runningBalance >= 0 ? "Dr" : "Cr"}
                                            </span>
                                        </td>
                                        {(onEdit || onDelete) && (
                                            <td className="px-6 py-3 text-right align-top">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {onEdit && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onEdit(t); }}
                                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {onDelete && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}

                        {/* Opening Balance Row (Bottom if Newest First) */}
                        {personId && startDate && (
                            <tr className="bg-gray-50/50 dark:bg-zinc-800/10 font-semibold border-t border-gray-100 dark:border-zinc-800">
                                <td className="px-6 py-3 text-gray-500">
                                    {formatDate(startDate, settings.dateFormat)}
                                </td>
                                <td className="px-6 py-3" colSpan={3}>Opening Balance b/f</td>
                                <td className="px-6 py-3 text-right text-gray-800 dark:text-white">
                                    {settings.currencySymbol}{Math.abs(openingBalance).toLocaleString()}
                                    <span className={`text-xs ml-1 ${openingBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {openingBalance >= 0 ? "Dr" : "Cr"}
                                    </span>
                                </td>
                                <td></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
