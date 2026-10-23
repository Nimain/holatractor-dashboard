"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Users,
  DollarSign,
  X,
  ChevronUp,
  ChevronDown,
  Building2,
  Phone,
  Mail,
  ArrowUpDown,
  LayoutGrid,
  Table as TableIcon,
  RotateCw,
  Eye,
  Copy,
  CheckCircle2,
  Clock,
  Ban,
  TrendingUp,
  UserCheck,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { getAuthUserId } from "@/utils/auth/clientAuth";
import { successMessage, errorMessage } from "@/utils/Toastify/Messages";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { ownerCustomerPageTranslations } from "./OwnerCustomerTranslations";
import Pagination from "@/utils/Paginations/Pagination";
import { EmptyState } from "@/utils/EmptyStates";

export interface Customer {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  totalSpent: number;
  lastStoreName?: string;
  totalBookings?: number;
  active?: boolean;
  avatar?: string;
}

interface UserCookie {
  userId?: string;
  image?: string;
  name?: string;
  email?: string;
}

const OwnerCustomer = () => {
  const [fetchingPageDetails, setFetchingPageDetails] = useState(false);

  // Stats
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeCustomers, setActiveCustomers] = useState(0);
  const [rejectedCustomers, setRejectedCustomers] = useState(0);
  const [pendingCustomers, setPendingCustomers] = useState(0);
  const [totalReceived, setTotalReceived] = useState(0);

  // Search & Filter & Sort
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("name");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterStore, setFilterStore] = useState("all");

  // Layout View: Table or Grid Cards
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Selected Customer for Sheet
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const { cookie } = useCookie();
  const rawUser = cookie.get("user");
  const parsedUser =
    typeof rawUser === "string"
      ? (() => {
          try {
            return JSON.parse(rawUser);
          } catch {
            return null;
          }
        })()
      : rawUser;
  const user: UserCookie = parsedUser || {};
  const currentUserId = user?.userId || getAuthUserId();

  const fetchPageDetails = () => {
    setFetchingPageDetails(true);
    const targetId = currentUserId || getAuthUserId();
    const endpoint = targetId
      ? `/owner/get-owner-customer-page-details/${targetId}?searchBy=${searchBy}&search=${encodeURIComponent(
          searchTerm
        )}&sortBy=${sortBy}&sortOrder=${sortOrder}&page=${page}`
      : `/owner/get-owner-customer-page-details?searchBy=${searchBy}&search=${encodeURIComponent(
          searchTerm
        )}&sortBy=${sortBy}&sortOrder=${sortOrder}&page=${page}`;

    renderInstance
      .get(endpoint)
      .then((res) => {
        if (res.data) {
          setCustomers(res.data.customers || []);
          setActiveCustomers(
            Array.isArray(res.data.activeCustomers)
              ? res.data.activeCustomers.length
              : res.data.totalActiveCount || res.data.activeCustomers || 0
          );
          setRejectedCustomers(res.data.rejectedCustomers || 0);
          setPendingCustomers(res.data.pendingCustomers || 0);
          setTotalReceived(res.data.totalReceived || 0);
        }
      })
      .catch((err) => {
        console.error("Error fetching customer page details:", err);
      })
      .finally(() => {
        setFetchingPageDetails(false);
      });
  };

  useEffect(() => {
    fetchPageDetails();
  }, [searchBy, searchTerm, sortBy, sortOrder]);

  // Unique stores for filtering
  const availableStores = useMemo(() => {
    const storeSet = new Set<string>();
    customers.forEach((c) => {
      if (c.lastStoreName) storeSet.add(c.lastStoreName);
    });
    return Array.from(storeSet);
  }, [customers]);

  // Filtered & Paginated list
  const filteredCustomers = useMemo(() => {
    let result = [...customers];
    if (filterStore !== "all") {
      result = result.filter((c) => c.lastStoreName === filterStore);
    }
    return result;
  }, [customers, filterStore]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const displayedCustomers = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredCustomers.slice(startIndex, startIndex + pageSize);
  }, [filteredCustomers, page, pageSize]);

  const handleCopy = (text: string, label: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      successMessage(`${label} copied to clipboard!`);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "CU";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-5">
        <div className="space-y-1.5">
          <Breadcrumb className="mb-2">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/owner">
                  <TranslatedText greetings={ownerCustomerPageTranslations.dashboard} />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-red-600">
                  <TranslatedText greetings={ownerCustomerPageTranslations.customer} />
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-8 h-8 text-[#8c0000]" />
            <TranslatedText greetings={ownerCustomerPageTranslations.customer} /> Directory
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your farmer clients, view booking expenditures, and track active business relationships.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPageDetails}
            disabled={fetchingPageDetails}
            className="flex items-center gap-2 shadow-sm border-gray-200 dark:border-zinc-800"
          >
            <RotateCw className={cn("w-4 h-4 text-muted-foreground", fetchingPageDetails && "animate-spin")} />
            <span>Refresh</span>
          </Button>
          <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border/50">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2.5"
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2.5"
              onClick={() => setViewMode("grid")}
              title="Grid Cards View"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics & Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Revenue Accepted */}
        <Card className="border shadow-sm bg-gradient-to-br from-[#8c0000] to-[#590000] text-white relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-white/90">
              <TranslatedText greetings={ownerCustomerPageTranslations.totalEstimate} />
            </CardTitle>
            <div className="p-2 rounded-xl bg-white/15 text-white backdrop-blur-md">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ${totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-white/80 mt-1.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-300" />
              <TranslatedText greetings={ownerCustomerPageTranslations.accepted} /> Payments
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total Customers & Active */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <TranslatedText greetings={ownerCustomerPageTranslations.totalCustomers} />
            </CardTitle>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {customers.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300">
                {activeCustomers} <TranslatedText greetings={ownerCustomerPageTranslations.activeCustomers} />
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Pending Estimates */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <TranslatedText greetings={ownerCustomerPageTranslations.pending} /> Volume
            </CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
              ${pendingCustomers.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Cancelled / Rejected */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <TranslatedText greetings={ownerCustomerPageTranslations.cancelled} />
            </CardTitle>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
              <Ban className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
              ${rejectedCustomers.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1 text-red-500">
              Declined requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="p-4 border shadow-sm bg-card/60 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-2.5 items-center">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                className="pl-9 pr-8 h-9 text-sm rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Store Filter */}
            {availableStores.length > 0 && (
              <Select value={filterStore} onValueChange={setFilterStore}>
                <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs">
                  <Building2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="All Stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {availableStores.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground hidden lg:inline-block">
              <TranslatedText greetings={ownerCustomerPageTranslations.sortBy} />:
            </span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px] h-9 text-xs">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Customer Name</SelectItem>
                <SelectItem value="spent">Total Spent</SelectItem>
                <SelectItem value="store">Store Location</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2.5"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              title={`Order: ${sortOrder.toUpperCase()}`}
            >
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs ml-1 uppercase">{sortOrder}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content Area: Table or Grid */}
      {fetchingPageDetails ? (
        <CustomerTableSkeleton />
      ) : displayedCustomers.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <EmptyState
            heading="No Customers Found"
            heading2={
              searchTerm || filterStore !== "all"
                ? "No client records match your search criteria. Try adjusting your filters."
                : "It looks like there are no customers associated with your stores yet."
            }
          />
        </Card>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="border rounded-xl shadow-sm bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50 border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[280px] font-semibold text-xs uppercase tracking-wider">
                  <TranslatedText greetings={ownerCustomerPageTranslations.profile} />
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">
                  <TranslatedText greetings={ownerCustomerPageTranslations.contact} />
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">
                  <TranslatedText greetings={ownerCustomerPageTranslations.store} />
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">
                  <TranslatedText greetings={ownerCustomerPageTranslations.estimateValue} />
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedCustomers.map((customer) => {
                return (
                  <TableRow
                    key={customer.id}
                    className="hover:bg-muted/40 transition-colors group cursor-pointer"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setIsDetailSheetOpen(true);
                    }}
                  >
                    {/* Customer Profile Column */}
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border shadow-xs">
                          <AvatarImage src={customer.avatar || ""} alt={customer.name} />
                          <AvatarFallback className="bg-[#8c0000]/10 text-[#8c0000] font-bold text-xs">
                            {getInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm text-foreground group-hover:text-[#8c0000] transition-colors">
                            {customer.name}
                          </p>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            ID: #{customer.id.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact Info Column */}
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground/70" />
                          <span className="truncate max-w-[200px]">{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground/70" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Store Column */}
                    <TableCell className="py-4">
                      <Badge variant="outline" className="bg-muted/40 font-normal text-xs flex items-center gap-1 w-fit">
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                        <span>{customer.lastStoreName || "Primary Store"}</span>
                      </Badge>
                    </TableCell>

                    {/* Lifetime Spend Column */}
                    <TableCell className="py-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-sm text-foreground">
                          ${customer.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {customer.totalBookings != null && customer.totalBookings > 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            {customer.totalBookings} {customer.totalBookings === 1 ? "booking" : "bookings"}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions Column */}
                    <TableCell className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs font-medium text-[#8c0000] hover:text-[#8c0000] hover:bg-[#8c0000]/10"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setIsDetailSheetOpen(true);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {displayedCustomers.map((customer) => (
            <Card
              key={customer.id}
              className="border shadow-xs hover:shadow-md transition-all duration-200 hover:border-[#8c0000]/40 flex flex-col justify-between overflow-hidden bg-card"
            >
              <div className="h-2 bg-gradient-to-r from-[#8c0000] to-[#4d0000]" />
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3.5">
                  <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                    <AvatarImage src={customer.avatar || ""} alt={customer.name} />
                    <AvatarFallback className="bg-[#8c0000]/10 text-[#8c0000] font-bold text-sm">
                      {getInitials(customer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-foreground truncate">{customer.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                    <Badge variant="secondary" className="mt-1.5 text-[10px] px-1.5 py-0 font-normal">
                      #{customer.id.slice(-6)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-3 text-xs text-muted-foreground">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground/70" />
                      Store:
                    </span>
                    <span className="font-medium text-foreground truncate max-w-[130px]">
                      {customer.lastStoreName || "Central Store"}
                    </span>
                  </div>

                  {customer.phone && (
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground/70" />
                        Phone:
                      </span>
                      <span className="font-mono text-foreground">{customer.phone}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1 border-t border-dashed">
                    <span className="font-medium">Total Spent:</span>
                    <span className="font-extrabold text-sm text-[#8c0000] dark:text-red-400">
                      ${customer.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>

              <div className="p-4 pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-medium hover:bg-[#8c0000]/10 hover:text-[#8c0000] hover:border-[#8c0000]/30"
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setIsDetailSheetOpen(true);
                  }}
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  View Client Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !fetchingPageDetails && (
        <div className="flex justify-center pt-4">
          <Pagination
            totalPages={totalPages}
            currentPage={page}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* Customer Details Side Sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selectedCustomer && (
            <div className="space-y-6 py-2">
              <SheetHeader>
                <div className="flex items-center gap-3.5">
                  <Avatar className="h-14 w-14 border-2 border-[#8c0000]/20 shadow-sm">
                    <AvatarImage src={selectedCustomer.avatar || ""} alt={selectedCustomer.name} />
                    <AvatarFallback className="bg-[#8c0000] text-white font-extrabold text-lg">
                      {getInitials(selectedCustomer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-xl font-bold">{selectedCustomer.name}</SheetTitle>
                    <SheetDescription className="text-xs">
                      Customer ID: #{selectedCustomer.id}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              {/* Total Revenue Highlight */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#8c0000] to-[#590000] text-white space-y-1">
                <p className="text-xs text-white/80 font-medium uppercase tracking-wider">
                  Total Lifetime Business
                </p>
                <div className="text-3xl font-extrabold">
                  ${selectedCustomer.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-white/70">
                  {selectedCustomer.totalBookings || 0} completed bookings recorded
                </p>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Contact Information
                </h4>
                <div className="space-y-2 rounded-lg border p-3.5 bg-muted/20 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4 text-[#8c0000]" />
                      <span className="text-xs text-foreground font-medium">{selectedCustomer.email}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleCopy(selectedCustomer.email, "Email")}
                      title="Copy Email"
                    >
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>

                  {selectedCustomer.phone && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-foreground font-mono">{selectedCustomer.phone}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleCopy(selectedCustomer.phone || "", "Phone number")}
                        title="Copy Phone"
                      >
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Associated Store */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Store Association
                </h4>
                <div className="flex items-center gap-3 p-3.5 rounded-lg border bg-muted/20">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedCustomer.lastStoreName || "Central Agricultural Store"}
                    </p>
                    <p className="text-xs text-muted-foreground">Primary Booking Depot</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2 pt-4">
                <Button
                  className="w-full bg-[#8c0000] hover:bg-[#700000] text-white flex items-center justify-center gap-2"
                  onClick={() => {
                    window.location.href = `mailto:${selectedCustomer.email}`;
                  }}
                >
                  <Mail className="w-4 h-4" />
                  Send Email to Client
                </Button>
                {selectedCustomer.phone && (
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      window.location.href = `tel:${selectedCustomer.phone}`;
                    }}
                  >
                    <Phone className="w-4 h-4" />
                    Call Client ({selectedCustomer.phone})
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default OwnerCustomer;

function CustomerTableSkeleton() {
  return (
    <div className="border rounded-xl p-4 space-y-4 bg-card shadow-xs animate-pulse">
      <div className="h-10 bg-muted rounded-md w-full" />
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between gap-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="space-y-1.5">
              <div className="w-32 h-3.5 bg-muted rounded" />
              <div className="w-20 h-2.5 bg-muted rounded" />
            </div>
          </div>
          <div className="w-40 h-3 bg-muted rounded hidden sm:block" />
          <div className="w-24 h-3 bg-muted rounded hidden md:block" />
          <div className="w-16 h-4 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}
