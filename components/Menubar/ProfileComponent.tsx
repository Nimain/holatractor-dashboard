"use client";

import { useCallback, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useCookie } from "next-cookie";
import { Avatar, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import Image from "next/image";
import userImage from './user.png'
import { useDropzone } from 'react-dropzone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";

const ProfileComponent = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { push } = useRouter()

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");
  const user = cookie.get("user")

  const [emailVerification, setEmailVerification] = useState(false)

  const [file, setFile] = useState("");

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const image = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setSelectedImage(result);
      }
    };
    reader.readAsDataURL(image);
  }, []);


  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': []
    },
    multiple: false,
  });

  function RedirectToLogin() {
    push("/login")
  }

  async function handleLogInLogOut() {
    if (user) {
      cookie.remove("access_token")
      cookie.remove("user")
    }
    push("/login")
  }

  async function handleEmailVerification() {
    setEmailVerification(true)
    const access_token = cookie.get("access_token")
    renderInstance.post("/user/SendVerificationLink", {}, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      }
    })
      .then((res) => {
        console.log(res)
        if (res.status === 201 && res.data === "Verification link sent successfully") successMessage("Email sent successfully")
      }).catch((err) => {
        errorMessage("Some error occurred while sending verification link")
      }).finally(() => { setEmailVerification(false) })
  }

  if (emailVerification) return <CircularProgress />

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <div className="w-fit h-fit rounded-full drop-shadow-md">
          <Avatar
            className="cursor-pointer"
            onClick={() => {
              access_token ? setDialogOpen(true) : RedirectToLogin();
            }}
          />
        </div>
      </DialogTrigger>

      <DialogContent
        className="bg-white max-h-[90vh] w-full max-w-2xl overflow-hidden p-0"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Header with background image */}
        <div className="relative h-40 bg-gradient-to-r from-orange-400 to-orange-300">
  <div 
    className="absolute inset-0 bg-cover bg-center"
    style={{
      backgroundImage:
        "url('https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80')",
      opacity: 0.9,
    }}
  />

  {/* ✅ CLOSE BUTTON */}
  <DialogClose asChild>
    <button
      className="absolute right-4 top-4 z-50 rounded-full bg-white/90 p-2 
                 hover:bg-white transition"
      aria-label="Close"
    >
      <X className="h-5 w-5 text-gray-800" />
    </button>
  </DialogClose>

  <DialogHeader className="relative z-10 p-6">
    <p className="text-2xl font-bold text-white">Your Profile</p>
  </DialogHeader>

  {/* Profile Image */}
  <div className="absolute left-8 -bottom-16 z-30">
    {user ? (
      <Image
        src={user.image ?? userImage}
        alt={user.name}
        width={120}
        height={120}
        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
      />
    ) : (
      <div
        {...getRootProps()}
        className="dropzone text-center border-dashed border-2 border-gray-300 p-6 rounded-full bg-white"
      >
        <input {...getInputProps()} />
        {selectedImage ? (
          <Image
            src={selectedImage}
            alt="Person icon"
            width={120}
            height={120}
            className="w-32 h-32 object-cover rounded-full cursor-pointer border-4 border-white shadow-lg"
          />
        ) : (
          <p className="text-gray-600 text-sm">Upload</p>
        )}
      </div>
    )}
  </div>
</div>


        <div
          className="bg-white transition-all duration-500 px-8 pb-8 pt-20 relative z-20 text-black flex flex-col gap-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full flex flex-col gap-6">

            {/* User Information - Centered with Labels */}
            <div className="flex flex-col gap-3">
              {user ? (
                <>
                  <div className="flex items-center gap-2">
                    <p className="text-base text-gray-600 font-medium">Name:</p>
                    <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <p className="text-base text-gray-600 font-medium">Email:</p>
                    <p className="text-base text-gray-700">{user.email}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <p className="text-base text-gray-600 font-medium">Mobile Number:</p>
                    <p className="text-base text-gray-700">{`${user.country_code}${user.phone}`}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 w-full max-w-md">
                    <label htmlFor="create_profile_name" className="text-base font-medium text-gray-600 whitespace-nowrap">
                      Name:
                    </label>
                    <div className="px-4 py-2 rounded-md border border-gray-300 flex-1">
                      <input
                        type="text"
                        name="create_profile_name"
                        id="create_profile_name"
                        className="outline-none border-none w-full"
                        placeholder="Enter your name"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full max-w-md">
                    <label htmlFor="create_profile_email" className="text-base font-medium text-gray-600 whitespace-nowrap">
                      Email:
                    </label>
                    <div className="px-4 py-2 rounded-md border border-gray-300 flex-1">
                      <input
                        type="email"
                        name="create_profile_email"
                        id="create_profile_email"
                        className="outline-none border-none w-full"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full max-w-md">
                    <label htmlFor="create_profile_phone_number" className="text-base font-medium text-gray-600 whitespace-nowrap">
                      Mobile Number:
                    </label>
                    <div className="px-4 py-2 rounded-md border border-gray-300 flex-1">
                      <input
                        type="text"
                        name="create_profile_phone_number"
                        id="create_profile_phone_number"
                        className="outline-none border-none w-full"
                        placeholder="Enter your mobile number"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="w-full flex items-center gap-4 mt-2">
              <button
                name="edit_profile_button"
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white text-base font-semibold rounded-md flex-1 transition-colors"
                onClick={() => {
                  setDialogOpen(false)
                }}
              >
                Edit Profile
              </button>

              <button
                name="log_out_button"
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white text-base font-semibold rounded-md flex-1 transition-colors"
                onClick={() => {
                  handleLogInLogOut();
                }}
              >
                {user ? "Log Out" : "Log In"}
              </button>
            </div>

            {/* Referral Code and Social Media */}
            <div className="w-full flex flex-col gap-4 mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-gray-500">Your Referral Code</p>
                <p className="text-xl font-bold text-gray-900">0xxxxxx</p>
              </div>

              <div className="flex items-center justify-center gap-6 text-gray-600">
                <WhatsAppIcon className="cursor-pointer hover:text-green-500 transition-colors" fontSize="large" />
                <InstagramIcon className="cursor-pointer hover:text-pink-500 transition-colors" fontSize="large" />
                <TwitterIcon className="cursor-pointer hover:text-blue-400 transition-colors" fontSize="large" />
                <FacebookIcon className="cursor-pointer hover:text-blue-600 transition-colors" fontSize="large" />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileComponent;