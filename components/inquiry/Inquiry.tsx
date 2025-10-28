"use client"

import { Inquiry } from '@/utils/Types/types';
import { useState, useEffect } from 'react'
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const InquiryPage = () => {
    const [loading, setLoading] = useState(false);
    const [inquiries, setInquiries] = useState<Inquiry[]>([])
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleRowClick = (inquiry: Inquiry) => {
        setSelectedInquiry(inquiry)
        setIsDialogOpen(true)
    }

    function fetchInquiries() {
        setLoading(true)
        renderInstance.get("/inquiry")
            .then((res) => { setInquiries(res.data) })
            .catch((err) => { errorMessage("Error fetching inquiries") })
            .finally(() => { setLoading(false) })
    }

    useEffect(() => {
        fetchInquiries()
    }, [])

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 px-4 pt-4">
                <h1 className="text-2xl font-bold">Inquiry List</h1>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchInquiries} 
                    disabled={loading}
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh
                </Button>
            </div>

            <Card className="flex-1 mx-4 mb-4 overflow-hidden bg-[#e5e5e5]">
                <CardContent className="p-0 h-full overflow-auto">
                    <div className="w-full overflow-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background z-10">
                                <TableRow>
                                    <TableHead className="w-24">ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="hidden md:table-cell">Tractor Type</TableHead>
                                    <TableHead className="hidden sm:table-cell">Budget</TableHead>
                                    <TableHead className="hidden lg:table-cell">Created At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                            <p>Loading inquiries...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : inquiries.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            <p>No inquiries available</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    inquiries.map((inquiry, i) => (
                                        <TableRow 
                                            key={i} 
                                            onClick={() => handleRowClick(inquiry)} 
                                            className="cursor-pointer hover:bg-muted/50"
                                        >
                                            <TableCell className="font-mono text-xs">{`Hola_0_${i}_${inquiry.id.slice(-5)}`}</TableCell>
                                            <TableCell>{`${inquiry.first_name} ${inquiry.last_name}`}</TableCell>
                                            <TableCell className="hidden md:table-cell">{inquiry.tractor_type}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{inquiry.budget}</TableCell>
                                            <TableCell className="hidden lg:table-cell">{new Date(inquiry.createdAt).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>Inquiry Details</DialogTitle>
                    </DialogHeader>
                    {selectedInquiry && (
                        <div className="grid gap-4">
                            <DetailItem label="Name" value={`${selectedInquiry.first_name} ${selectedInquiry.last_name}`} />
                            <DetailItem label="Email" value={selectedInquiry.email} />
                            <DetailItem label="Phone" value={selectedInquiry.phone} />
                            <DetailItem label="Tractor Type" value={selectedInquiry.tractor_type} />
                            <DetailItem label="Budget" value={selectedInquiry.budget} />
                            <DetailItem label="Message" value={selectedInquiry.message} />
                            <DetailItem label="Created At" value={new Date(selectedInquiry.createdAt).toLocaleString()} />
                            <DetailItem label="Updated At" value={new Date(selectedInquiry.updatedAt).toLocaleString()} />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Helper component for dialog details
const DetailItem = ({ label, value }: { label: string, value: string }) => (
    <div>
        <h3 className="font-semibold text-sm text-muted-foreground">{label}</h3>
        <p className="mt-1">{value}</p>
    </div>
)

export default InquiryPage