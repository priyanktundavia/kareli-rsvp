"use client";

import React, { CSSProperties, ReactNode, useMemo, useState } from "react";

const GOOGLE_SHEETS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxs_tE3OQE0G2awxqRqJFH4DwqaeeN7IaczuloHb6aEJJmyEq0YAGxiXuR1uALZn8ULzA/exec";

type RSVPForm = {
  familyName: string;
  primaryContact: string;
  phone: string;
  email: string;
  adults: string;
  kids: string;
  hotelNeeded: "yes" | "no";
  roomsNeeded: string;
  nights: string;
  travelMode: "" | "Flight" | "Drive" | "Other";
  notes: string;
};

type RSVPSubmission = RSVPForm & {
  submittedAt: string;
};

const initialForm: RSVPForm = {
  familyName: "",
  primaryContact: "",
  phone: "",
  email: "",
  adults: "1",
  kids: "0",
  hotelNeeded: "yes",
  roomsNeeded: "1",
  nights: "2",
  travelMode: "",
  notes: "",
};

function calculateTotalPeople(items: Array<Pick<RSVPForm, "adults" | "kids">>): number {
  return items.reduce((sum, item) => sum + Number(item.adults || 0) + Number(item.kids || 0), 0);
}

function calculateTotalRooms(items: Array<Pick<RSVPForm, "hotelNeeded" | "roomsNeeded">>): number {
  return items.reduce((sum, item) => {
    if (item.hotelNeeded !== "yes") return sum;
    return sum + Number(item.roomsNeeded || 0);
  }, 0);
}

console.assert(calculateTotalPeople([{ adults: "2", kids: "3" }]) === 5, "Expected total people to equal 5");
console.assert(
  calculateTotalRooms([
    { hotelNeeded: "yes", roomsNeeded: "2" },
    { hotelNeeded: "no", roomsNeeded: "4" },
  ]) === 2,
  "Expected total rooms to equal 2"
);
console.assert(
  calculateTotalPeople([
    { adults: "2", kids: "1" },
    { adults: "3", kids: "0" },
  ]) === 6,
  "Expected totals across multiple families to equal 6"
);

