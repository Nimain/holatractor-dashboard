"use client"

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Avatar, Backdrop, CircularProgress } from '@mui/material';
import { useCookie } from 'next-cookie';
import { useDropzone } from 'react-dropzone';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage, successMessage } from '@/utils/Toastify/Messages';
import { uploadFileToS3 } from '@/utils/AWS/FileUpload';
import { Store, User } from '@/utils/Types/types';
import { countries } from '../Authentication/CountryCodes';

const StoreSection = () => {
    const [activeHover, setActiveHover] = useState('')
    const [allStores, setAllStores] = useState<Store[]>([])
    const [fetchingStores, setFetchingStores] = useState(false)
    const [addStore, setAddStore] = useState(false)
    const [imageUploading, setImageUploading] = useState(false)
    const [creatingStore, setCreatingStore] = useState(false)

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedImage, setSelectedImage] = useState<File[]>([]);
    const [openingTime, setOpeningTime] = useState("");
    const [closingTime, setClosingTime] = useState("");
    const [closingDays, setClosingDays] = useState<string[]>([]);

    const [location_name, set_location_name] = useState("")
    const [location_address, set_location_address] = useState("")
    const [location_city, set_location_city] = useState("")
    const [location_state, set_location_state] = useState("")
    const [location_zip_code, set_location_zip_code] = useState("")
    const [location_zip_country, set_location_zip_country] = useState("")

    const [allOwners, setAllOwners] = useState<User[]>([])
    const [owner, setOwner] = useState("")

    const { cookie } = useCookie()
    const access_token = cookie.get("access_token")
    const user = cookie.get("user")

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

    useEffect(() => {
        fetchAllStores()
        fetchAllOwners()
    }, [])

    async function handleAddStore() {

        if (!name) {
            errorMessage("Store name can't be empty");
            return;
        }
        if (!description) {
            errorMessage("Store description can't be empty");
            return;
        }

        if (user.isAdmin && !owner) {
            errorMessage("Please select an owner")
            return
        }

        if (!user.isAdmin) {
            setOwner(user.userId)
        }

        if(!location_name || !location_address || !location_city || !location_state || !location_zip_code || !location_zip_country){
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
            owner_user_id: owner,
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
                setAddStore(false);
                fetchAllStores();
            }
        }).catch((err) => {

            if (err.response && err.response.status === 409 && err.response.data.message === "Store already present") errorMessage("Store already present")
            else if (err.response && err.response.status === 409 && err.response.data.message === "Wrong owner id") errorMessage("You are not an owner. You are not allowed to create a store.")
            else if (err.response && err.response.status === 409 && err.response.data.message === "The user is not owner") errorMessage("The user is not an owner")
            else errorMessage("Some error occurred")

        }).finally(() => {
            setCreatingStore(false)
            setAddStore(false)
        })

    }

    return (
        <div className="w-full py-[20px]">

            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={fetchingStores || addStore}>

                {fetchingStores && <CircularProgress />}

                {imageUploading && <p>Uploading image</p>}
                {creatingStore && <p>Creating store</p>}

                {addStore && !fetchingStores && !imageUploading && !creatingStore &&
                    <div className='p-[20px] rounded-xl bg-white text-black text-[18px] flex flex-col gap-[10px] relative w-[600px] max-h-[80vh] overflow-auto' style={{ scrollbarWidth: "none" }}>
                        <div className='absolute top-[12px] right-[12px] cursor-pointer' onClick={() => { setAddStore(false) }}>
                            <CloseIcon />
                        </div>
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
                            <div className='flex flex-col gap-[4px] w-full'>
                                <label className='text-[18px]'>Name</label>
                                <div className='px-[10px] py-[4px] border border-black rounded-md text-[16px]'>
                                    <input type="text" placeholder='Store name' className='outline-none bg-transparent border-none w-full' value={name} onChange={e => { setName(e.target.value) }} />
                                </div>
                            </div>
                            <div className='flex flex-col gap-[4px] w-full'>
                                <label className='text-[18px]'>Description</label>
                                <div className='px-[10px] py-[4px] border border-black rounded-md text-[16px]'>
                                    <textarea className='resize-none w-full min-h-20' value={description} onChange={e => { setDescription(e.target.value) }} />
                                </div>
                            </div>
                            <div className='flex flex-col gap-[4px] w-full'>
                                <label className='text-[18px]'>Opening Time</label>
                                <div className='px-[10px] py-[4px] border border-black rounded-md text-[16px]'>
                                    <input type="time" className='outline-none bg-transparent border-none w-full' value={openingTime} onChange={e => { setOpeningTime(e.target.value) }} />
                                </div>
                            </div>
                            <div className='flex flex-col gap-[4px] w-full'>
                                <label className='text-[18px]'>Closing Time</label>
                                <div className='px-[10px] py-[4px] border border-black rounded-md text-[16px]'>
                                    <input type="time" className='outline-none bg-transparent border-none w-full' value={closingTime} onChange={e => { setClosingTime(e.target.value) }} />
                                </div>
                            </div>
                            <div className='flex flex-col gap-[4px] w-full'>
                                <label className='text-[18px]'>Closing Days</label>
                                <div className='px-[10px] py-[4px] text-[16px]'>
                                    <div className="flex flex-wrap gap-[10px]">
                                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                                            <div key={day} className="flex items-center gap-[10px]">
                                                <input
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
                                user.isAdmin &&
                                <div
                                    className='w-full flex items-center gap-[20px]'>

                                    <div className='flex flex-col gap-[4px] w-full'>

                                        <label
                                            htmlFor="model_number_input"
                                            className='text-[18px]'>
                                            Select owner
                                        </label>

                                        <div
                                            className='px-[10px] py-[4px] border border-black rounded-md text-[16px]'>

                                            <select
                                                className='outline-none bg-transparent border-none w-full'
                                                onChange={e => { setOwner(e.target.value) }}>

                                                <option defaultChecked={true}>Select a owner</option>
                                                {
                                                    allOwners.map((ownerDetails, index) => {
                                                        const name = `${ownerDetails.first_name} ${ownerDetails.middle_name ? ownerDetails.middle_name : ''} ${ownerDetails.last_name}`
                                                        return (
                                                            <option value={ownerDetails.id} key={index}>{name}</option>
                                                        )
                                                    })
                                                }

                                            </select>

                                        </div>

                                    </div>

                                </div>
                            }
                            <div className='flex flex-col gap-[4px] w-full'>
                                <label className='text-[18px]'>Location name</label>
                                <div className='px-[10px] py-[4px] border border-black rounded-md text-[16px]'>
                                    <input type="text" placeholder='Store location name' className='outline-none bg-transparent border-none w-full' value={location_name} onChange={e => { set_location_name(e.target.value) }} />
                                </div>
                            </div>
                            <div className='flex flex-col gap-[4px] w-full'>
                                <label className='text-[18px]'>Store address</label>
                                <div className='px-[10px] py-[4px] border border-black rounded-md text-[16px]'>
                                    <input type="text" placeholder='Store address' className='outline-none bg-transparent border-none w-full' value={location_address} onChange={e => { set_location_address(e.target.value) }} />
                                </div>
                            </div>
                            <div className='flex flex-col gap-[4px] w-full'>
                                <label className='text-[18px]'>City</label>
                                <div className='px-[10px] py-[4px] border border-black rounded-md text-[16px]'>
                                    <input type="text" placeholder='City' className='outline-none bg-transparent border-none w-full' value={location_city} onChange={e => { set_location_city(e.target.value) }} />
                                </div>
                            </div>
                            <div className='flex flex-col gap-[4px] w-full'>
                                <label className='text-[18px]'>State</label>
                                <div className='px-[10px] py-[4px] border border-black rounded-md text-[16px]'>
                                    <input type="text" placeholder='State' className='outline-none bg-transparent border-none w-full' value={location_state} onChange={e => { set_location_state(e.target.value) }} />
                                </div>
                            </div>
                            <div className='flex flex-col gap-[4px] w-full'>
                                <label className='text-[18px]'>Location zip code</label>
                                <div className='px-[10px] py-[4px] border border-black rounded-md text-[16px]'>
                                    <input type="text" placeholder='Zipcode' className='outline-none bg-transparent border-none w-full' value={location_zip_code} onChange={e => { set_location_zip_code(e.target.value) }} />
                                </div>
                            </div>
                            <div className='flex flex-col gap-[4px] w-full'>
                                <label className='text-[18px]'>Store address</label>
                                <select name="country" id="country" onChange={(e)=>{set_location_zip_country(e.target.value)}} className='outline-none bg-transparent border-2 p-2 rounded-md border-black w-full'>
                                    <option defaultChecked={true}>Select country</option>
                                    {
                                        countries.map((country, index)=>{
                                            return(
                                                <option value={country.name} key={index}>{country.name}</option>
                                            )
                                        })
                                    }
                                </select>
                            </div>
                            <button name='submit_button' className='py-[10px] w-full bg-black font-bold text-white rounded-md' onClick={handleAddStore}>
                                Submit
                            </button>
                        </div>
                    </div>
                }

            </Backdrop >

            <div
                className='w-full flex items-center justify-between gap-[20px]'>

                <p className='text-[20px]'>
                    <span className='font-[600]'>Total Stores: {allStores.length}</span>
                </p>

                <button
                    name='new_tractor_add'
                    className='px-[20px] py-[10px] text-[18px] rounded-md bg-black text-white w-fit flex items-center justify-center gap-[10px]'
                    onClick={() => { setAddStore(true) }}>
                    <AddIcon />
                    <span>Add store</span>
                </button>

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
                    allStores.length === 0 ? <p>You havr not created any store</p>
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