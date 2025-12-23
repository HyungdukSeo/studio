import { PageHeader } from '@/components/page-header';
import { RentalCharts } from './rental-charts';

export default function AdminReportsPage() {
  return (
    <>
      <PageHeader title="대여 리포트" />
      <RentalCharts />
    </>
  );
}
