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
    const cookiesToRemove = [
      "access_token",
      "user",
      "isFarmer",
      "isOperator",
      "isAgent",
      "isOwner",
      "isDealer",
      "isODealer",
    ];

    cookiesToRemove.forEach((name) => {
      cookie.remove(name, { path: "/" });
      cookie.remove(name);
      if (typeof document !== "undefined") {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });

    push("/login");
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
        className="bg-white max-h-[90vh] w-fit overflow-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <DialogHeader>
          <p className="text-2xl font-bold">Your Profile</p>
        </DialogHeader>

        <div
          className={`bg-white transition-all w-fit duration-500 h-fit max-h-[90vh] p-[30px] rounded-xl text-black text-[18px] flex flex-col gap-[10px] overflow-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full flex flex-col gap-[20px] relative">

            <div className="flex items-center justify-center gap-[10px]">

              {user ? (
                <Image
                  src={user.image ?? userImage}
                  alt={user.name}
                  width={80}
                  height={80}
                  className="w-20 aspect-square rounded-full object-cover"
                />
              ) : (
                <div
                  {...getRootProps()}
                  className="dropzone text-center border-dashed border-2 border-gray-300 p-6 rounded-md"
                >
                  <input {...getInputProps()} />
                  {selectedImage ? (
                    <Image
                      src={selectedImage}
                      alt="Person icon"
                      width={80}
                      height={80}
                      className="w-[80px] h-[80px] object-cover rounded-full cursor-pointer"
                    />
                  ) : (
                    <p className="text-gray-600">
                      Drag 'n' drop an image here, or click to select one
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-[10px]">
              {user ? (
                <div className="flex gap-3">
                  <label htmlFor="create_profile_name" className="w-fit">
                    Name:
                  </label>
                  <input
                    type="text"
                    name="create_profile_name"
                    id="create_profile_name"
                    className="outline-none border-none w-full font-bold"
                    value={user.name}
                    readOnly={true}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="create_profile_name" className="w-[150px]">
                    Name:
                  </label>
                  <div className="px-[10px] py-[6px] rounded-md border border-black">
                    <input
                      type="text"
                      name="create_profile_name"
                      id="create_profile_name"
                      className="outline-none border-none w-full"
                    />
                  </div>
                </div>
              )}

              {user ? (
                <div className="flex gap-3">
                  <label htmlFor="create_profile_email" className="w-fit">
                    Email:
                  </label>
                  <input
                    type="email"
                    name="create_profile_email"
                    id="create_profile_email"
                    className="outline-none border-none w-full font-bold"
                    value={user.email}
                  />
                  <p
                    className={`${
                      user.email_varified ? "text-green-400" : "text-red-400"
                    } cursor-pointer`}
                    onClick={() => {
                      !user.email_varified && handleEmailVerification();
                    }}
                  >
                    {user.email_varified ? "verified" : "unverified"}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-[4px]">
                  <label htmlFor="create_profile_email" className="w-[150px]">
                    Email:
                  </label>
                  <div className="px-[10px] py-[6px] rounded-md border border-black">
                    <input
                      type="email"
                      name="create_profile_email"
                      id="create_profile_email"
                      className="outline-none border-none w-full"
                    />
                  </div>
                </div>
              )}

              {user ? (
                <div className="flex gap-3">
                  <label
                    htmlFor="create_profile_phone_number"
                    className="w-fit whitespace-nowrap"
                  >
                    Phone number:
                  </label>
                  <input
                    type="text"
                    name="create_profile_phone_number"
                    id="create_profile_phone_number"
                    className="outline-none w-full font-bold"
                    value={`${user.country_code} ${user.phone}`}
                    readOnly={true}
                  />
                  <p
                    className={`${
                      user.phone_verified ? "text-green-400" : "text-red-400"
                    } cursor-pointer`}
                  >
                    unverified
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-[4px]">
                  <label
                    htmlFor="create_profile_phone_number"
                    className="w-[150px]"
                  >
                    Phone number:
                  </label>
                  <div className="px-[10px] py-[6px] rounded-md border border-black">
                    <input
                      type="text"
                      name="create_profile_phone_number"
                      id="create_profile_phone_number"
                      className="outline-none border-none w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-full flex items-center justify-center gap-[20px]">
            <button
              name="log_out_button"
              className="px-[16px] py-[8px] bg-black text-white text-[18px] rounded flex items-center justify-center gap-[10px] w-fit"
              onClick={() => {
                setDialogOpen(false)
              }}
            >
              Update
            </button>

            <button
              name="log_out_button"
              className="px-[16px] py-[8px] bg-black text-white text-[18px] rounded flex items-center justify-center gap-[10px] w-fit"
              onClick={() => {
                handleLogInLogOut();
              }}
            >
              {user ? "Log out" : "Log in"}
            </button>
          </div>

          <div className="w-full flex items-center justify-between gap-[20px]">
            <p>
              Your referel code is: <span className="font-[600]">0xxxxxx</span>
            </p>

            <div className="flex items-center gap-[20px] text-black">
              <WhatsAppIcon />
              <InstagramIcon />
              <TwitterIcon />
              <FacebookIcon />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <button
              name="add_task_cancel_button"
              className="bg-red-200 text-red-600 font-semibold px-5 py-2 rounded-md"
              onClick={() => {
                setDialogOpen(false);
              }}
            >
              Close
            </button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileComponent;
