'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useCookie } from 'next-cookie';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { uploadFileToS3 } from '@/utils/AWS/FileUpload';
import {
  User,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  RotateCcw,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  X,
  Building2
} from 'lucide-react';

export interface DealerProfileData {
  dealerId?: string;
  userId?: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  gender: string;
  age: string;
  address: string;
  image?: string;
}

export default function UserProfileForm() {
  const { cookie } = useCookie();

  // Extract auth user details from cookie
  const authUser = useMemo(() => {
    try {
      const raw = cookie.get('user') || cookie.get('user_info');
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return null;
    }
  }, [cookie]);

  const targetDealerId = useMemo(() => {
    return authUser?.dealer_id || authUser?.dealerId || authUser?.id || '';
  }, [authUser]);

  const targetUserId = useMemo(() => {
    return authUser?.userId || authUser?.user_id || authUser?.id || '';
  }, [authUser]);

  const targetEmail = useMemo(() => {
    return authUser?.email || '';
  }, [authUser]);

  const [formData, setFormData] = useState<DealerProfileData>({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    gender: 'Male',
    age: '26',
    address: '',
    image: '',
  });

  const [initialData, setInitialData] = useState<DealerProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch live profile from FastAPI (with local proxy fallback)
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    const queryParams: Record<string, string> = {};
    if (targetDealerId) queryParams.dealer_id = targetDealerId;
    if (targetUserId) queryParams.user_id = targetUserId;
    if (targetEmail) queryParams.email = targetEmail;

    try {
      // 1. Direct FastAPI request via renderInstance
      const res = await renderInstance.get('/dealer/profile', { params: queryParams });
      const profile = res.data?.profile;

      if (profile) {
        const loaded: DealerProfileData = {
          dealerId: profile.dealerId || targetDealerId || '',
          userId: profile.userId || targetUserId || '',
          firstName: profile.firstName || '',
          middleName: profile.middleName || '',
          lastName: profile.lastName || '',
          email: profile.email || targetEmail || '',
          contactNumber: profile.contactNumber || '',
          gender: profile.gender || 'Male',
          age: String(profile.age || '26'),
          address: profile.address || '',
          image: profile.image || '',
        };
        setFormData(loaded);
        setInitialData(loaded);
        if (loaded.image && loaded.image !== 'test') {
          setImagePreview(loaded.image);
        }
        return;
      }
    } catch (apiErr: any) {
      console.warn('FastAPI direct fetch failed, attempting local Next.js proxy fallback:', apiErr);
      try {
        const fallbackUrl = new URL('/api/dealer/profile', window.location.origin);
        if (targetDealerId) fallbackUrl.searchParams.set('dealer_id', targetDealerId);
        if (targetUserId) fallbackUrl.searchParams.set('user_id', targetUserId);
        if (targetEmail) fallbackUrl.searchParams.set('email', targetEmail);

        const res = await fetch(fallbackUrl.toString(), { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();

        if (data.profile) {
          const loaded: DealerProfileData = {
            dealerId: data.profile.dealerId || targetDealerId || '',
            userId: data.profile.userId || targetUserId || '',
            firstName: data.profile.firstName || '',
            middleName: data.profile.middleName || '',
            lastName: data.profile.lastName || '',
            email: data.profile.email || targetEmail || '',
            contactNumber: data.profile.contactNumber || '',
            gender: data.profile.gender || 'Male',
            age: String(data.profile.age || '26'),
            address: data.profile.address || '',
            image: data.profile.image || '',
          };
          setFormData(loaded);
          setInitialData(loaded);
          if (loaded.image && loaded.image !== 'test') {
            setImagePreview(loaded.image);
          }
        }
      } catch (fallbackErr: any) {
        console.error('All profile fetch attempts failed:', fallbackErr);
        setErrorMessage('Could not load profile from server. Please refresh or check connection.');
      }
    } finally {
      setLoading(false);
    }
  }, [targetDealerId, targetUserId, targetEmail]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Auto-hide alert messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Image Upload handler with S3 and preview
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 5MB limit. Please choose a smaller file.');
      return;
    }

    setUploadingImage(true);
    try {
      const localUrl = URL.createObjectURL(file);
      setImagePreview(localUrl);

      // Upload to S3
      const s3Url = await uploadFileToS3(file, file.name);
      if (s3Url) {
        setImagePreview(s3Url);
        setFormData((prev) => ({
          ...prev,
          image: s3Url,
        }));
      }
    } catch (uploadErr) {
      console.warn('S3 upload fallback to base64 preview:', uploadErr);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData((prev) => ({
          ...prev,
          image: base64String,
        }));
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleReset = () => {
    if (initialData) {
      setFormData(initialData);
      setImagePreview(initialData.image && initialData.image !== 'test' ? initialData.image : null);
      setSuccessMessage('Form reset to saved profile.');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.firstName.trim() || !formData.email.trim()) {
      setErrorMessage('First Name and Email are required.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const payload = {
      ...formData,
      dealer_id: formData.dealerId || targetDealerId,
      dealerId: formData.dealerId || targetDealerId,
      user_id: formData.userId || targetUserId,
      userId: formData.userId || targetUserId,
    };

    try {
      // 1. Direct FastAPI PUT via renderInstance
      const res = await renderInstance.put('/dealer/profile', payload);
      const data = res.data;

      // Sync user cookie if present so TopBar reflects name immediately
      try {
        if (authUser) {
          const updatedUser = {
            ...authUser,
            first_name: formData.firstName,
            last_name: formData.lastName,
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            mobile: formData.contactNumber,
            image: formData.image || authUser.image,
          };
          cookie.set('user', JSON.stringify(updatedUser), { path: '/' });
        }
      } catch (cookieErr) {
        console.warn('Cookie sync error:', cookieErr);
      }

      setSuccessMessage(data.message || 'Dealer profile updated successfully!');
      setInitialData(formData);
    } catch (err: any) {
      console.warn('FastAPI PUT failed, attempting local Next.js proxy fallback:', err);
      try {
        const res = await fetch('/api/dealer/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to update profile');
        }

        const data = await res.json();
        setSuccessMessage(data.message || 'Profile updated successfully!');
        setInitialData(formData);
      } catch (fallbackErr: any) {
        console.error('Profile update error:', fallbackErr);
        setErrorMessage(fallbackErr.message || 'Error saving profile. Please check your connection.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Alerts / Feedback Banner */}
        {successMessage && (
          <div className="bg-white border-l-4 border-emerald-500 shadow-md text-emerald-950 px-4 py-3 rounded-xl flex items-center justify-between animate-fade-in ring-1 ring-emerald-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Success</p>
                <p className="text-sm font-semibold text-gray-900">{successMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="bg-white border-l-4 border-rose-500 shadow-md text-rose-950 px-4 py-3 rounded-xl flex items-center justify-between animate-fade-in ring-1 ring-rose-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Error</p>
                <p className="text-sm font-semibold text-gray-900">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-2xl p-16 text-white text-center space-y-3 shadow-xl">
            <RefreshCw className="h-8 w-8 text-orange-400 animate-spin mx-auto" />
            <p className="text-sm font-medium text-gray-200">Loading dealer profile...</p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-2xl p-6 sm:p-9 text-white shadow-xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/20 mb-8 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <User className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Dealer User Profile</h1>
                  <p className="text-xs text-gray-300">
                    Manage your personal account credentials and dealership contact information
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {formData.dealerId && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 rounded-lg text-xs font-mono text-gray-300 border border-white/10">
                    <Building2 size={13} className="text-orange-400" />
                    ID: {formData.dealerId.slice(0, 12)}...
                  </span>
                )}
                <button
                  type="button"
                  onClick={fetchProfile}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Reload from server"
                >
                  <RefreshCw size={14} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Names Row (3 cols) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* First Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-200">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First Name"
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white/15 transition-all text-sm"
                  />
                </div>

                {/* Middle Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-200">
                    Middle Name <span className="opacity-70">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    placeholder="Middle Name"
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white/15 transition-all text-sm"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-200">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last Name"
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white/15 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Email and Contact Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-200 flex items-center gap-1.5">
                    <Mail size={14} className="text-orange-400" />
                    <span>Email Address *</span>
                  </label>
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="dealer@holatractor.com"
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white/15 transition-all text-sm"
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-200 flex items-center gap-1.5">
                    <Phone size={14} className="text-orange-400" />
                    <span>Contact Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    placeholder="+591 7761 3811"
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white/15 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Gender and Age Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-200">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none transition-all text-sm"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 14px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px',
                    }}
                  >
                    <option value="Male" className="text-gray-900">
                      Male
                    </option>
                    <option value="Female" className="text-gray-900">
                      Female
                    </option>
                    <option value="Other" className="text-gray-900">
                      Other
                    </option>
                  </select>
                </div>

                {/* Age */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-200 flex items-center gap-1.5">
                    <Calendar size={14} className="text-orange-400" />
                    <span>Age</span>
                  </label>
                  <select
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none transition-all text-sm"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 14px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px',
                    }}
                  >
                    {Array.from({ length: 83 }, (_, i) => i + 18).map((age) => (
                      <option key={age} value={String(age)} className="text-gray-900">
                        {age} years old
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-200 flex items-center gap-1.5">
                  <MapPin size={14} className="text-orange-400" />
                  <span>Physical Address / Dealership HQ</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Street, City, State, Country"
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white/15 transition-all text-sm resize-none"
                />
              </div>

              {/* Profile Picture Upload Section */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-200 flex items-center gap-1.5">
                  <Camera size={14} className="text-orange-400" />
                  <span>Profile Photo</span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-white/5 border border-white/20 rounded-2xl">
                  {/* Photo Avatar Preview */}
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/40 bg-white/10 flex items-center justify-center shrink-0 shadow-md">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-white/60" />
                    )}
                  </div>

                  {/* Upload button area */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 w-full p-4 bg-white rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors text-center"
                  >
                    {uploadingImage ? (
                      <div className="flex items-center gap-2 text-red-600 font-semibold text-sm">
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Uploading image to S3...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-red-600 mb-1" />
                        <p className="text-red-600 font-bold text-xs sm:text-sm">
                          Click to choose or replace profile picture
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          PNG, JPG or WebP (max. 5MB, uploaded to S3)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 border-t border-white/20">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-5 py-3 border border-white/30 hover:bg-white/10 rounded-xl text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw size={15} />
                  <span>Revert Changes</span>
                </button>

                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="w-full sm:w-auto px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}