export default function Page() {
  const [form, setForm] = useState<RSVPForm>(initialForm);
  const [submitted, setSubmitted] = useState<RSVPSubmission[]>([]);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalFamilies = submitted.length;
  const totalPeople = useMemo(() => calculateTotalPeople(submitted), [submitted]);
  const totalRooms = useMemo(() => calculateTotalRooms(submitted), [submitted]);

  const updateField = <K extends keyof RSVPForm>(key: K, value: RSVPForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload: RSVPSubmission = {
      ...form,
      submittedAt: new Date().toLocaleString(),
    };

    setIsSubmitting(true);

    try {
      await fetch(GOOGLE_SHEETS_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Error sending to Google Sheets:", err);
    } finally {
      setSubmitted((prev) => [payload, ...prev]);
      setForm(initialForm);
      setSuccess(true);
      setIsSubmitting(false);
      window.setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <section style={styles.hero}>
          <img src="/kareli-photo.jpeg" alt="Kareli Gaam Group" style={styles.heroImage} />
          <div style={styles.heroOverlay} />
          <div style={styles.heroContent}>
            <div style={styles.badge}>Kareli Gaam Convention 2026</div>
            <h1 style={styles.heroTitle}>Dallas Sneh Milan RSVP</h1>
            <p style={styles.heroText}>
              A warm invitation for the entire Kareli family — sons, daughters, sisters, and their families — to come together and celebrate.
            </p>
          </div>
        </section>

        <section style={styles.statsRow}>
          <StatCard label="Families" value={String(totalFamilies)} />
          <StatCard label="Attendees" value={String(totalPeople)} />
          <StatCard label="Rooms Booked" value={String(totalRooms)} />
          <StatCard label="RSVP" value="Apr 30" />
        </section>

        <div style={styles.mainGrid}>
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Registration Form</h2>
            <p style={styles.sectionText}>
              Please submit one form per family. This helps us estimate attendance and hotel room needs.
            </p>

            <form onSubmit={handleSubmit} style={styles.formGrid}>
              <Field label="Head Name">
                <input
                  style={styles.input}
                  value={form.familyName}
                  onChange={(e) => updateField("familyName", e.target.value)}
                  placeholder="Navin Patel"
                  required
                />
              </Field>

              <Field label="Primary Contact Name">
                <input
                  style={styles.input}
                  value={form.primaryContact}
                  onChange={(e) => updateField("primaryContact", e.target.value)}
                  placeholder="Priyank Patel"
                  required
                />
              </Field>

              <Field label="Phone Number">
                <input
                  style={styles.input}
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="(555) 555-5555"
                  required
                />
              </Field>

              <Field label="Email Address">
                <input
                  style={styles.input}
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="name@email.com"
                />
              </Field>

              <Field label="Adults">
                <select style={styles.input} value={form.adults} onChange={(e) => updateField("adults", e.target.value)}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={String(n)}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Kids">
                <select style={styles.input} value={form.kids} onChange={(e) => updateField("kids", e.target.value)}>
                  {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={String(n)}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>

              <div style={styles.noticeBox}>All families are assumed to attend July 20–22. If different, mention it in Notes.</div>

              <Field label="Need Hotel Room?">
                <select
                  style={styles.input}
                  value={form.hotelNeeded}
                  onChange={(e) => updateField("hotelNeeded", e.target.value as RSVPForm["hotelNeeded"])}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </Field>

              <Field label="Rooms Needed">
                <select style={styles.input} value={form.roomsNeeded} onChange={(e) => updateField("roomsNeeded", e.target.value)}>
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={String(n)}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Number of Nights">
                <select style={styles.input} value={form.nights} onChange={(e) => updateField("nights", e.target.value)}>
                  <option value="1">1 Night</option>
                  <option value="2">2 Nights</option>
                  <option value="3">3 Nights</option>
                </select>
              </Field>

              <Field label="Travel Mode">
                <select
                  style={styles.input}
                  value={form.travelMode}
                  onChange={(e) => updateField("travelMode", e.target.value as RSVPForm["travelMode"])}
                >
                  <option value="">Select</option>
                  <option value="Flight">Flight</option>
                  <option value="Drive">Drive</option>
                  <option value="Other">Other</option>
                </select>
              </Field>

              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Notes">
                  <textarea
                    style={{ ...styles.input, minHeight: 110, resize: "vertical" as const }}
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder="Anything else you'd like us to know"
                  />
                </Field>
              </div>

              <div style={styles.footerBar}>
                <div style={styles.footerText}>July 20–22, 2026 · Hyatt Place Garland</div>
                <button type="submit" disabled={isSubmitting} style={styles.button}>
                  {isSubmitting ? "Submitting..." : "Submit RSVP"}
                </button>
              </div>

              {success && <div style={styles.successBox}>RSVP submitted successfully.</div>}
            </form>
          </section>

          <aside style={styles.sidebar}>
            <section style={styles.card}>
              <h3 style={styles.sidebarTitle}>Event Info</h3>
              <div style={styles.sidebarText}>Hyatt Place Garland, TX</div>
              <div style={styles.sidebarText}>July 20–22, 2026</div>
              <div style={styles.sidebarText}>$200 per person</div>
              <div style={styles.sidebarText}>$99/night rooms</div>
            </section>

            <section style={styles.card}>
              <h3 style={styles.sidebarTitle}>Recent</h3>
              {submitted.length === 0 ? (
                <div style={styles.mutedText}>No registrations yet</div>
              ) : (
                submitted.map((entry, i) => (
                  <div key={`${entry.familyName}-${i}`} style={styles.recentItem}>
                    {entry.familyName} - {Number(entry.adults) + Number(entry.kids)} people - {entry.roomsNeeded} rooms × {entry.nights} nights
                  </div>
                ))
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #fff7ed, #ffffff, #fff1f2)",
    color: "#1e293b",
    fontFamily: "Arial, sans-serif",
    padding: "24px 16px",
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
  },
  hero: {
    position: "relative",
    borderRadius: 28,
    overflow: "hidden",
    minHeight: 380,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    marginBottom: 24,
  },
  heroImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.2)",
  },
  heroContent: {
    position: "relative",
    zIndex: 1,
    padding: 32,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    minHeight: 380,
    color: "white",
  },
  badge: {
    display: "inline-block",
    background: "rgba(255,255,255,0.25)",
    color: "white",
    padding: "10px 16px",
    borderRadius: 999,
    fontWeight: 700,
    marginBottom: 16,
    backdropFilter: "blur(4px)",
  },
  heroTitle: {
    fontSize: "clamp(2.3rem, 6vw, 4.5rem)",
    lineHeight: 1.05,
    margin: 0,
    fontWeight: 800,
  },
  heroText: {
    maxWidth: 860,
    fontSize: "clamp(1rem, 2vw, 1.25rem)",
    lineHeight: 1.55,
    marginTop: 16,
    marginBottom: 0,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    background: "white",
    borderRadius: 22,
    padding: 20,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
  },
  statValue: {
    fontSize: 28,
    fontWeight: 800,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
    gap: 24,
  },
  card: {
    background: "white",
    borderRadius: 28,
    padding: 24,
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
  },
  sectionTitle: {
    fontSize: 30,
    marginTop: 0,
    marginBottom: 8,
  },
  sectionText: {
    color: "#64748b",
    marginTop: 0,
    marginBottom: 24,
    lineHeight: 1.5,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 20,
  },
  fieldWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    fontWeight: 600,
    fontSize: 14,
  },
  input: {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 16,
    boxSizing: "border-box",
    background: "white",
  },
  noticeBox: {
    gridColumn: "1 / -1",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 16,
    fontSize: 14,
    color: "#334155",
  },
  footerBar: {
    gridColumn: "1 / -1",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    background: "#f8fafc",
    borderRadius: 18,
    padding: 16,
    flexWrap: "wrap",
  },
  footerText: {
    fontSize: 14,
    color: "#334155",
  },
  button: {
    background: "#111827",
    color: "white",
    border: "none",
    borderRadius: 14,
    padding: "12px 18px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  successBox: {
    gridColumn: "1 / -1",
    background: "#f0fdf4",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: 18,
    padding: 16,
    fontWeight: 600,
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  sidebarTitle: {
    fontSize: 22,
    marginTop: 0,
    marginBottom: 16,
  },
  sidebarText: {
    fontSize: 15,
    color: "#334155",
    marginBottom: 10,
  },
  mutedText: {
    fontSize: 14,
    color: "#64748b",
  },
  recentItem: {
    fontSize: 14,
    color: "#334155",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 10,
    marginBottom: 10,
  },
};
