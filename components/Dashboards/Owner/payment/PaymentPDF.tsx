import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, BlobProvider } from '@react-pdf/renderer';
import { Payment, Booking } from '@/utils/Types/types';
import { Button } from '@/components/ui/button';

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

