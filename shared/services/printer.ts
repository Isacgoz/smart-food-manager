import { Order } from '../types';

// Codes ESC/POS standard
const ESC = '\x1B';
const GS = '\x1D';

/**
 * Formatage ticket cuisine (ESC/POS)
 * Compatible imprimantes thermiques 80mm (Epson TM-T20II, etc.)
 */
export const formatKitchenTicket = (order: Order, restaurantName: string): string => {
  let ticket = '';

  // Initialisation
  ticket += `${ESC}@`;

  // Header centré
  ticket += `${ESC}a\x01`; // Center align
  ticket += `${ESC}E\x01`; // Bold ON
  ticket += `${restaurantName}\n`;
  ticket += `${ESC}E\x00`; // Bold OFF
  ticket += `${ESC}a\x00`; // Left align
  ticket += '================================\n';

  // Info commande
  ticket += `${ESC}E\x01`; // Bold
  ticket += `BON N° ${order.number}\n`;
  ticket += `${ESC}E\x00`;

  const table = order.tableId || 'COMPTOIR';
  ticket += `TABLE: ${table}\n`;

  const time = new Date(order.date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  ticket += `HEURE: ${time}\n`;
  ticket += '--------------------------------\n\n';

  // Items
  order.items.forEach(item => {
    // Quantité + nom produit en gras
    ticket += `${ESC}E\x01`;
    ticket += `${item.quantity}x ${item.name}\n`;
    ticket += `${ESC}E\x00`;

    // Note spéciale (indentée et en gras)
    if (item.note) {
      ticket += `${ESC}E\x01`;
      ticket += `  >> ${item.note.toUpperCase()}\n`;
      ticket += `${ESC}E\x00`;
    }
    ticket += '\n';
  });

  ticket += '================================\n';
  ticket += '\n\n\n';

  // Coupe papier
  ticket += `${GS}V\x00`;

  return ticket;
};

/**
 * Formatage ticket client (avec prix)
 */
export const formatClientTicket = (
  order: Order,
  restaurantName: string,
  paymentMethod: 'CASH' | 'CARD'
): string => {
  let ticket = '';

  ticket += `${ESC}@`;
  ticket += `${ESC}a\x01`;
  ticket += `${ESC}E\x01`;
  ticket += `${restaurantName}\n`;
  ticket += `${ESC}E\x00`;
  ticket += `${ESC}a\x00`;
  ticket += '================================\n';

  ticket += `Facture N° ${order.number}\n`;
  ticket += `Date: ${new Date(order.date).toLocaleDateString('fr-FR')}\n`;
  ticket += `Heure: ${new Date(order.date).toLocaleTimeString('fr-FR')}\n`;
  if (order.tableId) ticket += `Table: ${order.tableId}\n`;
  ticket += '--------------------------------\n';

  // Items avec prix
  order.items.forEach(item => {
    const unitPrice = item.price;
    const total = unitPrice * item.quantity;

    ticket += `${item.quantity}x ${item.name}\n`;
    ticket += `  ${unitPrice.toFixed(2)}€ x${item.quantity} = ${total.toFixed(2)}€\n`;
    if (item.note) {
      ticket += `  Note: ${item.note}\n`;
    }
  });

  ticket += '--------------------------------\n';
  ticket += `${ESC}E\x01`;
  ticket += `TOTAL: ${order.total.toFixed(2)}€\n`;
  ticket += `${ESC}E\x00`;

  const methodLabel = paymentMethod === 'CASH' ? 'ESPÈCES' : 'CARTE BANCAIRE';
  ticket += `Paiement: ${methodLabel}\n`;
  ticket += '================================\n';
  ticket += `${ESC}a\x01`;
  ticket += 'MERCI DE VOTRE VISITE\n';
  ticket += `${ESC}a\x00`;
  ticket += '\n\n\n';
  ticket += `${GS}V\x00`;

  return ticket;
};

/**
 * Envoi vers imprimante réseau (RAW TCP/IP port 9100)
 */
export const printToNetwork = async (
  ticketData: string,
  printerIP: string = '192.168.1.100',
  port: number = 9100
): Promise<boolean> => {
  try {
    // Tentative d'envoi via réseau local
    const response = await fetch(`http://${printerIP}:${port}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: ticketData,
    });

    return response.ok;
  } catch (error) {
    console.error('[PRINTER] Network error:', error);
    return false;
  }
};

/**
 * Impression via Print API navigateur (fallback)
 */
export const printViaBrowser = (ticketHTML: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('[PRINTER] Popup bloqué');
    return false;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ticket</title>
      <style>
        @media print {
          body { margin: 0; font-family: monospace; font-size: 12px; }
          @page { size: 80mm auto; margin: 0; }
        }
        body { width: 80mm; margin: 0 auto; }
        pre { white-space: pre-wrap; font-family: monospace; }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <pre>${ticketHTML}</pre>
    </body>
    </html>
  `);
  printWindow.document.close();
  return true;
};

/**
 * Helper: Impression automatique avec fallback
 */
export const printOrder = async (
  order: Order,
  restaurantName: string,
  type: 'kitchen' | 'client' = 'kitchen',
  paymentMethod?: 'CASH' | 'CARD'
): Promise<boolean> => {
  const printerIP = import.meta.env.VITE_PRINTER_IP;

  const ticketData = type === 'kitchen'
    ? formatKitchenTicket(order, restaurantName)
    : formatClientTicket(order, restaurantName, paymentMethod || 'CASH');

  // Tentative imprimante réseau
  if (printerIP) {
    const success = await printToNetwork(ticketData, printerIP);
    if (success) {
      console.log('[PRINTER] Ticket envoyé via réseau');
      return true;
    }
  }

  // Fallback navigateur
  console.warn('[PRINTER] Réseau échoué, fallback navigateur');
  return printViaBrowser(ticketData);
};
