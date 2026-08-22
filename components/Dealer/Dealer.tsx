"use client"

import { Dealer } from '@/utils/Types/types'
import { useEffect, useState } from 'react'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import axios from 'axios';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';
import Image from 'next/image';
import NullImage from "@/assets/AnimateIcons/Operator.svg"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import DealerRegister from '../Authentication/DealerRegister';
import DealerAction from './DealerAction';

const DealerSection = () => {
    const [activeHover, setActiveHover] = useState('')
    const [mailHover, setMailHover] = useState(-1)
    const [loading, setLoading] = useState(false)

    const [users, setUsers] = useState<Dealer[]>([])
    const [open, setOpen] = useState(false)
    const [newDealerName, setNewDealerName] = useState("")
    const [isSignUpCard, setIsSignUpCard] = useState(false)

    async function fetchAllUsers() {
        setLoading(true)
        try {
            let dealerList: Dealer[] = []
            try {
                const localRes = await axios.get("/api/dealer")
                if (Array.isArray(localRes.data) && localRes.data.length > 0) {
                    dealerList = localRes.data
                }
            } catch {}

            if (dealerList.length === 0) {
                const res = await renderInstance.get("/dealer")
                dealerList = Array.isArray(res.data)
                    ? res.data
                    : (res.data?.dealers || res.data?.data || [])
            }

            const sortedUsers = [...dealerList].sort((a: Dealer, b: Dealer) => {
                return new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
            })
            setUsers(sortedUsers)
        } catch (err) {
            errorMessage("Error fetching user list")
        } finally {
            setLoading(false)
        }
    }

    const splitFullName = (fullName: string) => {
        const nameParts = fullName.trim().split(/\s+/); // Split by spaces
        const firstName = nameParts.shift(); // Take the first element as the first name
        const lastName = nameParts.pop(); // Take the last element as the last name
        const middleName = nameParts.join(" "); // Join the rest as middle name

        return { firstName, middleName, lastName };
    };

    function handleNameChage(name: string) {
        setNewDealerName(name)

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

    return (
        <div className='mt-[40px] text-[18px]'>

            <div className='mb-[20px] w-full flex items-center justify-between'>

                <p className='text-[22px] font-[600]'>
                    Total dealers: {users.length}
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
                            New dealer
                        </Button>
                    </DialogTrigger>

                    <DialogContent
                        className="bg-white rounded-2xl w-[95vw] max-w-[460px] p-0 overflow-hidden shadow-2xl border border-gray-100"
                        style={{ scrollbarWidth: "none" }}
                    >
                        {/* Modal Header */}
                        <div className="bg-slate-900 p-6 text-white relative">
                            <p className="text-xs uppercase tracking-wider font-semibold text-emerald-400 mb-1">Dealer Network</p>
                            <h2 className="text-xl font-bold">Register New Dealer</h2>
                            <p className="text-xs text-slate-300 mt-1">Enter the dealership or commercial entity legal name.</p>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div>
                                <Label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                                    Dealership / Full Legal Name *
                                </Label>
                                <Input
                                    value={newDealerName}
                                    onChange={e => { handleNameChage(e.target.value) }}
                                    placeholder="e.g. AgroTech Machinery Solutions"
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
                                    <DealerRegister inPage={true} name={newDealerName} />
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

            <div
                className='text-[20px] font-[600] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer'>

                <div
                    className='w-[100px] flex items-center justify-between group'>
                    Id
                    <div className='flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100'>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <ArrowUpwardIcon />
                        </div>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <MoreVertIcon />
                        </div>
                    </div>
                </div>

                <div className='w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'>
                    Name
                    <div className='flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100'>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <ArrowUpwardIcon />
                        </div>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <MoreVertIcon />
                        </div>
                    </div>
                </div>

                <div className='w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'>
                    Email
                    <div className='flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100'>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <ArrowUpwardIcon />
                        </div>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <MoreVertIcon />
                        </div>
                    </div>
                </div>

                <div className='w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'
                    onMouseEnter={() => { setActiveHover('Verified') }}
                    onMouseLeave={() => { setActiveHover('') }}>
                    {
                        activeHover === 'Verified' ?
                            'Veri...'
                            :
                            'Verified'
                    }
                    <div className='flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100'>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <ArrowUpwardIcon />
                        </div>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <MoreVertIcon />
                        </div>
                    </div>
                </div>

                <div className='w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'>
                    Status
                    <div className='flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100'>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <ArrowUpwardIcon />
                        </div>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <MoreVertIcon />
                        </div>
                    </div>
                </div>

                <div className='w-[180px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'
                    onMouseEnter={() => { setActiveHover('Joined at') }}
                    onMouseLeave={() => { setActiveHover('') }}>
                    {
                        activeHover === 'Joined at' ?
                            'Join...'
                            :
                            'Joined at'
                    }
                    <div className='flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100'>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <ArrowUpwardIcon />
                        </div>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <MoreVertIcon />
                        </div>
                    </div>
                </div>

                <div className='w-[180px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'
                    onMouseEnter={() => { setActiveHover('Updated at') }}
                    onMouseLeave={() => { setActiveHover('') }}>
                    {
                        activeHover === 'Updated at' ?
                            'Upda...'
                            :
                            'Updated at'
                    }
                    <div className='flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100'>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <ArrowUpwardIcon />
                        </div>
                        <div
                            className='rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300'>
                            <MoreVertIcon />
                        </div>
                    </div>
                </div>

            </div>

            <div className='flex flex-col gap-[5px] mt-[20px]'>

                {
                    loading ? <p>Fetching dealers</p>
                        :
                        users.length === 0 ? <div className="w-full h-full min-h-[80vh] flex items-center justify-center">
                            <Image
                                src={NullImage}
                                alt="No image found"
                                className="w-[400px] lg:w-[700px] h-auto object-cover"
                                width={400}
                                height={400}
                                unoptimized={true} />
                        </div> :
                            users.map((details, index) => {
                                const name = `${details.user.first_name} ${details.user.middle_name ? details.user.middle_name + ' ' : ''}${details.user.last_name}`
                                return (
                                    <div
                                        key={index}
                                        onMouseEnter={() => { setMailHover(index) }}
                                        onMouseLeave={() => { setMailHover(-1) }}
                                        className='w-full'>
                                        <DealerAction
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
                                )
                            })
                }

            </div>


        </div>
    )
}

export default DealerSection