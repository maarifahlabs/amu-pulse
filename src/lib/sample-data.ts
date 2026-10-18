import { electionSchedule } from "@/lib/election-schedule";
import type { Dataset } from "@/lib/types";

// Illustrative placeholders for demo mode only. These are fictional people and
// do not represent any real candidate's positions.
const now = "2026-10-17T00:00:00+05:30";

export const sampleDataset: Dataset = {
  isSample: true,
  positions: [
    { id: "p1", slug: "president", title: "President", description: "Leads the Students' Union.", sort_order: 1 },
    { id: "p2", slug: "vice-president", title: "Vice-President", description: "Supports the President.", sort_order: 2 },
  ],
  candidates: [
    {
      id: "c1", slug: "sample-candidate-a", profile_id: "x", position_id: "p1", ballot_number: 1, name: "Sample Candidate A",
      department: "Department of Example Studies", faculty: "Faculty of Arts",
      bio: "Fictional profile used to demonstrate how AMU Pulse displays candidates.",
      photo_url: null, verification_status: "verified", official_source_url: null,
    },
    {
      id: "c2", slug: "sample-candidate-b", profile_id: null, position_id: "p1", ballot_number: 2, name: "Sample Candidate B",
      department: "Department of Placeholder Engineering", faculty: "Faculty of Engineering",
      bio: null, photo_url: null, verification_status: "verified", official_source_url: null,
    },
    {
      id: "c3", slug: "sample-candidate-c", profile_id: "y", position_id: "p2", ballot_number: 1, name: "Sample Candidate C",
      department: "Department of Demo Sciences", faculty: "Faculty of Science",
      bio: "Another fictional profile for demonstration.",
      photo_url: null, verification_status: "verified", official_source_url: null,
    },
  ],
  manifestos: [
    {
      id: "m1", candidate_id: "c1", published_at: now, source_url: null,
      content: "Sample manifesto text.\n\nThis placeholder shows how a published manifesto appears. Real manifestos are submitted by verified candidates and approved by moderators.",
    },
  ],
  issues: [
    {
      id: "i1", slug: "library-hours", title: "Should library hours be extended during examinations?",
      description: "Many students report difficulty finding quiet study space late in the evening during exam weeks.",
      context: "Consider staffing, security, electricity costs and reading-room capacity.",
      category: "Library", published_at: now,
    },
    {
      id: "i2", slug: "campus-wifi", title: "How will campus Wi-Fi coverage and speed be improved?",
      description: "Connectivity in halls, libraries and departments affects coursework and online exams.",
      context: "Consider coverage gaps, bandwidth, login issues and support channels.",
      category: "Infrastructure", published_at: now,
    },
    {
      id: "i3", slug: "hostel-water-supply", title: "How should hostel drinking water and supply be improved?",
      description: "Students in several halls report intermittent water supply and concerns about drinking-water quality.",
      context: "Includes purifier maintenance, testing frequency and complaint response times.",
      category: "Hostels", published_at: now,
    },
  ],
  answers: [
    {
      id: "a1", candidate_id: "c1", issue_id: "i1", source_url: null, updated_at: now,
      answer: "Illustrative response: proposes extended library hours during exams, subject to staffing and approval.",
    },
    {
      id: "a2", candidate_id: "c3", issue_id: "i2", source_url: null, updated_at: now,
      answer: "Illustrative response: proposes a coverage survey of halls and a public complaint tracker.",
    },
  ],
  events: electionSchedule,
};
