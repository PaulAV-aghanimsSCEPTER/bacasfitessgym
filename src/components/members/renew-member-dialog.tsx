"use client"

import { useState } from "react"
import { subscriptionService } from "@/src/services/subscription.service"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Calendar, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

interface RenewMemberDialogProps {
  userId: string | null
  userName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onRenewed: () => void
}

type MembershipType = "monthly" | "daily"
type MonthlyDuration = 1 | 6 | 12

const MONTHLY_OPTIONS: { label: string; months: MonthlyDuration }[] = [
  { label: "1 Month", months: 1 },
  { label: "6 Months", months: 6 },
  { label: "1 Year", months: 12 },
]

export function RenewMemberDialog({
  userId,
  userName,
  open,
  onOpenChange,
  onRenewed,
}: RenewMemberDialogProps) {
  const [isAnnualPlan, setIsAnnualPlan] = useState<boolean | null>(null)
  const [membershipType, setMembershipType] = useState<MembershipType>("monthly")
  const [selectedDuration, setSelectedDuration] = useState<MonthlyDuration>(1)
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  )
  const [endDate, setEndDate] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRenew = async () => {
    if (!userId) return

    setIsSubmitting(true)

    try {
      if (isAnnualPlan) {
        if (membershipType === "monthly") {
          // Regular monthly subscription (1, 6, or 12 months)
          await subscriptionService.renewSubscription(userId, selectedDuration)
        } else {
          // Daily subscription - expires at 12:00 AM
          await subscriptionService.renewDaily(userId)
        }
      } else {
        // Walk-in with custom dates
        if (!startDate || !endDate) {
          alert("Please select start and end dates")
          setIsSubmitting(false)
          return
        }
        const start = new Date(startDate)
        const end = new Date(endDate)
        await subscriptionService.renewWalkIn(userId, end, start)
      }

      onRenewed()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Error renewing subscription:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setIsAnnualPlan(null)
    setMembershipType("monthly")
    setSelectedDuration(1)
    setStartDate(new Date().toISOString().split("T")[0])
    setEndDate("")
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetForm()
    onOpenChange(newOpen)
  }

  const isSubmitDisabled = () => {
    if (isSubmitting) return true
    if (isAnnualPlan === null) return true
    if (!isAnnualPlan && (!startDate || !endDate)) return true
    return false
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Renew Subscription</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Renewing for <span className="font-medium">{userName}</span>
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Question A: Avail annual membership plan? */}
          <div className="space-y-3">
            <Label className="text-base">
              A. Avail annual membership plan? <span className="text-destructive">*</span>
            </Label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="annualPlan"
                  checked={isAnnualPlan === true}
                  onChange={() => setIsAnnualPlan(true)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm">Yes</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="annualPlan"
                  checked={isAnnualPlan === false}
                  onChange={() => setIsAnnualPlan(false)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm">No</span>
              </label>
            </div>
          </div>

          {/* Option A: Yes - Show membership type selection */}
          {isAnnualPlan === true && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-3">
                <Label className="text-base">
                  What membership type? <span className="text-destructive">*</span>
                </Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="membershipType"
                      checked={membershipType === "monthly"}
                      onChange={() => setMembershipType("monthly")}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm">Monthly</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="membershipType"
                      checked={membershipType === "daily"}
                      onChange={() => setMembershipType("daily")}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm">Daily</span>
                  </label>
                </div>
              </div>

              {/* Monthly Duration Options */}
              {membershipType === "monthly" && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label>Select Duration</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {MONTHLY_OPTIONS.map((option) => (
                      <button
                        key={option.months}
                        type="button"
                        onClick={() => setSelectedDuration(option.months)}
                        className={cn(
                          "px-3 py-3 rounded-lg border text-sm font-medium transition-colors",
                          selectedDuration === option.months
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Subscription will start today and end in {selectedDuration}{" "}
                    month{selectedDuration > 1 ? "s" : ""}.
                  </p>
                </div>
              )}

              {/* Daily Info */}
              {membershipType === "daily" && (
                <div className="p-4 rounded-lg bg-muted/50 border animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2 text-sm">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span className="font-medium">Daily Pass</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    This subscription will be valid for today only and expires at{" "}
                    <span className="font-medium">12:00 AM (midnight)</span>.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Option B: No - Walk-in with custom dates */}
          {isAnnualPlan === false && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Walk-in Subscription
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    // Reset end date if it's before new start date
                    if (endDate && e.target.value > endDate) {
                      setEndDate("")
                    }
                  }}
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                />
              </div>

              {startDate && endDate && (
                <p className="text-xs text-muted-foreground">
                  Subscription will be active from{" "}
                  <span className="font-medium">
                    {new Date(startDate).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {new Date(endDate).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  .
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleRenew} disabled={isSubmitDisabled()}>
            {isSubmitting ? "Renewing..." : "Renew Subscription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}