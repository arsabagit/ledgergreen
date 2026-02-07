import { BookOpen, HelpCircle, FileText, Info, ShieldCheck, Database, Repeat, Search } from "lucide-react";

export function HelpSection() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <HelpCircle className="w-8 h-8" />
                    Help & Support
                </h1>
                <p className="opacity-90">
                    Learn how to make the most of Ledger Green.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Getting Started */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-green-600" />
                        Getting Started
                    </h2>
                    <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex gap-2">
                            <span className="font-bold text-green-600">1.</span>
                            <span>Go to <strong>People & Ledgers</strong> and add a person (e.g., "Shopkeeper" or "Friend").</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-green-600">2.</span>
                            <span>Click on their name to open their ledger.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-green-600">3.</span>
                            <span>Add a <strong>Transaction</strong> (Income or Expense).</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-green-600">4.</span>
                            <span>Check <strong>Day Book</strong> to see all daily transactions.</span>
                        </li>
                    </ul>
                </div>

                {/* Key Features */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Key Features
                    </h2>
                    <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-200 flex items-center gap-1.5 mb-1">
                                <Repeat className="w-4 h-4 text-indigo-500" /> Recurring Transactions
                            </h3>
                            <p>Set up automatic entries for Rent, Salary, or Interest in the <strong>People</strong> view.</p>
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-200 flex items-center gap-1.5 mb-1">
                                <Search className="w-4 h-4 text-purple-500" /> Advanced Filters
                            </h3>
                            <p>In <strong>Day Book</strong>, filter by Person, Category, Type (Income/Expense), and Date Range.</p>
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-200 flex items-center gap-1.5 mb-1">
                                <Database className="w-4 h-4 text-orange-500" /> Data Backup
                            </h3>
                            <p>Go to <strong>Settings</strong> to Export/Import your data. Always backup before clearing browser data!</p>
                        </div>
                    </div>
                </div>

                {/* FAQ */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-red-600" />
                        Common Questions
                    </h2>
                    <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-gray-200">Where is my data stored?</p>
                            <p className="mt-1">Locally on your device (in the browser). We do not send your financial data to any cloud server.</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-gray-200">What if I clear my browser cache?</p>
                            <p className="mt-1 text-red-500">You will lose your data!</p>
                            <p>Please use the <strong>Export Backup</strong> feature in Settings regularly.</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-gray-200">Can I access this on mobile?</p>
                            <p className="mt-1">Yes, this app is responsive. You can open the same URL on your phone, but data does not sync between devices automatically (unless you Export/Import).</p>
                        </div>
                    </div>
                </div>

                {/* About */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5 text-gray-600" />
                        About Ledger Green
                    </h2>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                        <p><strong>Version:</strong> 1.0.0</p>
                        <p>A simple, privacy-focused personal accounting assistant designed to help you track your daily transactions and manage ledgers with ease.</p>
                        <p className="pt-2 border-t border-gray-100 dark:border-zinc-800 mt-2">
                            Built with ❤️ for simple financial management.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
