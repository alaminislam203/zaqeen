import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoice = (order) => {
  const items = order.items || [];
  
  // Calculations
  const subtotal = Number(order.subtotal || items.reduce((acc, item) => 
    acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0));
  const shippingFee = Number(order.shippingFee || 0);
  const discount = Number(order.discount || 0);
  const totalPayable = Number(order.totalAmount || (subtotal + shippingFee - discount));

  const doc = new jsPDF();
  
  // Color palette
  const primaryBlack = [0, 0, 0];
  const accentGray = [100, 100, 100];
  const lightGray = [180, 180, 180];
  const white = [255, 255, 255];
  const accentGreen = [16, 185, 129];

  // Helper function to add currency symbol
  // jsPDF default fonts don't support the Bangla taka symbol (৳), so use "Tk" by default.
  // If you embed a Unicode font that supports ৳, switch the symbol to "৳".
  const formatCurrency = (amount, symbol = "BDT") =>
    `${symbol} ${Number(amount).toLocaleString("en-IN")}`;

  // --- Header Section with Brand Identity ---
  // Logo/Brand area with background
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, 210, 50, 'F');

  // Brand name
  doc.setTextColor(...white);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("ZAQEEN", 14, 22);

  // Tagline
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Premium Fashion & Lifestyle", 14, 28);

  // Contact info
  doc.setFontSize(7);
  doc.text("www.zaqeen.com | support@zaqeen.com", 14, 34);

  // Invoice title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 196, 22, { align: "right" });

  // Order ID
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`#${String(order.orderId || order.id || 'N/A').toUpperCase()}`, 196, 28, { align: "right" });

  // Date
  const orderDate = order.createdAt?.toDate 
    ? order.createdAt.toDate().toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })
    : new Date().toLocaleDateString('en-GB');
  
  doc.setFontSize(8);
  doc.text(`Date: ${orderDate}`, 196, 34, { align: "right" });

  // Status badge
  const status = order.status || 'Pending';
  const statusColor = status === 'Delivered' ? accentGreen : [255, 159, 64];
  doc.setFillColor(...statusColor);
  doc.roundedRect(160, 38, 36, 7, 2, 2, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(status.toUpperCase(), 178, 42.5, { align: "center" });

  // --- Divider ---
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.5);
  doc.line(14, 55, 196, 55);

  // --- Customer & Company Details ---
  const yStart = 65;

  // Bill To Section
  doc.setFontSize(9);
  doc.setTextColor(...accentGray);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO:", 14, yStart);

  doc.setFontSize(11);
  doc.setTextColor(...primaryBlack);
  doc.setFont("helvetica", "bold");
  doc.text(String(order.deliveryInfo?.name || "Customer").toUpperCase(), 14, yStart + 6);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...accentGray);
  
  const customerDetails = [
    order.deliveryInfo?.phone || "",
    order.deliveryInfo?.email || "",
    order.deliveryInfo?.address || "",
    order.deliveryInfo?.city || ""
  ].filter(Boolean).join("\n");
  
  doc.text(customerDetails, 14, yStart + 12, { maxWidth: 80, lineHeightFactor: 1.4 });

  // Company/Payment Details (Right side)
  doc.setFontSize(9);
  doc.setTextColor(...accentGray);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT INFO:", 120, yStart);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  const paymentMethod = String(order.paymentInfo?.method || "N/A").toUpperCase();
  const transactionId = order.paymentInfo?.transactionId || "N/A";
  const paymentStatus = order.paymentInfo?.status || "Pending";

  const paymentDetails = [
    `Method: ${paymentMethod}`,
    transactionId !== "CASH_ON_DELIVERY" && transactionId !== "N/A" ? `TRX ID: ${transactionId}` : "",
    `Status: ${paymentStatus}`
  ].filter(Boolean);

  doc.text(paymentDetails, 120, yStart + 6, { lineHeightFactor: 1.4 });

  // --- Items Table ---
  const tableStartY = yStart + 40;

  const tableData = items.map((item, index) => [
    index + 1,
    {
      content: String(item.name || item.title || 'Product').toUpperCase(),
      styles: { fontStyle: 'bold' }
    },
    item.selectedSize || '-',
    item.quantity || 1,
    formatCurrency(item.price || 0),
    {
      content: formatCurrency((Number(item.price || 0) * Number(item.quantity || 1))),
      styles: { fontStyle: 'bold' }
    }
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['#', 'PRODUCT', 'SIZE', 'QTY', 'PRICE', 'TOTAL']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: primaryBlack,
      textColor: white,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 }
    },
    bodyStyles: { 
      fontSize: 9,
      cellPadding: { top: 5, bottom: 5, left: 3, right: 3 },
      textColor: [40, 40, 40]
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 35, halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    margin: { left: 14, right: 14 }
  });

  // --- Summary Section ---
  const finalY = doc.lastAutoTable.finalY + 15;
  const summaryX = 130;

  // Subtotal
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...accentGray);
  doc.text("Subtotal:", summaryX, finalY);
  doc.setTextColor(...primaryBlack);
  doc.text(formatCurrency(subtotal), 196, finalY, { align: "right" });

  // Discount (if applicable)
  let currentY = finalY + 6;
  if (discount > 0) {
    doc.setTextColor(...accentGray);
    doc.text("Discount:", summaryX, currentY);
    doc.setTextColor(220, 38, 38);
    doc.setFont("helvetica", "bold");
    doc.text(`-${formatCurrency(discount)}`, 196, currentY, { align: "right" });
    doc.setFont("helvetica", "normal");
    currentY += 6;
  }

  // Shipping Fee
  doc.setTextColor(...accentGray);
  doc.text("Shipping Fee:", summaryX, currentY);
  doc.setTextColor(...primaryBlack);
  if (shippingFee === 0) {
    doc.setTextColor(...accentGreen);
    doc.setFont("helvetica", "bold");
    doc.text("FREE", 196, currentY, { align: "right" });
    doc.setFont("helvetica", "normal");
  } else {
    doc.text(formatCurrency(shippingFee), 196, currentY, { align: "right" });
  }
  currentY += 8;

  // Divider line
  doc.setDrawColor(...lightGray);
  doc.line(summaryX, currentY, 196, currentY);
  currentY += 8;

  // Total - Highlighted Box
  doc.setFillColor(...primaryBlack);
  doc.roundedRect(summaryX - 5, currentY - 5, 71, 12, 2, 2, 'F');
  
  doc.setTextColor(...white);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL AMOUNT:", summaryX, currentY + 2);
  doc.setFontSize(13);
  doc.text(formatCurrency(totalPayable), 191, currentY + 2, { align: "right" });

  // --- Terms & Conditions ---
  const termsY = 240;
  
  doc.setFillColor(250, 250, 250);
  doc.rect(14, termsY, 182, 30, 'F');
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryBlack);
  doc.text("TERMS & CONDITIONS:", 18, termsY + 6);
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...accentGray);
  
  const terms = [
    "• All sales are final. Exchange only within 7 days of delivery.",
    "• Products must be unused with original tags attached.",
    "• Shipping charges are non-refundable.",
    "• For support, contact us at support@zaqeen.com or call our helpline."
  ];
  
  let termsYPos = termsY + 11;
  terms.forEach(term => {
    doc.text(term, 18, termsYPos);
    termsYPos += 4;
  });

  // --- Footer ---
  const footerY = 278;
  
  doc.setDrawColor(...lightGray);
  doc.line(14, footerY, 196, footerY);
  
  doc.setFontSize(7);
  doc.setTextColor(...accentGray);
  doc.setFont("helvetica", "italic");
  doc.text("Thank you for shopping with Zaqeen!", 105, footerY + 5, { align: "center" });
  doc.text("This is a computer-generated invoice and does not require a signature.", 105, footerY + 9, { align: "center" });

  // --- Watermark ---
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.03 }));
  doc.setTextColor(...primaryBlack);
  doc.setFontSize(60);
  doc.setFont("helvetica", "bold");
  doc.text("ZAQEEN", 105, 160, { align: "center", angle: 45 });
  doc.restoreGraphicsState();

  // --- Page Border (Optional elegant touch) ---
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, 190, 277);

  // Save the PDF
  const fileName = `Zaqeen_Invoice_${order.orderId || order.id?.slice(0, 8) || 'draft'}.pdf`;
  doc.save(fileName);
  
  return fileName;
};
