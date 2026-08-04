import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function downloadCandidateMarksPdf(results, { reportTitle, quizTitle, generatedAt } = {}) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const title = reportTitle || quizTitle ? `Candidate Marks — ${reportTitle || quizTitle}` : 'Candidate Marks Report';

  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(10);
  doc.text(`Generated: ${generatedAt || new Date().toLocaleString()}`, 14, 24);

  autoTable(doc, {
    startY: 30,
    head: [['Student ID', 'Name', 'Marks', 'Out of', 'Score %']],
    body: results.map((row) => [
      row.studentId,
      row.name,
      String(row.marks),
      String(row.totalMarks),
      `${row.percentage}%`,
    ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  const safeName = (reportTitle || quizTitle || 'all-competitions').replace(/[^\w\-]+/g, '-').slice(0, 40);
  doc.save(`candidate-marks-${safeName}.pdf`);
}
