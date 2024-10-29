"use client"

import { useEffect, useState } from 'react'
import { Pagination, Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import { useParams, useRouter } from 'next/navigation';
import { useCookie } from 'next-cookie';
import { Inventory, Store } from '@/utils/Types/types';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage, successMessage } from '@/utils/Toastify/Messages';
import Image from 'next/image';
import AddAttachment from './AddAttachment';
import { uploadFileToS3 } from '@/utils/AWS/FileUpload';
import { format, setYear } from 'date-fns'; import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
} from "@/components/ui/dialog";
import AddIcon from "@mui/icons-material/Add";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Backdrop } from '@mui/material';

const SingleStore = () => {

    const [fetchingStoreDetails, setFetchingStoreDetails] = useState(false)
    const [storeDetails, setStoreDetails] = useState<Store>()

    // Add tractor states
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [selectedTractorId, setSelectedTractorId] = useState("");
    const [allTractors, setAllTractors] = useState<Inventory[]>([]);
    const [fetchingRoles, setFetchingRoles] = useState(false);
    const [hourlyPrice, setHourlyPrice] = useState<number>();
    const [minPrice, setHMinPrice] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(0);
    const [document_number, set_document_number] = useState("")
    const [expiry_date, set_expiry_date] = useState<Date>()
    const [expiry_date_false, set_expiry_date_false] = useState(false)
    const [expiry_date_year, set_expiry_date_year] = useState<number>(new Date().getFullYear())
    const [attachment, setattachment] = useState<File | null>(null);
    const [inventory_id, set_inventoey_id] = useState("")

    const { refresh } = useRouter()

    // Add tractor states last

    const { slug } = useParams()

    const { cookie } = useCookie()
    const access_token = cookie.get("access_token")

    function fetchStoreDetails() {
        if (slug) {
            setFetchingStoreDetails(true)
            renderInstance.get(`/store/${slug}`, {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                }
            })
                .then((res) => {
                    setStoreDetails(res.data)
                }).catch((err) => {
                    errorMessage("Error fetching store details")
                    console.log(err)
                }).finally(() => { setFetchingStoreDetails(false) })
        }
    }

    function formatTimeOnly(dateTimeStr: string | number | Date) {
        const date = new Date(dateTimeStr);
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const seconds = date.getUTCSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    function formatDateOnly(dateTimeStr: string | number | Date) {
        const date = new Date(dateTimeStr);
        const year = date.getUTCFullYear().toString();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
        const day = date.getUTCDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatAddress(address: { address: string; city: string; state: string; country: string; zip_code: string; }) {
        const {
            address: street,
            city,
            state,
            country,
            zip_code,
        } = address;

        return `${street}, ${city}, ${state}, ${zip_code}, ${country}`;
    }

    // Add tractor to store functions
    function fetchAllTractors() {
        if (access_token) {
            setFetchingRoles(true);
            renderInstance
                .get("/inventory")
                .then((res) => {
                    if (res.status === 200) {
                        const availableTractors = res.data.filter(
                            (tractor: Inventory) =>
                                !storeDetails?.TractorInStore.some(
                                    (existingTractor) =>
                                        existingTractor.baseTractorId === tractor.tractor.id
                                )
                        );
                        setAllTractors(availableTractors);
                    }
                })
                .catch((err) => {
                    errorMessage("Error in fetching inventory lists");
                })
                .finally(() => {
                    setFetchingRoles(false);
                });
        } else errorMessage("Admin not logged in");
    }

    // Handle date selection with the chosen year
    const handleExpiryDateChange = (newDate: Date | undefined) => {
        if (newDate) {
            const updatedDate = setYear(newDate, expiry_date_year)
            set_expiry_date(updatedDate)
            set_expiry_date_false(false)
        }
    }

    useEffect(() => {
        fetchAllTractors();
    }, []);

    async function saveTractor() {

        if (!hourlyPrice) {
            errorMessage("Hourly price is needed")
            return
        }

        if (!attachment) {
            errorMessage("Give your tractor number plate photo")
            return
        }

        if (!document_number) {
            errorMessage("Manually enter the number plate details")
            return
        }

        if (hourlyPrice > maxPrice || hourlyPrice < minPrice) {
            errorMessage(`Price should be between ${minPrice} and ${maxPrice}`)
            return
        }

        setCreating(true)

        let attachmentLink = ""
        if (attachment) {

            const buffer = Buffer.from(await attachment.arrayBuffer());
            attachmentLink = await uploadFileToS3(buffer, attachment.name);

            if (!attachmentLink) {
                errorMessage("Something went wrong in uploading the attachment");
                return;
            }
        }

        const addTractorDto = {
            tractor_ids: [selectedTractorId],
            hourly_price: `${hourlyPrice}`,
            store_id: slug,
            inventory_id: inventory_id,
            document_number,
            attachment: attachmentLink,
            expiry_date
        }

        renderInstance.post('/store/addTractors', addTractorDto, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            }
        }).then((res) => {
            successMessage("Successful")
            setOpen(false)
            fetchStoreDetails()
            refresh()
        }).catch((err) => {
            errorMessage("Some error occurred")
        }).finally(() => { setCreating(false) })
    }

    //   Add tractor to store functions

    useEffect(() => {
        fetchStoreDetails()
    }, [slug])

    if (fetchingStoreDetails) {
        return <div>Loading...</div>;
    }

    if (!storeDetails) {
        return <div>No store details details available.</div>;
    }

    return (
        <div
            className='py-[30px] w-full flex flex-col gap-[30px]'>

            <div
                className='w-full grid grid-cols-3 gap-[20px]'>

                <div className='px-[20px] py-[20px] rounded-md bg-white flex flex-col gap-[10px]'>

                    <p className='text-[16px] text-gray-600'>
                        Store name
                    </p>

                    <p className='text-[20px] font-[600]'>
                        {storeDetails.name}
                    </p>

                </div>

                <div className='px-[20px] py-[20px] rounded-md bg-white flex flex-col gap-[10px]'>

                    <p className='text-[16px] text-gray-600'>
                        Store owner
                    </p>

                    <p className='text-[20px] font-[600]'>
                        {storeDetails.agentOwner ? `${storeDetails.agentOwner.user.first_name} ${storeDetails.agentOwner.user.middle_name ?? ""} ${storeDetails.agentOwner.user.last_name}` : `${storeDetails.owner.user.first_name} ${storeDetails.owner.user.middle_name ?? ""} ${storeDetails.owner.user.last_name}`}
                    </p>

                </div>

                <div className='px-[20px] py-[20px] rounded-md bg-white flex flex-col gap-[10px]'>

                    <p className='text-[16px] text-gray-600'>
                        Opening time
                    </p>

                    <p className='text-[20px] font-[600]'>
                        {formatTimeOnly(storeDetails.opening_time)}
                    </p>

                </div>

                <div className='px-[20px] py-[20px] rounded-md bg-white flex flex-col gap-[10px]'>

                    <p className='text-[16px] text-gray-600'>
                        Closing time
                    </p>

                    <p className='text-[20px] font-[600]'>
                        {formatTimeOnly(storeDetails.closing_time)}
                    </p>

                </div>

                <div className='px-[20px] py-[20px] rounded-md bg-white flex flex-col gap-[10px]'>

                    <p className='text-[16px] text-gray-600'>
                        Closed days
                    </p>

                    <p className='text-[20px] font-[600]'>
                        {storeDetails.closing_days.map((day) => {
                            return (
                                <li key={day}>{day}</li>
                            )
                        })}
                    </p>

                </div>

                <div className='px-[20px] py-[20px] rounded-md bg-white flex flex-col gap-[10px] col-span-2'>

                    <p className='text-[16px] text-gray-600'>
                        Description
                    </p>

                    <p className='text-[20px] font-[600]'>
                        {storeDetails.description}
                    </p>

                </div>

            </div>

            <div
                className='w-full grid grid-cols-2 gap-[20px]'>

                {
                    storeDetails.image &&
                    <div
                        className='w-full h-[400px] flex items-center justify-center'>
                        <Image
                            src={storeDetails.image}
                            alt='tractor_image'
                            className='w-full h-full object-cover rounded-xl'
                            width={300}
                            height={400}
                            unoptimized={true} />
                    </div>
                }

            </div>

            <div className="w-full space-y-2">

                <div className='w-full flex items-center justify-between gap-5 flex-wrap'>

                    <p className='text-xl font-medium'>
                        Total tractors: {storeDetails.TractorInStore.length}
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
                                <span>Add tractor</span>
                            </button>
                        </DialogTrigger>

                        <DialogContent
                            className="bg-white max-h-[90vh] w-[90vw] max-w-[900px] overflow-auto"
                            style={{ scrollbarWidth: "none" }}
                        >
                            <DialogHeader>
                                <p className="text-2xl font-bold text-center">
                                    {selectedTractorId
                                        ? "Give the following details"
                                        : "Select a tractor"}
                                </p>
                            </DialogHeader>

                            <div
                                className={`bg-white rounded-xl p-[30px] ${!selectedTractorId && "grid grid-cols-4"
                                    } gap-5 relative overflow-auto`}
                                style={{ scrollbarWidth: "none" }}
                            >
                                {fetchingRoles ? (
                                    "Wait a minute. Loading..."
                                ) : allTractors.length === 0 ? (
                                    "No tractors available to show"
                                ) : selectedTractorId ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-5">
                                        <div className="flex flex-col gap-[4px] w-full">
                                            <Label>
                                                Hourly price
                                            </Label>
                                            <Input
                                                type="number"
                                                placeholder='Give hourly price'
                                                value={hourlyPrice}
                                                onChange={e => { setHourlyPrice(Number(e.target.value)) }} />
                                        </div>

                                        <div className="flex items-center justify-center w-full">
                                            {attachment ? (
                                                <Image
                                                    src={URL.createObjectURL(attachment)}
                                                    alt={attachment.name}
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
                                                                setattachment(file);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                        <div className="space-y-1 w-full">
                                            <Label htmlFor="liscenceNumber">Tractor number plate</Label>
                                            <Input
                                                id="liscenceNumber"
                                                placeholder='e.g - es0012390'
                                                value={document_number}
                                                onChange={e => { set_document_number(e.target.value) }} />
                                        </div>
                                        <Popover open={expiry_date_false} onOpenChange={set_expiry_date_false}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !expiry_date && "text-muted-foreground"
                                                    )}
                                                    onClick={() => { set_expiry_date_false(true) }}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {expiry_date ? format(expiry_date, "PPP") : <span>Expiry date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="flex w-full flex-col space-y-2 p-2">
                                                <Select
                                                    onValueChange={(value) => set_expiry_date_year(parseInt(value))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Year" />
                                                    </SelectTrigger>
                                                    <SelectContent position="popper">
                                                        {[...Array(30)].map((_, index) => {
                                                            const yearValue = new Date().getFullYear() + index
                                                            return (
                                                                <SelectItem key={yearValue} value={yearValue.toString()}>
                                                                    {yearValue}
                                                                </SelectItem>
                                                            )
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                                <div className="rounded-md border">
                                                    <Calendar
                                                        mode="single"
                                                        selected={expiry_date}
                                                        onSelect={handleExpiryDateChange}
                                                    />
                                                </div>
                                            </PopoverContent>
                                        </Popover>

                                        <button
                                            className="px-5 py-2 bg-black text-white rounded-md mx-auto"
                                            name="save tractor button"
                                            onClick={() => {
                                                saveTractor();
                                            }}
                                        >
                                            Save
                                        </button>
                                    </div>
                                ) : (
                                    allTractors.map((details, index) => {
                                        return (
                                            <div
                                                key={index}
                                                className={`border-2 rounded-xl flex flex-col gap-5 p-2`}
                                            >
                                                {details.tractor.images.length === 0 ? (
                                                    <Image
                                                        src={"https://wallpapercave.com/wp/wp13088808.jpg"}
                                                        alt="tractor_image"
                                                        className="w-full h-32 object-cover rounded-xl"
                                                        width={300}
                                                        height={400}
                                                        unoptimized={true}
                                                    />
                                                ) : (
                                                    <Swiper
                                                        modules={[Autoplay, Pagination]}
                                                        spaceBetween={0}
                                                        slidesPerView={1}
                                                        loop={true}
                                                        pagination={true}
                                                        autoplay={true}
                                                        className="w-full h-full"
                                                    >
                                                        {details.tractor.images.map((image, i) => {
                                                            return (
                                                                <SwiperSlide key={i}>
                                                                    <Image
                                                                        src={image}
                                                                        alt="tractor_image"
                                                                        className="w-full h-full object-cover rounded-xl"
                                                                        width={300}
                                                                        height={400}
                                                                        unoptimized={true}
                                                                    />
                                                                </SwiperSlide>
                                                            );
                                                        })}
                                                    </Swiper>
                                                )}

                                                <div>
                                                    <strong>{details.tractor.name}</strong>
                                                    <p>
                                                        <strong>Model:</strong>
                                                        <span>{details.tractor.model}</span>
                                                    </p>
                                                </div>

                                                <button
                                                    name="select button"
                                                    className="px-4 py-2 bg-black text-white rounded-md mx-auto w-full"
                                                    onClick={() => {
                                                        setSelectedTractorId(details.tractor_id);
                                                        setHMinPrice(Number(details.min_price))
                                                        setMaxPrice(Number(details.max_price))
                                                        set_inventoey_id(details.id)
                                                    }}
                                                >
                                                    Select
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <Backdrop
                                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                                open={creating}>

                                {
                                    creating && <p>Adding to store</p>
                                }

                            </Backdrop>
                        </DialogContent>
                    </Dialog>

                </div>

                <div
                    className='w-full grid grid-cols-3 gap-[20px]'>

                    {
                        storeDetails.TractorInStore.length === 0 ?
                            <p>You have not added any inventory</p>
                            :
                            storeDetails.TractorInStore.map((stock, i) => {
                                return (
                                    <div
                                        key={i}
                                        className={`border-2 rounded-xl w-full flex flex-col gap-5 p-2`}
                                    >
                                        {stock.baseTractor.images.length === 0 ? (
                                            <Image
                                                src={"https://wallpapercave.com/wp/wp13088808.jpg"}
                                                alt="tractor_image"
                                                className="w-full h-32 object-cover rounded-xl"
                                                width={300}
                                                height={400}
                                                unoptimized={true}
                                            />
                                        ) : (
                                            <Swiper
                                                modules={[Autoplay, Pagination]}
                                                spaceBetween={0}
                                                slidesPerView={1}
                                                loop={true}
                                                pagination={true}
                                                autoplay={true}
                                                className="w-full h-full"
                                            >
                                                {stock.baseTractor.images.map((image, i) => {
                                                    return (
                                                        <SwiperSlide key={i}>
                                                            <Image
                                                                src={image}
                                                                alt="tractor_image"
                                                                className="w-full h-full object-cover rounded-xl"
                                                                width={300}
                                                                height={400}
                                                                unoptimized={true}
                                                            />
                                                        </SwiperSlide>
                                                    );
                                                })}
                                            </Swiper>
                                        )}

                                        <div>
                                            <strong>{stock.baseTractor.name}</strong>
                                            <p>
                                                <strong>Model:</strong>
                                                <span>{stock.baseTractor.model}</span>
                                            </p>
                                        </div>
                                    </div>
                                )
                            })
                    }

                </div>

            </div>

            <div className="w-full space-y-2">

                <div className='w-full flex items-center justify-between gap-5 flex-wrap'>

                    <p className='text-xl font-medium'>
                        Total attachment: {storeDetails.AttachmentInStore.length}
                    </p>

                    <AddAttachment alreadyTractors={storeDetails.AttachmentInStore} />

                </div>

                <div
                    className='w-full grid grid-cols-3 gap-[20px]'>

                    {
                        storeDetails.AttachmentInStore.length === 0 ?
                            <p>You have not added any inventory</p>
                            :
                            storeDetails.AttachmentInStore.map((stock, i) => {
                                return (
                                    <div
                                        key={i}
                                        className={`border-2 rounded-xl w-full flex flex-col gap-5 p-2`}
                                    >
                                        {stock.baseAttachment.images.length === 0 ? (
                                            <Image
                                                src={"https://wallpapercave.com/wp/wp13088808.jpg"}
                                                alt="tractor_image"
                                                className="w-full h-32 object-cover rounded-xl"
                                                width={300}
                                                height={400}
                                                unoptimized={true}
                                            />
                                        ) : (
                                            <Swiper
                                                modules={[Autoplay, Pagination]}
                                                spaceBetween={0}
                                                slidesPerView={1}
                                                loop={true}
                                                pagination={true}
                                                autoplay={true}
                                                className="w-full h-full"
                                            >
                                                {stock.baseAttachment.images.map((image, i) => {
                                                    return (
                                                        <SwiperSlide key={i}>
                                                            <Image
                                                                src={image}
                                                                alt="tractor_image"
                                                                className="w-full h-full object-cover rounded-xl"
                                                                width={300}
                                                                height={400}
                                                                unoptimized={true}
                                                            />
                                                        </SwiperSlide>
                                                    );
                                                })}
                                            </Swiper>
                                        )}

                                        <div>
                                            <strong>{stock.baseAttachment.name}</strong>
                                            <p>
                                                <strong>Model:</strong>
                                                <span>{stock.baseAttachment.description}</span>
                                            </p>
                                        </div>
                                    </div>
                                )
                            })
                    }

                </div>

            </div>

        </div>
    )
}

export default SingleStore