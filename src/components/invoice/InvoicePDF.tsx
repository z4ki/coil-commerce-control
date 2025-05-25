import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Image, 
  Font,
  PDFViewer
} from '@react-pdf/renderer';
import { formatCurrency } from '@/utils/format';



// Define your data interface
export interface InvoicePDFProps {
  documentType: 'invoice' | 'sale';
  invoiceNumber: string;
  date: string;
  paymentMethod: string;
  paymentTerms: string;
  companyInfo: {
    name: string;
    rc: string;
    ai: string;
    nif: string;
    nis: string;
    address: string;
  };
  clientInfo: {
    name: string;
    rc: string;
    ai: string;
    nif: string;
    nis: string;
    address: string;
  };
  items: Array<{
    description: string;
    code: string;
    weight: number;
    unitPrice: number;
    total: number;
  }>;
  totalHT: number;
  tax: number;
  totalTTC: number;
  totalInWords: string;
  contactInfo: {
    phone: string;
    email: string;
    companyName: string;
  };
  slogan: string;
}

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#1A1C21',
  },
  invoiceNumber: {
    fontSize: 11,
    color: '#5E6470',
    textTransform: 'uppercase',
    marginLeft: 10,
  },
  logo: {
    width: 75,
    height: 80,
    position: 'absolute',
    top: 0,
    right: 0,
  },
  companyTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  companyTitleHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  companyDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },


  dateSection: {
    position: 'absolute',
    right: 30,
    top: 150,
  },
  dateRow: {
    flexDirection: 'row',
    fontSize: 10,
    marginBottom: 4,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#1A1C21',
  },
  normalText: {
    fontWeight: 'normal',
    color: '#1A1C21',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#D7DAE0',
    paddingVertical: 15,
    marginBottom: 30,
    marginTop: 50,
  },
  infoColumn: {
    width: '45%',
    borderRightWidth: 0.5,
    borderColor: '#D7DAE0',
  },
  companyName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1A1C21',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    fontSize: 10,
    marginBottom: 2,
  },
  itemsContainer: {
    marginBottom: 0,
    minHeight: 200,
    flexGrow: 1,
  },
  itemsHeader: {
    flexDirection: 'row',
    fontSize: 10,
    fontWeight: 'bold',
    borderBottomWidth: 0.5,
    borderColor: '#D7DAE0',
    paddingVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    fontSize: 10,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: '#D7DAE0',
  },
  descriptionCol: {
    color: '#5E6470',
    width: '50%',
  },
  itemCode: {
    color: '#5E6470',
    marginTop: 4,
  },
  weightCol: {
    width: '16%',
    color: '#5E6470',
  },
  priceCol: {
    width: '16%',
    color: '#5E6470',
  },
  totalCol: {
    width: '18%',
    color: '#5E6470',
  },
  summaryContainer: {
    width: '50%',
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: '#D7DAE0',
    fontSize: 10,
    marginTop: 0,
  },
  totalTTCRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#FF0000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  totalInWords: {
    fontSize: 10,
    color: '#1A1C21',
    paddingVertical: 8,
    fontWeight: 'bold',
    marginBottom: 60,
  },
  footer: {
    borderTopWidth: 0.5,
    borderColor: '#D7DAE0',
    paddingTop: 20,
    fontSize: 10,
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    width: 'auto',
    alignSelf: 'stretch',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  contactDivider: {
    width: 0.5,
    height: 12,
    backgroundColor: '#D7DAE0',
    marginHorizontal: 8,
  },
  slogan: {
    flexDirection: 'row',
    fontSize: 10,
    color: '#dc2626',
    fontWeight: 'bold',
  },
  
});

