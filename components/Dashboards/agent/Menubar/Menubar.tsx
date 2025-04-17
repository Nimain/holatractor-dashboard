"use client"

import React from 'react'
import SearchIcon from '@mui/icons-material/Search';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Languages from './Languages';
import { Avatar } from '@mui/material';
import { useCookie } from 'next-cookie'
import ProfileComponent from './ProfileComponent';

const Menubar = ({pagename}: {pagename: string}) => {

    const dispatch = useDispatch()
    const { language } = useSelector((state: RootState)=> state.ActiveLanguage)

    const { cookie } = useCookie()
    const access_token = cookie.get("access_token")

  return (
    <div className='w-full flex items-center justify-between mb-7 gap-5 relative'>

            <div
                className='flex items-center gap-[20px]'>

                <p
                    className='text-[20px] font-bold'>
                    {pagename}
                </p>

                <div
                    className='flex items-center gap-[10px] w-[400px] bg-gray-200 drop-shadow-md px-[20px] py-[10px] rounded-md'>

                    <SearchIcon />

                    <input
                        type="text"
                        placeholder='Enter your queries'
                        className='outline-none border-none w-full bg-transparent' />

                </div>

            </div>

            <div
                className='flex items-center gap-[20px]'>

                <Languages />

                <ProfileComponent />

                {/* <div
                    className='w-[40px] h-[40px] flex items-center justify-center bg-white drop-shadow-md rounded-full cursor-pointer'
                    onClick={() => { dispatch(NotificationComponentShow ? disableNotificationComponentShow() : enableNotificationComponentShow()) }}>
                    <Image
                        src={NotificationIcon}
                        alt='Notification Icon'
                        width={26}
                        height={26}
                        className='w-[26px] h-[26px] object-cover' />
                </div> */}

            </div>

            {/* <Notifications /> */}

        </div>
  )
}

export default Menubar