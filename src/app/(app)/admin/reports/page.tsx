'use client';

import { PageHeader } from '@/components/page-header';
import { RentalCharts } from './rental-charts';
import { useBooks } from '../../layout';

export default function AdminReportsPage() {
  const { rentals, members } = useBooks();

  return (
    <>
      <PageHeader title="대여 리포트" />
      <RentalCharts rentals={rentals} members={members}/>
    </>
  );
}
