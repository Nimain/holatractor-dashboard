import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, BlobProvider } from '@react-pdf/renderer';
import { Payment, Booking } from '@/utils/Types/types';
import { Button } from '@/components/ui/button';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';
import TranslatedText from '@/components/Menubar/TranslatedText';
import { ownerPaymentHistoryTranslations } from './PaymentHistoryTrnslation';
import { Download } from 'lucide-react';

// Define styles for PDF
const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 24, marginBottom: 10 },
  section: { margin: 10, padding: 10 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 5, marginBottom: 5 },
  column: { width: '50%' },
});

// PDF Document component
const PaymentPDF = ({ payments, bookings }: { payments: Payment[], bookings: Booking[] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Payment Details</Text>
      {payments.map((payment, index) => (
        <View key={payment.id} style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.column}>Transaction ID:</Text>
            <Text style={styles.column}>{payment.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.column}>Amount:</Text>
            <Text style={styles.column}>{payment.amount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.column}>Status:</Text>
            <Text style={styles.column}>{payment.status}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.column}>Transaction Type:</Text>
            <Text style={styles.column}>{payment.transactionType}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.column}>Transaction Method:</Text>
            <Text style={styles.column}>{payment.transactionMethod}</Text>
          </View>
          {bookings[index] && (
            <>
              <Text style={{ fontSize: 18, marginTop: 10, marginBottom: 5 }}>Booking Details</Text>
              <View style={styles.row}>
                <Text style={styles.column}>Booking ID:</Text>
                <Text style={styles.column}>{bookings[index].id}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.column}>Start Date:</Text>
                <Text style={styles.column}>{bookings[index].start_date.toDateString()}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.column}>End Date:</Text>
                <Text style={styles.column}>{bookings[index].end_date?.toDateString() || 'N/A'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.column}>Total Cost:</Text>
                <Text style={styles.column}>{bookings[index].total_cost}</Text>
              </View>
            </>
          )}
        </View>
      ))}
    </Page>
  </Document>
);

// Download button component
export const DownloadPDFButton: React.FC<{ payments: Payment[], bookings: Booking[], fileName: string }> = ({ payments, bookings, fileName }) => (
  <BlobProvider document={<PaymentPDF payments={payments} bookings={bookings} />}>
    {({ blob, url, loading, error }) => {
      if (loading) {
        return <Button disabled>Loading document...</Button>;
      }

      if (error) {
        return <Button disabled>Error generating PDF</Button>;
      }

      return (
        <Button variant="outline" className='bg-primaryColor text-white w-32' asChild>
          <a href={url as string} download={fileName}>
            Download All
          </a>
        </Button>
      );
    }}
  </BlobProvider>
);

const SinglePaymentPDF = ({ payment, booking }: { payment: Payment; booking?: Booking }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Payment Details</Text>
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.column}>Transaction ID:</Text>
          <Text style={styles.column}>{payment.id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.column}>Amount:</Text>
          <Text style={styles.column}>{payment.amount}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.column}>Status:</Text>
          <Text style={styles.column}>{payment.status}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.column}>Transaction Type:</Text>
          <Text style={styles.column}>{payment.transactionType}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.column}>Transaction Method:</Text>
          <Text style={styles.column}>{payment.transactionMethod}</Text>
        </View>
        {/* {booking && (
            <>
              <Text style={{ fontSize: 18, marginTop: 10, marginBottom: 5 }}>Booking Details</Text>
              <View style={styles.row}>
                <Text style={styles.column}>Booking ID:</Text>
                <Text style={styles.column}>{booking.id}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.column}>Start Date:</Text>
                <Text style={styles.column}>{booking.start_date.toDateString()}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.column}>End Date:</Text>
                <Text style={styles.column}>{booking.end_date?.toDateString() || 'N/A'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.column}>Total Cost:</Text>
                <Text style={styles.column}>{booking.total_cost}</Text>
              </View>
            </>
          )} */}
      </View>
    </Page>
  </Document>
);

// Download button component for a single payment
export const DownloadSinglePDFButton: React.FC<{ payment: Payment; }> = async ({ payment }) => {
  return (
    <BlobProvider document={<SinglePaymentPDF payment={payment} />}>
      {({ blob, url, loading, error }) => {
        if (loading) {
          return <Button disabled>Loading document...</Button>;
        }

        if (error) {
          return <Button disabled>Error generating PDF</Button>;
        }

        return (
          <Button
            variant="ghost"
            size="sm"
            asChild>
            <a href={url as string} download={"payment.pdf"}>
              <TranslatedText greetings={ownerPaymentHistoryTranslations.download} />
              <Download className='mx-1 size-5'/>
            </a>
            
          </Button>
        );
      }}
    </BlobProvider>
  )
}
