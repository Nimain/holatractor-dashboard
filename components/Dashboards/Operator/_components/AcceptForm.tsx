'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { PlusCircle } from 'lucide-react'
import { useParams } from 'next/navigation'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { CircularProgress } from '@mui/material'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { useCookie } from "next-cookie"

export default function AcceptanceForm({ id, store_id }: { id: string, store_id: string }) {
  const [formData, setFormData] = useState({
    field1: '',
    field2: '',
    field3: '',
    textArea: ''
  })
  const [loading, setLoading] = useState(false)

  const { slug } = useParams()

  const { cookie } = useCookie()
  const access_token = cookie.get("access_token")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.field1 || !formData.field2 || !formData.field2 || !formData.textArea) {
      errorMessage("Give all the details please")
      return
    }

    setLoading(true)
    renderInstance.post('/operator/addOperatorToStore', {
      operator_id: slug,
      store_id,
      cost_per_job: formData.field1,
      cost_per_hour: formData.field2,
      cost_per_month: formData.field3,
      note: formData.textArea,
      status: "Active",
      request_id: id
    },{
      headers: {
          Authorization: `Bearer ${access_token}`,
        }
  }).then(() => {
      successMessage("Congratulations")
      window.location.reload()
    }).catch((err) => {
      if (err.response && err.response.status === 404 && err.response.data.message === "User is not found") {
        errorMessage("User not found")
      } else if (err.response && err.response.status === 404 && err.response.data.message === "Request not found") {
        errorMessage("Request not found")
      } else if (err.response && err.response.status === 404 && err.response.data.message === "Operator not found") {
        errorMessage("Operator not found")
      } else if (err.response && err.response.status === 404 && err.response.data.message === "Store not found") {
        errorMessage("Store not found")
      } else if (err.response && err.response.status === 400 && err.response.data.message === "The operator and store hasn't make any request") {
        errorMessage("The operator and store hasn't make any request")
      } else {
        errorMessage("Some error occurred")
      }
    }).finally(() => {
      setLoading(false)
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Accept
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Acceptance Form</DialogTitle>
        </DialogHeader>
        {
          loading ? <CircularProgress />
            :
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="field1">Cost per job</Label>
                <Input
                  id="field1"
                  name="field1"
                  type="number"
                  placeholder="Enter a number"
                  value={formData.field1}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="field2">Cost per hour</Label>
                <Input
                  id="field2"
                  name="field2"
                  type="number"
                  placeholder="Enter a number"
                  value={formData.field2}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="field3">Cost per month</Label>
                <Input
                  id="field3"
                  name="field3"
                  type="number"
                  placeholder="Enter a number"
                  value={formData.field3}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="textArea">Message</Label>
                <Textarea
                  id="textArea"
                  name="textArea"
                  placeholder="Enter your text here"
                  value={formData.textArea}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Submit</Button>
            </form>
        }
      </DialogContent>
    </Dialog>
  )
}