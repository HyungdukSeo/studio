'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBooks } from '../../layout';
import { mockMembers } from '@/lib/data';
import type { Rental } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

const processData = (rentals: Rental[], period: 'monthly' | 'yearly') => {
  const dataMap = new Map<string, number>();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  rentals.forEach((rental) => {
    const rentalDate = new Date(rental.rentalDate);
    
    if (period === 'monthly' && rentalDate < oneYearAgo) {
      return;
    }

    let key: string;
    if (period === 'monthly') {
      key = rentalDate.toLocaleString('default', { month: 'short', year: '2-digit' });
    } else {
      key = rentalDate.getFullYear().toString();
    }
    dataMap.set(key, (dataMap.get(key) || 0) + 1);
  });

  const sortedKeys = Array.from(dataMap.keys()).sort((a, b) => {
    if (period === 'monthly') {
      const dateA = new Date(`01 ${a}`);
      const dateB = new Date(`01 ${b}`);
      return dateA.getTime() - dateB.getTime();
    }
    return parseInt(a) - parseInt(b);
  });

  return sortedKeys.map((key) => ({
    name: key,
    rentals: dataMap.get(key) || 0,
  })).slice(period === 'monthly' ? -12 : -Infinity);
};

const chartConfig = {
  rentals: {
    label: '대여',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

const MemberChartCard = ({ memberName, rentals, period, onBarClick }: { memberName: string; rentals: Rental[]; period: 'monthly' | 'yearly', onBarClick: (data: any, memberRentals: Rental[]) => void;}) => {
    const chartData = useMemo(() => processData(rentals, period), [rentals, period]);

    if (chartData.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{memberName}</CardTitle>
                <CardDescription>
                    {period === 'monthly' ? '지난 1년간 월별 도서 대여량입니다.' : '연도별 총 도서 대여량입니다.'} (막대를 클릭하면 상세 내역을 볼 수 있습니다)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={chartData} accessibilityLayer onClick={(data) => onBarClick(data, rentals)}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="rentals" fill="var(--color-rentals)" radius={4} style={{ cursor: 'pointer' }}/>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
};


export function RentalCharts() {
  const { rentals } = useBooks();
  const [selectedMemberId, setSelectedMemberId] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPeriodRentals, setSelectedPeriodRentals] = useState<Rental[]>([]);
  const [dialogTitle, setDialogTitle] = useState('');

  const groupedRentalsByMember = useMemo(() => {
    if (selectedMemberId !== 'all') {
      return null;
    }
    const grouped: { [memberId: string]: { memberName: string, rentals: Rental[] } } = {};
    rentals.forEach(rental => {
      if (!grouped[rental.memberId]) {
        grouped[rental.memberId] = { memberName: rental.memberName, rentals: [] };
      }
      grouped[rental.memberId].rentals.push(rental);
    });
    return Object.values(grouped).sort((a,b) => a.memberName.localeCompare(b.memberName));
  }, [selectedMemberId, rentals]);
  
  const filteredRentalsForSingleMember = useMemo(() => {
    if (selectedMemberId === 'all') {
      return [];
    }
    return rentals.filter((rental) => rental.memberId === selectedMemberId);
  }, [selectedMemberId, rentals]);

  const handleBarClick = (data: any, memberRentals: Rental[], periodType: 'monthly' | 'yearly') => {
    if (!data || !data.activePayload || data.activePayload.length === 0) return;

    const clickedPeriod = data.activePayload[0].payload.name;
    
    const rentalsInPeriod = memberRentals.filter(rental => {
        const rentalDate = new Date(rental.rentalDate);
        let periodKey: string;
        if (periodType === 'monthly') {
            periodKey = rentalDate.toLocaleString('default', { month: 'short', year: '2-digit' });
        } else { // yearly
            periodKey = rentalDate.getFullYear().toString();
        }
        return periodKey === clickedPeriod;
    });

    setSelectedPeriodRentals(rentalsInPeriod);
    setDialogTitle(`${clickedPeriod} 대여 목록`);
    setIsDialogOpen(true);
  };

  const selectedMemberName = mockMembers.find(m => m.id === selectedMemberId)?.name ?? '선택된 회원';

  return (
    <>
      <div className="mb-4 flex justify-start">
        <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
          <SelectTrigger className="w-full sm:w-[240px]">
            <SelectValue placeholder="회원 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 회원</SelectItem>
            {mockMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="monthly">월별</TabsTrigger>
          <TabsTrigger value="yearly">연도별</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monthly">
            <div className="space-y-4">
            {selectedMemberId === 'all' 
                ? groupedRentalsByMember?.map(({ memberName, rentals: memberRentals }) => (
                    <MemberChartCard key={memberName} memberName={memberName} rentals={memberRentals} period="monthly" onBarClick={(data, currentRentals) => handleBarClick(data, currentRentals, 'monthly')}/>
                ))
                : <MemberChartCard memberName={selectedMemberName} rentals={filteredRentalsForSingleMember} period="monthly" onBarClick={(data, currentRentals) => handleBarClick(data, currentRentals, 'monthly')}/>
            }
            </div>
        </TabsContent>

        <TabsContent value="yearly">
            <div className="space-y-4">
            {selectedMemberId === 'all' 
                ? groupedRentalsByMember?.map(({ memberName, rentals: memberRentals }) => (
                    <MemberChartCard key={memberName} memberName={memberName} rentals={memberRentals} period="yearly" onBarClick={(data, currentRentals) => handleBarClick(data, currentRentals, 'yearly')}/>
                ))
                : <MemberChartCard memberName={selectedMemberName} rentals={filteredRentalsForSingleMember} period="yearly" onBarClick={(data, currentRentals) => handleBarClick(data, currentRentals, 'yearly')}/>
            }
            </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>총 {selectedPeriodRentals.length}건의 대여 기록이 있습니다.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>도서명</TableHead>
                        <TableHead>대여자</TableHead>
                        <TableHead>대여일</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {selectedPeriodRentals.length > 0 ? (
                        selectedPeriodRentals.map(rental => (
                            <TableRow key={rental.id}>
                                <TableCell>{rental.bookTitle}</TableCell>
                                <TableCell>{rental.memberName}</TableCell>
                                <TableCell>{format(new Date(rental.rentalDate), 'yyyy-MM-dd')}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center">대여 기록이 없습니다.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
