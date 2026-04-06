import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase-services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { generatePDFFromHTML, getProfessionalPDFHTML } from '../utils/pdfGenerator';
import { Label } from '@/components/ui/label';
import { AlertModal } from '@/components/ui/AlertModal';
import { 
  TrendingUp, 
  Users, 
  Hotel, 
  DollarSign,
  AlertCircle,
  TrendingDown,
  BarChart3,
  Download,
  Star,
  Building2,
  Loader2
} from 'lucide-react';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeGuests: 0,
    availableRooms: 0,
    totalRevenue: 0
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [alertModal, setAlertModal] = useState({
    open: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning'
  });

  useEffect(() => {
    const unsubBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      let revenue = 0;
      let active = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        revenue += data.totalAmount || 0;
        if (data.status === 'checked_in') active++;
      });
      setStats(prev => ({ ...prev, totalBookings: snapshot.size, totalRevenue: revenue, activeGuests: active }));
    });

    const unsubRooms = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      let available = 0;
      snapshot.forEach(doc => {
        if (doc.data().isAvailable) available++;
      });
      setStats(prev => ({ ...prev, availableRooms: available }));
    });

    return () => { unsubBookings(); unsubRooms(); };
  }, []);

  const getRevenueTrend = () => {
    return { percentage: 12.5, direction: 'up' };
  };

  const getOccupancyRate = () => {
    const totalRooms = stats.availableRooms + stats.activeGuests;
    if (totalRooms === 0) return 0;
    return Math.round((stats.activeGuests / totalRooms) * 100);
  };

  const getPopularRoomType = () => {
    return 'Ocean View Suite';
  };

 const handleGeneratePDFReport = async () => {
  setIsGeneratingReport(true);
  
  const details = [
    { label: 'Report Date', value: new Date().toLocaleString() },
    { label: 'Total Revenue', value: `R ${stats.totalRevenue.toLocaleString()}` },
    { label: 'Occupancy Rate', value: `${getOccupancyRate()}%` },
    { label: 'Total Bookings', value: stats.totalBookings.toString() },
    { label: 'Active Guests', value: stats.activeGuests.toString() },
    { label: 'Available Rooms', value: stats.availableRooms.toString() },
    { label: 'Revenue Trend', value: `${getRevenueTrend().direction === 'up' ? '↑' : '↓'} ${getRevenueTrend().percentage}%` }
  ];
  
  const html = getProfessionalPDFHTML({
    title: 'EXECUTIVE MANAGEMENT REPORT',
    guestName: 'Azure Horizon Resort',
    details: details,
    total: stats.totalRevenue,
    footer: 'This is a system-generated management report.'
  });
  
  await generatePDFFromHTML(html, `Management_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  
  setIsGeneratingReport(false);
  setAlertModal({
    open: true,
    title: "Report Generated",
    message: "PDF report has been downloaded successfully.",
    type: "success"
  });
};


  const trend = getRevenueTrend();
  const occupancyRate = getOccupancyRate();

  const metricCards = [
    { title: 'Total Revenue', value: `R ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', trend: `${trend.direction === 'up' ? '+' : ''}${trend.percentage}%`, trendUp: trend.direction === 'up' },
    { title: 'Occupancy Rate', value: `${occupancyRate}%`, icon: Users, color: 'text-blue-600', subtext: `${stats.activeGuests} guests • ${stats.availableRooms} available` },
    { title: 'Available Rooms', value: stats.availableRooms, icon: Hotel, color: 'text-amber-600' },
    { title: 'Total Bookings', value: stats.totalBookings, icon: TrendingUp, color: 'text-purple-600' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <AlertModal
        open={alertModal.open}
        onClose={() => setAlertModal(prev => ({ ...prev, open: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
      
      <div className="flex justify-between items-center">
        <header>
          <h1 className="text-3xl font-serif font-bold text-[#1e3a5f]">Executive Overview</h1>
          <p className="text-slate-500 italic">Azure Horizon Strategic Management Dashboard</p>
        </header>
        <Button 
          onClick={handleGeneratePDFReport} 
          className="bg-[#c9a227] hover:bg-[#b8941f] text-white"
          disabled={isGeneratingReport}
        >
          {isGeneratingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          {isGeneratingReport ? 'Generating...' : 'Download PDF Report'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, i) => (
          <Card key={i} className="border-none shadow-sm bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.title}</p>
                  <h3 className="text-2xl font-bold mt-1">{card.value}</h3>
                  {card.trend && (
                    <p className={`text-xs mt-1 flex items-center gap-1 ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                      {card.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {card.trend} from last month
                    </p>
                  )}
                  {card.subtext && (
                    <p className="text-xs text-gray-400 mt-1">{card.subtext}</p>
                  )}
                </div>
                <div className={`p-3 bg-slate-50 rounded-full ${card.color}`}>
                  <card.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-blue-900" />
                Performance Analytics
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg m-4 text-slate-400 flex-col">
            <BarChart3 className="h-12 w-12 mb-2 opacity-30" />
            <p className="text-sm">Revenue & Occupancy Chart</p>
            <p className="text-xs">(Increment 2: Advanced Analytics)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Star className="mr-2 h-5 w-5 text-yellow-500" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
              <p className="text-xs font-bold text-blue-800">Most Popular Room</p>
              <p className="text-sm font-semibold text-blue-900">{getPopularRoomType()}</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-100 rounded-md">
              <p className="text-xs font-bold text-green-800">Average Stay Duration</p>
              <p className="text-sm font-semibold text-green-900">3.5 nights</p>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-100 rounded-md">
              <p className="text-xs font-bold text-purple-800">Top Revenue Source</p>
              <p className="text-sm font-semibold text-purple-900">Room Bookings (78%)</p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-md">
              <p className="text-xs font-bold text-amber-800">Guest Satisfaction</p>
              <p className="text-sm font-semibold text-amber-900">4.8 / 5.0 ★</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-red-600" />
              Priority Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-100 rounded-md">
                <p className="text-xs font-bold text-red-800">⚠️ Critical: Maintenance Backlog</p>
                <p className="text-[10px] text-red-600">3 unresolved structural repairs pending for over 48hrs.</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                <p className="text-xs font-bold text-blue-800">ℹ️ Operational: High Demand</p>
                <p className="text-[10px] text-blue-600">Ocean View rooms are 100% booked for the next 7 days.</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-100 rounded-md">
                <p className="text-xs font-bold text-green-800">✓ Achievement: Monthly Target Met</p>
                <p className="text-[10px] text-green-600">Revenue target achieved 5 days early this month.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Building2 className="mr-2 h-5 w-5 text-[#1e3a5f]" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-3 flex-col gap-1" disabled>
                <Users className="h-5 w-5" />
                <span className="text-xs">Staff Schedule</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col gap-1" disabled>
                <Hotel className="h-5 w-5" />
                <span className="text-xs">Room Rates</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col gap-1" disabled>
                <DollarSign className="h-5 w-5" />
                <span className="text-xs">Financials</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={handleGeneratePDFReport}>
                <Download className="h-5 w-5" />
                <span className="text-xs">Full Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Management Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input 
                  type="date" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input 
                  type="date" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowExportModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-[#1e3a5f]" onClick={handleGeneratePDFReport}>
                <Download className="mr-2 h-4 w-4" />
                Generate PDF Report
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}