"use client";

import { LedgerTable } from "@/components/LedgerTable";
import { SettingsForm } from "@/components/SettingsForm";
import { TransactionModal } from "@/components/TransactionModal";
import { HelpSection } from "@/components/HelpSection";
import { PersonForm } from "@/components/PersonForm";
import { analyzeTransactions } from "@/utils/analyzeTransactions";
import { useFinanceStore } from "@/store/useFinanceStore";
import { SyncStatus } from "@/components/SyncStatus";
import { AuthForm } from "@/components/AuthForm";
import { supabase } from "@/lib/supabase";
import { Plus, Sparkles, Users, ArrowLeft, Wallet, Pencil, Trash2, MessageCircle, MessageSquare, Mail, Filter, HelpCircle, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { Person, Transaction } from "@/types";

export default function Home() {
    const [session, setSession] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setAuthLoading(false);
            if (session) {
                useFinanceStore.getState().sync();
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                useFinanceStore.getState().sync();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isPersonFormOpen, setIsPersonFormOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);

    // ... (rest of state)



    // Tab State
    const [activeTab, setActiveTab] = useState<'ledger' | 'people' | 'settings' | 'help'>('ledger');

    // Selected Person State for Person Ledger View
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [filterCategory, setFilterCategory] = useState<string>("All");
    const [filterType, setFilterType] = useState<string>("All");
    const [filterPerson, setFilterPerson] = useState<string>("All");

    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const { transactions, people, settings, getPersonBalance } = useFinanceStore();

    // specific unique categories for filter dropdown
    const availableCategories = Array.from(new Set(transactions.map(t => t.category))).sort();

    const handleRunAnalysis = async () => {
        setAiAnalysis("Analyzing...");
        const result = await analyzeTransactions(transactions);
        setAiAnalysis(result.summary + "\n\nInsights:\n" + result.insights.join("\n"));
    };

    const handlePersonClick = (person: Person) => {
        setSelectedPerson(person);
    };

    const handleBackToPeopleList = () => {
        setSelectedPerson(null);
    };

    const handleEditTransaction = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsTransactionModalOpen(true);
    };

    // Reset editing state when closing modal
    const handleCloseModal = () => {
        setIsTransactionModalOpen(false);
        setEditingTransaction(null);
    };

    const handleDeleteTransaction = (id: string) => {
        if (window.confirm("Are you sure you want to delete this transaction?")) {
            useFinanceStore.getState().deleteTransaction(id);
        }
    };

    const handleEditPerson = (e: React.MouseEvent, person: Person) => {
        e.stopPropagation();
        setEditingPerson(person);
        setIsPersonFormOpen(true);
    };

    const handleDeletePerson = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this person? This will not delete their transactions but will remove them from the list.")) {
            useFinanceStore.getState().deletePerson(id);
            if (selectedPerson?.id === id) {
                setSelectedPerson(null);
            }
        }
    };

    const handleClosePersonForm = () => {
        setIsPersonFormOpen(false);
        setEditingPerson(null);
    };

    // Recurring Transactions Logic
    const { recurringRules, processRecurringTransaction } = useFinanceStore();
    const [dueRecurringRules, setDueRecurringRules] = useState<any[]>([]);
    const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);

    useEffect(() => {
        const checkDueRecurring = () => {
            const today = new Date().toISOString().split('T')[0];
            const dueRules = recurringRules.filter(rule => rule.nextDueDate <= today);

            if (dueRules.length > 0) {
                setDueRecurringRules(dueRules);
                setIsRecurringModalOpen(true);
            }
        };

        // Check on mount
        checkDueRecurring();
    }, [recurringRules]);

    const handleProcessRecurring = (ruleId: string) => {
        processRecurringTransaction(ruleId);
        // Update local state to remove processed rule
        setDueRecurringRules(prev => prev.filter(r => r.id !== ruleId));
        if (dueRecurringRules.length <= 1) {
            setIsRecurringModalOpen(false);
        }
    };

    const handleSkipRecurring = (ruleId: string) => {
        // For now, skipping just means we don't process it today.
        // Ideally we might want to bump the date without creating a transaction.
        // But for MVP, let's just say "Skip" means "Postpone to next time" or just "Ignore for now"
        // If we want to skip THIS occurrence, we should probably update the nextDueDate manually.
        // Let's implement skip as: Update nextDueDate without creating transaction.

        // We reuse logic but need a "skipRecurring" action in store? 
        // Or just let user manually edit. 
        // Simpler: Just close for now. It will pop up again next reload unless we change date.
        // Let's implement a 'skip' that bumps the date.

        // Accessing store directly for custom skip logic if needed, or add skipRecurringRule to store.
        // For now, let's just process it to update the date but DELETE the transaction immediately? No that's hacky.
        // Proper way: Add skipRecurringRule to store. 
        // STARTUP_PLAN_ADJUSTMENT: I'll just use processRecurringTransaction but maybe we need a dedicated skip?
        // Let's just allow "Process" for now. User can delete transaction if they don't want it, or we add skip later.
        // Actually, let's just Close the modal if they don't want to process.
        setDueRecurringRules(prev => prev.filter(r => r.id !== ruleId));
        if (dueRecurringRules.length <= 1) {
            setIsRecurringModalOpen(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black text-green-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
            </div>
        );
    }

    if (!session) {
        return <AuthForm onLogin={() => { }} />;
    }

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans">
            <div className="max-w-5xl mx-auto px-4 py-8">
                <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-green-700 dark:text-green-500">Ledger Green</h1>
                        <p className="text-gray-500 dark:text-gray-400">Personal Accounting Assistant</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <SyncStatus />
                        <button
                            onClick={handleRunAnalysis}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors font-medium text-sm dark:bg-purple-900/30 dark:text-purple-300"
                        >
                            <Sparkles className="w-4 h-4" />
                            AI Insights
                        </button>
                        <button
                            onClick={() => setIsTransactionModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg shadow-md transition-all font-medium text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            New Entry
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-gray-400 dark:hover:bg-red-900/20"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {aiAnalysis && (
                    <div className="mb-8 p-4 bg-purple-50 border border-purple-100 rounded-xl text-purple-900 dark:bg-purple-900/10 dark:border-purple-800 dark:text-purple-100 whitespace-pre-wrap">
                        <div className="flex items-center gap-2 font-semibold mb-2">
                            <Sparkles className="w-4 h-4" />
                            Gemini Analysis
                        </div>
                        {aiAnalysis}
                    </div>
                )}

                {/* Main Navigation Tabs - Hide when viewing specific person */}
                {!selectedPerson && (
                    <div className="flex items-center gap-6 mb-6 border-b border-gray-200 dark:border-zinc-800 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('ledger')}
                            className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'ledger' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                        >
                            Day Book
                            {activeTab === 'ledger' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 dark:bg-green-400 rounded-full" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('people')}
                            className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'people' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                        >
                            People & Ledgers
                            {activeTab === 'people' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 dark:bg-green-400 rounded-full" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'settings' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                        >
                            Settings
                            {activeTab === 'settings' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 dark:bg-green-400 rounded-full" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('help')}
                            className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'help' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                        >
                            <span className="flex items-center gap-1.5">
                                <HelpCircle className="w-4 h-4" />
                                Help
                            </span>
                            {activeTab === 'help' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 dark:bg-green-400 rounded-full" />}
                        </button>
                    </div>
                )}

                <div className="min-h-[400px]">
                    {/* View: All Transactions */}
                    {activeTab === 'ledger' && !selectedPerson && (
                        <div className="space-y-4">
                            {/* Filter Bar */}
                            <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm font-medium">
                                    <Filter className="w-4 h-4" />
                                    Filters:
                                </div>

                                {/* Date Range */}
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 p-1 rounded-lg border border-gray-200 dark:border-zinc-700">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-transparent text-sm border-none focus:ring-0 p-1 text-gray-600 dark:text-gray-300 w-32"
                                        placeholder="Start Date"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-transparent text-sm border-none focus:ring-0 p-1 text-gray-600 dark:text-gray-300 w-32"
                                        placeholder="End Date"
                                    />
                                </div>

                                {/* Person Filter */}
                                <select
                                    value={filterPerson}
                                    onChange={(e) => setFilterPerson(e.target.value)}
                                    className="bg-gray-50 dark:bg-zinc-800 text-sm border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-green-500 focus:border-green-500 p-1.5 text-gray-700 dark:text-gray-300"
                                >
                                    <option value="All">All People</option>
                                    {people.map(person => (
                                        <option key={person.id} value={person.id}>{person.name}</option>
                                    ))}
                                </select>

                                {/* Category Filter */}
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="bg-gray-50 dark:bg-zinc-800 text-sm border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-green-500 focus:border-green-500 p-1.5 text-gray-700 dark:text-gray-300"
                                >
                                    <option value="All">All Categories</option>
                                    {availableCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>

                                {/* Type Filter */}
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="bg-gray-50 dark:bg-zinc-800 text-sm border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-green-500 focus:border-green-500 p-1.5 text-gray-700 dark:text-gray-300"
                                >
                                    <option value="All">All Types</option>
                                    <option value="Income">Income (Credit)</option>
                                    <option value="Expense">Expense (Debit)</option>
                                </select>

                                {/* Clear Filters */}
                                {(startDate || endDate || filterCategory !== 'All' || filterType !== 'All' || filterPerson !== 'All') && (
                                    <button
                                        onClick={() => {
                                            setStartDate("");
                                            setEndDate("");
                                            setFilterCategory("All");
                                            setFilterType("All");
                                            setFilterPerson("All");
                                        }}
                                        className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>

                            <LedgerTable
                                personId={filterPerson === 'All' ? undefined : filterPerson}
                                startDate={startDate}
                                endDate={endDate}
                                filterCategory={filterCategory}
                                filterType={filterType}
                                onEdit={handleEditTransaction}
                                onDelete={handleDeleteTransaction}
                            />
                        </div>
                    )}

                    {/* View: People List or Single Person Ledger */}
                    {activeTab === 'people' && (
                        selectedPerson ? (
                            // Single Person View
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleBackToPeopleList}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedPerson.name}</h2>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <span>{selectedPerson.mobile || "No Mobile"}</span>
                                            {selectedPerson.email && <span>• {selectedPerson.email}</span>}
                                        </div>
                                    </div>
                                    <div className="ml-auto flex items-center gap-4">

                                        {/* Communication Actions */}
                                        <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-1 rounded-lg border border-gray-200 dark:border-zinc-800">
                                            {/* WhatsApp */}
                                            {selectedPerson.mobile && (
                                                <a
                                                    href={`https://wa.me/${selectedPerson.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(
                                                        `Hello ${selectedPerson.name}, your current balance with Ledger Green is ${settings.currencySymbol}${getPersonBalance(selectedPerson.id).toLocaleString()}. Please review.`
                                                    )}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                                                    title="Send WhatsApp"
                                                >
                                                    <MessageCircle className="w-5 h-5" />
                                                </a>
                                            )}

                                            {/* SMS */}
                                            {selectedPerson.mobile && (
                                                <a
                                                    href={`sms:${selectedPerson.mobile.replace(/\D/g, '')}?body=${encodeURIComponent(
                                                        `Hello ${selectedPerson.name}, your current balance with Ledger Green is ${settings.currencySymbol}${getPersonBalance(selectedPerson.id).toLocaleString()}.`
                                                    )}`}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                                    title="Send SMS"
                                                >
                                                    <MessageSquare className="w-5 h-5" />
                                                </a>
                                            )}

                                            {/* Email */}
                                            {selectedPerson.email && (
                                                <a
                                                    href={`mailto:${selectedPerson.email}?subject=${encodeURIComponent(
                                                        `Balance Statement - ${selectedPerson.name}`
                                                    )}&body=${encodeURIComponent(
                                                        `Hello ${selectedPerson.name},\n\nYour current balance with Ledger Green is ${settings.currencySymbol}${getPersonBalance(selectedPerson.id).toLocaleString()}.\n\nPlease review your transactions.\n\nRegards,\nLedger Green`
                                                    )}`}
                                                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                                                    title="Send Email"
                                                >
                                                    <Mail className="w-5 h-5" />
                                                </a>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1 rounded-lg border border-gray-200 dark:border-zinc-800">
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="bg-transparent text-sm border-none focus:ring-0 p-1 text-gray-600 dark:text-gray-300"
                                            />
                                            <span className="text-gray-400">-</span>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="bg-transparent text-sm border-none focus:ring-0 p-1 text-gray-600 dark:text-gray-300"
                                            />
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg border border-green-100 dark:border-green-900/50">
                                            <div className="text-xs text-green-600 dark:text-green-400 uppercase font-semibold">Net Balance</div>
                                            <div className="text-xl font-bold text-green-700 dark:text-green-300">
                                                {settings.currencySymbol}{Math.abs(getPersonBalance(selectedPerson.id)).toLocaleString()}
                                                <span className={`text-sm ml-1 ${getPersonBalance(selectedPerson.id) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {getPersonBalance(selectedPerson.id) >= 0 ? "Dr" : "Cr"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <LedgerTable
                                    personId={selectedPerson.id}
                                    startDate={startDate}
                                    endDate={endDate}
                                    onEdit={handleEditTransaction}
                                    onDelete={handleDeleteTransaction}
                                />
                            </div>
                        ) : (
                            // All People List
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Contacts</h3>
                                    <button
                                        onClick={() => setIsPersonFormOpen(true)}
                                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700 flex items-center gap-2"
                                    >
                                        <Users className="w-4 h-4" />
                                        Add New Person
                                    </button>
                                </div>

                                {people.length === 0 ? (
                                    <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
                                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No people added yet.</p>
                                        <button
                                            onClick={() => setIsPersonFormOpen(true)}
                                            className="mt-2 text-green-600 hover:text-green-700 text-sm font-medium"
                                        >
                                            Add your first contact
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {people.map(person => {
                                            const balance = getPersonBalance(person.id);
                                            return (
                                                <div
                                                    key={person.id}
                                                    onClick={() => handlePersonClick(person)}
                                                    className="group cursor-pointer p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-green-200 dark:hover:border-green-800 transition-all"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-700 dark:text-green-300 font-bold group-hover:bg-green-200 transition-colors">
                                                                {person.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">{person.name}</h4>
                                                                <p className="text-xs text-gray-500">{person.mobile || "No mobile"}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => handleEditPerson(e, person)}
                                                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeletePerson(e, person.id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t border-gray-50 dark:border-zinc-800 flex justify-between items-center text-sm">
                                                        <span className="text-gray-500 flex items-center gap-1">
                                                            <Wallet className="w-3 h-3" /> Balance
                                                        </span>
                                                        <span className={`font-medium ${balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                            {balance >= 0 ? '+' : ''}{settings.currencySymbol}{balance.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    )}

                    {activeTab === 'settings' && <SettingsForm />}
                    {activeTab === 'help' && <HelpSection />}
                </div>
            </div>

            <TransactionModal
                isOpen={isTransactionModalOpen}
                onClose={handleCloseModal}
                editTransaction={editingTransaction}
            />

            <PersonForm
                isOpen={isPersonFormOpen}
                onClose={handleClosePersonForm}
                initialData={editingPerson}
            />

            {/* Recurring Transactions Modal */}
            {isRecurringModalOpen && dueRecurringRules.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-500" />
                                Recurring Transactions Due
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                The following scheduled transactions are due. Would you like to add them now?
                            </p>

                            <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto">
                                {dueRecurringRules.map(rule => (
                                    <div key={rule.id} className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-100 dark:border-zinc-700 flex justify-between items-center group">
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                {rule.transactionDetails.description || rule.transactionDetails.category}
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 capitalize">
                                                    {rule.frequency}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                                <span>{settings.currencySymbol}{rule.transactionDetails.amount}</span>
                                                <span>•</span>
                                                <span className={rule.transactionDetails.type === 'Income' ? 'text-green-600' : 'text-red-500'}>
                                                    {rule.transactionDetails.type}
                                                </span>
                                                <span>•</span>
                                                <span>{rule.nextDueDate}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleProcessRecurring(rule.id)}
                                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setIsRecurringModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    Close / Remind Later
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
