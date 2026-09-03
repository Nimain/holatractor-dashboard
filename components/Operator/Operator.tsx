"use client"

import { useEffect, useState } from 'react'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from "@mui/icons-material/Edit"
import CloseIcon from "@mui/icons-material/Close"
import { Operator, Owner } from '@/utils/Types/types';
import axios from 'axios';
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

    async function fetchAllUsers() {
        setLoading(true)
        try {
            const localRes = await axios.get("/api/operator")
            const operatorList = Array.isArray(localRes.data) ? localRes.data : []
            const sortedUsers = [...operatorList].sort((a: any, b: any) => {
                return new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
            })
            setUsers(sortedUsers)
        } catch (err) {
            console.error("Error fetching operator list:", err)
        } finally {
            setLoading(false)
        }
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
                            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all"
                        >
                            New operator
                        </Button>
                    </DialogTrigger>

                    <DialogContent
                        className="bg-white rounded-2xl w-[95vw] max-w-[460px] p-0 overflow-hidden shadow-2xl border border-gray-100"
                        style={{ scrollbarWidth: "none" }}
                    >
                        {/* Modal Header */}
                        <div className="bg-slate-900 p-6 text-white relative">
                            <p className="text-xs uppercase tracking-wider font-semibold text-emerald-400 mb-1">Operator Fleet</p>
                            <h2 className="text-xl font-bold">Register New Operator</h2>
                            <p className="text-xs text-slate-300 mt-1">Enter the machine operator's full legal name.</p>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div>
                                <Label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                                    Full Legal Name *
                                </Label>
                                <Input
                                    value={newOperatorName}
                                    onChange={e => { handleNameChage(e.target.value) }}
                                    placeholder="e.g. Carlos Mendoza"
                                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <DialogClose asChild>
                                <Button 
                                    onClick={() => { setOpen(false) }}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all bg-white"
                                >
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
                                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-[0.98]"
                                    >
                                        Next Step →
                                    </Button>
                            }
                        </div>

                    </DialogContent>

                </Dialog>

            </div>

            {/* Desktop Table Header - Hidden on mobile */}
            <div className='hidden lg:flex text-[16px] font-[600] items-center justify-between gap-2 xl:gap-3 bg-slate-100 p-4 rounded-xl text-slate-700'>

                <div className='w-12 font-bold text-center'>
                    #
                </div>

                <div className='w-48 font-bold'>
                    Operator Full Name
                </div>

                <div className='w-48 font-bold'>
                    Email Address
                </div>

                <div className='w-24 font-bold text-center'>
                    Verified
                </div>

                <div className='w-24 font-bold text-center'>
                    Status
                </div>

                <div className='w-36 font-bold'>
                    Joined At
                </div>

                <div className='w-36 font-bold'>
                    Updated At
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
                                                        String(details.Status) === 'active' || Number(details.Status) === 1 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {String(details.Status) === '1' ? 'active' : details.Status}
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
                    <DialogContent className="bg-white w-[95vw] max-w-[520px] max-h-[90vh] overflow-hidden p-0 rounded-2xl border border-gray-100 shadow-2xl">
                        {/* Header with Dark Modern Slate & Emerald Accent */}
                        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 relative overflow-hidden text-white">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                            
                            <button 
                                onClick={() => setEditOpen(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl p-2 transition-all"
                            >
                                <CloseIcon fontSize="small" />
                            </button>
                            
                            <div className="flex items-center gap-4 relative z-10">
                                {selectedOperator.user.image ? (
                                    <Image
                                        src={selectedOperator.user.image}
                                        alt={selectedOperator.user.first_name}
                                        width={72}
                                        height={72}
                                        className="w-[72px] h-[72px] rounded-2xl object-cover ring-4 ring-white/10 shadow-xl"
                                        unoptimized={true}
                                    />
                                ) : (
                                    <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-2xl shadow-xl ring-4 ring-white/10">
                                        {selectedOperator.user.first_name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                            Operator
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                            selectedOperator.user.emailVerified
                                                ? 'bg-green-500/20 text-green-300'
                                                : 'bg-amber-500/20 text-amber-300'
                                        }`}>
                                            {selectedOperator.user.emailVerified ? '● Verified' : '○ Pending'}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-bold tracking-tight text-white">
                                        {selectedOperator.user.first_name} {selectedOperator.user.middle_name || ''} {selectedOperator.user.last_name}
                                    </h2>
                                    <p className="text-slate-300 text-xs mt-0.5 break-all">{selectedOperator.user.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4 max-h-[calc(90vh-180px)] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                            {/* Bento Info Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Status</p>
                                    <div className="flex items-center gap-1.5 font-semibold text-sm text-slate-800">
                                        <span className={`w-2 h-2 rounded-full ${String(selectedOperator.Status) === 'active' || Number(selectedOperator.Status) === 1 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                        <span className="capitalize">{String(selectedOperator.Status) === '1' ? 'Active' : selectedOperator.Status || 'Active'}</span>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Role Type</p>
                                    <p className="font-semibold text-sm text-slate-800">Heavy Machine Operator</p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
                                    <span className="text-slate-500">Operator ID</span>
                                    <span className="font-mono text-slate-800 font-medium text-[11px]">{selectedOperator.id}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
                                    <span className="text-slate-500">Contact Email</span>
                                    <span className="font-medium text-slate-900">{selectedOperator.user.email}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
                                    <span className="text-slate-500">Joined At</span>
                                    <span className="font-medium text-slate-800">{formatDate(selectedOperator.createdAt)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Last Modified</span>
                                    <span className="font-medium text-slate-800">{formatDate(selectedOperator.updatedAt)}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <Button 
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2.5 font-medium shadow-md transition-all active:scale-[0.98]"
                                    onClick={() => {
                                        console.log('Edit operator:', selectedOperator)
                                    }}
                                >
                                    <EditIcon className="mr-1.5 !w-4 !h-4" />
                                    Edit Operator
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="px-5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                                    onClick={() => setEditOpen(false)}
                                >
                                    Done
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