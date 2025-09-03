"use client";

import Menubar from "@/components/Menubar/Menubar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { uploadFileToS3 } from "@/utils/AWS/FileUpload";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { City } from "@/utils/Types/types";
import { Backdrop, Slider, SliderProps } from "@mui/material";
import { Check, ChevronsUpDown } from "lucide-react";
import { useCookie } from "next-cookie";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
  const [fixedPrice, setFixedPrice] = useState(20)

  const [fetchingCity, setFetchingCity] = useState(false);
  const [allcity, setAllCity] = useState<City[]>([]);
  const [popoverOpenCity, setPopoverOpenCity] = useState(false)

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

    if(!fixedPrice){
      errorMessage("Please give the fixed price")
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
      max_price: `${value[1]}`,
      fixed_price: `${fixedPrice}`
    };

    setLoading(true);

    try {
      const res = await renderInstance.post("/inventory", inventory, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (res.status === 201) {
        successMessage("Inventory created successfully");
        router.push("/Inventory")
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

  // Translation object
  const translations = {
    en: {
      tractorName: "Tractor name",
      tractorNamePlaceholder: "e.g - John deere",
      tractorModel: "Tractor model",
      tractorModelPlaceholder: "e.g - DLIII",
      selectTractorType: "Select tractor type",
      selectTractorTypePlaceholder: "Select tractor type",
      small: "Small",
      medium: "Medium",
      large: "Large",
      selectYear: "Select year of purchase",
      selectYearPlaceholder: "Select Year",
      city: "City",
      cityPlaceholder: "e.g - Berlin",
      selectCity: "Select city...",
      tractorDescription: "Tractor description",
      descriptionPlaceholder: "Type your message here.",
      priceRange: "Select minimum and maximum price per hour",
      minPrice: "Min price (in dollar $)",
      maxPrice: "Max price (in dollar $)",
      fixedPrice: "Fixed price (in dollar $)",
      hourlyPricePlaceholder: "Hourly price",
      dragDrop: "Drag 'n' drop an image here, or click to select one",
      submit: "Submit",
      creatingInventory: "Creating inventory",
      uploadingImage: "Uploading image"
    },
    es: {
      tractorName: "Nombre del tractor",
      tractorNamePlaceholder: "ej. - John Deere",
      tractorModel: "Modelo del tractor",
      tractorModelPlaceholder: "ej. - DLIII",
      selectTractorType: "Seleccionar tipo de tractor",
      selectTractorTypePlaceholder: "Seleccionar tipo de tractor",
      small: "Pequeño",
      medium: "Mediano",
      large: "Grande",
      selectYear: "Seleccionar año de compra",
      selectYearPlaceholder: "Seleccionar año",
      city: "Ciudad",
      cityPlaceholder: "ej. - Berlín",
      selectCity: "Seleccionar ciudad...",
      tractorDescription: "Descripción del tractor",
      descriptionPlaceholder: "Escriba su mensaje aquí.",
      priceRange: "Seleccionar precio mínimo y máximo por hora",
      minPrice: "Precio mínimo (en dólares $)",
      maxPrice: "Precio máximo (en dólares $)",
      fixedPrice: "Precio fijo (en dólares $)",
      hourlyPricePlaceholder: "Precio por hora",
      dragDrop: "Arrastra y suelta una imagen aquí, o haz clic para seleccionar una",
      submit: "Enviar",
      creatingInventory: "Creando inventario",
      uploadingImage: "Subiendo imagen"
    },
    ay: {
      tractorName: "Tractor suti",
      tractorNamePlaceholder: "amuyu - John Deere",
      tractorModel: "Tractor modelo",
      tractorModelPlaceholder: "amuyu - DLIII",
      selectTractorType: "Tractor laya ajlliña",
      selectTractorTypePlaceholder: "Tractor laya ajlliña",
      small: "Jisk'a",
      medium: "Taypi",
      large: "Jach'a",
      selectYear: "Aljañ mara ajlliña",
      selectYearPlaceholder: "Mara ajlliña",
      city: "Marka",
      cityPlaceholder: "amuyu - Berlín",
      selectCity: "Marka ajlliña...",
      tractorDescription: "Tractor qhanañchawi",
      descriptionPlaceholder: "Yati amuyt'añama uñt'ayaña.",
      priceRange: "Sapa hora jisk'a ukat jach'a chani ajlliña",
      minPrice: "Jisk'a chani (dólar $)",
      maxPrice: "Jach'a chani (dólar $)",
      fixedPrice: "Chiqapa chani (dólar $)",
      hourlyPricePlaceholder: "Hora chani",
      dragDrop: "Rixiña uñacht'äwi apaniña, jan ukhaxa mayampi ajlliñataki ch'iqtaña",
      submit: "Apayaña",
      creatingInventory: "Yänak luraña",
      uploadingImage: "Rixiña apayaña"
    },
    qu: {
      tractorName: "Tractor suti",
      tractorNamePlaceholder: "kayhinata - John Deere",
      tractorModel: "Tractor modelo",
      tractorModelPlaceholder: "kayhinata - DLIII",
      selectTractorType: "Tractor laya akllana",
      selectTractorTypePlaceholder: "Tractor laya akllana",
      small: "Huch'uy",
      medium: "Chaupi",
      large: "Hatun",
      selectYear: "Rantiy wata akllana",
      selectYearPlaceholder: "Wata akllana",
      city: "Llaqta",
      cityPlaceholder: "kayhinata - Berlín",
      selectCity: "Llaqta akllana...",
      tractorDescription: "Tractor willakuy",
      descriptionPlaceholder: "Kaypi willakuykita qillqay.",
      priceRange: "Sapa hora aswan pisi hinaspa aswan achka chanin akllana",
      minPrice: "Aswan pisi chanin (dólar $)",
      maxPrice: "Aswan achka chanin (dólar $)",
      fixedPrice: "Mana kuyuq chanin (dólar $)",
      hourlyPricePlaceholder: "Hora chanin",
      dragDrop: "Siq'ita kaypi churay otaq ñit'iy huk akllanayku",
      submit: "Kachay",
      creatingInventory: "Yachana ruwaspa",
      uploadingImage: "Siq'i wichay"
    },
    gn: {
      tractorName: "Tractor réra",
      tractorNamePlaceholder: "techapyrã - John Deere",
      tractorModel: "Tractor modelo",
      tractorModelPlaceholder: "techapyrã - DLIII",
      selectTractorType: "Tractor mba'eichagua poravõ",
      selectTractorTypePlaceholder: "Tractor mba'eichagua poravõ",
      small: "Michĩ",
      medium: "Mbytepegua",
      large: "Tuicha",
      selectYear: "Jogua ary poravõ",
      selectYearPlaceholder: "Ary poravõ",
      city: "Táva",
      cityPlaceholder: "techapyrã - Berlín",
      selectCity: "Táva poravõ...",
      tractorDescription: "Tractor mba'emimi",
      descriptionPlaceholder: "Ko'ápe ehai ne ñe'ẽ.",
      priceRange: "Aravo pukukue michĩvéva ha tuichavéva poravõ",
      minPrice: "Tepykue michĩvéva (dólar $)",
      maxPrice: "Tepykue tuichavéva (dólar $)",
      fixedPrice: "Tepykue oñembokatuetéva (dólar $)",
      hourlyPricePlaceholder: "Aravo tepykue",
      dragDrop: "Ta'ãnga ko'ápe gueraa térã eikutu eiporavo hag̃ua",
      submit: "Mondo",
      creatingInventory: "Mba'erepy moheñoihína",
      uploadingImage: "Ta'ãnga hupihápe"
    }
  };

  function fetchAllCity() {
    setFetchingCity(true);
    renderInstance
      .get("/city")
      .then((res) => {
        setAllCity(res.data);
      })
      .catch((err) => {
        errorMessage("Error fetching cities");
      })
      .finally(() => {
        setFetchingCity(false);
      });
  }

  useEffect(()=>{
    fetchAllCity()
  },[])

  const currentTranslation = translations[activeLanguage as keyof typeof translations];

  const renderForm = () => (
    <Card className="max-w-[600px] w-full p-5">
      <CardContent className="max-w-[600px] w-full space-y-4">

        <div className="max-w-[600px] mx-auto">
          <div
            {...getRootProps()}
            className="dropzone text-center border-dashed border-2 border-gray-300 p-6 rounded-md w-full"
          >
            <input {...getInputProps()} />
            <p className="text-gray-600">
              {currentTranslation.dragDrop}
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
          <Label htmlFor="tractor_name">{currentTranslation.tractorName}</Label>
          <Input
            id="tractor_name"
            className="w-full"
            placeholder={currentTranslation.tractorNamePlaceholder}
            value={tractorName}
            onChange={(e) => {
              setTractorName(e.target.value);
            }} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tractor_model">{currentTranslation.tractorModel}</Label>
          <Input
            id="tractor_model"
            className="w-full"
            placeholder={currentTranslation.tractorModelPlaceholder}
            value={tractorModel}
            onChange={(e) => {
              setTractorModel(e.target.value);
            }} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tractor_type">{currentTranslation.selectTractorType}</Label>
          <Select
            onValueChange={(value) => setTractorType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={currentTranslation.selectTractorTypePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={"small"}>
                {currentTranslation.small}
              </SelectItem>
              <SelectItem value={"medium"}>
                {currentTranslation.medium}
              </SelectItem>
              <SelectItem value={"large"}>
                {currentTranslation.large}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tractor_year">{currentTranslation.selectYear}</Label>
          <Select
            onValueChange={(value) => setDobDate(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={currentTranslation.selectYearPlaceholder} />
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
          <Label htmlFor="location_city">{currentTranslation.city}</Label>
          {activeLanguage === "en" ? (
            fetchingCity ?
              <p>Fetching cities</p>
              :
              allcity.length === 0 ?
                <p>No cities are available for this country</p>
                :
                <div className="w-full space-y-2">
                  <Popover open={popoverOpenCity} onOpenChange={setPopoverOpenCity}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {city
                          ? allcity.find((cityDetails) => cityDetails.name === city) && city
                          : currentTranslation.selectCity}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search country..." />
                        <CommandList>
                          <CommandEmpty>No city found.</CommandEmpty>
                          <CommandGroup className='w-full'>
                            {allcity.map((cityDetails) => (
                              <CommandItem
                                key={cityDetails.name}
                                value={cityDetails.name}
                                onSelect={(currentValue) => {
                                  setCity(cityDetails.name)
                                  setPopoverOpenCity(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    city === cityDetails.name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {cityDetails.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
          ) : (
            <Input
              id="location_city"
              className="w-full"
              placeholder={currentTranslation.cityPlaceholder}
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
              }} />
          )}
        </div>

        <div className="grid w-full gap-1.5">
          <Label htmlFor="message">{currentTranslation.tractorDescription}</Label>
          <Textarea
            placeholder={currentTranslation.descriptionPlaceholder}
            id="message" value={tractorDesc}
            className="resize-none w-full"
            onChange={(e) => {
              setTractorDesc(e.target.value);
            }} />
        </div>

        <div className="space-y-1 w-full">
          <Label>
            {currentTranslation.priceRange}
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
            <Label>{currentTranslation.minPrice}</Label>
            <Input
              type="number"
              placeholder={currentTranslation.hourlyPricePlaceholder}
              value={value[0]}
              onChange={(e) => {
                setValue([Number(e.target.value), value[1]]);
              }}
            />
          </div>
          <div className="flex flex-col gap-2 w-fit">
            <Label>{currentTranslation.maxPrice}</Label>
            <Input
              type="number"
              value={value[1]}
              onChange={(e) => {
                setValue([value[0], Number(e.target.value)]);
              }}
            />
          </div>
          <div className="flex flex-col gap-[4px] w-fit">
            <Label>{currentTranslation.fixedPrice}</Label>
            <Input
              type="number"
              value={fixedPrice}
              onChange={(e) => {
                setFixedPrice(parseInt(e.target.value));
              }}
            />
          </div>
        </div>

      </CardContent>
    </Card>
  );

  return (
    <div className="w-full py-10 px-4 flex flex-col gap-5 items-center">
      <Menubar pagename={"New inventory"} />

      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={imageLoading || loading}
      >
        {loading && <p>{currentTranslation.creatingInventory}</p>}
        {imageLoading && <p>{currentTranslation.uploadingImage}</p>}
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

      {renderForm()}

      <button
        name="submit_button"
        className="py-2 px-4 w-fit bg-black font-bold text-white rounded-md"
        onClick={() => {
          handleAddInventory();
        }}
      >
        {currentTranslation.submit}
      </button>
    </div>
  );
};

export default NewInventory;