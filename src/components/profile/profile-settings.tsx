"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth/auth.service";
import { getUserProfile, updateUserProfile, uploadProfilePicture } from "@/lib/api/user";
import { personalInfoSchema } from "@/lib/validation/onboarding";
import countries from "i18n-iso-countries";

interface SettingsMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

interface Country {
  code: string;
  name: string;
}

export function ProfileSettings({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [countriesLoaded, setCountriesLoaded] = useState<boolean>(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState<string>("");
  
  // Calculate max date (18 years ago from today) for Date of Birth
  const maxDateOfBirth = useMemo(() => {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return maxDate.toISOString().split('T')[0];
  }, []);
  
  // Get all countries from the library
  const COUNTRIES_LIST = useMemo(() => {
    if (!countriesLoaded) {
      return [];
    }
    try {
      // Get country names in English
      const countryCodes = countries.getNames("en", { select: "official" });
      return Object.entries(countryCodes)
        .map(([code, name]) => ({
          code,
          name: name as string,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("Error loading countries:", error);
      // Fallback to empty array if library fails
      return [];
    }
  }, [countriesLoaded]);

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    if (!countrySearchQuery.trim()) {
      return COUNTRIES_LIST;
    }
    const query = countrySearchQuery.toLowerCase().trim();
    return COUNTRIES_LIST.filter((country) =>
      country.name.toLowerCase().includes(query)
    );
  }, [COUNTRIES_LIST, countrySearchQuery]);

  const [userName, setUserName] = useState<string>("User");
  const [userEmail, setUserEmail] = useState<string>("user@example.com");
  const [userPhone, setUserPhone] = useState<string>("");
  const [userGender, setUserGender] = useState<string>("");
  const [userNationality, setUserNationality] = useState<string>("");
  const [userDob, setUserDob] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showImageMenu, setShowImageMenu] = useState<boolean>(false);
  const [showImageOverlay, setShowImageOverlay] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>("");
  const [editPhone, setEditPhone] = useState<string>("");
  const [editGender, setEditGender] = useState<"male" | "female" | "other" | "prefer-not-to-say" | "">("");
  const [editNationality, setEditNationality] = useState<string>("");
  const [editDob, setEditDob] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const [isNationalityDropdownOpen, setIsNationalityDropdownOpen] = useState<boolean>(false);
  const [nationalityDropdownPosition, setNationalityDropdownPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 400 });
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
  const nationalityDropdownRef = useRef<HTMLDivElement>(null);
  const nationalityButtonRef = useRef<HTMLButtonElement>(null);

  // Register English locale for countries library
  useEffect(() => {
    import("i18n-iso-countries/langs/en.json")
      .then((enLocale) => {
        countries.registerLocale(enLocale.default || enLocale);
        setCountriesLoaded(true);
      })
      .catch((error) => {
        console.warn("Failed to load country locale:", error);
        // Try to use countries without explicit locale registration
        try {
          countries.getNames("en");
          setCountriesLoaded(true);
        } catch (e) {
          console.error("Countries library not available:", e);
        }
      });
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      if (typeof window !== "undefined") {
        setIsLoading(true);
        try {
          // Get basic user info
          const user = await authService.getCurrentUser();
          setUserEmail(user.email);
          localStorage.setItem("quantivahq_user_email", user.email);
          
          // Get full profile with personal info (only fullname, phone, email)
          try {
            const profile = await getUserProfile();
            setUserName(profile.full_name || profile.username || "User");
            setUserPhone(profile.phone_number || "");
            
            // Set all profile fields for editing
            if (profile.gender) {
              setUserGender(profile.gender);
            }
            if (profile.nationality) {
              setUserNationality(profile.nationality);
            }
            if (profile.dob) {
              // Convert Date to string format (YYYY-MM-DD) for date input
              const dobDate = typeof profile.dob === 'string' ? new Date(profile.dob) : profile.dob;
              const formattedDob = dobDate.toISOString().split('T')[0];
              setUserDob(formattedDob);
            }
            
            // Set profile picture from API
            if (profile.profile_pic_url) {
              setProfileImage(profile.profile_pic_url);
            }
            
            // Update localStorage
            localStorage.setItem("quantivahq_user_name", profile.full_name || profile.username || "User");
            if (profile.phone_number) {
              localStorage.setItem("quantivahq_user_phone", profile.phone_number);
            }
          } catch (profileError) {
            // If profile fetch fails, use basic user info
            console.error("Failed to load profile:", profileError);
            setUserName(user.username);
            localStorage.setItem("quantivahq_user_name", user.username);
          }
        } catch (error) {
          console.error("Failed to load user data:", error);
          const name = localStorage.getItem("quantivahq_user_name") || "User";
          const email = localStorage.getItem("quantivahq_user_email") || "user@example.com";
          setUserName(name);
          setUserEmail(email);
        }

        const phone = localStorage.getItem("quantivahq_user_phone");
        if (phone && !userPhone) {
          setUserPhone(phone);
        }
        
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Initialize edit values when entering edit mode or when user data changes
  useEffect(() => {
    if (isEditing) {
      setEditName(userName);
      setEditPhone(userPhone);
      setEditGender(userGender as "male" | "female" | "other" | "prefer-not-to-say" | "");
      setEditNationality(userNationality);
      setEditDob(userDob);
      setErrors({});
    }
  }, [isEditing, userName, userPhone, userGender, userNationality, userDob]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    // Validate form data
    const formData = {
      fullLegalName: editName,
      dateOfBirth: editDob,
      nationality: editNationality,
      gender: editGender || undefined,
      phoneNumber: editPhone || undefined,
    };

    try {
      const validationResult = personalInfoSchema.safeParse(formData);
      
      if (!validationResult.success) {
        const validationErrors: Record<string, string> = {};
        validationResult.error.errors.forEach((error) => {
          const field = error.path[0] as string;
          validationErrors[field] = error.message;
        });
        setErrors(validationErrors);
        return;
      }

      setIsLoading(true);
      setErrors({});

      // Prepare data for API
      const updateData = {
        fullName: editName,
        dob: editDob,
        nationality: editNationality,
        gender: editGender || undefined,
        phoneNumber: editPhone || undefined,
      };

      // Call API to update profile
      const updatedProfile = await updateUserProfile(updateData);

      // Update local state
      setUserName(updatedProfile.full_name || editName);
      setUserPhone(updatedProfile.phone_number || "");
      setUserGender(updatedProfile.gender || "");
      setUserNationality(updatedProfile.nationality || "");
      
      if (updatedProfile.dob) {
        const dobDate = typeof updatedProfile.dob === 'string' ? new Date(updatedProfile.dob) : updatedProfile.dob;
        const formattedDob = dobDate.toISOString().split('T')[0];
        setUserDob(formattedDob);
      }

      // Update localStorage
    if (typeof window !== "undefined") {
        localStorage.setItem("quantivahq_user_name", updatedProfile.full_name || editName);
        if (updatedProfile.phone_number) {
          localStorage.setItem("quantivahq_user_phone", updatedProfile.phone_number);
        }
    }
    
    setIsEditing(false);
      setIsLoading(false);
    
    // Show success notification
      setNotificationMessage("Profile successfully updated");
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
      }, 3000);
    } catch (error: any) {
      setIsLoading(false);
      console.error("Failed to update profile:", error);
      
      // Provide more helpful error messages
      let errorMessage = error.message || "Failed to update profile. Please try again.";
      
      if (error.message?.includes("Unauthorized") || error.message?.includes("401") || error.message?.includes("Session expired")) {
        errorMessage = "Your session has expired. Please log out and log in again.";
      } else if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
        errorMessage = "Network error. Please check your connection and ensure the backend server is running.";
      }
      
      setNotificationMessage(errorMessage);
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(userName);
    setEditPhone(userPhone);
    setEditGender(userGender as "male" | "female" | "other" | "prefer-not-to-say" | "");
    setEditNationality(userNationality);
    setEditDob(userDob);
    setErrors({});
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
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setIsLoading(true);
        try {
          // Upload to Cloudinary via backend
          const response = await uploadProfilePicture(file);
          setProfileImage(response.imageUrl);
          
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("profileImageUpdated"));
          }
          
          setNotificationMessage("Profile picture uploaded successfully");
          setShowNotification(true);
          setTimeout(() => {
            setShowNotification(false);
          }, 3000);
        } catch (error: any) {
          console.error("Failed to upload profile picture:", error);
          setNotificationMessage(error.message || "Failed to upload profile picture. Please try again.");
          setShowNotification(true);
          setTimeout(() => {
            setShowNotification(false);
          }, 5000);
        } finally {
          setIsLoading(false);
        }
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
  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        // Convert canvas to blob and upload to Cloudinary
        canvas.toBlob(async (blob) => {
          if (blob) {
            setIsCapturing(true);
            setIsLoading(true);
            
            try {
              // Convert blob to File
              const file = new File([blob], "profile-picture.jpg", { type: "image/jpeg" });
              
              // Upload to Cloudinary via backend
              const response = await uploadProfilePicture(file);
              setProfileImage(response.imageUrl);
              
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("profileImageUpdated"));
              }
              
              setNotificationMessage("Profile picture captured and uploaded successfully");
              setShowNotification(true);
              setTimeout(() => {
                setShowNotification(false);
              }, 3000);
            } catch (error: any) {
              console.error("Failed to upload captured photo:", error);
              setNotificationMessage(error.message || "Failed to upload photo. Please try again.");
              setShowNotification(true);
              setTimeout(() => {
                setShowNotification(false);
              }, 5000);
              setIsCapturing(false);
            } finally {
              setIsLoading(false);
            }
          }
        }, "image/jpeg", 0.95);
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
  const handleRemoveImage = async () => {
    // Note: To fully remove, we'd need a DELETE endpoint
    // For now, just clear from UI - the URL will remain in DB
    setProfileImage(null);
    if (typeof window !== "undefined") {
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

  // Close nationality dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        nationalityDropdownRef.current &&
        !nationalityDropdownRef.current.contains(target) &&
        nationalityButtonRef.current &&
        !nationalityButtonRef.current.contains(target)
      ) {
        setIsNationalityDropdownOpen(false);
        setCountrySearchQuery("");
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isNationalityDropdownOpen) {
        setIsNationalityDropdownOpen(false);
        setCountrySearchQuery("");
      }
    };

    if (isNationalityDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isNationalityDropdownOpen]);

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
              {userPhone && <p className="text-white/80 text-sm">Phone: {userPhone}</p>}
            </>
          ) : (
            <div className="w-full max-w-xs space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border ${
                    errors.fullLegalName ? "border-red-400" : "border-white/30"
                  } text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent`}
                  placeholder="Enter your name"
                />
                {errors.fullLegalName && (
                  <p className="text-red-700 text-xs mt-1 font-semibold">{errors.fullLegalName}</p>
                )}
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Gender</label>
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value as "male" | "female" | "other" | "prefer-not-to-say" | "")}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border ${
                    errors.phoneNumber ? "border-red-400" : "border-white/30"
                  } text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent`}
                  placeholder="+1234567890"
                />
                {errors.phoneNumber && (
                  <p className="text-red-700 text-xs mt-1 font-semibold">{errors.phoneNumber}</p>
                )}
              </div>
              <div className="relative">
                <label className="block text-white/80 text-sm font-medium mb-2">Nationality/Country *</label>
                <button
                  ref={nationalityButtonRef}
                  type="button"
                  onClick={() => {
                    if (!isNationalityDropdownOpen && nationalityButtonRef.current) {
                      const rect = nationalityButtonRef.current.getBoundingClientRect();
                      const viewportHeight = window.innerHeight;
                      const viewportWidth = window.innerWidth;
                      const dropdownMaxHeight = 400; // max height of dropdown
                      const viewportPadding = 16; // padding from viewport edges
                      
                      const spaceBelow = viewportHeight - rect.bottom - viewportPadding;
                      const spaceAbove = rect.top - viewportPadding;
                      
                      // Calculate available space and adjust dropdown height if needed
                      const availableSpaceBelow = Math.max(spaceBelow, viewportPadding);
                      const availableSpaceAbove = Math.max(spaceAbove, viewportPadding);
                      
                      // Position dropdown above button if not enough space below
                      const shouldPositionAbove = spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow;
                      
                      // Calculate actual dropdown height based on available space
                      const actualHeight = shouldPositionAbove 
                        ? Math.min(dropdownMaxHeight, availableSpaceAbove)
                        : Math.min(dropdownMaxHeight, availableSpaceBelow);
                      
                      // Calculate left position with padding
                      let leftPosition = rect.left + window.scrollX;
                      const dropdownWidth = Math.max(rect.width, 280);
                      
                      // Ensure dropdown doesn't go off the right edge
                      if (leftPosition + dropdownWidth > viewportWidth - viewportPadding) {
                        leftPosition = viewportWidth - dropdownWidth - viewportPadding;
                      }
                      
                      // Ensure dropdown doesn't go off the left edge
                      if (leftPosition < viewportPadding) {
                        leftPosition = viewportPadding;
                      }
                      
                      setNationalityDropdownPosition({
                        top: shouldPositionAbove 
                          ? rect.top + window.scrollY - actualHeight - 8
                          : rect.bottom + window.scrollY + 8,
                        left: leftPosition,
                        width: dropdownWidth,
                        maxHeight: actualHeight,
                      });
                    }
                    setIsNationalityDropdownOpen(!isNationalityDropdownOpen);
                    setCountrySearchQuery("");
                  }}
                  className={`w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border ${
                    errors.nationality ? "border-red-400" : "border-white/30"
                  } text-white text-left focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent flex items-center justify-between`}
                >
                  <span className="truncate">{editNationality || "Select country"}</span>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 transition-transform ${isNationalityDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {errors.nationality && (
                  <p className="text-red-700 text-xs mt-1 font-semibold">{errors.nationality}</p>
                )}
                {isNationalityDropdownOpen && (
                  <>
                    {mounted && createPortal(
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsNationalityDropdownOpen(false)}
                      />,
                      document.body
                    )}
                    {mounted && createPortal(
                      <div
                        ref={nationalityDropdownRef}
                        className="fixed z-50 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl"
                        style={{
                          top: `${nationalityDropdownPosition.top}px`,
                          left: `${nationalityDropdownPosition.left}px`,
                          width: `${nationalityDropdownPosition.width}px`,
                          maxHeight: `${nationalityDropdownPosition.maxHeight}px`,
                          minWidth: "280px",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Search Input */}
                        <div className="sticky top-0 p-3 bg-slate-800 border-b border-slate-700 rounded-t-xl">
                          <div className="relative">
                            <svg
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                              type="text"
                              value={countrySearchQuery}
                              onChange={(e) => setCountrySearchQuery(e.target.value)}
                              placeholder="Search countries..."
                              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fc4f02] focus:border-transparent text-sm"
                              autoFocus
                            />
                          </div>
                        </div>
                        {/* Countries List */}
                        <div 
                          className="overflow-y-auto"
                          style={{
                            maxHeight: `${(nationalityDropdownPosition.maxHeight || 400) - 80}px`, // Subtract search input height
                          }}
                        >
                          {filteredCountries.length > 0 ? (
                            filteredCountries.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                  setEditNationality(country.name);
                                  setIsNationalityDropdownOpen(false);
                                  setCountrySearchQuery("");
                                }}
                                className={`w-full px-4 py-2.5 text-left text-white hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-b-0 ${
                                  editNationality === country.name ? "bg-slate-700/50" : ""
                                }`}
                              >
                                <span className="text-sm">{country.name}</span>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-8 text-center text-slate-400 text-sm">
                              No countries found
                            </div>
                          )}
                        </div>
                      </div>,
                      document.body
                    )}
                  </>
                )}
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Date of Birth *</label>
                <input
                  type="date"
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                  onKeyDown={handleKeyDown}
                  max={maxDateOfBirth}
                  className={`w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border ${
                    errors.dateOfBirth ? "border-red-400" : "border-white/30"
                  } text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent`}
                />
                {errors.dateOfBirth && (
                  <p className="text-red-700 text-xs mt-1 font-semibold">{errors.dateOfBirth}</p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/30 hover:bg-white/40 backdrop-blur-sm border border-white/30 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Success/Error Notification */}
      {showNotification && mounted && typeof window !== "undefined" && createPortal(
        <div className="fixed top-4 right-4 z-[99999] animate-in slide-in-from-top-2">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg backdrop-blur-sm border shadow-lg ${
            notificationMessage.includes("successfully") || !notificationMessage.includes("Failed")
              ? "bg-gradient-to-r from-green-500/90 to-green-600/90 border-green-400/30 shadow-green-500/20"
              : "bg-gradient-to-r from-red-500/90 to-red-600/90 border-red-400/30 shadow-red-500/20"
          }`}>
            {notificationMessage.includes("successfully") || !notificationMessage.includes("Failed") ? (
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
            ) : (
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <span className="text-white font-medium">{notificationMessage || "Profile successfully updated"}</span>
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
      <div className="bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur-xl rounded-2xl p-6 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)]">
        <h3 className="text-xl font-bold text-white mb-6">Settings</h3>
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent hover:from-white/[0.1] hover:to-transparent transition-all duration-200 group cursor-pointer"
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

