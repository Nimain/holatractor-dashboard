"use client";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const ProfileDisplay = () => {
  const router = useRouter();

  const activeLanguage = useSelector(
    (state: any) => state.Languages?.activeLanguage || "English"
  );

  const getText = (enText: string, esText: string) => {
    return activeLanguage === "Español" ? esText : enText;
  };

  // Loading state
  const [loading, setLoading] = useState(true);

  // Profile data with your specified values
  const [profileData, setProfileData] = useState({
    first_name: "John",
    last_name: "TestFarmer",
    email: "info@sinsignal.com",
    dob: "1990-05-15",
    gender: "male",
    country_code: "+91",
    mobile: "9876543210",
    middle_name: "",
    location_name: "",
    location_address: "",
    location_city: "",
    location_state: "",
    location_zip_code: "",
    location_country: "India",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Generic handler to update profile data
  const handleProfileChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const capitalizeFirst = (str: string) => {
    if (!str) return "Not provided";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handlePasswordSubmit = () => {
    if (!profileData.password || !profileData.confirmPassword) {
      setError(
        getText(
          "Please fill out both fields",
          "Por favor, rellena ambos campos"
        )
      );
      return;
    }
    if (profileData.password !== profileData.confirmPassword) {
      setError(
        getText("Passwords do not match!", "¡Las contraseñas no coinciden!")
      );
      return;
    }
    setError("");
    router.push("/verifyowner/success");
  };

  const cityOptions = [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Chennai",
    "Kolkata",
    "Pune",
    "Hyderabad",
  ];
  const countryOptions = ["India", "USA", "UK", "Canada", "Australia"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-rose-900 to-orange-900 p-6">
        <div className="bg-white rounded-lg p-8 shadow-lg w-full max-w-md">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-700 text-lg font-medium">
              {getText("Loading profile...", "Cargando perfil...")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-red-900 via-rose-900 to-orange-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-20"
            style={{
              left: `${(i * 11) % 100}%`,
              top: `${(i * 13) % 100}%`,
              width: `${2 + (i % 4)}px`,
              height: `${2 + (i % 4)}px`,
            }}
          />
        ))}
      </div>
      <div className="max-w-8xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
            {getText("Profile Management", "Gestión de Perfil")}
          </h1>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Information Card */}
            <div className="rounded-lg shadow-lg overflow-hidden bg-transparent">
              <div className="px-6 py-4 bg-gradient-to-b from-white/3 to-white/2 backdrop-blur-sm">
                <h2 className="text-xl font-semibold text-white mb-3">
                  {getText("Profile Information", "Información del Perfil")}
                </h2>
                <div className="h-0.5 bg-red-600 mb-4 rounded" />

                {/* Profile Picture */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
                  <div className="flex justify-center items-start">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-lg">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Required Fields (Read Only) */}
                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="px-3 py-2 rounded bg-white shadow-sm border">
                    <p className="text-xs text-gray-600 mb-1">{getText("First Name", "Nombre")}</p>
                    <p className="text-sm font-semibold text-gray-800">{profileData.first_name}</p>
                  </div>
                  <div className="px-3 py-2 rounded bg-white shadow-sm border">
                    <p className="text-xs text-gray-600 mb-1">{getText("Last Name", "Apellido")}</p>
                    <p className="text-sm font-semibold text-gray-800">{profileData.last_name}</p>
                  </div>
                </div> */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="px-3 py-2 rounded bg-white shadow-sm border">
                    <p className="text-xs text-gray-600 mb-1">
                      {getText("Full Name", "Nombre Completo")}
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {profileData.first_name}{" "}
                      {profileData.middle_name && profileData.middle_name + " "}
                      {profileData.last_name}
                    </p>
                  </div>
                  <div className="px-3 py-2 rounded bg-white shadow-sm border">
                    <p className="text-xs text-gray-600 mb-1">
                      {getText("Email", "Correo Electrónico")}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {profileData.email}
                    </p>
                  </div>
                </div>

                {/* Date of Birth (Editable) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="px-3 py-2 rounded bg-white shadow-sm border">
                    <p className="text-xs text-gray-600 mb-1 font-medium">
                      {getText("Date of Birth", "Fecha de Nacimiento")}
                      <span className="text-red-500 ml-1">*</span>
                    </p>
                    <input
                      type="date"
                      value={profileData.dob}
                      onChange={(e) =>
                        handleProfileChange("dob", e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                  <div className="px-3 py-2 rounded bg-white shadow-sm border">
                    <p className="text-xs text-gray-600 mb-1">
                      {getText("Gender", "Género")}
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {capitalizeFirst(profileData.gender)}
                    </p>
                  </div>
                </div>

                {/* Mobile Information */}
                <div className="px-3 py-2 rounded bg-white shadow-sm border">
                  <p className="text-xs text-gray-600 mb-1">
                    {getText("Mobile Number", "Número Móvil")}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-800 px-2 py-1 bg-gray-100 rounded">
                      {profileData.country_code}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      {profileData.mobile}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Management Card */}
            <div className="rounded-lg shadow-lg overflow-hidden bg-transparent">
              <div className="px-6 py-4 bg-gradient-to-b from-white/3 to-white/2 backdrop-blur-sm">
                <h2 className="text-xl font-semibold text-white mb-3">
                  {getText("Password Management", "Gestión de Contraseña")}
                </h2>
                <div className="h-0.5 bg-red-600 mb-4 rounded" />
                <div className="space-y-12">
                  <div className="px-3 py-2 mt-[54px] rounded bg-white shadow-sm border">
                    <p className="text-xs text-gray-600 mb-1">
                      {getText("New Password", "Nueva Contraseña")}
                    </p>
                    <input
                      type="password"
                      value={profileData.password}
                      onChange={(e) =>
                        handleProfileChange("password", e.target.value)
                      }
                      placeholder={getText(
                        "Enter new password",
                        "Introduce la nueva contraseña"
                      )}
                      className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="px-3 py-2  rounded bg-white shadow-sm border">
                    <p className="text-xs text-gray-600 mb-1">
                      {getText("Confirm Password", "Confirmar Contraseña")}
                    </p>
                    <input
                      type="password"
                      value={profileData.confirmPassword}
                      onChange={(e) =>
                        handleProfileChange("confirmPassword", e.target.value)
                      }
                      placeholder={getText(
                        "Confirm new password",
                        "Confirma la nueva contraseña"
                      )}
                      className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  {error && (
                    <div className="px-3 py-2 rounded bg-red-50 border border-red-200">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                  <button
                    onClick={handlePasswordSubmit}
                    className="w-full bg-red-600 text-white py-2 px-6 rounded hover:bg-red-700 transition-colors  text-sm font-medium"
                  >
                    {getText("Update Password", "Actualizar Contraseña")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Optional Address Section */}
          <div className="rounded-lg shadow-lg overflow-hidden bg-transparent">
            <div className="px-6 py-4 bg-gradient-to-b from-white/3 to-white/2 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-white">
                  {getText("Address Information", "Información de Dirección")}
                </h2>
                {/* <span className="text-sm text-red-200 font-medium">
                  {getText("(Optional)", "(Opcional)")}
                </span> */}
              </div>
              <div className="h-0.5 bg-red-600 mb-4 rounded" />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Address Fields */}
                <div className="space-y-4">
                  <div className="px-3 py-2 rounded bg-white shadow-sm border">
                    <p className="text-xs text-gray-600 mb-1 font-medium">
                      {getText("Address Line 1", "Dirección 1")}
                    </p>
                    <textarea
                      value={profileData.location_name}
                      onChange={(e) =>
                        handleProfileChange("location_name", e.target.value)
                      }
                      rows={2}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                      placeholder={getText(
                        "Enter address line 1",
                        "Introduce la dirección 1"
                      )}
                    />
                  </div>
                  <div className="px-3 py-2 rounded bg-white shadow-sm border">
                    <p className="text-xs text-gray-600 mb-1 font-medium">
                      {getText("Address Line 2", "Dirección 2")}
                    </p>
                    <textarea
                      value={profileData.location_address}
                      onChange={(e) =>
                        handleProfileChange("location_address", e.target.value)
                      }
                      rows={2}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                      placeholder={getText(
                        "Enter address line 2",
                        "Introduce la dirección 2"
                      )}
                    />
                  </div>
                </div>

                {/* Location Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="px-3 py-2 rounded bg-white shadow-sm border">
                      <p className="text-xs text-gray-600 mb-1 font-medium">
                        {getText("City", "Ciudad")}
                      </p>
                      <select
                        value={profileData.location_city}
                        onChange={(e) =>
                          handleProfileChange("location_city", e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        <option value="">
                          {getText("Select City", "Seleccionar Ciudad")}
                        </option>
                        {cityOptions.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="px-3 py-2 rounded bg-white shadow-sm border">
                      <p className="text-xs text-gray-600 mb-1 font-medium">
                        {getText("State", "Estado")}
                      </p>
                      <input
                        type="text"
                        value={profileData.location_state}
                        onChange={(e) =>
                          handleProfileChange("location_state", e.target.value)
                        }
                        placeholder={getText(
                          "Enter state",
                          "Introduce el estado"
                        )}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="px-3 py-2 rounded bg-white shadow-sm border">
                      <p className="text-xs text-gray-600 mb-1 font-medium">
                        {getText("Zip Code", "Código Postal")}
                      </p>
                      <input
                        type="text"
                        value={profileData.location_zip_code}
                        onChange={(e) =>
                          handleProfileChange(
                            "location_zip_code",
                            e.target.value
                          )
                        }
                        placeholder={getText(
                          "Enter zip code",
                          "Introduce el código postal"
                        )}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                    <div className="px-3 py-2 rounded bg-white shadow-sm border">
                      <p className="text-xs text-gray-600 mb-1 font-medium">
                        {getText("Country", "País")}
                      </p>
                      <select
                        value={profileData.location_country}
                        onChange={(e) =>
                          handleProfileChange(
                            "location_country",
                            e.target.value
                          )
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        <option value="">
                          {getText("Select Country", "Seleccionar País")}
                        </option>
                        {countryOptions.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <button
              type="button"
              className="bg-red-600 text-white rounded-lg px-6 py-3 flex justify-center items-center hover:bg-red-700 transition-colors font-medium"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
              {getText("Create Account", "Crear Cuenta")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDisplay;
