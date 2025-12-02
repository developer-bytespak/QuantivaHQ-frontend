"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { SettingsBackButton } from "@/components/settings/settings-back-button";
import { useNotification, Notification } from "@/components/common/notification";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  routingNumber: string;
  accountType: "checking" | "savings";
  isPrimary: boolean;
}

export default function BankDetailsPage() {
  const { notification, showNotification, hideNotification } = useNotification();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; accountId: string | null }>({
    isOpen: false,
    accountId: null,
  });
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    routingNumber: "",
    accountType: "checking" as "checking" | "savings",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Load saved bank accounts from localStorage
    const saved = localStorage.getItem("quantivahq_bank_accounts");
    if (saved) {
      setAccounts(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedAccount]);

  const handleAddAccount = () => {
    if (!formData.bankName || !formData.accountNumber || !formData.accountHolderName || !formData.routingNumber) {
      showNotification("Please fill in all fields", "error");
      return;
    }

    const newAccount: BankAccount = {
      id: Date.now().toString(),
      ...formData,
      isPrimary: accounts.length === 0,
    };

    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    localStorage.setItem("quantivahq_bank_accounts", JSON.stringify(updatedAccounts));
    setFormData({
      bankName: "",
      accountNumber: "",
      accountHolderName: "",
      routingNumber: "",
      accountType: "checking",
    });
    setShowAddForm(false);
    showNotification("Bank account added successfully", "success");
  };

  const handleSetPrimary = (id: string) => {
    const updatedAccounts = accounts.map((acc) => ({
      ...acc,
      isPrimary: acc.id === id,
    }));
    setAccounts(updatedAccounts);
    localStorage.setItem("quantivahq_bank_accounts", JSON.stringify(updatedAccounts));
    showNotification("Primary account updated successfully", "success");
  };

  const handleDeleteAccount = (id: string) => {
    setDeleteConfirmation({ isOpen: true, accountId: id });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.accountId) {
      const updatedAccounts = accounts.filter((acc) => acc.id !== deleteConfirmation.accountId);
      setAccounts(updatedAccounts);
      localStorage.setItem("quantivahq_bank_accounts", JSON.stringify(updatedAccounts));
      showNotification("Bank account deleted successfully", "success");
      setDeleteConfirmation({ isOpen: false, accountId: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, accountId: null });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, nextFieldId?: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextFieldId) {
        const nextField = document.getElementById(nextFieldId);
        if (nextField) {
          nextField.focus();
        }
      } else {
        // If no next field, submit the form
        handleAddAccount();
      }
    }
  };

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        title="Delete Bank Account"
        message="Are you sure you want to delete this bank account? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        type="danger"
      />
      <SettingsBackButton />
      
      {/* Bank Account Details Overlay */}
      {selectedAccount && mounted && typeof window !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedAccount(null)}
        >
          <div
            className="relative mx-4 w-full max-w-2xl rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/95 to-[--color-surface-alt]/90 p-6 shadow-2xl shadow-black/50 backdrop-blur animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedAccount.bankName}</h2>
                  {selectedAccount.isPrimary && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full bg-[#fc4f02]/20 text-[#fc4f02] border border-[#fc4f02]/30">
                      Primary Account
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedAccount(null)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[--color-surface] hover:text-white"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {/* Account Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[--color-surface]/30 border border-[--color-border]/50 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Account Holder Name</p>
                  <p className="text-lg font-semibold text-white">{selectedAccount.accountHolderName}</p>
                </div>
                <div className="bg-[--color-surface]/30 border border-[--color-border]/50 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Account Type</p>
                  <p className="text-lg font-semibold text-white capitalize">{selectedAccount.accountType}</p>
                </div>
                <div className="bg-[--color-surface]/30 border border-[--color-border]/50 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Account Number</p>
                  <p className="text-lg font-semibold text-white font-mono tracking-wider">{selectedAccount.accountNumber}</p>
                </div>
                <div className="bg-[--color-surface]/30 border border-[--color-border]/50 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Routing Number</p>
                  <p className="text-lg font-semibold text-white font-mono tracking-wider">{selectedAccount.routingNumber}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-[--color-border]/50 flex gap-3">
                {!selectedAccount.isPrimary && (
                  <button
                    onClick={() => {
                      handleSetPrimary(selectedAccount.id);
                      setSelectedAccount(null);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-[--color-surface] border border-[--color-border] text-white hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt] transition-all duration-200 font-medium"
                  >
                    Set as Primary
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedAccount(null);
                    handleDeleteAccount(selectedAccount.id);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all duration-200 font-medium"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-2xl p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white">Bank Details</h1>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fd6a00] text-white font-medium hover:from-[#fd6a00] hover:to-[#fd8a00] transition-all duration-200"
          >
            {showAddForm ? "Cancel" : "+ Add Account"}
          </button>
        </div>

        {showAddForm && (
          <div className="mb-6 bg-[--color-surface]/50 border border-[--color-border]/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Add Bank Account</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Bank Name</label>
                <input
                  id="bank-name-input"
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, "account-holder-input")}
                  className="w-full px-4 py-2 rounded-lg bg-[--color-surface] border border-[--color-border] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50"
                  placeholder="Enter bank name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Account Holder Name</label>
                <input
                  id="account-holder-input"
                  type="text"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, "account-number-input")}
                  className="w-full px-4 py-2 rounded-lg bg-[--color-surface] border border-[--color-border] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50"
                  placeholder="Enter account holder name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Account Number</label>
                <input
                  id="account-number-input"
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, "routing-number-input")}
                  className="w-full px-4 py-2 rounded-lg bg-[--color-surface] border border-[--color-border] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50"
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Routing Number</label>
                <input
                  id="routing-number-input"
                  type="text"
                  value={formData.routingNumber}
                  onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, "account-type-select")}
                  className="w-full px-4 py-2 rounded-lg bg-[--color-surface] border border-[--color-border] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50"
                  placeholder="Enter routing number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Account Type</label>
                <select
                  id="account-type-select"
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value as "checking" | "savings" })}
                  onKeyDown={(e) => handleKeyDown(e)}
                  className="w-full px-4 py-2 rounded-lg bg-[--color-surface] border border-[--color-border] text-white focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleAddAccount}
              className="mt-4 px-6 py-2 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fd6a00] text-white font-medium hover:from-[#fd6a00] hover:to-[#fd8a00] transition-all duration-200"
            >
              Add Account
            </button>
          </div>
        )}

        <div className="space-y-4">
          {accounts.length === 0 ? (
            <div className="text-center py-12 bg-[--color-surface]/30 border border-[--color-border]/50 rounded-xl">
              <svg className="w-16 h-16 text-slate-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-slate-400 text-lg">No bank accounts added yet</p>
              <p className="text-slate-500 text-sm mt-2">Click "Add Account" to get started</p>
            </div>
          ) : (
            accounts.map((account) => (
              <div
                key={account.id}
                onClick={() => setSelectedAccount(account)}
                className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-xl p-6 hover:border-[#fc4f02]/30 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{account.bankName}</h3>
                      {account.isPrimary && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-[#fc4f02]/20 text-[#fc4f02] border border-[#fc4f02]/30">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-slate-400 mb-1">Account Number</p>
                      <p className="text-white font-medium">****{account.accountNumber.slice(-4)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

