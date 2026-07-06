"use client";

// PRD v5 Section 8, "ideal customer profile editor": lets the operator see
// every configured ICP profile and switch which one is active. Full
// elicitation-driven editing (renaming triggers, firmographics, etc.) is
// deferred past Sprint 5 -- this ships the read + switch surface first.
import { useEffect, useState } from "react";
import type { IcpConfig } from "@/lib/icp";

export default function IcpEditorPage() {
  const [config, setConfig] = useState<IcpConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/icp")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setConfig(data);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Unknown error"));
  }, []);

  async function switchProfile(profileId: string) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/icp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeProfileId: profileId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to switch profile");
      }
      setConfig(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <main>
        <h1>ICP Profiles</h1>
        <p role="alert">{error}</p>
      </main>
    );
  }

  if (!config) {
    return (
      <main>
        <h1>ICP Profiles</h1>
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main>
      <h1>ICP Profiles</h1>
      <fieldset disabled={saving}>
        <legend>Active profile</legend>
        {config.profiles.map((profile) => (
          <label key={profile.id} style={{ display: "block" }}>
            <input
              type="radio"
              name="activeProfile"
              value={profile.id}
              checked={config.activeProfileId === profile.id}
              onChange={() => switchProfile(profile.id)}
            />
            {profile.name} — {profile.offer}
          </label>
        ))}
      </fieldset>
    </main>
  );
}
