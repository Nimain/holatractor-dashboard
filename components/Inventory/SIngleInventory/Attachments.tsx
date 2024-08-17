"use client"

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Pagination, Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import { Attachment } from '@/utils/Types/types';
import { useCookie } from 'next-cookie';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';
import AddAttachment from './AddAttachment';

const Attachments = ({ tractorId }: { tractorId: string }) => {
    const [allAttachmentsSelected, setAllAttachmentsSelected] = useState<Attachment[]>([])
    const [allAttachments, setAllAttachments] = useState<Attachment[]>([])
    const [fetchingAttachments, setFetchingAttachments] = useState(false)
  
    const { cookie } = useCookie()
      const access_token = cookie.get("access_token")
  
    function fetchAllAttachmentsSelected() {
            setFetchingAttachments(true)
            renderInstance.get('/attachment',{
              headers: {
                  Authorization: `Bearer ${access_token}`,
              }
          })
                .then((res) => {
                    if (res.status === 200) setAllAttachments(res.data)
                }).catch((err) => {
                    errorMessage("Error in fetching inventory lists")
                }).finally(() => { setFetchingAttachments(false) })
        
    }
  
    function fetchAllAttachments() {
      if (tractorId) {
        renderInstance.get(`/attachment/AttachmentsWithTractors/${tractorId}`)
          .then((res) => {
            setAllAttachmentsSelected(res.data)
          }).catch((err) => {
            errorMessage("Error fething attachments")
          })
      }
    }
  
    useEffect(() => { 
      fetchAllAttachments()
      fetchAllAttachmentsSelected()
     }, [tractorId])
  
    return (
      <div 
      className="w-full space-y-4">
  
        <div
        className='w-full flex items-center justify-between'>
  
          <p>
            Total attachments: {allAttachmentsSelected.length}
          </p>
  
  <AddAttachment allAttachments={allAttachments} selectedAttachments={allAttachmentsSelected} tractorId={tractorId} />
  
        </div>
        
      <div
        className='w-full grid grid-cols-3 gap-[20px]'>
  
        {
          allAttachmentsSelected.length === 0 ?
            <p>0 attachments associated with this tractor</p>
            :
            allAttachmentsSelected.map((attachment, i) => {
              return (
                <div
                  className='w-full h-[200px]'
                  key={i}>
  
                  {
                    attachment.images.length === 0 ?
                      <Image
                        src={"https://wallpapercave.com/wp/wp12859144.jpg"}
                        alt='attatchment_image'
                        className='w-full h-full object-cover rounded-md'
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
                        className='w-full h-full'>
                        {
                          attachment.images.map((image, index) => {
                            return (
                              <SwiperSlide key={index}>
                                <Image
                                  src={image}
                                  alt='tractor_image'
                                  className='w-full h-full object-cover rounded-md'
                                  width={300}
                                  height={400}
                                  unoptimized={true} />
                              </SwiperSlide>
                            )
                          })
                        }
                      </Swiper>
                  }
  
                </div>
              )
            })
        }
  </div>
  
      </div>
    )
}

export default Attachments