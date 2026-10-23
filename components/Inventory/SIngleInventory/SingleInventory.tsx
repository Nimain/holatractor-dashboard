"use client"

import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import { Tractor, Inventory } from "@/utils/Types/types";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import MiddleComponent from "./MiddleComponent";
import Attachments from "./Attachments";

const SingleInventory = () => {

    const [fetchingInventoryDetails, setFetchingInventoryDetails] = useState(false)
    const [tractorDetails, setTractorDetails] = useState<Tractor | null>(null)
    const [locationDetails, setLocationDetails] = useState<string>("")

    const { slug } = useParams()

    async function fetchInventoryDetails() {
        if (slug) {
            setFetchingInventoryDetails(true);
            let loaded = false;

            try {
                const localRes = await fetch(`/api/inventory/${slug}`);
                if (localRes.ok) {
                    const data = await localRes.json();
                    if (data?.tractor) {
                        setTractorDetails(data.tractor);
                        setLocationDetails(data.city || "");
                        loaded = true;
                    }
                }
            } catch (localErr) {
                console.warn("Local inventory single fetch notice:", localErr);
            }

            if (!loaded) {
                try {
                    const res = await renderInstance.get(`/inventory/${slug}`);
                    if (res.data?.tractor) {
                        setTractorDetails(res.data.tractor);
                        setLocationDetails(res.data.city || "");
                        loaded = true;
                    }
                } catch (err) {
                    errorMessage("Error fetching tractor details");
                }
            }

            setFetchingInventoryDetails(false);
        }
    }

    useEffect(() => {
        fetchInventoryDetails()
    }, [slug])

    function formatDate(dateString: string): string {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', options);
    }

    function formatYear(year: string | Date): string {
        // If it's a Date object, format it
        if (year instanceof Date) {
            return formatDate(year.toISOString());
        }
        // If it's a string and includes a date-like structure
        if (typeof year === 'string' && year.includes('-')) {
            return formatDate(year);
        }
        // Otherwise, return it as is (assuming it's just a year)
        return year.toString();
    }    

    if (fetchingInventoryDetails) {
        return <div>Loading...</div>;
    }

    if (!tractorDetails) {
        return <div>No tractor details available.</div>;
    }

  return (
    <div
            className='py-[30px] w-full flex flex-col gap-[30px]'>

            <div
                className='w-full grid grid-cols-3 gap-[20px]'>

                <div className='px-[20px] py-[20px] rounded-md bg-white flex flex-col gap-[10px]'>

                    <p className='text-[16px] text-gray-600'>
                        Tractor name
                    </p>

                    <p className='text-[20px] font-[600]'>
                        {tractorDetails.name}
                    </p>

                </div>

                <div className='px-[20px] py-[20px] rounded-md bg-white flex flex-col gap-[10px]'>

                    <p className='text-[16px] text-gray-600'>
                        Tractor model
                    </p>

                    <p className='text-[20px] font-[600]'>
                        {tractorDetails.model ?? "Data not available"}
                    </p>

                </div>

                <div className='px-[20px] py-[20px] rounded-md bg-white flex flex-col gap-[10px]'>

                    <p className='text-[16px] text-gray-600'>
                        Tractor type
                    </p>

                    <p className='text-[20px] font-[600]'>
                    {tractorDetails.type}
                    </p>

                </div>

                <div className='px-[20px] py-[20px] rounded-md bg-white flex flex-col gap-[10px]'>

                    <p className='text-[16px] text-gray-600'>
                        Year
                    </p>

                    <p className='text-[20px] font-[600]'>
                        {tractorDetails.year ? formatYear(tractorDetails.year) : "Year not available"}
                    </p>

                </div>

                <div className='px-[20px] py-[20px] rounded-md bg-white flex flex-col gap-[10px]'>

                    <p className='text-[16px] text-gray-600'>
                        Address
                    </p>

                    <p className='text-[20px] font-[600]'>
                    {locationDetails}
                    </p>

                </div>

                <div className='px-[20px] py-[20px] rounded-md bg-white flex flex-col gap-[10px] col-span-2'>

                    <p className='text-[16px] text-gray-600'>
                        Description
                    </p>

                    <p className='text-[20px] font-[600]'>
                    {tractorDetails.description}
                    </p>

                </div>

            </div>

            <MiddleComponent tractorImages={tractorDetails.images} tractorId={tractorDetails.id} />

            <Attachments tractorId={tractorDetails.id} />

        </div>
  )
};

export default SingleInventory;
