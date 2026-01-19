"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { User } from "@/src/types"
import { storageService } from "@/src/services/storage.service"
import { QRCodeDisplay } from "../qr/qr-code-display"
import { addMonths, format } from "date-fns"

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMemberAdded: () => void
}

const subscriptionPlans = [
  { label: "1 Month", value: "1", months: 1 },
  { label: "6 Months", value: "6", months: 6 },
  { label: "1 Year", value: "12", months: 12 },
]

export function AddMemberDialog({
  open,
  onOpenChange,
  onMemberAdded,
}: AddMemberDialogProps) {
  const [step, setStep] = useState<"form" | "qr">("form")
  const [newUser, setNewUser] = useState<User | null>(null)
  const [subscriptionType, setSubscriptionType] =
    useState<"regular" | "walkin" | "daily">("regular")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    heightCm: "",
    weightKg: "",
    subscriptionPlan: "1",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(addMonths(new Date(), 1), "yyyy-MM-dd"),
  })

  /* ---------------- REGULAR AUTO END DATE ---------------- */
  useEffect(() => {
    if (subscriptionType === "regular") {
      const plan = subscriptionPlans.find(
        (p) => p.value === formData.subscriptionPlan
      )
      if (plan) {
        const start = new Date(formData.startDate)
        const end = addMonths(start, plan.months)
        setFormData((prev) => ({
          ...prev,
          endDate: format(end, "yyyy-MM-dd"),
        }))
      }
    }
  }, [formData.subscriptionPlan, formData.startDate, subscriptionType])

  /* ---------------- DAILY AUTO EXPIRY (12:00 AM NEXT DAY) ---------------- */
  useEffect(() => {
    if (subscriptionType === "daily") {
      const start = new Date(formData.startDate)
      const end = new Date(start)
      end.setDate(start.getDate() + 1)
      end.setHours(0, 0, 0, 0)

      setFormData((prev) => ({
        ...prev,
        endDate: format(end, "yyyy-MM-dd"),
      }))
    }
  }, [subscriptionType, formData.startDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (subscriptionType === "walkin") {
        if (!formData.startDate || !formData.endDate) {
          alert("Please select subscription start and end dates.")
          return
        }
        if (new Date(formData.startDate) > new Date(formData.endDate)) {
          alert("Start date cannot be after end date.")
          return
        }
      }

      const userId = await storageService.generateUserId()
      const now = new Date().toISOString()

      const user: User = {
        userId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        heightCm: formData.heightCm
          ? parseFloat(formData.heightCm)
          : undefined,
        weightKg: formData.weightKg
          ? parseFloat(formData.weightKg)
          : undefined,
        createdAt: now,
        updatedAt: now,
      }

      await storageService.addUser(user)

      let startISO = new Date(formData.startDate).toISOString()
      let endISO = new Date(formData.endDate).toISOString()

      if (subscriptionType === "daily") {
        const start = new Date(formData.startDate)
        const end = new Date(start)
        end.setDate(start.getDate() + 1)
        end.setHours(0, 0, 0, 0)

        startISO = start.toISOString()
        endISO = end.toISOString()
      }

      const subscription = {
        userId,
        startDate: startISO,
        endDate: endISO,
        status: "active" as const,
        createdAt: now,
      }

      await storageService.addOrUpdateSubscription(subscription)

      setNewUser(user)
      setStep("qr")
    } catch (error) {
      console.error("Error adding member:", error)
      alert("Failed to add member. Please try again.")
    }
  }

  const handleClose = () => {
    setStep("form")
    setNewUser(null)
    setSubscriptionType("regular")
    setFormData({
      name: "",
      email: "",
      phone: "",
      heightCm: "",
      weightKg: "",
      subscriptionPlan: "1",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(addMonths(new Date(), 1), "yyyy-MM-dd"),
    })
    onOpenChange(false)
    onMemberAdded()
  }

  const selectedPlan = subscriptionPlans.find(
    (p) => p.value === formData.subscriptionPlan
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
              <DialogDescription>
                Enter member details to generate their unique ID and QR code.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Height (cm)</Label>
                  <Input
                    type="number"
                    value={formData.heightCm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        heightCm: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    value={formData.weightKg}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weightKg: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subscription Type</Label>
                <Select
                  value={subscriptionType}
                  onValueChange={(v) =>
                    setSubscriptionType(
                      v as "regular" | "walkin" | "daily"
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="walkin">
                      Walk-in (Custom Dates)
                    </SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {subscriptionType === "regular" && (
                <>
                  <Label>Subscription Plan</Label>
                  <Select
                    value={formData.subscriptionPlan}
                    onValueChange={(v) =>
                      setFormData({ ...formData, subscriptionPlan: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptionPlans.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          startDate: e.target.value,
                        })
                      }
                    />
                    <Input
                      type="date"
                      value={formData.endDate}
                      disabled
                    />
                  </div>
                </>
              )}

              {subscriptionType === "walkin" && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        startDate: e.target.value,
                      })
                    }
                  />
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              {subscriptionType === "daily" && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        startDate: e.target.value,
                      })
                    }
                  />
                  <Input
                    value="12:00 AM (Next Day)"
                    disabled
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit">Generate Member</Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Member Created Successfully!</DialogTitle>
              <DialogDescription>
                QR code generated for {newUser?.name}
              </DialogDescription>
            </DialogHeader>

            {newUser && (
              <>
                <QRCodeDisplay
                  userId={newUser.userId}
                  userName={newUser.name}
                />
                <Button onClick={handleClose} className="w-full">
                  Done
                </Button>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
