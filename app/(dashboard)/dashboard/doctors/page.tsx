'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import type { Doctor } from '@/lib/db/schema';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [usage, setUsage] = useState({ current: 0, limit: 1, displayed: 0 });
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState({ name: '', degree: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctors');
      const data = await response.json();
      if (response.ok) {
        setDoctors(data.doctors);
        setUsage(data.usage);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async () => {
    setError(null);
    try {
      const response = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setDoctors([...doctors, data.doctor]);
        setUsage({ ...usage, current: usage.current + 1 });
        setIsAddDialogOpen(false);
        setFormData({ name: '', degree: '' });
      } else if (response.status === 403) {
        setError(data.message);
      } else {
        setError(data.error || 'Failed to add doctor');
      }
    } catch (error) {
      console.error('Error adding doctor:', error);
      setError('Failed to add doctor');
    }
  };

  const handleEditDoctor = async () => {
    if (!editingDoctor) return;
    
    try {
      const response = await fetch('/api/doctors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingDoctor.id,
          name: formData.name,
          degree: formData.degree,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setDoctors(doctors.map(d => d.id === editingDoctor.id ? data.doctor : d));
        setIsEditDialogOpen(false);
        setEditingDoctor(null);
        setFormData({ name: '', degree: '' });
      }
    } catch (error) {
      console.error('Error editing doctor:', error);
    }
  };

  const handleDeleteDoctor = async (doctor: Doctor) => {
    if (!confirm(`Are you sure you want to delete ${doctor.name}?`)) return;
    
    try {
      const response = await fetch(`/api/doctors?id=${doctor.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setDoctors(doctors.filter(d => d.id !== doctor.id));
        setUsage({ ...usage, current: usage.current - 1 });
      }
    } catch (error) {
      console.error('Error deleting doctor:', error);
    }
  };

  const openEditDialog = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({ name: doctor.name, degree: doctor.degree });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Loading doctors...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Practice Doctors</CardTitle>
              <CardDescription>
                Manage doctors in your practice and their insurance acceptances
              </CardDescription>
              {usage.limit > 0 ? (
                <div className="mt-2 text-sm text-muted-foreground">
                  Using {Math.min(usage.current, usage.limit)} of {usage.limit} doctor{usage.limit !== 1 ? 's' : ''}
                </div>
              ) : (
                <div className="mt-2 text-sm text-muted-foreground">
                  Upgrade to add your first doctor
                </div>
              )}
              {usage.displayed !== undefined && usage.displayed < usage.current && (
                <div className="mt-2 text-sm text-amber-600">
                  Showing {usage.displayed} of {usage.current} doctors due to your current plan limit
                </div>
              )}
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={usage.current >= usage.limit}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Doctor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Doctor</DialogTitle>
                  <DialogDescription>
                    Enter the doctor's information below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Dr. Smith"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="degree">Degree</Label>
                    <Select value={formData.degree} onValueChange={(value) => setFormData({ ...formData, degree: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select degree" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OD">OD</SelectItem>
                        <SelectItem value="MD">MD</SelectItem>
                        <SelectItem value="DO">DO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {error && (
                  <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-md">
                    {error}
                    {usage.current >= usage.limit && (
                      <div className="mt-2">
                        <Button
                          variant="link"
                          className="p-0 h-auto text-red-600 underline"
                          onClick={() => window.location.href = '/dashboard'}
                        >
                          Upgrade your plan
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <DialogFooter>
                  <Button 
                    type="submit" 
                    onClick={handleAddDoctor}
                    disabled={!formData.name || !formData.degree}
                  >
                    Add Doctor
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {usage.current >= usage.limit && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                You've reached your limit of {usage.limit} doctor{usage.limit !== 1 ? 's' : ''}. 
                <Button
                  variant="link"
                  className="ml-1 p-0 h-auto text-amber-800 underline font-semibold"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Upgrade your plan
                </Button> to add more doctors.
              </p>
            </div>
          )}
          {usage.limit === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                You need an active subscription to add doctors to your practice.
              </p>
              <Button
                onClick={() => window.location.href = '/pricing'}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                View Pricing Plans
              </Button>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No doctors added yet. Click "Add Doctor" to get started.
            </div>
          ) : (
            <>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Degree</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell className="font-medium">{doctor.name}</TableCell>
                    <TableCell>{doctor.degree}</TableCell>
                    <TableCell>{new Date(doctor.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/dashboard/doctors/${doctor.id}/insurances`}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Insurances
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(doctor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDoctor(doctor)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Doctor</DialogTitle>
            <DialogDescription>
              Update the doctor's information below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Dr. Smith"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-degree">Degree</Label>
              <Select value={formData.degree} onValueChange={(value) => setFormData({ ...formData, degree: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select degree" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OD">OD</SelectItem>
                  <SelectItem value="MD">MD</SelectItem>
                  <SelectItem value="DO">DO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleEditDoctor}
              disabled={!formData.name || !formData.degree}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}