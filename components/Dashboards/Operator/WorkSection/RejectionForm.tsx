"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { useCookie } from "next-cookie"
import { OperatorAddStoreReuests } from '@/utils/Types/types'

const RejectionForm = ({ request }: { request: OperatorAddStoreReuests; }) => {
  const [open, setOpen] = useState(false)

  const [formData, setFormData] = useState({
    field1: request.cost_per_job,
    field2: request.cost_per_hour,
    field3: request.cost_per_month,
    textArea: ''
  })
  const [loading, setLoading] = useState(false)

  const { cookie } = useCookie()
  const access_token = cookie.get("access_token")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (id: string) => {

    if (!formData.field1 || !formData.field2 || !formData.field2 || !formData.textArea) {
      errorMessage("Give all the details please")
      return
    }

    setLoading(true)
    renderInstance.patch(`/operator/rejectAddStoreRequest/${id}`, {
      cost_per_job: formData.field1,
      cost_per_hour: formData.field2,
      cost_per_month: formData.field3,
      note: formData.textArea,
    }, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      }
    }).then(() => {
      successMessage("Details submitted")
      setOpen(false)
    }).catch((err) => {
      if (err.response && err.response.status === 404 && err.response.data.message === "Request is not valid") {
        errorMessage("Request is not valid")
      } else if (err.response && err.response.status === 400 && err.response.data.message === "You are not allowed to perform this task") {
        errorMessage("You are not allowed to perform this task")
      } else {
        errorMessage("Some error occurred")
      }
    }).finally(() => {
      setLoading(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Reject</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Acceptance Form</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
          <Button onClick={() => { handleSubmit(request.id) }} className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default RejectionForm