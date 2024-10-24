"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"
import { City, Country, Dealer, DealerStore } from "@/utils/Types/types"
import { CircularProgress } from "@mui/material"
import { Bell, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, Megaphone, PhoneCall, PlusCircle, Settings, Store, Upload, Users, Wrench, X } from "lucide-react"
import { useCookie } from "next-cookie"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { uploadFileToS3 } from '@/utils/AWS/FileUpload';

const sidebarItems = [
  { icon: Store, label: 'Store', href: '/dashboard/store' },
  { icon: Users, label: 'Customers', href: '/dashboard/customers' },
  { icon: PhoneCall, label: 'Leads', href: '/dashboard/leads' },
  { icon: Megaphone, label: 'Marketing', href: '/dashboard/marketing' },
  { icon: Bell, label: 'Notifications', href: '/dashboard/notifications' },
  {
    icon: Settings,
    label: 'Settings',
    href: '/dashboard/settings',
    subItems: [
      { label: 'Profile', href: '/dashboard/settings/profile' },
      { label: 'Menu', href: '/dashboard/settings/menu' },
      { label: 'Logo', href: '/dashboard/settings/logo' },
      { label: 'Language', href: '/dashboard/settings/language' },
    ]
  },
  { icon: Wrench, label: 'Tractor Repair', href: '/dashboard/tractor-repair' },
]

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

