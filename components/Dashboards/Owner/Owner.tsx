"use client";

import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import {
  Attachment,
  Booking,
  OperatorInStore,
  Tractor,
} from "@/utils/Types/types";
import { useState, useEffect } from "react";
import HomeDashboard from "./_components/HomeDashboard";
import OwnerShrimmer from "./_components/OwnerShrimmer";
import { useOwnerStoreContext } from "@/components/wrappers/StoreProvider";

interface UserType {
  userId: string;
  image?: string;
  name?: string;
  email?: string;
}

export default function OwnerDashboardPage() {
  const [fetchingOwnerDetails, setFetchingOwnerDetails] = useState(true);
  const [operators, setOperators] = useState<OperatorInStore[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tractors, setTractors] = useState<Tractor[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [tractorsInUse, setTractorsInUse] = useState(0);
  const [attachmentsInUse, setAttachmentsInUse] = useState(0);

  const { setStores, stores } = useOwnerStoreContext();

  useEffect(() => {
    let userId = "";

    try {
      if (typeof window !== "undefined") {
        // Try getting user from document cookies
        const match = document.cookie.match(new RegExp("(^| )user=([^;]+)"));
        if (match) {
          const userObj = JSON.parse(decodeURIComponent(match[2]));
          userId = userObj?.userId || userObj?.id || "";
        }
        if (!userId) {
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const userObj = JSON.parse(storedUser);
            userId = userObj?.userId || userObj?.id || "";
          }
        }
      }
    } catch (e) {
      console.warn("Could not parse user cookie/localStorage", e);
    }

    if (!userId) {
      // If user ID still not found, stop shimmering and show dashboard structure
      setFetchingOwnerDetails(false);
      return;
    }

    setFetchingOwnerDetails(true);

    renderInstance
      .get(`/owner/${userId}`)
      .then((res) => {
        if (res.data) {
          setStores(res.data.stores || []);
          setOperators(res.data.operators || []);
          setBookings(res.data.bookings || []);
          setTractors(res.data.tractors || []);
          setAttachments(res.data.attachments || []);
          setTractorsInUse(res.data.tractorsInuse || 0);
          setAttachmentsInUse(res.data.attachmentsInuse || 0);
        }
      })
      .catch((err) => {
        console.error("Error fetching owner details:", err);
      })
      .finally(() => {
        setFetchingOwnerDetails(false);
      });
  }, []);

  if (fetchingOwnerDetails) {
    return <OwnerShrimmer />;
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50">
      <HomeDashboard
        stores={stores || []}
        operators={operators || []}
        tractors={tractors || []}
        attachments={attachments || []}
        bookings={bookings || []}
        tractorsInUse={tractorsInUse || 0}
        attachmentsInUse={attachmentsInUse || 0}
      />
    </div>
  );
}