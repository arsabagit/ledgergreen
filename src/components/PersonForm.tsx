"use client";

import { useState, useEffect } from "react";
import { useFinanceStore } from "@/store/useFinanceStore";
import { X, UserPlus } from "lucide-react";
import { Person } from "@/types";

interface PersonFormProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Person | null;
}

export function PersonForm({ isOpen, onClose, initialData }: PersonFormProps) {
    const { addPerson, updatePerson } = useFinanceStore();

    const [name, setName] = useState(initialData?.name || "");
    const [mobile, setMobile] = useState(initialData?.mobile || "");
    const [email, setEmail] = useState(initialData?.email || "");
    const [remarks, setRemarks] = useState(initialData?.remarks || "");

    useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || "");
            setMobile(initialData?.mobile || "");
            setEmail(initialData?.email || "");
            setRemarks(initialData?.remarks || "");
        }
    }, [isOpen, initialData]);

    // Reset form when initialData changes or modal opens
    // This is a simple approach, might need useEffect if props change while open
    // But since we close on submit, this might be okay for now if we re-mount or key it.
    // Better to use useEffect to sync state with props when they change.

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (initialData) {
            updatePerson(initialData.id, {
                name,
                mobile,
                email,
                remarks
            });
        } else {
            const newPerson: Person = {
                id: crypto.randomUUID(),
                name,
                mobile,
                email,
                remarks,
                isFavorite: false,
                runningBalance: 0,
                createdAt: new Date().toISOString(),
            };
            addPerson(newPerson);
        }
        handleClose();
    };

    const handleClose = () => {
        setName("");
        setMobile("");
        setEmail("");
        setRemarks("");
        onClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {initialData ? "Edit Person" : "Add New Person"}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-800 dark:border-zinc-700"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Mobile Number
                        </label>
                        <input
                            type="tel"
                            className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-800 dark:border-zinc-700"
                            placeholder="+1 234 567 890"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-800 dark:border-zinc-700"
                            placeholder="john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Remarks
                        </label>
                        <textarea
                            className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-800 dark:border-zinc-700"
                            rows={3}
                            placeholder="Additional notes..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center gap-2"
                        >
                            <UserPlus className="w-4 h-4" />
                            {initialData ? "Update Person" : "Add Person"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
