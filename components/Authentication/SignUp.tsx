"use client";

import { errorMessage } from "@/utils/Toastify/Messages";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/assets/logo.png";
import SignupCard from "./SignupCard";
import GoogleLogin from "./GoogleLogin"

const SignUp = () => {
  const [isSignUpCard, setIsSignUpCard] = useState(false)

  const [name, setName] = useState("");

  function handleNameChage(name: string) {
    setName(name)
    
    const { lastName } = splitFullName(name)

    if(lastName) setIsSignUpCard(true)
      else setIsSignUpCard(false)
  }

  const splitFullName = (fullName: string) => {
    const nameParts = fullName.trim().split(/\s+/); // Split by spaces
    const firstName = nameParts.shift(); // Take the first element as the first name
    const lastName = nameParts.pop(); // Take the last element as the last name
    const middleName = nameParts.join(" "); // Join the rest as middle name

    return { firstName, middleName, lastName };
  };

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

  return (
    <div className="w-full min-h-[100vh] max-h-fit text-[18px] flex items-center justify-center">

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
                  handleNameChage(e.target.value);
                }}
              />
            </div>
              {
                isSignUpCard ?
                <SignupCard name={name} />
                :
                <button
              name="Name_next_button"
              className="p-[10px] w-[30%] flex items-center justify-center bg-[#AB0F0C]"
              onClick={() => {
                errorMessage("Please give your name")
              }}
            >
              Next
            </button>
              }
          </div>
        </div>

        {/* <p className="flex items-center justify-center gap-[10px]">
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
        </p> */}
        <GoogleLogin />
      </div>
    </div>
  );
};

export default SignUp;
