'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { CircleCheck, PlusCircle, X } from 'lucide-react'
import { Subscriptions, SubscriptionType } from '@/utils/Types/types'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { useCookie } from 'next-cookie'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { CircularProgress } from '@mui/material'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscriptions[]>([])
  const [fetchSubscriptions, setFetchSubscriptions] = useState(false)

  const [addSubscription, setAddSubscription] = useState(false)
  const [formData, setFormData] = useState<Partial<Subscriptions>>({
    name: '',
    type: SubscriptionType.Basic,
    actual_cost: 0,
    discount_cost: 0,
    features: [],
    focused_features: [],
    total_days: 0,
    for_owner: false,
    for_dealer: false,
  })
  const [newFeature, setNewFeature] = useState('')
  const [newFocusedFeature, setNewFocusedFeature] = useState('')

  const [editSubscription, setEditSubscription] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<Subscriptions>>({
    name: '',
    type: SubscriptionType.Basic,
    actual_cost: 0,
    discount_cost: 0,
    features: [],
    focused_features: [],
    total_days: 0,
    for_owner: false,
    for_dealer: false,
    total_stores: 0,
    total_operators: 0,
    total_tractors: 0,
    total_attachments: 0
  })
  const [editFeature, setEditFeature] = useState('')
  const [editFocusedFeature, setEditFocusedFeature] = useState('')

  const [deleteSubscription, setDeleteSubscription] = useState(false)
  const [idDeleting, setIsDeleting] = useState(false)

  const { cookie } = useCookie()
  const access_token = cookie.get("access_token")

  // Fetch subscriptions from API
  const fetchAllSubscriptions = () => {
    setFetchSubscriptions(true)
    renderInstance.get("/subscription")
      .then((res) => {
        setSubscriptions(res.data)
      }).finally(() => {
        setFetchSubscriptions(false)
      })
  }

  useEffect(() => {
    fetchAllSubscriptions()
  }, [])

  const handleDelete = (id: string) => {
    setIsDeleting(true)
    renderInstance.delete(`/subscription/${id}`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }).then(() => {
      successMessage("Deleted")
      fetchAllSubscriptions()
      setDeleteSubscription(false)
    }).catch((err) => {
      errorMessage("Error deleting")
    }).finally(() => {
      setIsDeleting(false)
    })
  }

  const handleEdit = (id: string) => {
    if (!editFormData.name) {
      errorMessage("Please give the name")
      return
    }
    if (editFormData.actual_cost === 0) {
      errorMessage("Please give the cost")
      return
    }
    if (typeof (editFormData.actual_cost) !== "undefined" && editFormData.actual_cost <= 0) {
      errorMessage("Please give the cost")
      return
    }
    if (typeof (editFormData.discount_cost) !== "undefined" && typeof (editFormData.actual_cost) !== "undefined" && editFormData.discount_cost > 0 && editFormData.actual_cost < editFormData.discount_cost) {
      errorMessage("Discount cost is greater than actual cost")
      return
    }
    if (editFormData.features?.length === 0 && editFormData.focused_features?.length === 0) {
      errorMessage("please give atleast one feature")
      return
    }
    if (typeof (editFormData.total_days) !== "undefined" && editFormData.total_days <= 0) {
      errorMessage("Please give the total days")
      return
    }
    if (!editFormData.for_owner && !editFormData.for_dealer) {
      errorMessage("Please specify target user")
      return
    }

    setIsDeleting(true)
    renderInstance.patch(`/subscription/${id}`, { 
      ...editFormData,
    }, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }).then(() => {
      successMessage("Updated")
      fetchAllSubscriptions()
      setEditSubscription(false)
    }).catch((err) => {
      errorMessage("Error updating")
    }).finally(() => {
      setIsDeleting(false)
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({ ...formData, [name]: checked })
  }

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData({ ...formData, features: [...(formData.features || []), newFeature.trim()] })
      setNewFeature('')
    }
  }

  const handleRemoveFeature = (index: number) => {
    const updatedFeatures = formData.features?.filter((_, i) => i !== index) || []
    setFormData({ ...formData, features: updatedFeatures })
  }

  const handleAddFocusedFeature = () => {
    if (newFocusedFeature.trim()) {
      setFormData({ ...formData, focused_features: [...(formData.focused_features || []), newFocusedFeature.trim()] })
      setNewFocusedFeature('')
    }
  }

  const handleRemoveFocusedFeature = (index: number) => {
    const updatedFocusedFeatures = formData.focused_features?.filter((_, i) => i !== index) || []
    setFormData({ ...formData, focused_features: updatedFocusedFeatures })
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditFormData({ ...editFormData, [name]: value })
  }

  const handleEditSelectChange = (name: string, value: string) => {
    setEditFormData({ ...editFormData, [name]: value })
  }

  const handleEditSwitchChange = (name: string, checked: boolean) => {
    setEditFormData({ ...editFormData, [name]: checked })
  }

  const handleAddEditFeature = () => {
    if (editFeature.trim()) {
      setEditFormData({ ...editFormData, features: [...(editFormData.features || []), editFeature.trim()] })
      setEditFeature('')
    }
  }

  const handleRemoveEditFeature = (index: number) => {
    const updatedFeatures = editFormData.features?.filter((_, i) => i !== index) || []
    setEditFormData({ ...editFormData, features: updatedFeatures })
  }

  const handleAddEditFocusedFeature = () => {
    if (editFocusedFeature.trim()) {
      setEditFormData({ ...editFormData, focused_features: [...(editFormData.focused_features || []), editFocusedFeature.trim()] })
      setEditFocusedFeature('')
    }
  }

  const handleRemoveEditFocusedFeature = (index: number) => {
    const updatedFocusedFeatures = editFormData.focused_features?.filter((_, i) => i !== index) || []
    setEditFormData({ ...editFormData, focused_features: updatedFocusedFeatures })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // onSubmit(formData as Subscriptions)
    // onClose()
    if (!formData.name) {
      errorMessage("Please give the name")
      return
    }
    if (formData.actual_cost === 0) {
      errorMessage("Please give the cost")
      return
    }
    if (typeof (formData.actual_cost) !== "undefined" && formData.actual_cost <= 0) {
      errorMessage("Please give the cost")
      return
    }
    if (typeof (formData.discount_cost) !== "undefined" && typeof (formData.actual_cost) !== "undefined" && formData.discount_cost > 0 && formData.actual_cost < formData.discount_cost) {
      errorMessage("Discount cost is greater than actual cost")
      return
    }
    if (formData.features?.length === 0 && formData.focused_features?.length === 0) {
      errorMessage("please give atleast one feature")
      return
    }
    if (typeof (formData.total_days) !== "undefined" && formData.total_days <= 0) {
      errorMessage("Please give the total days")
      return
    }
    if (!formData.for_owner && !formData.for_dealer) {
      errorMessage("Please specify target user")
      return
    }

    setIsDeleting(true)
    renderInstance.post("/subscription", { 
      ...formData,  
      }, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }).then(() => {
      successMessage("Added")
      fetchAllSubscriptions()
      setAddSubscription(false)
    }).catch((err) => {
      errorMessage("Error adding subscription")
    }).finally(() => {
      setIsDeleting(false)
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-end items-center mb-6">

        <Dialog open={addSubscription} onOpenChange={setAddSubscription}>
          <DialogTrigger asChild>
            <Button onClick={() => setAddSubscription(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Subscription
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-auto" style={{ scrollbarWidth: "none" }}>
            <DialogHeader>
              <DialogTitle>Create New Subscription</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SubscriptionType.Basic}>Basic</SelectItem>
                    <SelectItem value={SubscriptionType.Premium}>Premium</SelectItem>
                    <SelectItem value={SubscriptionType.Business}>Business</SelectItem>
                    <SelectItem value={SubscriptionType.Custom}>Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="actual_cost">Actual Cost</Label>
                  <Input
                    id="actual_cost"
                    name="actual_cost"
                    type="number"
                    value={formData.actual_cost}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_cost">Discount Cost</Label>
                  <Input
                    id="discount_cost"
                    name="discount_cost"
                    type="number"
                    value={formData.discount_cost}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Features</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add a feature"
                  />
                  <Button type="button" onClick={handleAddFeature} size="icon">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <ul className="space-y-2">
                  {formData.features?.map((feature, index) => (
                    <li key={index} className="flex items-center justify-between bg-secondary p-2 rounded">
                      <span>{feature}</span>
                      <Button type="button" onClick={() => handleRemoveFeature(index)} size="icon" variant="ghost">
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <Label>Special Features</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newFocusedFeature}
                    onChange={(e) => setNewFocusedFeature(e.target.value)}
                    placeholder="Add a focused feature"
                  />
                  <Button type="button" onClick={handleAddFocusedFeature} size="icon">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <ul className="space-y-2">
                  {formData.focused_features?.map((feature, index) => (
                    <li key={index} className="flex items-center justify-between bg-secondary p-2 rounded">
                      <span>{feature}</span>
                      <Button type="button" onClick={() => handleRemoveFocusedFeature(index)} size="icon" variant="ghost">
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_days">Total Days</Label>
                <Input
                  id="total_days"
                  name="total_days"
                  type="number"
                  value={formData.total_days}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="for_owner"
                  checked={formData.for_owner}
                  onCheckedChange={(checked) => handleSwitchChange('for_owner', checked)}
                />
                <Label htmlFor="for_owner">For Owners</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="for_dealer"
                  checked={formData.for_dealer}
                  onCheckedChange={(checked) => handleSwitchChange('for_dealer', checked)}
                />
                <Label htmlFor="for_dealer">For Dealers</Label>
              </div>
              {
                formData.for_owner && <> 
                <div className="space-y-2">
                <Label htmlFor="total_stores">Total stores</Label>
                <Input
                  id="total_stores"
                  name="total_stores"
                  type="number"
                  value={formData.total_stores}
                  onChange={handleInputChange}
                  required
                />
              </div> 
                <div className="space-y-2">
                <Label htmlFor="total_operators">Total operators</Label>
                <Input
                  id="total_operators"
                  name="total_operators"
                  type="number"
                  value={formData.total_operators}
                  onChange={handleInputChange}
                  required
                />
              </div> 
                <div className="space-y-2">
                <Label htmlFor="total_tractors">Total tractors</Label>
                <Input
                  id="total_tractors"
                  name="total_tractors"
                  type="number"
                  value={formData.total_tractors}
                  onChange={handleInputChange}
                  required
                />
              </div> 
                <div className="space-y-2">
                <Label htmlFor="total_attachments">Total attachments</Label>
                <Input
                  id="total_attachments"
                  name="total_attachments"
                  type="number"
                  value={formData.total_attachments}
                  onChange={handleInputChange}
                  required
                />
              </div> 
              </>
              }
              {
                idDeleting ?
                <CircularProgress />
                :
              <Button type="submit" className="w-full">
                Create Subscription
              </Button>
              }
            </form>
          </DialogContent>
        </Dialog>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fetchSubscriptions ?
          <p>Loading subscription details</p>
          :
          subscriptions.length === 0 ?
            <p>No subscriptions present</p>
            :
            subscriptions.map(subscription => (
              <Card key={subscription.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {subscription.name}
                    <Badge>{subscription.type}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {subscription.for_owner ? 'For Owners' : ''}
                    {subscription.for_owner && subscription.for_dealer ? ' & ' : ''}
                    {subscription.for_dealer ? 'For Dealers' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-2xl font-bold mb-2">${subscription.actual_cost.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    <s>${subscription.actual_cost.toFixed(2)}</s> • {subscription.total_days} days
                  </p>
                  <ul className="list-disc list-inside my-2">
                    {subscription.focused_features.map((feature, index) => (
                      <li key={index} className="text-sm font-medium flex gap-2 items-center text-green-500">
                        <CircleCheck /> <p className="text-green-500">{feature}</p>
                      </li>
                    ))}
                  </ul>
                  <ul className="list-disc list-inside mb-4">
                    {subscription.features.map((feature, index) => (
                      <li key={index} className="text-sm flex gap-2 items-center">
                        <CircleCheck />{feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Dialog open={editSubscription} onOpenChange={setEditSubscription}>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => {
                        setEditFormData(subscription)
                        setEditSubscription(true)
                      }}>
                        Edit
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-auto" style={{ scrollbarWidth: "none" }}>
                      <DialogHeader>
                        <DialogTitle>Update Subscription</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            name="name"
                            value={editFormData.name}
                            onChange={handleEditInputChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="type">Type</Label>
                          <Select
                            value={editFormData.type}
                            onValueChange={(value) => handleEditSelectChange('type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={SubscriptionType.Basic}>Basic</SelectItem>
                              <SelectItem value={SubscriptionType.Premium}>Premium</SelectItem>
                              <SelectItem value={SubscriptionType.Business}>Business</SelectItem>
                              <SelectItem value={SubscriptionType.Custom}>Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="actual_cost">Actual Cost</Label>
                            <Input
                              id="actual_cost"
                              name="actual_cost"
                              type="number"
                              value={editFormData.actual_cost}
                              onChange={handleEditInputChange}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="discount_cost">Discount Cost</Label>
                            <Input
                              id="discount_cost"
                              name="discount_cost"
                              type="number"
                              value={editFormData.discount_cost}
                              onChange={handleEditInputChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Features</Label>
                          <div className="flex space-x-2">
                            <Input
                              value={editFeature}
                              onChange={(e) => setEditFeature(e.target.value)}
                              placeholder="Add a feature"
                            />
                            <Button type="button" onClick={handleAddEditFeature} size="icon">
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </div>
                          <ul className="space-y-2">
                            {editFormData.features?.map((feature, index) => (
                              <li key={index} className="flex items-center justify-between bg-secondary p-2 rounded">
                                <span>{feature}</span>
                                <Button type="button" onClick={() => handleRemoveEditFeature(index)} size="icon" variant="ghost">
                                  <X className="h-4 w-4" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <Label>Special Features</Label>
                          <div className="flex space-x-2">
                            <Input
                              value={editFocusedFeature}
                              onChange={(e) => setEditFocusedFeature(e.target.value)}
                              placeholder="Add a focused feature"
                            />
                            <Button type="button" onClick={handleAddEditFocusedFeature} size="icon">
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </div>
                          <ul className="space-y-2">
                            {editFormData.focused_features?.map((feature, index) => (
                              <li key={index} className="flex items-center justify-between bg-secondary p-2 rounded">
                                <span>{feature}</span>
                                <Button type="button" onClick={() => handleRemoveEditFocusedFeature(index)} size="icon" variant="ghost">
                                  <X className="h-4 w-4" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="total_days">Total Days</Label>
                          <Input
                            id="total_days"
                            name="total_days"
                            type="number"
                            value={editFormData.total_days}
                            onChange={handleEditInputChange}
                            required
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="for_owner"
                            checked={editFormData.for_owner}
                            onCheckedChange={(checked) => handleEditSwitchChange('for_owner', checked)}
                          />
                          <Label htmlFor="for_owner">For Owners</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="for_dealer"
                            checked={editFormData.for_dealer}
                            onCheckedChange={(checked) => handleEditSwitchChange('for_dealer', checked)}
                          />
                          <Label htmlFor="for_dealer">For Dealers</Label>
                        </div>
                        {
                          idDeleting ?
                          <CircularProgress />
                          :
                        <Button onClick={() => { handleEdit(subscription.id) }} className="w-full">
                          Update
                        </Button>
                        }
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={deleteSubscription} onOpenChange={setDeleteSubscription}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">Delete</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogTitle>
                        Are you sure you want to delete it?
                      </DialogTitle>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteSubscription(false)}>Cancel</Button>
                        {
                          idDeleting ?
                            <CircularProgress />
                            :
                            <Button variant="destructive" onClick={() => handleDelete(subscription.id)}>Delete</Button>
                        }
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            ))}
      </div>
    </div>
  )
}