// Create Invoice PDF Document Component
export const InvoicePDF: React.FC<InvoicePDFProps> = ({
  documentType,
  invoiceNumber,
  date,
  paymentMethod,
  paymentTerms,
  companyInfo,
  clientInfo,
  items,
  totalHT,
  tax,
  totalTTC,
  totalInWords,
  contactInfo,
  slogan,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View>
        {/* Header Row */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              {documentType === 'invoice' ? 'Facture' : 'Devis'}
            </Text>
            <Text style={styles.invoiceNumber}>{invoiceNumber}</Text>
          </View>
          <Image style={styles.logo} src="/images/logo_with_groupe_ha.png" />
        </View>

        {/* Company Title Section (Centered Below Header) */}
        <View style={styles.companyTitleContainer}>
          <Text style={styles.companyTitleHeader}>Eurl Groupe Hamel Ali</Text>
          <Text style={styles.companyDescription}>
            Usine de revêtement et traitement des métaux
          </Text>
        </View>
      </View>

      {/* Date Section */}
      <View style={styles.dateSection}>
        <View style={styles.dateRow}>
          <Text style={styles.boldText}>Date: </Text>
          <Text style={styles.normalText}>{date}</Text>
        </View>
        <View style={styles.dateRow}>
          <Text style={styles.boldText}>Mode de paiement: </Text>
          <Text style={styles.normalText}>{paymentMethod}</Text>
        </View>
      </View>

      {/* Company and Client Info */}
      <View style={styles.infoContainer}>
        <View style={styles.infoColumn}>
          <Text style={styles.companyName}>{companyInfo.name}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.boldText}>RC: </Text>
            <Text style={styles.normalText}>{companyInfo.rc}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.boldText}>A.I: </Text>
            <Text style={styles.normalText}>{companyInfo.ai}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.boldText}>NIF: </Text>
            <Text style={styles.normalText}>{companyInfo.nif}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.boldText}>NIS: </Text>
            <Text style={styles.normalText}>{companyInfo.nis}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.boldText}>RIB (Badr Teleghma) :</Text>
            <Text style={styles.normalText}>00300841000264039071</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.boldText}>Adresse: </Text>
            <Text style={styles.normalText}>{companyInfo.address}</Text>
          </View>
        </View>
        
        <View style={styles.infoColumn}>
          <Text style={styles.companyName}>{clientInfo.name}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.boldText}>RC: </Text>
            <Text style={styles.normalText}>{clientInfo.rc}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.boldText}>A.I: </Text>
            <Text style={styles.normalText}>{clientInfo.ai}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.boldText}>NIF: </Text>
            <Text style={styles.normalText}>{clientInfo.nif}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.boldText}>NIS: </Text>
            <Text style={styles.normalText}>{clientInfo.nis}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.boldText}>Adresse: </Text>
            <Text style={styles.normalText}>{clientInfo.address}</Text>
          </View>
        </View>
      </View>

      {/* Invoice Items */}
      <View style={styles.itemsContainer}>
        <View style={styles.itemsHeader}>
          <Text style={styles.descriptionCol}>Description</Text>
          <Text style={styles.weightCol}>Poids (t)</Text>
          <Text style={styles.priceCol}>P.U HT</Text>
          <Text style={styles.totalCol}>Total HT</Text>
        </View>
        
        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.descriptionCol}>
              <Text style={styles.boldText}>{item.description}</Text>
              <Text style={styles.itemCode}>{item.code}</Text>
            </View>
            <Text style={styles.weightCol}>{(item.weight || 0).toFixed(3)}</Text>
            <Text style={styles.priceCol}>{formatCurrency(item.unitPrice)}</Text>
            <Text style={styles.totalCol}>{formatCurrency(item.total)}</Text>
          </View>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.boldText}>Total HT</Text>
          <Text style={{ color: '#5E6470' }}>{formatCurrency(totalHT)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.boldText}>Tax ({tax}%)</Text>
          <Text style={{ color: '#5E6470' }}>{formatCurrency(totalHT * 0.19)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.boldText}>Total</Text>
          <Text style={{ color: '#5E6470' }}>{formatCurrency(totalHT)}</Text>
        </View>
        <View style={styles.totalTTCRow}>
          <Text style={{ color: '#1A1C21', fontWeight: 'bold' }}>Total TTC</Text>
          <Text>{formatCurrency(totalTTC)} DA</Text>
        </View>
      </View>

      {/* Total in words */}
      <Text style={styles.totalInWords}>{totalInWords.charAt(0).toUpperCase() + totalInWords.slice(1)} Dinars</Text>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.contactInfo}>
          <Text style={styles.boldText}>{contactInfo.companyName}</Text>
          {contactInfo.phone && (
            <>
              <View style={styles.contactDivider} />
              <Text>{contactInfo.phone}</Text>
            </>
          )}
          {contactInfo.email && (
            <>
              <View style={styles.contactDivider} />
              <Text>{contactInfo.email}</Text>
            </>
          )}
        </View>
        <View style={styles.slogan}>
          <Text>{slogan}</Text>
        </View>
      </View>
    </Page>
  </Document>
); 