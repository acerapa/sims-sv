import autoTable from 'jspdf-autotable';
import { addReportFooter, createReportDoc, formatCurrencyPdf } from '$lib/utils/pdf';

export interface InventoryProduct {
	purchase_description: string;
	sku: string;
	quantity: string | number;
	sale_price: string | number;
	category?: { name: string } | null;
}

export async function buildInventoryPdf(products: InventoryProduct[], total: number) {
	const { doc, margin, startY } = await createReportDoc({ title: 'Inventory List' });
	const totalQuantity = products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);

	autoTable(doc, {
		startY,
		margin: { left: margin, right: margin, top: 10, bottom: 48 },
		head: [['Item Description', 'SKU', 'Category', 'Quantity', 'Price']],
		body:
			products.length > 0
				? products.map((p) => [
						p.purchase_description,
						p.sku,
						p.category?.name ?? '',
						String(p.quantity ?? 0),
						formatCurrencyPdf(p.sale_price || 0)
					])
				: [[{ content: 'No products found.', colSpan: 5, styles: { halign: 'center' } }]],
		foot: products.length > 0 ? [[`Total (${total} items)`, '', '', String(totalQuantity), '']] : undefined,
		showHead: 'everyPage',
		showFoot: 'lastPage',
		theme: 'grid',
		styles: {
			font: 'helvetica',
			fontSize: 9,
			cellPadding: 4,
			lineColor: 0,
			lineWidth: 0.5,
			overflow: 'linebreak'
		},
		// Explicit dark textColor: the 'grid' theme defaults head/foot text to white, which is invisible on these light fills
		headStyles: { fillColor: [240, 240, 240], textColor: [17, 17, 17], fontStyle: 'bold', fontSize: 9 },
		footStyles: { fillColor: [245, 245, 245], textColor: [17, 17, 17], fontStyle: 'bold' },
		columnStyles: {
			1: { cellWidth: 70 },
			2: { cellWidth: 80 },
			3: { halign: 'right', cellWidth: 60 },
			4: { halign: 'right', cellWidth: 80 }
		}
	});

	addReportFooter(doc);
	return doc;
}
