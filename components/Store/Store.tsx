"use client"

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Avatar, Backdrop, CircularProgress } from '@mui/material';
import { useCookie } from 'next-cookie';
import Image from 'next/image';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage, successMessage } from '@/utils/Toastify/Messages';
import { Store, User } from '@/utils/Types/types';
import NewStore from './NewStore';

const StoreSection = () => {
    const [activeHover, setActiveHover] = useState('')
    const [allStores, setAllStores] = useState<Store[]>([])
    const [fetchingStores, setFetchingStores] = useState(false)

    const { cookie } = useCookie()
    const access_token = cookie.get("access_token")

    function formatTimeOnly(dateTimeStr: string | number | Date) {
        const date = new Date(dateTimeStr);
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const seconds = date.getUTCSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    function fetchAllStores() {
        if (access_token) {
            setFetchingStores(true)
            renderInstance.get("/store", {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                }
            })
                .then((res) => {
                    if (res.status === 200) setAllStores(res.data)
                }).catch((err) => {
                    errorMessage("Error in fetching inventory lists")
                }).finally(() => { setFetchingStores(false) })
        } else errorMessage("Admin not logged in")
    }

    useEffect(() => {
        fetchAllStores()
    }, [])

    return (
        <div className="w-full py-[20px]">

            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={fetchingStores}>

                {fetchingStores && <CircularProgress />}

            </Backdrop >

            <div
                className='w-full flex items-center justify-between gap-[20px]'>

                <p className='text-[20px]'>
                    <span className='font-[600]'>Total Stores: {allStores.length}</span>
                </p>

                <NewStore />

            </div>

            <div
                className='text-[20px] font-[600] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer mt-[30px]'>

                <div className='w-[50px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400'>
                    <Avatar />
                </div>

                <div className='w-[150px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'
                    onMouseEnter={() => { setActiveHover('Tractor name') }}
                    onMouseLeave={() => { setActiveHover('') }}>
                    <p>Name</p>
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

                <div className='w-[150px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'
                    onMouseEnter={() => { setActiveHover('Model') }}
                    onMouseLeave={() => { setActiveHover('') }}>
                    <p>
                        {
                            activeHover === 'Model' ?
                                'Desc...'
                                :
                                'Description'
                        }
                    </p>
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

                <div className='w-[150px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'
                    onMouseEnter={() => { setActiveHover('Opening Time') }}
                    onMouseLeave={() => { setActiveHover('') }}>
                    <p>
                        {
                            activeHover === 'Opening Time' ?
                                'Open...'
                                :
                                'Opening Time'
                        }
                    </p>
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

                <div className='w-[150px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'
                    onMouseEnter={() => { setActiveHover('Closing Time') }}
                    onMouseLeave={() => { setActiveHover('') }}>
                    <p>
                        {
                            activeHover === 'Closing Time' ?
                                'Close...'
                                :
                                'Closing Time'
                        }
                    </p>
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

                <div className='w-[150px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group'
                    onMouseEnter={() => { setActiveHover('Closed days') }}
                    onMouseLeave={() => { setActiveHover('') }}>
                    <p>
                        {
                            activeHover === 'Closed days' ?
                                'Closed...'
                                :
                                'Closed days'
                        }
                    </p>
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
                    allStores.length === 0 ? <p>You havr not created any store</p>
                        :
                        allStores.map((tractorDetails, index) => {
                            return (
                                <Link
                                    href={`/Store/${tractorDetails.id}`}
                                    className='text-[18px] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer transition-all duration-500 hover:bg-white'
                                    key={index}>

                                    {
                                        tractorDetails.image ?
                                            <Image
                                                src={tractorDetails.image}
                                                className='w-[50px] h-[50px] rounded-full object-cover'
                                                alt={tractorDetails.name}
                                                width={50}
                                                height={50}
                                                unoptimized={true} />
                                            :
                                            <div className='w-[50px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400'>
                                                <Avatar />
                                            </div>
                                    }

                                    <p className='w-[150px]'>
                                        {tractorDetails.name}
                                    </p>

                                    <p className='w-[150px]'>
                                        {tractorDetails.description}
                                    </p>

                                    <p className='w-[150px]'>
                                        {formatTimeOnly(tractorDetails.opening_time)}
                                    </p>

                                    <p className='w-[150px]'>
                                        {formatTimeOnly(tractorDetails.closing_time)}
                                    </p>

                                    <ul className='w-[150px] list-disc'>
                                        {tractorDetails.closing_days.map((day) => {
                                            return (
                                                <li key={day}>{day}</li>
                                            )
                                        })}
                                    </ul>

                                </Link>
                            )
                        })
                }

            </div>

        </div >
    )
}

export default StoreSection