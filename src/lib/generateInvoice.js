import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoice = (order) => {
  const items = order.items || [];
  
  // ক্যালকুলেশন লজিক (Order Object থেকে সঠিক ডাটা নিশ্চিত করা)
  const subtotal = Number(order.subtotal || items.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0));
  const shippingFee = Number(order.shippingFee || 0);
  const discount = Number(order.discount || 0);
  const totalPayable = Number(order.totalAmount || (subtotal + shippingFee - discount));

  const doc = new jsPDF();
  
  const pR = 0, pG = 0, pB = 0;      // Pure Black for Luxury feel
  const sR = 120, sG = 120, sB = 120; // Slate Gray for Subtext

  // --- ওয়াটারমার্ক (Artistic Approach) ---
  doc.setTextColor(pR, pG, pB); 
  doc.setFontSize(80);
  doc.setFont("helvetica", "bold");
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.03 })); 
  doc.text("ZAQEEN", 105, 150, { align: "center", angle: 45 }); 
  doc.restoreGraphicsState();

  // --- ব্র্যান্ড হেডার ---
  doc.setFontSize(22).setFont("helvetica", "bold").setTextColor(pR, pG, pB);
  doc.text("ZAQEEN", 14, 25);
  
  doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(sR, sG, sB);
  doc.text("ARCHITECTURAL APPAREL", 14, 31);

  doc.setFontSize(24).setFont("helvetica", "bold").setTextColor(pR, pG, pB);
  doc.text("INVOICE", 196, 25, { align: "right" });

  doc.setFontSize(8).setFont("helvetica", "bold").setTextColor(sR, sG, sB);
  doc.text(`REFERENCE ID: #${String(order.orderId || order.id || 'N/A').toUpperCase()}`, 196, 31, { align: "right" });

  doc.setDrawColor(230, 230, 230);
  doc.line(14, 45, 196, 45);

  // --- কাস্টমার ও ইনভয়েস ডিটেইলস (Grid Style) ---
  doc.setFontSize(8).setTextColor(sR, sG, sB).setFont("helvetica", "bold").text("CLIENT IDENTITY", 14, 55);
  doc.setFontSize(10).setFont("helvetica", "bold").setTextColor(0, 0, 0);
  doc.text(String(order.deliveryInfo?.name || "CERTIFIED COLLECTOR").toUpperCase(), 14, 61);
  
  doc.setFontSize(8).setFont("helvetica", "normal").setTextColor(80, 80, 80);
  const address = order.deliveryInfo?.address || "Digital Acquisition";
  const phone = order.deliveryInfo?.phone || "";
  doc.text(`${address}\n${phone}`, 14, 67, { maxWidth: 80 });

  // রাইট সাইড
  doc.setFontSize(8).setTextColor(sR, sG, sB).setFont("helvetica", "bold").text("LOGGED ON", 130, 55);
  doc.setFontSize(9).setFont("helvetica", "bold").setTextColor(0, 0, 0);
  const orderDate = order.timestamp?.toDate ? order.timestamp.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB');
  doc.text(orderDate.toUpperCase(), 130, 61);

  doc.setFontSize(8).setTextColor(sR, sG, sB).setFont("helvetica", "bold").text("PAYMENT METHOD", 130, 72);
  doc.setFontSize(9).setFont("helvetica", "bold").setTextColor(0, 0, 0);
  doc.text(String(order.paymentInfo?.method || "GATEWAY").toUpperCase(), 130, 78);

  // --- ডাটা টেবিল ---
  const tableData = items.map(item => [
    {
      content: `${String(item.name || item.title || 'Article').toUpperCase()}\nSIZE: ${item.selectedSize || 'N/A'}`,
      styles: { halign: 'left' }
    },
    item.quantity || 1,
    `BDT ${Number(item.price || 0).toLocaleString()}`,
    `BDT ${(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 90,
    head: [['ARTICLE DESCRIPTION', 'QTY', 'UNIT VALUE', 'SUBTOTAL']],
    body: tableData,
    theme: 'plain', // Minimalist look
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 7, fontStyle: 'bold', halign: 'center', cellPadding: 4 },
    bodyStyles: { fontSize: 8, cellPadding: 5, textColor: [30, 30, 30] },
    columnStyles: {
      0: { cellWidth: 95 }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' },
    },
    didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
            doc.setDrawColor(245, 245, 245);
            doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
    }
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  // --- ফাইনাল ক্যালকুলেশন সেকশন ---
  doc.setFontSize(8).setFont("helvetica", "bold").setTextColor(sR, sG, sB);
  
  // সাবটোটাল
  doc.text("PORTFOLIO VALUE", 140, finalY + 5, { align: "right" });
  doc.setTextColor(0, 0, 0).text(`${subtotal.toLocaleString()}`, 196, finalY + 5, { align: "right" });

  // ডিসকাউন্ট (যদি থাকে)
  if (discount > 0) {
    doc.setTextColor(sR, sG, sB).text("VOUCHER CREDIT", 140, finalY + 12, { align: "right" });
    doc.setTextColor(pR, pG, pB).text(`- ${discount.toLocaleString()}`, 196, finalY + 12, { align: "right" });
  }

  // লজিস্টিকস ফি
  doc.setTextColor(sR, sG, sB).text("LOGISTICS FEE", 140, finalY + 19, { align: "right" });
  doc.setTextColor(0, 0, 0).text(`${shippingFee.toLocaleString()}`, 196, finalY + 19, { align: "right" });

  // টোটাল পেয়াবল (বক্স ডিজাইন)
  doc.setFillColor(0, 0, 0);
  doc.rect(130, finalY + 25, 70, 12, 'F');
  doc.setTextColor(255, 255, 255).setFontSize(9).setFont("helvetica", "bold");
  doc.text("TOTAL PAYABLE", 135, finalY + 32.5);
  doc.text(`BDT ${totalPayable.toLocaleString()}`, 192, finalY + 32.5, { align: "right" });

  // --- অথেন্টিসিটি ফুটনোট ---
  doc.setFontSize(7).setTextColor(sR, sG, sB).setFont("helvetica", "italic");
  doc.text("THIS DOCUMENT CERTIFIES THE ACQUISITION OF GENUINE ZAQEEN ARTICLES.", 105, 280, { align: "center" });
  doc.text("CONFIDENCE • BELIEF • CERTAINTY", 105, 285, { align: "center" });

  doc.save(`ZAQEEN_INVOICE_${order.orderId || order.id.slice(0, 8)}.pdf`);
};
