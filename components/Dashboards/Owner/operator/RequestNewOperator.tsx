"use client"

import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { Operator, Store } from '@/utils/Types/types'
import { useCookie } from 'next-cookie'
import { useEffect, useState } from 'react'
import OperatorCard from './OpertorCard'
import { Label } from '@/components/ui/label'
import { CircleAlert, Plus, Watch, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { requestNewOperatorTranslations } from './RequestNewOperatorTranslations'
import TranslatedText from '@/components/Menubar/TranslatedText'

interface user {
    userId: string;
    image: string;
    name: string;
    email: string;
}

const RequestNewOperator = () => {
    const [operators, setOperators] = useState<Operator[]>([])
    const [fetching, setFetching] = useState(false)

    const [stores, setStores] = useState<Store[]>([])
    const [fetchingStore, setFetchingStore] = useState(false)

    const [requesting, setRequesting] = useState(false)

    const [selectedOperator, setSelectedOperator] = useState("")
    const [selectedStore, setSelectedStore] = useState("")
    
    const [priceTypes, setPriceTypes] = useState<{ type: string; value: string }[]>([{ type: '', value: '' }]);
    const [description, setDescription] = useState("")

    const { cookie } = useCookie()
    const user: user = cookie.get("user")
    const access_token = cookie.get("access_token")
  
  const priceTypeOptions = [
    { value: 'hourly', label: 'Price per Hour' },
    { value: 'monthly', label: 'Price per Month' },
    { value: 'job', label: 'Price per Job' },
  ];

  const extractCosts = () => {
    const costPerJob = priceTypes.find(pt => pt.type === 'job')?.value || '';
    const costPerHour = priceTypes.find(pt => pt.type === 'hourly')?.value || '';
    const costPerMonth = priceTypes.find(pt => pt.type === 'monthly')?.value || '';
    return { costPerJob, costPerHour, costPerMonth };
};

    const addPriceType = () => {
        if (priceTypes.length < 3) {
          setPriceTypes([...priceTypes, { type: '', value: '' }]);
        }
      };

      const removePriceType = (indexToRemove: number) => {
        setPriceTypes(priceTypes.filter((_, index) => index !== indexToRemove));
      };
      
      const updatePriceType = (index: number, field: 'type' | 'value', value: string) => {
        const newPriceTypes = [...priceTypes];
        newPriceTypes[index][field] = value;
        setPriceTypes(newPriceTypes);
      };

    function fetchAllOperators() {
        setFetching(true)
        renderInstance.get(`/owner/get-operators-not-in-store/${user.userId}`)
            .then((res) => { setOperators(res.data) })
            .catch((err) => { errorMessage("Error fetching operators") })
            .finally(() => { setFetching(false) })
    }

    function fetchOwner() {
        setFetchingStore(true)
        renderInstance.get(`/owner/${user.userId}`)
            .then((res) => {
                setStores(res.data.stores)
            }).catch((err) => {
                errorMessage("Error fetching user detaild")
            }).finally(()=>{setFetchingStore(false)})
    }

    function handleRequest() {
        const { costPerJob, costPerHour, costPerMonth } = extractCosts();
        
        if(!costPerJob || !costPerHour || !costPerMonth){
          errorMessage("All cost details are required")
          return
        }

        if(!description){
            errorMessage("Please provide a description")
            return
        }
        
          setRequesting(true)
          renderInstance.patch(`/store/requestToAddOperator/${selectedStore}/${selectedOperator}`, {
            cost_per_job: costPerJob,
            cost_per_hour: costPerHour,
            cost_per_month: costPerMonth,
            note: description
          }, {
              headers: {
                  Authorization: `Bearer ${access_token}`,
              }
          }).then((res) => {
              // Logic to fetch all request
              successMessage("Requested")
          }).catch((err) => {
              if (err.response && err.response.status && err.response.data.message) {
                  errorMessage(err.response.data.message)
              }  else {
                  errorMessage("Error in requesting")
              }
          }).finally(() => {
              setRequesting(false)
          })
      }

    useEffect(()=>{
        if(user){
            fetchOwner()
        }
    },[])

    useEffect(() => {
        if (user) {
            fetchAllOperators()
        }
    }, [])

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>
                <TranslatedText greetings={requestNewOperatorTranslations.newOperator} />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-auto" style={{ scrollbarWidth: "none" }}>
                    <DialogHeader>
                        <DialogTitle><TranslatedText greetings={requestNewOperatorTranslations.addOperator} /></DialogTitle>
                        <DialogDescription><TranslatedText greetings={requestNewOperatorTranslations.nearbyOperator} /></DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <div className="flex justify-between">
                                <Label htmlFor="operator"><TranslatedText greetings={requestNewOperatorTranslations.sendRequestTo} /></Label>
                                <CircleAlert size={10} />
                            </div>
                            <Select onValueChange={e=>{setSelectedOperator(e)}}>
                                <SelectTrigger id="operator">
                                    <SelectValue placeholder={<TranslatedText greetings={requestNewOperatorTranslations.selectOperator} />} />
                                </SelectTrigger>
                                {
                                    fetching ?
                                    <p><TranslatedText greetings={requestNewOperatorTranslations.loadingOperators} /></p>
                                    :
                                <SelectContent>
                                    {
                                        operators.length === 0 ?
                                        <p><TranslatedText greetings={requestNewOperatorTranslations.noOperatorsAvailable} /></p>
                                        :
                                        operators.map((operator, index)=>{
                                            return(
                                                <SelectItem value={operator.id} key={index}>
                                                    {operator.user.first_name} {operator.user.middle_name ?? ""} {operator.user.last_name}
                                                </SelectItem>
                                            )
                                        })
                                    }
                                </SelectContent>
                                }
                            </Select>
                        </div>
                        {priceTypes.map((priceType, index) => (
                            <div key={index} className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <Label><TranslatedText greetings={requestNewOperatorTranslations.priceType} /></Label>
                                    <Select
                                        value={priceType.type}
                                        onValueChange={(value) => updatePriceType(index, 'type', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={<TranslatedText greetings={requestNewOperatorTranslations.selectType} />} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {priceTypeOptions.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                    disabled={priceTypes.some(pt => pt.type === option.value)}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1">
                                    <Label><TranslatedText greetings={requestNewOperatorTranslations.value} /> ($)</Label>
                                    <div className="flex items-center">
                                        <Input
                                            type="number"
                                            min="0"
                                            max="1000"
                                            placeholder="0.00"
                                            value={priceType.value}
                                            onChange={(e) => {
                                                if(parseInt(e.target.value) < 1){
                                                    return
                                                }
                                                updatePriceType(index, 'value', e.target.value)
                                            }}
                                        />
                                        {index > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="ml-2"
                                                onClick={() => removePriceType(index)}
                                            >
                                                <X size={16} className="text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {priceTypes.length < 3 && (
                            <Button
                                variant="outline"
                                onClick={addPriceType}
                                className="w-full mt-2"
                            >
                                <Plus size={16} className="mr-2" /> <TranslatedText greetings={requestNewOperatorTranslations.addPriceType} />
                            </Button>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="store"><TranslatedText greetings={requestNewOperatorTranslations.store} /></Label>
                            <Select onValueChange={e=>{setSelectedStore(e)}}>
                                <SelectTrigger id="store">
                                    <SelectValue placeholder={<TranslatedText greetings={requestNewOperatorTranslations.newStore} />} />
                                </SelectTrigger>
                                <SelectContent>
                                    {
                                        fetchingStore ?
                                        <p><TranslatedText greetings={requestNewOperatorTranslations.loadingStores} /></p>
                                        :
                                        stores.length === 0 ?
                                        <p><TranslatedText greetings={requestNewOperatorTranslations.noStoresCreated} /></p>
                                        :
                                        stores.map((store, index) => (
                                            <SelectItem key={index} value={store.id}>
                                                {store.name}
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description"><TranslatedText greetings={requestNewOperatorTranslations.message} /></Label>
                            <Textarea
                                id="description"
                                placeholder="Add details about the payment request"
                                onChange={e=>{ setDescription(e.target.value) }}
                                value={description}
                            />
                        </div>
                        <div className="bg-gray-100 p-2 rounded-md flex items-center gap-2">
                            <Watch size={16} className="text-gray-600" />
                            <p className="text-sm text-muted-foreground">
                            <TranslatedText greetings={requestNewOperatorTranslations.requestLinkExpires} />
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-between">
                        <div className="flex gap-4 w-full justify-center">
                            <DialogClose asChild>
                            <Button variant="outline" className="flex-1">
                            <TranslatedText greetings={requestNewOperatorTranslations.cancel} />
                            </Button>
                            </DialogClose>
                            <Button className="flex-1" disabled={requesting} onClick={()=>{ handleRequest() }}>
                                {
                                    requesting ? <TranslatedText greetings={requestNewOperatorTranslations.requesting} /> : <TranslatedText greetings={requestNewOperatorTranslations.request} />
                                }
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
        </Dialog>
    )
}

export default RequestNewOperator