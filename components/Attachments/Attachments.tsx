"use client";

import { Attachment } from "@/utils/Types/types";
import { Avatar, Backdrop, CircularProgress } from "@mui/material";
import { useCookie } from "next-cookie";
import Link from "next/link";
import { useState, useEffect } from "react";
import AddIcon from "@mui/icons-material/Add";
import Image from "next/image";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import NullImage from "@/assets/AnimateIcons/Attachment.svg"
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const Attachments = () => {
  const [allAttachments, setAllAttachments] = useState<Attachment[]>([]);
  const [fetchingAttachments, setFetchingAttachments] = useState(false);
  const [searchTerm, setSearchTerm] = useState("")

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  function fetchAllAttachments() {
    if (access_token) {
      setFetchingAttachments(true);
      renderInstance
        .get("/attachment", {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        })
        .then((res) => {
          if (res.status === 200) setAllAttachments(res.data);
        })
        .catch((err) => {
          console.log(err);
          errorMessage("Error in fetching inventory lists");
        })
        .finally(() => {
          setFetchingAttachments(false);
        });
    } else errorMessage("Admin not logged in");
  }

  useEffect(() => {
    fetchAllAttachments();
  }, []);

  return (
    <div className="w-full py-6 space-y-6">
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={fetchingAttachments}
      >
        {fetchingAttachments && <CircularProgress />}
      </Backdrop>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Attachments</h1>
        <Button asChild>
          <Link href="/Attachments/new">
            <AddIcon className="mr-2 h-4 w-4" />
            New attachment
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search attachments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {allAttachments.length === 0 ? (
        <div className="w-full h-[60vh] flex items-center justify-center">
          <Image
            src={NullImage}
            alt="No attachments found"
            className="w-[400px] lg:w-[700px] h-auto object-cover"
            width={400}
            height={400}
            unoptimized={true}
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allAttachments.map((attachment) => (
              <TableRow key={attachment.id}>
                <TableCell>
                  {attachment.images.length > 0 ? (
                    <Image
                      src={attachment.images[0]}
                      alt={attachment.name}
                      width={50}
                      height={50}
                      className="rounded-full object-cover w-[50px] h-[50px]"
                    />
                  ) : (
                    <Avatar />
                  )}
                </TableCell>
                <TableCell className="font-medium">{attachment.name}</TableCell>
                <TableCell>{attachment.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default Attachments;
