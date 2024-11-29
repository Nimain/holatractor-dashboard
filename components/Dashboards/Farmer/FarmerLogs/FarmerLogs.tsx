"use client"

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronDown, Search, ArrowUpDown, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Logs } from '@/utils/Types/types';
import { useCookie } from 'next-cookie';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { logTranslations } from "../FarmerTranslation"
import TranslatedText from "@/components/Menubar/TranslatedText"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

const FarmerLogs = () => {
    const [payments, setPayments] = useState<Logs[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [fetching, setFetching] = useState(false)

    const { cookie } = useCookie()
    const user: user = cookie.get("user")
  
    // Search handler
    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
      const term = event.target.value.toLowerCase();
      setSearchTerm(term);
  
      const filteredPayments = payments.filter(payment => 
        payment.id.toLowerCase().includes(term) ||
        payment.email.toLowerCase().includes(term) ||
        payment.action.toLowerCase().includes(term) ||
        payment.details.toLowerCase().includes(term)
      );
  
      setPayments(filteredPayments);
    };

    const truncateDetails = (details: string) => {
      return details.slice(0, 15) + (details.length > 15 ? '...' : '')
    }

    const formatDate = (date: string | Date): string => {
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
  
      const dateObj = typeof date === "string" ? new Date(date) : date;
  
      return dateObj.toLocaleDateString(undefined, options);
    };

    function fetchPayments(){
      setFetching(true)
      renderInstance.get(`/farmer/logPage/${user.userId}`)
      .then((res)=>{
        setPayments(res.data)
      }).catch((err)=>{
        errorMessage("Error fetching payments")
      }).finally(()=>{
        setFetching(false)
      })
    }
  
    useEffect(()=>{
      if(user){
        fetchPayments()
      }
    },[])
  
    return (
      <div className="p-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Logs</h1>
            <p className="text-gray-500 text-sm">View and manage your farmer Logs</p>
          </div>
          <Button 
            onClick={() => {
              // Export functionality
              const headers = [
                'Id', 'Action', 'Details', 'Email', 'Time'
              ];
  
              const csvData = payments.map(payment => [
                payment.id,
                payment.action,
                payment.details,
                payment.email,
                new Date(payment.createdAt).toLocaleDateString()
              ]);
  
              const csvContent = [
                headers.join(','),
                ...csvData.map(row => row.join(','))
              ].join('\n');
  
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              const url = URL.createObjectURL(blob);
              link.setAttribute('href', url);
              link.setAttribute('download', 'payment_history.csv');
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="bg-primary text-primary-foreground"
          >
            Export <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
  
        {/* Search and Filter Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by ID, booking, method, or status"
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="ml-4">
            Filter by <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
  
        {/* Payments Table */}
        <Card className="overflow-x-auto">
        <Table>
                      <TableCaption>
                        <TranslatedText greetings={logTranslations.recentActivitiesList} />
                      </TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold">
                            <TranslatedText greetings={logTranslations.slNo} />
                          </TableHead>
                          <TableHead className="font-bold">
                            <TranslatedText greetings={logTranslations.action} />
                          </TableHead>
                          <TableHead className="font-bold">
                            <TranslatedText greetings={logTranslations.details} />
                          </TableHead>
                          <TableHead className="font-bold">
                            <TranslatedText greetings={logTranslations.time} />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.length === 0 ? <p><TranslatedText greetings={logTranslations.noLogsPresent} /></p> : payments.filter((log) => (log.userId === user.userId)).reverse().map((log, index) => (
                          <TooltipProvider
                            key={index}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <TableRow>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>{log.action}</TableCell>
                                  <TableCell>{truncateDetails(log.details)}</TableCell>
                                  <TableCell>{new Date(log.createdAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{log.details}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </TableBody>
                    </Table>
        </Card>
      </div>
    );
}

export default FarmerLogs