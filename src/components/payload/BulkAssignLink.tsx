'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type GroupOption = {
  id: string
  name: string
}

export const BulkAssignLink: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<GroupOption[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [assignMode, setAssignMode] = useState<'all' | 'selected'>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [deptFilter, setDeptFilter] = useState<string>('all')

  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
        fetch('/api/groups?limit=100')
        .then(res => res.json())
        .then(data => {
            if (data.docs) {
                setGroups(data.docs.map((g: any) => ({ id: g.id, name: g.name })))
            }
        })
        .catch(err => console.error('Failed to fetch groups', err))
    }
  }, [isOpen])

  const handleAssign = async () => {
    if (!selectedGroup) {
        toast.error('Please select a group.')
        return
    }

    setLoading(true)
    try {
        const res = await fetch('/api/admin/bulk-assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode: assignMode,
                groupId: selectedGroup,
                filters: {
                    role: roleFilter !== 'all' ? roleFilter : undefined,
                    department: deptFilter !== 'all' ? deptFilter : undefined,
                }
            })
        })

        const result = await res.json()
        if (res.ok) {
            toast.success(result.message || 'Assigned successfully')
            setIsOpen(false)
            router.refresh()
        } else {
            toast.error(result.error || 'Assignment failed')
        }
    } catch (e) {
        toast.error('An error occurred')
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="mb-4">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">Bulk Assign Groups</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Bulk Assign Users to Group</SheetTitle>
            <SheetDescription>
              Select criteria to assign users to a specific group.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group">Group</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                    <SelectValue placeholder="Select group..." />
                </SelectTrigger>
                <SelectContent>
                    {groups.map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role Filter</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="dp">VP</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
               <Label htmlFor="dept">Department</Label>
               <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="IA">Internal Affairs</SelectItem>
                    <SelectItem value="EA">External Affairs</SelectItem>
                    <SelectItem value="OD">Operations</SelectItem>
                    <SelectItem value="AD">Academic</SelectItem>
                    <SelectItem value="CC">Creatives</SelectItem>
                    <SelectItem value="PR">Public Relations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter className="mt-4">
             <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
                Cancel
            </Button>
            <Button type="submit" onClick={handleAssign} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
