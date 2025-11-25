"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function StocksProfilePage() {
  const [userName, setUserName] = useState<string>("User");
  const [userEmail, setUserEmail] = useState<string>("user@example.com");
  const [userInitial, setUserInitial] = useState<string>("U");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [personalInfo, setPersonalInfo] = useState<any>(null);
  const [selectedExchange, setSelectedExchange] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>("");
  const [editEmail, setEditEmail] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [showImageOptions, setShowImageOptions] = useState<boolean>(false);
  const [showCameraPreview, setShowCameraPreview] = useState<boolean>(false);
  const [showImageOverlay, setShowImageOverlay] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageButtonRef = useRef<HTMLDivElement>(null);
  const imageMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const name = localStorage.getItem("quantivahq_user_name") || "User";
      const email = localStorage.getItem("quantivahq_user_email") || "user@example.com";
      const exchange = localStorage.getItem("quantivahq_selected_exchange") || "";
      const personalInfoStr = localStorage.getItem("quantivahq_personal_info");
      const savedImage = localStorage.getItem("quantivahq_profile_image");

      setUserName(name);
      setUserEmail(email);
      setEditName(name);
      setEditEmail(email);
      setUserInitial(name.charAt(0).toUpperCase());
      setSelectedExchange(exchange);
      if (savedImage) {
        setProfileImage(savedImage);
      }

      if (personalInfoStr) {
        try {
          setPersonalInfo(JSON.parse(personalInfoStr));
        } catch (e) {
          console.error("Failed to parse personal info", e);
        }
      }
    }
  }, []);

  // Setup video stream for camera preview
  useEffect(() => {
    if (showCameraPreview && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showCameraPreview, stream]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Close image options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        imageButtonRef.current &&
        !imageButtonRef.current.contains(event.target as Node) &&
        imageMenuRef.current &&
        !imageMenuRef.current.contains(event.target as Node)
      ) {
        setShowImageOptions(false);
      }
    };

    if (showImageOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showImageOptions]);

  const handleEdit = () => {
    setEditName(userName);
    setEditEmail(userEmail);
    setIsEditing(true);
    setSaveSuccess(false);
  };

  const handleCancel = () => {
    setEditName(userName);
    setEditEmail(userEmail);
    setIsEditing(false);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      return;
    }

    setIsSaving(true);

    // Simulate API call
    setTimeout(() => {
      // Update localStorage
      localStorage.setItem("quantivahq_user_name", editName.trim());
      localStorage.setItem("quantivahq_user_email", editEmail.trim());

      // Update state
      setUserName(editName.trim());
      setUserEmail(editEmail.trim());
      setUserInitial(editName.trim().charAt(0).toUpperCase());

      // Dispatch custom event to update top bar
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("profileImageUpdated"));
      }

      setIsEditing(false);
      setIsSaving(false);
      setSaveSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    }, 500);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        if (typeof window !== "undefined") {
          localStorage.setItem("quantivahq_profile_image", base64String);
          // Dispatch custom event to update top bar
          window.dispatchEvent(new Event("profileImageUpdated"));
        }
        setShowImageOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCaptureImage = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }
      });
      setStream(mediaStream);
      setShowCameraPreview(true);
      setShowImageOptions(false);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check your permissions.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL("image/png");
        setProfileImage(imageData);
        if (typeof window !== "undefined") {
          localStorage.setItem("quantivahq_profile_image", imageData);
          // Dispatch custom event to update top bar
          window.dispatchEvent(new Event("profileImageUpdated"));
        }
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        setStream(null);
        setShowCameraPreview(false);
      }
    }
  };

  const cancelCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setShowCameraPreview(false);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowImageOptions(!showImageOptions);
  };

  const tradingStats = [
    { label: "Total Trades", value: "1,247", change: "+12%", positive: true },
    { label: "Win Rate", value: "68.5%", change: "+2.3%", positive: true },
    { label: "Avg. Return", value: "4.2%", change: "+0.8%", positive: true },
    { label: "Total Volume", value: "$2.4M", change: "+15%", positive: true },
  ];

  const accountInfo = [
    { label: "Account Type", value: selectedExchange ? selectedExchange.charAt(0).toUpperCase() + selectedExchange.slice(1) : "Not Set" },
    { label: "Member Since", value: "Jan 2024" },
    { label: "Verification Status", value: "Verified", verified: true },
    { label: "Account Tier", value: "Pro", tier: true },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div>
        <p className="text-sm text-slate-400">Manage your account information and trading preferences</p>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/20">
              <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-400">Profile updated successfully!</p>
            </div>
            <button
              onClick={() => setSaveSuccess(false)}
              className="text-green-400 hover:text-green-300"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative">
            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#fc4f02] to-[#fda300] text-2xl font-bold text-white shadow-lg shadow-[#fc4f02]/30">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={userName}
                  className="h-full w-full object-cover rounded-full"
                />
              ) : (
                userInitial
              )}
            </div>
            {/* Camera Icon Overlay */}
            <div
              ref={imageButtonRef}
              onClick={handleImageClick}
              className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[#fc4f02] to-[#fda300] shadow-lg shadow-[#fc4f02]/50 transition-all duration-200 hover:scale-110 hover:shadow-xl hover:shadow-[#fc4f02]/70"
            >
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <div className="flex-1 text-center sm:text-left">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSave();
                      }
                    }}
                    className="w-full rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-3 py-2 text-sm text-white placeholder-slate-500 transition-all duration-300 focus:border-[#fc4f02] focus:outline-none focus:ring-4 focus:ring-[#fc4f02]/20"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSave();
                      }
                    }}
                    className="w-full rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-3 py-2 text-sm text-white placeholder-slate-500 transition-all duration-300 focus:border-[#fc4f02] focus:outline-none focus:ring-4 focus:ring-[#fc4f02]/20"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white">{userName}</h2>
                <p className="mt-1 text-sm text-slate-400">{userEmail}</p>
                {personalInfo && (
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 sm:justify-start">
                    {personalInfo.countryOfResidence && (
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 002 2h2.945M11 20v-5a2 2 0 012-2h4a2 2 0 012 2v5M7 7h.01M7 3h.01M21 3h.01M21 7h.01M21 11h.01M7 11h.01" />
                        </svg>
                        {personalInfo.countryOfResidence}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Verified Account
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="rounded-xl border border-[--color-border] bg-[--color-surface] px-4 py-2 text-sm font-medium text-white transition-all hover:border-slate-500/50 hover:bg-[--color-surface-alt] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !editName.trim() || !editEmail.trim()}
                  className="rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="rounded-xl border border-[--color-border] bg-[--color-surface] px-4 py-2 text-sm font-medium text-white transition-all hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt]"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Trading Statistics */}
      <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
        <h2 className="mb-4 text-lg font-semibold text-white">Trading Statistics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tradingStats.map((stat, index) => (
            <div key={index} className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
              <p className="mb-1 text-xs text-slate-400">{stat.label}</p>
              <p className="mb-2 text-2xl font-bold text-white">{stat.value}</p>
              <div className="flex items-center gap-1">
                <span className={`text-xs font-medium ${stat.positive ? "text-green-400" : "text-red-400"}`}>
                  {stat.change}
                </span>
                <span className="text-xs text-slate-500">vs last month</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account Information & Settings Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Account Information */}
        <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
          <h2 className="mb-4 text-lg font-semibold text-white">Account Information</h2>
          <div className="space-y-4">
            {accountInfo.map((info, index) => (
              <div key={index} className="flex items-center justify-between border-b border-[--color-border] pb-3 last:border-0 last:pb-0">
                <span className="text-sm text-slate-400">{info.label}</span>
                <div className="flex items-center gap-2">
                  {info.verified && (
                    <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {info.tier && (
                    <span className="rounded-full bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-2 py-0.5 text-xs font-semibold text-white">
                      {info.value}
                    </span>
                  )}
                  {!info.verified && !info.tier && (
                    <span className="text-sm font-medium text-white">{info.value}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connected Exchanges */}
        <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Connected Exchanges</h2>
            <button className="text-xs text-[#fc4f02] hover:text-[#fda300] transition-colors">
              Connect New
            </button>
          </div>
          <div className="space-y-3">
            {selectedExchange ? (
              <div className="flex items-center justify-between rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20">
                    <span className="text-lg font-bold text-[#fc4f02]">
                      {selectedExchange.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {selectedExchange.charAt(0).toUpperCase() + selectedExchange.slice(1)}
                    </p>
                    <p className="text-xs text-slate-400">Connected</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span className="text-xs text-green-400">Active</span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4 text-center">
                <p className="text-sm text-slate-400">No exchanges connected</p>
                <button className="mt-2 text-xs text-[#fc4f02] hover:text-[#fda300] transition-colors">
                  Connect your first exchange
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security Settings */}
        <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
          <h2 className="mb-4 text-lg font-semibold text-white">Security</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
              <div>
                <p className="font-medium text-white">Password</p>
                <p className="text-xs text-slate-400">Last changed 30 days ago</p>
              </div>
              <button className="rounded-lg border border-[--color-border] bg-[--color-surface] px-3 py-1.5 text-xs font-medium text-white transition-all hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt]">
                Change
              </button>
            </div>
            <div className="cursor-pointer flex items-center justify-between rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4 transition-all duration-300 hover:border-[#fc4f02]/30 hover:bg-[--color-surface]/80 hover:scale-[1.01]">
              <div>
                <p className="font-medium text-white">Two-Factor Authentication</p>
                <p className="text-xs text-slate-400">Add an extra layer of security</p>
              </div>
              <button className="rounded-lg border border-[--color-border] bg-[--color-surface] px-3 py-1.5 text-xs font-medium text-white transition-all hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt]">
                Enable
              </button>
            </div>
            <div className="cursor-pointer flex items-center justify-between rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4 transition-all duration-300 hover:border-[#fc4f02]/30 hover:bg-[--color-surface]/80 hover:scale-[1.01]">
              <div>
                <p className="font-medium text-white">API Keys</p>
                <p className="text-xs text-slate-400">Manage your exchange API keys</p>
              </div>
              <button className="rounded-lg border border-[--color-border] bg-[--color-surface] px-3 py-1.5 text-xs font-medium text-white transition-all hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt]">
                Manage
              </button>
            </div>
          </div>
        </div>

        {/* Trading Preferences */}
        <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
          <h2 className="mb-4 text-lg font-semibold text-white">Trading Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
              <div>
                <p className="font-medium text-white">Risk Level</p>
                <p className="text-xs text-slate-400">Current: Medium</p>
              </div>
              <button className="rounded-lg border border-[--color-border] bg-[--color-surface] px-3 py-1.5 text-xs font-medium text-white transition-all hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt]">
                Adjust
              </button>
            </div>
            <div className="cursor-pointer flex items-center justify-between rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4 transition-all duration-300 hover:border-[#fc4f02]/30 hover:bg-[--color-surface]/80 hover:scale-[1.01]">
              <div>
                <p className="font-medium text-white">Auto-Trading</p>
                <p className="text-xs text-slate-400">AI-powered automated trading</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" defaultChecked />
                <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-gradient-to-r peer-checked:from-[#fc4f02] peer-checked:to-[#fda300] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#fc4f02]/20"></div>
              </label>
            </div>
            <div className="cursor-pointer flex items-center justify-between rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4 transition-all duration-300 hover:border-[#fc4f02]/30 hover:bg-[--color-surface]/80 hover:scale-[1.01]">
              <div>
                <p className="font-medium text-white">Email Notifications</p>
                <p className="text-xs text-slate-400">Trade alerts and updates</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" defaultChecked />
                <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-gradient-to-r peer-checked:from-[#fc4f02] peer-checked:to-[#fda300] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#fc4f02]/20"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <button className="text-xs text-[#fc4f02] hover:text-[#fda300] transition-colors">
            View All
          </button>
        </div>
        <div className="space-y-3">
          {[
            { action: "Account verified", time: "2 days ago", icon: "check", bgColor: "bg-green-500/20", iconColor: "text-green-400" },
            { action: "API key connected", time: "5 days ago", icon: "key", bgColor: "bg-blue-500/20", iconColor: "text-blue-400" },
            { action: "Password changed", time: "30 days ago", icon: "lock", bgColor: "bg-slate-500/20", iconColor: "text-slate-400" },
            { action: "Profile updated", time: "45 days ago", icon: "user", bgColor: "bg-slate-500/20", iconColor: "text-slate-400" },
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-3 rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activity.bgColor}`}>
                {activity.icon === "check" && (
                  <svg className={`h-4 w-4 ${activity.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {activity.icon === "key" && (
                  <svg className={`h-4 w-4 ${activity.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                )}
                {activity.icon === "lock" && (
                  <svg className={`h-4 w-4 ${activity.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
                {activity.icon === "user" && (
                  <svg className={`h-4 w-4 ${activity.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{activity.action}</p>
                <p className="text-xs text-slate-400">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Options Menu */}
      {showImageOptions && typeof window !== "undefined" && imageButtonRef.current && createPortal(
        <div
          ref={imageMenuRef}
          className="fixed z-[100] w-56 rounded-xl border border-[--color-border] bg-white p-2 shadow-2xl shadow-black/50"
          style={{
            top: `${imageButtonRef.current.getBoundingClientRect().bottom + 8}px`,
            left: `${imageButtonRef.current.getBoundingClientRect().left}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 transition-all duration-200 hover:bg-gradient-to-r hover:from-[#fc4f02]/10 hover:to-[#fda300]/10 hover:border hover:border-[#fc4f02]/30 hover:shadow-sm"
            >
              <svg className="h-5 w-5 text-slate-600 transition-colors group-hover:text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="transition-colors group-hover:text-[#fc4f02] group-hover:font-semibold">Upload from Media</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCaptureImage();
              }}
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 transition-all duration-200 hover:bg-gradient-to-r hover:from-[#fc4f02]/10 hover:to-[#fda300]/10 hover:border hover:border-[#fc4f02]/30 hover:shadow-sm"
            >
              <svg className="h-5 w-5 text-slate-600 transition-colors group-hover:text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="transition-colors group-hover:text-[#fc4f02] group-hover:font-semibold">Capture Photo</span>
            </button>
            {profileImage && (
              <>
                <div className="my-2 border-t border-slate-200" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowImageOverlay(true);
                    setShowImageOptions(false);
                  }}
                  className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 transition-all duration-200 hover:bg-gradient-to-r hover:from-[#fc4f02]/10 hover:to-[#fda300]/10 hover:border hover:border-[#fc4f02]/30 hover:shadow-sm"
                >
                  <svg className="h-5 w-5 text-slate-600 transition-colors group-hover:text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="transition-colors group-hover:text-[#fc4f02] group-hover:font-semibold">View Photo</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileImage(null);
                    if (typeof window !== "undefined") {
                      localStorage.removeItem("quantivahq_profile_image");
                      // Dispatch custom event to update top bar
                      window.dispatchEvent(new Event("profileImageUpdated"));
                    }
                    setShowImageOptions(false);
                  }}
                  className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 hover:border hover:border-red-200 hover:shadow-sm"
                >
                  <svg className="h-5 w-5 transition-colors group-hover:text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="transition-colors group-hover:text-red-700 group-hover:font-semibold">Remove Photo</span>
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )
      }

      {/* Camera Preview Modal */}
      {
        showCameraPreview && typeof window !== "undefined" && createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={cancelCamera}
          >
            <div
              className="relative mx-4 w-full max-w-md rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/95 to-[--color-surface-alt]/90 p-6 shadow-2xl shadow-black/50 backdrop-blur"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Capture Photo</h3>
                <button
                  onClick={cancelCamera}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[--color-surface] hover:text-white"
                  aria-label="Close"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mb-4 overflow-hidden rounded-xl bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-auto w-full"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelCamera}
                  className="flex-1 rounded-xl border border-[--color-border] bg-[--color-surface] px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt]"
                >
                  Cancel
                </button>
                <button
                  onClick={capturePhoto}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40"
                >
                  Capture
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      {/* Image Overlay Modal */}
      {
        showImageOverlay && profileImage && typeof window !== "undefined" && createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setShowImageOverlay(false)}
          >
            <div
              className="relative mx-4 w-full max-w-md rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/95 to-[--color-surface-alt]/90 p-4 shadow-2xl shadow-black/50 backdrop-blur"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Profile Photo</h3>
                <button
                  onClick={() => setShowImageOverlay(false)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[--color-surface] hover:text-white"
                  aria-label="Close"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mb-3 overflow-hidden rounded-xl bg-black">
                <img
                  src={profileImage}
                  alt={userName}
                  className="h-auto w-full max-h-96 object-contain"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowImageOverlay(false)}
                  className="flex-1 rounded-xl border border-[--color-border] bg-[--color-surface] px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </div >
  );
}