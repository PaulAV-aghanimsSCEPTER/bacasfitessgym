"use client"

import { useState, useEffect } from "react"
import type { User, Subscription } from "@/src/types"
import { storageService } from "@/src/services/storage.service"
import { subscriptionService } from "@/src/services/subscription.service"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  QrCode,
  Trash2,
  RotateCw,
  Edit,
  History,
  AlertTriangle,
  Clock,
  Download,
} from "lucide-react"
import { QRCodeDisplay } from "../qr/qr-code-display"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EditMemberDialog } from "./edit-member-dialog"
import { SubscriptionHistoryDialog } from "./subscription-history-dialog"
import { ScanHistoryDialog } from "./scan-history-dialog"

import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

interface MemberListProps {
  users: User[]
  onUpdate: () => void
}

export function MemberList({ users, onUpdate }: MemberListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showScanHistory, setShowScanHistory] = useState(false)
  const [subscriptionCache, setSubscriptionCache] = useState<Map<string, Subscription | null>>(new Map())

  useEffect(() => {
    const loadSubscriptions = async () => {
      const cache = new Map<string, Subscription | null>()
      for (const user of users) {
        const subscription = await storageService.getSubscriptionByUserId(user.userId)
        cache.set(user.userId, subscription)
      }
      setSubscriptionCache(cache)
    }
    loadSubscriptions()
  }, [users])

  useEffect(() => {
    const term = searchTerm.toLowerCase()
    setFilteredUsers(
      users.filter((user) => {
        return (
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.phone.toLowerCase().includes(term)
        )
      }),
    )
  }, [searchTerm, users])

  const getSubscription = (userId: string): Subscription | null => {
    return subscriptionCache.get(userId) || null
  }

  const isActive = (subscription: Subscription | null): boolean => {
    return subscriptionService.isSubscriptionActive(subscription)
  }

  const getRemainingDays = (subscription: Subscription | null): number => {
    return subscriptionService.getRemainingDays(subscription)
  }

  const isExpiringSoon = (subscription: Subscription | null): boolean => {
    return subscriptionService.isExpiringSoon(subscription, 7)
  }

  const handleRenew = async (userId: string) => {
    try {
      await subscriptionService.renewSubscription(userId, 1)
      onUpdate()
    } catch (error) {
      console.error("Error renewing subscription:", error)
      alert("Failed to renew subscription")
    }
  }

  const handleDelete = async (userId: string) => {
    if (confirm("Are you sure you want to delete this member?")) {
      try {
        await storageService.deleteUser(userId)
        onUpdate()
      } catch (error) {
        console.error("Error deleting member:", error)
        alert("Failed to delete member")
      }
    }
  }

  const handleShowQR = (user: User) => {
    setSelectedUser(user)
    setShowQR(true)
  }

  const handleShowEdit = (user: User) => {
    setSelectedUser(user)
    setShowEdit(true)
  }

  const handleShowHistory = (user: User) => {
    setSelectedUser(user)
    setShowHistory(true)
  }

  const handleShowScanHistory = (user: User) => {
    setSelectedUser(user)
    setShowScanHistory(true)
  }

  // Format duration in "X hours Y minutes Z seconds" format, omitting zero units
  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const parts = []
    if (hours > 0) parts.push(hours === 1 ? "1 hour" : `${hours} hours`)
    if (minutes > 0) parts.push(minutes === 1 ? "1 minute" : `${minutes} minutes`)
    if (seconds > 0 || parts.length === 0) parts.push(seconds === 1 ? "1 second" : `${seconds} seconds`)

    return parts.join(" ")
  }

  const handleDownloadReport = async (userId: string) => {
    try {
      const user = users.find((u) => u.userId === userId)
      const userName = user ? user.name : "Unknown User"

      const logs = await storageService.getScanLogsByUserId(userId)

      if (!logs.length) {
        alert("No check-in/out history available for this member.")
        return
      }

      const sortedLogs = logs.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      )

      type Session = { checkIn: Date; checkOut: Date | null }
      const sessions: Session[] = []
      let lastCheckIn: Date | null = null

      for (const log of sortedLogs) {
        if (log.action.toLowerCase() === "check-in") {
          lastCheckIn = new Date(log.timestamp)
        } else if (log.action.toLowerCase() === "check-out" && lastCheckIn) {
          sessions.push({ checkIn: lastCheckIn, checkOut: new Date(log.timestamp) })
          lastCheckIn = null
        }
      }

      if (lastCheckIn) {
        sessions.push({ checkIn: lastCheckIn, checkOut: null })
      }

      // Prepare table data for PDF
      const tableBody: (string | number)[][] = sessions.map(({ checkIn, checkOut }) => {
        const durationMs = checkOut ? checkOut.getTime() - checkIn.getTime() : 0
        return [
          checkIn.toLocaleString(),
          checkOut ? checkOut.toLocaleString() : "Still Checked In",
          checkOut ? formatDuration(durationMs) : "N/A",
        ]
      })

      let totalMilliseconds = 0
      sessions.forEach(({ checkIn, checkOut }) => {
        if (checkOut) {
          totalMilliseconds += checkOut.getTime() - checkIn.getTime()
        }
      })

      const totalHours = Math.floor(totalMilliseconds / 3600000)
      const totalMinutes = Math.floor((totalMilliseconds % 3600000) / 60000)
      const totalSeconds = Math.floor((totalMilliseconds % 60000) / 1000)

      const totalParts: string[] = []
      if (totalHours > 0) totalParts.push(totalHours === 1 ? "1 hour" : `${totalHours} hours`)
      if (totalMinutes > 0) totalParts.push(totalMinutes === 1 ? "1 minute" : `${totalMinutes} minutes`)
      if (totalSeconds > 0 || totalParts.length === 0) totalParts.push(totalSeconds === 1 ? "1 second" : `${totalSeconds} seconds`)

      const totalTimeStr = totalParts.join(" ")

      const doc = new jsPDF()

      doc.setFontSize(18)
      doc.text(`Check-In Report for: ${userName}`, 14, 15)

      autoTable(doc, {
        head: [["Check-In Time", "Check-Out Time", "Duration"]],
        body: tableBody,
        startY: 25,
        styles: { cellPadding: 2, fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 60 },
          2: { cellWidth: 40, halign: "right" },
        },
      })

      doc.setFontSize(12)
      doc.text(`Total Time Spent: ${totalTimeStr}`, 14, (doc as any).lastAutoTable.finalY + 10)

      doc.save(`CheckInReport_${userName.replace(/\s+/g, "_")}_${userId}.pdf`)
    } catch (error) {
      console.error("Failed to download report:", error)
      alert("Failed to download report")
    }
  }

  return (
    <>
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredUsers.length === 0 && (
          <p className="text-center text-muted-foreground">No members found.</p>
        )}
        {filteredUsers.map((user) => {
          const subscription = getSubscription(user.userId)
          const active = isActive(subscription)
          const daysLeft = getRemainingDays(subscription)
          const expiring = isExpiringSoon(subscription)

          return (
            <Card key={user.userId} className="p-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-lg truncate">{user.name}</h3>
                    <Badge variant={active ? "default" : "destructive"} className="whitespace-nowrap">
                      {active ? "Active" : "Expired"}
                    </Badge>
                    {expiring && (
                      <Badge
                        variant="outline"
                        className="bg-amber-500/10 text-amber-500 border-amber-500/20 whitespace-nowrap flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        Expiring Soon
                      </Badge>
                    )}
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-muted-foreground truncate">
                    <p className="font-mono text-primary truncate">{user.userId}</p>
                    <p className="truncate">{user.email}</p>
                    <p className="truncate">{user.phone}</p>
                    {subscription && (
                      <p className="text-xs">
                        {active ? `${daysLeft} days remaining` : "Subscription expired"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                  <Button size="icon" variant="outline" onClick={() => handleShowEdit(user)} title="Edit Member">
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Button size="icon" variant="outline" onClick={() => handleShowHistory(user)} title="Subscription History">
                    <History className="w-4 h-4" />
                  </Button>

                  <Button size="icon" variant="outline" onClick={() => handleShowQR(user)} title="Show QR Code">
                    <QrCode className="w-4 h-4" />
                  </Button>

                  {!active && (
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleRenew(user.userId)}
                      title="Renew Subscription"
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                  )}

                  <Button size="icon" variant="outline" onClick={() => handleDelete(user.userId)} title="Delete Member">
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  <Button size="icon" variant="outline" onClick={() => handleShowScanHistory(user)} title="Scan History">
                    <Clock className="w-4 h-4" />
                  </Button>

                  {/* Download Check-In Report Button */}
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleDownloadReport(user.userId)}
                    title="Download Check-In Report"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-md w-[90vw]">
          <DialogHeader>
            <DialogTitle>QR Code - {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          {selectedUser && <QRCodeDisplay userId={selectedUser.userId} userName={selectedUser.name} />}
        </DialogContent>
      </Dialog>

      <EditMemberDialog user={selectedUser} open={showEdit} onOpenChange={setShowEdit} onMemberUpdated={onUpdate} />

      <SubscriptionHistoryDialog
        userId={selectedUser?.userId || null}
        userName={selectedUser?.name || ""}
        open={showHistory}
        onOpenChange={setShowHistory}
      />

      <ScanHistoryDialog
        userId={selectedUser?.userId || null}
        userName={selectedUser?.name || ""}
        open={showScanHistory}
        onOpenChange={setShowScanHistory}
      />
    </>
  )
}