const daysOfWeek = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
]

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showStoreList, setShowStoreList] = useState(false)
  const [dealer, setDealer] = useState<Dealer | null>(null)
  const [fetchingDealerDetails, setFetchingDealerDetails] = useState(false)
  const [storeList, setStoreList] = useState<DealerStore[]>([])

  // Form states
  const [creatingStore, setCreatingStore] = useState(false)
  const [store_name, set_store_name] = useState("")
  const [store_description, set_store_description] = useState("")
  const [store_location_name, set_store_location_name] = useState("")
  const [store_location_address, set_store_location_address] = useState("")
  const [store_location_city, set_store_location_city] = useState("")
  const [store_location_state, set_store_location_state] = useState("")
  const [store_location_zipcode, set_store_location_zipcode] = useState("")
  const [store_location_country, set_store_location_country] = useState("")
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [closingDays, setClosingDays] = useState<string[]>([]);
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const [country, setCountry] = useState<Country[]>([]);
  const [fetchingContry, setFetchingCountry] = useState(false);

  const [fetchingCity, setFetchingCity] = useState(false);
  const [city, setCity] = useState<City[]>([]);

  const [popoverOpenCountry, setPopoverOpenCountry] = useState(false)
  const [popoverOpenCity, setPopoverOpenCity] = useState(false)

  const pathname = usePathname()

  const { cookie } = useCookie()
  const user: user = cookie.get("user")
  const access_token = cookie.get("access_token")

  const handleClosingDayChange = (day: string) => {
    setClosingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
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

  function fetchDealer() {
    setFetchingDealerDetails(true)

    renderInstance.get(`/dealer/${user.userId}`)
      .then((res) => {
        setDealer(res.data.dealer)
        setStoreList(res.data.store)
      }).catch((err) => {
        if (err.response && err.response.status === 404 && err.response.data.message === "Dealer not found") {
          errorMessage("Dealer not found")
        } else {
          errorMessage("Error fetching user detaild")
        }
      }).finally(() => {
        setFetchingDealerDetails(false)
      })
  }

  async function handleCreateStore() {
    if (!store_location_city) {
      errorMessage("Please select a city")
      return
    }
    if (!store_location_country) {
      errorMessage("Please select a country")
      return
    }
    if (!store_location_zipcode) {
      errorMessage("Please give your zip code")
      return
    }
    if (!store_name) {
      errorMessage("Please give your store name")
      return
    }
    if (!store_description) {
      errorMessage("Please give your store description")
      return
    }
    if (!openingTime || !closingTime) {
      errorMessage("Please specify opening time and closing time")
      return
    }

    let logoLink = ""
    let bannerLink = ""

    setCreatingStore(true)

    if (logoFile) {
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      logoLink = await uploadFileToS3(buffer, logoFile.name);

      if (!logoLink) {
        errorMessage("Something went wrong in uploading the logo");
        return;
      }
    }

    if (bannerFile) {
      const buffer = Buffer.from(await bannerFile.arrayBuffer());
      bannerLink = await uploadFileToS3(buffer, bannerFile.name);

      if (!bannerLink) {
        errorMessage("Something went wrong in uploading the banner");
        return;
      }
    }

    const dealerBody = {
      location_name: store_location_name,
      location_address: store_location_address,
      location_city: store_location_city,
      location_state: store_location_state,
      location_country: store_location_country,
      location_zip_code: store_location_zipcode,
      owner_id: user.userId,
      name: store_name,
      description: store_description,
      banner: bannerLink,
      logo: logoLink,
      opening_time: new Date(`1970-01-01T${openingTime}:00.000Z`),
      closing_time: new Date(`1970-01-01T${closingTime}:00.000Z`),
      closing_days: closingDays
    }

    renderInstance.post(`/dealer/store`, dealerBody, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }).then(() => {
      successMessage("Successfully created")
      fetchDealer()
    }).catch((err) => {
      if (err.response && err.response.status === 409 && err.response.data.message === "Log in user is not admin") {
        errorMessage("Log in user is not admin")
      } else if (err.response && err.response.status === 409 && err.response.data.message === "Dealer not found") {
        errorMessage("Dealer not found")
      } else if (err.response && err.response.status === 409 && err.response.data.message === "Creator details not found") {
        errorMessage("Creator details not found")
      } else if (err.response && err.response.status === 409 && err.response.data.message === "Country is not present") {
        errorMessage("Country is not present")
      } else if (err.response && err.response.status === 409 && err.response.data.message === "City is not present") {
        errorMessage("City is not present")
      } else {
        errorMessage("Error creating store")
      }
    }).finally(() => {
      setCreatingStore(false)
    })
  }

  useEffect(() => {
    if (user) {
      fetchDealer()
      fetchAllCountry()
    }
  }, [])

  useEffect(() => {
    if (store_location_country) {
      fetchAllCity()
    }
  }, [store_location_country])

  if (fetchingDealerDetails) return

  if (!user) return

  return (
    <aside className={`bg-white shadow-md transition-all duration-300 ${isExpanded ? 'w-64' : 'w-16'}`}>
      <div className="p-4 flex justify-between items-center">
        {isExpanded && <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>}
        <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="mt-6 px-2">
        {sidebarItems.map((item, index) => (
          <div key={index} className="mb-2">
            {item.label === 'Store' ?
              fetchingDealerDetails ? <CircularProgress /> : (
                <Collapsible open={showStoreList} onOpenChange={setShowStoreList}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${pathname.startsWith(item.href) ? 'bg-gray-200' : ''
                        }`}
                    >
                      <item.icon className="h-5 w-5 mr-2" />
                      {isExpanded && (
                        <>
                          {item.label}
                          <ChevronDown className="h-4 w-4 ml-auto" />
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-6 mt-2 space-y-2">
                    {isExpanded && storeList.map((store) => (
                      <Link key={store.id} href={`/dealer/store/${store.id}`}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm"
                        >
                          {store.name}
                        </Button>
                      </Link>
                    ))}
                    <Dialog>
                      <DialogTrigger asChild>
                        {
                          creatingStore ?
                            <CircularProgress />
                            :
                            <Button variant="outline" className="w-full justify-start">
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Create Store
                            </Button>
                        }
                      </DialogTrigger>
                      <DialogContent className="h-[90vh]">
                        <DialogHeader>
                          <DialogTitle>Create New Store</DialogTitle>
                          <DialogDescription>
                            Enter the details for your new store.
                          </DialogDescription>
                        </DialogHeader>
                        <div
                          className="space-y-4 max-h-[90vh] overflow-auto"
                          style={{ scrollbarWidth: "none" }}>
                          <div className="space-y-2">
                            <Label htmlFor="name">Store Name</Label>
                            <Input
                              id="name"
                              required
                              value={store_name}
                              onChange={e => { set_store_name(e.target.value) }} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              required
                              value={store_description}
                              onChange={e => { set_store_description(e.target.value) }} />
                          </div>
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
                                          {store_location_country
                                            ? country.find((country) => country.name === store_location_country) && store_location_country
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
                                                    set_store_location_country(country.name)
                                                    setPopoverOpenCountry(false)
                                                  }}
                                                >
                                                  <Check
                                                    className={cn(
                                                      "mr-2 h-4 w-4",
                                                      store_location_country === country.name ? "opacity-100" : "opacity-0"
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
                            store_location_country &&
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
                                            {store_location_city
                                              ? city.find((cityDetails) => cityDetails.name === store_location_city) && store_location_city
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
                                                      set_store_location_city(cityDetails.name)
                                                      setPopoverOpenCity(false)
                                                    }}
                                                    className={`${store_location_country !== cityDetails.country.name && "hidden"}`}
                                                  >
                                                    <Check
                                                      className={cn(
                                                        "mr-2 h-4 w-4",
                                                        store_location_city === cityDetails.name ? "opacity-100" : "opacity-0"
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
                            store_location_city &&
                            <div className="space-y-2">
                              <Label htmlFor="location-name">Location Name</Label>
                              <Input
                                id="location-name"
                                value={store_location_name}
                                onChange={e => { set_store_location_name(e.target.value) }} />
                            </div>
                          }
                          {
                            store_location_city &&
                            <div className="space-y-2">
                              <Label htmlFor="location-address">Address</Label>
                              <Input
                                id="location-address"
                                value={store_location_address}
                                onChange={e => { set_store_location_address(e.target.value) }} />
                            </div>
                          }
                          {
                            store_location_city &&
                            <div className="space-y-2">
                              <Label htmlFor="location-state">State</Label>
                              <Input
                                id="location-state"
                                value={store_location_state}
                                onChange={e => { set_store_location_state(e.target.value) }} />
                            </div>
                          }
                          {
                            store_location_city &&
                            <div className="space-y-2">
                              <Label htmlFor="location-zip-code">ZIP Code</Label>
                              <Input
                                id="location-zip-code"
                                required
                                value={store_location_zipcode}
                                onChange={e => { set_store_location_zipcode(e.target.value) }} />
                            </div>
                          }
                          <div className="space-y-2">
                            <Label htmlFor="opening-time">Opening Time</Label>
                            <Input
                              id="opening-time"
                              type="time"
                              required
                              className='outline-none bg-transparent border-none w-full'
                              value={openingTime}
                              onChange={e => { setOpeningTime(e.target.value) }} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="closing-time">Closing Time</Label>
                            <Input
                              id="closing-time"
                              type="time"
                              required
                              className='outline-none bg-transparent border-none w-full'
                              value={closingTime}
                              onChange={e => { setClosingTime(e.target.value) }} />
                          </div>
                          <div className="space-y-2">
                            <Label>Closing Days</Label>
                            <div className="flex flex-wrap gap-2">
                              {daysOfWeek.map((day) => (
                                <div key={day} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`closing-day-${day.toLowerCase()}`}
                                    checked={closingDays.includes(day)}
                                    onCheckedChange={() => handleClosingDayChange(day)}
                                  />
                                  <Label htmlFor={`closing-day-${day.toLowerCase()}`}>{day}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Logo Image</Label>
                            {logoFile ? (
                              <>
                                <Image
                                  src={URL.createObjectURL(logoFile)}
                                  alt={logoFile.name}
                                  unoptimized={true}
                                  className="w-52 aspect-square rounded-md object-cover"
                                  width={200}
                                  height={200}
                                />
                                <label
                                  htmlFor="dropzone-file"
                                  className=""
                                >
                                  <p className="w-fit bg-black text-white px-5 py-2 rounded text-base">
                                    Change logo
                                  </p>
                                  <input
                                    id="dropzone-file"
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files ? e.target.files[0] : null;
                                      if (file) {
                                        setLogoFile(file);
                                      }
                                    }}
                                  />
                                </label>
                              </>
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
                                      setLogoFile(file);
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Banner Image</Label>
                            {bannerFile ? (
                              <>
                                <Image
                                  src={URL.createObjectURL(bannerFile)}
                                  alt={bannerFile.name}
                                  unoptimized={true}
                                  className="w-52 aspect-square rounded-md object-cover"
                                  width={200}
                                  height={200}
                                />
                                <label
                                  htmlFor="bannerImage"
                                  className=""
                                >
                                  <p className="w-fit bg-black text-white px-5 py-2 rounded text-base">
                                    Change banner
                                  </p>
                                  <input
                                    id="bannerImage"
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files ? e.target.files[0] : null;
                                      if (file) {
                                        setBannerFile(file);
                                      }
                                    }}
                                  />
                                </label>
                              </>
                            ) : (
                              <label
                                htmlFor="bannerImage"
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
                                  id="bannerImage"
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files ? e.target.files[0] : null;
                                    if (file) {
                                      setBannerFile(file);
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>
                          {
                            creatingStore ?
                            <CircularProgress />
                            :
                          <Button onClick={() => { handleCreateStore() }}>Create Store</Button>
                          }
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CollapsibleContent>
                </Collapsible>
              ) : item.subItems ? (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${pathname.startsWith(item.href) ? 'bg-gray-200' : ''
                        }`}
                    >
                      <item.icon className="h-5 w-5 mr-2" />
                      {isExpanded && (
                        <>
                          {item.label}
                          <ChevronDown className="h-4 w-4 ml-auto" />
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-6 mt-2 space-y-2">
                    {isExpanded && item.subItems.map((subItem, subIndex) => (
                      <Link key={subIndex} href={subItem.href}>
                        <Button
                          variant="ghost"
                          className={`w-full justify-start ${pathname === subItem.href ? 'bg-gray-200' : ''
                            }`}
                        >
                          {subItem.label}
                        </Button>
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${pathname === item.href ? 'bg-gray-200' : ''
                      }`}
                  >
                    <item.icon className="h-[20px] w-[20px] mr-2" />
                    {isExpanded && item.label}
                  </Button>
                </Link>
              )}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar