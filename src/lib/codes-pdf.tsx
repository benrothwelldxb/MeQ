// Server-rendered PDF for student login-code slips. Replaces the previous
// browser-print flow which relied on the user's print dialogue and was
// inconsistent across devices.
//
// Layout: A4 portrait with a 3-column grid (or 4-column for code-only).
// Each class group renders as its own <Page> so admins can separate the
// printout cleanly and hand the right pages to each teacher. Within a class,
// slips overflow onto continuation pages automatically.
//
// Why server-side rather than client html2canvas: real vector PDFs, smaller
// downloads, consistent output regardless of printer/browser, QR images stay
// crisp at any zoom because we embed the raster at 2× the displayed size.

import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

export type CodesPdfView = "both" | "qr" | "code";

export interface CodesPdfStudent {
  id: string;
  firstName: string;
  lastName: string;
  yearGroup: string;
  className: string | null;
  loginCode: string;
  /** Pre-rendered data: URL of the QR image. Pass undefined for code-only view. */
  qrDataUrl?: string | null;
}

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1e293b",
  },
  header: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  headerMeta: {
    fontSize: 9,
    color: "#94a3b8",
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 6,
    color: "#1e293b",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slip: {
    width: "31%",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    padding: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  slipCompact: {
    width: "23%",
  },
  slipKicker: {
    fontSize: 7,
    color: "#94a3b8",
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  slipName: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
  },
  qr: {
    width: 90,
    height: 90,
    marginBottom: 6,
  },
  qrLarge: {
    width: 110,
    height: 110,
  },
  codeBox: {
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: "100%",
  },
  codeText: {
    fontFamily: "Courier-Bold",
    fontSize: 14,
    letterSpacing: 2,
    textAlign: "center",
    color: "#0f172a",
  },
  classFooter: {
    fontSize: 7,
    color: "#94a3b8",
    marginTop: 4,
  },
  pageFooter: {
    position: "absolute",
    bottom: 14,
    left: 28,
    right: 28,
    textAlign: "center",
    fontSize: 8,
    color: "#cbd5e1",
  },
});

export function CodesPdfDocument({
  students,
  view,
  schoolName,
  filterLabel,
}: {
  students: CodesPdfStudent[];
  view: CodesPdfView;
  schoolName: string;
  filterLabel: string;
}) {
  // Group by class so each class gets its own heading — a teacher can tear
  // off just their class's pages.
  const grouped = new Map<string, CodesPdfStudent[]>();
  for (const s of students) {
    const key = `${s.yearGroup}${s.className ? ` / ${s.className}` : ""}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  }

  const isCompact = view === "code";
  const slipStyle = isCompact ? [styles.slip, styles.slipCompact] : styles.slip;
  const qrStyle = view === "qr" ? [styles.qr, styles.qrLarge] : styles.qr;

  const groupEntries = Array.from(grouped.entries());

  return (
    <Document title={`MeQ login codes — ${schoolName}`}>
      {groupEntries.map(([groupName, groupStudents]) => (
        <Page key={groupName} size="A4" style={styles.page}>
          {/* Per-class header — repeats on continuation pages if the class
              spills over. School name + class name + count up top so a
              teacher can identify their pack at a glance. */}
          <View style={styles.header} fixed>
            <Text style={styles.headerTitle}>{groupName}</Text>
            <Text style={styles.headerMeta}>
              {schoolName} · {groupStudents.length} student{groupStudents.length === 1 ? "" : "s"}
            </Text>
          </View>

          <View style={styles.grid}>
            {groupStudents.map((student: CodesPdfStudent) => (
              <View key={student.id} style={slipStyle} wrap={false}>
                <Text style={styles.slipKicker}>MeQ Login</Text>
                <Text style={styles.slipName}>
                  {student.firstName} {student.lastName}
                </Text>
                {view !== "code" && student.qrDataUrl && (
                  <Image src={student.qrDataUrl} style={qrStyle} />
                )}
                {view !== "qr" && (
                  <View style={styles.codeBox}>
                    <Text style={styles.codeText}>{student.loginCode}</Text>
                  </View>
                )}
                <Text style={styles.classFooter}>
                  {student.yearGroup}{student.className ? ` / ${student.className}` : ""}
                </Text>
              </View>
            ))}
          </View>

          {/* Page footer with the original filter scope so admins reviewing a
              loose page can trace which export it came from. */}
          <Text
            style={styles.pageFooter}
            render={({ pageNumber, totalPages }) =>
              `${filterLabel} · Page ${pageNumber} of ${totalPages}`
            }
            fixed
          />
        </Page>
      ))}
    </Document>
  );
}
