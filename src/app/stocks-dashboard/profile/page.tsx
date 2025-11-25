"use client";

import { useState, useEffect, useRef } from "react";

export default function StocksProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageButtonRef = useRef<HTMLButtonElement>(null);
  const imageMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("quantivahq_user_name");
      const savedEmail = localStorage.getItem("quantivahq_user_email");
      const savedImage = localStorage.getItem("quantivahq_profile_image");
      
      if (savedName) setName(savedName);
      if (savedEmail) setEmail(savedEmail);
      if (savedImage) setProfileImage(savedImage);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        imageMenuRef.current &&
        !imageMenuRef.current.contains(event.target as Node) &&
        imageButtonRef.current &&
        !imageButtonRef.current.contains(event.target as Node)
      ) {
        setShowImageOptions(false);
      }
      if (showCameraPreview && videoRef.current && !videoRef.current.contains(event.target as Node)) {
        // Don't close camera preview on outside click
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCameraPreview]);

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("quantivahq_user_name", name);
      localStorage.setItem("quantivahq_user_email", email);
      setIsEditing(false);
      
      // Dispatch event for top bar update
      window.dispatchEvent(new CustomEvent("profileImageUpdated"));
    }
  };

  const handleCancel = () => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("quantivahq_user_name") || "John Doe";
      const savedEmail = localStorage.getItem("quantivahq_user_email") || "john.doe@example.com";
      setName(savedName);
      setEmail(savedEmail);
    }
    setIsEditing(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        if (typeof window !== "undefined") {
          localStorage.setItem("quantivahq_profile_image", base64String);
          window.dispatchEvent(new CustomEvent("profileImageUpdated"));
        }
      };
      reader.readAsDataURL(file);
    }
    setShowImageOptions(false);
  };

  const handleCaptureImage = () => {
    setShowImageOptions(false);
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((mediaStream) => {
        setStream(mediaStream);
        setShowCameraPreview(true);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      })
      .catch((error) => {
        console.error("Error accessing camera:", error);
        alert("Unable to access camera. Please check permissions.");
      });
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const base64String = canvas.toDataURL("image/png");
        setProfileImage(base64String);
        if (typeof window !== "undefined") {
          localStorage.setItem("quantivahq_profile_image", base64String);
          window.dispatchEvent(new CustomEvent("profileImageUpdated"));
        }
      }
    }
    cancelCamera();
  };

  const cancelCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCameraPreview(false);
  };

  const handleRemovePhoto = () => {
    setProfileImage(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("quantivahq_profile_image");
      window.dispatchEvent(new CustomEvent("profileImageUpdated"));
    }
    setShowImageOptions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isEditing) {
      handleSave();
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Profile Settings</h2>
        
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          {/* Profile Image */}
          <div className="relative">
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-slate-200">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-bold text-white">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button
              ref={imageButtonRef}
              onClick={() => setShowImageOptions(!showImageOptions)}
              className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {showImageOptions && (
              <div
                ref={imageMenuRef}
                className="absolute right-0 top-0 z-50 mt-12 w-48 rounded-lg border border-slate-200 bg-white shadow-xl"
              >
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                >
                  Upload from Media
                </button>
                <button
                  onClick={handleCaptureImage}
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                >
                  Capture Photo
                </button>
                {profileImage && (
                  <button
                    onClick={handleRemovePhoto}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-100"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="mt-1 text-lg font-semibold text-slate-900">{name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="mt-1 text-lg text-slate-600">{email}</p>
              )}
            </div>

            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="rounded-lg border border-slate-300 bg-white px-6 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Camera Preview Modal */}
      {showCameraPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative max-w-md">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="h-auto w-full rounded-lg"
            />
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={capturePhoto}
                className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
              >
                Capture
              </button>
              <button
                onClick={cancelCamera}
                className="rounded-lg border border-slate-300 bg-white px-6 py-2 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

