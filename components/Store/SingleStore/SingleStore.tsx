"use client"

import { useEffect, useState } from 'react'
import AddIcon from '@mui/icons-material/Add';
import { Backdrop } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Pagination, Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import { useParams } from 'next/navigation';
import { useCookie } from 'next-cookie';
import { Store } from '@/utils/Types/types';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';
import Image from 'next/image';
import AddTractor from './AddTractor';
import AddAttachment from './AddAttachment';

const SingleStore = () => {

    const [fetchingStoreDetails, setFetchingStoreDetails] = useState(false)
    const [storeDetails, setStoreDetails] = useState<Store>()

    const { slug } = useParams()

    const { cookie } = useCookie()
    const access_token = cookie.get("access_token")

    function fetchStoreDetails() {
        if (slug) {
            setFetchingStoreDetails(true)
            renderInstance.get(`/store/${slug}`, {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                }
            })
                .then((res) => {
                    setStoreDetails(res.data)
                }).catch((err) => {
                    errorMessage("Error fetching store details")
                    console.log(err)
                }).finally(() => { setFetchingStoreDetails(false) })
        }
    }

    function formatTimeOnly(dateTimeStr: string | number | Date) {
        const date = new Date(dateTimeStr);
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const seconds = date.getUTCSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    function formatDateOnly(dateTimeStr: string | number | Date) {
        const date = new Date(dateTimeStr);
        const year = date.getUTCFullYear().toString();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
        const day = date.getUTCDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatAddress(address: { address: string; city: string; state: string; country: string; zip_code: string; }) {
        const {
            address: street,
            city,
            state,
            country,
            zip_code,
        } = address;

        return `${street}, ${city}, ${state}, ${zip_code}, ${country}`;
    }

    useEffect(() => {
        fetchStoreDetails()
    }, [slug])

    if (fetchingStoreDetails) {
        return <div>Loading...</div>;
    }

    if (!storeDetails) {
        return <div>No store details details available.</div>;
    }
    
  return (
    <div
            className='py-[30px] w-full flex flex-col gap-[30px]'>

            <div
                className='w-full grid grid-cols-3 gap-[20px]'>

                <div className='px-[20px] py-[20px] rounded-md bg-white flex flex-col gap-[10px]'>

                    <p className='text-[16px] text-gray-600'>
                        Store name
                    </p>

                    <p className='text-[20px] font-[600]'>
                        {storeDetails.name}
                    </p>

                </div>

                <div className='px-[20px] py-[20px] rounded-md bg-white flex flex-col gap-[10px]'>

                    <p className='text-[16px] text-gray-600'>
                        Store owner
                    </p>

                    <p className='text-[20px] font-[600]'>
                        {`${storeDetails.owner.first_name} ${storeDetails.owner.middle_name ?? ""} ${storeDetails.owner.last_name}`}
                    </p>

                </div>

                <div className='px-[20px] py-[20px] rounded-md bg-white flex flex-col gap-[10px]'>

                    <p className='text-[16px] text-gray-600'>
                        Opening time
                    </p>

                    <p className='text-[20px] font-[600]'>
                        {formatTimeOnly(storeDetails.opening_time)}
                    </p>

                </div>

                <div className='px-[20px] py-[20px] rounded-md bg-white flex flex-col gap-[10px]'>

                    <p className='text-[16px] text-gray-600'>
                        Closing time
                    </p>

                    <p className='text-[20px] font-[600]'>
                        {formatTimeOnly(storeDetails.closing_time)}
                    </p>

                </div>

                <div className='px-[20px] py-[20px] rounded-md bg-white flex flex-col gap-[10px]'>

                    <p className='text-[16px] text-gray-600'>
                        Closed days
                    </p>

                    <p className='text-[20px] font-[600]'>
                        {storeDetails.closing_days.map((day) => {
                            return (
                                <li key={day}>{day}</li>
                            )
                        })}
                    </p>

                </div>

                <div className='px-[20px] py-[20px] rounded-md bg-white flex flex-col gap-[10px] col-span-2'>

                    <p className='text-[16px] text-gray-600'>
                        Description
                    </p>

                    <p className='text-[20px] font-[600]'>
                        {storeDetails.description}
                    </p>

                </div>

            </div>

            <div
                className='w-full grid grid-cols-2 gap-[20px]'>

                {
                    storeDetails.image &&
                    <div
                        className='w-full h-[400px] flex items-center justify-center'>
                        <Image
                            src={storeDetails.image}
                            alt='tractor_image'
                            className='w-full h-full object-cover rounded-xl'
                            width={300}
                            height={400}
                            unoptimized={true} />
                    </div>
                }

            </div>

            <div className="w-full space-y-2">

                <div className='w-full flex items-center justify-between gap-5 flex-wrap'>

                    <p className='text-xl font-medium'>
                        Total tractors: {storeDetails.TractorInStore.length}
                    </p>

                    <AddTractor alreadyTractors={storeDetails.TractorInStore} />

                </div>

                <div
                    className='w-full grid grid-cols-3 gap-[20px]'>

                    { /*
                        storeDetails.stock.length === 0 ?
                            <p>You have not created any inventory</p>
                            :
                            storeDetails.stock.map((stock, i) => {
                                return (
                                    <div
                                        className='px-[20px] py-[20px] rounded-md bg-white flex flex-col gap-[10px] cursor-pointer'
                                        key={i}>

                                        <p className='text-xl font-medium text-gray-600'>
                                            <b>Created at</b> {formatTimeOnly(stock.createdAt)} {formatDateOnly(stock.createdAt)}
                                        </p>

                                        <p className='text-[20px] font-[600]'>
                                            <b>Total tractors: </b> {stock.inventory_id.length}
                                        </p>

                                        <div
                                            className='w-full flex items-center flex-wrap justify-center gap-2'>
                                            <RemoveInventory allTractors={allTractors} selectedTractors={stock.inventory_id} storeStockId={stock.id} />
                                            <AddInventory allTractors={allTractors} selectedTractors={stock.inventory_id} storeStockId={stock.id} />
                                        </div>

                                    </div>
                                )
                            })
                    */ }

                </div>

            </div>

            <div className="w-full space-y-2">

                <div className='w-full flex items-center justify-between gap-5 flex-wrap'>

                    <p className='text-xl font-medium'>
                        Total attachment: {storeDetails.AttachmentInStore.length}
                    </p>

                    <AddAttachment alreadyTractors={storeDetails.AttachmentInStore}  />

                </div>

                <div
                    className='w-full grid grid-cols-3 gap-[20px]'>

                    { /*
                        storeDetails.stock.length === 0 ?
                            <p>You have not created any inventory</p>
                            :
                            storeDetails.stock.map((stock, i) => {
                                return (
                                    <div
                                        className='px-[20px] py-[20px] rounded-md bg-white flex flex-col gap-[10px] cursor-pointer'
                                        key={i}>

                                        <p className='text-xl font-medium text-gray-600'>
                                            <b>Created at</b> {formatTimeOnly(stock.createdAt)} {formatDateOnly(stock.createdAt)}
                                        </p>

                                        <p className='text-[20px] font-[600]'>
                                            <b>Total tractors: </b> {stock.inventory_id.length}
                                        </p>

                                        <div
                                            className='w-full flex items-center flex-wrap justify-center gap-2'>
                                            <RemoveInventory allTractors={allTractors} selectedTractors={stock.inventory_id} storeStockId={stock.id} />
                                            <AddInventory allTractors={allTractors} selectedTractors={stock.inventory_id} storeStockId={stock.id} />
                                        </div>

                                    </div>
                                )
                            })
                    */ }

                </div>

            </div>

        </div>
  )
}

export default SingleStore