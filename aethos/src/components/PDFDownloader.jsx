import React from 'react';
import { FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import ReactDOM from 'react-dom/client';
import ReactMarkdown from 'react-markdown';

const PDFDownloader = ({ text, messageId }) => {
	const downloadPDF = async () => {
		try {
			// Initialize PDF
			const pdf = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4',
				putOnlyUsedFonts: true,
			});

			// Set margins and usable page dimensions
			const pageWidth = pdf.internal.pageSize.getWidth();
			const pageHeight = pdf.internal.pageSize.getHeight();
			const margin = 20; // 20mm margins
			const usableWidth = pageWidth - 2 * margin;

			// Add header
			pdf.setFontSize(18);
			pdf.setTextColor(40);
			pdf.text('Chat Conversation', pageWidth / 2, margin, { align: 'center' });

			// Add timestamp
			pdf.setFontSize(10);
			pdf.setTextColor(100);
			pdf.text(new Date().toLocaleString(), pageWidth / 2, margin + 7, {
				align: 'center',
			});

			// Create a temporary div for markdown rendering
			const tempDiv = document.createElement('div');
			tempDiv.className = 'pdf-markdown-content';
			document.body.appendChild(tempDiv);

			// Render markdown content
			const root = ReactDOM.createRoot(tempDiv);
			root.render(
				<div className='pdf-content'>
					<ReactMarkdown>{text}</ReactMarkdown>
				</div>
			);

			// Wait for rendering
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Convert markdown content to canvas
			const canvas = await html2canvas(tempDiv, {
				scale: 2,
				logging: false,
				useCORS: true,
				backgroundColor: '#ffffff',
			});

			// Clean up temporary div
			document.body.removeChild(tempDiv);

			// Calculate dimensions
			const imgData = canvas.toDataURL('image/jpeg', 1.0);
			const imgWidth = usableWidth;
			const imgHeight = (canvas.height * imgWidth) / canvas.width;

			let heightLeft = imgHeight;
			let position = margin + 20; // Start after header
			let page = 1;

			// Add first page content
			pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
			heightLeft -= pageHeight - position - margin;

			// Add additional pages if needed
			while (heightLeft > 0) {
				pdf.addPage();
				page++;
				position = margin;
				pdf.addImage(
					imgData,
					'JPEG',
					margin,
					position,
					imgWidth,
					imgHeight,
					'',
					'FAST',
					0,
					-(pageHeight - margin - 20) * (page - 1)
				);
				heightLeft -= pageHeight - margin * 2;

				// Add page number
				pdf.setFontSize(10);
				pdf.text(`Page ${page}`, pageWidth / 2, pageHeight - 10, {
					align: 'center',
				});
			}

			// Add page number to first page
			pdf.setPage(1);
			pdf.text(`Page 1 of ${page}`, pageWidth / 2, pageHeight - 10, {
				align: 'center',
			});

			// Save the PDF
			pdf.save(`chat-conversation-${messageId}.pdf`);
		} catch (error) {
			console.error('PDF generation failed:', error);
		}
	};

	return (
		<button onClick={downloadPDF} className='icon-btn' data-tooltip='Download as PDF' aria-label='Download as PDF'>
			<FileDown size={16} />
		</button>
	);
};

export default PDFDownloader; 