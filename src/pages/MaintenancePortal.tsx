import { useState, useEffect } from 'react';
import { listenForServiceRequests, updateServiceRequestStatus } from '@/services/firebase-services';
import type { RoomServiceRequest } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertModal } from '@/components/ui/AlertModal';
import { 
  Wrench, 
  Home, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Hammer, 
  Sparkles,
  Loader2,
  Flag,
  UserCheck,
  ClipboardList,
  Bell
} from 'lucide-react';

type PriorityLevel = 'high' | 'medium' | 'low';

interface ExtendedServiceRequest extends RoomServiceRequest {
  priority: PriorityLevel;
  estimatedHours?: number;
  assignedTechnician?: string;
  emergency?: boolean;
}

const technicians = ['Thabo Mbeki', 'Kevin Du Preez', 'Chris Evans', 'Frikkie Louw', 'Unassigned'];

export function MaintenancePortal() {
  const [requests, setRequests] = useState<ExtendedServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<ExtendedServiceRequest | null>(null);
  const [workNotes, setWorkNotes] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(1);
  const [assignedTech, setAssignedTech] = useState('');
  const [newRequestNotification, setNewRequestNotification] = useState<RoomServiceRequest | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  
  // Alert Modal state
  const [alertModal, setAlertModal] = useState({
    open: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning'
  });

  useEffect(() => {
    const unsubscribe = listenForServiceRequests((data) => {
      const requestsWithPriority: ExtendedServiceRequest[] = data.map(req => ({
        ...req,
        priority: (req as ExtendedServiceRequest).priority || 'medium',
        estimatedHours: (req as ExtendedServiceRequest).estimatedHours || 1,
        assignedTechnician: (req as ExtendedServiceRequest).assignedTechnician || 'Unassigned'
      }));
      const sorted = [...requestsWithPriority].sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      setRequests(sorted);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Check for new pending requests
  useEffect(() => {
    const interval = setInterval(() => {
      const pendingCount = requests.filter(r => r.status === 'pending').length;
      if (pendingCount > 0 && !showNotification) {
        const newestRequest = requests.find(r => r.status === 'pending');
        if (newestRequest) {
          setNewRequestNotification(newestRequest);
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 8000);
        }
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [requests, showNotification]);

  const openWorkOrder = (request: ExtendedServiceRequest) => {
    setSelectedWorkOrder(request);
    setWorkNotes('');
    setEstimatedHours(request.estimatedHours || 1);
    setAssignedTech(request.assignedTechnician || 'Unassigned');
    setShowWorkOrderModal(true);
  };

  const completeWithWorkOrder = async () => {
    if (!selectedWorkOrder) return;
    if (!workNotes) {
      setAlertModal({
        open: true,
        title: "Missing Information",
        message: "Please add work notes before completing.",
        type: "warning"
      });
      return;
    }
    setIsProcessing(selectedWorkOrder.id);
    try {
      await updateServiceRequestStatus(selectedWorkOrder.id, 'completed');
      setAlertModal({
        open: true,
        title: "Work Order Completed",
        message: `Technician: ${assignedTech}\nHours: ${estimatedHours}\nNotes: ${workNotes}`,
        type: "success"
      });
      setShowWorkOrderModal(false);
      setWorkNotes('');
    } catch (error) {
      console.error("Update failed:", error);
      setAlertModal({
        open: true,
        title: "Error",
        message: "Failed to complete work order. Please try again.",
        type: "error"
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const getPriorityColor = (priority: PriorityLevel, isEmergency?: boolean) => {
    if (isEmergency) return 'bg-red-600 text-white animate-pulse';
    switch (priority) {
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityIcon = (priority: PriorityLevel, isEmergency?: boolean) => {
    if (isEmergency) return <AlertTriangle className="h-3 w-3" />;
    switch (priority) {
      case 'high': return <Flag className="h-3 w-3" />;
      case 'medium': return <Clock className="h-3 w-3" />;
      case 'low': return <CheckCircle2 className="h-3 w-3" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AlertModal
        open={alertModal.open}
        onClose={() => setAlertModal(prev => ({ ...prev, open: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
      
      {/* New Request Notification */}
      {showNotification && newRequestNotification && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
          <div className="bg-blue-50 border-l-4 border-l-blue-500 border border-blue-200 rounded-lg p-4 shadow-lg max-w-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Bell className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-800">New Service Request!</p>
                <p className="text-xs text-blue-600 mt-1">
                  {newRequestNotification.type === 'housekeeping' ? 'Housekeeping' : 'Maintenance'} request from Room {newRequestNotification.roomNumber}
                </p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{newRequestNotification.description}</p>
                <Button 
                  size="sm" 
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs"
                  onClick={() => {
                    setShowNotification(false);
                    const element = document.getElementById(`request-${newRequestNotification.id}`);
                    if (element) element.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  View Request
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => setShowNotification(false)}
              >
                ×
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#1e3a5f] rounded-xl shadow-lg">
              <Hammer className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#1e3a5f]">Maintenance Management</h1>
              <p className="text-gray-500 italic">Work Order System • Azure Horizon Resort</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-center min-w-[100px]">
              <p className="text-[10px] font-bold uppercase text-gray-400">Active Tasks</p>
              <p className="text-xl font-bold text-[#1e3a5f]">
                {requests.filter(r => r.status !== 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {requests.length === 0 ? (
            <Card className="border-dashed border-2 bg-gray-50/50">
              <CardContent className="py-20 text-center">
                <Sparkles className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">No active maintenance requests.</p>
              </CardContent>
            </Card>
          ) : (
            requests.map((req) => (
              <Card 
                key={req.id} 
                id={`request-${req.id}`}
                className={`overflow-hidden transition-all border-l-4 ${
                  req.status === 'pending' ? 'border-l-red-500' : 
                  req.status === 'in_progress' ? 'border-l-blue-500' : 'border-l-green-500'
                }`}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between">
                    
                    <div className="p-6 flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-full ${
                        req.type === 'maintenance' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {req.type === 'maintenance' ? <Wrench className="h-6 w-6" /> : <Home className="h-6 w-6" />}
                      </div>
                      
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-black text-xl text-slate-800 tracking-tight">ROOM {req.roomNumber}</span>
                          <Badge className={getPriorityColor(req.priority, req.emergency)}>
                            {getPriorityIcon(req.priority, req.emergency)}
                            <span className="ml-1 uppercase text-[9px] font-bold">
                              {req.emergency ? 'EMERGENCY' : req.priority}
                            </span>
                          </Badge>
                          <Badge variant={req.status === 'pending' ? 'destructive' : req.status === 'in_progress' ? 'default' : 'secondary'} className="uppercase text-[9px] font-bold">
                            {req.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-slate-600 font-medium leading-relaxed">{req.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap">
                          <span className="flex items-center gap-1 font-medium italic">
                            <Clock className="h-3 w-3" /> Received: {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="font-medium">• Guest: {req.guestName}</span>
                          {req.assignedTechnician && req.assignedTechnician !== 'Unassigned' && (
                            <span className="font-medium flex items-center gap-1">
                              <UserCheck className="h-3 w-3" /> Assigned: {req.assignedTechnician}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 sm:bg-transparent border-t sm:border-t-0 p-6 flex items-center justify-end gap-2 min-w-[200px]">
                      {(req.status === 'pending' || req.status === 'in_progress') && (
                        <Button 
                          className={`${req.status === 'pending' ? 'bg-[#1e3a5f] hover:bg-[#2c5282]' : 'bg-green-600 hover:bg-green-700'} text-white font-bold`} 
                          size="sm"
                          disabled={isProcessing === req.id}
                          onClick={() => openWorkOrder(req)}
                        >
                          <ClipboardList className="h-3 w-3 mr-1" />
                          {req.status === 'pending' ? 'START WORK' : 'COMPLETE & LOG'}
                        </Button>
                      )}
                      
                      {req.status === 'completed' && (
                        <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-4 py-2 rounded-full border border-green-100">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="text-sm">COMPLETED</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="mt-8 flex justify-center gap-6">
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <AlertTriangle className="h-3 w-3 text-red-500" /> Emergency
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <Flag className="h-3 w-3 text-orange-500" /> High Priority
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <CheckCircle2 className="h-3 w-3 text-green-500" /> Resolved
          </div>
        </div>
      </div>

      {/* Work Order Modal */}
      <Dialog open={showWorkOrderModal} onOpenChange={setShowWorkOrderModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Work Order #{selectedWorkOrder?.id?.slice(-6)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Room {selectedWorkOrder?.roomNumber} - {selectedWorkOrder?.type}</Label>
              <p className="text-sm text-gray-500 mt-1">{selectedWorkOrder?.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Estimated Hours</Label>
                <Input 
                  type="number" 
                  min={0.5} 
                  step={0.5}
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label>Assign Technician</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={assignedTech}
                  onChange={(e) => setAssignedTech(e.target.value)}
                  title="Select technician to assign"
                >
                  {technicians.map(tech => (
                    <option key={tech} value={tech}>{tech}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Work Notes / Resolution</Label>
              <textarea
                className="w-full min-h-[100px] p-3 border rounded-md"
                placeholder="Describe work performed, parts used, etc."
                value={workNotes}
                onChange={(e) => setWorkNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowWorkOrderModal(false)}>
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={completeWithWorkOrder}
                disabled={!workNotes}
              >
                Complete Work Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}