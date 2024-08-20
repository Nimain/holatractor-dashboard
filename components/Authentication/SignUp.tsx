"use client";

import { uploadFileToS3 } from "@/utils/AWS/FileUpload";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Backdrop, CircularProgress } from "@mui/material";
import { useCookie } from "next-cookie";
import { useRouter } from "next/navigation";
import { useState, useEffect, SetStateAction } from "react";
import { countries } from "./CountryCodes";
import { Role } from "@/utils/Types/types";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/assets/logo.png";
import CryptoJS from "crypto-js";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const SignUp = () => {
  const [name, setName] = useState("");

  const [open, setOpen] = useState(false);
  const [nameBool, setNameBool] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedCode, setSelectedCode] = useState("+591"); // Default to US code
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailBool, setEmailBool] = useState(false);
  const [roleBool, setRoleBool] = useState(false);
  const [subscriptionBool, setSubscriptionBool] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState(0);
  const [gender, setGender] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [cpassword, setCPassword] = useState("");

  const [roles, setRoles] = useState<Role[]>([]);
  const [fetchingRoles, setFetchingRoles] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState("");

  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const { cookie } = useCookie();

  const [date, setDate] = useState<Date>();
  const [dateOpen, setDateOpen] = useState(false);

  function handleDateChange(e: any) {
    const tempDate = new Date(e)
    setDate(tempDate)
    setDateOpen(false)
  }

  const splitFullName = (fullName: string) => {
    const nameParts = fullName.trim().split(/\s+/); // Split by spaces
    const firstName = nameParts.shift(); // Take the first element as the first name
    const lastName = nameParts.pop(); // Take the last element as the last name
    const middleName = nameParts.join(" "); // Join the rest as middle name

    return { firstName, middleName, lastName };
  };

  function fetchAllRoles() {
    const access_token = cookie.get("access_token");

    if (access_token) {
      setFetchingRoles(true);
      renderInstance
        .get("/role", {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        })
        .then((res) => {
          setRoles(res.data);
        })
        .catch((err) => {
          errorMessage("Error fetching roles");
        })
        .finally(() => {
          setFetchingRoles(false);
        });
    } else {
      errorMessage("Admin not logged in");
    }
  }

  const router = useRouter();

  const cardsArray = [
    {
      imagelink:
        "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/dashboard/tractor_booking.png",
      cardName: "Tractor Booking",
    },
    {
      imagelink:
        "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/dashboard/farm_mech.png",
      cardName: "Farm Mechanization",
    },
    {
      imagelink:
        "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/dashboard/fleet.png",
      cardName: "Fleet Management",
    },
    {
      imagelink:
        "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/dashboard/pre_agri.png",
      cardName: "Precision Agriculture",
    },
  ];

  function handleInitialSignInClick() {
    const { firstName, lastName } = splitFullName(name);

    if (!firstName) {
      errorMessage("First name is required");
      return;
    }

    if (!lastName) {
      errorMessage("Last name is required");
      return;
    }
    setOpen(true);
    setRoleBool(false);
    setNameBool(true);
  }

  function handleEmailBool() {
    setNameBool(false);
    setRoleBool(false);
    setSubscriptionBool(false);
    setEmailBool(true);
  }

  function handleRoleBool() {
    setNameBool(false);
    setEmailBool(false);
    setRoleBool(false);
    setSubscriptionBool(true);
  }

  function handleSubscriptionBool() {}

  function calculateAge(dob: Date) {
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  async function handlePasswordStep() {
    if (!password || !cpassword) {
      errorMessage("Password and confirm password required");
      return;
    }

    if (password !== cpassword) {
      errorMessage("Consfirm password doesn't match");
      return;
    }

    const encryptedPassword = CryptoJS.AES.encrypt(
      password,
      "m4AfXfQ&1brl3LjQFYO"
    ).toString();

    const access_token = cookie.get("access_token");

    const { firstName, middleName, lastName } = splitFullName(name);

    if (!firstName) {
      errorMessage("First name is required");
      return;
    }

    if (!lastName) {
      errorMessage("Last name is required");
      return;
    }

    if (!email) {
      errorMessage("Last name is required");
      return;
    }

    if (!selectedCode || !phoneNumber) {
      errorMessage("Country code with mobile number required");
      return;
    }

    if (!date) {
      errorMessage("Please select your date of birth");
      return;
    }

    if (!gender) {
      errorMessage("Please tell us about your gender");
      return;
    }

    if (!roles) {
      errorMessage("Please select atleast one role");
      return;
    }

    let imageUrl = "";

    if (image) {
      setImageUploading(true);

      const buffer = Buffer.from(await image.arrayBuffer());
      imageUrl = await uploadFileToS3(buffer, image.name);

      setImageUploading(false);
      if (!imageUrl) {
        errorMessage("Something went wrong in uploading the image");
        return;
      }
    }

    const user = {
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      email: email,
      password: encryptedPassword,
      country_code: selectedCode,
      mobile: phoneNumber,
      image: imageUrl,
      age: calculateAge(new Date(date)),
      gender,
      role_id: selectedRoles,
      authType: "EMAIL",
    };

    setLoading(true);

    renderInstance
      .post("/user/signup", user, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        if (res.status === 201 && res.data.access_token) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 1);

          // Set the cookie with the calculated expiry date
          cookie.remove("access_token", { path: "/" });

          setNameBool(false);
          setEmailBool(false);
          setRoleBool(false);
          setSubscriptionBool(false);
          setOpen(false);

          successMessage("User sign up successfully");
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        }
      })
      .catch((err) => {
        if (
          err.response &&
          err.response.status === 409 &&
          err.response.data.message === "User already exists"
        ) {
          errorMessage("Email already taken");
        } else if (
          err.response &&
          err.response.status === 409 &&
          err.response.data.message === "Only admin users can create new users"
        ) {
          errorMessage("Only admin users can create new users");
        } else if (
          err.response &&
          err.response.status === 409 &&
          err.response.data.message === "Something went wrong"
        ) {
          errorMessage("Something went wrong");
        } else {
          errorMessage("Internal server error");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const allSubscription = [
    {
      name: "free",
      price: "0$",
    },
    {
      name: "lorem ipsum!",
      price: "200$",
    },
  ];

  useEffect(() => {
    fetchAllRoles();
  }, []);

  return (
    <div className="w-full min-h-[100vh] max-h-fit text-[18px] flex items-center justify-center">
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={open}
      >
        {imageUploading && <p>Image uploading</p>}

        {loading && <p>Creating the user</p>}

        {nameBool && !imageUploading && !loading && (
          <div
            className="bg-white p-[10px] 768px:p-[30px] w-[80vw] 768px:w-auto rounded-xl text-black flex flex-col gap-[20px] max-h-[90vh] overflow-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <p className="text-[26px] font-[600] text-center">
              Great! now give us your email please
            </p>

            <div className="px-[10px] 768px:px-[20px] py-[10px] w-full border-[2px] rounded-md">
              <input
                type="email"
                name="registration_email"
                id="registration_email"
                placeholder="Enter your email"
                className="bg-transparent outline-none bordet-none text-black w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="px-[10px] 768px:px-[20px] py-[10px] w-full border-[2px] rounded-md flex items-center gap-[10px]">
              <select
                className="bg-transparent outline-none border-none text-black w-[160px]"
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value)}
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="registration_phone_no"
                id="registration_phone_no"
                placeholder="Enter your phone number"
                className="bg-transparent outline-none border-none text-black flex-1"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <button
              name="email_next_button"
              className="px-[20px] py-[10px] bg-black text-white text-[18px] rounded flex items-center justify-center gap-[10px] w-fit mx-auto"
              onClick={() => {
                handleEmailBool();
              }}
            >
              Next
            </button>
          </div>
        )}

        {emailBool && !imageUploading && !loading && (
          <div className="bg-white p-[30px] w-[80vw] 768px:w-auto rounded-xl text-black flex flex-col items-center justify-center gap-[20px]">
            <p className="text-[26px] font-[600] text-center">
              Now please select your role
            </p>

            <div className="grid grid-cols-1 768px:grid-cols-2 gap-[20px]">
              {fetchingRoles ? (
                <p>Wait a minute fetching all roles</p>
              ) : roles.length === 0 ? (
                <p>No roles created</p>
              ) : (
                roles.map((roleItmes, index) => {
                  return (
                    <div
                      key={index}
                      className={`w-full 768px:w-[300px] ${
                        selectedRoles === roleItmes.id
                          ? "bg-green-200"
                          : "bg-white"
                      } ${
                        roleItmes.name === "admin" && "hidden"
                      } flex items-center justify-center py-[20px] px-[20px] rounded-md shadow-xl border-[2px]`}
                      // onClick={() => {
                      //     setSelectedRoles(pre => pre.includes(roleItmes.name) ?
                      //         pre.filter(old => old !== roleItmes.name) :
                      //         [...pre, roleItmes.name])
                      // }}
                      onClick={() => {
                        setSelectedRoles(roleItmes.id);
                      }}
                    >
                      {roleItmes.name}
                    </div>
                  );
                })
              )}
            </div>

            <button
              name="email_next_button"
              className="px-[20px] py-[10px] bg-black text-white text-[18px] rounded flex items-center justify-center gap-[10px] w-fit mx-auto"
              onClick={() => {
                handleRoleBool();
              }}
            >
              Next
            </button>
          </div>
        )}

        {roleBool && !imageUploading && !loading && (
          <div className="bg-white p-[30px] w-[80vw] 768px:w-auto rounded-xl text-black flex flex-col gap-[20px]">
            <p className="text-[26px] font-[600]">
              Now please purchase your subscription
            </p>

            <form className="grid grid-cols-1 gap-[20px]">
              {allSubscription.map((subscriptionItmes, index) => {
                return (
                  <div
                    key={index}
                    className="w-full 768px:w-[300px] bg-white flex items-center justify-between px-[20px] py-[20px] rounded-md shadow-xl border-[2px] cursor-pointer"
                    onClick={() => {
                      setActiveSubscription(index);
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-[14px] h-[14px] border-[2px] border-black rounded-full flex items-center justify-center">
                        {activeSubscription === index && (
                          <div className="w-[8px] h-[8px] rounded-full bg-green-400" />
                        )}
                      </div>

                      <p className="ml-[10px]">{subscriptionItmes.name}</p>
                    </div>

                    <p>{subscriptionItmes.price}</p>
                  </div>
                );
              })}
            </form>

            <div className="flex items-center justify-center gap-[20px]">
              {/* <button
                                name="email_next_button"
                                className='px-[20px] py-[10px] bg-black text-white text-[18px] rounded flex items-center justify-center gap-[10px] w-fit mx-auto'
                                onClick={() => { handleSubscriptionBool() }}>
                                Next
                            </button> */}

              <button
                name="email_next_button"
                className="px-[20px] py-[10px] bg-black text-white text-[18px] rounded flex items-center justify-center gap-[10px] w-fit mx-auto"
                onClick={() => {
                  handleSubscriptionBool();
                }}
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {subscriptionBool && !imageUploading && !loading && (
          <div className="bg-white p-[30px] w-[80vw] 768px:w-[60vw] max-h-[90vh] rounded-xl text-black flex flex-col gap-[20px] z-10 overflow-auto"
            style={{ scrollbarWidth: "none" }}>
            <div className="flex items-center justify-center w-full">
              {image ? (
                <Image
                  src={URL.createObjectURL(image)}
                  alt={name}
                  unoptimized={true}
                  className="w-52 aspect-square rounded-md object-cover"
                  width={200}
                  height={200}
                />
              ) : (
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 16"
                    >
                      <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      SVG, PNG, JPG or GIF (MAX. 800x400px)
                    </p>
                  </div>
                  <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files ? e.target.files[0] : null;
                      if (file) {
                        setImage(file);
                      }
                    }}
                  />
                </label>
              )}
            </div>

            <div className="space-y-2 flex flex-col">
              <label htmlFor="">Select your date of birth</label>
              <div>
                {
                  dateOpen ?
                  <Calendar mode="single" selected={date} onSelect={e=>{ handleDateChange(e) }} />
                  :
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                    onClick={() => {
                      setDateOpen(true);
                    }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                }
              </div>
            </div>

            <select
              className="px-[20px] py-[10px] w-full border-[2px] rounded-md"
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="" defaultChecked={true}>
                Select your gender
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="male">Others</option>
            </select>

            <div className="px-[20px] py-[10px] w-full border-[2px] rounded-md">
              <input
                type="password"
                name="registration_password"
                id="registration_password"
                placeholder="Enter your password"
                className="bg-transparent outline-none bordet-none text-black"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="px-[20px] py-[10px] w-full border-[2px] rounded-md">
              <input
                type="password"
                name="registration_confirm_passwodr"
                id="registration_confirm_password"
                placeholder="Please enter the password again"
                className="bg-transparent outline-none bordet-none text-black"
                value={cpassword}
                onChange={(e) => setCPassword(e.target.value)}
              />
            </div>

            <button
              name="email_next_button"
              className="px-[20px] py-[10px] bg-black text-white text-[18px] rounded flex items-center justify-center gap-[10px] w-fit mx-auto"
              onClick={() => {
                handlePasswordStep();
              }}
            >
              {loading ? <CircularProgress /> : "Sign up"}
            </button>
          </div>
        )}
      </Backdrop>

      <div
        className="w-[90%] min-h-[90vh] max-h-fit relative rounded 768px:rounded-[40px] overflow-hidden text-white flex flex-col items-center justify-evenly gap-[30px] py-[40px] bg-cover bg-no-repeat bg-blend-multiply bg-gray-500"
        style={{
          backgroundImage: `url('https://holaimagesdata.s3.us-west-2.amazonaws.com/web/dashboard/create_account.webp')`,
        }}
      >
        <div className="w-full px-[30px] flex items-center justify-center 768px:justify-between gap-[20px] flex-wrap">
          <Image
            src={Logo}
            alt="Logo"
            width={100}
            height={100}
            className="w-[160px] h-auto object-cover"
          />

          <Link href={"/login"}>
            <button
              name="Login_route_button"
              className="px-[30px] py-[10px] bg-[#AB0F0C] rounded-full"
            >
              Sign in
            </button>
          </Link>
        </div>

        <p className="text-[26px] 768px:text-[32px] font-bold text-center px-[10px] 768px:px-[50px]">
          Create your account to get your holatractor dashboard
        </p>

        <div className="px-[40px] hidden 768px:flex items-center justify-center gap-[20px] flex-wrap w-full">
          {cardsArray.map((cardDetails, index) => {
            return (
              <div
                className="px-[30px] py-[30px] flex flex-col gap-[10px] items-center justify-center bg-white/40 hover:bg-white/80 transition-all duration-500 rounded-xl hover:text-black cursor-pointer"
                key={index}
              >
                <Image
                  src={cardDetails.imagelink}
                  alt={cardDetails.cardName}
                  className="w-[50px] h-auto object-cover"
                  width={50}
                  height={50}
                />

                <p>{cardDetails.cardName}</p>
              </div>
            );
          })}
        </div>

        <div className="w-full px-[40px] flex flex-col items-center gap-[20px]">
          <div className="w-[240px] 400px:w-[300px] flex items-center bg-white overflow-hidden rounded-full">
            <div className="px-[20px] py-[10px] w-[70%]">
              <input
                type="text"
                name="registration_last_name"
                id="registration_last_name"
                placeholder="Enter your name"
                className="bg-transparent outline-none border-none text-black"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                }}
              />
            </div>
            <button
              name="Name_next_button"
              className="p-[10px] w-[30%] flex items-center justify-center bg-[#AB0F0C]"
              onClick={() => {
                handleInitialSignInClick();
              }}
            >
              Next
            </button>
          </div>
        </div>

        <p className="flex items-center justify-center gap-[10px]">
          Or continue with
          <Image
            src={
              "https://res.cloudinary.com/spiralyze/image/upload/v1694499636/expensify/1001/icon-googlesvg.svg"
            }
            className="w-[40px] h-auto object-cover cursor-pointer"
            alt="Google image"
            width={40}
            height={40}
          />
        </p>
      </div>
    </div>
  );
};

export default SignUp;
