import { useState } from "react";

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mailto = `mailto:contact@maarifahlabs.com?subject=AMU Pulse Query from ${encodeURIComponent(name)}&body=${encodeURIComponent(`From: ${name} (${email})\n\n${message}`)}`;
    window.location.href = mailto;
    setSent(true);
  }

  return (
    <div className="container-page max-w-xl space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl font-display">Contact us</h1>
        <p className="text-slate-600">
          Questions about AMU Pulse go to Maarifah Labs at{" "}
          <a href="mailto:contact@maarifahlabs.com" className="font-semibold text-brand-700 underline">
            contact@maarifahlabs.com
          </a>.
        </p>
      </header>

      {sent ? (
        <div className="card bg-brand-50 border-brand-200 text-brand-900 font-medium p-6 text-center space-y-2">
          <p className="text-lg font-bold font-display">Opening your email app…</p>
          <p className="text-sm">You can also write directly to contact@maarifahlabs.com anytime.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label htmlFor="name" className="label">Name</label>
            <input
              id="name"
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="message" className="label">Message</label>
            <textarea
              id="message"
              required
              minLength={10}
              maxLength={2000}
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input"
              placeholder="How can we help?"
            />
          </div>
          <button type="submit" className="btn-primary">
            Send Message
          </button>
        </form>
      )}
    </div>
  );
}
