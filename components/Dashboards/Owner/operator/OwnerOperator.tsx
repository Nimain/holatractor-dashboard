"use client";

import { useEffect, useState } from "react";
import {
  Search,
  ChevronDown,
  Plus,
  LayoutGrid,
  Building2,
  Users,
  DollarSign,
  ChevronUp,
  X,
  FilterIcon,
} from "lucide-react";
import { RiArrowUpDownLine } from "react-icons/ri";
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Mail, MapPin, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import {
  BookingHours,
  OperatorAddStoreReuests,
  OperatorInStore,
} from "@/utils/Types/types";
import { useCookie } from "next-cookie";
import { NestJsBaseURL, renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import RequestNewOperator from "./RequestNewOperator";
import OperatorRequests from "./OperatorRequests";
import { io, Socket } from "socket.io-client";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { ownerOperatorTranslations } from "./OwnerOperatorTranslation";
import { EmptyState } from "@/utils/EmptyStates";
import { newBookingTranslations } from "../../Farmer/FarmerTranslation";
import { useOperatorsRequestToJoinStoreContext } from "@/components/wrappers/OperatorsRequestToJoinStoreProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Pagination from "@/utils/Paginations/Pagination";

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

const OwnerOperator = () => {
  const [allOperators, setAllOperators] = useState<OperatorInStore[]>([]);
  const [activeOperators, setActiveOperators] = useState(0);
  const [fetchingOperatorDetails, setFetchingOperatorDetails] = useState(false);

  const [sortBy, setSortBy] = useState("first_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [searchBy, setSearchBy] = useState("first_name");
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [hoveredItem, setHoveredItem] = useState(-1);

  const { operatorRequests, setOperatorRequests, fetchAllOperatorRequests } =
    useOperatorsRequestToJoinStoreContext();

  const { cookie } = useCookie();
  const user: user = cookie.get("user");

  const sortOptions = [
    {
      label: "First Name",
      value: "first_name",
    },
    {
      label: "Last Name",
      value: "last_name",
    },
    {
      label: "Store",
      value: "store",
    },
    {
      label: "Per hour",
      value: "per_hour",
    },
    {
      label: "Per job",
      value: "per_job",
    },
    {
      label: "Per month",
      value: "per_month",
    },
  ];

  const searchOptions = [
    {
      label: "First Name",
      value: "first_name",
    },
    {
      label: "Last Name",
      value: "last_name",
    },
    {
      label: "Store",
      value: "store",
    },
  ];

  const handleClear = () => {
    setSearchTerm("");
  };

  function fetchOperators() {
    setFetchingOperatorDetails(true);

    renderInstance
      .get(
        `/owner/get-operators/${user.userId}?searchBy=${searchBy}&search=${searchTerm}&sortBy=${sortBy}&sortOrder=${sortOrder}&page=${page}`
      )
      .then((res) => {
        setAllOperators(res.data.operators);
        setActiveOperators(res.data.activeOperators);
        setTotalPages(res.data.totalPages);
      })
      .catch((err) => {
        errorMessage("Error fetching operator lists");
      })
      .finally(() => {
        setFetchingOperatorDetails(false);
      });
  }

  useEffect(() => {
    if (user) {
      fetchOperators();
    }
  }, [searchBy, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    if (user) {
      fetchAllOperatorRequests();
    }
  }, []);

  useEffect(() => {
    // Connect to the socket server
    const newSocket: Socket = io(NestJsBaseURL, {
      query: {
        userId: user.userId,
      },
    });

    // Listen for the 'newFarmerNotification' event
    newSocket.on(
      "acceptedOperatorRequest",
      (request: OperatorAddStoreReuests) => {
        setOperatorRequests((prevRequests) =>
          prevRequests.filter((req) => req.id !== request.id)
        );
      }
    );

    // Clean up the event listener when the component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pt-4">
        {/* <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/owner"><TranslatedText greetings={ownerOperatorTranslations.dashboard} /></BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/owner/operator"><TranslatedText greetings={ownerOperatorTranslations.operators} /></BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb> */}

        <div className="text-red-700 font-bold text-2xl mx-5">Operators</div>
        <div className="flex items-center  gap-3">
          {operatorRequests.length > 0 && (
            <OperatorRequests
              requests={operatorRequests}
              fetchOperatorTableList={fetchOperators}
            />
          )}
          <div className="">
            {" "}
            <RequestNewOperator />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 900px:grid-cols-2 1300px:grid-cols-4 gap-4 mb-8">
        {/* Total Estimate Card */}
        {/* <div className="grid-cols-1 900px:col-span-2 bg-white rounded-lg border shadow-sm p-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-gray-600 text-sm font-medium">Total Spend</h3>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 500px:grid-cols-2 768px:grid-cols-3 900px:flex gap-5 mt-4">
                        <div className="col-span-1 900px:flex-1">
                            <div className="text-3xl font-semibold mb-1">$ 32.1k</div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-green-500 text-sm">Accepted</span>
                            </div>
                        </div>

                        <div className="w-px bg-gray-200 mx-4 hidden 900px:inline-block"></div>

                        <div className="col-span-1 900px:flex-1">
                            <div className="text-3xl font-semibold mb-1 text-left 500px:text-right 768px:text-left">$ 16.23k</div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-orange-400 ml-0 500px:ml-auto 768px:ml-0"></div>
                                <span className="text-orange-400 text-sm">Pending</span>
                            </div>
                        </div>

                        <div className="w-px bg-gray-200 mx-4 hidden 900px:inline-block"></div>

                        <div className="col-span-1 900px:flex-1">
                            <div className="text-3xl font-semibold mb-1">$ 2.58k</div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span className="text-red-500 text-sm">Reject</span>
                            </div>
                        </div>

                        <div className="items-center mt-4 col-span-1 768px:col-span-3">
                            <p className="text-gray-500 text-sm justify-center text-right">
                                {currentTime}
                            </p>
                            <p className="text-gray-500 text-sm mt-1 text-right">
                                {currentDate}
                            </p>
                        </div>
                    </div>
                </div> */}

        {/* Total Operators Card */}
        <div className="col-span-1 bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white rounded-lg border shadow-sm p-6">
          <div className="flex justify-between items-center">
            <h3 className=" text-sm font-medium">
              <TranslatedText
                greetings={ownerOperatorTranslations.activeOperators}
              />
            </h3>{" "}
            {/* Changed "Customers" to "Operators" */}
            <Button variant="ghost" size="sm" className="h-8  w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 flex justify-between mb-0">
            <div className="text-4xl font-semibold">{activeOperators}</div>
            <div className="flex items-center gap-1 mt-2">
              <span className=" text-sm">↑ 15%</span>
            </div>
          </div>
        </div>

        {/* Total Member Card */}
        <div className="col-span-1 bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white rounded-lg border shadow-sm p-6">
          <div className="flex justify-between items-center">
            <h3 className=" text-sm font-medium">
              <TranslatedText
                greetings={ownerOperatorTranslations.totalOperators}
              />
            </h3>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex justify-between mt-4 ">
            <div className="text-4xl font-semibold">{allOperators.length}</div>
            {/* <div className="flex -space-x-2 mt-4">
                            {allOperators.map((index, i) => {
                                if (i > 5) return null
                                return (
                                    <Image
                                        key={i}
                                        src={index.operator.user.image ? index.operator.user.image : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH87TKQrWcl19xly2VNs0CjBzy8eaKNM-ZpA&s'}
                                        alt={`Member ${index.operator.user.first_name}`}
                                        className="w-8 h-8 rounded-full border-2 border-white"
                                        width={400}
                                        height={400}
                                    />
                                )
                            })}
                        </div> */}
            <div className="flex items-center gap-1 mt-2">
              <span className=" text-sm">↑ 15%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      {/* <div className="flex justify-between items-start 1000px:items-center flex-col 1000px:flex-row gap-4 mb-4">
        <div className="flex gap-2 items-center">
          <Select value={searchBy} onValueChange={setSearchBy}>
            <SelectTrigger className="w-[200px] bg-transparent">
              <SelectValue placeholder={"Search by"} />
            </SelectTrigger>
            <SelectContent>
              {searchOptions.map((sortValue, index) => {
                return (
                  <SelectItem value={sortValue.value} key={index}>
                    {sortValue.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              type={
                searchBy === "per_hour" ||
                searchBy === "per_job" ||
                searchBy === "per_month"
                  ? "number"
                  : "text"
              }
              placeholder="Search"
              className="pl-10 py-2 border rounded-lg w-80 pr-16"
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              value={searchTerm}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                onClick={handleClear}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ml-16"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px] bg-transparent">
              <SelectValue placeholder={"Sort by"} />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((sortValue, index) => {
                return (
                  <SelectItem value={sortValue.value} key={index}>
                    {sortValue.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            }}
            className="bg-transparent hover:bg-transparent"
          >
            {sortOrder === "asc" ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div> */}

      {/* Customer Table */}
      <div className="border rounded-lg w-full">
        <Table className="w-full bg-gradient-to-r from-[#8c0000] to-[#4d0000] hover:bg-transparent text-white rounded-xl overflow-hidden mb-2">
          <TableHeader className="bg-gradient-to-r from-[#8c0000] to-[#4d0000] hover:bg-transparent">
            <TableRow>
              <TableCell colSpan={100}>
                <div className="flex bg-transparent flex-col 1000px:flex-row justify-between items-center px-4 py-4 gap-4 bg-gradient-to-r from-[#8c0000] to-[#4d0000] rounded-t-xl text-white">
                  <h2 className="text-xl font-bold">Operator List</h2>

                  <div className="flex justify-center items-center">
                    <div className="relative w-full max-w-sm">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-white/60" />
                      <Input
                        type={
                          searchBy === "per_hour" ||
                          searchBy === "per_job" ||
                          searchBy === "per_month"
                            ? "number"
                            : "text"
                        }
                        placeholder="Search customers..."
                        className="pl-10 py-2 pr-16 w-full rounded-lg border-none bg-white/10 text-white placeholder:text-white/60"
                        onChange={(e) => setSearchTerm(e.target.value)}
                        value={searchTerm}
                      />
                    </div>
                    <span>
                      <button className="bg-white text-red-500 p-1 rounded-md">
                        <FilterIcon />
                      </button>
                    </span>
                  </div>
                </div>
              </TableCell>
            </TableRow>

            <TableRow>
              {/* <TableHead className="w-8 p-4">
                <Input
                  type="checkbox"
                  className="rounded w-4 h-4 accent-primaryColor"
                />
              </TableHead> */}
              <TableHead className="text-left font-bold text-lg">
                <div className="flex text-white items-center gap-2">
                  <TranslatedText
                    greetings={ownerOperatorTranslations.profile}
                  />
                  <div className="hover:bg-gray-200 p-1 aspect-square rounded-full">
                    <RiArrowUpDownLine className="h-4 w-4" />
                  </div>
                </div>
              </TableHead>
              <TableHead className="text-left font-bold text-lg">
                <div className="flex text-white items-center gap-2">
                  <TranslatedText
                    greetings={ownerOperatorTranslations.contact}
                  />
                  <div className="hover:bg-gray-200 p-1 aspect-square rounded-full">
                    <RiArrowUpDownLine className="h-4 w-4" />
                  </div>
                </div>
              </TableHead>
              <TableHead className="text-left font-bold text-lg">
                <div className="flex text-white items-center gap-2">
                  <TranslatedText greetings={ownerOperatorTranslations.store} />
                  <div className="hover:bg-gray-200 p-1 aspect-square rounded-full">
                    <RiArrowUpDownLine className="h-4 w-4" />
                  </div>
                </div>
              </TableHead>
              <TableHead className="text-left font-bold text-lg">
                <div className="flex text-white items-center gap-2">
                  <TranslatedText
                    greetings={ownerOperatorTranslations.perHour}
                  />
                  <div className="hover:bg-gray-200 p-1 aspect-square rounded-full">
                    <RiArrowUpDownLine className="h-4 w-4" />
                  </div>
                </div>
              </TableHead>
              <TableHead className="text-left font-bold text-lg">
                <div className="flex text-white items-center gap-2">
                  <TranslatedText
                    greetings={ownerOperatorTranslations.perMonth}
                  />
                  <div className="hover:bg-gray-200 p-1 aspect-square rounded-full">
                    <RiArrowUpDownLine className="h-4 w-4" />
                  </div>
                </div>
              </TableHead>
              <TableHead className="text-left font-bold text-lg">
                <div className="flex text-white items-center gap-2">
                  <TranslatedText
                    greetings={ownerOperatorTranslations.perJob}
                  />
                  <div className="hover:bg-gray-200 p-1 aspect-square rounded-full">
                    <RiArrowUpDownLine className="h-4 w-4" />
                  </div>
                </div>
              </TableHead>
              <TableHead className="text-left font-bold text-lg">
                <div className="flex text-white items-center gap-2">
                  <TranslatedText
                    greetings={ownerOperatorTranslations.status}
                  />
                  <div className="hover:bg-gray-200 p-1 aspect-square rounded-full">
                    <RiArrowUpDownLine className="h-4 w-4" />
                  </div>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetchingOperatorDetails ? (
              <OperatorTableShrimmer />
            ) : allOperators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState
                    heading="No Operators Found"
                    heading2="It looks like there are no operators available. Add a new operator to get started."
                  />
                </TableCell>
              </TableRow>
            ) : (
              allOperators.map((customer, i) => {
                const name = `${customer.operator.user.first_name} ${
                  customer.operator.user.middle_name ?? ""
                } ${customer.operator.user.last_name}`;
                const email = customer.operator.user.email;
                return (
                  <Dialog key={i}>
                    <DialogTrigger asChild>
                      <TableRow
                        className="border-t"
                        onMouseEnter={() => {
                          setHoveredItem(i);
                        }}
                        onMouseLeave={() => {
                          setHoveredItem(-1);
                        }}
                      >
                        {/* <TableCell className="p-4">
                          <Input
                            type="checkbox"
                            className="rounded w-4 h-4 accent-primaryColor"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          />
                        </TableCell> */}
                        <TableCell className="p-4">
                          <div className="flex items-center gap-3">
                            <Image
                              src={
                                customer.operator.user.image
                                  ? customer.operator.user.image
                                  : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH87TKQrWcl19xly2VNs0CjBzy8eaKNM-ZpA&s"
                              }
                              alt={customer.operator.user.first_name}
                              className="w-10 h-10 rounded-full"
                              width={400}
                              height={400}
                            />
                            <div>
                              <p className="font-medium">
                                {hoveredItem === i
                                  ? name
                                  : name.slice(0, 4) + "..."}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-4">
                          <p className="text-sm">
                            {hoveredItem === i
                              ? email
                              : email.slice(0, 4) + "..."}
                          </p>
                        </TableCell>
                        <TableCell className="p-4">
                          {/* <span className={`px-3 py-1 rounded-full text-sm
                                    ${customer.status === 'Accepted' ? 'bg-green-100 text-green-800' : ''}
                                    ${customer.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                    ${customer.status === 'Canceled' ? 'bg-red-100 text-red-800' : ''}
                                  `}>
                                                    {customer.status}
                                                </span> */}
                          <span>
                            {hoveredItem === i
                              ? customer.store.name
                              : customer.store.name.slice(0, 4) + "..."}
                          </span>
                        </TableCell>
                        <TableCell className="p-4">
                          <p className="font-medium">
                            ${`${customer.cost_per_hour ?? "NA"}`}
                          </p>
                        </TableCell>
                        <TableCell className="p-4">
                          <p className="font-medium">
                            ${`${customer.cost_per_month ?? "NA"}`}
                          </p>
                        </TableCell>
                        <TableCell className="p-4">
                          <p className="font-medium">
                            ${`${customer.cost_per_job ?? "NA"}`}
                          </p>
                        </TableCell>
                        <TableCell className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              customer.operator.Status === 1
                                ? "bg-green-600 text-white"
                                : "bg-orange-500 text-white"
                            }`}
                          >
                            {customer.operator.Status === 1
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </TableCell>
                      </TableRow>
                    </DialogTrigger>
                    <DialogContent
                      className="max-w-7xl max-h-[80vh] p-0 overflow-auto"
                      style={{ scrollbarWidth: "none" }}
                    >
                      {/* Tabs - Fixed */}
                      <div className="flex h-12 border-b">
                        <Tabs defaultValue="overview" className="flex-1">
                          <TabsList className="h-full bg-transparent gap-4">
                            <TabsTrigger
                              value="overview"
                              className="data-[state=active]:border-b-2 data-[state=active]:border-red-500 rounded-none"
                            >
                              <TranslatedText
                                greetings={ownerOperatorTranslations.overview}
                              />
                            </TabsTrigger>
                            <TabsTrigger
                              value="performance"
                              className="data-[state=active]:border-b-2 data-[state=active]:border-red-500 rounded-none"
                            >
                              <TranslatedText
                                greetings={
                                  ownerOperatorTranslations.performance
                                }
                              />
                            </TabsTrigger>
                            <TabsTrigger
                              value="files"
                              className="data-[state=active]:border-b-2 data-[state=active]:border-red-500 rounded-none"
                            >
                              <TranslatedText
                                greetings={ownerOperatorTranslations.rating}
                              />
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>

                      {/* Content Container - Scrollable */}
                      <div className="flex h-[calc(100vh-10vh-48px-48px)]">
                        {/* Left Sidebar - Fixed height with independent scroll */}
                        <div className="w-72 border-r overflow-y-auto">
                          <div className="p-6">
                            <div className="flex items-start gap-4 mb-8">
                              <Avatar className="h-16 w-16">
                                {customer.operator.user.image ? (
                                  <AvatarImage
                                    src={customer.operator.user.image}
                                    alt={customer.operator.user.first_name}
                                  />
                                ) : (
                                  <AvatarFallback>
                                    {customer.operator.user.first_name[0]}
                                    {customer.operator.user.last_name[0]}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div>
                                <h2 className="text-lg font-semibold">
                                  {`${customer.operator.user.first_name} ${
                                    customer.operator.user.middle_name ?? ""
                                  } ${customer.operator.user.last_name}`}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                  #{customer.operator_id}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-8">
                              <section>
                                <h3 className="text-sm font-semibold mb-4">
                                  <TranslatedText
                                    greetings={ownerOperatorTranslations.about}
                                  />
                                </h3>
                                <div className="space-y-3">
                                  {customer.operator.user.country_code &&
                                    customer.operator.user.mobile && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">
                                          {customer.operator.user.country_code}{" "}
                                          {customer.operator.user.mobile}
                                        </span>
                                      </div>
                                    )}
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      {customer.operator.user.email}
                                    </span>
                                  </div>
                                </div>
                              </section>

                              <section>
                                <h3 className="text-sm font-semibold mb-4">
                                  <TranslatedText
                                    greetings={
                                      ownerOperatorTranslations.employeeDetails
                                    }
                                  />
                                </h3>
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    {/* <span className="text-sm">Joined {customer.createdAt.toLocaleDateString()}</span> */}
                                  </div>
                                </div>
                              </section>
                            </div>
                          </div>
                        </div>

                        {/* Main Content - Fixed height with independent scroll */}
                        <div className="flex-1 overflow-y-auto">
                          <div className="p-6 space-y-6">
                            {/* Job Information */}
                            <div className="bg-white rounded-lg border">
                              <div className="flex justify-between items-center p-4 border-b">
                                <h3 className="font-semibold">
                                  <TranslatedText
                                    greetings={
                                      ownerOperatorTranslations.jobInformation
                                    }
                                  />
                                </h3>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600"
                                >
                                  +{" "}
                                  <TranslatedText
                                    greetings={
                                      ownerOperatorTranslations.addInfo
                                    }
                                  />
                                </Button>
                              </div>
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b bg-gray-50">
                                    <th className="text-left p-4 text-xs font-medium text-gray-500">
                                      <TranslatedText
                                        greetings={
                                          ownerOperatorTranslations.startDate
                                        }
                                      />
                                    </th>
                                    <th className="text-left p-4 text-xs font-medium text-gray-500">
                                      <TranslatedText
                                        greetings={
                                          ownerOperatorTranslations.duration
                                        }
                                      />
                                    </th>
                                    <th className="text-left p-4 text-xs font-medium text-gray-500">
                                      <TranslatedText
                                        greetings={
                                          ownerOperatorTranslations.endDate
                                        }
                                      />
                                    </th>
                                    <th className="text-left p-4 text-xs font-medium text-gray-500">
                                      <TranslatedText
                                        greetings={
                                          ownerOperatorTranslations.totalCost
                                        }
                                      />
                                    </th>
                                    <th className="text-left p-4 text-xs font-medium text-gray-500">
                                      <TranslatedText
                                        greetings={
                                          ownerOperatorTranslations.status
                                        }
                                      />
                                    </th>
                                    <th className="w-16"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {customer.operator.OperatorBookingJob.map(
                                    (job, index) => (
                                      <tr
                                        key={index}
                                        className="border-b last:border-0"
                                      >
                                        <td className="p-4 text-sm">
                                          {new Date(
                                            job.booking.start_date
                                          ).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-sm">
                                          {job.booking.booking_hours ? (
                                            job.booking.booking_hours ===
                                            BookingHours.EIGHT_HOURS ? (
                                              <TranslatedText
                                                greetings={
                                                  newBookingTranslations.hours[
                                                    "8h"
                                                  ]
                                                }
                                              />
                                            ) : job.booking.booking_hours ===
                                              BookingHours.SEVEN_HOURS ? (
                                              <TranslatedText
                                                greetings={
                                                  newBookingTranslations.hours[
                                                    "7h"
                                                  ]
                                                }
                                              />
                                            ) : job.booking.booking_hours ===
                                              BookingHours.SIX_HOURS ? (
                                              <TranslatedText
                                                greetings={
                                                  newBookingTranslations.hours[
                                                    "6h"
                                                  ]
                                                }
                                              />
                                            ) : job.booking.booking_hours ===
                                              BookingHours.FIVE_HOURS ? (
                                              <TranslatedText
                                                greetings={
                                                  newBookingTranslations.hours[
                                                    "5h"
                                                  ]
                                                }
                                              />
                                            ) : job.booking.booking_hours ===
                                              BookingHours.FOUR_HOURS ? (
                                              <TranslatedText
                                                greetings={
                                                  newBookingTranslations.hours[
                                                    "4h"
                                                  ]
                                                }
                                              />
                                            ) : job.booking.booking_hours ===
                                              BookingHours.THREE_HOURS ? (
                                              <TranslatedText
                                                greetings={
                                                  newBookingTranslations.hours[
                                                    "3h"
                                                  ]
                                                }
                                              />
                                            ) : job.booking.booking_hours ===
                                              BookingHours.TWO_HOURS ? (
                                              <TranslatedText
                                                greetings={
                                                  newBookingTranslations.hours[
                                                    "2h"
                                                  ]
                                                }
                                              />
                                            ) : (
                                              <TranslatedText
                                                greetings={
                                                  newBookingTranslations.hours[
                                                    "1h"
                                                  ]
                                                }
                                              />
                                            )
                                          ) : (
                                            <TranslatedText
                                              greetings={
                                                ownerOperatorTranslations.moreThanEightHours
                                              }
                                            />
                                          )}
                                        </td>
                                        <td className="p-4 text-sm">
                                          {job.booking.end_date
                                            ? new Date(
                                                job.booking.end_date
                                              ).toLocaleDateString()
                                            : new Date().toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-sm">
                                          {job.booking.total_cost.toFixed(2)}
                                        </td>
                                        <td className="p-4 text-sm">
                                          {job.booking.bookingStatus}
                                        </td>
                                      </tr>
                                    )
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* Activity and Compensation Grid */}
                            {/* <div className="grid grid-cols-2 gap-6">
                                                                
                                                                <div className="bg-white rounded-lg p-6 border">
                                                                    <div className="flex justify-between items-center mb-6">
                                                                        <h3 className="font-semibold">Activity</h3>
                                                                    </div>
                                                                    <div className="space-y-4">
                                                                        {activities.map((activity, index) => (
                                                                            <div key={index} className="flex items-start gap-3">
                                                                                <Avatar className="w-8 h-8">
                                                                                    <AvatarImage src={activity.avatar} alt={activity.name} />
                                                                                    <AvatarFallback>{activity.name[0]}</AvatarFallback>
                                                                                </Avatar>
                                                                                <div>
                                                                                    <p className="text-sm">
                                                                                        <span className="font-medium">{activity.name}</span>
                                                                                        {' '}{activity.action}{' '}
                                                                                        <span className="font-medium">{activity.date}</span>
                                                                                    </p>
                                                                                    <p className="text-sm text-gray-500">{activity.time}</p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <Button variant="link" className="mt-4 p-0 h-auto text-red-600">
                                                                        View all
                                                                    </Button>
                                                                </div>
    
                                                                
                                                                <div className="bg-white rounded-lg p-6 border">
                                                                    <div className="flex justify-between items-center mb-6">
                                                                        <h3 className="font-semibold">Compensation</h3>
                                                                    </div>
                                                                    <div className="space-y-4">
                                                                        {compensation.map((comp, index) => (
                                                                            <div key={index} className="text-sm">
                                                                                <p className="font-medium">{comp.amount}</p>
                                                                                <p className="text-gray-500">Effective date on {comp.effectiveDate}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <Button variant="link" className="mt-4 p-0 h-auto text-red-600">
                                                                        View all
                                                                    </Button>
                                                                </div>
                                                            </div> */}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && !fetchingOperatorDetails && (
          <Pagination
            totalPages={totalPages}
            currentPage={page}
            onPageChange={(e) => {
              setPage(e);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default OwnerOperator;

function OperatorTableShrimmer() {
  return Array.from({ length: 5 }).map((_, index) => (
    <tr key={index} className="animate-pulse border-b">
      <td className="p-4">
        <div className="h-4 w-4 bg-gray-300 rounded"></div>
      </td>
      <td className="p-4">
        <div className="h-4 w-32 bg-gray-300 rounded"></div>
      </td>
      <td className="p-4">
        <div className="h-4 w-32 bg-gray-300 rounded"></div>
      </td>
      <td className="p-4">
        <div className="h-4 w-24 bg-gray-300 rounded"></div>
      </td>
      <td className="p-4">
        <div className="h-4 w-16 bg-gray-300 rounded"></div>
      </td>
      <td className="p-4">
        <div className="h-4 w-16 bg-gray-300 rounded"></div>
      </td>
      <td className="p-4">
        <div className="h-4 w-16 bg-gray-300 rounded"></div>
      </td>
      <td className="p-4">
        <div className="h-4 w-16 bg-gray-300 rounded"></div>
      </td>
    </tr>
  ));
}
