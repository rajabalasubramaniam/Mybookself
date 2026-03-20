"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "../../../../lib/supabase/client";

export default function PublisherInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('publisher_inventory')
      .select(`
        *,
        book:books(title, author, cover_url)
      `)
      .eq('publisher_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) setItems(data || []);
    setLoading(false);
  };

  const deleteItem = async (id) => {
    if (!confirm('Delete this inventory item?')) return;
    await supabase.from('publisher_inventory').delete().eq('id', id);
    loadInventory();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Inventory</h1>
        <Link
          href="/publisher/inventory/new"
          className="bg-blue-900 text-white px-4 py-2 rounded"
        >
          Add New Item
        </Link>
      </div>

      {items.length === 0 ? (
        <p>No inventory items yet.</p>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.id} className="border p-4 rounded flex justify-between items-center">
              <div className="flex gap-4">
                {item.book?.cover_url && (
                  <img src={item.book.cover_url} alt={item.book.title} className="w-16 h-20 object-cover rounded" />
                )}
                <div>
                  <h3 className="font-semibold">{item.book?.title || 'Unknown book'}</h3>
                  <p className="text-sm text-gray-600">by {item.book?.author || 'Unknown'}</p>
                  <p className="text-sm">Quantity: {item.quantity}</p>
                  <p className="text-sm">Price: ${item.price}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/publisher/inventory/${item.id}/edit`} className="text-blue-900">Edit</Link>
                <button onClick={() => deleteItem(item.id)} className="text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}