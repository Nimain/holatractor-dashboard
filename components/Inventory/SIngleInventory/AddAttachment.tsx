"use client"

import axios from 'axios';
import { Attachment } from '@/utils/Types/types'
import { useEffect, useState } from 'react'
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { Pagination, Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import { useCookie } from 'next-cookie';
import { useRouter } from 'next/navigation';
import { errorMessage, successMessage } from '@/utils/Toastify/Messages';
import { Backdrop } from '@mui/material';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface addAttachmentProps {
    allAttachments: Attachment[];
    selectedAttachments: Attachment[];
    tractorId: string;
}

const AddAttachment = ({allAttachments, selectedAttachments,tractorId}: addAttachmentProps) => {
    const [open, setOpen] = useState(false)
    const [adding, setAdding] = useState(false)

    const { cookie } = useCookie()
    const access_token = cookie.get("access_token")

    const router = useRouter()

    const availableAttachments = (allAttachments || []).filter(attachment =>
        !(selectedAttachments || []).some(selected => selected.id === attachment.id)
    );    

    function handleAddAttachment(attachmentId: string) {

        setAdding(true)

        axios.patch(`/api/attachment/${attachmentId}/${tractorId}/addOrRemove`).then(res=>{
            if(res.status === 200 || res.data?.id){
                successMessage("Attachment updated for this tractor")
                setTimeout(() => {
                    router.refresh()
                }, 1000);
            }
        }).catch((err)=>{
            errorMessage("Some error occurred updating attachment")
        }).finally(()=>{setAdding(false)})
    }


    return (
        <div>
            <Button
                name='new_attachment_add'
                className='flex items-center justify-center gap-[10px] text-xl font-medium'
            onClick={() => { setOpen(true) }}
            >
                <AddIcon />
                <span>Add attachment</span>
            </Button>

            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={open || adding}>

                {adding && <p>Ading attachment</p>}

                {
                    open && !adding && <div
                    className='p-5 pt-10 rounded-xl bg-white text-black text-[18px] flex flex-col gap-[10px] relative w-[600px] max-h-[80vh] overflow-auto'
                    style={{
                        scrollbarWidth: "none"
                    }}>
        
                    <div
                        className='absolute top-[12px] right-[12px] cursor-pointer'
                        onClick={() => { setOpen(false) }}>
                        <CloseIcon />
                    </div>

                    <div
                    className='w-full grid grid-cols-2 gap-5'>

                    {
                        availableAttachments.length === 0 ? <p>No attachments available </p>
                        :
                        availableAttachments.map((attachment, index) => {
                            console.log(attachment)
                            return(
                                <div
                                key={index}>

{
                  attachment.images.length === 0 ?
                    <Image
                      src={"https://wallpapercave.com/wp/wp12859144.jpg"}
                      alt='attatchment_image'
                      className='w-full h-44 object-cover rounded-md'
                      unoptimized={true}
                      width={300}
                      height={200} />
                    :
                    <Swiper
                      modules={[Autoplay, Pagination]}
                      spaceBetween={0}
                      slidesPerView={1}
                      loop={true}
                      pagination={true}
                      autoplay={true}
                      className='w-full h-fit'>
                      {
                        attachment.images.map((image, index) => {
                          return (
                            <SwiperSlide key={index}>
                              <Image
                                src={image}
                                alt='tractor_image'
                                className='w-full h-44 object-cover rounded-md'
                                width={300}
                                height={400}
                                unoptimized={true} />
                            </SwiperSlide>
                          )
                        })
                      }
                    </Swiper>
                }
        
                <button
                    name='submit_button'
                    className='py-[10px] w-full bg-black font-bold text-white rounded-md mt-2'
                    onClick={() => { handleAddAttachment(attachment.id) }}
                    >
                    Add
                </button>

                                </div>
                            )
                        })
                    }

                    </div>
        
                </div>
                }

            </Backdrop>
        </div>
    )
}

export default AddAttachment