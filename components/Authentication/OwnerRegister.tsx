"use client"

import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '../ui/breadcrumb'
import { useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { City, Country, Role, Subscriptions, SubscriptionType } from '@/utils/Types/types'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { Backdrop, CircularProgress } from '@mui/material'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { AtSign, BadgeDollarSign, Building, CalendarIcon, Check, ChevronsUpDown, CircleCheck, DatabaseZap, Eye, EyeOff, MapPinned, Rocket, VenetianMask, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { format, setYear } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Calendar } from '../ui/calendar'
import CryptoJS from "crypto-js";
import { uploadFileToS3 } from '@/utils/AWS/FileUpload'
import { useCookie } from 'next-cookie'
import { useRouter } from 'next/navigation'
import { Separator } from '../ui/separator'
import countryData from './CountryCodeRoles'
import QRCODE from "@/assets/QRcode.jpg"

interface Location {
    latitude: number | null;
    longitude: number | null;
}

const OwnerRegister = ({ name, inPage }: { name: string; inPage: boolean; }) => {
    const [open, setOpen] = useState(false)
    const [fetchingContry, setFetchingCountry] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const [country, setCountry] = useState<Country[]>([]);

    const [agnewCountry, setagNewCountry] = useState("")
    const [agnumber, setagNumber] = useState("")
    const [agEmail, setagEmail] = useState("")
    const [agPassword, setagPassword] = useState("")
    const [agPasswordShow, setagPasswordShow] = useState(false)
    const [agConPassword, setagConPassword] = useState("")
    const [agConPasswordShow, setagConPasswordShow] = useState(false)
    const [agImage, setagImage] = useState<File | null>(null);
    const [agDOB, setagDOB] = useState(false)
    const [activeSubscriptionPlan, setActiveSubscriptionPlan] = useState("planA")
    const [date, setDate] = useState<Date>()
    const [year, setyear] = useState<number>(new Date().getFullYear())
    const [gender, setGender] = useState("")
    const [location_name, set_location_name] = useState("")
    const [location_address, set_location_address] = useState("")
    const [location_city, set_location_city] = useState("")
    const [location_state, set_location_state] = useState("")
    const [location_zip_code, set_location_zip_code] = useState("")
    const [location_country, set_location_country] = useState("")
    const [document_number, set_document_number] = useState("")
    const [expiry_date, set_expiry_date] = useState<Date>()
    const [expiry_date_false, set_expiry_date_false] = useState(false)
    const [expiry_date_year, set_expiry_date_year] = useState<number>(new Date().getFullYear())
    const [attachment, setattachment] = useState<File | null>(null);

    const [fetchingCity, setFetchingCity] = useState(false);
    const [city, setCity] = useState<City[]>([]);
    const [popoverOpenCity, setPopoverOpenCity] = useState(false)

    const [subscriptions, setSubscriptions] = useState<Subscriptions[]>([])
    const [fetchSubscriptions, setFetchSubscriptions] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<Subscriptions | null>(null)
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)

    const [purchasing, setPurchasing] = useState(false)

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);
        const [location, setLocation] = useState<Location>({ latitude: null, longitude: null });

    const { cookie } = useCookie()
    const access_token = cookie.get("access_token");

    const router = useRouter()

    const fetchAllSubscriptions = () => {
        setFetchSubscriptions(true)
        renderInstance.get("/subscription")
            .then((res) => {
                setSubscriptions(res.data)
            }).finally(() => {
                setFetchSubscriptions(false)
            })
    }

    useEffect(() => {
        fetchAllSubscriptions()
    }, [])

    // Handle date selection with the chosen year
    const handleDateChange = (newDate: Date | undefined) => {
        if (newDate) {
            const updatedDate = setYear(newDate, year)
            setDate(updatedDate)
            setagDOB(false)
        }
    }

    // Handle date selection with the chosen year
    const handleExpiryDateChange = (newDate: Date | undefined) => {
        if (newDate) {
            const updatedDate = setYear(newDate, expiry_date_year)
            set_expiry_date(updatedDate)
            set_expiry_date_false(false)
        }
    }

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

    const splitFullName = (fullName: string) => {
        const nameParts = fullName.trim().split(/\s+/); // Split by spaces
        const firstName = nameParts.shift(); // Take the first element as the first name
        const lastName = nameParts.pop(); // Take the last element as the last name
        const middleName = nameParts.join(" "); // Join the rest as middle name

        return { firstName, middleName, lastName };
    };

    function calculateAge(dob: Date) {
        const diff = Date.now() - dob.getTime();
        const ageDate = new Date(diff);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);

            // Generate a preview URL for the selected image
            const preview = URL.createObjectURL(file);
            setPreviewUrl(preview);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    async function ownerRegister() {
        if (!agEmail) {
            errorMessage("Please add the email")
            return
        }
        if (!agnewCountry) {
            errorMessage("Please select country")
            return
        }
        if (!agnumber) {
            errorMessage("Pleasee give your phone number")
            return
        }
        if (agPassword !== agConPassword) {
            errorMessage("Password not matched")
            return
        }
        if (agPassword.length <= 7) {
            errorMessage("Password must be of 8 characters")
            return
        }
        if (!date) {
            errorMessage("Give us your birth details")
            return
        }
        if (calculateAge(date) < 18) {
            errorMessage("You must be 18 years old to register")
            return
        }
        if (!gender) {
            errorMessage("Please select gender")
            return
        }
        if (!location) {
            errorMessage("Please enable Location access")
            return
        }
        if (!attachment) {
            errorMessage("Upload your liscence image")
            return
        }
        if (!document_number) {
            errorMessage("Please give your liscence number")
            return
        }

        if (!selectedPlan) {
            errorMessage("Please select a plan")
            return
        }

        const { firstName, middleName, lastName } = splitFullName(name);
        const encryptedPassword = CryptoJS.AES.encrypt(
            agPassword,
            "m4AfXfQ&1brl3LjQFYO"
        ).toString();

        setLoading(true)

        if (!selectedFile) {
            errorMessage("Please upload your payment proof")
            return
        }

        let paymentProofLink = ""
        const buffer = Buffer.from(await selectedFile.arrayBuffer());
        paymentProofLink = await uploadFileToS3(buffer, selectedFile.name);

        if (!paymentProofLink) {
            errorMessage("Something went wrong in uploading the image");
            return;
        }

        const selectedRole = await renderInstance.get('/role/getIdByName/owner')
        if (!selectedRole) {
            errorMessage("Currently not possible to register")
            setLoading(false)
            return
        }

        let imageUrl = "";

        if (agImage) {

            const buffer = Buffer.from(await agImage.arrayBuffer());
            imageUrl = await uploadFileToS3(buffer, agImage.name);

            if (!imageUrl) {
                errorMessage("Something went wrong in uploading the image");
                return;
            }
        }

        let attachmentLink = ""
        if (attachment) {

            const buffer = Buffer.from(await attachment.arrayBuffer());
            attachmentLink = await uploadFileToS3(buffer, attachment.name);

            if (!attachmentLink) {
                errorMessage("Something went wrong in uploading the attachment");
                return;
            }
        }

        const user = {
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            email: agEmail,
            password: encryptedPassword,
            country_code: agnewCountry,
            mobile: agnumber,
            image: imageUrl,
            dob: new Date(date),
            gender,
            role_id: selectedRole.data,
            authType: "EMAIL",
            location_name,
            location_address,
            location_city,
            location_state,
            location_zip_code,
            location_country,
            attachment: attachmentLink,
            document_number,
            expiry_date,
            payment_id: "test",
            paymentScreenshots: paymentProofLink,
            lat: location.latitude,
            lng: location.longitude
        };

        inPage ?
            renderInstance
                .post("/owner/createWithCreator", user, {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                })
                .then((res) => {
                    if (res.status === 201 && res.data.access_token) {
                        successMessage("Created successfully")
                        setPurchasing(true)
                        renderInstance.post(`/subscription/owner_purchase/${selectedPlan.id}`, {}, {
                            headers: {
                                Authorization: `Bearer ${res.data.access_token}`,
                            }
                        }).then(() => {
                            successMessage("Subscription purchased")
                            router.push("/login")
                        }).catch(() => {
                            errorMessage("Failed to purchase subscription")
                        }).finally(() => {
                            setPurchasing(false)
                        })
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
                })
            :
            renderInstance
                .post("/owner", user)
                .then((res) => {
                    if (res.status === 201 && res.data.access_token) {
                        const expiryDate = new Date();
                        expiryDate.setDate(expiryDate.getDate() + 1);

                        // Set the cookie with the calculated expiry date
                        cookie.remove("access_token", { path: "/" });

                        successMessage("User sign up successfully");
                        setPurchasing(true)
                        renderInstance.post(`/subscription/owner_purchase/${selectedPlan.id}`, {}, {
                            headers: {
                                Authorization: `Bearer ${res.data.access_token}`,
                            }
                        }).then(() => {
                            successMessage("Subscription purchased")
                            router.push("/login")
                        }).catch((err) => {
                            errorMessage("Failed to purchase subscription")
                        }).finally(() => {
                            setPurchasing(false)
                        })
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
                })
    }

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

    const handleSelectPlan = (subscription: Subscriptions) => {
        setSelectedPlan(subscription)
        setIsPaymentDialogOpen(true)
    }

    useEffect(() => {
        fetchAllCountry()
    }, [])

    useEffect(() => {
        if (location_country) fetchAllCity()
    }, [location_country])

    useEffect(() => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position: GeolocationPosition) => {
                        setLocation({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        });
                    },
                    (error: GeolocationPositionError) => {
                        setError(error.message);
                    }
                );
            } else {
                setError("Geolocation is not supported by this browser.");
            }
        }, []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>

            <DialogTrigger asChild>
                <Button
                    className="px-[20px] py-[10px] text-[18px] rounded-md bg-black text-white w-fit flex items-center justify-center gap-[10px] ml-auto"
                    variant={"default"}
                    onClick={() => {
                        setOpen(true)
                    }}
                >
                    {inPage ? "Continue" : "Continue as owner"}
                </Button>
            </DialogTrigger>

            <DialogContent
                className="bg-white h-[90vh] overflow-auto"
                style={{ scrollbarWidth: "none" }}
            >

                <Backdrop
                    sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={loading || purchasing}
                >
                    <CircularProgress />
                </Backdrop>

                <div
                    className="bg-white rounded-xl text-black flex gap-[16px] flex-col relative w-[950px] h-[90vh] overflow-auto"
                    style={{ scrollbarWidth: "none" }}
                >

                    <Tabs className="w-full h-full" defaultValue='stepone'>

                        <TabsList className='w-full bg-transparent'>

                            <Breadcrumb className="w-full">

                                <BreadcrumbList className='w-full flex items-center justify-between bg-transparent'>

                                    <BreadcrumbItem className='w-fit'>

                                        <TabsTrigger
                                            value="stepone"
                                            className='bg-transparent flex items-center px-0'>
                                            <Button
                                                className={`bg-white hover:bg-transparent px-5 ${(name && agEmail && agPassword && agnewCountry && agnumber) ? "text-green-400" : "text-black"}`}>
                                                <AtSign />
                                            </Button>
                                        </TabsTrigger>

                                    </BreadcrumbItem>

                                    <BreadcrumbSeparator>
                                        <Separator
                                            className={`w-24 h-1 rounded-full ${(date && gender) ? "bg-green-400" : "bg-gray-400"}`} />
                                    </BreadcrumbSeparator>

                                    <BreadcrumbItem className='w-fit'>

                                        <TabsTrigger
                                            value="steptwo"
                                            className='bg-transparent flex items-center px-0'>
                                            <Button
                                                className={`bg-white hover:bg-transparent px-5 ${(date && gender) ? "text-green-400" : "text-black"}`}>
                                                <VenetianMask />
                                            </Button>
                                        </TabsTrigger>

                                    </BreadcrumbItem>

                                    <BreadcrumbSeparator>
                                        <Separator
                                            className={`w-24 h-1 rounded-full ${(attachment && document_number) ? "bg-green-400" : "bg-gray-400"}`} />
                                    </BreadcrumbSeparator>

                                    <BreadcrumbItem className="w-fit">

                                        <TabsTrigger
                                            value="stepfour"
                                            className='bg-transparent flex items-center px-0'>
                                            <Button
                                                className={`bg-white hover:bg-transparent px-5 ${(attachment && document_number) ? "text-green-400" : "text-black"}`}>
                                                <DatabaseZap />
                                            </Button>
                                        </TabsTrigger>

                                    </BreadcrumbItem>

                                    <BreadcrumbSeparator>
                                        <Separator
                                            className={`w-24 h-1 rounded-full ${(false) ? "bg-green-400" : "bg-gray-400"}`} />
                                    </BreadcrumbSeparator>

                                    <BreadcrumbItem className="w-fit">

                                        <TabsTrigger
                                            value="stepfive"
                                            className='bg-transparent flex items-center px-0'>
                                            <Button
                                                className={`bg-white hover:bg-transparent px-5 ${(false) ? "text-green-400" : "text-black"}`}>
                                                <BadgeDollarSign />
                                            </Button>
                                        </TabsTrigger>

                                    </BreadcrumbItem>

                                </BreadcrumbList>

                            </Breadcrumb>

                        </TabsList>

                        <TabsContent value="stepone" className='w-full'>

                            <Card className='w-full'>
                                <CardContent className="space-y-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            placeholder='e.g - abc@example.com'
                                            value={agEmail}
                                            autoComplete='new-email'
                                            autoCorrect='off'
                                            spellCheck='false'
                                            onChange={e => { setagEmail(e.target.value) }} />
                                    </div>
                                    {
                                        fetchingContry ?
                                            <CircularProgress />
                                            :
                                            country.length === 0 ?
                                                <p>No countries are available</p>
                                                :
                                                <div className="space-y-1">
                                                    <Label htmlFor="phonrnumber">Phone number</Label>
                                                    <div className="w-full space-y-2">
                                                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    className="w-full justify-between"
                                                                >
                                                                    {agnewCountry
                                                                        ? country.find((country) => country.country_code === agnewCountry) && agnewCountry
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
                                                                                    value={country.country_code}
                                                                                    onSelect={(currentValue) => {
                                                                                        setagNewCountry(country.country_code)
                                                                                        setPopoverOpen(false)
                                                                                    }}
                                                                                >
                                                                                    <Check
                                                                                        className={cn(
                                                                                            "mr-2 h-4 w-4",
                                                                                            agnewCountry === country.country_code ? "opacity-100" : "opacity-0"
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
                                                        <Input
                                                            id="phonrnumber"
                                                            placeholder='e.g - 12345678'
                                                            type='tel'
                                                            value={agnumber}
                                                            autoComplete='new-phone'
                                                            autoCorrect='off'
                                                            spellCheck='false'
                                                            onChange={e => { setagNumber(e.target.value) }}
                                                            maxLength={countryData.find(c => c.code === agnewCountry)?.phoneLength} />
                                                    </div>
                                                </div>
                                    }
                                    <div className="space-y-1">
                                        <Label htmlFor="password">Password</Label>
                                        <div className='flex items-center gap-3'>

                                            <Input
                                                id="password"
                                                type={`${agPasswordShow ? "text" : "password"}`}
                                                placeholder='********'
                                                value={agPassword}
                                                onChange={e => { setagPassword(e.target.value) }} />
                                            <div onClick={() => { setagPasswordShow(pre => !pre) }}>
                                                {
                                                    agPasswordShow ?
                                                        <EyeOff />
                                                        :
                                                        <Eye />
                                                }
                                            </div>

                                        </div>
                                        {
                                            agPassword &&
                                            <p
                                                className={`${agPassword.length < 8 ? "text-red-500" : "text-green-500"}`}>
                                                Password must be at least 8 characters long.
                                            </p>
                                        }
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="conpassword">Confirm Password</Label>
                                        <div className='flex items-center gap-3'>

                                            <Input
                                                id="conpassword"
                                                type={`${agConPasswordShow ? "text" : "password"}`}
                                                placeholder='********'
                                                value={agConPassword}
                                                onChange={e => { setagConPassword(e.target.value) }} />
                                            <div onClick={() => { setagConPasswordShow(pre => !pre) }}>
                                                {
                                                    agConPasswordShow ?
                                                        <EyeOff />
                                                        :
                                                        <Eye />
                                                }
                                            </div>

                                        </div>
                                        {
                                            agConPassword &&
                                            <p
                                                className={`${agConPassword.length < 8 ? "text-red-500" : "text-green-500"}`}>
                                                Password must be at least 8 characters long.
                                            </p>
                                        }
                                        {
                                            agConPassword && (agConPassword !== agPassword) &&
                                            <p
                                                className={`text-red-500`}>
                                                Password and confirm password is not matching
                                            </p>
                                        }
                                    </div>
                                </CardContent>

                                <CardFooter>
                                    <TabsList className='w-full flex items-center justify-end bg-transparent'>
                                        <TabsTrigger
                                            value="steptwo"
                                            className='bg-transparent flex items-center px-0'>
                                            <Button
                                                className="px-[20px] py-[10px] text-[18px] rounded-md bg-black text-white w-fit flex items-center justify-center gap-[10px] ml-auto">
                                                Next
                                            </Button>
                                        </TabsTrigger>
                                    </TabsList>
                                </CardFooter>
                            </Card>

                        </TabsContent>

                        <TabsContent value="steptwo">

                            <Card>
                                <CardContent className="space-y-2 py-2">
                                    <div className="flex items-center justify-center w-full">
                                        {agImage ? (
                                            <Image
                                                src={URL.createObjectURL(agImage)}
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
                                                            setagImage(file);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                    <Popover open={agDOB} onOpenChange={setagDOB}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-[280px] justify-start text-left font-normal",
                                                    !date && "text-muted-foreground"
                                                )}
                                                onClick={() => { setagDOB(true) }}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="flex w-fit flex-col space-y-2 p-2">
                                            <Select
                                                onValueChange={(value) => setyear(parseInt(value))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Year" />
                                                </SelectTrigger>
                                                <SelectContent position="popper">
                                                    {[...Array(90)].map((_, index) => {
                                                        const yearValue = new Date().getFullYear() - index
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
                                                    selected={date}
                                                    onSelect={handleDateChange}
                                                />
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <div className="space-y-1">
                                        <Label htmlFor="gender">Gender</Label>
                                        <Select
                                            onValueChange={(value) => setGender(value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={"male"}>
                                                    Male
                                                </SelectItem>
                                                <SelectItem value={"female"}>
                                                    Female
                                                </SelectItem>
                                                <SelectItem value={"others"}>
                                                    Others
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>

                                <CardFooter>
                                    <TabsList className='w-full flex items-center justify-between bg-transparent'>
                                        <TabsTrigger
                                            value="stepone"
                                            className='bg-transparent flex items-center px-0'>
                                            <Button
                                                className="px-[20px] py-[10px] text-[18px] rounded-md bg-black text-white w-fit flex items-center justify-center gap-[10px] ml-auto">
                                                Back
                                            </Button>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="stepfour"
                                            className='bg-transparent flex items-center px-0'>
                                            <Button
                                                className="px-[20px] py-[10px] text-[18px] rounded-md bg-black text-white w-fit flex items-center justify-center gap-[10px] ml-auto">
                                                Next
                                            </Button>
                                        </TabsTrigger>
                                    </TabsList>
                                </CardFooter>
                            </Card>

                        </TabsContent>

                        <TabsContent value="stepfour">

                            <Card>
                                <CardContent className="space-y-2 py-2">
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
                                    <div className="space-y-1">
                                        <Label htmlFor="liscenceNumber">Liscence ID</Label>
                                        <Input
                                            id="liscenceNumber"
                                            placeholder='e.g - es0012390'
                                            value={document_number}
                                            autoComplete='new-liscence'
                                            autoCorrect='off'
                                            spellCheck='false'
                                            onChange={e => { set_document_number(e.target.value) }} />
                                    </div>
                                    <Popover open={expiry_date_false} onOpenChange={set_expiry_date_false}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-[280px] justify-start text-left font-normal",
                                                    !expiry_date && "text-muted-foreground"
                                                )}
                                                onClick={() => { set_expiry_date_false(true) }}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {expiry_date ? format(expiry_date, "PPP") : <span>Expiry date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="flex w-fit flex-col space-y-2 p-2">
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
                                </CardContent>

                                <CardFooter>
                                    <TabsList className='w-full flex items-center justify-between bg-transparent'>
                                        <TabsTrigger
                                            value="steptwo"
                                            className='bg-transparent flex items-center px-0'>
                                            <Button
                                                className="px-[20px] py-[10px] text-[18px] rounded-md bg-black text-white w-fit flex items-center justify-center gap-[10px] ml-auto">
                                                Back
                                            </Button>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="stepfive"
                                            className='bg-transparent flex items-center px-0'>
                                            <Button
                                                className="px-[20px] py-[10px] text-[18px] rounded-md bg-black text-white w-fit flex items-center justify-center gap-[10px] ml-auto">
                                                Next
                                            </Button>
                                        </TabsTrigger>
                                    </TabsList>
                                </CardFooter>
                            </Card>

                        </TabsContent>

                        <TabsContent value="stepfive">

                            {
                                fetchSubscriptions ?
                                    <p>Loading all plans</p>
                                    :
                                    <div className="container mx-auto p-4">
                                        <h1 className="text-3xl font-bold mb-6 text-center">Choose Your Subscription Plan</h1>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {subscriptions.filter(subs => subs.for_owner === true).length === 0 ?
                                                <p>No subscriptions present for owners</p>
                                                :
                                                subscriptions.filter(subs => subs.for_owner === true).map((sub) => (
                                                    <Card
                                                        key={sub.id}
                                                        className="flex flex-col bg-white hover:bg-black hover:text-white transition-colors duration-300 group"
                                                    >
                                                        <CardHeader className="flex-1 space-y-4">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="text-primary group-hover:text-white">
                                                                        {sub.type === SubscriptionType.Business ? <Building className="w-6 h-6" /> : sub.type === SubscriptionType.Premium ? <Rocket className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                                                                    </div>
                                                                </div>
                                                                <h3 className="text-2xl font-bold">{sub.name}</h3>
                                                                <p className={`text-sm text-gray-500 group-hover:text-white`}>
                                                                    {sub.type}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-baseline text-6xl font-bold">
                                                                ${sub.actual_cost - sub.discount_cost}
                                                                <span className={`ml-1 text-sm font-normal text-gray-500 group-hover:text-white`}>
                                                                    - {sub.total_days} days
                                                                </span>
                                                            </div>
                                                        </CardHeader>

                                                        <Separator className="mb-3" />
                                                        <CardContent className="flex-1">
                                                            <ul className="space-y-4">
                                                                {sub.focused_features.map((feature, i) => (
                                                                    <li key={i} className="flex items-center text-green-600">
                                                                        <Check className="h-4 w-4 mr-2" />
                                                                        <span>{feature}</span>
                                                                    </li>
                                                                ))}
                                                                {sub.features.map((feature, i) => (
                                                                    <li key={i} className="flex items-center">
                                                                        <Check className="h-4 w-4 mr-2" />
                                                                        <span>{feature}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </CardContent>
                                                        <CardFooter>
                                                            <Button
                                                                className="w-full transition-all duration-500 group-hover:bg-white group-hover:text-black"
                                                                onClick={() => handleSelectPlan(sub)}
                                                                variant={selectedPlan?.id === sub.id ? "secondary" : "default"}
                                                            >
                                                                {selectedPlan?.id === sub.id ? 'Selected' : 'Select Plan'}
                                                            </Button>
                                                        </CardFooter>
                                                    </Card>
                                                ))}
                                        </div>

                                        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                                            <DialogContent className='h-[90vh] overflow-auto' style={{ scrollbarWidth: "none" }}>
                                                <DialogHeader>
                                                    <DialogTitle className='text-center'>Complete Your payment and update the screen shot</DialogTitle>
                                                </DialogHeader>
                                                <div className='grid grid-cols-2 gap-4'>
                                                    <Image
                                                        src={QRCODE}
                                                        alt='QR code image'
                                                        className='w-full object-contain'
                                                        unoptimized={true} />
                                                    <div className="space-y-4 flex flex-col items-center justify-center">
                                                        <h3 className="text-lg font-medium">Payment Proof</h3>
                                                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg">
                                                            <label
                                                                htmlFor="payment-proof"
                                                                className="relative flex flex-col items-center justify-center gap-1 p-8 text-center cursor-pointer w-full h-[300px]"
                                                            >
                                                                {!previewUrl ? (
                                                                    <>
                                                                        <div className="size-10 flex items-center justify-center rounded-full bg-primary/10">
                                                                            <svg
                                                                                className="size-6 text-primary"
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="24"
                                                                                height="24"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                strokeWidth="2"
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                            >
                                                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                                <polyline points="17 8 12 3 7 8" />
                                                                                <line x1="12" x2="12" y1="3" y2="15" />
                                                                            </svg>
                                                                        </div>
                                                                        <p className="text-sm text-muted-foreground mt-2">
                                                                            Drag & drop or click to choose files
                                                                        </p>
                                                                        <input
                                                                            id="payment-proof"
                                                                            type="file"
                                                                            accept="image/*,.pdf"
                                                                            className="sr-only"
                                                                            onChange={handleFileChange}
                                                                        />
                                                                    </>
                                                                ) : (
                                                                    <div className="relative">
                                                                        <img
                                                                            src={previewUrl}
                                                                            alt="Uploaded File Preview"
                                                                            className="max-h-40 rounded-lg object-cover"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={handleRemoveFile}
                                                                            className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full p-1"
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </label>
                                                            {
                                                                selectedFile && <Button className='w-full' disabled={loading || purchasing} onClick={() => { ownerRegister() }}>
                                                                    {
                                                                        (loading || purchasing) ? "Creating..." : "Creating account"
                                                                    }
                                                                </Button>
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                            }

                        </TabsContent>

                    </Tabs>
                </div>

            </DialogContent>

        </Dialog>
    )
}

export default OwnerRegister