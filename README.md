# Ledger Green - Personal Accounting App

A modern personal accounting app built with Next.js 14, TypeScript, Tailwind CSS, and Zustand.

## Features
- **Transaction Management**: Add income/expense entries with ease.
- **Dr/Cr Support**: Track Giver and Receiver for every transaction.
- **Person Ledger**: Manage contacts and see who owes you what.
- **AI Insights**: (Placeholder) Analyze spending habits using Gemini.
- **Dark Mode**: Fully supported via Tailwind.

## Setup Instructions

Since the project files were generated manually, please follow these steps to initialize the environment:

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Open in Browser**:
    Navigate to [http://localhost:3000](http://localhost:3000).

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: Zustand (Persisted to LocalStorage)
- **Icons**: Lucide-React
- **Database**: Firebase (Configured but not connected in this template)

## Folder Structure
- `src/app`: Pages and Layouts
- `src/components`: UI Components (LedgerTable, SettingsForm, etc.)
- `src/store`: Global State (Zustand)
- `src/types`: TypeScript Interfaces
- `src/utils`: Helper functions (AI Analysis)
