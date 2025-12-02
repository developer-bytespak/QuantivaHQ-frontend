"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth/auth.service";

interface SettingsMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

export function ProfileSettings({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("User");
  const [userEmail, setUserEmail] = useState<string>("user@example.com");
  const [userPhone, setUserPhone] = useState<string>("+1 (347) 555-9184");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showImageMenu, setShowImageMenu] = useState<boolean>(false);
  const [showImageOverlay, setShowImageOverlay] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>("");
  const [editEmail, setEditEmail] = useState<string>("");
  const [editPhone, setEditPhone] = useState<string>("");
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt" | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState<boolean>(false);
  const [comingSoonFeature, setComingSoonFeature] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const cameraButtonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (typeof window !== "undefined") {
        try {
          const user = await authService.getCurrentUser();
          setUserName(user.username);
          setUserEmail(user.email);
          localStorage.setItem("quantivahq_user_name", user.username);
          localStorage.setItem("quantivahq_user_email", user.email);
        } catch (error) {
          const name = localStorage.getItem("quantivahq_user_name") || "User";
          const email = localStorage.getItem("quantivahq_user_email") || "user@example.com";
          setUserName(name);
          setUserEmail(email);
        }

        const savedImage = localStorage.getItem("quantivahq_profile_image");
        if (savedImage) {
          setProfileImage(savedImage);
        }

        const phone = localStorage.getItem("quantivahq_user_phone");
        if (phone) {
          setUserPhone(phone);
        }
      }
    };

    loadUserData();
  }, []);

  // Initialize edit values when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditName(userName);
      setEditEmail(userEmail);
      setEditPhone(userPhone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setUserName(editName);
    setUserEmail(editEmail);
    setUserPhone(editPhone);
    
    if (typeof window !== "undefined") {
      localStorage.setItem("quantivahq_user_name", editName);
      localStorage.setItem("quantivahq_user_email", editEmail);
      localStorage.setItem("quantivahq_user_phone", editPhone);
    }
    
    setIsEditing(false);
    
    // Show success notification
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000); // Hide after 3 seconds
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(userName);
    setEditEmail(userEmail);
    setEditPhone(userPhone);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("quantivahq_is_authenticated");
      localStorage.removeItem("quantivahq_user_name");
      localStorage.removeItem("quantivahq_user_email");
      localStorage.removeItem("quantivahq_user_id");
      localStorage.removeItem("quantivahq_profile_image");
      router.push("/onboarding/sign-up?tab=login");
    }
  };

  const menuItems: SettingsMenuItem[] = [
    {
      id: "tokenomics",
      label: "Tokenomics",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => {
        router.push("/dashboard/settings/tokenomics");
      },
    },
    {
      id: "bank-details",
      label: "Bank Details",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      onClick: () => {
        router.push("/dashboard/settings/bank-details");
      },
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      onClick: () => {
        router.push("/dashboard/settings/notifications");
      },
    },
    {
      id: "security",
      label: "Security",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      onClick: () => {
        router.push("/dashboard/settings/security");
      },
    },
    {
      id: "help-support",
      label: "Help and Support",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => {
        router.push("/dashboard/settings/help-support");
      },
    },
    {
      id: "terms",
      label: "Terms and Conditions",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      onClick: () => {
        router.push("/dashboard/settings/terms");
      },
    },
    {
      id: "logout",
      label: "Logout",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      onClick: handleLogout,
      color: "text-red-400",
    },
  ];

  const userInitial = userName.charAt(0).toUpperCase();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setProfileImage(result);
          if (typeof window !== "undefined") {
            localStorage.setItem("quantivahq_profile_image", result);
            window.dispatchEvent(new Event("profileImageUpdated"));
          }
        };
        reader.readAsDataURL(file);
      } else {
        alert("Please select an image file");
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setShowImageMenu(false);
  };

  // Handle camera button click - open camera modal
  const handleCameraClick = () => {
    setShowImageMenu(false);
    setShowCameraModal(true);
    requestCameraPermission();
  };

  // Request camera permission and start stream
  const requestCameraPermission = async () => {
    try {
      setCameraPermission("prompt");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user", // Front-facing camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraPermission("granted");

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch((err) => {
              console.error("Error playing video:", err);
            });
          }
        };
      }
    } catch (error: any) {
      console.error("Error accessing camera:", error);
      setCameraPermission("denied");
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        alert("Camera permission denied. Please allow camera access to capture photos.");
      } else {
        alert("Error accessing camera. Please try again.");
      }
    }
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/png");
        setProfileImage(imageData);
        
        if (typeof window !== "undefined") {
          localStorage.setItem("quantivahq_profile_image", imageData);
          window.dispatchEvent(new Event("profileImageUpdated"));
        }
        
        setIsCapturing(true);
      }
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setIsCapturing(false);
    if (videoRef.current && streamRef.current) {
      const video = videoRef.current;
      const stream = streamRef.current;
      
      // Reattach the stream
      video.srcObject = stream;
      
      // Ensure video plays
      const playVideo = async () => {
        try {
          await video.play();
        } catch (err) {
          console.error("Error playing video after retake:", err);
          // Try again after a short delay
          setTimeout(async () => {
            try {
              await video.play();
            } catch (e) {
              console.error("Error playing video on retry:", e);
            }
          }, 100);
        }
      };
      
      if (video.readyState >= 2) {
        playVideo();
      } else {
        video.onloadedmetadata = () => {
          playVideo();
        };
        // Force load
        video.load();
      }
    }
  };

  // Use captured photo
  const usePhoto = () => {
    stopCamera();
    setShowCameraModal(false);
    setIsCapturing(false);
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraPermission(null);
  };

  // Cleanup camera on unmount or modal close
  useEffect(() => {
    if (!showCameraModal) {
      stopCamera();
      setIsCapturing(false);
    }
    
    return () => {
      stopCamera();
    };
  }, [showCameraModal]);

  // Ensure video plays when stream is ready
  useEffect(() => {
    if (videoRef.current && streamRef.current && cameraPermission === "granted" && !isCapturing) {
      const video = videoRef.current;
      const stream = streamRef.current;
      
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      
      const playVideo = async () => {
        try {
          await video.play();
        } catch (err) {
          console.error("Error playing video:", err);
        }
      };
      
      if (video.readyState >= 2) {
        playVideo();
      } else {
        video.onloadedmetadata = () => {
          playVideo();
        };
      }
    }
  }, [cameraPermission, showCameraModal, isCapturing]);

  // Handle remove image
  const handleRemoveImage = () => {
    setProfileImage(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("quantivahq_profile_image");
      window.dispatchEvent(new Event("profileImageUpdated"));
    }
    setShowImageMenu(false);
  };

  // Handle upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        cameraButtonRef.current &&
        !cameraButtonRef.current.contains(target)
      ) {
        setShowImageMenu(false);
      }
    };

    if (showImageMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showImageMenu]);

  // Close overlay when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        setShowImageOverlay(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowImageOverlay(false);
      }
    };

    if (showImageOverlay) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [showImageOverlay]);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm font-medium">Back to Profile</span>
      </button>

      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#fc4f02] via-[#fd6a00] to-[#fd8a00] p-8 shadow-xl">
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-4 relative flex items-center justify-center">
            {/* Avatar */}
            <div className="relative">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={userName}
                  onClick={() => setShowImageOverlay(true)}
                  className="w-24 h-24 rounded-full border-4 border-white/30 object-cover shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center shadow-lg">
                  <span className="text-4xl font-bold text-white">{userInitial}</span>
                </div>
              )}

              {/* Camera icon button on the border */}
              <button
                ref={cameraButtonRef}
                onClick={() => setShowImageMenu(!showImageMenu)}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#fc4f02] border-2 border-white flex items-center justify-center shadow-lg hover:bg-[#fd6a00] transition-all duration-200 z-10"
                aria-label="Change profile picture"
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>

            {/* Image menu dropdown */}
            {showImageMenu && (
              <div
                ref={menuRef}
                className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 min-w-[200px] overflow-hidden"
              >
                <button
                  onClick={handleUploadClick}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-white"
                >
                  <svg
                    className="w-5 h-5 text-[#fc4f02]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className="text-sm font-medium text-white">Upload Photo</span>
                </button>
                <button
                  onClick={handleCameraClick}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-white border-t border-slate-700"
                >
                  <svg
                    className="w-5 h-5 text-[#fc4f02]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-white">Capture Photo</span>
                </button>
                {profileImage && (
                  <button
                    onClick={handleRemoveImage}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/20 transition-colors text-red-400 border-t border-slate-700"
                  >
                    <svg
                      className="w-5 h-5 text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span className="text-sm font-medium text-red-400">Remove Photo</span>
                  </button>
                )}
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          {/* Edit button */}
          {!isEditing && (
            <button
              onClick={handleEditClick}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 flex items-center justify-center transition-all duration-200"
              aria-label="Edit profile"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}

          {/* Profile Information - Display or Edit Mode */}
          {!isEditing ? (
            <>
              <h2 className="text-3xl font-bold text-white mb-2">{userName}</h2>
              <p className="text-white/90 mb-1">{userEmail}</p>
              <p className="text-white/80 text-sm">{userPhone}</p>
            </>
          ) : (
            <div className="w-full max-w-xs space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  placeholder="Enter your phone"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/30 hover:bg-white/40 backdrop-blur-sm border border-white/30 text-white font-medium transition-all duration-200"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-medium transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Overlay */}
      {showImageOverlay && profileImage && mounted && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div
            ref={overlayRef}
            className="relative max-w-xl w-full mx-4 flex items-center justify-center"
          >
            {/* Close button */}
            <button
              onClick={() => setShowImageOverlay(false)}
              className="absolute -top-12 right-0 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
              aria-label="Close image"
            >
              <svg
                className="w-5 h-5 text-white"
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

            {/* Image - displayed horizontally */}
            <img
              src={profileImage}
              alt={userName}
              className="w-full max-h-[50vh] object-contain rounded-lg shadow-2xl"
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Success Notification */}
      {showNotification && mounted && typeof window !== "undefined" && createPortal(
        <div className="fixed top-4 right-4 z-[99999] animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-green-500/90 to-green-600/90 backdrop-blur-sm border border-green-400/30 shadow-lg shadow-green-500/20">
            <svg
              className="w-5 h-5 text-white flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-white font-medium">Profile successfully updated</span>
          </div>
        </div>,
        document.body
      )}

      {/* Camera Modal */}
      {showCameraModal && mounted && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl mx-4 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">Capture Photo</h3>
              <button
                onClick={() => {
                  setShowCameraModal(false);
                  stopCamera();
                }}
                className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
                aria-label="Close camera"
              >
                <svg
                  className="w-5 h-5 text-white"
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

            {/* Camera Content */}
            <div className="p-6">
              {cameraPermission === "denied" && (
                <div className="text-center py-8">
                  <svg
                    className="w-16 h-16 text-red-400 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-white text-lg mb-2">Camera Permission Denied</p>
                  <p className="text-slate-400 mb-4">Please allow camera access in your browser settings to capture photos.</p>
                  <button
                    onClick={() => {
                      setShowCameraModal(false);
                      stopCamera();
                    }}
                    className="px-4 py-2 rounded-lg bg-[#fc4f02] hover:bg-[#fd6a00] text-white font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}

              {cameraPermission === "prompt" && (
                <div className="text-center py-8">
                  <div className="animate-spin w-12 h-12 border-4 border-[#fc4f02] border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-white text-lg">Requesting camera permission...</p>
                </div>
              )}

              {cameraPermission === "granted" && !isCapturing && (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', minHeight: '400px' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)', display: 'block' }} // Mirror the video for selfie view
                    />
                  </div>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={capturePhoto}
                      className="w-16 h-16 rounded-full bg-white border-4 border-slate-300 flex items-center justify-center hover:scale-105 transition-transform"
                      aria-label="Capture photo"
                    >
                      <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-400"></div>
                    </button>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}

              {isCapturing && (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <img
                      src={profileImage || ""}
                      alt="Captured"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={retakePhoto}
                      className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
                    >
                      Retake
                    </button>
                    <button
                      onClick={usePhoto}
                      className="px-6 py-2 rounded-lg bg-[#fc4f02] hover:bg-[#fd6a00] text-white font-medium transition-colors"
                    >
                      Use Photo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Coming Soon Modal */}
      {showComingSoonModal && mounted && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative w-full max-w-md mx-4 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">Coming Soon</h3>
              <button
                onClick={() => setShowComingSoonModal(false)}
                className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5 text-white"
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

            {/* Content */}
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[#fc4f02]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">{comingSoonFeature}</h4>
              <p className="text-slate-400 mb-6">
                This feature is currently under development and will be available soon. Stay tuned!
              </p>
              <button
                onClick={() => setShowComingSoonModal(false)}
                className="px-6 py-2 rounded-lg bg-[#fc4f02] hover:bg-[#fd6a00] text-white font-medium transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Settings Menu */}
      <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-white mb-6">Settings</h3>
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-[--color-surface]/50 border border-[--color-border]/50 hover:border-[#fc4f02]/30 hover:bg-[--color-surface]/70 transition-all duration-200 group cursor-pointer"
            >
              <div className={`flex-shrink-0 ${item.color || "text-[#fc4f02]"}`}>
                {item.icon}
              </div>
              <span className={`flex-1 text-left text-base font-medium ${item.color || "text-white"} group-hover:text-[#fc4f02] transition-colors`}>
                {item.label}
              </span>
              <svg
                className={`w-5 h-5 flex-shrink-0 ${item.color || "text-slate-400"} group-hover:text-[#fc4f02] transition-colors`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

