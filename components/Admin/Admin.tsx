"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { UserProfile } from '@/utils/Types/types'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage } from '@/utils/Toastify/Messages'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from "@mui/icons-material/Edit"
import CloseIcon from "@mui/icons-material/Close"
import NullImage from "@/assets/AnimateIcons/Operator.svg"
import { Dialog, DialogContent } from '../ui/dialog';

const AdminSection = () => {
    const [activeHover, setActiveHover] = useState('')
    const [mailHover, setMailHover] = useState(-1)
    const [loading, setLoading] = useState(false)

    const [users, setUsers] = useState<UserProfile[]>([])
    const [open, setOpen] = useState(false)
    
    // Mobile edit modal state
    const [selectedAdmin, setSelectedAdmin] = useState<UserProfile | null>(null)
    const [editOpen, setEditOpen] = useState(false)

    async function fetchAllUsers() {
        setLoading(true)
        try {
            let adminList: UserProfile[] = []
            try {
                const localRes = await axios.get("/api/user/admins/all")
                if (Array.isArray(localRes.data)) {
                    adminList = localRes.data
                }
            } catch (e) {
                console.warn("Local /api/user/admins/all notice:", e)
            }

            if (adminList.length === 0) {
                try {
                    const res = await renderInstance.get("/user/admins/all")
                    if (Array.isArray(res.data)) {
                        adminList = res.data
                    }
                } catch {}
            }

            setUsers(adminList)
        } catch (err) {
            console.error("Error fetching admin list:", err)
        } finally {
            setLoading(false)
        }
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

    const handleMobileAdminClick = (admin: UserProfile) => {
        setSelectedAdmin(admin)
        setEditOpen(true)
    }

    return (
        <div className='mt-6 md:mt-10 text-base md:text-lg px-4 md:px-0'>

            <div className='mb-5 w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>

                <p className='text-lg md:text-xl lg:text-2xl font-semibold'>
                    Total Admin: {users.length}
                </p>

                <Link href={"/create_admin"} className="w-full sm:w-auto">
                    <Button
                        name="Name_next_button"
                        onClick={() => {
                            setOpen(true)
                        }}
                        className="w-full sm:w-auto"
                    >
                        New Admin
                    </Button>
                </Link>

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
                    loading ? <p className="text-center py-8">Fetching admins...</p>
                        :
                        users.length === 0 ? <div className="w-full min-h-[60vh] md:min-h-[80vh] h-full flex items-center justify-center">
                            <Image
                                src={NullImage || "/placeholder.svg"}
                                alt="No admins found"
                                className="w-[250px] sm:w-[350px] md:w-[400px] lg:w-[700px] h-auto object-cover"
                                width={400}
                                height={400}
                                unoptimized={true} />
                        </div> :
                            users.map((details, index) => {
                                const name = `${details.user.first_name} ${details.user.middle_name ? details.user.middle_name + ' ' : ''}${details.user.last_name}`
                                const firstName = details.user.first_name
                                const email = details.user.email
                                const isActive = details.user.emailVerified
                                
                                return (
                                    <div key={index} className='w-full'>
                                        {/* Mobile Card View - Clickable one line box */}
                                        <div 
                                            className="lg:hidden bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer active:scale-[0.98]"
                                            onClick={() => handleMobileAdminClick(details)}
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
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-semibold">
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
                                                        isActive 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {isActive ? 'Active' : 'Inactive'}
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
                                                    <EditIcon className="text-indigo-500" fontSize="small" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Desktop Table View */}
                                        <div
                                            className='hidden lg:flex text-base xl:text-lg items-center justify-between gap-2 xl:gap-3 bg-[#ededed] p-4 xl:p-5 rounded cursor-pointer hover:bg-white transition-all duration-500'
                                            onMouseEnter={() => { setMailHover(index) }}
                                            onMouseLeave={() => { setMailHover(-1) }}
                                        >

                                            <p className='min-w-[80px] xl:w-[100px]'>
                                                {index + 1}
                                            </p>

                                            <p className={`transition ${index === mailHover ? 'w-fit' : 'min-w-[120px] xl:w-[140px] truncate'}`}>
                                                {mailHover === index ? details.user.email : `${details.user.email.slice(0, 8)}...`}
                                            </p>

                                            <div className={`px-3 text-sm py-1.5 ${details.user.emailVerified ? 'text-[#3e875e]' : 'text-red-400'} bg-[#dfe4e2] text-center min-w-[120px] xl:w-[140px] rounded-full`}>
                                                {
                                                    details.user.emailVerified ?
                                                        'Yes'
                                                        :
                                                        'No'
                                                }
                                            </div>

                                            <p className={`px-3 text-sm py-1.5 ${details.user.emailVerified ? 'text-[#3e875e]' : 'text-red-400'} bg-[#dfe4e2] text-center min-w-[120px] xl:w-[140px] rounded-full`}>
                                                {
                                                    details.user.emailVerified ?
                                                        'Active'
                                                        :
                                                        'Inactive'
                                                }
                                            </p>

                                            <p className='min-w-[150px] xl:w-[180px]'>
                                                {mailHover === index ? formatDate(details.createdAt) : `${formatDate(details.createdAt).slice(0, 12)}...`}
                                            </p>

                                            <p className='min-w-[150px] xl:w-[180px]'>
                                                {mailHover === index ? formatDate(details.updatedAt) : `${formatDate(details.updatedAt).slice(0, 12)}...`}
                                            </p>

                                        </div>
                                    </div>
                                )
                            })
                }
            </div>
            {/* Mobile / Quick View Admin Modal */}
            {selectedAdmin && (
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="bg-white w-[95vw] max-w-[520px] max-h-[90vh] overflow-hidden p-0 rounded-2xl border border-gray-100 shadow-2xl">
                        {/* Header with Dark Modern Slate & Emerald Accent */}
                        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 relative overflow-hidden text-white">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                            
                            <button 
                                onClick={() => setEditOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl p-2 transition-all"
                            >
                                <CloseIcon fontSize="small" />
                            </button>
                            
                            <div className="flex items-center gap-4 relative z-10">
                                {selectedAdmin.user.image ? (
                                    <Image
                                        src={selectedAdmin.user.image}
                                        alt={selectedAdmin.user.first_name}
                                        width={72}
                                        height={72}
                                        className="w-[72px] h-[72px] rounded-2xl object-cover ring-4 ring-white/10 shadow-xl"
                                        unoptimized={true}
                                    />
                                ) : (
                                    <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-2xl shadow-xl ring-4 ring-white/10">
                                        {selectedAdmin.user.first_name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                            Admin
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                            selectedAdmin.user.emailVerified
                                                ? 'bg-green-500/20 text-green-300'
                                                : 'bg-amber-500/20 text-amber-300'
                                        }`}>
                                            {selectedAdmin.user.emailVerified ? '● Verified' : '○ Pending'}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-bold tracking-tight text-white">
                                        {selectedAdmin.user.first_name} {selectedAdmin.user.middle_name || ''} {selectedAdmin.user.last_name}
                                    </h2>
                                    <p className="text-slate-300 text-xs mt-0.5 break-all">{selectedAdmin.user.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4 max-h-[calc(90vh-180px)] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                            {/* Bento Info Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Account Status</p>
                                    <div className="flex items-center gap-1.5 font-semibold text-sm text-slate-800">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        {selectedAdmin.user.emailVerified ? 'Active Admin' : 'Invited'}
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Role Type</p>
                                    <p className="font-semibold text-sm text-slate-800">System Admin</p>
                                </div>
                            </div>

                            {/* Details List */}
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
                                    <span className="text-slate-500">Admin Identifier</span>
                                    <span className="font-mono text-slate-800 font-medium text-[11px]">{selectedAdmin.id}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
                                    <span className="text-slate-500">Contact Email</span>
                                    <span className="font-medium text-slate-900">{selectedAdmin.user.email}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
                                    <span className="text-slate-500">Account Created</span>
                                    <span className="font-medium text-slate-800">{formatDate(selectedAdmin.createdAt)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Last Modified</span>
                                    <span className="font-medium text-slate-800">{formatDate(selectedAdmin.updatedAt)}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <Button 
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2.5 font-medium shadow-md transition-all active:scale-[0.98]"
                                    onClick={() => {
                                        console.log('Edit admin:', selectedAdmin)
                                    }}
                                >
                                    <EditIcon className="mr-1.5 !w-4 !h-4" />
                                    Edit Permissions
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

export default AdminSection