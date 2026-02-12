"use client";

import { useState } from "react";
import useSubscriptionStore from "@/state/subscription-store";
import { PlanTier, BillingPeriod, calculatePrice } from "@/mock-data/subscription-dummy-data";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { currentSubscription, setShowPaymentModal } = useSubscriptionStore();
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(BillingPeriod.MONTHLY);

  if (!isOpen || !currentSubscription) return null;

  const handleUpgrade = () => {
    if (selectedPlan) {
      setShowPaymentModal(true);
    }
  };

  const plans = [
    { tier: PlanTier.PRO, name: "PRO", description: "Up to 5 custom strategies" },
    { tier: PlanTier.ELITE, name: "ELITE", description: "Unlimited strategies + VC Pool" },
  ];

  const filteredPlans =
    currentSubscription.tier === PlanTier.FREE
      ? plans
      : currentSubscription.tier === PlanTier.PRO
        ? [plans[1]]
        : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[--color-surface] border border-[--color-border] rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Upgrade Plan</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Billing Period Selector */}
          <div className="flex gap-2 bg-[--color-surface-alt] p-2 rounded-lg">
            {[
              { label: "Monthly", value: BillingPeriod.MONTHLY },
              { label: "Quarterly", value: BillingPeriod.QUARTERLY },
              { label: "Yearly", value: BillingPeriod.YEARLY },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setBillingPeriod(option.value)}
                className={`flex-1 py-2 px-3 rounded text-xs font-semibold transition-all ${
                  billingPeriod === option.value
                    ? "bg-[#fc4f02] text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Plan Options */}
          <div className="space-y-3">
            {filteredPlans.map((plan) => {
              const pricing = calculatePrice(plan.tier, billingPeriod);
              return (
                <div
                  key={plan.tier}
                  onClick={() => setSelectedPlan(plan.tier)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedPlan === plan.tier
                      ? "border-[#fc4f02] bg-[#fc4f02]/10"
                      : "border-[--color-border] hover:border-[#fc4f02]/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                    <span className="text-xl font-bold text-[#fc4f02]">
                      ${pricing.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{plan.description}</p>
                  {pricing.discount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                        Save {pricing.discount}% - ${pricing.saving.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Tier Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-xs text-blue-300">
              <span className="font-semibold">Current Plan:</span> {currentSubscription.tier}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[--color-border] text-white rounded-lg hover:bg-[--color-surface-alt] transition-colors text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleUpgrade}
              disabled={!selectedPlan}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${
                selectedPlan
                  ? "bg-[#fc4f02] text-white hover:bg-[#e04502]"
                  : "bg-slate-600 text-slate-400 cursor-not-allowed"
              }`}
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CancelSubscriptionModal({ isOpen, onClose }: CancelModalProps) {
  const [reason, setReason] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleCancel = async () => {
    setIsConfirming(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsConfirming(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[--color-surface] border border-red-500/30 rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-red-400 mb-4">⚠️ Cancel Subscription</h2>

        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-xs text-red-300 font-semibold mb-2">Important:</p>
            <ul className="text-xs text-red-300 space-y-1 list-disc list-inside">
              <li>Premium features will be unavailable immediately</li>
              <li>You'll be downgraded to the Free plan</li>
              <li>No refund for the current billing period</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Why are you canceling?
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Your feedback helps us improve..."
              className="w-full px-3 py-2 bg-[--color-surface-alt] border border-[--color-border] rounded-lg text-white placeholder:text-slate-500 text-sm focus:border-[#fc4f02] focus:outline-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[--color-border] text-white rounded-lg hover:bg-[--color-surface-alt] transition-colors text-sm font-semibold"
            >
              Keep My Plan
            </button>
            <button
              onClick={handleCancel}
              disabled={isConfirming}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold disabled:opacity-50"
            >
              {isConfirming ? "Processing..." : "Yes, Cancel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[--color-surface] border border-[--color-border] rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Payment Details</h2>

        <div className="space-y-4">
          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Card Number</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, "").slice(0, 16))}
              placeholder="1234 5678 9012 3456"
              className="w-full px-3 py-2 bg-[--color-surface-alt] border border-[--color-border] rounded-lg text-white placeholder:text-slate-500 text-sm focus:border-[#fc4f02] focus:outline-none"
            />
          </div>

          {/* Expiry & CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">MM/YY</label>
              <input
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value.slice(0, 5))}
                placeholder="12/25"
                className="w-full px-3 py-2 bg-[--color-surface-alt] border border-[--color-border] rounded-lg text-white placeholder:text-slate-500 text-sm focus:border-[#fc4f02] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">CVC</label>
              <input
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.slice(0, 4))}
                placeholder="123"
                className="w-full px-3 py-2 bg-[--color-surface-alt] border border-[--color-border] rounded-lg text-white placeholder:text-slate-500 text-sm focus:border-[#fc4f02] focus:outline-none"
              />
            </div>
          </div>

          {/* Security Note */}
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>🔒</span>
            <span>Your payment information is encrypted and secure</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 border border-[--color-border] text-white rounded-lg hover:bg-[--color-surface-alt] transition-colors text-sm font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={isProcessing || !cardNumber || !expiryDate || !cvc}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${
                isProcessing || !cardNumber || !expiryDate || !cvc
                  ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                  : "bg-[#fc4f02] text-white hover:bg-[#e04502]"
              }`}
            >
              {isProcessing ? "Processing..." : "Pay Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
