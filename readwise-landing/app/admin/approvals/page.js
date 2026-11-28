"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";
import { looksLikeJunkName } from "../../../lib/junkName";

export default function Approvals() {
  const supabase = createClient();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").eq("is_approved", false).in("role", ["writer", "publisher"]).order("created_at", { ascending: false });
    const list = (profiles || []).filter((p) => !p.is_banned && !p.is_admin);
    const ids = list.map((p) => p.id);
    const [{ data: ws }, { data: ps }] = await Promise.all([
      ids.length ? supabase.from("writer_profiles").select("*").in("id", ids) : { data: [] },
      ids.length ? supabase.from("publisher_profiles").select("*").in("id", ids) : { data: [] },
    ]);
    const wm = Object.fromEntries((ws || []).map((x) => [x.id, x]));
    const pm = Object.fromEntries((ps || []).map((x) => [x.id, x]));
    setRows(list.map((p) => ({ ...p, extra: p.role === "writer" ? wm[p.id] : pm[p.id] })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    setBusy(id);
    const { error } = await supabase.from("profiles").update({ is_approved: true }).eq("id", id);
    if (error) alert("Could not approve: " + error.message);
    setBusy(null); load();
  };
  const reject = async (id) => {
    if (!confirm("Reject and delete this account?")) return;
    setBusy(id);
    const res = await fetch("/api/admin/delete-user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: id }) });
    if (!res.ok) alert("Could not delete this account.");
    setBusy(null); load();
  };

  if (loading) return <div className="p-6">Loading...</div>;
  return (
    <div className="p-6 max-w-4xl">
      <Link href="/admin" className="text-blue-900 hover:underline">← Admin</Link>
      <h1 className="text-2xl font-bold text-blue-900 mt-3 mb-1">Writer and publisher approvals</h1>
      <p className="text-gray-600 mb-6">Readers are approved automatically. Review the others here.</p>
      {rows.length === 0 && <p className="bg-white rounded-xl shadow p-6 text-gray-500">Nothing waiting for review.</p>}
      <div className="space-y-3">
        {rows.map((r) => {
          const junk = looksLikeJunkName(r.full_name);
          const about = r.extra?.bio || r.extra?.description || "";
          const web = r.extra?.website || "";
          return (
            <div key={r.id} className="bg-white rounded-xl shadow p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{r.full_name} <span className="text-xs capitalize bg-peach-200 text-forest-800 px-2 py-0.5 rounded-full ml-1">{r.role}</span>{junk && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-1">Looks like junk</span>}</p>
                  <p className="text-sm text-gray-500">{r.email} · joined {new Date(r.created_at).toLocaleDateString()}</p>
                  {about ? <p className="text-sm text-gray-700 mt-2 line-clamp-3">{about}</p> : <p className="text-sm text-gray-400 mt-2">No profile details yet.</p>}
                  {web && <a href={web} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-900 underline">{web}</a>}
                </div>
                <div className="flex gap-2 items-start">
                  <button disabled={busy === r.id} onClick={() => approve(r.id)} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700">Approve</button>
                  <button disabled={busy === r.id} onClick={() => reject(r.id)} className="border border-red-300 text-red-700 px-3 py-1.5 rounded text-sm hover:bg-red-50">Reject</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
