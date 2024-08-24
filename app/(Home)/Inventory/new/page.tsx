"use client";

import Menubar from "@/components/Menubar/Menubar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { uploadFileToS3 } from "@/utils/AWS/FileUpload";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Backdrop, Slider, SliderProps } from "@mui/material";
import { useCookie } from "next-cookie";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

function valuetext(value: any) {
  return `${value}$`;
}

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
  const [dobDate, setDobDate] = useState<string | undefined>(undefined);
  const [value, setValue] = useState([20, 100000]);

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

  const handleChange: SliderProps['onChange'] = (event, newValue) => {
    setValue(newValue as number[]);
  };

  function convertYearToDate(year: string): Date {
    return new Date(`${year}-01-01T00:00:00.000Z`);
  }

  const handleAddInventory = async () => {
    if(selectedImage.length === 0){
      errorMessage("Please give atleast one image")
      return
    }

    if(!tractorName){
      errorMessage("Please give the tractor name")
      return
    }

    if(!city){
      errorMessage("Please give the city name")
      return
    }

    if(!tractorType){
      errorMessage("Please select tractor type")
      return
    }

    if(!tractorDesc){
      errorMessage("Please give the tractor description")
      return
    }

    if(!tractorModel){
      errorMessage("Please give the tractor model details")
      return
    }

    if(!dobDate){
      errorMessage("Please select the year of purchase")
      return
    }
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
      tractor_year: convertYearToDate(dobDate), // Using the Date directly
      min_price: `${value[0]}`,
      max_price: `${value[1]}`
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
    { name: "English", locale: "en" },
    { name: "Español", locale: "es" },
    { name: "Aymara", locale: "ay" },
    { name: "Quechua", locale: "qu" },
    { name: "Guarani", locale: "gn" },
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
              className={`text-xl font-medium px-4 py-2 transition border border-t-0 border-l-0 border-r-0 border-purple-500 ${details.locale === activeLanguage
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

      {activeLanguage === "en" && (
        <Card className="max-w-[600px] w-full p-5">
          <CardContent className="max-w-[600px] w-full space-y-4">

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

            <div className="space-y-2">
              <Label htmlFor="tractor_name">Tractor name</Label>
              <Input
                id="tractor_name"
                className="w-full"
                placeholder='e.g - John deere'
                value={tractorName}
                onChange={(e) => {
                  setTractorName(e.target.value);
                }} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tractor_model">Tractor model</Label>
              <Input
                id="tractor_model"
                className="w-full"
                placeholder='e.g - DLIII'
                value={tractorModel}
                onChange={(e) => {
                  setTractorModel(e.target.value);
                }} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tractor_type">Select tractor type</Label>
              <Select
                onValueChange={(value) => setTractorType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tractor type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={"small"}>
                    Small
                  </SelectItem>
                  <SelectItem value={"medium"}>
                    Medium
                  </SelectItem>
                  <SelectItem value={"large"}>
                    Large
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tractor_year">Select year of purchase</Label>
              <Select
                onValueChange={(value) => setDobDate(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(20)].map((_, index) => {
                    const yearValue = new Date().getFullYear() - index
                    return (
                      <SelectItem key={yearValue} value={yearValue.toString()}>
                        {yearValue}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_city">City</Label>
              <Input
                id="location_city"
                className="w-full"
                placeholder='e.g - Berlin'
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                }} />
            </div>

            <div className="grid w-full gap-1.5">
              <Label htmlFor="message">Tractor description</Label>
              <Textarea
                placeholder="Type your message here."
                id="message" value={tractorDesc}
                className="resize-none w-full"
                onChange={(e) => {
                  setTractorDesc(e.target.value);
                }} />
            </div>

            <div className="space-y-1 w-full">
              <Label>
                Select minimum and maximum price per hour
              </Label>
              <Slider
                getAriaLabel={() => 'Temperature range'}
                value={value}
                onChange={handleChange}
                valueLabelDisplay="auto"
                getAriaValueText={valuetext}
              />
            </div>

            <div className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-2 w-fit">
                <Label>Min price</Label>
                <Input
                  type="number"
                  placeholder="Hourly price"
                  value={value[0]}
                  onChange={(e) => {
                    setValue([Number(e.target.value), value[1]]);
                  }}
                />
              </div>
              <div className="flex flex-col gap-2 w-fit">
                <Label>Max price</Label>
                <Input
                  type="number"
                  value={value[1]}
                  onChange={(e) => {
                    setValue([value[0], Number(e.target.value)]);
                  }}
                />
              </div>
            </div>

          </CardContent>
        </Card>
      )}

      {activeLanguage === "es" && (
        <Card className="max-w-[600px] w-full p-5">
        <CardContent className="max-w-[600px] w-full space-y-4">

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

          <div className="space-y-2">
            <Label htmlFor="tractor_name">Tractor name</Label>
            <Input
              id="tractor_name"
              className="w-full"
              placeholder='e.g - John deere'
              value={tractorName}
              onChange={(e) => {
                setTractorName(e.target.value);
              }} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tractor_model">Tractor model</Label>
            <Input
              id="tractor_model"
              className="w-full"
              placeholder='e.g - DLIII'
              value={tractorModel}
              onChange={(e) => {
                setTractorModel(e.target.value);
              }} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tractor_type">Select tractor type</Label>
            <Select
              onValueChange={(value) => setTractorType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tractor type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={"small"}>
                  Small
                </SelectItem>
                <SelectItem value={"medium"}>
                  Medium
                </SelectItem>
                <SelectItem value={"large"}>
                  Large
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tractor_year">Select year of purchase</Label>
            <Select
              onValueChange={(value) => setDobDate(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(20)].map((_, index) => {
                  const yearValue = new Date().getFullYear() - index
                  return (
                    <SelectItem key={yearValue} value={yearValue.toString()}>
                      {yearValue}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_city">City</Label>
            <Input
              id="location_city"
              className="w-full"
              placeholder='e.g - Berlin'
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
              }} />
          </div>

          <div className="grid w-full gap-1.5">
            <Label htmlFor="message">Your message</Label>
            <Textarea
              placeholder="Type your message here."
              id="message" value={tractorDesc}
              className="resize-none w-full"
              onChange={(e) => {
                setTractorDesc(e.target.value);
              }} />
          </div>

          <div className="space-y-1 w-full">
            <Label>
              Select minimum and maximum price per hour
            </Label>
            <Slider
              getAriaLabel={() => 'Temperature range'}
              value={value}
              onChange={handleChange}
              valueLabelDisplay="auto"
              getAriaValueText={valuetext}
            />
          </div>

          <div className="w-full">
            <div className="flex flex-col gap-[4px] w-fit">
              <Label>Min price</Label>
              <Input
                type="number"
                placeholder="Hourly price"
                value={value[0]}
                onChange={(e) => {
                  setValue([Number(e.target.value), value[1]]);
                }}
              />
            </div>
            <div className="flex flex-col gap-[4px] w-fit">
              <Label>Max price</Label>
              <Input
                type="number"
                value={value[1]}
                onChange={(e) => {
                  setValue([value[0], Number(e.target.value)]);
                }}
              />
            </div>
          </div>

        </CardContent>
      </Card>
      )}

      {activeLanguage === "ay" && (
        <Card className="max-w-[600px] w-full p-5">
        <CardContent className="max-w-[600px] w-full space-y-4">

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

          <div className="space-y-2">
            <Label htmlFor="tractor_name">Tractor name</Label>
            <Input
              id="tractor_name"
              className="w-full"
              placeholder='e.g - John deere'
              value={tractorName}
              onChange={(e) => {
                setTractorName(e.target.value);
              }} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tractor_model">Tractor model</Label>
            <Input
              id="tractor_model"
              className="w-full"
              placeholder='e.g - DLIII'
              value={tractorModel}
              onChange={(e) => {
                setTractorModel(e.target.value);
              }} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tractor_type">Select tractor type</Label>
            <Select
              onValueChange={(value) => setTractorType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tractor type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={"small"}>
                  Small
                </SelectItem>
                <SelectItem value={"medium"}>
                  Medium
                </SelectItem>
                <SelectItem value={"large"}>
                  Large
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tractor_year">Select year of purchase</Label>
            <Select
              onValueChange={(value) => setDobDate(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(20)].map((_, index) => {
                  const yearValue = new Date().getFullYear() - index
                  return (
                    <SelectItem key={yearValue} value={yearValue.toString()}>
                      {yearValue}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_city">City</Label>
            <Input
              id="location_city"
              className="w-full"
              placeholder='e.g - Berlin'
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
              }} />
          </div>

          <div className="grid w-full gap-1.5">
            <Label htmlFor="message">Your message</Label>
            <Textarea
              placeholder="Type your message here."
              id="message" value={tractorDesc}
              className="resize-none w-full"
              onChange={(e) => {
                setTractorDesc(e.target.value);
              }} />
          </div>

          <div className="space-y-1 w-full">
            <Label>
              Select minimum and maximum price per hour
            </Label>
            <Slider
              getAriaLabel={() => 'Temperature range'}
              value={value}
              onChange={handleChange}
              valueLabelDisplay="auto"
              getAriaValueText={valuetext}
            />
          </div>

          <div className="w-full">
            <div className="flex flex-col gap-[4px] w-fit">
              <Label>Min price</Label>
              <Input
                type="number"
                placeholder="Hourly price"
                value={value[0]}
                onChange={(e) => {
                  setValue([Number(e.target.value), value[1]]);
                }}
              />
            </div>
            <div className="flex flex-col gap-[4px] w-fit">
              <Label>Max price</Label>
              <Input
                type="number"
                value={value[1]}
                onChange={(e) => {
                  setValue([value[0], Number(e.target.value)]);
                }}
              />
            </div>
          </div>

        </CardContent>
      </Card>
      )}

      {activeLanguage === "qu" && (
        <Card className="max-w-[600px] w-full p-5">
        <CardContent className="max-w-[600px] w-full space-y-4">

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

          <div className="space-y-2">
            <Label htmlFor="tractor_name">Tractor name</Label>
            <Input
              id="tractor_name"
              className="w-full"
              placeholder='e.g - John deere'
              value={tractorName}
              onChange={(e) => {
                setTractorName(e.target.value);
              }} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tractor_model">Tractor model</Label>
            <Input
              id="tractor_model"
              className="w-full"
              placeholder='e.g - DLIII'
              value={tractorModel}
              onChange={(e) => {
                setTractorModel(e.target.value);
              }} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tractor_type">Select tractor type</Label>
            <Select
              onValueChange={(value) => setTractorType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tractor type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={"small"}>
                  Small
                </SelectItem>
                <SelectItem value={"medium"}>
                  Medium
                </SelectItem>
                <SelectItem value={"large"}>
                  Large
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tractor_year">Select year of purchase</Label>
            <Select
              onValueChange={(value) => setDobDate(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(20)].map((_, index) => {
                  const yearValue = new Date().getFullYear() - index
                  return (
                    <SelectItem key={yearValue} value={yearValue.toString()}>
                      {yearValue}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_city">City</Label>
            <Input
              id="location_city"
              className="w-full"
              placeholder='e.g - Berlin'
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
              }} />
          </div>

          <div className="grid w-full gap-1.5">
            <Label htmlFor="message">Your message</Label>
            <Textarea
              placeholder="Type your message here."
              id="message" value={tractorDesc}
              className="resize-none w-full"
              onChange={(e) => {
                setTractorDesc(e.target.value);
              }} />
          </div>

          <div className="space-y-1 w-full">
            <Label>
              Select minimum and maximum price per hour
            </Label>
            <Slider
              getAriaLabel={() => 'Temperature range'}
              value={value}
              onChange={handleChange}
              valueLabelDisplay="auto"
              getAriaValueText={valuetext}
            />
          </div>

          <div className="w-full">
            <div className="flex flex-col gap-[4px] w-fit">
              <Label>Min price</Label>
              <Input
                type="number"
                placeholder="Hourly price"
                value={value[0]}
                onChange={(e) => {
                  setValue([Number(e.target.value), value[1]]);
                }}
              />
            </div>
            <div className="flex flex-col gap-[4px] w-fit">
              <Label>Max price</Label>
              <Input
                type="number"
                value={value[1]}
                onChange={(e) => {
                  setValue([value[0], Number(e.target.value)]);
                }}
              />
            </div>
          </div>

        </CardContent>
      </Card>
      )}

      {activeLanguage === "gn" && (
        <Card className="max-w-[600px] w-full p-5">
        <CardContent className="max-w-[600px] w-full space-y-4">

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

          <div className="space-y-2">
            <Label htmlFor="tractor_name">Tractor name</Label>
            <Input
              id="tractor_name"
              className="w-full"
              placeholder='e.g - John deere'
              value={tractorName}
              onChange={(e) => {
                setTractorName(e.target.value);
              }} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tractor_model">Tractor model</Label>
            <Input
              id="tractor_model"
              className="w-full"
              placeholder='e.g - DLIII'
              value={tractorModel}
              onChange={(e) => {
                setTractorModel(e.target.value);
              }} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tractor_type">Select tractor type</Label>
            <Select
              onValueChange={(value) => setTractorType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tractor type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={"small"}>
                  Small
                </SelectItem>
                <SelectItem value={"medium"}>
                  Medium
                </SelectItem>
                <SelectItem value={"large"}>
                  Large
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tractor_year">Select year of purchase</Label>
            <Select
              onValueChange={(value) => setDobDate(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(20)].map((_, index) => {
                  const yearValue = new Date().getFullYear() - index
                  return (
                    <SelectItem key={yearValue} value={yearValue.toString()}>
                      {yearValue}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_city">City</Label>
            <Input
              id="location_city"
              className="w-full"
              placeholder='e.g - Berlin'
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
              }} />
          </div>

          <div className="grid w-full gap-1.5">
            <Label htmlFor="message">Your message</Label>
            <Textarea
              placeholder="Type your message here."
              id="message" value={tractorDesc}
              className="resize-none w-full"
              onChange={(e) => {
                setTractorDesc(e.target.value);
              }} />
          </div>

          <div className="space-y-1 w-full">
            <Label>
              Select minimum and maximum price per hour
            </Label>
            <Slider
              getAriaLabel={() => 'Temperature range'}
              value={value}
              onChange={handleChange}
              valueLabelDisplay="auto"
              getAriaValueText={valuetext}
            />
          </div>

          <div className="w-full">
            <div className="flex flex-col gap-[4px] w-fit">
              <Label>Min price</Label>
              <Input
                type="number"
                placeholder="Hourly price"
                value={value[0]}
                onChange={(e) => {
                  setValue([Number(e.target.value), value[1]]);
                }}
              />
            </div>
            <div className="flex flex-col gap-[4px] w-fit">
              <Label>Max price</Label>
              <Input
                type="number"
                value={value[1]}
                onChange={(e) => {
                  setValue([value[0], Number(e.target.value)]);
                }}
              />
            </div>
          </div>

        </CardContent>
      </Card>
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
