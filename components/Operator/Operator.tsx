"use client"

import { useEffect, useState } from 'react'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from "@mui/icons-material/Edit"
import CloseIcon from "@mui/icons-material/Close"
import { Operator, Owner } from '@/utils/Types/types';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import OperatorRegister from '../Authentication/OperatorRegister';
import Image from 'next/image';
import NullImage from "@/assets/AnimateIcons/Operator.svg"
import Link from 'next/link';
import OperatorAction from './OperatorAction';

const OperatorSection = () => {
    const [activeHover, setActiveHover] = useState('')
    const [mailHover, setMailHover] = useState(-1)
    const [loading, setLoading] = useState(false)

    const [users, setUsers] = useState<Operator[]>([])
    const [open, setOpen] = useState(false)
    const [newOperatorName, setNewOperatorName] = useState("")
    const [isSignUpCard, setIsSignUpCard] = useState(false)
    
    // Mobile edit modal state
    const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
    const [editOpen, setEditOpen] = useState(false)

    function fetchAllUsers() {
        setLoading(true)
        renderInstance.get("/operator")
            .then((res) => {
                setUsers(res.data)
            }).catch((err) => {
                errorMessage("Error fetching user list")
            }).finally(() => {
                setLoading(false)
            })
    }

    const splitFullName = (fullName: string) => {
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts.shift();
        const lastName = nameParts.pop();
        const middleName = nameParts.join(" ");

        return { firstName, middleName, lastName };
    };

    function handleNameChage(name: string) {
        setNewOperatorName(name)

        const { lastName } = splitFullName(name)

        if (lastName) setIsSignUpCard(true)
        else setIsSignUpCard(false)
    }

    useEffect(() => {
        fetchAllUsers()
    }, [])

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

    const formatDateMobile = (date: string | Date): string => {
        const options: Intl.DateTimeFormatOptions = {
            month: "short",
            day: "numeric",
        };

        const dateObj = typeof date === "string" ? new Date(date) : date;

        return dateObj.toLocaleDateString(undefined, options);
    };

    const handleMobileOperatorClick = (operator: Operator) => {
        setSelectedOperator(operator)
        setEditOpen(true)
    }

    return (
        <div className='mt-6 md:mt-10 text-base md:text-lg px-4 md:px-0'>

            <div className='mb-5 w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>

                <p className='text-lg md:text-xl lg:text-2xl font-semibold'>
                    Total operators: {users.length}
                </p>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button
                            name="Name_next_button"
                            onClick={() => {
                                setOpen(true)
                            }}
                            className="w-full sm:w-auto"
                        >
                            New operator
                        </Button>
                    </DialogTrigger>

                    <DialogContent
                        className="bg-white h-fit w-[90vw] sm:min-w-[400px] sm:max-w-[400px] overflow-auto"
                        style={{ scrollbarWidth: "none" }}
                    >

                        <Label className='mb-2 text-lg font-medium'>
                            Name
                        </Label>

                        <Input
                            value={newOperatorName}
                            onChange={e => { handleNameChage(e.target.value) }}
                            className='w-full' />

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button onClick={() => { setOpen(false) }} className="w-full sm:w-auto">
                                    Cancel
                                </Button>
                            </DialogClose>

                            {
                                isSignUpCard ?
                                    <OperatorRegister inPage={true} nameOfOperator={newOperatorName} />
                                    :
                                    <Button
                                        name="Name_next_button"
                                        onClick={() => {
                                            errorMessage("Please give your name")
                                        }}
                                        className="w-full sm:w-auto"
                                    >
                                        Next
                                    </Button>
                            }
                        </DialogFooter>

                    </DialogContent>

                </Dialog>

            </div>

            {/* Desktop Table Header - Hidden on mobile */}
            <div className='hidden lg:flex text-lg xl:text-xl font-semibold items-center justify-between gap-2 xl:gap-3 bg-[#ededed] p-4 xl:p-5 rounded cursor-pointer overflow-x-auto'>

                <div className='min-w-[80px] xl:w-[100px] flex items-center justify-between group'>
                    Id
                    <div className='flex items-center gap-1 xl:gap-1.5 opacity-0 transition-all duration-500 group-hover:opacity-100'>
                        <div className='rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <ArrowUpwardIcon className="text-lg xl:text-xl" />
                        </div>
                        <div className='rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <MoreVertIcon className="text-lg xl:text-xl" />
                        </div>
                    </div>
                </div>

                <div className='min-w-[120px] xl:w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'>
                    Name
                    <div className='flex items-center gap-1 xl:gap-1.5 opacity-0 transition-all duration-500 group-hover:opacity-100'>
                        <div className='rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <ArrowUpwardIcon className="text-lg xl:text-xl" />
                        </div>
                        <div className='rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <MoreVertIcon className="text-lg xl:text-xl" />
                        </div>
                    </div>
                </div>

                <div className='min-w-[120px] xl:w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'>
                    Email
                    <div className='flex items-center gap-1 xl:gap-1.5 opacity-0 transition-all duration-500 group-hover:opacity-100'>
                        <div className='rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <ArrowUpwardIcon className="text-lg xl:text-xl" />
                        </div>
                        <div className='rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <MoreVertIcon className="text-lg xl:text-xl" />
                        </div>
                    </div>
                </div>

                <div className='min-w-[120px] xl:w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'
                    onMouseEnter={() => { setActiveHover('Verified') }}
                    onMouseLeave={() => { setActiveHover('') }}>
                    {
                        activeHover === 'Verified' ?
                            'Veri...'
                            :
                            'Verified'
                    }
                    <div className='flex items-center gap-1 xl:gap-1.5 opacity-0 transition-all duration-500 group-hover:opacity-100'>
                        <div className='rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <ArrowUpwardIcon className="text-lg xl:text-xl" />
                        </div>
                        <div className='rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <MoreVertIcon className="text-lg xl:text-xl" />
                        </div>
                    </div>
                </div>

                <div className='min-w-[120px] xl:w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'>
                    Status
                    <div className='flex items-center gap-1 xl:gap-1.5 opacity-0 transition-all duration-500 group-hover:opacity-100'>
                        <div className='rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <ArrowUpwardIcon className="text-lg xl:text-xl" />
                        </div>
                        <div className='rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <MoreVertIcon className="text-lg xl:text-xl" />
                        </div>
                    </div>
                </div>

                <div className='min-w-[150px] xl:w-[180px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'
                    onMouseEnter={() => { setActiveHover('Joined at') }}
                    onMouseLeave={() => { setActiveHover('') }}>
                    {
                        activeHover === 'Joined at' ?
                            'Join...'
                            :
                            'Joined at'
                    }
                    <div className='flex items-center gap-1 xl:gap-1.5 opacity-0 transition-all duration-500 group-hover:opacity-100'>
                        <div className='rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <ArrowUpwardIcon className="text-lg xl:text-xl" />
                        </div>
                        <div className='rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <MoreVertIcon className="text-lg xl:text-xl" />
                        </div>
                    </div>
                </div>

                <div className='min-w-[150px] xl:w-[180px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'
                    onMouseEnter={() => { setActiveHover('Updated at') }}
                    onMouseLeave={() => { setActiveHover('') }}>
                    {
                        activeHover === 'Updated at' ?
                            'Upda...'
                            :
                            'Updated at'
                    }
                    <div className='flex items-center gap-1 xl:gap-1.5 opacity-0 transition-all duration-500 group-hover:opacity-100'>
                        <div className='rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <ArrowUpwardIcon className="text-lg xl:text-xl" />
                        </div>
                        <div className='rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <MoreVertIcon className="text-lg xl:text-xl" />
                        </div>
                    </div>
                </div>

            </div>

            <div className='flex flex-col gap-3 md:gap-1.5 mt-5'>

                {
                    loading ? <p className="text-center py-8">Fetching operators...</p>
                        :
                        users.length === 0 ? <div className="w-full min-h-[60vh] md:min-h-[80vh] h-full flex items-center justify-center">
                            <Image
                                src={NullImage || "/placeholder.svg"}
                                alt="No operators found"
                                className="w-[250px] sm:w-[350px] md:w-[400px] lg:w-[700px] h-auto object-cover"
                                width={400}
                                height={400}
                                unoptimized={true} />
                        </div> :
                            users.map((details, index) => {
                                const name = `${details.user.first_name} ${details.user.middle_name ? details.user.middle_name + ' ' : ''}${details.user.last_name}`
                                const firstName = details.user.first_name
                                const email = details.user.email
                                
                                return (
                                    <div key={index} className='w-full'>
                                        {/* Mobile Card View - Clickable one line box */}
                                        <div 
                                            className="lg:hidden bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer active:scale-[0.98]"
                                            onClick={() => handleMobileOperatorClick(details)}
                                        >
                                            <div className="flex items-center justify-between gap-2 text-sm">
                                                {/* Avatar/Image */}
                                                <div className="flex-shrink-0">
                                                    {details.user.image ? (
                                                        <Image
                                                            src={details.user.image}
                                                            alt={firstName}
                                                            width={40}
                                                            height={40}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                            unoptimized={true}
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                                                            {firstName.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Name & Email */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate">{firstName}</p>
                                                    <p className="text-xs text-gray-500 truncate">{email}</p>
                                                </div>

                                                {/* Status Badge */}
                                                <div className="flex-shrink-0">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                        details.Status === 'active' 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {details.Status}
                                                    </span>
                                                </div>

                                                {/* Verified Badge */}
                                                <div className="flex-shrink-0">
                                                    {details.user.emailVerified ? (
                                                        <span className="text-green-500 text-lg">✓</span>
                                                    ) : (
                                                        <span className="text-gray-400 text-lg">✗</span>
                                                    )}
                                                </div>

                                                {/* Edit Icon */}
                                                <div className="flex-shrink-0">
                                                    <EditIcon className="text-purple-500" fontSize="small" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Desktop Table View */}
                                        <div
                                            className='hidden lg:block'
                                            onMouseEnter={() => { setMailHover(index) }}
                                            onMouseLeave={() => { setMailHover(-1) }}
                                        >
                                            <OperatorAction
                                                creatDate={formatDate(details.createdAt)}
                                                email={details.user.email}
                                                emailVerified={details.user.emailVerified}
                                                index={index}
                                                mailHover={mailHover}
                                                name={name}
                                                updateDate={formatDate(details.updatedAt)}
                                                status={details.Status}
                                                id={details.id} />
                                        </div>
                                    </div>
                                )
                            })
                }

            </div>

            {/* Mobile Edit Modal */}
            {selectedOperator && (
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="bg-white w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto p-0">
                        {/* Header with gradient */}
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 relative">
                            <button 
                                onClick={() => setEditOpen(false)}
                                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                            >
                                <CloseIcon />
                            </button>
                            
                            <div className="flex items-center gap-4">
                                {selectedOperator.user.image ? (
                                    <Image
                                        src={selectedOperator.user.image}
                                        alt={selectedOperator.user.first_name}
                                        width={80}
                                        height={80}
                                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                                        unoptimized={true}
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-purple-600 font-bold text-3xl shadow-lg">
                                        {selectedOperator.user.first_name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="text-white">
                                    <h2 className="text-2xl font-bold">
                                        {selectedOperator.user.first_name} {selectedOperator.user.middle_name} {selectedOperator.user.last_name}
                                    </h2>
                                    <p className="text-purple-100 text-sm">{selectedOperator.user.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            {/* Status & Verification */}
                            <div className="flex gap-3">
                                <div className="flex-1 bg-gray-50 rounded-lg p-4">
                                    <p className="text-xs text-gray-500 mb-1">Status</p>
                                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                                        selectedOperator.Status === 'active' 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-gray-100 text-gray-700'
                                    }`}>
                                        {selectedOperator.Status}
                                    </span>
                                </div>
                                
                                <div className="flex-1 bg-gray-50 rounded-lg p-4">
                                    <p className="text-xs text-gray-500 mb-1">Email Verified</p>
                                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                                        selectedOperator.user.emailVerified 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                        {selectedOperator.user.emailVerified ? 'Verified' : 'Not Verified'}
                                    </span>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="space-y-3">
                                <div className="border-b pb-3">
                                    <p className="text-xs text-gray-500 mb-1">Operator ID</p>
                                    <p className="font-medium text-gray-900">{selectedOperator.id}</p>
                                </div>

                                <div className="border-b pb-3">
                                    <p className="text-xs text-gray-500 mb-1">Email</p>
                                    <p className="font-medium text-gray-900 break-all">{selectedOperator.user.email}</p>
                                </div>

                                <div className="border-b pb-3">
                                    <p className="text-xs text-gray-500 mb-1">Joined At</p>
                                    <p className="font-medium text-gray-900">{formatDate(selectedOperator.createdAt)}</p>
                                </div>

                                <div className="pb-3">
                                    <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                                    <p className="font-medium text-gray-900">{formatDate(selectedOperator.updatedAt)}</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <Button 
                                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                                    onClick={() => {
                                        // Add your edit logic here
                                        console.log('Edit operator:', selectedOperator)
                                    }}
                                >
                                    <EditIcon className="mr-2" fontSize="small" />
                                    Edit Operator
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => setEditOpen(false)}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

        </div>
    )
}

export default OperatorSection