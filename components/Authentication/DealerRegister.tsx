"use client"

import { uploadFileToS3 } from '@/utils/AWS/FileUpload';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage, successMessage } from '@/utils/Toastify/Messages';
import { City, Country, Subscriptions } from '@/utils/Types/types';
import { format, setYear } from 'date-fns';
import { useCookie } from 'next-cookie';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Backdrop, CircularProgress } from '@mui/material';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '../ui/breadcrumb';
import { AtSign, BadgeDollarSign, CalendarIcon, Check, ChevronsUpDown, CircleCheck, DatabaseZap, Eye, EyeOff, MapPinned, VenetianMask, Store, User, MapPin, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { RegisterStepperHeader } from './RegisterStepperHeader';
import { Separator } from '../ui/separator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import countryData from './CountryCodeRoles';
import { Badge } from '../ui/badge';
import CryptoJS from "crypto-js";
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { authTranslations, AuthLanguage } from '@/utils/translation/authTranslations';

const DealerRegister = ({ name, inPage, trigger }: { name: string; inPage: boolean; trigger?: React.ReactNode }) => {
    const activeLang = useSelector((state: RootState) => state.ActiveLanguage.language) as AuthLanguage;
    const currentLang = activeLang === 'es' ? 'es' : 'en';
    const t = authTranslations[currentLang] || authTranslations.en;

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
    const [agSecondCard, setagSecondCard] = useState(false)
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

    const { cookie } = useCookie()
    const access_token = cookie.get("access_token");

    const router = useRouter()

    const fetchAllSubscriptions = () => {
        setFetchSubscriptions(true)
        renderInstance.get("/subscription?for_dealer=true")
            .then((res) => {
                const list = Array.isArray(res.data) ? res.data : []
                setSubscriptions(list.filter((p: any) => p.for_dealer === true))
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

    async function dealerRegister() {
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
        if (!attachment) {
            errorMessage("Upload your liscence image")
            return
        }
        if (!document_number) {
            errorMessage("Please give your liscence number")
            return
        }

        const { firstName, middleName, lastName } = splitFullName(name);
        const encryptedPassword = CryptoJS.AES.encrypt(
            agPassword,
            "m4AfXfQ&1brl3LjQFYO"
        ).toString();

        setLoading(true)
        const selectedRole = await renderInstance.get('/role/getIdByName/dealer')
        if (!selectedRole) {
            errorMessage("Currently not possible to register")
            setLoading(false)
            return
        }

        let imageUrl = "";
        if (agImage) {
            try {
                const buffer = Buffer.from(await agImage.arrayBuffer());
                imageUrl = await uploadFileToS3(buffer, agImage.name);
            } catch (imgErr) {
                console.warn("Dealer profile image upload warning:", imgErr);
            }
        }

        let attachmentLink = "";
        if (attachment) {
            try {
                const buffer = Buffer.from(await attachment.arrayBuffer());
                attachmentLink = await uploadFileToS3(buffer, attachment.name);
            } catch (attErr) {
                console.warn("Dealer document attachment upload warning:", attErr);
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
        };

        inPage ?
            renderInstance
                .post("/dealer/createWithCreator", user, {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                })
                .then((res) => {
                    if (res.status === 201 && res.data.access_token) {
                        successMessage("Created successfully")
                        if (selectedPlan?.id) {
                            renderInstance.post(`/subscription/dealer_purchase/${selectedPlan.id}`, {}, {
                                headers: {
                                    Authorization: `Bearer ${res.data.access_token}`,
                                }
                            }).catch(() => {})
                        }
                        setTimeout(() => {
                            router.push("/Dealer")
                            window.location.reload()
                        }, 2000);
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

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault()
        // Here you would typically handle the payment processing
        console.log(`Processing payment for ${selectedPlan?.name}`)
        setIsPaymentDialogOpen(false)
    }

    useEffect(() => {
        fetchAllCountry()
    }, [])

    useEffect(() => {
        if (location_country) fetchAllCity()
    }, [location_country])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <Button
                        className="px-[20px] py-[10px] text-[18px] rounded-md bg-black text-white w-fit flex items-center justify-center gap-[10px] ml-auto"
                        variant={"default"}
                        onClick={() => {
                            setOpen(true)
                        }}
                    >
                        {inPage ? t.continueBtn : t.continueDealer}
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent
                className="bg-white max-w-lg sm:max-w-xl md:max-w-2xl w-[94vw] max-h-[85vh] overflow-hidden p-0 rounded-2xl border border-slate-200/90 shadow-2xl flex flex-col"
            >

                <Backdrop
                    sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={loading}
                >
                    <CircularProgress />
                </Backdrop>

                <div
                    className="bg-white text-slate-900 flex flex-col relative w-full max-h-[85vh] overflow-y-auto p-4 sm:p-6"
                    style={{ scrollbarWidth: "thin" }}
                >

                    <Tabs className="w-full flex flex-col flex-1" defaultValue='stepone'>

                        <RegisterStepperHeader
                            roleTitle={t.dealerRoleTitle}
                            roleBadge={t.dealerRoleBadge}
                            roleIcon={<Store className="w-4 h-4 text-white" />}
                            applicantName={name}
                            themeColor="blue"
                            steps={[
                                {
                                    id: "stepone",
                                    number: 1,
                                    label: t.stepCredentials,
                                    isComplete: Boolean(name && agEmail && agPassword && agnewCountry && agnumber),
                                },
                                {
                                    id: "steptwo",
                                    number: 2,
                                    label: t.stepProfile,
                                    isComplete: Boolean(date && gender),
                                },
                                {
                                    id: "stepthree",
                                    number: 3,
                                    label: t.stepLocation,
                                    isComplete: Boolean(location_name && location_address && location_city && location_state && location_zip_code && location_country),
                                },
                                {
                                    id: "stepfour",
                                    number: 4,
                                    label: t.stepDocuments,
                                    isComplete: Boolean(attachment && document_number),
                                },
                                {
                                    id: "stepfive",
                                    number: 5,
                                    label: t.stepSubscription,
                                    isComplete: Boolean(selectedPlan),
                                }
                            ]}
                        />

                        <TabsContent value="stepone" className='w-full'>

                            <Card className='w-full border-0 shadow-none p-0 mt-2 bg-transparent'>
                                <CardContent className="space-y-3 px-0 py-1">
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
                                                                    // aria-expanded={popoverOpen}
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
                                                {
                                                    agConPassword && (agConPassword !== agPassword) &&
                                                    <p
                                                        className={`text-red-500`}>
                                                        Password and confirm password is not matching
                                                    </p>
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
                                    </div>
                                </CardContent>

                                <CardFooter className="pt-4 border-t border-slate-100 flex items-center justify-end px-0">
                                    <TabsList className='bg-transparent p-0'>
                                        <TabsTrigger
                                            value="steptwo"
                                            asChild
                                            className='p-0'>
                                            <Button
                                                className="px-5 py-2 rounded-lg bg-[#AB0F0C] hover:bg-[#8e0d0a] text-white text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-all duration-150 cursor-pointer">
                                                <span>{t.next}: {t.stepProfile}</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </TabsTrigger>
                                    </TabsList>
                                </CardFooter>
                            </Card>

                        </TabsContent>

                        <TabsContent value="steptwo">

                            <Card className='w-full border-0 shadow-none p-0 mt-2 bg-transparent'>
                                <CardContent className="space-y-3 px-0 py-1">
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
                                    <div className="space-y-1">
                                        <Label>{t.dateOfBirth}</Label>
                                        <Popover open={agDOB} onOpenChange={setagDOB}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full sm:w-[280px] justify-start text-left font-normal",
                                                        !date && "text-muted-foreground"
                                                    )}
                                                    onClick={() => { setagDOB(true) }}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {date ? format(date, "PPP") : <span>{t.pickADate}</span>}
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
                                </CardContent>

                                <CardFooter className="pt-4 border-t border-slate-100 px-0">
                                    <TabsList className='w-full flex items-center justify-between bg-transparent p-0'>
                                        <TabsTrigger
                                            value="stepone"
                                            asChild
                                            className='p-0'>
                                            <Button
                                                variant="outline"
                                                className="px-4 py-2 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-semibold flex items-center gap-1.5 cursor-pointer">
                                                <ChevronLeft className="w-4 h-4" />
                                                <span>{t.back}</span>
                                            </Button>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="stepthree"
                                            asChild
                                            className='p-0'>
                                            <Button
                                                className="px-5 py-2 rounded-lg bg-[#AB0F0C] hover:bg-[#8e0d0a] text-white text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-all duration-150 cursor-pointer">
                                                <span>{t.next}: {t.stepLocation}</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </TabsTrigger>
                                    </TabsList>
                                </CardFooter>
                            </Card>

                        </TabsContent>

                        <TabsContent value="stepthree">

                            <Card className='w-full border-0 shadow-none p-0 mt-2 bg-transparent'>
                                <CardContent className="space-y-3 px-0 py-1">
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

                                <CardFooter className="pt-4 border-t border-slate-100 px-0">
                                    <TabsList className='w-full flex items-center justify-between bg-transparent p-0'>
                                        <TabsTrigger
                                            value="steptwo"
                                            asChild
                                            className='p-0'>
                                            <Button
                                                variant="outline"
                                                className="px-4 py-2 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-semibold flex items-center gap-1.5 cursor-pointer">
                                                <ChevronLeft className="w-4 h-4" />
                                                <span>{t.back}</span>
                                            </Button>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="stepfour"
                                            asChild
                                            className='p-0'>
                                            <Button
                                                className="px-5 py-2 rounded-lg bg-[#AB0F0C] hover:bg-[#8e0d0a] text-white text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-all duration-150 cursor-pointer">
                                                <span>{t.next}: {t.stepDocuments}</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </TabsTrigger>
                                    </TabsList>
                                </CardFooter>
                            </Card>

                        </TabsContent>

                        <TabsContent value="stepfour">

                            <Card className='w-full border-0 shadow-none p-0 mt-2 bg-transparent'>
                                <CardContent className="space-y-3 px-0 py-1">
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
                                <CardFooter className="pt-4 border-t border-slate-100 px-0">
                                    <TabsList className='w-full flex items-center justify-between bg-transparent p-0'>
                                        <TabsTrigger
                                            value="stepthree"
                                            asChild
                                            className='p-0'>
                                            <Button
                                                variant="outline"
                                                className="px-4 py-2 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-semibold flex items-center gap-1.5 cursor-pointer">
                                                <ChevronLeft className="w-4 h-4" />
                                                <span>{t.back}</span>
                                            </Button>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="stepfive"
                                            asChild
                                            className='p-0'>
                                            <Button
                                                className="px-5 py-2 rounded-lg bg-[#AB0F0C] hover:bg-[#8e0d0a] text-white text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-all duration-150 cursor-pointer">
                                                <span>{t.next}: {t.stepSubscription}</span>
                                                <ChevronRight className="w-4 h-4" />
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
                                        <h1 className="text-3xl font-bold mb-6 text-center">{t.choosePlanTitle}</h1>
                                        <div className='w-full flex justify-end items-center my-4'>
                                            <Button
                                                onClick={() => { dealerRegister() }}>
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

                    </Tabs>

                </div>
            </DialogContent>
        </Dialog>
    )
}

export default DealerRegister