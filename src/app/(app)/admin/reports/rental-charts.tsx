'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer } from 'recharts';
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
import type { Rental, Member } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const processAllMembersData = (rentals: Rental[], period: 'monthly' | 'yearly', members: Member[]) => {
    const dataMap = new Map<string, { [memberName: string]: number }>();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
    rentals.forEach((rental) => {
      const rentalDate = new Date(rental.rentalDate);
      if (period === 'monthly' && rentalDate < oneYearAgo) return;
  
      const periodKey = period === 'monthly'
        ? rentalDate.toLocaleString('default', { month: 'short', year: '2-digit' })
        : rentalDate.getFullYear().toString();
  
      if (!dataMap.has(periodKey)) {
        const initialCounts: { [memberName: string]: number } = {};
        members.forEach(m => initialCounts[m.name] = 0);
        dataMap.set(periodKey, initialCounts);
      }
  
      const periodData = dataMap.get(periodKey)!;
      periodData[rental.memberName] = (periodData[rental.memberName] || 0) + 1;
    });
  
    const sortedKeys = Array.from(dataMap.keys()).sort((a, b) => {
      if (period === 'monthly') {
        const dateA = new Date(`01 ${a}`);
        const dateB = new Date(`01 ${b}`);
        return dateA.getTime() - dateB.getTime();
      }
      return parseInt(a) - parseInt(b);
    });

    const finalData = sortedKeys.map(key => ({
        name: key,
        ...dataMap.get(key)!,
    }));

    return finalData.slice(period === 'monthly' ? -12 : -Infinity);
};

const processSingleMemberData = (rentals: Rental[], period: 'monthly' | 'yearly') => {
    const dataMap = new Map<string, number>();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    rentals.forEach((rental) => {
        const rentalDate = new Date(rental.rentalDate);
        if (period === 'monthly' && rentalDate < oneYearAgo) return;

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


const generateChartConfig = (members: Member[]): ChartConfig => {
    const config: ChartConfig = {
      rentals: {
        label: '대여',
        color: 'hsl(var(--primary))',
      },
    };
    members.forEach((member, index) => {
      config[member.name] = {
        label: member.name,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
    });
    return config;
};
  
const AllMembersChartCard = ({ rentals, period, onBarClick, members }: { rentals: Rental[]; period: 'monthly' | 'yearly'; onBarClick: (data: any, periodType: 'monthly' | 'yearly') => void; members: Member[]; }) => {
    const chartData = useMemo(() => processAllMembersData(rentals, period, members), [rentals, period, members]);
    const chartConfig = useMemo(() => generateChartConfig(members), [members]);
    
    const activeMembers = useMemo(() => {
        const memberNamesInRentals = new Set(rentals.map(r => r.memberName));
        return members.filter(m => memberNamesInRentals.has(m.name));
    }, [rentals, members]);


    if (chartData.length === 0) return (
      <Card>
          <CardHeader>
              <CardTitle>전체 회원 대여 현황</CardTitle>
              <CardDescription>데이터가 없습니다.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
             대여 기록이 없습니다.
          </CardContent>
      </Card>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>전체 회원 대여 현황</CardTitle>
                <CardDescription>
                    {period === 'monthly' ? '지난 1년간 월별 도서 대여량입니다.' : '연도별 총 도서 대여량입니다.'} (막대를 클릭하면 상세 내역을 볼 수 있습니다)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={chartData} accessibilityLayer onClick={(data) => onBarClick(data, period)}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        {activeMembers.map(member => (
                            <Bar key={member.id} dataKey={member.name} stackId="a" fill={`var(--color-${member.name})`} radius={0} style={{ cursor: 'pointer' }} />
                        ))}
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
};


const SingleMemberChartCard = ({ memberName, rentals, period, onBarClick }: { memberName: string; rentals: Rental[]; period: 'monthly' | 'yearly'; onBarClick: (data: any, periodType: 'monthly' | 'yearly') => void; }) => {
    const chartData = useMemo(() => processSingleMemberData(rentals, period), [rentals, period]);
    const chartConfig = {
      rentals: { label: '대여', color: 'hsl(var(--primary))' },
    } satisfies ChartConfig;

    if (chartData.length === 0) return (
        <Card>
            <CardHeader>
                <CardTitle>{memberName}</CardTitle>
                <CardDescription>데이터가 없습니다.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
                해당 기간에 대여 기록이 없습니다.
            </CardContent>
        </Card>
    );

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
                    <BarChart data={chartData} accessibilityLayer onClick={(data) => onBarClick(data, period)}>
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

interface RentalChartsProps {
  rentals: Rental[];
  members: Member[];
}

export function RentalCharts({ rentals, members }: RentalChartsProps) {
  const [selectedMemberId, setSelectedMemberId] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPeriodRentals, setSelectedPeriodRentals] = useState<Rental[]>([]);
  const [dialogTitle, setDialogTitle] = useState('');

  const filteredRentals = useMemo(() => {
    if (selectedMemberId === 'all') {
      return rentals;
    }
    const selectedMember = members.find(m => m.id === selectedMemberId);
    if (!selectedMember) return [];
    return rentals.filter((rental) => rental.memberId === selectedMember.id);
  }, [selectedMemberId, rentals, members]);
  
  const handleBarClick = (data: any, periodType: 'monthly' | 'yearly') => {
    if (!data || !data.activePayload || data.activePayload.length === 0) return;

    const clickedPeriod = data.activePayload[0].payload.name;
    let relevantRentals = rentals;

    if (selectedMemberId !== 'all') {
        const selectedMember = members.find(m => m.id === selectedMemberId);
        if (selectedMember) {
            relevantRentals = rentals.filter(r => r.memberId === selectedMember.id);
        }
    }
    
    const rentalsInPeriod = relevantRentals.filter(rental => {
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

  const selectedMember = members.find(m => m.id === selectedMemberId);
  const selectedMemberName = selectedMember?.name ?? '선택된 회원';

  return (
    <>
      <div className="mb-4 flex justify-start">
        <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
          <SelectTrigger className="w-full sm:w-[240px]">
            <SelectValue placeholder="회원 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 회원</SelectItem>
            {members.map((member) => (
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
                ? <AllMembersChartCard rentals={rentals} period="monthly" onBarClick={handleBarClick} members={members}/>
                : <SingleMemberChartCard memberName={selectedMemberName} rentals={filteredRentals} period="monthly" onBarClick={handleBarClick}/>
            }
            </div>
        </TabsContent>

        <TabsContent value="yearly">
            <div className="space-y-4">
            {selectedMemberId === 'all' 
                ? <AllMembersChartCard rentals={rentals} period="yearly" onBarClick={handleBarClick} members={members} />
                : <SingleMemberChartCard memberName={selectedMemberName} rentals={filteredRentals} period="yearly" onBarClick={handleBarClick} />
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
                        <TableHead>상태</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {selectedPeriodRentals.length > 0 ? (
                        selectedPeriodRentals.map(rental => (
                            <TableRow key={rental.id}>
                                <TableCell>{rental.bookTitle}</TableCell>
                                <TableCell>{rental.memberName}</TableCell>
                                <TableCell>{format(new Date(rental.rentalDate), 'yyyy-MM-dd')}</TableCell>
                                <TableCell>
                                {rental.returnDate ? (
                                    <Badge variant="outline">반납완료</Badge>
                                ) : (
                                    <Badge className="text-red-800 bg-red-100 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700">
                                    대여중
                                    </Badge>
                                )}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center">대여 기록이 없습니다.</TableCell>
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
