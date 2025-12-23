'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockRentals } from '@/lib/data';

const processData = (rentals: typeof mockRentals, period: 'monthly' | 'yearly') => {
  const dataMap = new Map<string, number>();

  rentals.forEach((rental) => {
    const date = rental.rentalDate;
    let key: string;
    if (period === 'monthly') {
      key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    } else {
      key = date.getFullYear().toString();
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
  })).slice(-12); // Show last 12 periods for clarity
};

const chartConfig = {
  rentals: {
    label: 'Rentals',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function RentalCharts() {
  const monthlyData = useMemo(() => processData(mockRentals, 'monthly'), []);
  const yearlyData = useMemo(() => processData(mockRentals, 'yearly'), []);

  return (
    <Tabs defaultValue="monthly">
      <TabsList className="mb-4">
        <TabsTrigger value="monthly">Monthly</TabsTrigger>
        <TabsTrigger value="yearly">Yearly</TabsTrigger>
      </TabsList>
      <TabsContent value="monthly">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Rental Volume</CardTitle>
            <CardDescription>Number of books rented out per month over the last year.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={monthlyData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="rentals" fill="var(--color-rentals)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="yearly">
        <Card>
          <CardHeader>
            <CardTitle>Yearly Rental Volume</CardTitle>
            <CardDescription>Total number of books rented out per year.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={yearlyData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="rentals" fill="var(--color-rentals)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
