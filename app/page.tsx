"use client";

import React, { CSSProperties, ReactNode, useEffect, useMemo, useState } from "react";

const GOOGLE_SHEETS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbzJ6fdhjYoS1n5ctE2pDwA58lcIHq_voLIBGczuxmYdeZgYHjbq5B66Xug_OY8jvAjq/exec";

const EVENT_HOTEL_NAME = "Hyatt Place Garland";
const EVENT_HOTEL_ADDRESS = "5101 N President George Bush Hwy, Garland, TX 75040";
const EVENT_HOTEL_FULL = `${EVENT_HOTEL_NAME}, ${EVENT_HOTEL_ADDRESS}`;

type RoomTypeOption = "" | "King Bed" | "Two Queen Beds";

type RSVPForm = {
  familyName: string;
  primaryContact: string;
  phone: string;
  email: string;
  adults: string;
  kidsUnder6: string;
  kids6AndOver: string;
  hotelNeeded: "yes" | "no";
  roomsNeeded: string;
  roomTypes: RoomTypeOption[];
  checkIn: string;
  checkOut: string;
  travelMode: "" | "Flight" | "Drive" | "Other";
  notes: string;
};

type RSVPSubmission = RSVPForm & {
  submittedAt: string;
};

type PublicTotals = {
  families: number;
  attendees: number;
  rooms: number;
};

const initialForm: RSVPForm = {
  familyName: "",
  primaryContact: "",
  phone: "",
  email: "",
  adults: "1",
  kidsUnder6: "0",
  kids6AndOver: "0",
  hotelNeeded: "yes",
  roomsNeeded: "1",
  roomTypes: [""],
  checkIn: "2026-07-19",
  checkOut: "2026-07-22",
  travelMode: "",
  notes: "",
};

const initialTotals: PublicTotals = {
  families: 0,
  attendees: 0,
  rooms: 0,
};

function calculateTotalPeople(
  items: Array<Pick<RSVPForm, "adults" | "kidsUnder6" | "kids6AndOver">>
): number {
  return items.reduce(
    (sum, item) =>
      sum +
      Number(item.adults || 0) +
      Number(item.kidsUnder6 || 0) +
      Number(item.kids6AndOver || 0),
    0
  );
}

function calculateTotalRooms(items: Array<Pick<RSVPForm, "hotelNeeded" | "roomsNeeded">>): number {
  return items.reduce((sum, item) => {
    if (item.hotelNeeded !== "yes") return sum;
    return sum + Number(item.roomsNeeded || 0);
  }, 0);
}

function normalizeRoomTypes(roomTypes: RoomTypeOption[], roomsNeeded: number): RoomTypeOption[] {
  const normalized = [...roomTypes];
  while (normalized.length < roomsNeeded) {
    normalized.push("");
  }
  return normalized.slice(0, roomsNeeded);
}

function formatDateForDisplay(value: string): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatStayDates(checkIn: string, checkOut: string): string {
  if (!checkIn || !checkOut) return "Dates not selected";
  return `${formatDateForDisplay(checkIn)} – ${formatDateForDisplay(checkOut)}`;
}

console.assert(
  calculateTotalPeople([{ adults: "2", kidsUnder6: "1", kids6AndOver: "2" }]) === 5,
  "Expected total people to equal 5"
);
console.assert(
  calculateTotalRooms([
    { hotelNeeded: "yes", roomsNeeded: "2" },
    { hotelNeeded: "no", roomsNeeded: "4" },
  ]) === 2,
  "Expected total rooms to equal 2"
);
console.assert(
  calculateTotalPeople([
    { adults: "2", kidsUnder6: "1", kids6AndOver: "0" },
    { adults: "3", kidsUnder6: "0", kids6AndOver: "1" },
  ]) === 7,
  "Expected totals across multiple families to equal 7"
);

