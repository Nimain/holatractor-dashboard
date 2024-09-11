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
import NullImage from "@/assets/AnimateIcons/Operator.svg"

const AdminSection = () => {
    const [activeHover, setActiveHover] = useState('')
    const [mailHover, setMailHover] = useState(-1)
    const [loading, setLoading] = useState(false)

    const [users, setUsers] = useState<UserProfile[]>([])
    const [open, setOpen] = useState(false)

    function fetchAllUsers() {
        setLoading(true)
        renderInstance.get("/user/admins/all")
            .then((res) => {
                setUsers(res.data)
            }).catch((err) => {
                errorMessage("Error fetching user list")
            }).finally(() => {
                setLoading(false)
            })
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

<Link href={"/create_admin"}>
                        <Button
                            name="Name_next_button"
                            onClick={() => {
                                setOpen(true)
                            }}
                        >
                            New Admin
                        </Button>
                        </Link>

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
                    loading ? <p>Fetching admins</p>
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
                                        className='text-[18px] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer hover:bg-white transition-all duration-500'
                                        key={index}
                                        onMouseEnter={() => { setMailHover(index) }}
                                        onMouseLeave={() => { setMailHover(-1) }}>

                                        <p
                                            className='w-[100px]'>
                                            {index + 1}
                                        </p>

                                        <p className='w-[140px]'>
                                            {name}
                                        </p>

                                        <p className={`transition ${index === mailHover ? 'w-fit' : 'w-[140px]'}`}>
                                            {mailHover === index ? details.user.email : `${details.user.email.slice(0, 5)}...`}
                                        </p>

                                        <div className={`px-[10px] text-[14px] py-[6px] ${details.user.emailVerified ? 'text-[#3e875e]' : 'text-red-400'} bg-[#dfe4e2] text-center w-[140px] rounded-full`}>
                                            {
                                                details.user.emailVerified ?
                                                    'Yes'
                                                    :
                                                    'No'
                                            }
                                        </div>

                                        <p className={`px-[10px] text-[14px] py-[6px] ${details.user.emailVerified ? 'text-[#3e875e]' : 'text-red-400'} bg-[#dfe4e2] text-center w-[140px] rounded-full`}>
                                            {
                                                details.user.emailVerified ?
                                                    'Active'
                                                    :
                                                    'Inactive'
                                            }
                                        </p>

                                        <p className='w-[180px]'>
                                            {mailHover === index ? formatDate(details.createdAt) : `${formatDate(details.createdAt).slice(0, 12)}...`}
                                        </p>

                                        <p className='w-[180px]'>
                                            {mailHover === index ? formatDate(details.updatedAt) : `${formatDate(details.updatedAt).slice(0, 12)}...`}
                                        </p>

                                    </div>
                                )
                            })
                }

            </div>


        </div>
  )
}

export default AdminSection