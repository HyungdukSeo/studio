import { PageHeader } from '@/components/page-header';
import { RentalCharts } from './rental-charts';

export default function AdminReportsPage() {
  return (
    <>
      <PageHeader title="Rental Reports" />
      <RentalCharts />
    </>
  );
}