export default function Page() {
  const [form, setForm] = useState<RSVPForm>(initialForm);
  const [submitted, setSubmitted] = useState<RSVPSubmission[]>([]);
  const [latestSavedEntry, setLatestSavedEntry] = useState<RSVPSubmission | null>(null);
  const [success, setSuccess] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [successEmailSent, setSuccessEmailSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publicTotals, setPublicTotals] = useState<PublicTotals>(initialTotals);
  const [isLoadingTotals, setIsLoadingTotals] = useState(true);

  useEffect(() => {
    document.title = "Kareli Gaam Convention RSVP";
  }, []);

  useEffect(() => {
    const loadTotals = async () => {
      try {
        const response = await fetch(GOOGLE_SHEETS_ENDPOINT, {
          method: "GET",
          cache: "no-store",
        });
        const data = await response.json();

        setPublicTotals({
          families: Number(data.families || 0),
          attendees: Number(data.attendees || 0),
          rooms: Number(data.rooms || 0),
        });

        if (data.latestEntry) {
          setLatestSavedEntry({
            familyName: data.latestEntry.familyName || "",
            primaryContact: data.latestEntry.primaryContact || "",
            phone: data.latestEntry.phone || "",
            email: data.latestEntry.email || "",
            adults: String(data.latestEntry.adults || "0"),
            kidsUnder6: String(data.latestEntry.kidsUnder6 || "0"),
            kids6AndOver: String(data.latestEntry.kids6AndOver || "0"),
            hotelNeeded: data.latestEntry.hotelNeeded === "yes" ? "yes" : "no",
            roomsNeeded: String(data.latestEntry.roomsNeeded || ""),
            roomTypes: Array.isArray(data.latestEntry.roomTypes) ? data.latestEntry.roomTypes : [],
            checkIn: data.latestEntry.checkIn || "",
            checkOut: data.latestEntry.checkOut || "",
            travelMode: data.latestEntry.travelMode || "",
            notes: data.latestEntry.notes || "",
            submittedAt: String(data.latestEntry.submittedAt || ""),
          });
        } else {
          setLatestSavedEntry(null);
        }
      } catch (error) {
        console.error("Error loading public totals:", error);
      } finally {
        setIsLoadingTotals(false);
      }
    };

    loadTotals();
  }, []);

  const localFamilies = submitted.length;
  const localPeople = useMemo(() => calculateTotalPeople(submitted), [submitted]);
  const localRooms = useMemo(() => calculateTotalRooms(submitted), [submitted]);

  const totalFamilies = publicTotals.families + localFamilies;
  const totalPeople = publicTotals.attendees + localPeople;
  const totalRooms = publicTotals.rooms + localRooms;

  const updateField = <K extends keyof RSVPForm>(key: K, value: RSVPForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateHotelNeeded = (value: RSVPForm["hotelNeeded"]) => {
    setForm((prev) => ({
      ...prev,
      hotelNeeded: value,
      roomTypes: value === "yes" ? normalizeRoomTypes(prev.roomTypes, Number(prev.roomsNeeded || 1)) : [],
    }));
  };

  const updateRoomsNeeded = (value: string) => {
    const roomCount = Number(value || 1);
    setForm((prev) => ({
      ...prev,
      roomsNeeded: value,
      roomTypes: prev.hotelNeeded === "yes" ? normalizeRoomTypes(prev.roomTypes, roomCount) : [],
    }));
  };

  const updateRoomType = (index: number, value: RoomTypeOption) => {
    setForm((prev) => {
      const nextRoomTypes = normalizeRoomTypes(prev.roomTypes, Number(prev.roomsNeeded || 1));
      nextRoomTypes[index] = value;
      return {
        ...prev,
        roomTypes: nextRoomTypes,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (form.hotelNeeded === "yes" && form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      alert("Please select a check-out date after the check-in date.");
      return;
    }

    const normalizedRoomTypes =
      form.hotelNeeded === "yes" ? normalizeRoomTypes(form.roomTypes, Number(form.roomsNeeded || 1)) : [];

    const submittedAt = new Date().toLocaleString();

    const payload: RSVPSubmission & { eventLocation: string } = {
      ...form,
      roomTypes: normalizedRoomTypes,
      eventLocation: EVENT_HOTEL_FULL,
      submittedAt,
    };

    const localEntry: RSVPSubmission = {
      ...form,
      roomTypes: normalizedRoomTypes,
      submittedAt,
    };

    setIsSubmitting(true);
    setSuccess(false);

    try {
      await fetch(GOOGLE_SHEETS_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      setSubmitted((prev) => [localEntry, ...prev]);
      setLatestSavedEntry(localEntry);
      setSuccessName(payload.primaryContact || payload.familyName || "Your family");
      setSuccessEmailSent(Boolean(String(payload.email || "").trim()));
      setForm(initialForm);
      setSuccess(true);
      window.setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error("Error sending to Google Sheets:", err);
      alert("There was an error submitting your RSVP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleRoomTypes =
    form.hotelNeeded === "yes" ? normalizeRoomTypes(form.roomTypes, Number(form.roomsNeeded || 1)) : [];

  const recentEntry = submitted.length > 0 ? submitted[0] : latestSavedEntry;

  return (
    <main style={styles.page}>
      <style>{`
        * { box-sizing: border-box; }
        html, body {
          width: 100%;
          overflow-x: hidden;
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .main-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          align-items: start;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        .field-span-full {
          grid-column: 1 / -1;
        }
        @media (min-width: 641px) {
          .stats-row {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
        @media (min-width: 901px) {
          .main-grid {
            grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
          }
          .form-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .hero-content {
            padding: 20px !important;
            min-height: 260px !important;
          }
          .hero-title {
            font-size: 2rem !important;
            line-height: 1.1 !important;
          }
          .hero-text {
            font-size: 1rem !important;
            line-height: 1.5 !important;
          }
          .section-card {
            padding: 18px !important;
            border-radius: 22px !important;
            width: 100% !important;
            min-width: 0 !important;
          }
          .footer-bar {
            flex-direction: column;
            align-items: stretch !important;
          }
          .footer-button {
            width: 100%;
          }
          .live-note {
            font-size: 13px !important;
          }
        }
      `}</style>
      <div style={styles.container}>
        <section style={styles.hero}>
          <img src="/kareli-photo.jpeg" alt="Kareli Gaam Group" style={styles.heroImage} />
          <div style={styles.heroOverlay} />
          <div style={styles.heroContent} className="hero-content">
            <div style={styles.badge}>Kareli Gaam Convention 2026</div>
            <h1 style={styles.heroTitle} className="hero-title">Dallas Sneh Milan RSVP</h1>
            <p style={styles.heroText} className="hero-text">
              A warm invitation for the entire Kareli family — sons, daughters, sisters, and their families — to come together and celebrate.
            </p>
          </div>
        </section>

        <section style={styles.statsRow} className="stats-row">
          <StatCard label="Families" value={isLoadingTotals ? "..." : String(totalFamilies)} />
          <StatCard label="Attendees" value={isLoadingTotals ? "..." : String(totalPeople)} />
          <StatCard label="Rooms Booked" value={isLoadingTotals ? "..." : String(totalRooms)} />
          <StatCard label="RSVP" value="Apr 30" />
        </section>

        <div style={styles.liveNote} className="live-note">
          Live registration totals update automatically as new families submit their RSVP.
        </div>

        <div style={styles.mainGrid} className="main-grid">
          <section style={styles.card} className="section-card">
            <h2 style={styles.sectionTitle}>Registration Form</h2>
            <p style={styles.sectionText}>
              Please submit one form per family. This helps us estimate attendance, convention count, and hotel room needs.
            </p>

            <form onSubmit={handleSubmit} style={styles.formGrid} className="form-grid">
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

              <Field label="Adults (18+)">
                <select style={styles.input} value={form.adults} onChange={(e) => updateField("adults", e.target.value)}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={String(n)}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Children (Under 6)">
                <select
                  style={styles.input}
                  value={form.kidsUnder6}
                  onChange={(e) => updateField("kidsUnder6", e.target.value)}
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={String(n)}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Youth (Ages 6–17)">
                <select
                  style={styles.input}
                  value={form.kids6AndOver}
                  onChange={(e) => updateField("kids6AndOver", e.target.value)}
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={String(n)}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>

              <div style={styles.noticeBox} className="field-span-full">
                Please select your expected stay dates below. If your plans may change, you can mention that in Notes.
              </div>

              <Field label="Need Hotel Room?">
                <select
                  style={styles.input}
                  value={form.hotelNeeded}
                  onChange={(e) => updateHotelNeeded(e.target.value as RSVPForm["hotelNeeded"])}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </Field>

              <Field label="Rooms Needed">
                <select
                  style={styles.input}
                  value={form.roomsNeeded}
                  onChange={(e) => updateRoomsNeeded(e.target.value)}
                  disabled={form.hotelNeeded !== "yes"}
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={String(n)}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>

              {form.hotelNeeded === "yes" &&
                visibleRoomTypes.map((roomType, index) => (
                  <Field key={`room-type-${index}`} label={`Room ${index + 1} Type`}>
                    <select
                      style={styles.input}
                      value={roomType}
                      onChange={(e) => updateRoomType(index, e.target.value as RoomTypeOption)}
                      required
                    >
                      <option value="">Select room type</option>
                      <option value="King Bed">King Bed</option>
                      <option value="Two Queen Beds">Two Queen Beds</option>
                    </select>
                  </Field>
                ))}

              <Field label="Check-In">
                <input
                  style={styles.input}
                  type="date"
                  value={form.checkIn}
                  onChange={(e) => updateField("checkIn", e.target.value)}
                  disabled={form.hotelNeeded !== "yes"}
                />
              </Field>

              <Field label="Check-Out">
                <input
                  style={styles.input}
                  type="date"
                  value={form.checkOut}
                  min={form.checkIn || undefined}
                  onChange={(e) => updateField("checkOut", e.target.value)}
                  disabled={form.hotelNeeded !== "yes"}
                />
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

              <div style={{ gridColumn: "1 / -1" }} className="field-span-full">
                <Field label="Notes">
                  <textarea
                    style={{ ...styles.input, minHeight: 110, resize: "vertical" as const }}
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder="Anything else you'd like us to know"
                  />
                </Field>
              </div>

              <div style={styles.footerBar} className="footer-bar">
                <div style={styles.footerText}>July 20–22, 2026 · {EVENT_HOTEL_NAME}</div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="footer-button w-full py-4 text-lg font-semibold rounded-xl bg-green-600 text-white shadow-md active:scale-[0.98] transition duration-150"
                >
                  {isSubmitting ? "Submitting..." : "Confirm My RSVP"}
                </button>
              </div>

              {success && (
                <div style={styles.successBox}>
                  Thank you {successName}, your RSVP is confirmed.
                  {successEmailSent ? " Check your email." : ""}
                </div>
              )}
            </form>
          </section>

          <aside style={styles.sidebar}>
            <section style={styles.card} className="section-card">
              <h3 style={styles.sidebarTitle}>Event Info</h3>
              <div style={styles.sidebarText}>{EVENT_HOTEL_FULL}</div>
              <div style={styles.sidebarText}>July 20–22, 2026</div>
              <div style={styles.sidebarText}>
                Convention Fee: $200 per person for adults and youth ages 6–17{" "}
                <span style={styles.inlineMuted}>(children under 6 attend free)</span>
              </div>
              <div style={styles.sidebarText}>
                Room Rate: $99 + tax per night <span style={styles.inlineMuted}>(One King or Two Queens)</span>
              </div>
            </section>

            <section style={styles.card} className="section-card">
              <h3 style={styles.sidebarTitle}>Recent</h3>
              {!recentEntry ? (
                <div style={styles.mutedText}>No registrations yet</div>
              ) : (
                <div
                  key={`${recentEntry.familyName}-${recentEntry.primaryContact}-${recentEntry.submittedAt}`}
                  style={styles.recentItem}
                >
                  {recentEntry.familyName} -{" "}
                  {Number(recentEntry.adults) + Number(recentEntry.kidsUnder6) + Number(recentEntry.kids6AndOver)} people
                  {recentEntry.hotelNeeded === "yes"
                    ? ` - ${recentEntry.roomsNeeded} rooms - ${formatStayDates(recentEntry.checkIn, recentEntry.checkOut)}`
                    : " - No hotel needed"}
                  {recentEntry.hotelNeeded === "yes" && recentEntry.roomTypes.length > 0
                    ? ` - ${recentEntry.roomTypes.join(", ")}`
                    : ""}
                </div>
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
    gap: 16,
    marginBottom: 16,
  },
  liveNote: {
    marginBottom: 24,
    fontSize: 14,
    color: "#475569",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
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
    gap: 24,
    width: "100%",
  },
  card: {
    background: "white",
    width: "100%",
    minWidth: 0,
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
    display: "block",
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
    lineHeight: 1.5,
  },
  inlineMuted: {
    color: "#64748b",
    fontSize: 14,
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
    lineHeight: 1.5,
  },
};