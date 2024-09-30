"use client"

import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage } from '@/utils/Toastify/Messages'
import { Logs } from '@/utils/Types/types'
import { useState, useEffect } from 'react'
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../ui/table'

const LogsSection = () => {
  const [allLogs, setAllLogs] = useState<Logs[]>([])
  const [fetchingLogs, setFetchingLogs] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  function fetchLogs() {
    setFetchingLogs(true)
    renderInstance.get('/log')
      .then((res) => {
        setAllLogs(res.data)
      }).catch((err) => {
        errorMessage("Error in fetching log details")
      }).finally(() => {
        setFetchingLogs(false)
      })
  }

  const formatDate = (date: string | Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    const dateObj = typeof date === "string" ? new Date(date) : date;

    return dateObj.toLocaleDateString(undefined, options);
  };

  const truncateEmail = (email: string) => {
    return email.slice(0, 5) + '...'
  }

  const formatUserId = (userId: string) => {
    return 'Hola-' + userId.slice(-4)
  }

  const truncateDetails = (details: string) => {
    return details.slice(0, 15) + (details.length > 15 ? '...' : '')
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  if (fetchingLogs) return <p>Logs loading...</p>

  return (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="font-bold">Sl no</TableHead>
          <TableHead className="font-bold">Action</TableHead>
          <TableHead className="font-bold">Email</TableHead>
          <TableHead className="font-bold">UserId</TableHead>
          <TableHead className="font-bold">Details</TableHead>
          <TableHead className="font-bold">Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {allLogs.length === 0 ? <p>No logs present</p> : allLogs.map((log, index) => (
          <TableRow
            key={index}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}>
            <TableCell>{index + 1}</TableCell>
            <TableCell>{log.action}</TableCell>
            <TableCell>{hoveredIndex === index ? log.email : truncateEmail(log.email)}</TableCell>
            <TableCell>{hoveredIndex === index ? log.userId : formatUserId(log.userId)}</TableCell>
            <TableCell>{hoveredIndex === index ? log.details : truncateDetails(log.details)}</TableCell>
            <TableCell>{formatDate(log.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default LogsSection