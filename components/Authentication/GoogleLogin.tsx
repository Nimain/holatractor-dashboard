"use client"

import { useState, useEffect } from 'react';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '../ui/breadcrumb';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { AtSign, BadgeDollarSign, CalendarIcon, Check, ChevronsUpDown, CircleCheck, DatabaseZap, VenetianMask } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format, setYear } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { City, Country, Subscriptions } from '@/utils/Types/types';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage, successMessage } from '@/utils/Toastify/Messages';
import { Backdrop, CircularProgress } from '@mui/material';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Badge } from '../ui/badge';
import { uploadFileToS3 } from '@/utils/AWS/FileUpload';
import { useCookie } from 'next-cookie';
import { useRouter } from 'next/navigation';

interface GoogleResBody {
    email: string;
    name: string;
    picture?: string;
    verified_email: boolean;
    id: string;
}

const roles = [
    {
        label: "Dealer",
        value: "dealer"
    },
    {
        label: "Operator",
        value: "operator"
    },
    {
        label: "Owner",
        value: "owner"
    },
]

function App() {
    const [googleRes, setGoogleRes] = useState<GoogleResBody | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const [role, setRole] = useState("")
    const [gender, setGender] = useState("")
    const [expiry_date, set_expiry_date] = useState<Date>()
    const [expiry_date_false, set_expiry_date_false] = useState(false)
    const [expiry_date_year, set_expiry_date_year] = useState<number>(new Date().getFullYear())
    const [attachment, setattachment] = useState<File | null>(null);
    const [document_number, set_document_number] = useState("")
    const [agDOB, setagDOB] = useState(false)
    const [date, setDate] = useState<Date>()
    const [year, setyear] = useState<number>(new Date().getFullYear())

    const [location_name, set_location_name] = useState("")
    const [location_address, set_location_address] = useState("")
    const [location_city, set_location_city] = useState("")
    const [location_state, set_location_state] = useState("")
    const [location_zip_code, set_location_zip_code] = useState("")
    const [location_country, set_location_country] = useState("")

    const [fetchingCity, setFetchingCity] = useState(false);
    const [city, setCity] = useState<City[]>([]);
    const [popoverOpenCity, setPopoverOpenCity] = useState(false)
    const [fetchingContry, setFetchingCountry] = useState(false);
    const [country, setCountry] = useState<Country[]>([]);
    const [popoverOpen, setPopoverOpen] = useState(false)

    const [subscriptions, setSubscriptions] = useState<Subscriptions[]>([])
    const [fetchSubscriptions, setFetchSubscriptions] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<Subscriptions | null>(null)
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)

    const { cookie } = useCookie()
    const access_token = cookie.get("access_token");

    const router = useRouter()

    // Handle date selection with the chosen year
    const handleExpiryDateChange = (newDate: Date | undefined) => {
        if (newDate) {
            const updatedDate = setYear(newDate, expiry_date_year)
            set_expiry_date(updatedDate)
            set_expiry_date_false(false)
        }
    }

    // Handle date selection with the chosen year
    const handleDateChange = (newDate: Date | undefined) => {
        if (newDate) {
            const updatedDate = setYear(newDate, year)
            setDate(updatedDate)
            setagDOB(false)
        }
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

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault()
        // Here you would typically handle the payment processing
        console.log(`Processing payment for ${selectedPlan?.name}`)
        setIsPaymentDialogOpen(false)
    }

    const handleSelectPlan = (subscription: Subscriptions) => {
        setSelectedPlan(subscription)
        setIsPaymentDialogOpen(true)
    }

    const login = useGoogleLogin({
        onSuccess: (codeResponse) => {
            axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${codeResponse.access_token}`, {
                headers: {
                    Authorization: `Bearer ${codeResponse.access_token}`,
                    Accept: 'application/json'
                }
            })
                .then((res) => {
                    setGoogleRes(res.data);
                    setDialogOpen(true)
                    // console.log(res.data)
                })
                .catch((err) => errorMessage('Login Failed'));
        },
        onError: (error) => errorMessage('Login Failed')
    });

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

    async function handleRegister() {
        if (!googleRes) {
            errorMessage("Google login error")
            return
        }
        if (!role) {
            errorMessage("Please select a role")
            return
        }

        const { firstName, lastName, middleName } = splitFullName(googleRes.name)

        if (!firstName || !lastName) {
            errorMessage("Give your full name")
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
        if (!location_name) {
            errorMessage("Address line 1 is required")
            return
        }
        if (!location_address) {
            errorMessage("Address line 2 is required")
            return
        }
        if (!location_city) {
            errorMessage("City is required")
            return
        }
        if (!location_state) {
            errorMessage("State is required")
            return
        }
        if (!location_zip_code) {
            errorMessage("Zip code is required")
            return
        }
        if (!location_country) {
            errorMessage("Please select your country")
            return
        }
        if (!attachment && role !== "owner") {
            errorMessage("Upload your liscence image")
            return
        }
        if (!document_number && role !== "owner") {
            errorMessage("Please give your liscence number")
            return
        }

        setLoading(true)
        const selectedRole = await renderInstance.get(`/role/getIdByName/${role}`)
        if (!selectedRole) {
            errorMessage("Currently not possible to register")
            setLoading(false)
            return
        }

        let attachmentLink = ""
        if (attachment) {

            const buffer = Buffer.from(await attachment.arrayBuffer());
            attachmentLink = await uploadFileToS3(buffer, attachment.name);

            if (!attachmentLink) {
                errorMessage("Something went wrong in uploading the attachment");
                setLoading(false)
                return;
            }
        }

        if (role === "dealer") {

            const user = {
                first_name: firstName,
                middle_name: middleName,
                last_name: lastName,
                email: googleRes.email,
                image: googleRes.picture,
                dob: new Date(date),
                gender,
                role_id: selectedRole.data,
                authType: "GOOGLE",
                location_name,
                location_address,
                location_city,
                location_state,
                location_zip_code,
                location_country,
                attachment: attachmentLink,
                document_number,
                expiry_date,
                email_verified: googleRes.verified_email,
                googleId: googleRes.id
            };

            renderInstance
                .post("/dealer", user)
                .then((res) => {
                    if (res.status === 201 && res.data.access_token) {
                        const expiryDate = new Date();
                        expiryDate.setDate(expiryDate.getDate() + 1);

                        // Set the cookie with the calculated expiry date
                        cookie.remove("access_token", { path: "/" });

                        successMessage("User sign up successfully");
                        router.push("/login");
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

        if (role === "operator") {
            const user = {
                first_name: firstName,
                middle_name: middleName,
                last_name: lastName,
                email: googleRes.email,
                image: googleRes.picture,
                dob: new Date(date),
                gender,
                role_id: selectedRole.data,
                authType: "GOOGLE",
                location_name,
                location_address,
                location_city,
                location_state,
                location_zip_code,
                location_country,
                attachment: attachmentLink,
                document_number,
                expiry_date,
                email_verified: googleRes.verified_email,
                googleId: googleRes.id
            };

            renderInstance
                .post("/operator", user)
                .then((res) => {
                    if (res.status === 201 && res.data.access_token) {
                        const expiryDate = new Date();
                        expiryDate.setDate(expiryDate.getDate() + 1);

                        // Set the cookie with the calculated expiry date
                        cookie.remove("access_token", { path: "/" });

                        successMessage("User sign up successfully");
                        router.push("/login");
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

        if (role === "owner") {
            const user = {
                first_name: firstName,
                middle_name: middleName,
                last_name: lastName,
                email: googleRes.email,
                image: googleRes.picture,
                dob: new Date(date),
                gender,
                role_id: selectedRole.data,
                authType: "GOOGLE",
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
                email_verified: googleRes.verified_email,
                googleId: googleRes.id
            };

            renderInstance
                .post("/owner", user)
                .then((res) => {
                    if (res.status === 201 && res.data.access_token) {
                        const expiryDate = new Date();
                        expiryDate.setDate(expiryDate.getDate() + 1);

                        // Set the cookie with the calculated expiry date
                        cookie.remove("access_token", { path: "/" });

                        successMessage("User sign up successfully");
                        router.push("/login");
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
    }

    useEffect(() => {
        fetchAllCountry()
    }, [])

    useEffect(() => {
        if (location_country) fetchAllCity()
    }, [location_country])

    if (dialogOpen) {
        return (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>

                <DialogContent
                    className="bg-white h-[90vh] w-[1200px] overflow-auto"
                    style={{ scrollbarWidth: "none" }}
                >

                    <Backdrop
                        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
                        open={loading}
                    >
                        <CircularProgress />
                    </Backdrop>

                    <div
                        className="bg-white rounded-xl text-black flex gap-[16px] flex-col relative w-full h-[90vh] overflow-auto"
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
                                                    className={`bg-white hover:bg-transparent px-5 text-black`}>
                                                    <AtSign />
                                                </Button>
                                            </TabsTrigger>

                                        </BreadcrumbItem>

                                        <BreadcrumbSeparator>
                                            <Separator
                                                className={`w-24 h-1 rounded-full text-black`} />
                                        </BreadcrumbSeparator>

                                        <BreadcrumbItem className='w-fit'>

                                            <TabsTrigger
                                                value="steptwo"
                                                className='bg-transparent flex items-center px-0'>
                                                <Button
                                                    className={`bg-white hover:bg-transparent px-5 text-black`}>
                                                    <VenetianMask />
                                                </Button>
                                            </TabsTrigger>

                                        </BreadcrumbItem>

                                        {
                                            (role === "dealer" || role === "owner") &&
                                            <BreadcrumbSeparator>
                                                <Separator
                                                    className={`w-24 h-1 rounded-full text-black`} />
                                            </BreadcrumbSeparator>

                                        }

                                        {
                                            (role === "dealer" || role === "owner") &&
                                            <BreadcrumbItem className="w-fit">

                                                <TabsTrigger
                                                    value="stepthree"
                                                    className='bg-transparent flex items-center px-0'>
                                                    <Button
                                                        className={`bg-white hover:bg-transparent pl-1 pr-0 text-black`}>
                                                        <DatabaseZap />
                                                    </Button>
                                                </TabsTrigger>

                                            </BreadcrumbItem>
                                        }

                                    </BreadcrumbList>

                                </Breadcrumb>

                            </TabsList>

                            <TabsContent value="stepone" className='w-full'>

                                <Card className='w-full'>
                                    <CardContent className="space-y-2">
                                        <div className="space-y-1">
                                            <Label htmlFor="role">Role</Label>
                                            <Select
                                                onValueChange={(value) => setRole(value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent position="popper">
                                                    {roles.map((details, index) => {
                                                        return (
                                                            <SelectItem key={index} value={details.value}>
                                                                {details.label}
                                                            </SelectItem>
                                                        )
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </div>
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
                                        {
                                            (role === "operator" || role === "dealer") &&
                                            <>
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
                                            </>
                                        }
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
                                                    {date ? format(date, "PPP") : <span>Pick your dob</span>}
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
                                        {
                                            fetchingContry ?
                                                <CircularProgress />
                                                :
                                                country.length === 0 ?
                                                    <p>No countries are available</p>
                                                    :
                                                    <div className="space-y-1">
                                                        <Label htmlFor="phonrnumber">Country name</Label>
                                                        <div className="w-full space-y-2">
                                                            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        role="combobox"
                                                                        // aria-expanded={popoverOpen}
                                                                        className="w-full justify-between"
                                                                    >
                                                                        {location_country
                                                                            ? country.find((country) => country.name === location_country) && location_country
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
                                                                                            set_location_country(country.name)
                                                                                            setPopoverOpen(false)
                                                                                        }}
                                                                                    >
                                                                                        <Check
                                                                                            className={cn(
                                                                                                "mr-2 h-4 w-4",
                                                                                                location_country === country.name ? "opacity-100" : "opacity-0"
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
                                            location_country && <div className="space-y-1">
                                                <Label htmlFor="location_city">City</Label>
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
                                                                                            className={`${location_country !== cityDetails.country.name && "hidden"}`}
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
                                            location_city && <div className="space-y-1">
                                                <Label htmlFor="location_zip_code">Zip code</Label>
                                                <Input
                                                    id="location_zip_code"
                                                    placeholder='e.g - 757020'
                                                    value={location_zip_code}
                                                    autoComplete='new-zipcode'
                                                    autoCorrect='off'
                                                    spellCheck='false'
                                                    onChange={e => { set_location_zip_code(e.target.value) }} />
                                            </div>
                                        }
                                        {
                                            location_city && <div className="space-y-1">
                                                <Label htmlFor="location_name">Address line 1</Label>
                                                <Input
                                                    id="location_name"
                                                    placeholder='e.g - st mary hiighway'
                                                    value={location_name}
                                                    autoComplete='new-address'
                                                    autoCorrect='off'
                                                    spellCheck='false'
                                                    onChange={e => { set_location_name(e.target.value) }} />
                                            </div>
                                        }
                                        {
                                            location_city && <div className="space-y-1">
                                                <Label htmlFor="location_address">Address line 2</Label>
                                                <Input
                                                    id="location_address"
                                                    placeholder='e.g - st mary hiighway'
                                                    value={location_address}
                                                    autoComplete='new-address2'
                                                    autoCorrect='off'
                                                    spellCheck='false'
                                                    onChange={e => { set_location_address(e.target.value) }} />
                                            </div>
                                        }
                                        {
                                            location_city && <div className="space-y-1">
                                                <Label htmlFor="location_state">State</Label>
                                                <Input
                                                    id="location_state"
                                                    placeholder='e.g - Odisha'
                                                    value={location_state}
                                                    autoComplete='new-state'
                                                    autoCorrect='off'
                                                    spellCheck='false'
                                                    onChange={e => { set_location_state(e.target.value) }} />
                                            </div>
                                        }


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
                                            {
                                                (role === "dealer" || role === "owner") ?
                                                    <TabsTrigger
                                                        value="stepthree"
                                                        className='bg-transparent flex items-center px-0'>
                                                        <Button
                                                            className="px-[20px] py-[10px] text-[18px] rounded-md bg-black text-white w-fit flex items-center justify-center gap-[10px] ml-auto">
                                                            Next
                                                        </Button>
                                                    </TabsTrigger>
                                                    :
                                                    <Button
                                                        className="px-[20px] py-[10px] text-[18px] rounded-md bg-black text-white w-fit flex items-center justify-center gap-[10px] ml-auto"
                                                        onClick={() => { handleRegister() }}>
                                                        Create account
                                                    </Button>
                                            }
                                        </TabsList>
                                    </CardFooter>
                                </Card>

                            </TabsContent>

                            {
                                (role === "dealer" || role === "owner") &&
                                <TabsContent value="stepthree">

                                    {
                                        fetchSubscriptions ?
                                            <p>Loading all plans</p>
                                            :
                                            <div className="container mx-auto p-4">
                                                <h1 className="text-3xl font-bold mb-6 text-center">Choose Your Subscription Plan</h1>
                                                <div className='w-full flex justify-end items-center my-4'>
                                                    <Button
                                                        onClick={() => { handleRegister() }}>
                                                        Skip subscription
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {subscriptions.filter(subs => subs.for_owner === true).length === 0 ?
                                                        <p>No subscriptions present for owners</p>
                                                        :
                                                        subscriptions.filter(subs => subs.for_owner === true).map((sub) => (
                                                            <Card key={sub.id} className={`flex flex-col ${selectedPlan?.id === sub.id ? 'border-primary' : ''}`}>
                                                                <CardHeader>
                                                                    <CardTitle>{sub.name}</CardTitle>
                                                                    <CardDescription>{sub.type} Plan</CardDescription>
                                                                </CardHeader>
                                                                <CardContent className="flex-grow">
                                                                    <div className="mb-4">
                                                                        <span className="text-3xl font-bold">${sub.actual_cost}</span>
                                                                        {sub.discount_cost < sub.actual_cost && (
                                                                            <span className="text-muted-foreground line-through ml-2">${sub.actual_cost}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {sub.focused_features.map((feature, index) => (
                                                                            <li key={index} className="text-sm font-medium flex gap-2 items-center text-green-500">
                                                                                <CircleCheck /> <p className="text-green-500">{feature}</p>
                                                                            </li>
                                                                        ))}
                                                                        {sub.features.map((feature, index) => (
                                                                            <li key={index} className="text-sm flex gap-2 items-center">
                                                                                <CircleCheck />{feature}
                                                                            </li>
                                                                        ))}
                                                                    </div>
                                                                    <div className="mt-4">
                                                                        <Badge variant="outline">{sub.total_days} days</Badge>
                                                                    </div>
                                                                </CardContent>
                                                                <CardFooter>
                                                                    <Button
                                                                        className="w-full"
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
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Complete Your Purchase</DialogTitle>
                                                            <DialogDescription>
                                                                You're about to subscribe to the {selectedPlan?.name} for ${selectedPlan?.discount_cost}.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <form onSubmit={handlePayment}>
                                                            <div className="grid gap-4 py-4">
                                                                <div className="grid grid-cols-4 items-center gap-4">
                                                                    <Label htmlFor="name" className="text-right">
                                                                        Name
                                                                    </Label>
                                                                    <Input id="name" className="col-span-3" />
                                                                </div>
                                                                <div className="grid grid-cols-4 items-center gap-4">
                                                                    <Label htmlFor="card-number" className="text-right">
                                                                        Card Number
                                                                    </Label>
                                                                    <Input id="card-number" className="col-span-3" />
                                                                </div>
                                                                <div className="grid grid-cols-4 items-center gap-4">
                                                                    <Label htmlFor="expiry" className="text-right">
                                                                        Expiry Date
                                                                    </Label>
                                                                    <Input id="expiry" className="col-span-3" placeholder="MM/YY" />
                                                                </div>
                                                                <div className="grid grid-cols-4 items-center gap-4">
                                                                    <Label htmlFor="cvv" className="text-right">
                                                                        CVV
                                                                    </Label>
                                                                    <Input id="cvv" className="col-span-3" />
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button type="submit">Pay Now</Button>
                                                            </DialogFooter>
                                                        </form>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>

                                    }

                                </TabsContent>
                            }

                        </Tabs>

                    </div>
                </DialogContent>

            </Dialog>
        )
    }

    return (
        <div className="flex items-center justify-center gap-[10px]" onClick={() => { login() }}>
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
        </div>
    );
}
export default App;