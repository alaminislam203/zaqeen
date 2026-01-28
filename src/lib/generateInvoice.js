import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoice = (order) => {
  const items = order.items || [];
  const rawTotal = Number(order.totalAmount || order.total || 0);
  const deliveryFee = Number(order.deliveryFee || 150);
  const subtotal = items.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
  const totalPayable = subtotal + deliveryFee;

  const doc = new jsPDF();
  
  const pR = 22, pG = 22, pB = 22;      // Primary Black
  const sR = 150, sG = 150, sB = 150;  // Secondary Gray

  // --- ওয়াটারমার্ক ---
  doc.setTextColor(0, 0, 0); 
  doc.setFontSize(100);
  doc.setFont("helvetica", "bold");
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.05 })); 
  doc.text("ZAQEEN", 130, 160, { align: "center", angle: 50 }); 
  doc.restoreGraphicsState();

  // --- ব্র্যান্ড হেডার ---
  doc.setFontSize(20).setFont("helvetica", "bold").setTextColor(pR, pG, pB);
  doc.text("ZAQEEN", 14, 22);
  
  doc.setFontSize(24).setFont("helvetica", "bold").setTextColor(pR, pG, pB);
  doc.text("INVOICE", 196, 22, { align: "right" });

  doc.setFontSize(8).setFont("helvetica", "normal").setTextColor(sR, sG, sB);
  doc.text(`Reference: #${String(order.orderId || order.id || 'N/A').slice(0, 10)}`, 196, 28, { align: "right" });

  doc.setDrawColor(240, 240, 240);
  doc.line(14, 45, 196, 45);

  // --- কাস্টমার ডিটেইলস ---
  doc.setFontSize(9).setTextColor(sR, sG, sB).text("BILLED TO", 14, 55);
  doc.setFontSize(11).setFont("helvetica", "bold").setTextColor(0, 0, 0);
  doc.text(String(order.deliveryInfo?.name || order.name || "Collector"), 14, 62);
  
  doc.setFontSize(8).setFont("helvetica", "normal").setTextColor(100, 100, 100);
  const address = order.deliveryInfo?.address || order.address || "No address logged";
  const phone = order.deliveryInfo?.phone || "";
  const fullAddress = `${address}${phone ? `\n${phone}` : ''}`;
  doc.text(fullAddress, 14, 68, { maxWidth: 85 });


  // রাইট সাইড: ডেট ও স্ট্যাটাস
  doc.setFontSize(9).setTextColor(sR, sG, sB).text("LOGGED ON", 130, 55);
  doc.setFontSize(10).setFont("helvetica", "bold").setTextColor(0, 0, 0);
  const orderDate = order.timestamp?.toDate ? order.timestamp.toDate().toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
  doc.text(orderDate, 130, 62);

  doc.setFontSize(9).setTextColor(sR, sG, sB).text("ACQUISITION STATUS", 130, 72);
  
  const statusColor = order.status === 'Delivered' ? [16, 185, 129] : [0, 0, 0];
  doc.setFontSize(10).setFont("helvetica", "bold").setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(String(order.status || "VERIFIED").toUpperCase(), 130, 79);

  // --- ডাটা গ্রিড ---
  const tableData = items.map(item => [
    {
      content: `${item.title || item.name || 'Article'}${item.selectedSize ? `\nSize: ${item.selectedSize}` : ''}`,
      styles: { halign: 'left', fontStyle: 'bold', fontSize: 9 }
    },
    (item.quantity || 1),
    `BDT ${Number(item.price || 0).toLocaleString()}`,
    `BDT ${(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 90,
    head: [['PRODUCT DESCRIPTION', 'QTY', 'UNIT VALUE', 'SUBTOTAL']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [0, 0, 0], textColor: [248, 248, 248], fontSize: 8, fontStyle: 'bold', halign: 'center' },
    bodyStyles: { fontSize: 9, cellPadding: 6, textColor: [50, 50, 50] },
    columnStyles: {
      0: { cellWidth: 90 }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' },
    },
    styles: { 
        font: "helvetica",
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
    }
  });

  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 150;

  // --- ক্যালকুলেশন ---
  doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(sR, sG, sB);
  doc.text("Total Value", 140, finalY + 15, { align: "right" });
  doc.setTextColor(0, 0, 0).text(`${subtotal.toLocaleString()}`, 196, finalY + 15, { align: "right" });

  doc.setTextColor(sR, sG, sB).text("Logistics Fee", 140, finalY + 22, { align: "right" });
  doc.setTextColor(0, 0, 0).text(`${deliveryFee.toLocaleString()}`, 196, finalY + 22, { align: "right" });

  doc.setFillColor(pR, pG, pB);
  doc.rect(130, finalY + 28, 70, 12, 'F');
  doc.setTextColor(255, 255, 255).setFontSize(10).setFont("helvetica", "bold");
  doc.text("TOTAL ACQUISITION", 135, finalY + 35.5);
  doc.text(`BDT ${totalPayable.toLocaleString()}`, 195, finalY + 35.5, { align: "right" });

  // --- ফুটার ---
  doc.setFontSize(8).setTextColor(sR, sG, sB).setFont("helvetica", "italic");
  doc.text("Confidence, Belief, and Certainty. Thank you for your purchase.", 105, finalY + 60, { align: "center" });

  doc.save(`Zaqeen_Invoice_${order.orderId || order.id.slice(0, 8)}.pdf`);
};