"use client"

import { Inquiry } from '@/utils/Types/types';
import { useState, useEffect } from 'react'
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';

const InquiryPage = () => {
    const [loading, setLoading] = useState(false);
    const [inquiries, setInquiries] = useState<Inquiry[]>([])
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleRowClick = (inquiry: Inquiry) => {
        setSelectedInquiry(inquiry)
        setIsDialogOpen(true)
    }

    function fetchInquiries(){
        setLoading(true)
        renderInstance.get("/inquiry")
        .then((res)=>{ setInquiries(res.data) })
        .catch((err)=>{ errorMessage("Error fetching inquiries") })
        .finally(()=>{ setLoading(false) })
    }

    useEffect(()=>{
        fetchInquiries()
    },[])

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Inquiry List</h1>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Tractor Type</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Created At</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ?
                        <p>Loading all inquiries</p>
                        :
                        inquiries.length === 0 ?
                            <p>No inquiries available</p>
                            :
                            inquiries.map((inquiry, i) => (
                                <TableRow key={i} onClick={() => handleRowClick(inquiry)} className="cursor-pointer">
                                    <TableCell>{`Hola_0_${i}_${inquiry.id.slice(-5)}`}</TableCell>
                                    <TableCell>{`${inquiry.first_name} ${inquiry.last_name}`}</TableCell>
                                    <TableCell>{inquiry.tractor_type}</TableCell>
                                    <TableCell>{inquiry.budget}</TableCell>
                                    <TableCell>{new Date(inquiry.createdAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                </TableBody>
            </Table>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className='max-h-[90vh] overflow-auto' style={{scrollbarWidth: "none"}}>
                    <DialogHeader>
                        <DialogTitle>Inquiry Details</DialogTitle>
                    </DialogHeader>
                    {selectedInquiry && (
                        <div className="grid gap-4 max-h-[90vh] overflow-auto" style={{ scrollbarWidth: "none" }}>
                            <div>
                                <h3 className="font-semibold">Name</h3>
                                <p>{`${selectedInquiry.first_name} ${selectedInquiry.last_name}`}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Email</h3>
                                <p>{selectedInquiry.email}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Phone</h3>
                                <p>{selectedInquiry.phone}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Tractor Type</h3>
                                <p>{selectedInquiry.tractor_type}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Budget</h3>
                                <p>{selectedInquiry.budget}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Message</h3>
                                <p>{selectedInquiry.message}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Created At</h3>
                                <p>{new Date(selectedInquiry.createdAt).toLocaleString()}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Updated At</h3>
                                <p>{new Date(selectedInquiry.updatedAt).toLocaleString()}</p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default InquiryPage