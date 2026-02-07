"use client";

import { useFinanceStore } from "@/store/useFinanceStore";
import { User, Settings, Save, Plus, X, Tag, Download, Upload, Trash2, AlertTriangle, Database } from "lucide-react";
import { useState, useEffect } from "react";

export function SettingsForm() {
    const { settings, updateSettings } = useFinanceStore();
    const [formData, setFormData] = useState(settings);
    const [newCategory, setNewCategory] = useState("");

    // Sync state if settings change (e.g. initial load)
    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateSettings(formData);
        alert("Settings Saved!");
    };

    const addCategory = () => {
        if (!newCategory.trim()) return;
        if (formData.categories.includes(newCategory.trim())) return;

        setFormData({
            ...formData,
            categories: [...formData.categories, newCategory.trim()]
        });
        setNewCategory("");
    };

    const removeCategory = (catToRemove: string) => {
        setFormData({
            ...formData,
            categories: formData.categories.filter(c => c !== catToRemove)
        });
    };

    // Data Management
    const handleExport = () => {
        const state = useFinanceStore.getState();
        const dataToExport = {
            people: state.people,
            transactions: state.transactions,
            settings: state.settings,
            accounts: state.accounts,
            recurringRules: state.recurringRules,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ledger-green-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const data = JSON.parse(content);

                // Basic validation
                if (!Array.isArray(data.people) || !Array.isArray(data.transactions)) {
                    throw new Error("Invalid backup file format");
                }

                if (window.confirm("This will REPLACE all current data with the backup. Are you sure?")) {
                    useFinanceStore.setState({
                        people: data.people || [],
                        transactions: data.transactions || [],
                        settings: data.settings || settings,
                        accounts: data.accounts || [],
                        recurringRules: data.recurringRules || []
                    });
                    alert("Data restored successfully!");
                    // Force reload/re-render might be needed to update form state
                    setFormData(data.settings || settings);
                }
            } catch (error) {
                console.error("Import failed:", error);
                alert("Failed to import data. Invalid file format.");
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    const handleReset = () => {
        if (window.confirm("WARNING: This will PERMANENTLY DELETE ALL DATA. This action cannot be undone. Are you absolutely sure?")) {
            // Second confirmation
            if (window.confirm("Really delete everything?")) {
                useFinanceStore.setState({
                    people: [],
                    transactions: [],
                    accounts: [],
                    recurringRules: [],
                    // Keep default settings or reset them? Let's reset but keep owner name if possible? No, full reset.
                    settings: {
                        ownerName: 'My Name',
                        ownerMobile: '',
                        ownerEmail: '',
                        currencySymbol: '₹',
                        dateFormat: 'DD-MMM-YYYY',
                        categories: ['Food', 'Transport', 'Rent', 'Bills', 'Shopping', 'Salary', 'Investment', 'Other'],
                    }
                });
                // Update local form state
                setFormData({
                    ownerName: 'My Name',
                    ownerMobile: '',
                    ownerEmail: '',
                    currencySymbol: '₹',
                    dateFormat: 'DD-MMM-YYYY',
                    categories: ['Food', 'Transport', 'Rent', 'Bills', 'Shopping', 'Salary', 'Investment', 'Other'],
                });
                alert("All data has been reset.");
            }
        }
    };



    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-6 text-green-700 dark:text-green-400">
                <Settings className="w-5 h-5" />
                <h2 className="text-xl font-semibold">App Settings</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Owner Name
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={formData.ownerName}
                                onChange={(e) =>
                                    setFormData({ ...formData, ownerName: e.target.value })
                                }
                                className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-800 dark:border-zinc-700"
                                placeholder="Your Name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Mobile Number
                        </label>
                        <input
                            type="text"
                            value={formData.ownerMobile}
                            onChange={(e) =>
                                setFormData({ ...formData, ownerMobile: e.target.value })
                            }
                            className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-800 dark:border-zinc-700"
                            placeholder="+1 234 567 890"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Currency Symbol
                        </label>
                        <select
                            value={formData.currencySymbol}
                            onChange={(e) =>
                                setFormData({ ...formData, currencySymbol: e.target.value })
                            }
                            className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-800 dark:border-zinc-700"
                        >
                            <option value="$">$ (USD)</option>
                            <option value="₹">₹ (INR)</option>
                            <option value="€">€ (EUR)</option>
                            <option value="£">£ (GBP)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Date Format
                        </label>
                        <select
                            value={formData.dateFormat}
                            onChange={(e) =>
                                setFormData({ ...formData, dateFormat: e.target.value })
                            }
                            className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-800 dark:border-zinc-700"
                        >
                            <option value="DD-MMM-YYYY">DD-MMM-YYYY (31-Jan-2024)</option>
                            <option value="DD-MM-YYYY">DD-MM-YYYY (31-01-2024)</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY (01/31/2024)</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD (2024-01-31)</option>
                        </select>
                    </div>
                </div>

                {/* Categories Section */}
                <div className="border-t border-gray-100 dark:border-zinc-800 pt-6">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Manage Categories
                    </h3>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {formData.categories?.map((cat) => (
                            <span key={cat} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-300">
                                {cat}
                                <button
                                    type="button"
                                    onClick={() => removeCategory(cat)}
                                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-zinc-700 dark:hover:text-gray-200 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                            className="flex-1 rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-800 dark:border-zinc-700 placeholder-gray-400 text-sm"
                            placeholder="Add new category..."
                        />
                        <button
                            type="button"
                            onClick={addCategory}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                        </button>
                    </div>
                </div>



                {/* Data Management Section */}
                <div className="border-t border-gray-100 dark:border-zinc-800 pt-6">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Data Management
                    </h3>

                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-4 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={handleExport}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                            >
                                <Download className="w-4 h-4" />
                                Export Backup
                            </button>

                            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors shadow-sm cursor-pointer">
                                <Upload className="w-4 h-4" />
                                Import Backup
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImport}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        <div className="pt-2 border-t border-gray-200 dark:border-zinc-700/50">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <AlertTriangle className="w-4 h-4" />
                                Factory Reset Data
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm"
                    >
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </form >
        </div >
    );
}
