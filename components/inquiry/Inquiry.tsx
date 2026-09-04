"use client";

import { Inquiry } from "@/utils/Types/types";
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { errorMessage } from "@/utils/Toastify/Messages";
import { Card, CardContent } from "../ui/card";
import axios from "axios";

const InquiryPage = () => {
  const [loading, setLoading] = useState(false);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleRowClick = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setIsDialogOpen(true);
  };

  async function fetchInquiries() {
    setLoading(true);
    try {
      const res = await axios.get("/api/inquiry");
      const list = Array.isArray(res.data) ? res.data : [];
      setInquiries(list);
    } catch (err) {
      errorMessage("Error fetching inquiries");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInquiries();
  }, []);

  const filteredInquiries = inquiries.filter((inq: any) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      inq.id?.toLowerCase().includes(q) ||
      inq.first_name?.toLowerCase().includes(q) ||
      inq.last_name?.toLowerCase().includes(q) ||
      inq.email?.toLowerCase().includes(q) ||
      inq.phone?.toLowerCase().includes(q) ||
      inq.tractor_type?.toLowerCase().includes(q) ||
      inq.city?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Booking Inquiries & Leads</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Real customer rental requests, machinery quotes, and service inquiries
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search inquiries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-emerald-500 outline-none w-48 sm:w-64 font-medium"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchInquiries}
            disabled={loading}
            className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin text-emerald-600" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-2 text-slate-600" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Inquiry Table Card */}
      <Card className="flex-1 overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm">
        <CardContent className="p-0 h-full overflow-auto">
          <div className="w-full overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-100/90 backdrop-blur z-10">
                <TableRow className="border-b border-slate-200 text-xs font-bold text-slate-700">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead className="w-28">Inquiry ID</TableHead>
                  <TableHead className="w-48">Customer Name</TableHead>
                  <TableHead className="w-44 hidden md:table-cell">Machinery / Service</TableHead>
                  <TableHead className="w-36 hidden sm:table-cell">Contact Phone</TableHead>
                  <TableHead className="w-32 hidden lg:table-cell">Location / City</TableHead>
                  <TableHead className="w-36 hidden sm:table-cell">Budget / Timeline</TableHead>
                  <TableHead className="w-28 text-right">Received Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-emerald-600" />
                      <p className="text-sm font-semibold text-slate-600">Loading inquiries from database...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredInquiries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <p className="text-base font-bold text-slate-700">No inquiries found</p>
                      <p className="text-xs text-slate-400 mt-1">Try refreshing or adjusting your search filters.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInquiries.map((inquiry: any, i) => (
                    <TableRow
                      key={inquiry.id || i}
                      onClick={() => handleRowClick(inquiry)}
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors border-b border-slate-100"
                    >
                      <TableCell className="text-xs font-semibold text-slate-400 text-center">{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-slate-800">
                        {`INQ-${inquiry.id.slice(-6).toUpperCase()}`}
                      </TableCell>
                      <TableCell>
                        <p className="font-bold text-slate-900 text-sm">
                          {inquiry.first_name} {inquiry.last_name}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{inquiry.email || "No email"}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold">
                          {inquiry.tractor_type || "Machinery"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs font-semibold text-slate-700">
                        {inquiry.phone || "N/A"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs font-medium text-slate-600">
                        {inquiry.city || "Santa Cruz"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs font-semibold text-slate-700">
                        {inquiry.budget || "Direct Quote"}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium text-slate-500">
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Inquiry Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg p-0 rounded-3xl overflow-hidden shadow-2xl border border-slate-100">
          <div className="bg-slate-900 text-white p-6">
            <span className="text-xs uppercase font-semibold tracking-wider text-emerald-400">
              Customer Booking Inquiry
            </span>
            <DialogHeader className="mt-1">
              <DialogTitle className="text-xl font-bold text-white">
                {selectedInquiry?.first_name} {selectedInquiry?.last_name}
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-slate-300 font-mono mt-1">ID: {selectedInquiry?.id}</p>
          </div>

          {selectedInquiry && (
            <div className="p-6 space-y-4 bg-slate-50">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Contact Email</p>
                  <p className="text-sm font-bold text-slate-800 break-all mt-0.5">{selectedInquiry.email || "N/A"}</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Phone Number</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedInquiry.phone || "N/A"}</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Machinery / Service</p>
                  <p className="text-sm font-bold text-emerald-700 mt-0.5">{selectedInquiry.tractor_type || "General"}</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Budget / Timeline</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedInquiry.budget || "On Request"}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-xs font-semibold text-slate-400 uppercase">Customer Message / Note</p>
                <p className="text-xs md:text-sm text-slate-700 leading-relaxed mt-1">
                  {selectedInquiry.message || "No custom message provided."}
                </p>
              </div>

              <div className="flex justify-between text-xs text-slate-400 px-1">
                <span>Received: {new Date(selectedInquiry.createdAt).toLocaleString()}</span>
                <span>Location: {selectedInquiry.city || "Santa Cruz"}</span>
              </div>
            </div>
          )}

          <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
            <Button
              onClick={() => setIsDialogOpen(false)}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold px-6"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InquiryPage;