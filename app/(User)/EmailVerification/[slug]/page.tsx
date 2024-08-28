"use client"

import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { useCookie } from 'next-cookie'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const EmailVerification = () => {
    const [loading, setLoading] = useState(false)

    const { slug } = useParams()

    const { replace } = useRouter()

    const { cookie } = useCookie()
    const access_token = cookie.get("access_token")

    function verifyEmailToken(){
        setLoading(true)
        renderInstance.get(`/user/email_token_verify/${slug}`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
              },
        }).then((res)=>{
            successMessage("Email verified")
            setTimeout(() => {
                replace("/")
            }, 1000);
        }).catch((err)=>{
            errorMessage("Some error occurred")
        }).finally(()=>{ setLoading(false) })
    }

    useEffect(() => {
        if(slug) verifyEmailToken()
    }, [slug])
  return (
    <div className='w-full h-full flex items-center justify-center'>
        {
            loading && <p>Verifying</p>
        }
    </div>
  )
}

export default EmailVerification