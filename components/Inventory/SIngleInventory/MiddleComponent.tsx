"use client"

import { uploadFileToS3 } from '@/utils/AWS/FileUpload';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage, successMessage } from '@/utils/Toastify/Messages';
import { Backdrop, CircularProgress } from '@mui/material';
import { useCookie } from 'next-cookie';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react'
import { FileWithPath, useDropzone } from 'react-dropzone';
import { Pagination, Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import UploadFileIcon from '@mui/icons-material/UploadFile';

type MiddleComponentProps = {
  tractorImages: string[];
  tractorId: string;
};

const MiddleComponent = ({ tractorImages, tractorId }: MiddleComponentProps) => {

    const [selectedImage, setSelectedImage] = useState<FileWithPath[]>([]);
  const [imageUploading, setImageUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    setSelectedImage((prevImages) => [...prevImages, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': []
    },
    multiple: true,
  });

    const { cookie } = useCookie()
    const access_token = cookie.get("access_token")

    const router = useRouter()

    async function handleImageUpdate() {
        setImageUploading(true)

        let tractorImages
        if (selectedImage.length > 0) {
            const uploadPromises = selectedImage.map(async (image) => {
                const buffer = Buffer.from(await image.arrayBuffer());
                return uploadFileToS3(buffer, image.name);
            });

            const fileUrls = await Promise.all(uploadPromises);
            tractorImages = fileUrls
        }

        renderInstance.patch(`/tractor/${tractorId}/images`, { images: tractorImages }, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            }
        }).then((res) => {
            if (res.status === 200) {
                successMessage("Updated")
                setTimeout(() => {
                    router.refresh()
                }, 2000);
            }
        }).catch((err) => {
            if (err.response && err.response.status === 409 && err.response.data.message === "Tractor not found") errorMessage("Tractor not available")
            else if (err.response && err.response.status === 409 && err.response.data.message === "You are not allowed to update images") errorMessage("You are not allowed to update images")
            else errorMessage("Internal server error")
        }).finally(() => {
            setImageUploading(false)
        })
    }

  return (
    <div
            className='w-full grid grid-cols-2 gap-[20px]'>

            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={imageUploading}>
                <CircularProgress />
            </Backdrop>

            <div
                className='w-full h-[400px] flex items-center justify-center'>

                {
                    tractorImages.length === 0 ?
                        <Image
                            src={"https://wallpapercave.com/wp/wp13088808.jpg"}
                            alt='tractor_image'
                            className='w-full h-full object-cover rounded-xl'
                            width={300}
                            height={400}
                            unoptimized={true} />
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
                                tractorImages.map((image, index) => {
                                    return (
                                        <SwiperSlide key={index}>
                                            <Image
                                                src={image}
                                                alt='tractor_image'
                                                className='w-full h-full object-cover rounded-xl'
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

            <div
                className='w-full h-[400px] bg-white p-[20px] rounded-xl flex flex-col gap-[20px]'>

                <p className='text-[20px] font-bold'>
                    Upload files
                </p>

                <div>

                    <div {...getRootProps()} className='border-dashed border-[2px] border-blue-400 flex flex-col items-center justify-center p-[20px] text-blue-400 cursor-pointer'>
                        <input {...getInputProps()} />
                        <UploadFileIcon />

                        <p className='text-[18px] font-[600]'>Upload file</p>

                    </div>

                </div>

                <div
                    className='w-full my-[4px] flex items-center flex-wrap gap-[20px]'>

                    {
                        selectedImage.length > 0 && selectedImage.map((image, index) => {
                            return (
                                <Image
                                    alt='image'
                                    src={URL.createObjectURL(image)}
                                    key={index}
                                    width={80}
                                    height={80}
                                    className='object-cover w-[80px] h-[80px] cursor-pointer rounded-md' />
                            )
                        })
                    }

                </div>

                <input type="file" name="file_upload" id="file_upload" className='hidden' />

                <p className='text-[18px] font-[600]'>Uploaded files</p>

                <div
                    className='w-full flex items-center gap-[20px] text-[18px]'>

                    <button
                        name='cancel_button'
                        className='py-[10px] w-1/2 border-[2px] rounded-md border-black'>

                        Cancel

                    </button>

                    <button
                        name='cancel_button'
                        className='py-[10px] w-1/2 bg-blue-400 text-white rounded-md border-[2px] border-blue-400'
                        disabled={selectedImage.length === 0}
                        onClick={handleImageUpdate}>

                        {selectedImage.length === 0 ? "Select images" : "Submit"}

                    </button>

                </div>

            </div>

        </div>
  )
}

export default MiddleComponent