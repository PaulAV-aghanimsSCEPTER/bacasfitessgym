"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { storageService } from "@/src/services/storage.service"
import { subscriptionService } from "@/src/services/subscription.service"
import type { User, Subscription, MedicalHistory, EmergencyContact, LiabilityWaiver } from "@/src/types"
import { 
  Mail, Phone, Ruler, Weight, Calendar, Clock, UserCircle, 
  MapPin, Target, Briefcase, CreditCard, UserCheck, Heart, 
  Activity, Shield, AlertCircle, Cake
} from "lucide-react"

interface ViewMemberDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewMemberDialog({ user, open, onOpenChange }: ViewMemberDialogProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory | null>(null)
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact | null>(null)
  const [liabilityWaiver, setLiabilityWaiver] = useState<LiabilityWaiver | null>(null)

  useEffect(() => {
    if (user && open) {
      const loadData = async () => {
        const [sub, medical, emergency, waiver] = await Promise.all([
          storageService.getSubscriptionByUserId(user.userId),
          storageService.getMedicalHistory(user.userId),
          storageService.getEmergencyContact(user.userId),
          storageService.getLiabilityWaiver(user.userId),
        ])
        setSubscription(sub)
        setMedicalHistory(medical)
        setEmergencyContact(emergency)
        setLiabilityWaiver(waiver)
      }
      loadData()
    }
  }, [user, open])

  if (!user) return null

  const isActive = subscriptionService.isSubscriptionActive(subscription)
  const remainingDays = subscriptionService.getRemainingDays(subscription)

  const formatDate = (date?: string | Date | null) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const calculateAge = (birthday?: string) => {
    if (!birthday) return null
    const birthDate = new Date(birthday)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Member Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header with Name and Status */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-sm text-muted-foreground font-mono">{user.userId}</p>
            </div>
            <Badge variant={isActive ? "default" : "destructive"}>
              {isActive ? "Active" : "Expired"}
            </Badge>
          </div>

          <Separator />

          {/* Personal Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Personal Information
            </h3>
            <div className="grid gap-3">
              {user.birthday && (
                <div className="flex items-center gap-3">
                  <Cake className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Birthday</p>
                    <p className="text-sm font-medium">{formatDate(user.birthday)} {user.age && `(${user.age} years old)`}</p>
                  </div>
                </div>
              )}
              {user.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm font-medium">{user.address}</p>
                  </div>
                </div>
              )}
              {user.goal && (
                <div className="flex items-center gap-3">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fitness Goal</p>
                    <p className="text-sm font-medium">{user.goal}</p>
                  </div>
                </div>
              )}
              {user.programType && (
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Program Type</p>
                    <p className="text-sm font-medium">{user.programType}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Contact Information
            </h3>
            <div className="grid gap-3">
              {user.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                </div>
              )}
              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{user.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Physical Information */}
          {(user.heightCm || user.weightKg) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Physical Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {user.heightCm && (
                    <div className="flex items-center gap-3">
                      <Ruler className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Height</p>
                        <p className="text-sm font-medium">{user.heightCm} cm</p>
                      </div>
                    </div>
                  )}
                  {user.weightKg && (
                    <div className="flex items-center gap-3">
                      <Weight className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Weight</p>
                        <p className="text-sm font-medium">{user.weightKg} kg</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Subscription Information */}
          <Separator />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Subscription Details
            </h3>
            <div className="grid gap-3">
              {subscription?.membershipType && (
                <div className="flex items-center gap-3">
                  <UserCheck className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Membership Type</p>
                    <p className="text-sm font-medium capitalize">{subscription.membershipType}</p>
                  </div>
                </div>
              )}
              {subscription?.planDuration && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Plan Duration</p>
                    <p className="text-sm font-medium capitalize">{subscription.planDuration}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="text-sm font-medium">{formatDate(subscription?.startDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Expiry Date</p>
                  <p className={`text-sm font-medium ${isActive ? "text-green-600" : "text-red-600"}`}>
                    {formatDate(subscription?.endDate)}
                  </p>
                </div>
              </div>
              {isActive && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="text-sm font-medium">{remainingDays} day(s)</p>
                  </div>
                </div>
              )}
              {subscription?.coachingPreference !== undefined && (
                <div className="flex items-center gap-3">
                  <UserCheck className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">1-on-1 Coaching</p>
                    <p className="text-sm font-medium">{subscription.coachingPreference ? "Yes" : "No"}</p>
                  </div>
                </div>
              )}
              {subscription?.paymentStatus && (
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Payment Status</p>
                    <Badge variant={subscription.paymentStatus === "paid" ? "default" : "secondary"} className="text-xs">
                      {subscription.paymentStatus}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Medical History */}
          {medicalHistory && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Medical History
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant={medicalHistory.heartProblems ? "destructive" : "secondary"} className="w-3 h-3 p-0 rounded-full" />
                    <span>Heart Problems</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={medicalHistory.bloodPressureProblems ? "destructive" : "secondary"} className="w-3 h-3 p-0 rounded-full" />
                    <span>Blood Pressure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={medicalHistory.chestPainExercising ? "destructive" : "secondary"} className="w-3 h-3 p-0 rounded-full" />
                    <span>Chest Pain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={medicalHistory.asthmaBreathingProblems ? "destructive" : "secondary"} className="w-3 h-3 p-0 rounded-full" />
                    <span>Asthma/Breathing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={medicalHistory.jointProblems ? "destructive" : "secondary"} className="w-3 h-3 p-0 rounded-full" />
                    <span>Joint Problems</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={medicalHistory.neckBackProblems ? "destructive" : "secondary"} className="w-3 h-3 p-0 rounded-full" />
                    <span>Neck/Back Problems</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={medicalHistory.pregnantRecentBirth ? "destructive" : "secondary"} className="w-3 h-3 p-0 rounded-full" />
                    <span>Pregnant/Recent Birth</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={medicalHistory.smoking ? "destructive" : "secondary"} className="w-3 h-3 p-0 rounded-full" />
                    <span>Smoking</span>
                  </div>
                </div>
                {medicalHistory.otherMedicalConditions && medicalHistory.otherMedicalDetails && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-semibold text-amber-900 mb-1">Other Medical Conditions:</p>
                    <p className="text-xs text-amber-800">{medicalHistory.otherMedicalDetails}</p>
                  </div>
                )}
                {medicalHistory.medication && medicalHistory.medicationDetails && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-semibold text-blue-900 mb-1">Medications:</p>
                    <p className="text-xs text-blue-800">{medicalHistory.medicationDetails}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Emergency Contact */}
          {emergencyContact && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Emergency Contact
                </h3>
                <div className="grid gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">{emergencyContact.contactName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone Number</p>
                    <p className="text-sm font-medium">{emergencyContact.contactNumber}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Liability Waiver */}
          {liabilityWaiver && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Liability Waiver
                </h3>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={liabilityWaiver.waiverAccepted ? "default" : "secondary"}>
                      {liabilityWaiver.waiverAccepted ? "Accepted" : "Not Accepted"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Signed By</p>
                    <p className="text-sm font-medium">{liabilityWaiver.signatureName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Signed Date</p>
                    <p className="text-sm font-medium">{formatDate(liabilityWaiver.signedDate)}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Member Since */}
          <Separator />
          <div className="flex items-center gap-3 text-muted-foreground">
            <UserCircle className="w-4 h-4" />
            <p className="text-xs">Member since {formatDate(user.createdAt)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}