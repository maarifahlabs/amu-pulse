import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useDataset } from "@/hooks/useDataset";
import { api } from "@/lib/api";

export function CreateProfilePage() {
  const { user } = useAuth();
  const { dataset: ds, loading } = useDataset();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [positionId, setPositionId] = useState("");
  const [department, setDepartment] = useState("");
  const [faculty, setFaculty] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !ds) {
    return (
      <div className="container-page py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
        <p className="mt-4 text-sm text-slate-600 font-medium">Loading candidate form…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-page max-w-xl py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold font-display">Create Candidate Profile</h1>
        <p className="text-slate-600">Please sign in to list yourself as a candidate.</p>
        <Link to="/login?next=/create" className="btn-primary">Sign in with Google</Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);

    try {
      // The API creates the profile as unverified and sets the account's display name and role.
      await api.post("/me/candidate", {
        name,
        position_id: positionId,
        department: department || null,
        faculty: faculty || null,
        bio,
      });
      navigate("/candidate/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Profile creation failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page max-w-xl space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold font-display">Create your profile</h1>
        <p className="text-sm text-slate-600">
          Add yourself as a candidate. Once submitted, your profile will be created as <strong>unverified</strong> and sent to administrators for official verification against the university ballot list. If your name is already on the list, open that candidate and choose <em>Claim this profile</em> instead.
        </p>
      </header>

      {error && (
        <div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm font-medium text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label htmlFor="name" className="label">Full name</label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            maxLength={120}
            className="input"
            placeholder="Mohammad..."
          />
        </div>
        <div>
          <label htmlFor="positionId" className="label">Post Contesting</label>
          <select
            id="positionId"
            required
            value={positionId}
            onChange={(e) => setPositionId(e.target.value)}
            className="input"
          >
            <option value="" disabled>Choose a post</option>
            {ds.positions.map((position) => (
              <option key={position.id} value={position.id}>{position.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="department" className="label">Department (optional)</label>
          <input
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            maxLength={120}
            className="input"
            placeholder="Department of Computer Science"
          />
        </div>
        <div>
          <label htmlFor="faculty" className="label">Faculty (optional)</label>
          <input
            id="faculty"
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            maxLength={120}
            className="input"
            placeholder="Faculty of Science"
          />
        </div>
        <div>
          <label htmlFor="bio" className="label">Candidate Bio</label>
          <textarea
            id="bio"
            required
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            minLength={20}
            maxLength={2000}
            rows={5}
            className="input"
            placeholder="Tell voters about your qualifications, vision, and prior work."
          />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
          {submitting ? "Creating profile…" : "Publish Candidate Profile"}
        </button>
      </form>
    </div>
  );
}
