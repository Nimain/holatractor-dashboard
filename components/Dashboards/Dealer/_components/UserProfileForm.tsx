'use client';

import React, { useState } from 'react';
import { User, Upload } from 'lucide-react';

export default function UserProfileForm() {
  const [formData, setFormData] = useState({
    firstName: 'Francis',
    middleName: '',
    lastName: 'Farmer',
    email: 'farmer@holatractor.com',
    contactNumber: '9802323823',
    gender: 'Male',
    age: '36',
    address: 'Santa Cruz, Bolivia'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpload = () => {
    // Handle profile picture upload
    console.log('Upload profile picture');
  };

  const handleEditProfile = () => {
    // Handle edit profile action
    console.log('Edit profile');
  };

  return (
    <div className=" bg-white">
      <div className=" mx-auto">
        <div className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-lg p-8 text-white">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <User className="w-6 h-6" />
            <h1 className="text-2xl font-bold">User Profile</h1>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-transparent border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:border-white/60"
              />
            </div>

            {/* Middle Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Middle Name (Optional)</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleInputChange}
                placeholder="Enter Middle Name"
                className="w-full px-4 py-3 bg-transparent border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:border-white/60"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-transparent border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:border-white/60"
              />
            </div>
          </div>

          {/* Email and Contact Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-transparent border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:border-white/60"
              />
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-medium mb-2">Contact Number</label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-transparent border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:border-white/60"
              />
            </div>
          </div>

          {/* Gender and Age Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Gender */}
            <div>
              <label className="block text-sm font-medium mb-2">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-transparent border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/60 appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px' }}
              >
                <option value="Male" className="text-black">Male</option>
                <option value="Female" className="text-black">Female</option>
                <option value="Other" className="text-black">Other</option>
              </select>
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium mb-2">Age</label>
              <select
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-transparent border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/60 appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px' }}
              >
                {Array.from({ length: 83 }, (_, i) => i + 18).map(age => (
                  <option key={age} value={age} className="text-black">{age}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Address */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-4 py-3 bg-transparent border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:border-white/60 resize-none"
            />
          </div>

          {/* Profile Picture */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-4">Profile Picture</label>
            <div 
              onClick={handleProfileUpload}
              className="w-80 h-32 bg-white rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-6 h-6 text-red-500 mb-2" />
              <p className="text-red-500 font-medium text-sm">Click to upload Profile Photo</p>
              <p className="text-gray-500 text-xs">SVG, JPG, PNG (max. 800×800px)</p>
            </div>
          </div>

          {/* Edit Profile Button */}
          <div className="flex justify-end">
            <button
              onClick={handleEditProfile}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}