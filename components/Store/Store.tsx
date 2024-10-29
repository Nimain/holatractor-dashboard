"use client"

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Avatar, Backdrop, CircularProgress } from '@mui/material';
import { useCookie } from 'next-cookie';
import Image from 'next/image';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage, successMessage } from '@/utils/Toastify/Messages';
import { City, Country, Owner, Store } from '@/utils/Types/types';
import NullImage from "@/assets/AnimateIcons/Store.svg"
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { uploadFileToS3 } from '@/utils/AWS/FileUpload';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '../ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const StoreSection = () => {
    const [activeHover, setActiveHover] = useState('')
    const [allStores, setAllStores] = useState<Store[]>([])

    // New store fields
    const [open, setOpen] = useState(false)
    const [imageUploading, setImageUploading] = useState(false)
    const [creatingStore, setCreatingStore] = useState(false)

    const [selectedImage, setSelectedImage] = useState<File[]>([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [openingTime, setOpeningTime] = useState("");
    const [closingTime, setClosingTime] = useState("");
    const [closingDays, setClosingDays] = useState<string[]>([]);

    const [allOwners, setAllOwners] = useState<Owner[]>([])
    const [owner, setOwner] = useState("")
    const [ownerName, setOwnerName] = useState("")
    const [fetchingStores, setFetchingStores] = useState(false)
    const [popoverOpen, setPopoverOpen] = useState(false)

    const [popoverOpenCountry, setPopoverOpenCountry] = useState(false)
    const [popoverOpenCity, setPopoverOpenCity] = useState(false)

    const [location_name, set_location_name] = useState("")
    const [location_address, set_location_address] = useState("")
    const [location_city, set_location_city] = useState("")
    const [location_state, set_location_state] = useState("")
    const [location_zip_code, set_location_zip_code] = useState("")
    const [location_zip_country, set_location_zip_country] = useState("")

    const [country, setCountry] = useState<Country[]>([]);
    const [fetchingContry, setFetchingCountry] = useState(false);

    const [fetchingCity, setFetchingCity] = useState(false);
    const [city, setCity] = useState<City[]>([]);

    const { refresh } = useRouter()

    // New store create states last

    const { cookie } = useCookie()
    const access_token = cookie.get("access_token")
    const user = cookie.get("user")

    function formatTimeOnly(dateTimeStr: string | number | Date) {
        const date = new Date(dateTimeStr);
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const seconds = date.getUTCSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    function fetchAllStores() {
        if (access_token) {
            setFetchingStores(true)
            renderInstance.get("/store", {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                }
            })
                .then((res) => {
                    if (res.status === 200) setAllStores(res.data)
                }).catch((err) => {
                    errorMessage("Error in fetching inventory lists")
                }).finally(() => { setFetchingStores(false) })
        } else errorMessage("Admin not logged in")
    }

    // New store functions
    const onDrop = useCallback((acceptedFiles: File[]) => {
        setSelectedImage(prevImages => [...prevImages, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: {
            'image/*': []
        },
        multiple: false,
    });

    function fetchAllCity() {
        setFetchingCity(true);
        renderInstance
            .get("/city")
            .then((res) => {
                setCity(res.data);
            })
            .catch((err) => {
                errorMessage("Error fetching cities");
            })
            .finally(() => {
                setFetchingCity(false);
            });
    }

    function fetchAllOwners() {
        if (access_token) {
            setFetchingStores(true)
            renderInstance.post('/store/owners', {}, {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                }
            })
                .then((res) => {
                    if (res.status === 201) setAllOwners(res.data)
                }).catch((err) => {
                    errorMessage("Error in fetching inventory lists")
                }).finally(() => { setFetchingStores(false) })
        } else errorMessage("Admin not logged in")
    }

    const handleDaySelection = (day: string) => {
        setClosingDays((prevDays) =>
            prevDays.includes(day) ? prevDays.filter(d => d !== day) : [...prevDays, day]
        );
    };

    function fetchAllCountry() {
        setFetchingCountry(true);
        renderInstance
            .get("/country")
            .then((res) => {
                setCountry(res.data);
            })
            .catch((err) => {
                errorMessage("Error fetching roles");
            })
            .finally(() => {
                setFetchingCountry(false);
            });
    }

    async function handleAddStore() {

        if (!name) {
            errorMessage("Store name can't be empty");
            return;
        }
        if (!description) {
            errorMessage("Store description can't be empty");
            return;
        }

        if (user.isAdmin.includes("admin") && !owner) {
            errorMessage("Please select an owner")
            return
        }

        if (!location_name || !location_address || !location_city || !location_state || !location_zip_code || !location_zip_country) {
            errorMessage("Location detail can't be empty")
            return
        }

        let storeImages = ""

        if (selectedImage.length > 0) {
            setImageUploading(true)
            const buffer = Buffer.from(await selectedImage[0].arrayBuffer())
            storeImages = await uploadFileToS3(buffer, selectedImage[0].name)
            setImageUploading(false)
        }

        const store = {
            name,
            description,
            opening_time: new Date(`1970-01-01T${openingTime}:00.000Z`),
            closing_time: new Date(`1970-01-01T${closingTime}:00.000Z`),
            closing_days: closingDays,
            image: storeImages,
            owner_user_id: user.isAdmin.includes("admin") ? owner : user.userId,
            location_name,
            location_address,
            location_city,
            location_state,
            location_zip_code,
            location_country: location_zip_country
        };

        setCreatingStore(true)
        renderInstance.post("/store", store, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            }
        }).then((res) => {
            if (res.status === 201) {
                successMessage("Store created")
                // Reset state variables
                setName("");
                setDescription("");
                setSelectedImage([]);
                setOpeningTime("");
                setClosingTime("");
                setClosingDays([]);
                setOwner("");
                setOpen(false)

                setTimeout(() => {
                    refresh()
                }, 1000);
            }
        }).catch((err) => {
            if (err.response && err.response.status === 409 && err.response.data.message === "Store already present") errorMessage("Store already present")
            else if (err.response && err.response.status === 409 && err.response.data.message === "Wrong owner id") errorMessage("You are not an owner. You are not allowed to create a store.")
            else if (err.response && err.response.status === 409 && err.response.data.message === "The user is not owner") errorMessage("The user is not an owner")
            else errorMessage("Some error occurred")

        }).finally(() => {
            setCreatingStore(false)
        })

    }

    useEffect(() => {
        fetchAllOwners()
        fetchAllCountry()
    }, [])

    useEffect(() => {
        if (location_zip_country) fetchAllCity()
    }, [location_zip_country])

    // New store functions last

    useEffect(() => {
        fetchAllStores()
    }, [])

    return (
        <div className="w-full py-[20px]">

            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={fetchingStores}>

                {fetchingStores && <CircularProgress />}

            </Backdrop >

            <div
                className='w-full flex items-center justify-between gap-[20px]'>

                <p className='text-[20px]'>
                    <span className='font-[600]'>Total Stores: {allStores.length}</span>
                </p>

                <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    name="new_tractor_add"
                    className="px-[20px] py-[10px] text-[18px] rounded-md bg-black text-white w-fit flex items-center justify-center gap-[10px] ml-auto"
                    onClick={() => {
                        setOpen(true);
                    }}
                >
                    <AddIcon />
                    <span>Add store</span>
                </button>
            </DialogTrigger>

            <DialogContent className='p-[20px] w-full max-w-[600px] h-[80vh] overflow-auto'>

                <div className='text-[18px] flex flex-col gap-[10px] relative w-full max-h-[80vh] overflow-auto' style={{ scrollbarWidth: "none" }}>

                    <Backdrop
                        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                        open={imageUploading || creatingStore}>

                        {imageUploading && <p>Uploading image</p>}
                        {creatingStore && <p>Creating store</p>}

                    </Backdrop>

                    <p className='text-[26px] font-bold text-center'>Add your store details</p>

                    <div {...getRootProps()} className="dropzone text-center border-dashed border-2 border-gray-300 p-6 rounded-md">
                        <input {...getInputProps()} />
                        <p className="text-gray-600">Drag 'n' drop an image here, or click to select one</p>
                    </div>
                    <div className='w-full my-[4px] flex items-center flex-wrap gap-[20px]'>
                        {selectedImage.length > 0 && selectedImage.map((image, index) => (
                            <Image alt='image' src={URL.createObjectURL(image)} key={index} width={80} height={80} className='object-cover w-[80px] h-[80px] cursor-pointer rounded-md' />
                        ))}
                    </div>

                    <div className='w-full flex flex-col items-center gap-[20px]'>
                        <div className='space-y-2 w-[90%]'>
                            <Label>Name</Label>
                            <Input type="text" placeholder='Store name' value={name} onChange={e => { setName(e.target.value) }} />
                        </div>
                        <div className='space-y-2 w-[90%]'>
                            <Label>Description</Label>
                            <Textarea className='resize-none w-full min-h-20' value={description} onChange={e => { setDescription(e.target.value) }} />
                        </div>
                        <div className='space-y-2 w-[90%]'>
                            <Label>Opening Time</Label>
                            <Input type="time" className='outline-none bg-transparent border-none w-full' value={openingTime} onChange={e => { setOpeningTime(e.target.value) }} />
                        </div>
                        <div className='space-y-2 w-[90%]'>
                            <Label>Closing Time</Label>
                            <Input type="time" className='outline-none bg-transparent border-none w-full' value={closingTime} onChange={e => { setClosingTime(e.target.value) }} />
                        </div>
                        <div className='space-y-2 w-[90%]'>
                            <Label>Closing Days</Label>
                            <div className='px-[10px] py-[4px] text-[16px]'>
                                <div className="flex flex-wrap gap-[10px]">
                                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                                        <div key={day} className="flex items-center gap-[10px]">
                                            <Input
                                                type="checkbox"
                                                id={day}
                                                checked={closingDays.includes(day)}
                                                onChange={() => handleDaySelection(day)}
                                            />
                                            <label htmlFor={day}>{day}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {
                            user.isAdmin.includes("admin") &&
                            <div
                                className='w-[90%] flex items-center gap-[20px]'>

                                <div className='space-y-2 w-full'>

                                    <Label>
                                        Select owner
                                    </Label>

                                    {
                                        fetchingStores ? <p>Fetching owners</p>
                                            :
                                            allOwners.length === 0 ?
                                                <p>No owners found</p>
                                                :
                                                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            // aria-expanded={popoverOpen}
                                                            className="w-full justify-between"
                                                        >
                                                            {owner
                                                                ? allOwners.find((country) => `${country.user.first_name} ${country.user.middle_name ? country.user.middle_name : ''} ${country.user.last_name}` === ownerName) && ownerName
                                                                : "Select owner..."}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-full p-0">
                                                        <Command>
                                                            <CommandInput placeholder="Search owner..." />
                                                            <CommandList>
                                                                <CommandEmpty>No owner found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {allOwners.map((country: Owner, index) => {
                                                                        const name = `${country.user.first_name} ${country.user.middle_name ? country.user.middle_name : ''} ${country.user.last_name}`
                                                                        return (
                                                                            <CommandItem
                                                                                key={index}
                                                                                value={name}
                                                                                onSelect={(currentValue) => {
                                                                                    setOwner(country.id)
                                                                                    setOwnerName(name)
                                                                                    setPopoverOpen(false)
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        owner === country.id ? "opacity-100" : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                {name}
                                                                            </CommandItem>
                                                                        )
                                                                    })}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                    }

                                </div>

                            </div>
                        }

                        {
                            fetchingContry ?
                                <CircularProgress />
                                :
                                country.length === 0 ?
                                    <p>No countries are available</p>
                                    :
                                    <div className="space-y-1 w-[90%]">
                                        <Label htmlFor="phonrnumber">Country name</Label>
                                        <div className="w-full space-y-2">
                                            <Popover open={popoverOpenCountry} onOpenChange={setPopoverOpenCountry}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        // aria-expanded={popoverOpen}
                                                        className="w-full justify-between"
                                                    >
                                                        {location_zip_country
                                                            ? country.find((country) => country.name === location_zip_country) && location_zip_country
                                                            : "Select country..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search country..." />
                                                        <CommandList>
                                                            <CommandEmpty>No country found.</CommandEmpty>
                                                            <CommandGroup className='w-full'>
                                                                {country.map((country) => (
                                                                    <CommandItem
                                                                        key={country.name}
                                                                        value={country.name}
                                                                        onSelect={(currentValue) => {
                                                                            set_location_zip_country(country.name)
                                                                            setPopoverOpenCountry(false)
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                location_zip_country === country.name ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {country.name}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                        }
                        {
                            location_zip_country &&
                            <div className='space-y-2 w-[90%]'>
                                <Label>City</Label>
                                {
                                    fetchingCity ?
                                        <p>Fetching cities</p>
                                        :
                                        city.length === 0 ?
                                            <p>No cities are available for this country</p>
                                            :
                                            <div className="w-full space-y-2">
                                                <Popover open={popoverOpenCity} onOpenChange={setPopoverOpenCity}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            // aria-expanded={popoverOpen}
                                                            className="w-full justify-between"
                                                        >
                                                            {location_city
                                                                ? city.find((cityDetails) => cityDetails.name === location_city) && location_city
                                                                : "Select city..."}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-full p-0">
                                                        <Command>
                                                            <CommandInput placeholder="Search country..." />
                                                            <CommandList>
                                                                <CommandEmpty>No city found.</CommandEmpty>
                                                                <CommandGroup className='w-full'>
                                                                    {city.map((cityDetails) => (
                                                                        <CommandItem
                                                                            key={cityDetails.name}
                                                                            value={cityDetails.name}
                                                                            onSelect={(currentValue) => {
                                                                                set_location_city(cityDetails.name)
                                                                                setPopoverOpenCity(false)
                                                                            }}
                                                                            className={`${location_zip_country !== cityDetails.country.name && "hidden"}`}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    location_city === cityDetails.name ? "opacity-100" : "opacity-0"
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
                                }
                            </div>
                        }
                        {
                            location_city &&
                            <div className='space-y-2 w-[90%]'>
                                <Label>Location name</Label>
                                <Input type="text" placeholder='Store location name' className='outline-none bg-transparent border-none w-full' value={location_name} onChange={e => { set_location_name(e.target.value) }} />

                            </div>
                        }
                        {
                            location_city &&
                            <div className='space-y-2 w-[90%]'>
                                <Label>Store address</Label>
                                <Input type="text" placeholder='Store address' className='outline-none bg-transparent border-none w-full' value={location_address} onChange={e => { set_location_address(e.target.value) }} />
                            </div>
                        }
                        {
                            location_city &&
                            <div className='space-y-2 w-[90%]'>
                                <Label>State</Label>
                                <Input type="text" placeholder='State' className='outline-none bg-transparent border-none w-full' value={location_state} onChange={e => { set_location_state(e.target.value) }} />
                            </div>
                        }
                        {
                            location_city &&
                            <div className='space-y-2 w-[90%]'>
                                <Label>Location zip code</Label>
                                <Input type="text" placeholder='Zipcode' className='outline-none bg-transparent border-none w-full' value={location_zip_code} onChange={e => { set_location_zip_code(e.target.value) }} />
                            </div>
                        }

                        <button name='submit_button' className='py-[10px] w-[90%] mx-auto bg-black font-bold text-white rounded-md' onClick={handleAddStore}>
                            Submit
                        </button>
                    </div>

                </div>

            </DialogContent>
        </Dialog>

            </div>

            <div
                className='text-[20px] font-[600] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer mt-[30px]'>

                <div className='w-[50px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400'>
                    <Avatar />
                </div>

                <div className='w-[150px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'
                    onMouseEnter={() => { setActiveHover('Tractor name') }}
                    onMouseLeave={() => { setActiveHover('') }}>
                    <p>Name</p>
                    <div className='flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100'>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <ArrowUpwardIcon />
                        </div>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <MoreVertIcon />
                        </div>
                    </div>
                </div>

                <div className='w-[150px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'
                    onMouseEnter={() => { setActiveHover('Model') }}
                    onMouseLeave={() => { setActiveHover('') }}>
                    <p>
                        {
                            activeHover === 'Model' ?
                                'Desc...'
                                :
                                'Description'
                        }
                    </p>
                    <div className='flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100'>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <ArrowUpwardIcon />
                        </div>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <MoreVertIcon />
                        </div>
                    </div>
                </div>

                <div className='w-[150px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'
                    onMouseEnter={() => { setActiveHover('Opening Time') }}
                    onMouseLeave={() => { setActiveHover('') }}>
                    <p>
                        {
                            activeHover === 'Opening Time' ?
                                'Open...'
                                :
                                'Opening Time'
                        }
                    </p>
                    <div className='flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100'>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <ArrowUpwardIcon />
                        </div>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <MoreVertIcon />
                        </div>
                    </div>
                </div>

                <div className='w-[150px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'
                    onMouseEnter={() => { setActiveHover('Closing Time') }}
                    onMouseLeave={() => { setActiveHover('') }}>
                    <p>
                        {
                            activeHover === 'Closing Time' ?
                                'Close...'
                                :
                                'Closing Time'
                        }
                    </p>
                    <div className='flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100'>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <ArrowUpwardIcon />
                        </div>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <MoreVertIcon />
                        </div>
                    </div>
                </div>

                <div className='w-[150px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'
                    onMouseEnter={() => { setActiveHover('Closed days') }}
                    onMouseLeave={() => { setActiveHover('') }}>
                    <p>
                        {
                            activeHover === 'Closed days' ?
                                'Closed...'
                                :
                                'Closed days'
                        }
                    </p>
                    <div className='flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100'>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <ArrowUpwardIcon />
                        </div>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <MoreVertIcon />
                        </div>
                    </div>
                </div>

            </div>

            <div className='flex flex-col gap-[5px] mt-[20px]'>

                {
                    allStores.length === 0 ? <div className="w-full h-full min-h-[80vh] flex items-center justify-center">
                    <Image
                    src={NullImage}
                    alt="No image found"
                    className="w-[400px] lg:w-[700px] h-auto object-cover"
                    width={400}
                    height={400}
                    unoptimized={true} />
                </div>
                        :
                        allStores.map((tractorDetails, index) => {
                            return (
                                <Link
                                    href={`/Store/${tractorDetails.id}`}
                                    className='text-[18px] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer transition-all duration-500 hover:bg-white'
                                    key={index}>

                                    {
                                        tractorDetails.image ?
                                            <Image
                                                src={tractorDetails.image}
                                                className='w-[50px] h-[50px] rounded-full object-cover'
                                                alt={tractorDetails.name}
                                                width={50}
                                                height={50}
                                                unoptimized={true} />
                                            :
                                            <div className='w-[50px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400'>
                                                <Avatar />
                                            </div>
                                    }

                                    <p className='w-[150px]'>
                                        {tractorDetails.name}
                                    </p>

                                    <p className='w-[150px]'>
                                        {tractorDetails.description}
                                    </p>

                                    <p className='w-[150px]'>
                                        {formatTimeOnly(tractorDetails.opening_time)}
                                    </p>

                                    <p className='w-[150px]'>
                                        {formatTimeOnly(tractorDetails.closing_time)}
                                    </p>

                                    <ul className='w-[150px] list-disc'>
                                        {tractorDetails.closing_days.map((day) => {
                                            return (
                                                <li key={day}>{day}</li>
                                            )
                                        })}
                                    </ul>

                                </Link>
                            )
                        })
                }

            </div>

        </div >
    )
}

export default StoreSection