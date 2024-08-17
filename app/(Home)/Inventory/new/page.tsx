"use client";

import Menubar from "@/components/Menubar/Menubar";
import { uploadFileToS3 } from "@/utils/AWS/FileUpload";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Backdrop } from "@mui/material";
import { useCookie } from "next-cookie";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Datepicker, { DateValueType } from "react-tailwindcss-datepicker";

const NewInventory = () => {
  const [activeLanguage, setActiveLanguage] = useState("en");

  const [loading, setLoading] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<File[]>([]);

  // Tractor state variables
  const [tractorName, setTractorName] = useState<string>("");
  const [tractorDesc, setTractorDesc] = useState<string>("");
  const [tractorModel, setTractorModel] = useState<string>("");
  const [tractorType, setTractorType] = useState<string>("");
  const [dobDate, setDobDate] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });
  
  const handleDobDateChange = (newValue: DateValueType) => {
    if (
      newValue &&
      typeof newValue === "object" &&
      "startDate" in newValue &&
      "endDate" in newValue
    ) {
      const startDate =
        newValue.startDate instanceof Date
          ? newValue.startDate
          : newValue.startDate
          ? new Date(newValue.startDate)
          : null;
  
      const endDate =
        newValue.endDate instanceof Date
          ? newValue.endDate
          : newValue.endDate
          ? new Date(newValue.endDate)
          : null;
  
      setDobDate({
        startDate,
        endDate,
      });
    }
  };

  // Location state variables
  const [city, setCity] = useState<string>("");

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedImage((prevImages) => [...prevImages, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  const router = useRouter()

  const handleAddInventory = async () => {
    let tractorImages: string[] = [];

    if (selectedImage.length > 0) {
      setImageLoading(true);

      const uploadPromises = selectedImage.map(async (image) => {
        const arrayBuffer = await image.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer); // Ensure you have the correct type for buffer
        return uploadFileToS3(buffer, image.name);
      });

      tractorImages = await Promise.all(uploadPromises);
      setImageLoading(false);
    }

    const inventory = {
      city: city,
      tractor_name: tractorName,
      tractor_description: tractorDesc,
      tractor_images: tractorImages,
      tractor_type: tractorType,
      tractor_model: tractorModel,
      tractor_year: dobDate.startDate, // Using the Date directly
    };

    setLoading(true);

    try {
      const res = await renderInstance.post("/inventory", inventory, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (res.status === 201) {
        successMessage("Inventory created successfully");
        setTimeout(() => {
            router.refresh()
        }, 2000);
      }
    } catch (err) {
      errorMessage("Some error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const allLanguages = [
    { name: "English *", locale: "en" },
    { name: "française", locale: "fr" },
    { name: "Português", locale: "pt" },
    { name: "Deutsch", locale: "de" },
    { name: "한국인", locale: "ko" },
    { name: "Español", locale: "es" },
    { name: "vsvenska", locale: "sv" },
  ];

  return (
    <div className="w-full py-10 px-4 flex flex-col gap-5 items-center">
      <Menubar pagename={"New inventory"} />

      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={imageLoading || loading}
      >
        {loading && <p>Creating inventory</p>}

        {imageLoading && <p>Uploading image</p>}
      </Backdrop>

      <div className="w-full flex flex-wrap gap-5 items-center justify-center">
        {allLanguages.map((details, index) => {
          return (
            <div
              key={index}
              className={`text-xl font-medium px-4 py-2 transition border border-t-0 border-l-0 border-r-0 border-purple-500 ${
                details.locale === activeLanguage
                  ? "border-b-4 text-primaryColor"
                  : "border-b-0"
              } cursor-pointer`}
              onClick={() => {
                setActiveLanguage(details.locale);
              }}
            >
              {details.name}
            </div>
          );
        })}
      </div>

      <div className="max-w-[600px] mx-auto">
        <div
          {...getRootProps()}
          className="dropzone text-center border-dashed border-2 border-gray-300 p-6 rounded-md w-full"
        >
          <input {...getInputProps()} />
          <p className="text-gray-600">
            Drag 'n' drop an image here, or click to select one
          </p>
        </div>
      </div>

      <div className="w-full max-w-[600px] my-[4px] flex items-center flex-wrap gap-5 mx-auto">
        {selectedImage.length > 0 &&
          selectedImage.map((image, index) => {
            return (
              <Image
                alt="image"
                src={URL.createObjectURL(image)}
                key={index}
                width={80}
                height={80}
                className="object-cover w-[80px] h-[80px] cursor-pointer rounded-md"
                unoptimized={true}
              />
            );
          })}
      </div>
      {activeLanguage === "en" && (
        <>
          <div className="w-full max-w-[600px] flex flex-col items-center gap-[20px]">
            <div className="flex flex-col gap-[4px] w-full">
              <label className="text-[18px]">Name</label>

              <div className="px-[10px] py-[4px] border border-black rounded-md text-[16px]">
                <input
                  type="text"
                  placeholder="Tractor name"
                  className="outline-none bg-transparent border-none w-full"
                  value={tractorName}
                  onChange={(e) => {
                    setTractorName(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-[4px] w-full">
              <label className="text-[18px]">Model</label>

              <div className="px-[10px] py-[4px] border border-black rounded-md text-[16px]">
                <input
                  type="text"
                  placeholder="Tractor model"
                  className="outline-none bg-transparent border-none w-full"
                  value={tractorModel}
                  onChange={(e) => {
                    setTractorModel(e.target.value);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="w-full max-w-[600px] flex flex-col items-center gap-[20px]">
            <div className="flex flex-col gap-[4px] w-full">
              <label htmlFor="model_number_input" className="text-[18px]">
                Type:
              </label>

              <div className="px-[10px] py-[4px] border border-black rounded-md text-[16px] w-full">
                <select
                  className="outline-none bg-transparent border-none w-full"
                  onChange={(e) => {
                    setTractorType(e.target.value);
                  }}
                >
                  <option defaultChecked={true}>Select tractor type</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-[4px] w-full">
              <label htmlFor="model_number_input" className="text-[18px]">
                Year
              </label>

              <Datepicker
                value={dobDate}
                onChange={handleDobDateChange}
                asSingle={true}
                useRange={false}
              />
            </div>
          </div>

          <div className="w-full max-w-[600px] flex flex-col items-center gap-[20px]">
            <div className="flex flex-col gap-[4px] w-full">
              <label htmlFor="model_number_input" className="text-[18px]">
                Description
              </label>

              <div className="px-[10px] py-[4px] border border-black rounded-md text-[16px]">
                <textarea
                  className="resize-none w-full h-full outline-none"
                  value={tractorDesc}
                  onChange={(e) => {
                    setTractorDesc(e.target.value);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="w-full max-w-[600px] flex flex-col items-center gap-[20px]">
            <div className="flex flex-col gap-[4px] w-full">
              <label className="text-[18px]">City</label>

              <div className="px-[10px] py-[4px] border border-black rounded-md text-[16px]">
                <input
                  type="text"
                  placeholder="city name"
                  className="outline-none bg-transparent border-none w-full"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      <button
        name="submit_button"
        className="py-2 px-4 w-fit bg-black font-bold text-white rounded-md"
        onClick={() => {
          handleAddInventory();
        }}
      >
        Submit
      </button>
    </div>
  );
};

export default NewInventory;
